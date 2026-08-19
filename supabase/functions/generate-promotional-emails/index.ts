import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EmailGenerationRequest {
  orderId: string;
  numberOfEmails: number;
}

interface Email {
  subject: string;
  body: string;
  purpose: string;
  sendTiming: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { orderId, numberOfEmails }: EmailGenerationRequest = await req.json();

    if (!numberOfEmails || numberOfEmails < 1 || numberOfEmails > 10) {
      throw new Error("Number of emails must be between 1 and 10");
    }

    const { data: order, error: orderError } = await supabaseClient
      .from("orders")
      .select("*, customers(user_id)")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found");
    }

    if (order.customers?.user_id !== user.id) {
      throw new Error("Unauthorized - not your order");
    }

    if (!order.generated_content) {
      throw new Error("No content available to promote");
    }

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      throw new Error("OpenAI API key not configured");
    }

    const contentData = typeof order.generated_content === "string"
      ? JSON.parse(order.generated_content)
      : order.generated_content;

    const generationParams = typeof order.generation_params === "string"
      ? JSON.parse(order.generation_params)
      : order.generation_params;

    const contentType = generationParams?.contentType || "ebook";
    const targetAudience = generationParams?.targetAudience || "algemene zakelijke doelgroep";
    const subject = generationParams?.subject || "Zonder titel";
    const contentTitle = contentData?.title || subject;

    const language = generationParams?.language || "Nederlands";
    const toneOfVoice = generationParams?.toneOfVoice || "professioneel maar toegankelijk";
    const contentGoal = generationParams?.contentGoal || null; // bv. 'problem-aware' | 'solution-aware' | 'product-aware'

    let contentSummary = "";
    if (contentData?.chapters && Array.isArray(contentData.chapters)) {
      const chapterTitles = contentData.chapters
        .map((ch: any) => ch?.title)
        .filter(Boolean)
        .join(", ");
      contentSummary = chapterTitles ? `Hoofdstukken: ${chapterTitles}` : "";
    }

    const systemPrompt = `
Je bent een senior e-mailmarketing copywriter en CRM-strateeg.
Je specialiseert je in B2B-nurturingcampagnes voor kmo’s en middelgrote bedrijven.

Jouw focus:
- Sterke, conversiegerichte e-mails die interesse opbouwen en lezers richting actie sturen.
- Logische e-mailsequences (bewustzijn → interesse → overweging → actie).
- Heldere, concrete taal zonder buzzwords of vage superlatieven.

Belangrijk:
- Schrijf altijd in de taal die de gebruiker vraagt (hier: ${language}).
- Hanteer een toon van stem die aansluit bij: ${toneOfVoice}.
- Geef NOOIT uitleg, commentaar of tekst buiten de gevraagde JSON-structuur.
- Gebruik geen markdown, geen code fences en geen extra tekst vóór of na de JSON.
- Als informatie ontbreekt, maak redelijke B2B-aanames maar blijf generiek en professioneel.
`.trim();

    const contentTypeLabel = contentType === "blog" ? "blogartikel" : "ebook";

    const userPrompt = `
Genereer een reeks van ${numberOfEmails} promotionele nurturing e-mails om het volgende contentstuk te promoten.

Context over het contentstuk:
- Type: ${contentTypeLabel}
- Titel: "${contentTitle}"
- Doelgroep: ${targetAudience}
${contentGoal ? `- Funnel-fase: ${contentGoal} (laat inhoud en argumentatie hierbij aansluiten).` : ""}
${contentSummary ? `- Inhoudsoverzicht (verwerk dit expliciet in de e-mails): ${contentSummary}` : ""}

Doel:
Schrijf een logische e-mailsequence die stap voor stap interesse opbouwt en lezers aanzet om het ${contentTypeLabel} te lezen/downloaden.

Structuur van de sequence:
- E-mail 1: Aankondigingsmail – introduceer het nieuwe contentstuk en wek nieuwsgierigheid.
${numberOfEmails > 1 ? "- E-mail 2: Value-focused – benadruk concrete voordelen en inzichten uit het contentstuk." : ""}
${numberOfEmails > 2 ? "- E-mail 3: Social proof – geef voorbeelden, testimonials of situaties die vertrouwen opbouwen." : ""}
${numberOfEmails > 3 ? "- E-mail 4: Probleem-oplossing – focus op het specifieke probleem van de lezer en hoe dit contentstuk helpt." : ""}
${numberOfEmails > 4 ? "- E-mail 5: Urgentie/FOMO – benadruk waarom het nú interessant is om het contentstuk te bekijken." : ""}
${numberOfEmails > 5 ? "- E-mail 6+: Extra follow-ups met andere invalshoeken, use cases of voordelen." : ""}

Schrijfregels per e-mail:
- Taal: schrijf ALLES in professioneel ${language}.
- Toon: ${toneOfVoice}, menselijk en duidelijk, gericht op zakelijke lezers (kmo-beslissers).
- Lengte body: 150–250 woorden.
- Gebruik een persoonlijke aanspreking (bijv. "Dag [Voornaam],").
- Verwijs expliciet naar het ${contentTypeLabel} en wat de lezer eruit haalt (inzichten, tips, stappenplan, ...).
- Focus op pijnpunt → inzicht → oplossing (het contentstuk).
- Voeg maximaal één hoofd-CTA toe met een duidelijke actie (bijv. "Download het ebook via [CTA-link]").
- Optioneel: een zachte secundaire CTA (bijv. "Stel je vraag als je twijfelt over X").
- Vermijd spammy woorden (zoals "GRATIS!!!", overdreven superlatieven, ALL CAPS).

Subject lines:
- Maximaal 50 tekens.
- Geen emoji’s, geen ALL CAPS.
- Maak ze concreet en nieuwsgierig, niet clickbait.

Outputstructuur:
Voor elke e-mail moet je de volgende velden invullen:
1. "subject": pakkende onderwerpregel.
2. "body": volledige e-mailtekst inclusief begroeting en afsluiter, met placeholders zoals [Voornaam] en [Je naam].
3. "purpose": korte uitleg (1–2 zinnen) wat deze e-mail doet in de sequence.
4. "sendTiming": voorstel van verzendmoment t.o.v. e-mail 1 (bijv. "Onmiddellijk", "2 dagen na e-mail 1", "1 week na e-mail 1").

Technische vereisten:
- Retourneer UITSLUITEND een geldige JSON-array met EXACT ${numberOfEmails} objecten.
- Gebruik deze exacte structuur:
[
  {
    "subject": "string",
    "body": "string",
    "purpose": "string",
    "sendTiming": "string"
  }
]
- Gebruik uitsluitend dubbele aanhalingstekens in de JSON.
- Voeg GEEN markdown, GEEN code fences (zoals ```json) en GEEN extra tekst toe buiten de JSON-array.
`.trim();

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content ?? "";

    // Extra safeguard als het model tóch code fences zou toevoegen
    content = content.replace(/```json\n?/gi, "").replace(/```\n?/g, "").trim();

    let emails: Email[];
    try {
      emails = JSON.parse(content) as Email[];
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      console.error("Parse error:", parseError);
      throw new Error("Failed to parse email content");
    }

    if (!Array.isArray(emails)) {
      throw new Error("Invalid response format from AI - not an array");
    }

    if (emails.length !== numberOfEmails) {
      console.warn(`Expected ${numberOfEmails} emails, got ${emails.length}`);
    }

    const { data: customerData } = await supabaseClient
      .from("customers")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (customerData) {
      await supabaseClient
        .from("promotional_emails")
        .insert({
          order_id: orderId,
          customer_id: customerData.id,
          emails: emails,
          number_of_emails: emails.length,
        });
    }

    return new Response(
      JSON.stringify({ emails }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error generating promotional emails:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to generate promotional emails",
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
