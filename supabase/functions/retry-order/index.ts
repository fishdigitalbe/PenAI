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
          "problem-aware": "The reader is problem-aware: clearly define the problem, its symptoms, risks and missed opportunities.",
          "solution-aware": "The reader is solution-aware: compare solution types, methods and strategies in an educational way, without hard selling.",
          "product-aware": `The reader is product-aware: explain how a solution like the product/service can help, highlight benefits and decision criteria.${productUrl ? ` You may reference the product at ${productUrl}.` : ""}`,
        };
        const inboundGoal = goalContextMap[contentGoal] || goalContextMap["problem-aware"];

        const baseSystemPrompt = `You are a specialized inbound ${contentTypeName} writer. You create clear, structured, inspiring ${contentTypeName}s ${languageInstruction} for business audiences.

Context:
- Target audience: ${targetAudience}
- Topic: "${subject}"
- Inbound stage: ${contentGoal}
- Tone: ${toneOfVoice}

Guidelines:
- No aggressive sales. Strong educational, value-first approach.
- Self-contained sections. Avoid invented statistics.
- No markdown formatting (#, *, -) in the content.`;

        const outlineModel = "claude-haiku-4-5-20251001";
        const contentModel = "claude-sonnet-4-5-20250929";

        // Generate outline if not yet present
        if (outline.length === 0) {
          const targetSections = Math.max(5, Math.floor(wordCount / 600));
          const outlinePrompt = `Create a clear outline for a ${contentTypeName} about "${subject}" for ${targetAudience}.

STRICT CONSTRAINTS:
- Inbound goal: ${inboundGoal}
- REQUIRED number of sections: EXACTLY ${targetSections}
- Target total word count: ${wordCount}

Respond ONLY with a JSON array of EXACTLY ${targetSections} section titles. First section must be an introduction. Last section must be a conclusion or call-to-action.`;

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

          const chapterPrompt = `Write a detailed section for the ${contentTypeName} about "${subject}" ${languageInstruction}.

Section title: "${sectionTitle}"
Section index: ${i + 1} of ${outline.length}
Previous sections: ${previousTitles}

Context:
- Target audience: ${targetAudience}
- Inbound goal: ${inboundGoal}
- Tone of voice: ${toneOfVoice}
${websiteUrl ? `- Client website: ${websiteUrl}` : ""}

STRICT CONTENT RULES:
- Length: approximately ${wordsPerSection} words.
- Start with 1-2 sentences connecting from previous sections.
- Make the section self-contained.
- Do NOT include the section title in your response.
- Do NOT use markdown formatting.
- Write in clear paragraphs.${internalLinkInstruction}`;

          const chapterText = await callClaude(baseSystemPrompt, chapterPrompt, contentModel, anthropicApiKey, Math.min(8000, wordsPerSection * 4));

          let chapterIntro: string | undefined = undefined;
          if (!isBlog) {
            try {
              const introPrompt = `Write a compelling 2-3 sentence introduction for chapter "${sectionTitle}" ${languageInstruction}. Topic: "${subject}". Audience: ${targetAudience}. Do NOT use markdown. Write in ${toneOfVoice} tone.`;
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
