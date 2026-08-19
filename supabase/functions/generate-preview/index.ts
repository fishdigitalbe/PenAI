import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PreviewRequest {
  generationParams: {
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
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { generationParams }: PreviewRequest = await req.json();
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
    } = generationParams;

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) throw new Error("OpenAI API key not configured");

    // -------------------------------------------------------------
    // LANGUAGE CONFIG
    // -------------------------------------------------------------
    const languageInstructions = {
      nl: { prompt: "in het Nederlands", defaultTitle: "Een Uitgebreide Gids" },
      fr: { prompt: "en français", defaultTitle: "Un Guide Complet" },
      en: { prompt: "in English", defaultTitle: "A Comprehensive Guide" },
      de: { prompt: "auf Deutsch", defaultTitle: "Ein Umfassender Leitfaden" },
      es: { prompt: "en español", defaultTitle: "Una Guía Completa" },
    };

    const languageConfig =
      languageInstructions[language as keyof typeof languageInstructions] ||
      languageInstructions.nl;

    const region = geoRegion || "de regio";

    // -------------------------------------------------------------
    // INBOUND GOAL INSTRUCTIONS
    // -------------------------------------------------------------
    const goalInstructions = {
      "problem-aware":
        "The reader is problem-aware: clearly define the problem, its symptoms, risks and missed opportunities.",
      "solution-aware":
        "The reader is solution-aware: compare solution types, methods and strategies in an educational way.",
      "product-aware":
        `The reader is product-aware: explain how a solution helps, highlight benefits and decision criteria. ${
          productUrl ? `You may naturally reference ${productUrl}.` : ""
        }`,
    };

    const inboundGoal = goalInstructions[contentGoal];

    // -------------------------------------------------------------
    // SYSTEM PROMPT — EBOOK PREVIEW
    // -------------------------------------------------------------
    const ebookSystemPrompt = `
You are an expert inbound ebook writer. You create structured, inspiring, professional ebooks ${languageConfig.prompt}.

Context:
- Audience: ${targetAudience}
- Topic: "${subject}"
- Inbound stage: ${contentGoal}
- Tone: ${toneOfVoice}

Guidelines:
- No aggressive sales.
- Clear, structured, educational.
- Self-contained sections.
- No invented statistics.
- No markdown formatting.
`.trim();

    // -------------------------------------------------------------
    // SYSTEM PROMPT — BLOG (SEO + LLM optimized)
    // -------------------------------------------------------------
    const blogSystemPrompt = `
You are a senior SEO strategist and inbound blog specialist. You write blog content ${languageConfig.prompt} that performs strongly in BOTH:
- Google Search,
- AI/LLM-based search (ChatGPT, Gemini, Claude).

Context:
- Audience: ${targetAudience}
- Topic: "${subject}"
- Inbound stage: ${contentGoal}
- Tone: ${toneOfVoice}
- GEO region: ${region}

LLM rules:
- Each section must be self-contained.
- Restate key entities like "${subject}" and "${targetAudience}".
- Avoid vague references.
- No markdown.

SEO rules:
- Strong SEO title & meta.
- Semantic keywords naturally integrated.
- No invented % or specific data.
`.trim();

    const systemPrompt = contentType === "blog" ? blogSystemPrompt : ebookSystemPrompt;

    // -------------------------------------------------------------
    // PRODUCT CTA (IF PRODUCT-AWARE)
    // -------------------------------------------------------------
    const productAwareAddition =
      contentGoal === "product-aware" && productUrl
        ? `\nIMPORTANT: include a natural, non-pushy reference to ${productUrl} as a recommended next step.`
        : "";

    // -------------------------------------------------------------
    // USER PREVIEW PROMPTS (STRICT FORMATTING)
    // -------------------------------------------------------------
    const previewPrompt =
      contentType === "blog"
        ? `
Write an SEO- and LLM-optimized preview for a long-read blog post about "${subject}" ${languageConfig.prompt}.

Context:
- Audience: ${targetAudience}
- Tone: ${toneOfVoice}
- Inbound goal: ${inboundGoal}
- Region: ${region}
${productAwareAddition}

FORMAT RULES (VERY IMPORTANT):
- Respond ONLY with the following 3 labeled sections, EXACTLY in this order:
  H1:
  Meta description:
  Introduction:
- No quotes.
- No markdown (#, *, -).
- No lists.
- No extra commentary before or after.

H1:
- One single line.
- Sentence case (first word + proper nouns only).
- Includes the main topic and if useful the region.
- No quotes.

Meta description:
- One single line (150–160 characters).
- Includes main keyword + clear benefit.
- Sentence case.
- No quotes.

Introduction:
- 3–6 short paragraphs.
- Clear hook.
- Restate "${subject}" and "${targetAudience}" explicitly.
- Optionally mention ${region} naturally.
- Make it self-contained (LLM-friendly).
- No invented statistics.
- No markdown formatting.
`.trim()
        : `
Write a preview for an inbound ebook about "${subject}" ${languageConfig.prompt}.

Context:
- Audience: ${targetAudience}
- Tone: ${toneOfVoice}
- Inbound goal: ${inboundGoal}
${productAwareAddition}

FORMAT RULES (STRICT):
- Respond ONLY with the following labeled sections:
  Title:
  Introduction:
  First chapter:
- EXACTLY these labels.
- No quotes.
- No markdown (#, *, -).
- No lists.
- No commentary outside these sections.

Title:
- One single line.
- Benefits-oriented.
- Includes "${subject}".
- Sentence case.

Introduction:
- 2–4 paragraphs.
- Explain urgency & relevance.
- Address the needs of ${targetAudience}.
- Clear inbound value.
- Self-contained.

First chapter:
- 1–3 paragraphs.
- Provide one concrete insight or example.
- Must feel like a real first chapter.
- No invented statistics.
`.trim();

    // -------------------------------------------------------------
    // CALL OPENAI (gpt-4o-mini)
    // -------------------------------------------------------------
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.7,
        max_tokens: 1200,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: previewPrompt },
        ],
      }),
    });

    if (!response.ok) throw new Error(await response.text());

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content ?? "";

    // -------------------------------------------------------------
    // TITLE EXTRACTIE
    // -------------------------------------------------------------
    const lines = rawContent.split("\n").map((l) => l.trim()).filter(Boolean);
    const firstLine = lines[0] || `${subject}: ${languageConfig.defaultTitle}`;
    const cleanedTitle = firstLine.replace(/^Title:\s*/i, "").trim();

    const previewText = rawContent;
    const wordCountClean = previewText.split(/\s+/).filter(Boolean).length;

    // -------------------------------------------------------------
    // OPTIONAL COVER IMAGE VIA GEMINI
    // -------------------------------------------------------------
    let previewImage = null;
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

    if (geminiApiKey) {
      try {
        previewImage = await generatePenDrawingImage(subject, geminiApiKey);
      } catch (error) {
        console.error("Image generation failed:", error);
      }
    }

    return new Response(
      JSON.stringify({
        title: cleanedTitle,
        preview: previewText,
        wordCount: wordCountClean,
        image: previewImage,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Preview error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Preview failed" }),
      { status: 500, headers: corsHeaders }
    );
  }
});

// -------------------------------------------------------------
// PEN DRAWING IMAGE GENERATOR (Gemini 3.0)
// -------------------------------------------------------------
async function generatePenDrawingImage(subject: string, geminiApiKey: string) {
  try {
    const prompt = `Create a black-and-white pen drawing illustration in clean line-art style for a publication about ${subject}. Professional, artistic, minimalistic.`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:generate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": geminiApiKey,
        },
        body: JSON.stringify({
          prompt,
          aspectRatio: "16:9",
          numberOfImages: 1,
          safetySetting: "block_some",
          personGeneration: "dont_allow",
        }),
      }
    );

    if (!response.ok) return null;
    const data = await response.json();

    const img = data.generatedImages?.[0]?.image?.imageBytes;
    if (!img) return null;

    return {
      url: `data:image/png;base64,${img}`,
      photographer: "AI Generated",
      photographerUrl: "",
    };
  } catch {
    return null;
  }
}
