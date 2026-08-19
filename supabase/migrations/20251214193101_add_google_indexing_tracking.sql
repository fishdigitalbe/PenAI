/*
  # Google Indexing Tracking
  
  1. Nieuwe Tabel
    - `google_indexing_log`
      - `id` (uuid, primary key) - Unieke identifier
      - `blog_id` (uuid, foreign key) - Referentie naar blogs tabel
      - `url` (text) - De volledige URL die is ingediend
      - `status` (text) - Status: pending, success, failed
      - `request_type` (text) - Type: URL_UPDATED of URL_DELETED
      - `response_data` (jsonb, nullable) - Response van Google API
      - `error_message` (text, nullable) - Foutmelding bij failure
      - `submitted_at` (timestamptz) - Wanneer ingediend bij Google
      - `created_at` (timestamptz) - Wanneer log entry aangemaakt
  
  2. Functie en Trigger
    - Functie die automatisch Google Indexing API aanroept wanneer blog gepubliceerd wordt
    - Trigger die deze functie activeert bij INSERT/UPDATE van blogs
  
  3. Security
    - Enable RLS op google_indexing_log
    - Alleen admins kunnen logs bekijken
*/

-- Google Indexing Log tabel
CREATE TABLE IF NOT EXISTS google_indexing_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_id uuid REFERENCES blogs(id) ON DELETE CASCADE,
  url text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  request_type text NOT NULL DEFAULT 'URL_UPDATED' CHECK (request_type IN ('URL_UPDATED', 'URL_DELETED')),
  response_data jsonb,
  error_message text,
  submitted_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Indexen voor betere prestaties
CREATE INDEX IF NOT EXISTS idx_google_indexing_log_blog_id ON google_indexing_log(blog_id);
CREATE INDEX IF NOT EXISTS idx_google_indexing_log_status ON google_indexing_log(status);
CREATE INDEX IF NOT EXISTS idx_google_indexing_log_submitted_at ON google_indexing_log(submitted_at DESC);

-- Enable RLS
ALTER TABLE google_indexing_log ENABLE ROW LEVEL SECURITY;

-- Alleen admins kunnen logs bekijken
CREATE POLICY "Admins can view indexing logs"
  ON google_indexing_log
  FOR SELECT
  TO authenticated
  USING (is_user_admin());

-- Functie om blog URL bij Google in te dienen
CREATE OR REPLACE FUNCTION submit_blog_to_google_indexing()
RETURNS TRIGGER AS $$
DECLARE
  blog_url text;
  function_url text;
  supabase_url text;
  anon_key text;
  http_response jsonb;
BEGIN
  -- Check if blog is being published (status changed to 'published' or newly inserted as published)
  IF (TG_OP = 'INSERT' AND NEW.status = 'published') OR 
     (TG_OP = 'UPDATE' AND OLD.status != 'published' AND NEW.status = 'published') THEN
    
    -- Construct the blog URL
    blog_url := 'https://ebookgenerator.ai/blog/' || NEW.slug;
    
    -- Get Supabase URL from environment (will be set in function context)
    supabase_url := current_setting('app.settings.supabase_url', true);
    anon_key := current_setting('app.settings.supabase_anon_key', true);
    
    IF supabase_url IS NULL THEN
      supabase_url := 'https://kkrdtrxnlaqhkoxivckp.supabase.co';
    END IF;
    
    function_url := supabase_url || '/functions/v1/submit-to-google-indexing';
    
    -- Create log entry as pending
    INSERT INTO google_indexing_log (blog_id, url, status, request_type)
    VALUES (NEW.id, blog_url, 'pending', 'URL_UPDATED');
    
    -- Note: The actual HTTP call will be handled by a separate scheduled job or client-side call
    -- Database triggers cannot make HTTP requests directly in Postgres
    -- This log entry will be picked up by a scheduled function
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger om functie aan te roepen wanneer blog gepubliceerd wordt
DROP TRIGGER IF EXISTS trigger_submit_blog_to_google ON blogs;
CREATE TRIGGER trigger_submit_blog_to_google
  AFTER INSERT OR UPDATE ON blogs
  FOR EACH ROW
  EXECUTE FUNCTION submit_blog_to_google_indexing();