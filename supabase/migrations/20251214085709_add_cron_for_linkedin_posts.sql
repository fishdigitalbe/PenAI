/*
  # Add Automatic Scheduling for LinkedIn Posts
  
  1. Changes
    - Enable pg_cron extension
    - Create a cron job that runs every 15 minutes to process scheduled LinkedIn posts
  
  2. Notes
    - The cron job will check for pending posts and publish them at their scheduled time
    - Runs every 15 minutes to ensure timely posting
*/

-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;

-- Create a cron job that runs every 15 minutes
SELECT cron.schedule(
  'process-scheduled-linkedin-posts',
  '*/15 * * * *',
  $$
  SELECT
    net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/process-scheduled-linkedin-posts',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      )
    );
  $$
);