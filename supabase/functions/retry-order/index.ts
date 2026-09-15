import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Chapter {
  title: string;
  intro?: string;
  content: string;
}

async function callClaude(systemPrompt: string, userPrompt: string, model: string, apiKey: string, maxTokens: number): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text ?? "";
}

const BATCH_SIZE = 3;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { orderId, resume } = body;

    if (!orderId) {
      throw new Error("Order ID is required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");

    if (!anthropicApiKey) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, customer_id, status, generation_params, generated_content")
      .eq("id", orderId)
      .maybeSingle();

    if (orderError || !order) {
      throw new Error(`Order not found: ${orderError?.message || "not found"}`);
    }

    const gp = order.generation_params;
    const targetAudience = gp?.targetAudience || "general";
    const subject = gp?.subject || "General Topic";
    const wordCount = gp?.wordCount || 5000;
    const toneOfVoice = gp?.toneOfVoice || "professional";
    const language = gp?.language || "nl";
    const contentType = gp?.contentType || "ebook";
    const contentGoal = gp?.contentGoal || "problem-aware";
    const productUrl = gp?.productUrl || "";
    const websiteUrl = gp?.websiteUrl || "";
    const isBlog = contentType === "blog";

    const existingContent = order.generated_content;
    let chapters: Chapter[] = Array.isArray(existingContent?.chapters) ? existingContent.chapters : [];
    let outline: string[] = Array.isArray(existingContent?.outline) ? existingContent.outline : [];

    // Set status to processing on first call
    if (!resume) {
      await supabase.from("orders").update({ status: "processing" }).eq("id", orderId);
    }

    const asyncResponse = new Response(
      JSON.stringify({ success: true, message: "Order retry started" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

    (async () => {
      try {
        const languageInstructionMap: Record<string, string> = {
          nl: "in het Nederlands", fr: "en français", en: "in English",
          de: "auf Deutsch", es: "en español",
        };
        const languageInstruction = languageInstructionMap[language] || "in English";
        const contentTypeName = isBlog ? "blog post" : "ebook";

        const goalContextMap: Record<string, string> = {
          "problem-aware": "The reader is problem-aware: clearly define the problem, its symptoms, risks and missed opportunities. Use vivid scenarios and relatable examples to make the pain tangible.",
          "solution-aware": "The reader is solution-aware: compare solution types, methods and strategies in an educational way, without hard selling. Use decision frameworks and evaluation criteria.",
          "product-aware": `The reader is product-aware: explain how a solution like the product/service can help, highlight concrete benefits, ROI arguments and decision criteria.${productUrl ? ` Naturally weave in references to the product at ${productUrl}. Include 2-3 explicit links to ${productUrl} per section where relevant, using descriptive anchor text. Place links contextually within sentences.` : ""}`,
        };
        const inboundGoal = goalContextMap[contentGoal] || goalContextMap["problem-aware"];

        const baseSystemPrompt = `You are a specialized inbound ${contentTypeName} writer and B2B storytelling expert. You create compelling, well-researched ${contentTypeName}s ${languageInstruction} for business audiences.

Context:
- Target audience: ${targetAudience}
- Topic: "${subject}"
- Inbound stage: ${contentGoal}
- Tone: ${toneOfVoice}

WRITING STYLE GUIDELINES:
- Write with energy and personality. Avoid dry, academic prose.
- Use storytelling: open sections with real-world scenarios, mini-case-studies or relatable anecdotes that hook the reader.
- Use rhetorical questions to provoke thought and create engagement.
- Use analogies and metaphors to make complex concepts tangible and memorable.
- Vary sentence length: mix short punchy sentences with longer flowing ones for rhythm.
- Use transition phrases that guide the reader naturally (e.g. "Maar hier is het probleem...", "Stel je voor dat...", "Wat betekent dit in de praktijk?").
- Include callout-style insights: key takeaways framed as "Onthoud dit:" or "De kern van de zaak is...".
- Address the reader directly with "je" or "u" where appropriate.

DATA & EVIDENCE GUIDELINES:
- Include supporting data points to substantiate claims. Use industry benchmarks, research findings and trend statistics widely known in the marketing/content industry.
- Format data as: "Onderzoek van [bron] toont aan dat..." or "Volgens branchebenchmarks...".
- Use specific numbers where well-established (e.g. "80% van B2B-kopers doet eerst onderzoek").
- Include 2-4 data points or research references per section where relevant.

PRODUCT INTEGRATION:
- ${productUrl ? `Naturally reference the product/service at ${productUrl} as a solution. Weave in 2-3 links per section using descriptive anchor text. Show HOW the product solves the specific problem, not just THAT it exists.` : "If a product URL is provided, reference it naturally as a solution."}
- Use benefit-driven language: focus on what the reader gains.

FORMATTING:
- No markdown formatting (#, *, -) in the content.
- Use line breaks between paragraphs.
- Self-contained sections.`;

        const outlineModel = "claude-haiku-4-5-20251001";
        const contentModel = "claude-sonnet-4-5-20250929";

        // Generate outline if not yet present
        if (outline.length === 0) {
          const targetSections = Math.max(5, Math.floor(wordCount / 600));
          const outlinePrompt = `Create a compelling outline for a ${contentTypeName} about "${subject}" for ${targetAudience}.

STRICT CONSTRAINTS:
- Inbound goal: ${inboundGoal}
- REQUIRED number of sections: EXACTLY ${targetSections}
- Target total word count: ${wordCount}

OUTLINE QUALITY RULES:
- Make section titles engaging and benefit-driven, not dry/academic.
- Use action words and curiosity triggers where appropriate.
- Examples of GOOD titles: "Waarom 80% van je content onzichtbaar blijft", "De verborgen kosten van een fragmentarische aanpak", "Van data naar actie: zo doe je het"
- Examples of BAD titles: "Inleiding", "Hoofdstuk 1", "Conclusie"
- The first section should hook the reader with a compelling question or surprising statement.
- The last section should be a clear conclusion with a call-to-action.
- Include sections that naturally allow for data/statistics and product references.

Respond ONLY with a JSON array of EXACTLY ${targetSections} section titles.`;

          const outlineSystemPrompt = `${baseSystemPrompt}

You are now ONLY generating the outline structure of the ${contentTypeName}.

STRICT RULES:
- Respond ONLY with a valid JSON array of section titles (strings).
- Do NOT add any explanation, comments, or other text.
- The first section MUST be an introduction.
- The last section MUST be a conclusion or call-to-action.
- Include 4-8 core sections between introduction and conclusion.`;

          try {
            const outlineRaw = await callClaude(outlineSystemPrompt, outlinePrompt, outlineModel, anthropicApiKey, 800);
            const cleaned = outlineRaw.replace(/```json/gi, "").replace(/```/g, "").trim();
            const parsed = JSON.parse(cleaned);
            if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("invalid");
            outline = parsed;
          } catch {
            outline = ["Introductie"];
            for (let i = 1; i < targetSections - 1; i++) outline.push(`Hoofddeel ${i}`);
            outline.push("Conclusie & call-to-action");
          }

          // Save outline
          await supabase.from("orders").update({
            generated_content: { title: subject, chapters: [], outline, progress: `0/${outline.length}` },
          }).eq("id", orderId);
        }

        const wordsPerSection = Math.max(300, Math.floor(wordCount / Math.max(outline.length, 1)));
        const startIndex = chapters.length;

        // Generate chapters in this batch
        const endIndex = Math.min(startIndex + BATCH_SIZE, outline.length);

        for (let i = startIndex; i < endIndex; i++) {
          const sectionTitle = outline[i];
          const previousTitles = i > 0 ? outline.slice(0, i).join(", ") : "none";

          const internalLinkInstruction = websiteUrl
            ? `\nINTERNAL LINKING RULES:\n- Naturally include 1-3 internal links to (${websiteUrl}).\n- Format: [anchor text](${websiteUrl}/page)`
            : "";

          const chapterPrompt = `Write a detailed, engaging section for the ${contentTypeName} about "${subject}" ${languageInstruction}.

Section title: "${sectionTitle}"
Section index: ${i + 1} of ${outline.length}
Previous sections: ${previousTitles}

Context:
- Target audience: ${targetAudience}
- Inbound goal: ${inboundGoal}
- Tone of voice: ${toneOfVoice}
${websiteUrl ? `- Client website: ${websiteUrl}` : ""}
${productUrl ? `- Product URL to promote: ${productUrl}` : ""}

WRITING STYLE REQUIREMENTS:
- Length: approximately ${wordsPerSection} words.
- Open with a hook: a real-world scenario, a surprising fact, a rhetorical question, or a relatable anecdote.
- Use storytelling techniques throughout: paint pictures with words, show don't just tell.
- Vary paragraph length: short paragraphs (1-2 sentences) for emphasis, longer ones (4-6 sentences) for depth.
- Include 2-4 supporting data points or industry statistics per section. Use well-known, verifiable marketing/business research. Format as "Onderzoek van [bron] toont aan dat..." or "Volgens [rapport/studie]...".
- Use analogies and metaphors to make abstract concepts concrete.
- Include at least one "key insight" or "onthoud dit" callout per section.
- Address the reader directly ("je/u") for a conversational, engaging tone.
- Use transition phrases that build anticipation ("Maar hier wordt het interessant...", "En dat is nog niet alles...", "Wat dit in de praktijk betekent...").

PRODUCT INTEGRATION:
${productUrl ? `- Naturally weave in 2-3 references to the product at ${productUrl} as a solution to the specific challenges discussed in this section.
- Use descriptive anchor text for links: [ontdek hoe ons platform dit oplost](${productUrl}) instead of [klik hier].
- Show HOW the product addresses the section's specific pain point, not just THAT it exists.
- Frame product references as part of the narrative, not as interruptions.` : `- If a product URL were provided, reference it naturally as a solution.`}

STRUCTURAL RULES:
- Start with 1-2 sentences connecting from previous sections.
- Make the section self-contained.
- Do NOT include the section title in your response.
- Do NOT use markdown formatting.
- Write in clear paragraphs.${internalLinkInstruction}`;

          const chapterText = await callClaude(baseSystemPrompt, chapterPrompt, contentModel, anthropicApiKey, Math.min(8000, wordsPerSection * 4));

          let chapterIntro: string | undefined = undefined;
          if (!isBlog) {
            try {
              const introPrompt = `Write a compelling, attention-grabbing 2-3 sentence introduction for chapter "${sectionTitle}" ${languageInstruction}. Topic: "${subject}". Audience: ${targetAudience}. Start with a hook: a surprising statistic, a bold statement, or a relatable question. Preview what this chapter covers and why it matters. Do NOT use markdown. Write in ${toneOfVoice} tone with energy and personality.`;
              chapterIntro = (await callClaude(baseSystemPrompt, introPrompt, outlineModel, anthropicApiKey, 200)).trim() || undefined;
            } catch (e) {
              console.error("Failed to generate chapter intro:", e);
            }
          }

          chapters.push({ title: sectionTitle, intro: chapterIntro, content: chapterText.trim() });

          await supabase.from("orders").update({
            generated_content: { title: subject, chapters, outline, progress: `${i + 1}/${outline.length}` },
          }).eq("id", orderId);
        }

        // Check if more chapters needed
        if (chapters.length < outline.length) {
          // Self-invoke for next batch
          await fetch(`${supabaseUrl}/functions/v1/retry-order`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${supabaseServiceKey}` },
            body: JSON.stringify({ orderId, resume: true }),
          });
          return;
        }

        // All chapters done - finalize
        const fullContent = chapters.map((ch) => `${ch.title}\n\n${ch.content}`).join("\n\n");
        const totalWordCount = fullContent.split(/\s+/).filter((w) => w.trim().length > 0).length;

        await supabase.from("orders").update({
          generated_content: { title: subject, wordCount: totalWordCount, chapters },
          status: "completed",
          completed_at: new Date().toISOString(),
        }).eq("id", orderId);

        console.info(`Ebook generation completed for order: ${orderId}`);

        // Fetch customer for email
        const { data: customer } = await supabase
          .from("customers")
          .select("email, full_name, first_name")
          .eq("id", order.customer_id)
          .maybeSingle();

        // Generate PDF
        let pdfUrl = null;
        try {
          const pdfResponse = await fetch(`${supabaseUrl}/functions/v1/generate-pdf`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${supabaseServiceKey}` },
            body: JSON.stringify({ orderId, title: subject, subject, chapters }),
          });
          if (pdfResponse.ok) {
            const pdfData = await pdfResponse.json();
            pdfUrl = pdfData.pdfUrl;
          }
        } catch (pdfError) {
          console.error("Error generating PDF:", pdfError);
        }

        // Send notification email
        try {
          await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${supabaseServiceKey}` },
            body: JSON.stringify({
              email: customer?.email,
              firstName: customer?.first_name || customer?.full_name || "",
              subject,
              orderId,
              pdfUrl,
            }),
          });
        } catch (emailError) {
          console.error("Error sending notification email:", emailError);
        }
      } catch (error) {
        console.error("Error during retry ebook generation:", error);
        await supabase.from("orders").update({ status: "failed" }).eq("id", orderId);
      }
    })();

    return asyncResponse;
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
