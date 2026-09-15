import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.74.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function generateWithClaude(systemPrompt: string, userPrompt: string, model: string, apiKey: string) {
  console.log("[Claude] Starting request with model:", model);

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 16000,

      system: systemPrompt,
      messages: [
        { role: "user", content: userPrompt }
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("[Claude] API error response:", error);
    console.error("[Claude] API status:", response.status);

    let errorDetails = error;
    try {
      const errorJson = JSON.parse(error);
      errorDetails = errorJson.error?.message || JSON.stringify(errorJson);
    } catch (e) {
      // Not JSON, use raw text
    }

    throw new Error(`Claude API error (${response.status}): ${errorDetails}`);
  }

  const data = await response.json();
  console.log("[Claude] Response received, length:", JSON.stringify(data).length);

  let content = data.content[0]?.text;

  if (data.stop_reason === "max_tokens") {
    console.warn("[Claude] Response was truncated due to max_tokens limit");
    throw new Error("De AI response was te lang en werd afgekapt. Probeer een kortere blog te genereren.");
  }

  return content;
}

function fixHeadingCapitalization(content: string): string {
  const properNouns = [
    'Mailchimp', 'HubSpot', 'ActiveCampaign', 'Pardot', 'Salesforce', 'Marketo',
    'Google', 'ChatGPT', 'SEO', 'B2B', 'B2C', 'KPI', 'MQL', 'SQL', 'WON',
    'ROI', 'CRM', 'ROPO', 'IT', 'AI', 'LinkedIn', 'Facebook', 'Instagram',
    'Twitter', 'YouTube', 'TikTok', 'Pinterest', 'Snapchat', 'WhatsApp',
    'Excel', 'PowerPoint', 'Microsoft', 'Apple', 'Amazon', 'Netflix',
    'Spotify', 'Uber', 'Airbnb', 'Tesla', 'Nike', 'Adidas', 'Coca-Cola',
    'McDonald', 'Starbucks', 'IKEA', 'Zara', 'H&M'
  ];

  return content.replace(/<h([23])>(.*?)<\/h\1>/gi, (match, level, heading) => {
    const words = heading.split(' ');

    const fixedHeading = words.map((word: string, index: number) => {
      const cleanWord = word.replace(/[.,!?;:()]/g, '');

      if (properNouns.includes(cleanWord)) {
        return word;
      }

      if (index === 0) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }

      const prevWord = words[index - 1];
      if (prevWord && prevWord.endsWith(':')) {
        return word.toLowerCase();
      }

      return word.toLowerCase();
    }).join(' ');

    return `<h${level}>${fixedHeading}</h${level}>`;
  });
}

