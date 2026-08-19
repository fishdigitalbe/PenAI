import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.74.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function generateWithOpenAI(systemPrompt: string, userPrompt: string, model: string, apiKey: string) {
  console.log("[OpenAI] Starting request with model:", model);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 8000,
      response_format: { type: "json_object" }
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("[OpenAI] API error response:", error);
    console.error("[OpenAI] API status:", response.status);

    let errorDetails = error;
    try {
      const errorJson = JSON.parse(error);
      errorDetails = errorJson.error?.message || error;
    } catch (e) {
      // Not JSON, use raw text
    }

    throw new Error(`OpenAI API error (${response.status}): ${errorDetails}`);
  }

  const data = await response.json();
  console.log("[OpenAI] Response received, length:", JSON.stringify(data).length);
  return data.choices[0]?.message?.content;
}

function repairClaudeJson(content: string): string {
  console.log("[Claude] Attempting to repair JSON");

  let repaired = content.trim();

  // Remove any markdown code blocks
  repaired = repaired.replace(/```json\s*/g, '').replace(/```\s*/g, '');

  // Find the JSON object boundaries
  const firstBrace = repaired.indexOf('{');
  const lastBrace = repaired.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error("Could not find JSON object boundaries");
  }

  repaired = repaired.substring(firstBrace, lastBrace + 1);

  // Try to fix common JSON issues
  // Fix unescaped quotes in strings (this is tricky, but we'll do our best)
  // We need to be careful not to break intentional quotes

  console.log("[Claude] Repaired JSON length:", repaired.length);
  return repaired;
}

async function generateWithClaude(systemPrompt: string, userPrompt: string, model: string, apiKey: string) {
  console.log("[Claude] Starting request with model:", model);

  // For Claude, we'll use a more explicit system prompt
  const claudeSystemPrompt = systemPrompt + `\n\nIMPORTANT FOR CLAUDE:\n- Your response will be parsed as JSON\n- Ensure all HTML content is properly escaped\n- Use single quotes in HTML (e.g., <a href='/blog/slug' class='text-blue-600'>)\n- If you need double quotes in HTML, escape them as \\"\n- Ensure the JSON is complete and not truncated\n- Test your JSON mentally before responding`;

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
      temperature: 0.7,
      system: claudeSystemPrompt,
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

  // Check if response was truncated
  if (data.stop_reason === "max_tokens") {
    console.warn("[Claude] Response was truncated due to max_tokens limit");
    throw new Error("De AI response was te lang en werd afgekapt. Probeer een kortere blog te genereren.");
  }

  return content;
}

