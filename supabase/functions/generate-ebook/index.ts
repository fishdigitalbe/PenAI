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

async function callClaude(systemPrompt: string, userPrompt: string, model: string, apiKey: string, maxTokens: number, temperature: number): Promise<string> {
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
      temperature: temperature,
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
        "The reader is problem-aware: clearly define the problem, its symptoms, risks and missed opportunities. Help them recognize themselves in these challenges.",
      "solution-aware":
        "The reader is solution-aware: they know there are different ways to solve the problem. Compare solution types, methods and strategies in an educational way, without hard selling.",
      "product-aware":
        `The reader is product-aware: they are evaluating specific products or services. Explain how a solution like the product/service can help, highlight benefits and decision criteria, and stay value-driven. ${
          productUrl
            ? `You may naturally reference the product at ${productUrl} as a strong option (without being pushy).`
            : ""
        }`,
    };

    const inboundGoal = goalContextMap[contentGoal];

    const ebookSystemPrompt = `
You are a specialized inbound ebook writer. You create clear, structured, inspiring ebooks ${languageInstruction} for business audiences.

Context:
- Target audience: ${targetAudience}
- Topic: "${subject}"
- Inbound stage: ${contentGoal}
- Tone: ${toneOfVoice}

Guidelines:
- No aggressive sales.
- Strong educational, value-first approach.
- Self-contained sections that can be understood independently.
- Avoid invented statistics; only use generic, clearly illustrative examples.
- No markdown formatting (#, *, -) in the content.
`.trim();

    const blogSystemPrompt = `
You are a senior SEO strategist and inbound blog specialist. You write long-form content ${languageInstruction} that performs strongly in BOTH:
- classic search engines (Google),
- AI/LLM-based search (ChatGPT, Gemini, Claude).

Context:
- Target audience: ${targetAudience}
- Topic: "${subject}"
- Inbound stage: ${contentGoal}
- Tone: ${toneOfVoice}
- GEO region: ${region}

LLM rules:
- Every section must be self-contained and understandable on its own (chunk-friendly).
- Explicitly mention "${subject}" and "${targetAudience}" where natural.
- Avoid vague references like "this topic" or "as mentioned before".
- No markdown formatting.

SEO rules:
- Cover the main topic and important subtopics in depth (semantic SEO).
- Strong, clear structure with logical progression.
- No invented statistics or specific numeric claims.
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
Create a clear outline for a ${contentTypeName} about "${subject}" for ${targetAudience}.

STRICT CONSTRAINTS:
- Inbound goal: ${inboundGoal}
- REQUIRED number of sections: EXACTLY ${targetSections} (this is mandatory)
- Target total word count: ${wordCount}
- You MUST generate ${targetSections} section titles, no more, no less

Respond ONLY with a JSON array of EXACTLY ${targetSections} section titles, e.g.:
["Introductie", "Hoofddeel 1: ...", "Hoofddeel 2: ...", "Hoofddeel 3: ...", "Conclusie & call-to-action"]
`.trim();

    const outlineModel = "claude-haiku-4-5-20251001";
    const contentModel = "claude-sonnet-5-20250630";

    const outlineRaw = await callClaude(
      outlineSystemPrompt,
      outlinePrompt,
      outlineModel,
      anthropicApiKey,
      800,
      0.2
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
Write a detailed section for the ${contentTypeName} about "${subject}" ${languageInstruction}.

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
- Start with 1–2 sentences that connect logically from the previous sections (if any).
- Make the section self-contained and understandable on its own (LLM-friendly).
- Explicitly mention the main topic "${subject}" and the audience "${targetAudience}" where natural.
- Avoid repeating full explanations from previous sections; reference them briefly instead.
- Do NOT include the section title in your response (content only).
- Do NOT use markdown formatting (no "#", "*", "-", or numbered lists) EXCEPT for internal links.
- Do NOT invent specific statistics or numeric claims. Use only clearly generic examples if needed.
- Write in clear paragraphs, separated by line breaks.
${internalLinkInstruction}
`.trim();

      const chapterText = await callClaude(
        baseSystemPrompt,
        chapterPrompt,
        contentModel,
        anthropicApiKey,
        Math.min(8000, wordsPerSection * 4),
        0.7
      );

      let chapterIntro: string | undefined = undefined;
      if (!isBlog) {
        const introPrompt = `
Write a compelling 2-3 sentence introduction for this chapter "${sectionTitle}" ${languageInstruction}.

Context:
- Topic: "${subject}"
- Target audience: ${targetAudience}
- This intro will be displayed prominently at the start of the chapter, before the main content

Requirements:
- 2-3 sentences maximum
- Hook the reader and preview what this chapter covers
- Connect to the overall topic without repeating the title
- Do NOT use markdown formatting
- Write in ${toneOfVoice} tone
`.trim();

        try {
          chapterIntro = (await callClaude(
            baseSystemPrompt,
            introPrompt,
            outlineModel,
            anthropicApiKey,
            200,
            0.7
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
          800,
          0.3
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
