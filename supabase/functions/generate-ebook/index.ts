import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface GenerationParams {
  targetAudience: string;
  subject: string;
  wordCount: number;
  toneOfVoice: string;
  language: string;
  contentType: "ebook" | "blog";
  contentGoal: "problem-aware" | "solution-aware" | "product-aware";
  productUrl?: string;
  websiteUrl?: string;
  geoRegion?: string;
  orderId?: string;
}

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
      model: model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text ?? "";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const params: GenerationParams = await req.json();
    const {
      targetAudience,
      subject,
      wordCount,
      toneOfVoice,
      language,
      contentType,
      contentGoal,
      productUrl,
      websiteUrl,
      geoRegion,
    } = params;

    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicApiKey) throw new Error("ANTHROPIC_API_KEY not configured");

    const languageInstructionMap = {
      nl: "in het Nederlands",
      fr: "en français",
      en: "in English",
      de: "auf Deutsch",
      es: "en español",
    } as const;

    const languageInstruction =
      languageInstructionMap[language as keyof typeof languageInstructionMap] ||
      "in English";

    const region = geoRegion || "de regio";
    const isBlog = contentType === "blog";
    const contentTypeName = isBlog ? "blog post" : "ebook";

    const goalContextMap: Record<GenerationParams["contentGoal"], string> = {
      "problem-aware":
        "The reader is problem-aware: clearly define the problem, its symptoms, risks and missed opportunities. Help them recognize themselves in these challenges. Use vivid scenarios and relatable examples to make the pain tangible.",
      "solution-aware":
        "The reader is solution-aware: they know there are different ways to solve the problem. Compare solution types, methods and strategies in an educational way, without hard selling. Use decision frameworks and evaluation criteria to help them choose.",
      "product-aware":
        `The reader is product-aware: they are evaluating specific products or services. Explain how a solution like the product/service can help, highlight concrete benefits, ROI arguments and decision criteria. ${
          productUrl
            ? `Naturally weave in references to the product at ${productUrl} as a strong option. Include 2-3 explicit links to ${productUrl} per section where relevant, using descriptive anchor text (not just "click here"). Place links contextually within sentences, not as standalone CTAs.`
            : ""
        }`,
    };

    const inboundGoal = goalContextMap[contentGoal];

    const ebookSystemPrompt = `
You are a specialized inbound ebook writer and B2B storytelling expert. You create compelling, well-researched ebooks ${languageInstruction} for business audiences.

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
- Use transition phrases that guide the reader naturally from one idea to the next (e.g. "Maar hier is het probleem...", "Stel je voor dat...", "Wat betekent dit in de praktijk?").
- Include callout-style insights: key takeaways framed as "Onthoud dit:" or "De kern van de zaak is...".
- Address the reader directly with "je" or "u" where appropriate to create a conversational tone.

DATA & EVIDENCE GUIDELINES:
- Include supporting data points to substantiate claims. Use industry benchmarks, research findings and trend statistics that are widely known and verifiable in the marketing/content industry.
- Format data as: "Onderzoek van [bron] toont aan dat..." or "Volgens branchebenchmarks...".
- Use specific numbers where they are well-established (e.g. "80% van B2B-kopers doet eerst onderzoek", "personalisatie kan conversie tot met 20% verhogen").
- If a statistic is not universally known, frame it as a general industry observation rather than a precise fact.
- Include 2-4 data points or research references per section where relevant.

PRODUCT INTEGRATION:
- ${productUrl ? `Naturally reference the product/service at ${productUrl} as a solution. Weave in 2-3 links per section using descriptive anchor text. Show HOW the product solves the specific problem discussed in that section, not just THAT it exists.` : "If a product URL is provided, reference it naturally as a solution."}
- Use benefit-driven language: focus on what the reader gains, not just features.

FORMATTING:
- No markdown formatting (#, *, -) in the content.
- Use line breaks between paragraphs.
- Self-contained sections that can be understood independently.
`.trim();

    const blogSystemPrompt = `
You are a senior SEO strategist and inbound blog specialist. You write compelling, well-researched long-form content ${languageInstruction} that performs strongly in BOTH:
- classic search engines (Google),
- AI/LLM-based search (ChatGPT, Gemini, Claude).

Context:
- Target audience: ${targetAudience}
- Topic: "${subject}"
- Inbound stage: ${contentGoal}
- Tone: ${toneOfVoice}
- GEO region: ${region}

WRITING STYLE:
- Write with energy and personality. Avoid dry, academic prose.
- Use storytelling: open with real-world scenarios or relatable examples.
- Use rhetorical questions and analogies to make concepts tangible.
- Vary sentence length for rhythm and readability.
- Address the reader directly to create a conversational tone.

DATA & EVIDENCE:
- Include 2-4 supporting data points per section using well-known industry research and benchmarks.
- Format as: "Onderzoek toont aan dat..." or "Volgens branchebenchmarks...".
- Use specific numbers where well-established in the industry.

PRODUCT INTEGRATION:
- ${productUrl ? `Naturally reference the product at ${productUrl} with 2-3 links per section using descriptive anchor text.` : "Reference the product naturally where relevant."}

LLM rules:
- Every section must be self-contained and understandable on its own (chunk-friendly).
- Explicitly mention "${subject}" and "${targetAudience}" where natural.
- Avoid vague references like "this topic" or "as mentioned before".
- No markdown formatting.

SEO rules:
- Cover the main topic and important subtopics in depth (semantic SEO).
- Strong, clear structure with logical progression.
`.trim();

    const baseSystemPrompt = isBlog ? blogSystemPrompt : ebookSystemPrompt;

    const outlineSystemPrompt = `
${baseSystemPrompt}

You are now ONLY generating the outline structure of the ${contentTypeName}.

STRICT RULES:
- Respond ONLY with a valid JSON array of section titles (strings).
- Do NOT add any explanation, comments, or other text.
- The first section MUST be an introduction (e.g. "Introductie" or "Inleiding").
- The last section MUST be a conclusion or call-to-action (e.g. "Conclusie" or "Conclusie & call-to-action").
- Include 4–8 core sections between introduction and conclusion.
- For a blog, you MAY include an "FAQ" section near the end if it makes sense for the topic.
`.trim();

    const targetSections = Math.max(5, Math.floor(wordCount / 600));

    const outlinePrompt = `
Create a compelling outline for a ${contentTypeName} about "${subject}" for ${targetAudience}.

STRICT CONSTRAINTS:
- Inbound goal: ${inboundGoal}
- REQUIRED number of sections: EXACTLY ${targetSections} (this is mandatory)
- Target total word count: ${wordCount}
- You MUST generate ${targetSections} section titles, no more, no less

OUTLINE QUALITY RULES:
- Make section titles engaging and benefit-driven, not dry/academic.
- Use action words and curiosity triggers where appropriate.
- Examples of GOOD titles: "Waarom 80% van je content onzichtbaar blijft", "De verborgen kosten van een fragmentarische aanpak", "Van data naar actie: zo doe je het"
- Examples of BAD titles: "Inleiding", "Hoofdstuk 1", "Conclusie"
- The first section should hook the reader with a compelling question or surprising statement.
- The last section should be a clear conclusion with a call-to-action.
- Include sections that naturally allow for data/statistics and product references.

Respond ONLY with a JSON array of EXACTLY ${targetSections} section titles.
`.trim();

    const outlineModel = "claude-haiku-4-5-20251001";
    const contentModel = "claude-sonnet-4-5-20250929";

    const outlineRaw = await callClaude(
      outlineSystemPrompt,
      outlinePrompt,
      outlineModel,
      anthropicApiKey,
      800
    );

    let outlineRawClean = outlineRaw
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    let outline: string[];
    try {
      const parsed = JSON.parse(outlineRawClean);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error("Outline is not a non-empty array");
      }

      if (parsed.length < targetSections - 1) {
        console.warn(`AI generated ${parsed.length} sections but we need ${targetSections}. Using fallback.`);
        throw new Error(`Not enough sections: ${parsed.length} < ${targetSections}`);
      }

      outline = parsed;
    } catch (e) {
      console.error("Failed to parse outline or invalid section count, falling back to default:", e);
      const fallbackOutline = ["Introductie"];
      for (let i = 1; i < targetSections - 1; i++) {
        fallbackOutline.push(`Hoofddeel ${i}`);
      }
      fallbackOutline.push("Conclusie & call-to-action");
      outline = fallbackOutline;
    }

    const chapters: Chapter[] = [];
    const wordsPerSection = Math.max(
      300,
      Math.floor(wordCount / Math.max(outline.length, 1))
    );

    for (let i = 0; i < outline.length; i++) {
      const sectionTitle = outline[i];

      const previousTitles =
        i > 0 ? outline.slice(0, i).join(", ") : "none (this is the first section)";

      const internalLinkInstruction = websiteUrl
        ? `
INTERNAL LINKING RULES:
- Naturally include 1-3 internal links to the client's website (${websiteUrl}) within this section.
- Use relevant anchor text that describes what the reader will find on the linked page.
- Link to logical pages like: homepage, service pages, product pages, about page, contact page, or relevant blog posts.
- Format internal links as: [anchor text](${websiteUrl}/relevant-page)
- Only add links where they genuinely add value for the reader.
- Examples:
  * "More information about our services can be found on [our services page](${websiteUrl}/services)."
  * "Visit [our homepage](${websiteUrl}) to learn more about our approach."
  * "For questions, feel free to [contact us](${websiteUrl}/contact)."
`
        : "";

      const chapterPrompt = `
Write a detailed, engaging section for the ${contentTypeName} about "${subject}" ${languageInstruction}.

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
- Open with a hook: a real-world scenario, a surprising fact, a rhetorical question, or a relatable anecdote that draws the reader in.
- Use storytelling techniques throughout: paint pictures with words, show don't just tell.
- Vary paragraph length: use short paragraphs (1-2 sentences) for emphasis and longer ones (4-6 sentences) for depth.
- Include 2-4 supporting data points or industry statistics per section. Use well-known, verifiable marketing/business research. Format as "Onderzoek van [bron] toont aan dat..." or "Volgens [rapport/studie]...".
- Use analogies and metaphors to make abstract concepts concrete.
- Include at least one "key insight" or "onthoud dit" callout per section to crystallize the main takeaway.
- Address the reader directly ("je/u") to create a conversational, engaging tone.
- Use transition phrases that build anticipation ("Maar hier wordt het interessant...", "En dat is nog niet alles...", "Wat dit in de praktijk betekent...").

PRODUCT INTEGRATION:
${productUrl ? `- Naturally weave in 2-3 references to the product at ${productUrl} as a solution to the specific challenges discussed in this section.
- Use descriptive anchor text for links: [ontdek hoe ons platform dit oplost](${productUrl}) instead of [klik hier].
- Show HOW the product addresses the section's specific pain point, not just THAT it exists.
- Frame product references as part of the narrative, not as interruptions.` : `- If a product URL were provided, reference it naturally as a solution.`}

STRUCTURAL RULES:
- Start with 1-2 sentences that connect logically from the previous sections (if any).
- Make the section self-contained and understandable on its own (LLM-friendly).
- Explicitly mention the main topic "${subject}" and the audience "${targetAudience}" where natural.
- Avoid repeating full explanations from previous sections; reference them briefly instead.
- Do NOT include the section title in your response (content only).
- Do NOT use markdown formatting (no "#", "*", "-", or numbered lists) EXCEPT for links.
- Write in clear paragraphs, separated by line breaks.
${internalLinkInstruction}
`.trim();

      const chapterText = await callClaude(
        baseSystemPrompt,
        chapterPrompt,
        contentModel,
        anthropicApiKey,
        Math.min(8000, wordsPerSection * 4)
      );

      let chapterIntro: string | undefined = undefined;
      if (!isBlog) {
        const introPrompt = `
Write a compelling, attention-grabbing 2-3 sentence introduction for chapter "${sectionTitle}" ${languageInstruction}.

Context:
- Topic: "${subject}"
- Target audience: ${targetAudience}
- This intro will be displayed prominently at the start of the chapter, before the main content

Requirements:
- 2-3 sentences maximum
- Start with a hook: a surprising statistic, a bold statement, or a relatable question that makes the reader want to continue
- Preview what this chapter covers and why it matters to the reader
- Connect to the overall topic without repeating the title
- Do NOT use markdown formatting
- Write in ${toneOfVoice} tone with energy and personality
`.trim();

        try {
          chapterIntro = (await callClaude(
            baseSystemPrompt,
            introPrompt,
            outlineModel,
            anthropicApiKey,
            200
          )).trim() || undefined;
        } catch (e) {
          console.error("Failed to generate chapter intro:", e);
        }
      }

      chapters.push({
        title: sectionTitle,
        intro: chapterIntro,
        content: chapterText.trim(),
      });
    }

    const fullContent = chapters
      .map((ch) => `${ch.title}\n\n${ch.content}`)
      .join("\n\n");

    const totalWordCount = fullContent
      .split(/\s+/)
      .filter((w) => w.trim().length > 0).length;

    let seoMetadata: any = undefined;
    let structuredData: any = null;

    if (isBlog) {
      const seoSystemPrompt = `
You are an SEO specialist. You generate clean, valid JSON SEO metadata ${languageInstruction} for long-form blog content.

Rules:
- Follow sentence case for titles.
- No invented statistics.
- Respond ONLY with JSON, no markdown, no extra text.
`.trim();

      const seoPrompt = `
Generate SEO metadata for a blog post about "${subject}" for ${targetAudience}.

Context:
- Tone: ${toneOfVoice}
- Region: ${region}
- Inbound goal: ${contentGoal}
- Website URL (optional): ${websiteUrl || "https://example.com/blog"}

Return ONLY a JSON object in this exact structure:

{
  "metaTitle": "string, 50-60 characters, includes main keyword, sentence case",
  "metaDescription": "string, 150-160 characters, includes main keyword and clear benefit, sentence case",
  "h1": "string, main heading for the blog post, sentence case",
  "keywords": ["array", "of", "5-8", "relevant", "keywords"],
  "ogTitle": "string, engaging social media title, sentence case",
  "ogDescription": "string, compelling social media description",
  "internalLinks": [
    "Suggested anchor text for internal link 1",
    "Suggested anchor text for internal link 2",
    "Suggested anchor text for internal link 3"
  ],
  "geoKeywords": ["${region}", "other", "location-specific", "keywords"]
}
`.trim();

      try {
        const seoRaw = await callClaude(
          seoSystemPrompt,
          seoPrompt,
          outlineModel,
          anthropicApiKey,
          800
        );

        let seoClean = seoRaw
          .replace(/```json/gi, "")
          .replace(/```/g, "")
          .trim();

        seoMetadata = JSON.parse(seoClean);
      } catch (e) {
        console.error("Failed to parse SEO metadata:", e);
        seoMetadata = {
          metaTitle: `${subject} - Complete guide for ${targetAudience}`,
          metaDescription: `Comprehensive guide about ${subject} for ${targetAudience}. Learn everything you need to know.`,
          h1: subject,
          keywords: [subject, targetAudience],
          ogTitle: subject,
          ogDescription: `Complete guide about ${subject}`,
        };
      }

      structuredData = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: seoMetadata?.h1 || subject,
        description: seoMetadata?.metaDescription || `Blog post about ${subject}`,
        author: {
          "@type": "Organization",
          name: websiteUrl ? new URL(websiteUrl).hostname : "Unknown",
        },
        datePublished: new Date().toISOString(),
        dateModified: new Date().toISOString(),
        wordCount: totalWordCount,
        keywords: seoMetadata?.keywords?.join(", ") || subject,
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        chapters: chapters,
        wordCount: totalWordCount,
        seoMetadata: seoMetadata,
        structuredData: structuredData,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error generating ebook:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to generate ebook" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
