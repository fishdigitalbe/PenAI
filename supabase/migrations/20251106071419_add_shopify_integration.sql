/*
  # Add Shopify Integration

  1. New Tables
    - `shopify_stores`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `shop_name` (text) - The myshopify.com domain
      - `access_token` (text) - Shopify Admin API access token
      - `is_active` (boolean) - Whether this store is active
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `shopify_stores` table
    - Add policies for authenticated users to manage their own stores

  3. Important Notes
    - Access tokens are encrypted at rest by Supabase
    - Users can connect multiple Shopify stores
    - Only one store can be active at a time per user
*/

-- Create shopify_stores table
CREATE TABLE IF NOT EXISTS shopify_stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shop_name text NOT NULL,
  access_token text NOT NULL,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE shopify_stores ENABLE ROW LEVEL SECURITY;

-- Policies for shopify_stores
CREATE POLICY "Users can view own Shopify stores"
  ON shopify_stores FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own Shopify stores"
  ON shopify_stores FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own Shopify stores"
  ON shopify_stores FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own Shopify stores"
  ON shopify_stores FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_shopify_stores_user_id ON shopify_stores(user_id);
CREATE INDEX IF NOT EXISTS idx_shopify_stores_active ON shopify_stores(user_id, is_active) WHERE is_active = true;