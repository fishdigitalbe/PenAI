/*
  # Add Billing Fields to Customers Table

  1. Changes
    - Add `last_name` column for family name
    - Add `company_name` column for business name
    - Add `vat_number` column for BTW nummer
    - Add `address` column for street address
    - Add `postal_code` column for postcode
    - Add `city` column for city
    - Add `country` column for country

  2. Notes
    - All fields are optional (nullable) as existing customers may not have this data
    - VAT number is stored as text to preserve formatting
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE customers ADD COLUMN last_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'company_name'
  ) THEN
    ALTER TABLE customers ADD COLUMN company_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'vat_number'
  ) THEN
    ALTER TABLE customers ADD COLUMN vat_number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'address'
  ) THEN
    ALTER TABLE customers ADD COLUMN address text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'postal_code'
  ) THEN
    ALTER TABLE customers ADD COLUMN postal_code text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'city'
  ) THEN
    ALTER TABLE customers ADD COLUMN city text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'country'
  ) THEN
    ALTER TABLE customers ADD COLUMN country text DEFAULT 'BE';
  END IF;
END $$;
