/*
  # LinkedIn Conversion Tracking Integration

  1. New Tables
    - `linkedin_settings`
      - `id` (uuid, primary key) - Unique identifier
      - `user_id` (uuid, foreign key) - Reference to auth.users
      - `access_token` (text, encrypted) - LinkedIn access token for API calls
      - `conversion_id` (text) - LinkedIn conversion tracking pixel ID
      - `is_active` (boolean) - Whether tracking is enabled
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

    - `linkedin_conversion_logs`
      - `id` (uuid, primary key) - Unique identifier
      - `user_id` (uuid, foreign key) - Reference to auth.users
      - `order_id` (uuid, foreign key) - Reference to orders table
      - `conversion_id` (text) - LinkedIn conversion ID used
      - `event_type` (text) - Type of conversion event (purchase, lead, etc.)
      - `conversion_value` (decimal) - Value of the conversion
      - `status` (text) - Status of the API call (success, failed)
      - `response_data` (jsonb) - Response from LinkedIn API
      - `error_message` (text) - Error message if failed
      - `created_at` (timestamptz) - Creation timestamp

  2. Security
    - Enable RLS on both tables
    - Add policies for users to manage their own LinkedIn settings
    - Add policies for viewing conversion logs
*/

-- Create linkedin_settings table
CREATE TABLE IF NOT EXISTS linkedin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  access_token text NOT NULL,
  conversion_id text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create linkedin_conversion_logs table
CREATE TABLE IF NOT EXISTS linkedin_conversion_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  conversion_id text NOT NULL,
  event_type text NOT NULL DEFAULT 'PURCHASE',
  conversion_value decimal(10, 2),
  status text NOT NULL DEFAULT 'pending',
  response_data jsonb,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE linkedin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE linkedin_conversion_logs ENABLE ROW LEVEL SECURITY;

-- Policies for linkedin_settings
CREATE POLICY "Users can view own LinkedIn settings"
  ON linkedin_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own LinkedIn settings"
  ON linkedin_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own LinkedIn settings"
  ON linkedin_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own LinkedIn settings"
  ON linkedin_settings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for linkedin_conversion_logs
CREATE POLICY "Users can view own conversion logs"
  ON linkedin_conversion_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert conversion logs"
  ON linkedin_conversion_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Create updated_at trigger for linkedin_settings
CREATE OR REPLACE FUNCTION update_linkedin_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER linkedin_settings_updated_at
  BEFORE UPDATE ON linkedin_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_linkedin_settings_updated_at();

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_linkedin_settings_user_id ON linkedin_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_conversion_logs_user_id ON linkedin_conversion_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_conversion_logs_order_id ON linkedin_conversion_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_conversion_logs_created_at ON linkedin_conversion_logs(created_at DESC);