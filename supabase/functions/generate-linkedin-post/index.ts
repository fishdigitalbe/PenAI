import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { blogTitle, blogExcerpt, blogUrl } = await req.json();

    if (!blogTitle || !blogExcerpt || !blogUrl) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicApiKey) {
      throw new Error("Anthropic API key not configured");
    }

    const systemPrompt = "Je bent een professionele LinkedIn content creator die Nederlandse posts schrijft. Maak boeiende LinkedIn posts in het Nederlands die engagement en clicks genereren.";

    const userPrompt = `Maak een pakkende LinkedIn post in het NEDERLANDS om dit blogartikel te promoten. De post moet:
- Professioneel en boeiend zijn
- Tussen de 150-300 karakters lang zijn (optimale LinkedIn lengte)
- Relevante hashtags bevatten (maximaal 2-3)
- Een duidelijke call-to-action hebben om het volledige artikel te lezen
- Een professionele zakelijke toon hebben
- GEEN emoji's gebruiken
- VOLLEDIG IN HET NEDERLANDS geschreven zijn

Blog Titel: ${blogTitle}
Blog Excerpt: ${blogExcerpt}
Blog URL: ${blogUrl}

Genereer ALLEEN de LinkedIn post tekst in het Nederlands, niets anders.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 500,

        system: systemPrompt,
        messages: [
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Claude API error:", errorData);
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    const linkedinPost = data.content[0].text.trim();

    return new Response(
      JSON.stringify({
        post: linkedinPost,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error generating LinkedIn post:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to generate LinkedIn post" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
