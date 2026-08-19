/*
  # Add LinkedIn Post Tracking to Blogs

  1. Changes
    - Add `linkedin_post_id` column to `blogs` table to track published LinkedIn posts
    - Add `linkedin_post_url` column to store the URL of the published LinkedIn post
    - Add `linkedin_published_at` timestamp to track when the post was published to LinkedIn
  
  2. Purpose
    - Track which blogs have been shared to LinkedIn
    - Store LinkedIn post ID and URL for reference
    - Enable tracking of LinkedIn post publication dates
*/

-- Add LinkedIn tracking columns to blogs table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blogs' AND column_name = 'linkedin_post_id'
  ) THEN
    ALTER TABLE blogs ADD COLUMN linkedin_post_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blogs' AND column_name = 'linkedin_post_url'
  ) THEN
    ALTER TABLE blogs ADD COLUMN linkedin_post_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blogs' AND column_name = 'linkedin_published_at'
  ) THEN
    ALTER TABLE blogs ADD COLUMN linkedin_published_at timestamptz;
  END IF;
END $$;

-- Add index for LinkedIn post lookup
CREATE INDEX IF NOT EXISTS idx_blogs_linkedin_post_id ON blogs(linkedin_post_id);
