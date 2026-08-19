import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CustomerDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  companyName: string;
  vatNumber: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
}

interface CheckoutRequest {
  customerDetails: CustomerDetails;
  generationParams: {
    targetAudience: string;
    subject: string;
    wordCount: number;
    toneOfVoice: string;
    language: string;
    contentType: 'ebook' | 'blog';
    contentGoal: 'problem-aware' | 'solution-aware' | 'product-aware';
    productUrl?: string;
    websiteUrl?: string;
    includeVisuals: boolean;
    createSocialAssets: boolean;
  };
  amount: number;
  promoCode?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const { customerDetails, generationParams, amount, promoCode }: CheckoutRequest = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let discountPercentage = 0;
    let promoCodeId = null;
    let originalAmount = amount;
    let finalAmount = amount;
    let discountAmount = 0;

    if (promoCode) {
      const { data: promoData, error: promoError } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', promoCode.toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (promoError || !promoData) {
        return new Response(
          JSON.stringify({ error: 'Ongeldige promocode' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const now = new Date();
      if (promoData.valid_from && new Date(promoData.valid_from) > now) {
        return new Response(
          JSON.stringify({ error: 'Deze promocode is nog niet geldig' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      if (promoData.valid_until && new Date(promoData.valid_until) < now) {
        return new Response(
          JSON.stringify({ error: 'Deze promocode is verlopen' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      if (promoData.usage_limit && promoData.usage_count >= promoData.usage_limit) {
        return new Response(
          JSON.stringify({ error: 'Deze promocode heeft de gebruikslimiet bereikt' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      discountPercentage = promoData.discount_percentage;
      promoCodeId = promoData.id;
      discountAmount = Math.round(amount * (discountPercentage / 100));
      finalAmount = amount - discountAmount;

      await supabase
        .from('promo_codes')
        .update({ usage_count: promoData.usage_count + 1 })
        .eq('id', promoCodeId);
    }

    const authHeader = req.headers.get("Authorization");
    let userId = null;

    if (authHeader) {
      try {
        const token = authHeader.replace("Bearer ", "");
        const { data: { user } } = await supabase.auth.getUser(token);
        userId = user?.id || null;
      } catch (error) {
        console.error("Error getting user from token:", error);
      }
    }

    let customer;
    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("*")
      .eq("email", customerDetails.email)
      .maybeSingle();

    if (existingCustomer) {
      customer = existingCustomer;
      const updateData: any = {
        first_name: customerDetails.firstName,
        last_name: customerDetails.lastName,
        phone: customerDetails.phone || null,
        company_name: customerDetails.companyName,
        vat_number: customerDetails.vatNumber,
        address: customerDetails.address,
        postal_code: customerDetails.postalCode,
        city: customerDetails.city,
        country: customerDetails.country,
        updated_at: new Date().toISOString(),
      };

      if (userId && !existingCustomer.user_id) {
        updateData.user_id = userId;
      }

      await supabase
        .from("customers")
        .update(updateData)
        .eq("id", customer.id);
    } else {
      const { data: newCustomer, error: customerError } = await supabase
        .from("customers")
        .insert({
          user_id: userId,
          email: customerDetails.email,
          first_name: customerDetails.firstName,
          last_name: customerDetails.lastName,
          phone: customerDetails.phone || null,
          company_name: customerDetails.companyName,
          vat_number: customerDetails.vatNumber,
          address: customerDetails.address,
          postal_code: customerDetails.postalCode,
          city: customerDetails.city,
          country: customerDetails.country,
        })
        .select()
        .single();

      if (customerError) throw customerError;
      customer = newCustomer;
    }

    const isTestSubject = generationParams.subject.toLowerCase() === "test";

    if (isTestSubject) {
      const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
      if (!stripeSecretKey) {
        throw new Error("Stripe secret key not configured");
      }

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_id: customer.id,
          amount: 100,
          original_amount: 100,
          discount_amount: 0,
          discount_percentage: 0,
          currency: "eur",
          status: "pending",
          payment_status: "pending",
          generation_params: generationParams,
          promo_code_id: null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const origin = req.headers.get("origin") || req.headers.get("referer")?.replace(/\/$/, "") || "https://www.write-ebooks.com";

      const checkoutSession = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${stripeSecretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          "mode": "payment",
          "customer_email": customerDetails.email,
          "line_items[0][price_data][currency]": "eur",
          "line_items[0][price_data][product_data][name]": `TEST Ebook: ${generationParams.subject}`,
          "line_items[0][price_data][product_data][description]": `Test betaling - geen AI generatie`,
          "line_items[0][price_data][unit_amount]": "100",
          "line_items[0][quantity]": "1",
          "success_url": `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
          "cancel_url": `${origin}/`,
          "metadata[order_id]": order.id,
          "metadata[customer_name]": `${customerDetails.firstName} ${customerDetails.lastName}`,
          "metadata[company_name]": customerDetails.companyName,
          "metadata[vat_number]": customerDetails.vatNumber,
          "metadata[is_test]": "true",
        }),
      });

      if (!checkoutSession.ok) {
        const error = await checkoutSession.text();
        throw new Error(`Stripe API error: ${error}`);
      }

      const session = await checkoutSession.json();

      await supabase
        .from("orders")
        .update({ stripe_session_id: session.id })
        .eq("id", order.id);

      return new Response(
        JSON.stringify({ sessionId: session.id, url: session.url }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const whitelistedEmails = ["stein@fishdigital.be"];
    const isFreeUser = whitelistedEmails.includes(customerDetails.email.toLowerCase());
    const isFreeOrder = finalAmount === 0;

    if (isFreeUser || isFreeOrder) {
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_id: customer.id,
          amount: 0,
          original_amount: finalAmount,
          discount_amount: discountAmount,
          discount_percentage: discountPercentage,
          currency: "eur",
          status: "processing",
          payment_status: "free",
          generation_params: generationParams,
          promo_code_id: promoCodeId,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      fetch(`${supabaseUrl}/functions/v1/generate-ebook`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${supabaseServiceKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: order.id,
          targetAudience: generationParams.targetAudience,
          subject: generationParams.subject,
          wordCount: generationParams.wordCount,
          toneOfVoice: generationParams.toneOfVoice,
          language: generationParams.language,
          contentType: generationParams.contentType,
          contentGoal: generationParams.contentGoal,
          productUrl: generationParams.productUrl,
          websiteUrl: generationParams.websiteUrl,
          createSocialAssets: generationParams.createSocialAssets,
          customerEmail: customerDetails.email,
          customerName: `${customerDetails.firstName} ${customerDetails.lastName}`,
        }),
      }).catch(error => {
        console.error(`Failed to trigger generation for free order ${order.id}:`, error);
      });

      const successMessage = isFreeOrder && discountPercentage === 100
        ? "Uw 100% kortingscode is toegepast! Uw ebook wordt gegenereerd en verzonden naar uw e-mail."
        : "Uw ebook wordt gegenereerd en verzonden naar uw e-mail";

      return new Response(
        JSON.stringify({
          success: true,
          message: successMessage,
          isFree: true,
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      throw new Error("Stripe secret key not configured");
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_id: customer.id,
        amount: finalAmount,
        original_amount: originalAmount,
        discount_amount: discountAmount,
        discount_percentage: discountPercentage,
        currency: "eur",
        status: "pending",
        payment_status: "pending",
        generation_params: generationParams,
        promo_code_id: promoCodeId,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    const origin = req.headers.get("origin") || req.headers.get("referer")?.replace(/\/$/, "") || "https://www.write-ebooks.com";

    const checkoutSession = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        "mode": "payment",
        "customer_email": customerDetails.email,
        "line_items[0][price_data][currency]": "eur",
        "line_items[0][price_data][product_data][name]": `Ebook: ${generationParams.subject}`,
        "line_items[0][price_data][product_data][description]": discountPercentage > 0
          ? `AI-generated ebook voor ${generationParams.targetAudience} (${discountPercentage}% korting toegepast)`
          : `AI-generated ebook voor ${generationParams.targetAudience}`,
        "line_items[0][price_data][unit_amount]": finalAmount.toString(),
        "line_items[0][quantity]": "1",
        "success_url": `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
        "cancel_url": `${origin}/`,
        "metadata[order_id]": order.id,
        "metadata[customer_name]": `${customerDetails.firstName} ${customerDetails.lastName}`,
        "metadata[company_name]": customerDetails.companyName,
        "metadata[vat_number]": customerDetails.vatNumber,
        ...(promoCode && { "metadata[promo_code]": promoCode.toUpperCase() }),
      }),
    });

    if (!checkoutSession.ok) {
      const error = await checkoutSession.text();
      throw new Error(`Stripe API error: ${error}`);
    }

    const session = await checkoutSession.json();

    await supabase
      .from("orders")
      .update({ stripe_session_id: session.id })
      .eq("id", order.id);

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error creating checkout:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to create checkout",
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