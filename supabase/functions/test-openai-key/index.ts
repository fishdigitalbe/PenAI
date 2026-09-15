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
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

    const result = {
      anthropicConfigured: !!anthropicApiKey,
      anthropicKeyPrefix: anthropicApiKey ? anthropicApiKey.substring(0, 10) + "..." : "NOT SET",
      geminiConfigured: !!geminiApiKey,
      geminiKeyPrefix: geminiApiKey ? geminiApiKey.substring(0, 10) + "..." : "NOT SET",
      openaiConfigured: !!openaiApiKey,
      openaiKeyPrefix: openaiApiKey ? openaiApiKey.substring(0, 10) + "..." : "NOT SET",
      openaiNote: openaiApiKey ? "OpenAI key is only used for DALL-E infographic generation" : "OpenAI key not set - infographics will not work",
      allEnvVars: Object.keys(Deno.env.toObject()).sort()
    };

    return new Response(
      JSON.stringify(result, null, 2),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error:", error);
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
