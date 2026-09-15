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
      .select("email, full_name, first_name")
      .eq("id", orderCheck.customer_id)
      .maybeSingle();

    if (customerError) {
      console.error("Customer fetch error:", customerError);
    }

    console.log("Order found, updating status to processing");

    await supabase
      .from("orders")
      .update({ status: "processing" })
      .eq("id", orderId);

    const cleanedParams = {
      orderId: orderId,
      targetAudience: orderCheck.generation_params?.targetAudience || 'general',
      subject: orderCheck.generation_params?.subject || 'General Topic',
      wordCount: orderCheck.generation_params?.wordCount || 5000,
      toneOfVoice: orderCheck.generation_params?.toneOfVoice || 'professional',
      language: orderCheck.generation_params?.language || 'nl',
      contentType: orderCheck.generation_params?.contentType || 'ebook',
      contentGoal: orderCheck.generation_params?.contentGoal || 'problem-aware',
      productUrl: orderCheck.generation_params?.productUrl,
      websiteUrl: orderCheck.generation_params?.websiteUrl,
      createSocialAssets: orderCheck.generation_params?.createSocialAssets || false,
      customerEmail: customer?.email,
      customerName: customer?.full_name,
    };

    console.log("Cleaned params for generation:", JSON.stringify(cleanedParams, null, 2));

    const generateUrl = `${supabaseUrl}/functions/v1/generate-ebook`;
    console.log("Calling generate-ebook at:", generateUrl);

    // Fire and forget - the full flow runs async like the webhook does
    fetch(generateUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${supabaseServiceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cleanedParams),
    }).then(async (ebookResponse) => {
      if (!ebookResponse.ok) {
        throw new Error(`Ebook generation failed: ${await ebookResponse.text()}`);
      }

      const ebookResult = await ebookResponse.json();

      await supabase
        .from('orders')
        .update({
          generated_content: {
            title: orderCheck.generation_params.subject,
            wordCount: ebookResult.wordCount,
            chapters: ebookResult.chapters,
          },
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      console.info(`Ebook generation completed for order: ${orderId}`);

      // Generate PDF
      let pdfUrl = null;
      try {
        const pdfResponse = await fetch(`${supabaseUrl}/functions/v1/generate-pdf`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            orderId: orderId,
            title: orderCheck.generation_params.subject,
            subject: orderCheck.generation_params.subject,
            chapters: ebookResult.chapters,
          }),
        });

        if (pdfResponse.ok) {
          const pdfData = await pdfResponse.json();
          pdfUrl = pdfData.pdfUrl;
          console.info(`PDF generated successfully: ${pdfUrl}`);
        } else {
          console.error('Failed to generate PDF:', await pdfResponse.text());
        }
      } catch (pdfError) {
        console.error('Error generating PDF:', pdfError);
      }

      // Send notification email
      try {
        await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            email: customer?.email,
            firstName: customer?.first_name || customer?.full_name || '',
            subject: orderCheck.generation_params.subject,
            orderId: orderId,
            pdfUrl: pdfUrl,
          }),
        });
        console.info(`Notification email sent for order: ${orderId}`);
      } catch (emailError) {
        console.error('Error sending notification email:', emailError);
      }
    }).catch(async (error) => {
      console.error('Error during retry ebook generation:', error);
      await supabase
        .from('orders')
        .update({ status: 'failed' })
        .eq('id', orderId);
    });

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
