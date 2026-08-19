/*
  # Fix LinkedIn Cron Job with Database Function
  
  1. Changes
    - Remove previous cron job
    - Create a database function that calls the Edge Function
    - Create new cron job that calls this function
  
  2. Notes
    - Uses Supabase's environment variables properly
    - Runs every 15 minutes to process scheduled LinkedIn posts
*/

-- Remove old cron job
SELECT cron.unschedule('process-scheduled-linkedin-posts');

-- Create a function that calls the Edge Function
CREATE OR REPLACE FUNCTION process_scheduled_linkedin_posts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  supabase_url text;
  service_role_key text;
BEGIN
  -- Get the Supabase URL from the request schema or use default
  supabase_url := current_setting('request.headers', true)::json->>'x-forwarded-host';
  
  IF supabase_url IS NULL OR supabase_url = '' THEN
    -- Fallback: try to construct from common patterns
    supabase_url := 'https://' || current_setting('app.settings.project_ref', true) || '.supabase.co';
  END IF;
  
  -- For Supabase hosted projects, the service role key needs to be stored
  -- We'll use pg_net to call the function
  PERFORM net.http_post(
    url := supabase_url || '/functions/v1/process-scheduled-linkedin-posts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    )
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION process_scheduled_linkedin_posts() TO postgres;

-- Create cron job that calls the function
SELECT cron.schedule(
  'process-scheduled-linkedin-posts',
  '*/15 * * * *',
  'SELECT process_scheduled_linkedin_posts();'
);