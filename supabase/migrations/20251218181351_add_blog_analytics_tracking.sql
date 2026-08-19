/*
  # Blog Analytics Tracking

  1. Nieuwe Kolommen in blogs table
    - `ai_model` (text, nullable) - Het AI model gebruikt voor generatie (bijv. gpt-4o-mini, claude-3-5-sonnet)
    - `views_count` (integer) - Totaal aantal views (voor snelle display)

  2. Nieuwe Tabel: blog_views
    - `id` (uuid, primary key)
    - `blog_id` (uuid, foreign key) - Referentie naar blogs table
    - `viewed_at` (timestamptz) - Tijdstip van de view
    - `ip_hash` (text, nullable) - Gehashte IP voor analytics (optioneel)
    - `user_agent` (text, nullable) - Browser info (optioneel)
    
  3. Indexes
    - Index op blog_id voor snelle queries
    - Index op viewed_at voor tijdgebaseerde analytics

  4. Security
    - Enable RLS on blog_views
    - Iedereen kan views registreren (INSERT)
    - Alleen admin kan view statistics zien (SELECT)
*/

-- Voeg kolommen toe aan blogs table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blogs' AND column_name = 'ai_model'
  ) THEN
    ALTER TABLE blogs ADD COLUMN ai_model text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blogs' AND column_name = 'views_count'
  ) THEN
    ALTER TABLE blogs ADD COLUMN views_count integer DEFAULT 0 NOT NULL;
  END IF;
END $$;

-- Maak blog_views table aan
CREATE TABLE IF NOT EXISTS blog_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_id uuid NOT NULL REFERENCES blogs(id) ON DELETE CASCADE,
  viewed_at timestamptz DEFAULT now() NOT NULL,
  ip_hash text,
  user_agent text
);

-- Indexes voor betere performance
CREATE INDEX IF NOT EXISTS idx_blog_views_blog_id ON blog_views(blog_id);
CREATE INDEX IF NOT EXISTS idx_blog_views_viewed_at ON blog_views(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_blogs_views_count ON blogs(views_count DESC);

-- Enable RLS op blog_views
ALTER TABLE blog_views ENABLE ROW LEVEL SECURITY;

-- Iedereen kan views registreren (anoniem en authenticated)
CREATE POLICY "Anyone can register blog views"
  ON blog_views FOR INSERT
  WITH CHECK (true);

-- Alleen admin kan view statistics zien
CREATE POLICY "Admin can view blog statistics"
  ON blog_views FOR SELECT
  TO authenticated
  USING (auth.jwt() -> 'email' = '"stein@fishdigital.be"');

-- Functie om views_count automatisch bij te werken
CREATE OR REPLACE FUNCTION increment_blog_views()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE blogs
  SET views_count = views_count + 1
  WHERE id = NEW.blog_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger om views_count automatisch bij te werken bij elke nieuwe view
DROP TRIGGER IF EXISTS trigger_increment_blog_views ON blog_views;
CREATE TRIGGER trigger_increment_blog_views
  AFTER INSERT ON blog_views
  FOR EACH ROW
  EXECUTE FUNCTION increment_blog_views();