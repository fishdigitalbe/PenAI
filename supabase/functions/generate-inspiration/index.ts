import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface InspirationRequest {
  funnelStage: 'problem-aware' | 'solution-aware' | 'product-aware';
  productUrl: string;
  targetAudience: string;
  language: string;
}

interface ContentSuggestion {
  title: string;
  angle: string;
  structure: string[];
  contentGoals: string[];
  keywords: {
    primary: string;
    searchVolume: number;
    relatedKeywords: Array<{
      keyword: string;
      searchVolume: number;
    }>;
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { funnelStage, productUrl, targetAudience, language }: InspirationRequest = await req.json();

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      throw new Error("OpenAI API key not configured");
    }

    const funnelStageDescriptions = {
      'problem-aware': 'The target audience is aware they have a problem but may not know all the implications or how serious it is. Content should focus on identifying and explaining the problem deeply.',
      'solution-aware': 'The target audience knows they have a problem and is actively looking for solutions. Content should present different solution approaches and methodologies without being too product-specific.',
      'product-aware': 'The target audience is ready to evaluate specific products or services. Content should demonstrate how this specific product/service solves their problem better than alternatives.'
    };

    const languageInstructions = {
      nl: 'in het Nederlands',
      fr: 'en français',
      en: 'in English',
      de: 'auf Deutsch',
      es: 'en español'
    };

    const languageInstruction = languageInstructions[language as keyof typeof languageInstructions] || 'in the specified language';

    const systemPrompt = `You are an expert content strategist specializing in creating compelling content ideas for marketing funnels. You understand how to tailor content to different stages of buyer awareness and create engaging, SEO-optimized content strategies. Generate all content suggestions ${languageInstruction}.`;

    const userPrompt = `Generate 5 diverse content ideas for a ${funnelStage} audience based on HIGH SEARCH VOLUME KEYWORDS. ALL suggestions must be written ${languageInstruction}.

Target Audience: ${targetAudience}
Product/Service URL: ${productUrl}
Funnel Stage Context: ${funnelStageDescriptions[funnelStage]}

CRITICAL REQUIREMENT: Base each content idea on keywords that have HIGH search volume (preferably 1000+ monthly searches). Focus on topics that people are actively searching for.

For each content idea, provide:
1. A compelling, SEO-friendly title based on high-volume keywords (use proper sentence case - only capitalize the first word and proper nouns)
2. A unique angle or perspective that makes this content stand out
3. A suggested structure with 4-6 main sections/chapters (use proper sentence case - only capitalize the first word and proper nouns)
4. 3-4 specific content goals this piece would achieve
5. PRIMARY KEYWORD with estimated monthly search volume (be realistic and conservative with estimates)
6. 3-5 related keywords with their estimated search volumes

IMPORTANT GRAMMAR RULES:
- Use proper sentence case throughout (only capitalize the first word of a sentence and proper nouns)
- Do NOT capitalize every word in titles or headings
- Follow standard grammar rules for the target language
- Example correct: "De ultieme gids voor contentmarketing"
- Example incorrect: "De Ultieme Gids Voor Contentmarketing"

KEYWORD RESEARCH GUIDELINES:
- Prioritize keywords with high search intent matching the funnel stage
- Problem-aware: focus on problem-identification keywords (e.g., "waarom", "probleem met", "hoe herken ik")
- Solution-aware: focus on solution-seeking keywords (e.g., "oplossingen voor", "manieren om", "hoe los ik op")
- Product-aware: focus on comparison and evaluation keywords (e.g., "beste", "vergelijking", "review", "ervaring met")
- Provide realistic search volume estimates based on common keyword research patterns
- Search volumes should reflect the language and market size

Make each idea distinctly different from the others. Consider various formats like:
- Ultimate guides
- Step-by-step tutorials
- Comparison pieces
- Problem-solution frameworks
- Case study approaches
- Expert insights
- Common mistakes to avoid
- Future trends and predictions

Respond ONLY with a valid JSON array of 5 objects, each with this exact structure:
{
  "title": "string",
  "angle": "string",
  "structure": ["string", "string", "string", "string"],
  "contentGoals": ["string", "string", "string"],
  "keywords": {
    "primary": "string",
    "searchVolume": number,
    "relatedKeywords": [
      {"keyword": "string", "searchVolume": number},
      {"keyword": "string", "searchVolume": number},
      {"keyword": "string", "searchVolume": number}
    ]
  }
}

Ensure the JSON is properly formatted and can be parsed directly.`;

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
          { role: "user", content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content;

    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let suggestions: ContentSuggestion[];
    try {
      suggestions = JSON.parse(content);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      console.error("Parse error:", parseError);
      throw new Error("Failed to parse content suggestions");
    }

    if (!Array.isArray(suggestions)) {
      throw new Error("Invalid response format from AI - not an array");
    }

    if (suggestions.length < 5) {
      console.warn(`Only ${suggestions.length} suggestions generated, expected 5`);
    }

    return new Response(
      JSON.stringify({ suggestions }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error generating inspiration:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to generate inspiration"
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