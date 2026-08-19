import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RepurposeRequest {
  sourceContent?: string;
  sourceType?: string;
  targetFormats?: string[];
  tone?: string;
  userId?: string;
  fetchUrl?: string;
}

interface RepurposedContent {
  format: string;
  content: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");

    if (!anthropicApiKey) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }

    const requestData: RepurposeRequest = await req.json();
    const { sourceContent, sourceType, targetFormats, tone, userId, fetchUrl } = requestData;

    if (fetchUrl) {
      try {
        const blogUrlPattern = /\/blog\/([a-z0-9-]+)/;
        const match = fetchUrl.match(blogUrlPattern);

        if (match && match[1]) {
          const slug = match[1];
          const supabase = createClient(supabaseUrl, supabaseServiceKey);

          const { data: blog, error: blogError } = await supabase
            .from('blogs')
            .select('content, title')
            .eq('slug', slug)
            .eq('status', 'published')
            .maybeSingle();

          if (blogError || !blog) {
            throw new Error('Blog niet gevonden');
          }

          const contentWithoutHtml = blog.content
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/p>/gi, '\n\n')
            .replace(/<\/h[1-6]>/gi, '\n\n')
            .replace(/<li>/gi, '\n• ')
            .replace(/<[^>]+>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/\n{3,}/g, '\n\n')
            .trim();

          return new Response(
            JSON.stringify({
              success: true,
              content: `${blog.title}\n\n${contentWithoutHtml}`,
            }),
            {
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            }
          );
        }

        const urlResponse = await fetch(fetchUrl);
        if (!urlResponse.ok) {
          throw new Error(`Failed to fetch URL: ${urlResponse.statusText}`);
        }

        const html = await urlResponse.text();

        let contentText = html
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
          .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '')
          .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
          .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '')
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<\/p>/gi, '\n\n')
          .replace(/<\/h[1-6]>/gi, '\n\n')
          .replace(/<li>/gi, '\n• ')
          .replace(/<[^>]+>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/\s+/g, ' ')
          .replace(/\n{3,}/g, '\n\n')
          .trim();

        return new Response(
          JSON.stringify({
            success: true,
            content: contentText.substring(0, 50000),
          }),
          {
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      } catch (error) {
        throw new Error(`Failed to fetch URL content: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    if (!sourceContent || !targetFormats || targetFormats.length === 0) {
      throw new Error("Missing required fields");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const formatInstructions: Record<string, string> = {
      linkedin: "Schrijf een professionele LinkedIn post (max 1300 karakters) met een pakkende opening, bullets met key points, en een call-to-action. Gebruik hashtags.",
      facebook: "Schrijf een engagerende Facebook post (max 500 woorden) die conversatie uitlokt. Gebruik emoji's en een vraag aan het einde.",
      instagram: "Schrijf een boeiende Instagram caption (max 2200 karakters) met emoji's, line breaks voor leesbaarheid, en relevante hashtags.",
      twitter: "Schrijf een Twitter/X thread met 5-8 tweets (elk max 280 karakters). Nummereer de tweets (1/8, 2/8, etc.). Eerste tweet moet attention-grabbing zijn.",
      email: "Schrijf een email newsletter met: pakkende subject line, persoonlijke aanhef, duidelijke paragrafen, bullets voor belangrijke punten, en CTA.",
      blog: "Schrijf een volledige blog post (800-1200 woorden) met: titel, intro, meerdere secties met subheadings, conclusie. SEO-vriendelijk.",
      summary: "Schrijf een beknopte samenvatting (150-200 woorden) met de key takeaways in bullet points.",
      infographic: "Schrijf een script voor een infographic met 5-7 key statistics/facts, elk met een korte uitleg (max 25 woorden per punt).",
    };

    const toneInstructions: Record<string, string> = {
      professional: "Gebruik een professionele, zakelijke toon.",
      casual: "Gebruik een casual, toegankelijke toon alsof je met een vriend praat.",
      friendly: "Gebruik een vriendelijke, warme toon die uitnodigt tot interactie.",
      authoritative: "Gebruik een gezaghebbende, deskundige toon met feiten en data.",
      inspirational: "Gebruik een inspirerende, motiverende toon die mensen aanzet tot actie.",
      educational: "Gebruik een educatieve, leerzame toon met duidelijke uitleg.",
    };

    const results: RepurposedContent[] = [];

    for (const format of targetFormats) {
      const formatInstruction = formatInstructions[format] || "Transformeer de content naar het gevraagde format.";
      const toneInstruction = toneInstructions[tone] || "";

      const prompt = `Je bent een expert content creator. Transformeer de volgende ${sourceType} content naar een ${format} post.\n\nORIGINELE CONTENT:\n${sourceContent}\n\nINSTRUCTIES:\n${formatInstruction}\n${toneInstruction}\n\nBehoud de kernboodschap en belangrijkste punten, maar pas de stijl, lengte en format aan voor ${format}.\n\nGeef ALLEEN de getransformeerde content terug, zonder extra uitleg of commentaar.`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": anthropicApiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-opus-4-5-20251101",
          max_tokens: 4000,
          temperature: 0.7,
          messages: [
            { role: "user", content: prompt }
          ],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("[Claude] API error:", error);
        throw new Error(`Claude API error: ${error}`);
      }

      const data = await response.json();
      const textContent = data.content.find((block: any) => block.type === "text");
      if (!textContent || textContent.type !== "text") {
        throw new Error(`No text content for format: ${format}`);
      }

      const repurposedText = textContent.text.trim();
      results.push({
        format,
        content: repurposedText,
      });

      if (userId) {
        await supabase.from("repurposed_content").insert({
          user_id: userId,
          source_content: sourceContent,
          source_type: sourceType,
          target_format: format,
          tone,
          repurposed_content: repurposedText,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        repurposedContent: results,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error repurposing content:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});