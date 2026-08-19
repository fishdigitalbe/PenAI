/*
  # Add Preview Content Field to Orders

  1. Changes
    - Add `preview_content` column to orders table
    - This will store the preview/sample content shown to users before payment

  2. Notes
    - Preview content is a smaller version of the full ebook
    - Used to give customers a taste before they commit to payment
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'preview_content'
  ) THEN
    ALTER TABLE orders ADD COLUMN preview_content jsonb;
  END IF;
END $$;
