/*
  # Create Storage Bucket for Generated Assets

  1. Storage Setup
    - Create a public bucket called 'ebook-assets' for storing generated images and social media assets
    - Enable public access for easy retrieval
    - Set up appropriate file size limits

  2. Changes to Orders Table
    - Add 'assets_urls' column to store URLs of generated visuals and social media assets
    - This will be a JSONB field containing:
      - visuals: array of image URLs for the ebook
      - socialAssets: array of social media asset URLs

  3. Security
    - Bucket is public for read access
    - Write access through edge functions only
*/

-- Create the storage bucket for ebook assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ebook-assets',
  'ebook-assets',
  true,
  10485760,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Add assets_urls column to orders table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'assets_urls'
  ) THEN
    ALTER TABLE orders ADD COLUMN assets_urls jsonb;
  END IF;
END $$;

-- Create storage policies for public read access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public read access for ebook assets'
  ) THEN
    CREATE POLICY "Public read access for ebook assets"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'ebook-assets');
  END IF;
END $$;

-- Allow service role to insert/update assets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Service role can upload ebook assets'
  ) THEN
    CREATE POLICY "Service role can upload ebook assets"
    ON storage.objects FOR INSERT
    TO service_role
    WITH CHECK (bucket_id = 'ebook-assets');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Service role can update ebook assets'
  ) THEN
    CREATE POLICY "Service role can update ebook assets"
    ON storage.objects FOR UPDATE
    TO service_role
    USING (bucket_id = 'ebook-assets');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Service role can delete ebook assets'
  ) THEN
    CREATE POLICY "Service role can delete ebook assets"
    ON storage.objects FOR DELETE
    TO service_role
    USING (bucket_id = 'ebook-assets');
  END IF;
END $$;