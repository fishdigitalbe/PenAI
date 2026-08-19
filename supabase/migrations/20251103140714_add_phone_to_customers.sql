/*
  # Add phone field to customers table

  1. Changes
    - Add `phone` column to customers table for contact information
    - Optional field to store customer phone numbers

  2. Notes
    - No RLS changes needed as customers table already has proper policies
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'phone'
  ) THEN
    ALTER TABLE customers ADD COLUMN phone text;
  END IF;
END $$;