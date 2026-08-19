/*
  # Disable Automatic Google Indexing
  
  1. Wijzigingen
    - Schakel de automatic trigger uit die indexing probeert te starten
    - Behoud de logging tabel voor handmatige submissies later
    - Stop de cron job
  
  2. Reden
    - Google Service Account credentials zijn nog niet geconfigureerd
    - Dit voorkomt 5xx errors in Google Search Console
*/

-- Verwijder de trigger die automatic indexing probeert
DROP TRIGGER IF EXISTS trigger_submit_blog_to_google ON blogs;

-- Verwijder de cron job
DO $$
BEGIN
  PERFORM cron.unschedule('process-google-indexing-queue');
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

-- Clear alle pending requests om verwarring te voorkomen
UPDATE google_indexing_log 
SET status = 'failed', 
    error_message = 'Google Service Account credentials not configured yet'
WHERE status = 'pending';
