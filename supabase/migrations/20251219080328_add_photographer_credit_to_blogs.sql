/*
  # Add photographer credit to blogs table

  1. Changes
    - Add `photographer_name` column to store the photographer's name
    - Add `photographer_url` column to store the photographer's profile URL
  
  2. Notes
    - These fields are optional and will be populated for images from Pexels
    - Used to provide proper attribution for stock photos
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blogs' AND column_name = 'photographer_name'
  ) THEN
    ALTER TABLE blogs ADD COLUMN photographer_name text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blogs' AND column_name = 'photographer_url'
  ) THEN
    ALTER TABLE blogs ADD COLUMN photographer_url text;
  END IF;
END $$;