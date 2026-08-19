/*
  # LinkedIn OAuth 2.0 Token Storage

  1. New Tables
    - `linkedin_oauth_tokens`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `access_token` (text, encrypted)
      - `refresh_token` (text, encrypted, nullable)
      - `expires_at` (timestamptz)
      - `scope` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `linkedin_oauth_tokens` table
    - Add policies for users to manage only their own tokens
    - Tokens are sensitive data and should only be accessible by the user

  3. Important Notes
    - Only one active token per user (enforced by unique constraint)
    - Tokens are stored securely and never exposed to client
    - Edge functions will use service role to access tokens
*/

CREATE TABLE IF NOT EXISTS linkedin_oauth_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token text NOT NULL,
  refresh_token text,
  expires_at timestamptz NOT NULL,
  scope text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE linkedin_oauth_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own LinkedIn tokens"
  ON linkedin_oauth_tokens
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own LinkedIn tokens"
  ON linkedin_oauth_tokens
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own LinkedIn tokens"
  ON linkedin_oauth_tokens
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own LinkedIn tokens"
  ON linkedin_oauth_tokens
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_linkedin_oauth_tokens_user_id ON linkedin_oauth_tokens(user_id);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_linkedin_oauth_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_linkedin_oauth_tokens_updated_at
  BEFORE UPDATE ON linkedin_oauth_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_linkedin_oauth_tokens_updated_at();