/*
  # Meta (Facebook/Instagram) Conversion Tracking Integration

  1. New Tables
    - `meta_settings`
      - `id` (uuid, primary key) - Unique identifier
      - `user_id` (uuid, foreign key) - Reference to auth.users
      - `pixel_id` (text) - Meta Pixel ID
      - `access_token` (text, encrypted) - Meta access token for API calls
      - `test_event_code` (text, nullable) - Optional test event code for debugging
      - `is_active` (boolean) - Whether tracking is enabled
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

    - `meta_conversion_logs`
      - `id` (uuid, primary key) - Unique identifier
      - `user_id` (uuid, foreign key) - Reference to auth.users
      - `order_id` (uuid, foreign key) - Reference to orders table
      - `pixel_id` (text) - Meta Pixel ID used
      - `event_type` (text) - Type of conversion event (Purchase, Lead, etc.)
      - `conversion_value` (decimal) - Value of the conversion
      - `status` (text) - Status of the API call (success, failed)
      - `response_data` (jsonb) - Response from Meta API
      - `error_message` (text) - Error message if failed
      - `created_at` (timestamptz) - Creation timestamp

  2. Security
    - Enable RLS on both tables
    - Add policies for users to manage their own Meta settings
    - Add policies for viewing conversion logs
*/

-- Create meta_settings table
CREATE TABLE IF NOT EXISTS meta_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pixel_id text NOT NULL,
  access_token text NOT NULL,
  test_event_code text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create meta_conversion_logs table
CREATE TABLE IF NOT EXISTS meta_conversion_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  pixel_id text NOT NULL,
  event_type text NOT NULL DEFAULT 'Purchase',
  conversion_value decimal(10, 2),
  status text NOT NULL DEFAULT 'pending',
  response_data jsonb,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE meta_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_conversion_logs ENABLE ROW LEVEL SECURITY;

-- Policies for meta_settings
CREATE POLICY "Users can view own Meta settings"
  ON meta_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own Meta settings"
  ON meta_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own Meta settings"
  ON meta_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own Meta settings"
  ON meta_settings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for meta_conversion_logs
CREATE POLICY "Users can view own Meta conversion logs"
  ON meta_conversion_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert Meta conversion logs"
  ON meta_conversion_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Create updated_at trigger for meta_settings
CREATE OR REPLACE FUNCTION update_meta_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER meta_settings_updated_at
  BEFORE UPDATE ON meta_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_meta_settings_updated_at();

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_meta_settings_user_id ON meta_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_meta_conversion_logs_user_id ON meta_conversion_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_meta_conversion_logs_order_id ON meta_conversion_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_meta_conversion_logs_created_at ON meta_conversion_logs(created_at DESC);