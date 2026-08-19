/*
  # Add LinkedIn Post Publishing Settings

  1. New Tables
    - `linkedin_post_settings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `access_token` (text) - OAuth token with w_member_social scope
      - `person_id` (text) - LinkedIn member ID (urn:li:person:xxx)
      - `organization_id` (text, nullable) - For company page posts
      - `post_type` (text) - 'personal' or 'organization'
      - `is_active` (boolean) - Enable/disable post publishing
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `linkedin_post_settings` table
    - Add policies for authenticated users to manage their own settings

  3. Notes
    - This table is separate from `linkedin_settings` (conversion tracking)
    - The access token needs w_member_social or w_organization_social scope
    - person_id format: just the numeric ID (e.g., "abc123xyz")
*/

-- Create linkedin_post_settings table
CREATE TABLE IF NOT EXISTS linkedin_post_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  access_token text NOT NULL,
  person_id text NOT NULL,
  organization_id text,
  post_type text NOT NULL DEFAULT 'personal' CHECK (post_type IN ('personal', 'organization')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE linkedin_post_settings ENABLE ROW LEVEL SECURITY;

-- Policies for linkedin_post_settings
CREATE POLICY "Users can view own LinkedIn post settings"
  ON linkedin_post_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own LinkedIn post settings"
  ON linkedin_post_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own LinkedIn post settings"
  ON linkedin_post_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own LinkedIn post settings"
  ON linkedin_post_settings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_linkedin_post_settings_user_id ON linkedin_post_settings(user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_linkedin_post_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_linkedin_post_settings_updated_at
  BEFORE UPDATE ON linkedin_post_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_linkedin_post_settings_updated_at();