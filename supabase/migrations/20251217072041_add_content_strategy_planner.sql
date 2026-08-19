/*
  # Content Strategy Planner System

  1. New Tables
    - `content_plans`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `company_name` (text)
      - `sector` (text)
      - `company_size` (text)
      - `primary_goal` (text)
      - `output_language` (text)
      - `strategy_depth` (text)
      - `full_input_json` (jsonb) - stores all form inputs
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `content_plan_outputs`
      - `id` (uuid, primary key)
      - `content_plan_id` (uuid, foreign key)
      - `output_json` (jsonb) - stores generated strategy
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Users can only access their own content plans
    - Authenticated users can create and read their plans
*/

-- Create content_plans table
CREATE TABLE IF NOT EXISTS content_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_name text NOT NULL,
  sector text,
  company_size text,
  primary_goal text,
  output_language text DEFAULT 'nl',
  strategy_depth text DEFAULT 'standard',
  full_input_json jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create content_plan_outputs table
CREATE TABLE IF NOT EXISTS content_plan_outputs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_plan_id uuid REFERENCES content_plans(id) ON DELETE CASCADE NOT NULL,
  output_json jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE content_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_plan_outputs ENABLE ROW LEVEL SECURITY;

-- Policies for content_plans
CREATE POLICY "Users can view own content plans"
  ON content_plans
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own content plans"
  ON content_plans
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own content plans"
  ON content_plans
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own content plans"
  ON content_plans
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for content_plan_outputs
CREATE POLICY "Users can view own plan outputs"
  ON content_plan_outputs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM content_plans
      WHERE content_plans.id = content_plan_outputs.content_plan_id
      AND content_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create plan outputs"
  ON content_plan_outputs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM content_plans
      WHERE content_plans.id = content_plan_outputs.content_plan_id
      AND content_plans.user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_plans_user_id ON content_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_content_plans_created_at ON content_plans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_plan_outputs_plan_id ON content_plan_outputs(content_plan_id);
