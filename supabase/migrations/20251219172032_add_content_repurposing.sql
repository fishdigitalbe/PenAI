/*
  # Content Repurposing System

  1. New Tables
    - `repurposed_content`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `source_content` (text) - Original content
      - `source_type` (text) - Type of source (blog, article, email, etc.)
      - `target_format` (text) - Target format (linkedin, twitter, etc.)
      - `tone` (text) - Tone of voice used
      - `repurposed_content` (text) - Generated content
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on repurposed_content table
    - Users can only view their own repurposed content
    - Users can create, update, and delete their own repurposed content

  3. Indexes
    - Add index on user_id for fast filtering
    - Add index on created_at for sorting
*/

CREATE TABLE IF NOT EXISTS repurposed_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  source_content text NOT NULL,
  source_type text NOT NULL,
  target_format text NOT NULL,
  tone text NOT NULL DEFAULT 'professional',
  repurposed_content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_repurposed_content_user_id ON repurposed_content(user_id);
CREATE INDEX IF NOT EXISTS idx_repurposed_content_created_at ON repurposed_content(created_at DESC);

ALTER TABLE repurposed_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own repurposed content"
  ON repurposed_content FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own repurposed content"
  ON repurposed_content FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own repurposed content"
  ON repurposed_content FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own repurposed content"
  ON repurposed_content FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
