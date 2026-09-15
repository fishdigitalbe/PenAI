import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SuggestSubjectsRequest {
  websiteUrl: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { websiteUrl }: SuggestSubjectsRequest = await req.json();

    if (!websiteUrl) {
      return new Response(
        JSON.stringify({ error: "Website URL is required" }),
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

    let websiteContent = "";
    try {
      const websiteResponse = await fetch(websiteUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; EbookBot/1.0)",
        },
      });

      if (websiteResponse.ok) {
        const html = await websiteResponse.text();
        const textContent = html
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim();

        websiteContent = textContent.substring(0, 3000);
      }
    } catch (error) {
      console.error("Failed to fetch website content:", error);
    }

    const systemPrompt = `Je bent een expert content strategie consultant die bedrijven helpt relevante ebook onderwerpen te identificeren.`;

    const userPrompt = websiteContent
      ? `Analyseer de volgende website content en stel 5 relevante ebook onderwerpen voor die aansluiten bij de sector en expertise van dit bedrijf:\n\n${websiteContent}\n\nGeef 5 concrete, specifieke ebook onderwerpen die:\n1. Aansluiten bij de sector en diensten van het bedrijf\n2. Waarde bieden aan hun doelgroep\n3. Hun expertise demonstreren\n4. Praktisch en actionable zijn\n5. Niet te breed of te smal zijn (geschikt voor een ebook van 5000-10000 woorden)\n\nFormatteer je antwoord als een genummerde lijst met enkel de onderwerpen, zonder extra uitleg. Schrijf elk onderwerp als een grammaticaal correcte zin in normale schrijfwijze (niet elk woord met een hoofdletter).`
      : `Geef 5 algemene ebook onderwerpen die waardevol zijn voor de meeste bedrijven.\n\nFormatteer je antwoord als een genummerde lijst met enkel de onderwerpen, zonder extra uitleg. Schrijf elk onderwerp als een grammaticaal correcte zin in normale schrijfwijze (niet elk woord met een hoofdletter).`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 800,
        system: systemPrompt,
        messages: [
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${error}`);
    }

    const data = await response.json();
    const content = data.content[0].text;

    const subjects = content
      .split("\n")
      .filter((line: string) => line.trim())
      .map((line: string) => line.replace(/^\d+[\.\)]\s*/, "").trim())
      .filter((line: string) => line.length > 0)
      .slice(0, 5);

    return new Response(
      JSON.stringify({ subjects }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error suggesting subjects:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to suggest subjects",
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
