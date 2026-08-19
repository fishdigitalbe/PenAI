import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all pending indexing requests
    const { data: pendingRequests, error: fetchError } = await supabase
      .from('google_indexing_log')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(10); // Process max 10 at a time to avoid timeouts

    if (fetchError) {
      console.error('Error fetching pending requests:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch pending requests', details: fetchError }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!pendingRequests || pendingRequests.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No pending indexing requests', processed: 0 }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const results = [];

    // Process each pending request
    for (const request of pendingRequests) {
      try {
        // Call the submit-to-google-indexing function
        const functionUrl = `${supabaseUrl}/functions/v1/submit-to-google-indexing`;
        
        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            url: request.url,
            type: request.request_type,
          }),
        });

        const responseData = await response.json();

        if (response.ok && responseData.success) {
          // Update log entry to success
          await supabase
            .from('google_indexing_log')
            .update({
              status: 'success',
              response_data: responseData.result,
              submitted_at: new Date().toISOString(),
            })
            .eq('id', request.id);

          results.push({
            id: request.id,
            url: request.url,
            status: 'success',
          });

          console.log(`Successfully submitted ${request.url} to Google`);
        } else {
          // Update log entry to failed
          await supabase
            .from('google_indexing_log')
            .update({
              status: 'failed',
              error_message: responseData.error || 'Unknown error',
              response_data: responseData,
              submitted_at: new Date().toISOString(),
            })
            .eq('id', request.id);

          results.push({
            id: request.id,
            url: request.url,
            status: 'failed',
            error: responseData.error,
          });

          console.error(`Failed to submit ${request.url}:`, responseData.error);
        }
      } catch (error) {
        // Update log entry to failed
        await supabase
          .from('google_indexing_log')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            submitted_at: new Date().toISOString(),
          })
          .eq('id', request.id);

        results.push({
          id: request.id,
          url: request.url,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        console.error(`Error processing ${request.url}:`, error);
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Processing complete',
        processed: results.length,
        results: results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in process-google-indexing-queue:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});