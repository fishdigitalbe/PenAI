/*
  # Fix Google Indexing Cron Job
  
  1. Wijzigingen
    - Installeer pg_net extension (nodig voor HTTP requests vanuit cron)
    - Herstart de cron job met correcte configuratie
  
  2. Opmerking
    - De cron job maakt gebruik van pg_net.http_post voor het aanroepen van edge functions
*/

-- Installeer pg_net extension
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Verwijder bestaande job
DO $$
BEGIN
  PERFORM cron.unschedule('process-google-indexing-queue');
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

-- Maak nieuwe cron job aan die elke minuut draait
SELECT cron.schedule(
  'process-google-indexing-queue',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://kkrdtrxnlaqhkoxivckp.supabase.co/functions/v1/process-google-indexing-queue',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key', true)
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
);
