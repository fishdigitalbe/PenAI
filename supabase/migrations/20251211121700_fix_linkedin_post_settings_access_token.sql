/*
  # Fix LinkedIn Post Settings Table

  1. Changes
    - Make access_token nullable in linkedin_post_settings
    - This field is not used anymore since we use linkedin_oauth_tokens instead

  2. Notes
    - The publish-to-linkedin function uses the token from linkedin_oauth_tokens
    - The access_token field in linkedin_post_settings is redundant
*/

-- Make access_token nullable
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'linkedin_post_settings' AND column_name = 'access_token'
  ) THEN
    ALTER TABLE linkedin_post_settings ALTER COLUMN access_token DROP NOT NULL;
  END IF;
END $$;