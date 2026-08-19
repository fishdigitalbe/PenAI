import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

interface ConversionRequest {
  orderId: string;
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  conversionValue: number;
  currency?: string;
  eventType?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const {
      orderId,
      userId,
      email,
      firstName,
      lastName,
      phone,
      city,
      country,
      postalCode,
      conversionValue,
      currency = 'EUR',
      eventType = 'Purchase',
    }: ConversionRequest = await req.json();

    if (!orderId || !userId || !email) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: metaSettings, error: settingsError } = await supabase
      .from('meta_settings')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (settingsError || !metaSettings) {
      console.log('No active Meta settings found for user:', userId);
      return new Response(
        JSON.stringify({ message: 'No active Meta tracking configured' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const hashedEmail = await hashSHA256(email);
    const eventTime = Math.floor(Date.now() / 1000);
    const eventId = `${orderId}_${eventTime}`;

    const userData: any = {
      em: hashedEmail,
    };

    if (firstName) userData.fn = await hashSHA256(firstName.toLowerCase());
    if (lastName) userData.ln = await hashSHA256(lastName.toLowerCase());
    if (phone) userData.ph = await hashSHA256(phone.replace(/\D/g, ''));
    if (city) userData.ct = await hashSHA256(city.toLowerCase());
    if (country) userData.country = await hashSHA256(country.toLowerCase());
    if (postalCode) userData.zp = await hashSHA256(postalCode.toLowerCase());

    const conversionData = {
      data: [
        {
          event_name: eventType,
          event_time: eventTime,
          event_id: eventId,
          event_source_url: 'https://penai.be',
          action_source: 'website',
          user_data: userData,
          custom_data: {
            currency: currency,
            value: conversionValue,
          },
        },
      ],
    };

    if (metaSettings.test_event_code) {
      (conversionData as any).test_event_code = metaSettings.test_event_code;
    }

    console.log('Sending conversion to Meta:', {
      pixel_id: metaSettings.pixel_id,
      order_id: orderId,
      event_type: eventType,
      event_id: eventId,
    });

    const metaApiUrl = `https://graph.facebook.com/v18.0/${metaSettings.pixel_id}/events`;
    const metaResponse = await fetch(metaApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...conversionData,
        access_token: metaSettings.access_token,
      }),
    });

    const responseText = await metaResponse.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    const logData = {
      user_id: userId,
      order_id: orderId,
      pixel_id: metaSettings.pixel_id,
      event_type: eventType,
      conversion_value: conversionValue,
      status: metaResponse.ok ? 'success' : 'failed',
      response_data: responseData,
      error_message: metaResponse.ok ? null : `HTTP ${metaResponse.status}: ${responseText}`,
    };

    await supabase.from('meta_conversion_logs').insert(logData);

    if (!metaResponse.ok) {
      console.error('Meta API error:', responseData);
      return new Response(
        JSON.stringify({
          error: 'Meta API error',
          details: responseData,
          status: metaResponse.status,
        }),
        {
          status: metaResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Successfully tracked Meta conversion:', orderId);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Conversion tracked successfully',
        pixelId: metaSettings.pixel_id,
        eventId: eventId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error tracking Meta conversion:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function hashSHA256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
