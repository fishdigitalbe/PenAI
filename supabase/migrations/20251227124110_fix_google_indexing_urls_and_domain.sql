/*
  # Fix Google Indexing URLs en Domain
  
  1. Wijzigingen
    - Update blog URL constructie om penai.be te gebruiken in plaats van ebookgenerator.ai
    - Fix cron job om dynamische Supabase URL te gebruiken
  
  2. Opmerking
    - De blog URLs moeten naar penai.be verwijzen (de echte domain)
*/

-- Update de trigger functie om de juiste domain te gebruiken
CREATE OR REPLACE FUNCTION submit_blog_to_google_indexing()
RETURNS TRIGGER AS $$
DECLARE
  blog_url text;
BEGIN
  -- Check if blog is being published
  IF (TG_OP = 'INSERT' AND NEW.status = 'published') OR 
     (TG_OP = 'UPDATE' AND OLD.status != 'published' AND NEW.status = 'published') THEN
    
    -- Construct the blog URL with correct domain
    blog_url := 'https://penai.be/blog/' || NEW.slug;
    
    -- Create log entry as pending
    INSERT INTO google_indexing_log (blog_id, url, status, request_type)
    VALUES (NEW.id, blog_url, 'pending', 'URL_UPDATED');
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verwijder oude cron job
DO $$
BEGIN
  PERFORM cron.unschedule('process-google-indexing-queue');
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

-- Maak nieuwe cron job met correcte URL
SELECT cron.schedule(
  'process-google-indexing-queue',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url', true) || '/functions/v1/process-google-indexing-queue',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key', true)
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
);
