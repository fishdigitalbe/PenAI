import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface TrendingTopic {
  id: string;
  category: string;
  topic: string;
  description: string;
  keywords: string[];
  trend_score: number;
}

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
      throw new Error("Anthropic API key not configured");
    }

    const categories = [
      'Technology',
      'Marketing',
      'Business',
      'Health',
      'Sustainability',
      'Education',
      'Finance'
    ];

    const systemPrompt = "You are a content strategy expert. Generate trending topics in valid JSON format only.";

    const userPrompt = `Generate 21 trending topics (3 per category) for content creation in 2026.

Categories: ${categories.join(', ')}

For each topic provide:
- A catchy, engaging topic title
- A brief description (1-2 sentences)
- 4-5 relevant keywords
- A trend score (60-95)

Focus on current trends, emerging technologies, and topics that would make compelling content.

Return ONLY a valid JSON array with this structure:
[
  {
    "category": "Technology",
    "topic": "AI-Powered Personal Assistants",
    "description": "How artificial intelligence is revolutionizing personal productivity and daily task management.",
    "keywords": ["AI", "productivity", "automation", "personal assistant", "machine learning"],
    "trend_score": 87
  }
]`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4000,

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
    const content = data.content[0].text.trim();

    let topics: any[];
    try {
      topics = JSON.parse(content);
    } catch (parseError) {
      const jsonMatch = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (jsonMatch) {
        topics = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Failed to parse AI response as JSON");
      }
    }

    const topicsWithIds: TrendingTopic[] = topics.map((topic, index) => ({
      id: `topic-${Date.now()}-${index}`,
      category: topic.category,
      topic: topic.topic,
      description: topic.description,
      keywords: topic.keywords,
      trend_score: topic.trend_score
    }));

    return new Response(
      JSON.stringify({ topics: topicsWithIds }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error generating trending topics:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to generate trending topics",
        topics: []
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
