/*
  # Add UPDATE and DELETE policies for orders

  1. Security
    - Add policy for users to update their own orders
    - Add policy for users to delete their own orders
    - Both policies check ownership via customers table
*/

-- Add UPDATE policy for orders
CREATE POLICY "Users can update own orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = orders.customer_id
      AND customers.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = orders.customer_id
      AND customers.user_id = (select auth.uid())
    )
  );

-- Add DELETE policy for orders
CREATE POLICY "Users can delete own orders"
  ON orders
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = orders.customer_id
      AND customers.user_id = (select auth.uid())
    )
  );
