/*
  # Add promotional emails table

  1. New Tables
    - `promotional_emails`
      - `id` (uuid, primary key)
      - `order_id` (uuid, foreign key to orders)
      - `customer_id` (uuid, foreign key to customers)
      - `emails` (jsonb) - Array of generated email objects
      - `number_of_emails` (integer) - How many emails were generated
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `promotional_emails` table
    - Add policies for authenticated users to read/create their own promotional emails

  3. Indexes
    - Index on order_id for fast lookups
    - Index on customer_id for user-specific queries
*/

CREATE TABLE IF NOT EXISTS promotional_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  emails jsonb NOT NULL,
  number_of_emails integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE promotional_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own promotional emails"
  ON promotional_emails
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = promotional_emails.customer_id
      AND customers.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create promotional emails for their orders"
  ON promotional_emails
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = promotional_emails.customer_id
      AND customers.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_promotional_emails_order_id ON promotional_emails(order_id);
CREATE INDEX IF NOT EXISTS idx_promotional_emails_customer_id ON promotional_emails(customer_id);