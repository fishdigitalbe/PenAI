/*
  # Fix LinkedIn Cron Job Configuration
  
  1. Changes
    - Remove old cron job that uses unconfigured settings
    - Create new cron job that uses Supabase's vault for credentials
    - Use pg_net extension for HTTP requests
  
  2. Notes
    - The cron job will now work properly with Supabase's environment
    - Runs every 15 minutes to process scheduled LinkedIn posts
*/

-- Remove old cron job
SELECT cron.unschedule('process-scheduled-linkedin-posts');

-- Create new cron job using Supabase environment variables
-- Note: In Supabase, we can use the pg_net extension which automatically has access to environment variables
SELECT cron.schedule(
  'process-scheduled-linkedin-posts',
  '*/15 * * * *',
  $$
  SELECT
    net.http_post(
      url := (SELECT value FROM pg_settings WHERE name = 'app.base_url') || '/functions/v1/process-scheduled-linkedin-posts',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
      )
    );
  $$
);