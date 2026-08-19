/*
  # Add Trending Topics Feature

  1. New Tables
    - `saved_trending_topics`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `topic_id` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `saved_trending_topics` table
    - Add policies for authenticated users to manage their saved topics
*/

CREATE TABLE IF NOT EXISTS saved_trending_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, topic_id)
);

ALTER TABLE saved_trending_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved topics"
  ON saved_trending_topics
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved topics"
  ON saved_trending_topics
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved topics"
  ON saved_trending_topics
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS saved_trending_topics_user_id_idx ON saved_trending_topics(user_id);
CREATE INDEX IF NOT EXISTS saved_trending_topics_topic_id_idx ON saved_trending_topics(topic_id);
