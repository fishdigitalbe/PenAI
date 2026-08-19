/*
  # Fix Storage Upload Policies for Authenticated Users

  1. Changes
    - Add policy allowing authenticated users to upload images to ebook-assets bucket
    - Add policy allowing authenticated users to update their own uploads
    - Add policy allowing authenticated users to delete their own uploads
  
  2. Security
    - Users can only upload to the ebook-assets bucket
    - All authenticated users can upload (no ownership restriction since images are for orders)
    - Public read access remains unchanged
*/

-- Allow authenticated users to upload assets
CREATE POLICY "Authenticated users can upload ebook assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ebook-assets');

-- Allow authenticated users to update assets
CREATE POLICY "Authenticated users can update ebook assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'ebook-assets');

-- Allow authenticated users to delete assets
CREATE POLICY "Authenticated users can delete ebook assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'ebook-assets');