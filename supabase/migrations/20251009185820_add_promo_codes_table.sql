/*
  # Promo Codes Tabel

  1. Nieuwe Tabellen
    - `promo_codes`
      - `id` (uuid, primary key)
      - `code` (text, unique) - De unieke promocode
      - `discount_percentage` (integer) - Kortingspercentage (0-100)
      - `is_active` (boolean) - Of de code actief is
      - `usage_limit` (integer, nullable) - Maximaal aantal keer dat de code gebruikt kan worden
      - `usage_count` (integer) - Aantal keer dat de code gebruikt is
      - `valid_from` (timestamptz, nullable) - Vanaf wanneer de code geldig is
      - `valid_until` (timestamptz, nullable) - Tot wanneer de code geldig is
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Wijzigingen aan bestaande tabellen
    - `orders` tabel krijgt nieuwe kolommen:
      - `promo_code_id` (uuid, foreign key naar promo_codes)
      - `discount_percentage` (integer) - Het gebruikte kortingspercentage
      - `original_amount` (integer) - Oorspronkelijk bedrag voor korting
      - `discount_amount` (integer) - Kortingsbedrag

  3. Security
    - Enable RLS op `promo_codes` tabel
    - Alleen authenticated users kunnen promo codes bekijken
    - Alleen service role kan promo codes aanmaken/wijzigen

  4. Indexes
    - Index op `code` kolom voor snelle lookups
    - Index op `is_active` voor filtering
*/

-- Create promo_codes table
CREATE TABLE IF NOT EXISTS promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  discount_percentage integer NOT NULL CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  is_active boolean DEFAULT true NOT NULL,
  usage_limit integer CHECK (usage_limit > 0),
  usage_count integer DEFAULT 0 NOT NULL,
  valid_from timestamptz,
  valid_until timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Add promo code columns to orders table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'promo_code_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN promo_code_id uuid REFERENCES promo_codes(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'discount_percentage'
  ) THEN
    ALTER TABLE orders ADD COLUMN discount_percentage integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'original_amount'
  ) THEN
    ALTER TABLE orders ADD COLUMN original_amount integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'discount_amount'
  ) THEN
    ALTER TABLE orders ADD COLUMN discount_amount integer DEFAULT 0;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_is_active ON promo_codes(is_active);

-- Enable RLS
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for promo_codes
CREATE POLICY "Authenticated users can view active promo codes"
  ON promo_codes FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Service role can manage all promo codes"
  ON promo_codes FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Insert some example promo codes
INSERT INTO promo_codes (code, discount_percentage, is_active, usage_limit, valid_from, valid_until)
VALUES 
  ('WELCOME10', 10, true, 100, now(), now() + interval '30 days'),
  ('SUMMER25', 25, true, 50, now(), now() + interval '60 days'),
  ('VIP50', 50, true, 10, now(), now() + interval '90 days')
ON CONFLICT (code) DO NOTHING;