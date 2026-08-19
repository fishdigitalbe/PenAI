import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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
    const body = await req.json();
    console.log("Received request body:", body);

    const { orderId } = body;

    if (!orderId) {
      throw new Error("Order ID is required");
    }

    console.log("Looking for order with ID:", orderId, "Type:", typeof orderId);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: {
        schema: 'public'
      }
    });

    const { data: orderCheck, error: checkError } = await supabase
      .from("orders")
      .select("id, customer_id, status, generation_params")
      .eq("id", orderId)
      .maybeSingle();

    console.log("Direct order check:", { found: !!orderCheck, error: checkError });

    if (checkError) {
      console.error("Order check error:", checkError);
      throw new Error(`Database error: ${checkError.message}`);
    }

    if (!orderCheck) {
      throw new Error(`Order not found for ID: ${orderId}`);
    }

    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("email, full_name")
      .eq("id", orderCheck.customer_id)
      .maybeSingle();

    if (customerError) {
      console.error("Customer fetch error:", customerError);
    }

    const order = {
      ...orderCheck,
      customers: customer
    };

    console.log("Order found, updating status to processing");

    await supabase
      .from("orders")
      .update({ status: "processing" })
      .eq("id", orderId);

    const cleanedParams = {
      orderId: orderId,
      targetAudience: order.generation_params?.targetAudience || 'general',
      subject: order.generation_params?.subject || 'General Topic',
      wordCount: order.generation_params?.wordCount || 5000,
      toneOfVoice: order.generation_params?.toneOfVoice || 'professional',
      language: order.generation_params?.language || 'nl',
      contentType: order.generation_params?.contentType || 'ebook',
      contentGoal: order.generation_params?.contentGoal || 'problem-aware',
      productUrl: order.generation_params?.productUrl,
      websiteUrl: order.generation_params?.websiteUrl,
      createSocialAssets: order.generation_params?.createSocialAssets || false,
      customerEmail: customer?.email,
      customerName: customer?.full_name,
    };

    console.log("Cleaned params for generation:", JSON.stringify(cleanedParams, null, 2));

    const generateUrl = `${supabaseUrl}/functions/v1/generate-ebook`;
    console.log("Calling generate-ebook at:", generateUrl);

    const generateResponse = await fetch(generateUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${supabaseServiceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cleanedParams),
    });

    console.log("Generate ebook response status:", generateResponse.status);

    if (!generateResponse.ok) {
      const errorText = await generateResponse.text();
      console.error("Generate ebook error response:", errorText);

      await supabase
        .from("orders")
        .update({ status: "failed" })
        .eq("id", orderId);

      throw new Error(`Generation failed: ${errorText}`);
    }

    const result = await generateResponse.json();
    console.log("Generation request initiated successfully");

    return new Response(
      JSON.stringify({ success: true, message: "Order retry started" }),
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
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});