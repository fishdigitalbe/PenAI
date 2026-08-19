/*
  # Add Cron Job for Google Indexing
  
  1. Wijzigingen
    - Voeg pg_cron job toe die elke minuut de process-google-indexing-queue function aanroept
    - Deze job verwerkt pending Google Indexing requests automatisch
  
  2. Opmerking
    - pg_cron extension moet al geïnstalleerd zijn
    - De job roept de Supabase Edge Function aan via HTTP
*/

-- Zorg ervoor dat pg_cron extension bestaat
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Verwijder bestaande job als die bestaat (negeer errors als job niet bestaat)
DO $$
BEGIN
  PERFORM cron.unschedule('process-google-indexing-queue');
EXCEPTION
  WHEN OTHERS THEN
    NULL; -- Negeer errors als job niet bestaat
END $$;

-- Voeg cron job toe die elke minuut draait
SELECT cron.schedule(
  'process-google-indexing-queue',
  '* * * * *', -- Elke minuut
  $$
  SELECT
    net.http_post(
      url := 'https://kkrdtrxnlaqhkoxivckp.supabase.co/functions/v1/process-google-indexing-queue',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key', true)
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);