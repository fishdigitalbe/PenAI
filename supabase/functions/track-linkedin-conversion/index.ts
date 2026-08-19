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
  conversionValue: number;
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
    const { orderId, userId, email, conversionValue, eventType = 'PURCHASE' }: ConversionRequest = await req.json();

    if (!orderId || !userId || !email) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: linkedinSettings, error: settingsError } = await supabase
      .from('linkedin_settings')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (settingsError || !linkedinSettings) {
      console.log('No active LinkedIn settings found for user:', userId);
      return new Response(
        JSON.stringify({ message: 'No active LinkedIn tracking configured' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const hashedEmail = await hashEmail(email);
    const conversionTimestamp = Date.now();

    const conversionData = {
      conversion: linkedinSettings.conversion_id,
      conversionHappenedAt: conversionTimestamp,
      eventId: `${orderId}_${conversionTimestamp}`,
      user: {
        userIds: [
          {
            idType: 'SHA256_EMAIL',
            idValue: hashedEmail,
          },
        ],
      },
      conversionValue: {
        currencyCode: 'EUR',
        amount: conversionValue.toString(),
      },
    };

    console.log('Sending conversion to LinkedIn:', {
      conversion_id: linkedinSettings.conversion_id,
      order_id: orderId,
      event_type: eventType,
    });

    const linkedinResponse = await fetch(
      'https://api.linkedin.com/v2/conversionEvents',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${linkedinSettings.access_token}`,
          'Content-Type': 'application/json',
          'LinkedIn-Version': '202401',
        },
        body: JSON.stringify(conversionData),
      }
    );

    const responseText = await linkedinResponse.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    const logData = {
      user_id: userId,
      order_id: orderId,
      conversion_id: linkedinSettings.conversion_id,
      event_type: eventType,
      conversion_value: conversionValue,
      status: linkedinResponse.ok ? 'success' : 'failed',
      response_data: responseData,
      error_message: linkedinResponse.ok ? null : `HTTP ${linkedinResponse.status}: ${responseText}`,
    };

    await supabase.from('linkedin_conversion_logs').insert(logData);

    if (!linkedinResponse.ok) {
      console.error('LinkedIn API error:', responseData);
      return new Response(
        JSON.stringify({
          error: 'LinkedIn API error',
          details: responseData,
          status: linkedinResponse.status,
        }),
        {
          status: linkedinResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Successfully tracked LinkedIn conversion:', orderId);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Conversion tracked successfully',
        conversionId: linkedinSettings.conversion_id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error tracking LinkedIn conversion:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function hashEmail(email: string): Promise<string> {
  const normalized = email.trim().toLowerCase();
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