async function generateWithGemini(systemPrompt: string, userPrompt: string, model: string, apiKey: string) {
  const combinedPrompt = `${systemPrompt}\n\n${userPrompt}`;
  console.log("[Gemini] Starting request with model:", model);

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: combinedPrompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8000,
        responseMimeType: "application/json"
      }
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("[Gemini] API error response:", error);
    console.error("[Gemini] API status:", response.status);

    let errorDetails = error;
    try {
      const errorJson = JSON.parse(error);
      errorDetails = errorJson.error?.message || error;
    } catch (e) {
      // Not JSON, use raw text
    }

    throw new Error(`Gemini API error (${response.status}): ${errorDetails}`);
  }

  const data = await response.json();
  console.log("[Gemini] Response received, length:", JSON.stringify(data).length);
  return data.candidates[0]?.content?.parts[0]?.text;
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

    const systemPrompt = `Je bent een ervaren blog schrijver. Schrijf een SEO-geoptimaliseerde blog post in het Nederlands.\n\nSPECIFICATIES:\n- Onderwerp: ${topic}\n${keywords ? `- Keywords: ${keywords}` : ""}\n- Toon: ${toneGuide[tone as keyof typeof toneGuide] || "professioneel"}\n- Lengte: ${lengthGuide[length as keyof typeof lengthGuide] || "1000-1500 woorden"}${internalLinksContext}\n\nTITEL:\n- Maak een pakkende, SEO-geoptimaliseerde titel\n- Gebruik getallen of power words waar passend\n- Voorbeelden: \"5 Strategieën om [X]\", \"Hoe [Y] bereiken\", \"Complete Gids: [Z]\"\n\nSTRUCTUUR:\n1. Pakkende titel\n2. Korte introductie (2-3 zinnen voor excerpt)\n3. Hoofdsecties met H2/H3 kopjes\n4. Praktische tips en voorbeelden\n5. Conclusie\n\nGebruik korte paragrafen, lijsten en natuurlijke keyword integratie.${blogsForLinking.length > 0 ? " Voeg 1-2 interne links toe." : ""}\n\nCRITICAL JSON FORMATTING RULES:\n- Respond with ONLY valid, parseable JSON\n- ALL strings must properly escape quotes: use \\\\\" for quotes inside strings\n- ALL newlines in content must be escaped as \\\\n\n- Use single quotes in HTML attributes to minimize escaping needs\n- NEVER include code blocks or markdown formatting\n- The JSON must be valid and parseable by JSON.parse()\n\nRequired JSON structure:\n{\n  \"title\": \"string\",\n  \"excerpt\": \"string\",\n  \"content\": \"string with properly escaped HTML\",\n  \"metaDescription\": \"string max 160 chars\",\n  \"suggestedTags\": [\"tag1\", \"tag2\", \"tag3\"]\n}`;

    const userPrompt = `Schrijf een blog over: ${topic}`;

    let content: string;
    const selectedModel = model || "claude-opus-4-5-20251101";
    console.log("[AI] Selected model:", selectedModel);

    if (selectedModel.startsWith("gpt-")) {
      const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
      if (!openaiApiKey) {
        console.error("[AI] OpenAI API key not configured");
        throw new Error("OpenAI API key niet geconfigureerd. Contacteer de beheerder.");
      }
      console.log("[AI] Generating with OpenAI...");
      content = await generateWithOpenAI(systemPrompt, userPrompt, selectedModel, openaiApiKey);
    } else if (selectedModel.startsWith("claude-")) {
      const claudeApiKey = Deno.env.get("ANTHROPIC_API_KEY");
      if (!claudeApiKey) {
        console.error("[AI] Anthropic API key not configured");
        throw new Error("Claude API key niet geconfigureerd. Contacteer de beheerder.");
      }
      console.log("[AI] Generating with Claude...");
      content = await generateWithClaude(systemPrompt, userPrompt, selectedModel, claudeApiKey);
    } else if (selectedModel.startsWith("gemini-")) {
      const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
      if (!geminiApiKey) {
        console.error("[AI] Gemini API key not configured");
        throw new Error("Gemini API key niet geconfigureerd. Contacteer de beheerder.");
      }
      console.log("[AI] Generating with Gemini...");
      content = await generateWithGemini(systemPrompt, userPrompt, selectedModel, geminiApiKey);
    } else {
      console.error("[AI] Unsupported model:", selectedModel);
      throw new Error(`Model niet ondersteund: ${selectedModel}`);
    }

    if (!content) {
      console.error("[AI] No content generated");
      throw new Error("Geen content gegenereerd door AI");
    }

    console.log("[Parse] Content length:", content.length);
    console.log("[Parse] Content preview (first 500 chars):", content.substring(0, 500));
    console.log("[Parse] Content preview (last 500 chars):", content.substring(Math.max(0, content.length - 500)));

    const isClaude = selectedModel.startsWith("claude-");
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

        if (isClaude) {
          console.log("[Parse] Trying Claude-specific JSON repair");
          try {
            const repairedJson = repairClaudeJson(jsonContent);
            blogData = JSON.parse(repairedJson);
            console.log("[Parse] Successfully parsed after Claude repair");
          } catch (repairError) {
            console.error("[Parse] Claude repair failed:", repairError);
            // Continue to standard extraction method
          }
        }

        if (!blogData) {
          console.log("[Parse] Trying to extract JSON object");
          const jsonMatch = jsonContent.match(/\\{[\\s\\S]*\\}/);
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
      }
    } catch (parseError) {
      console.error("[Parse] Failed to parse JSON after all attempts");
      console.error("[Parse] Full content:", content);
      console.error("[Parse] Parse error:", parseError);

      if (isClaude) {
        throw new Error(`Claude kon geen geldige JSON genereren. Dit kan gebeuren bij zeer lange blogs. Probeer: 1) Een kortere lengte te kiezen, 2) Een ander AI model te gebruiken (GPT-4o of Gemini), of 3) Het onderwerp meer te beperken.`);
      }

      throw new Error(`Kon AI response niet parsen: ${parseError instanceof Error ? parseError.message : 'Onbekende fout'}. De AI response was mogelijk te lang of bevat ongeldige karakters.`);
    }

    console.log("[Slug] Generating slug from title");
    const slug = blogData.title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\\u0300-\\u036f]/g, "")
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
