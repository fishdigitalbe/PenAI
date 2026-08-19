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

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      throw new Error("OpenAI API key not configured");
    }

    const prompt = `Maak een pakkende LinkedIn post in het NEDERLANDS om dit blogartikel te promoten. De post moet:
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

    const openaiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openaiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "Je bent een professionele LinkedIn content creator die Nederlandse posts schrijft. Maak boeiende LinkedIn posts in het Nederlands die engagement en clicks genereren.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      }
    );

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text();
      console.error("OpenAI API error:", errorData);
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const openaiData = await openaiResponse.json();
    const linkedinPost = openaiData.choices[0].message.content.trim();

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