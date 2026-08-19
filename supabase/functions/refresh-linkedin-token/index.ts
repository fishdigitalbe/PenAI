import { createClient } from 'npm:@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Get user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current token from database
    const { data: tokenData, error: fetchError } = await supabase
      .from('linkedin_oauth_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (fetchError || !tokenData) {
      return new Response(
        JSON.stringify({ error: 'No LinkedIn token found. Please connect your LinkedIn account.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if token needs refresh
    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);
    
    if (expiresAt > now) {
      // Token is still valid
      return new Response(
        JSON.stringify({ message: 'Token is still valid', expires_at: tokenData.expires_at }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // LinkedIn doesn't always provide refresh tokens
    // If we don't have one, user needs to re-authenticate
    if (!tokenData.refresh_token) {
      return new Response(
        JSON.stringify({ 
          error: 'Token expired and no refresh token available. Please reconnect your LinkedIn account.',
          needs_reconnect: true 
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Refresh the token
    const linkedInClientId = Deno.env.get('LINKEDIN_CLIENT_ID');
    const linkedInClientSecret = Deno.env.get('LINKEDIN_CLIENT_SECRET');

    if (!linkedInClientId || !linkedInClientSecret) {
      throw new Error('LinkedIn credentials not configured');
    }

    const refreshResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: tokenData.refresh_token,
        client_id: linkedInClientId,
        client_secret: linkedInClientSecret,
      }),
    });

    if (!refreshResponse.ok) {
      const errorText = await refreshResponse.text();
      console.error('LinkedIn token refresh failed:', errorText);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to refresh token. Please reconnect your LinkedIn account.',
          needs_reconnect: true 
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const refreshData = await refreshResponse.json();
    const { access_token, expires_in, refresh_token, scope } = refreshData;

    // Calculate new expiry time
    const newExpiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    // Update token in database
    const { error: updateError } = await supabase
      .from('linkedin_oauth_tokens')
      .update({
        access_token,
        refresh_token: refresh_token || tokenData.refresh_token,
        expires_at: newExpiresAt,
        scope: scope || tokenData.scope,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Database update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update token' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        message: 'Token refreshed successfully',
        expires_at: newExpiresAt 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});