/*
  # Add Scheduled LinkedIn Posts

  1. New Tables
    - `scheduled_linkedin_posts`
      - `id` (uuid, primary key)
      - `blog_id` (uuid, foreign key to blogs)
      - `user_id` (uuid, foreign key to auth.users)
      - `post_text` (text, the LinkedIn post content)
      - `scheduled_for` (timestamptz, when to publish)
      - `status` (text, enum: pending, published, failed, cancelled)
      - `published_at` (timestamptz, nullable, when it was actually published)
      - `error_message` (text, nullable, error if failed)
      - `created_at` (timestamptz, default now)
      - `updated_at` (timestamptz, default now)

  2. Security
    - Enable RLS on `scheduled_linkedin_posts` table
    - Add policies for authenticated users to manage their own scheduled posts
*/

-- Create the scheduled_linkedin_posts table
CREATE TABLE IF NOT EXISTS scheduled_linkedin_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_id uuid REFERENCES blogs(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  post_text text NOT NULL,
  scheduled_for timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'failed', 'cancelled')),
  published_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_scheduled_linkedin_posts_user_id ON scheduled_linkedin_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_linkedin_posts_blog_id ON scheduled_linkedin_posts(blog_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_linkedin_posts_status ON scheduled_linkedin_posts(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_linkedin_posts_scheduled_for ON scheduled_linkedin_posts(scheduled_for);

-- Enable RLS
ALTER TABLE scheduled_linkedin_posts ENABLE ROW LEVEL SECURITY;

-- Policies for scheduled_linkedin_posts
CREATE POLICY "Users can view own scheduled posts"
  ON scheduled_linkedin_posts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own scheduled posts"
  ON scheduled_linkedin_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scheduled posts"
  ON scheduled_linkedin_posts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own scheduled posts"
  ON scheduled_linkedin_posts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_scheduled_linkedin_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating updated_at
CREATE TRIGGER update_scheduled_linkedin_posts_updated_at
  BEFORE UPDATE ON scheduled_linkedin_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_scheduled_linkedin_posts_updated_at();