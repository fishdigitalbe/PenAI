/*
  # Add infographic support to orders table

  1. Changes
    - Add `infographic_url` column to orders table to store generated infographic URLs
    - Column is optional (nullable) as not all orders will have infographics
  
  2. Notes
    - Infographics are generated on-demand from completed orders
    - Stored as base64 data URLs or uploaded image URLs
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'infographic_url'
  ) THEN
    ALTER TABLE orders ADD COLUMN infographic_url text;
  END IF;
END $$;