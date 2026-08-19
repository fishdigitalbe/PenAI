import { createClient } from 'npm:@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    // Get frontend URL from environment or default
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'http://localhost:5173';

    // Handle OAuth errors
    if (error) {
      console.error('LinkedIn OAuth error:', error);
      return Response.redirect(
        `${frontendUrl}/linkedin-settings?error=${encodeURIComponent(error)}`,
        302
      );
    }

    if (!code || !state) {
      return Response.redirect(
        `${frontendUrl}/linkedin-settings?error=missing_parameters`,
        302
      );
    }

    // Parse state to get user ID (state should be JWT token)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify JWT token from state
    const { data: { user }, error: authError } = await supabase.auth.getUser(state);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return Response.redirect(
        `${frontendUrl}/linkedin-settings?error=invalid_session`,
        302
      );
    }

    // Exchange authorization code for access token
    const linkedInClientId = Deno.env.get('LINKEDIN_CLIENT_ID');
    const linkedInClientSecret = Deno.env.get('LINKEDIN_CLIENT_SECRET');
    const redirectUri = `${supabaseUrl}/functions/v1/linkedin-oauth-callback`;

    if (!linkedInClientId || !linkedInClientSecret) {
      throw new Error('LinkedIn credentials not configured');
    }

    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: linkedInClientId,
        client_secret: linkedInClientSecret,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('LinkedIn token exchange failed:', errorText);
      return Response.redirect(
        `${frontendUrl}/linkedin-settings?error=token_exchange_failed`,
        302
      );
    }

    const tokenData = await tokenResponse.json();
    const { access_token, expires_in, refresh_token, scope } = tokenData;

    // Fetch LinkedIn member info to get person_id
    let personId = null;
    try {
      const meResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      });

      if (meResponse.ok) {
        const meData = await meResponse.json();
        personId = meData.sub;
      }
    } catch (error) {
      console.error('Failed to fetch LinkedIn user info:', error);
    }

    // Calculate expiry time
    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    // Store token in database (upsert to handle reconnections)
    const { error: dbError } = await supabase
      .from('linkedin_oauth_tokens')
      .upsert(
        {
          user_id: user.id,
          access_token,
          refresh_token: refresh_token || null,
          expires_at: expiresAt,
          scope: scope || 'w_member_social',
          person_id: personId,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      );

    if (dbError) {
      console.error('Database error:', dbError);
      return Response.redirect(
        `${frontendUrl}/linkedin-settings?error=database_error`,
        302
      );
    }

    // Success! Redirect back to settings page
    return Response.redirect(
      `${frontendUrl}/linkedin-settings?success=true`,
      302
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'http://localhost:5173';
    return Response.redirect(
      `${frontendUrl}/linkedin-settings?error=unexpected_error`,
      302
    );
  }
});