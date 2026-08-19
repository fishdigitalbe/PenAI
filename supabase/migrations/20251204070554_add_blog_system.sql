/*
  # Blog System

  1. Nieuwe Tabellen
    - `blogs`
      - `id` (uuid, primary key)
      - `title` (text) - Blog titel
      - `slug` (text, unique) - URL-vriendelijke slug
      - `content` (text) - Volledige blog content in HTML
      - `excerpt` (text) - Korte samenvatting voor previews
      - `featured_image_url` (text, nullable) - URL van hoofdafbeelding
      - `author_email` (text) - Email van auteur
      - `status` (text) - draft of published
      - `published_at` (timestamptz, nullable) - Publicatiedatum
      - `created_at` (timestamptz) - Aanmaakdatum
      - `updated_at` (timestamptz) - Laatste wijziging
      - `meta_description` (text, nullable) - SEO meta description
      - `tags` (text array, nullable) - Tags voor categorisatie

  2. Security
    - Enable RLS on `blogs` table
    - Iedereen kan gepubliceerde blogs lezen
    - Alleen stein@fishdigital.be kan blogs maken/bewerken/verwijderen
*/

-- Blogs tabel
CREATE TABLE IF NOT EXISTS blogs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  content text NOT NULL,
  excerpt text NOT NULL,
  featured_image_url text,
  author_email text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  meta_description text,
  tags text[] DEFAULT ARRAY[]::text[]
);

-- Index voor betere prestaties
CREATE INDEX IF NOT EXISTS idx_blogs_slug ON blogs(slug);
CREATE INDEX IF NOT EXISTS idx_blogs_status ON blogs(status);
CREATE INDEX IF NOT EXISTS idx_blogs_published_at ON blogs(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blogs_author_email ON blogs(author_email);

-- Enable RLS
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

-- Iedereen kan gepubliceerde blogs lezen
CREATE POLICY "Anyone can view published blogs"
  ON blogs FOR SELECT
  USING (status = 'published');

-- stein@fishdigital.be kan alle blogs zien
CREATE POLICY "Admin can view all blogs"
  ON blogs FOR SELECT
  TO authenticated
  USING (auth.jwt() -> 'email' = '"stein@fishdigital.be"');

-- stein@fishdigital.be kan blogs aanmaken
CREATE POLICY "Admin can create blogs"
  ON blogs FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() -> 'email' = '"stein@fishdigital.be"');

-- stein@fishdigital.be kan blogs bijwerken
CREATE POLICY "Admin can update blogs"
  ON blogs FOR UPDATE
  TO authenticated
  USING (auth.jwt() -> 'email' = '"stein@fishdigital.be"')
  WITH CHECK (auth.jwt() -> 'email' = '"stein@fishdigital.be"');

-- stein@fishdigital.be kan blogs verwijderen
CREATE POLICY "Admin can delete blogs"
  ON blogs FOR DELETE
  TO authenticated
  USING (auth.jwt() -> 'email' = '"stein@fishdigital.be"');

-- Functie om updated_at automatisch bij te werken
CREATE OR REPLACE FUNCTION update_blogs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger om updated_at automatisch bij te werken
DROP TRIGGER IF EXISTS trigger_update_blogs_updated_at ON blogs;
CREATE TRIGGER trigger_update_blogs_updated_at
  BEFORE UPDATE ON blogs
  FOR EACH ROW
  EXECUTE FUNCTION update_blogs_updated_at();
