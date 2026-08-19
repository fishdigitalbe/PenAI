import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.74.0";

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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const formData = await req.json();

    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicApiKey) {
      throw new Error("Anthropic API key not configured");
    }

    const systemPrompt = `B2B content strategist. Create executable plans mapped to buyer journey. Be concise and pragmatic.`;

    const developerPrompt = `Return ONLY raw JSON, no markdown:
{
  "strategy_objective": "string",
  "content_pillars": ["string", "string", "string"],
  "calendar_12_weeks": [
    {
      "week_number": 1,
      "blog": {
        "title": "string",
        "primary_keyword": "string",
        "outline_h2": ["H2", "H2", "H2"]
      },
      "linkedin_posts": [
        {
          "day": "monday",
          "hook": "string",
          "bullets": ["point", "point"],
          "hashtags": ["tag", "tag", "tag"]
        }
      ]
    }
  ]
}

RULES:
- ALL 12 weeks required
- Short text only
- Raw JSON (NO markdown, NO code blocks, NO backticks)`;

    const userPrompt = `Create 12-week content plan:

Company: ${formData.company_name}
Sector: ${formData.sector}
Size: ${formData.company_size}
Goal: ${formData.primary_goal}
Audience: ${formData.target_roles?.slice(0,2).join(', ')}
Pain: ${formData.pain_points?.slice(0,2).join(', ')}
Services: ${formData.core_services?.slice(0,2).join(', ')}
Posts/week: ${formData.posts_per_week || 3}
Language: ${formData.output_language || 'nl'}

Generate strategic plan.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 8000,
        temperature: 0.3,
        system: `${systemPrompt}\n\n${developerPrompt}`,
        messages: [
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Anthropic API error:", error);
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    let content = data.content[0]?.text;

    if (!content) {
      throw new Error("No content generated");
    }

    content = content.trim();
    if (content.startsWith("```json")) {
      content = content.replace(/^```json\n?/, "").replace(/\n?```$/, "");
    } else if (content.startsWith("```")) {
      content = content.replace(/^```\n?/, "").replace(/\n?```$/, "");
    }

    let strategyOutput;
    try {
      strategyOutput = JSON.parse(content);
    } catch (parseError) {
      console.error("Failed to parse JSON. Raw content:", content);
      console.error("Parse error:", parseError);
      throw new Error("Failed to parse generated strategy");
    }

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: planData, error: planError } = await adminSupabase
      .from("content_plans")
      .insert({
        user_id: user.id,
        company_name: formData.company_name,
        sector: formData.sector,
        company_size: formData.company_size,
        primary_goal: formData.primary_goal,
        output_language: formData.output_language || 'nl',
        strategy_depth: formData.strategy_depth || 'standard',
        full_input_json: formData,
      })
      .select()
      .single();

    if (planError) {
      console.error("Error saving plan:", planError);
      throw new Error("Failed to save content plan");
    }

    const { data: outputData, error: outputError } = await adminSupabase
      .from("content_plan_outputs")
      .insert({
        content_plan_id: planData.id,
        output_json: strategyOutput,
      })
      .select()
      .single();

    if (outputError) {
      console.error("Error saving output:", outputError);
      throw new Error("Failed to save strategy output");
    }

    return new Response(
      JSON.stringify({
        success: true,
        plan_id: planData.id,
        output_id: outputData.id,
        strategy: strategyOutput,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error generating content strategy:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to generate content strategy" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});