Deno.serve(async (req: Request) => {
  console.log("[Request] New blog generation request");
  
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const body = await req.json();
    console.log("[Request] Body:", JSON.stringify(body));

    const { topic, keywords, tone, length, model } = body;

    if (!topic || !topic.trim()) {
      console.error("[Validation] Topic is missing or empty");
      return new Response(
        JSON.stringify({ error: "Topic is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("[Init] Initializing Supabase client");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      console.error("[Init] Supabase credentials missing");
      throw new Error("Supabase credentials not configured");
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("[Database] Fetching existing blogs for internal linking");
    const { data: existingBlogs, error: blogsError } = await supabase
      .from("blogs")
      .select("title, slug")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(5);

    if (blogsError) {
      console.error("[Database] Error fetching blogs:", blogsError);
    }

    const blogsForLinking = existingBlogs || [];
    console.log("[Database] Found", blogsForLinking.length, "blogs for linking");

    const lengthGuide = {
      short: "500-700 woorden",
      medium: "1000-1500 woorden",
      long: "2000-3000 woorden"
    };

    const toneGuide = {
      professional: "professioneel en zakelijk",
      casual: "casual en toegankelijk",
      educational: "educatief en informatief",
      inspirational: "inspirerend en motiverend"
    };

    let internalLinksContext = "";
    if (blogsForLinking.length > 0) {
      internalLinksContext = `\n\nBESCHIKBARE BLOGS VOOR INTERNE LINKING:\n${blogsForLinking.map((blog: any, idx: number) => `${idx + 1}. \"${blog.title}\" (slug: ${blog.slug})`).join("\n")}\n\nVoeg waar relevant 1-2 interne links toe: <a href=\"/blog/[slug]\" class=\"text-blue-600 hover:underline\">[tekst]</a>`;
    }

    const systemPrompt = `Je bent een ervaren blog schrijver. Schrijf een SEO-geoptimaliseerde blog post in het Nederlands.\n\nSPECIFICATIES:\n- Onderwerp: ${topic}\n${keywords ? `- Keywords: ${keywords}` : ""}\n- Toon: ${toneGuide[tone as keyof typeof toneGuide] || "professioneel"}\n- Lengte: ${lengthGuide[length as keyof typeof lengthGuide] || "1000-1500 woorden"}${internalLinksContext}\n\nTITEL:\n- Maak een pakkende, SEO-geoptimaliseerde titel\n- Gebruik getallen of power words waar passend\n- Voorbeelden: "5 Strategieën om [X]", "Hoe [Y] bereiken", "Complete Gids: [Z]"\n\nSTRUCTUUR:\n1. Pakkende titel\n2. Korte introductie (2-3 zinnen voor excerpt)\n3. Hoofdsecties met H2/H3 kopjes\n4. Praktische tips en voorbeelden\n5. Conclusie\n\nGebruik korte paragrafen, lijsten en natuurlijke keyword integratie.${blogsForLinking.length > 0 ? " Voeg 1-2 interne links toe." : ""}\n\nCRITICAL JSON FORMATTING RULES:\n- Respond with ONLY valid, parseable JSON\n- ALL strings must properly escape quotes: use \\\\\" for quotes inside strings\n- ALL newlines in content must be escaped as \\\\n\n- Use single quotes in HTML attributes to minimize escaping needs\n- NEVER include code blocks or markdown formatting\n- The JSON must be valid and parseable by JSON.parse()\n\nRequired JSON structure:\n{\n  \"title\": \"string\",\n  \"excerpt\": \"string\",\n  \"content\": \"string with properly escaped HTML\",\n  \"metaDescription\": \"string max 160 chars\",\n  \"suggestedTags\": [\"tag1\", \"tag2\", \"tag3\"]\n}`;

    const userPrompt = `Schrijf een blog over: ${topic}`;

    const selectedModel = model || "claude-sonnet-4-5-20250929";
    console.log("[AI] Selected model:", selectedModel);

    const claudeApiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!claudeApiKey) {
      console.error("[AI] Anthropic API key not configured");
      throw new Error("Anthropic API key niet geconfigureerd. Contacteer de beheerder.");
    }
    console.log("[AI] Generating with Claude...");
    const content = await generateWithClaude(systemPrompt, userPrompt, selectedModel, claudeApiKey);

    if (!content) {
      console.error("[AI] No content generated");
      throw new Error("Geen content gegenereerd door AI");
    }

    console.log("[Parse] Content length:", content.length);
    console.log("[Parse] Content preview (first 500 chars):", content.substring(0, 500));

    let blogData;
    try {
      let jsonContent = content.trim();

      if (jsonContent.includes("```")) {
        console.log("[Parse] Detected code block markers, removing them");
        jsonContent = jsonContent
          .replace(/```json\s*/g, '')
          .replace(/```\s*/g, '')
          .trim();
      }

      console.log("[Parse] Attempting to parse JSON (length:", jsonContent.length, ")");

      try {
        blogData = JSON.parse(jsonContent);
        console.log("[Parse] Successfully parsed on first attempt");
      } catch (firstParseError) {
        console.log("[Parse] First parse failed:", firstParseError);

        console.log("[Parse] Trying to extract JSON object");
        const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonString = jsonMatch[0];
          console.log("[Parse] Found JSON object, attempting to parse (length:", jsonString.length, ")");

          try {
            blogData = JSON.parse(jsonString);
            console.log("[Parse] Successfully parsed after extraction");
          } catch (secondParseError) {
            console.error("[Parse] Second parse failed, content sample:", jsonString.substring(0, 1000));
            throw secondParseError;
          }
        } else {
          throw firstParseError;
        }
      }
    } catch (parseError) {
      console.error("[Parse] Failed to parse JSON after all attempts");
      console.error("[Parse] Full content:", content);
      console.error("[Parse] Parse error:", parseError);

      throw new Error(`Kon AI response niet parsen: ${parseError instanceof Error ? parseError.message : 'Onbekende fout'}. De AI response was mogelijk te lang of bevat ongeldige karakters.`);
    }

    console.log("[Slug] Generating slug from title");
    const slug = blogData.title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .substring(0, 100);

    console.log("[Format] Fixing heading capitalization");
    const formattedContent = fixHeadingCapitalization(blogData.content);

    console.log("[Success] Blog generated successfully");
    return new Response(
      JSON.stringify({
        title: blogData.title,
        slug: slug,
        excerpt: blogData.excerpt,
        content: formattedContent,
        metaDescription: blogData.metaDescription,
        suggestedTags: blogData.suggestedTags || [],
        aiModel: selectedModel,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[Error] Blog generation failed:", error);
    console.error("[Error] Stack trace:", error instanceof Error ? error.stack : "No stack trace");

    const errorMessage = error instanceof Error ? error.message : "Onbekende fout bij het genereren van blog";

    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
