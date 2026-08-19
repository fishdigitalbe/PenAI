/*
  # Add person_id to LinkedIn OAuth Tokens

  1. Changes
    - Add person_id column to linkedin_oauth_tokens
    - This will store the LinkedIn member ID from the API
    
  2. Notes
    - The person_id will be automatically fetched during OAuth callback
    - This is more reliable than manual entry
*/

-- Add person_id column to linkedin_oauth_tokens
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'linkedin_oauth_tokens' AND column_name = 'person_id'
  ) THEN
    ALTER TABLE linkedin_oauth_tokens ADD COLUMN person_id text;
  END IF;
END $$;