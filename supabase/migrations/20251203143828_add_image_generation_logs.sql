/*
  # Add image generation logging table

  1. New Tables
    - `image_generation_logs`
      - `id` (uuid, primary key)
      - `order_id` (uuid, foreign key to orders)
      - `chapter_number` (integer)
      - `log_type` (text) - 'info', 'error', 'success'
      - `message` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS
    - Allow service role to insert/read logs (for debugging)
*/

CREATE TABLE IF NOT EXISTS image_generation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  chapter_number integer,
  log_type text NOT NULL DEFAULT 'info',
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE image_generation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage logs"
  ON image_generation_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_image_generation_logs_order_id 
  ON image_generation_logs(order_id);

CREATE INDEX IF NOT EXISTS idx_image_generation_logs_created_at 
  ON image_generation_logs(created_at DESC);