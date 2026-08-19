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
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
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

    const prompt = `Generate 21 trending topics (3 per category) for content creation in 2024.

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

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a content strategy expert. Generate trending topics in valid JSON format only.'
          },
          {
            role: 'user',
            content: prompt
          }
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
    const content = data.choices[0].message.content.trim();
    
    let topics: any[];
    try {
      topics = JSON.parse(content);
    } catch (parseError) {
      const jsonMatch = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (jsonMatch) {
        topics = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse AI response as JSON');
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
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error generating trending topics:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to generate trending topics',
        topics: []
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});