/*
  # Content Calendar System

  1. New Tables
    - `content_calendar`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `title` (text) - Content title
      - `description` (text) - Content description/notes
      - `content_type` (text) - Type: blog, social, email, video, etc.
      - `platform` (text) - Platform: linkedin, facebook, instagram, twitter, email, blog, youtube
      - `status` (text) - Status: draft, scheduled, published, cancelled
      - `scheduled_date` (timestamptz) - When to publish
      - `published_date` (timestamptz) - When it was actually published
      - `content_body` (text) - The actual content text
      - `tags` (text[]) - Array of tags for categorization
      - `color` (text) - Color for calendar display
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on content_calendar table
    - Users can only view their own calendar items
    - Users can create, update, and delete their own calendar items

  3. Indexes
    - Add index on user_id for fast filtering
    - Add index on scheduled_date for calendar queries
    - Add index on status for filtering
*/

CREATE TABLE IF NOT EXISTS content_calendar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  content_type text NOT NULL,
  platform text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  scheduled_date timestamptz NOT NULL,
  published_date timestamptz,
  content_body text,
  tags text[] DEFAULT '{}',
  color text DEFAULT '#3B82F6',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_calendar_user_id ON content_calendar(user_id);
CREATE INDEX IF NOT EXISTS idx_content_calendar_scheduled_date ON content_calendar(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_content_calendar_status ON content_calendar(status);

ALTER TABLE content_calendar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own calendar items"
  ON content_calendar FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calendar items"
  ON content_calendar FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar items"
  ON content_calendar FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own calendar items"
  ON content_calendar FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
