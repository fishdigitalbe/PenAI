import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");

    if (!anthropicApiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "ANTHROPIC_API_KEY is niet geconfigureerd in Supabase Edge Functions",
          message: "Ga naar Project Settings → Edge Functions → Environment Variables en voeg ANTHROPIC_API_KEY toe"
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

    console.log("ANTHROPIC_API_KEY gevonden, testen van API call...");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 100,
        messages: [
          {
            role: "user",
            content: "Zeg gewoon 'test succesvol' en niets anders.",
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(
        JSON.stringify({
          success: false,
          error: "Anthropic API call gefaald",
          statusCode: response.status,
          details: errorText,
          apiKeyPrefix: anthropicApiKey.substring(0, 20) + "...",
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

    const data = await response.json();
    const aiResponse = data.content[0].text;

    return new Response(
      JSON.stringify({
        success: true,
        message: "Anthropic API werkt correct!",
        aiResponse: aiResponse,
        apiKeyPrefix: anthropicApiKey.substring(0, 20) + "...",
        model: "claude-3-haiku-20240307",
        tokenUsage: {
          input: data.usage?.input_tokens || 0,
          output: data.usage?.output_tokens || 0,
        }
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in test-anthropic function:", error);
    return new Response(
      JSON.stringify({
        success: false,
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