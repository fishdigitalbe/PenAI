/*
  # Fix Security and Performance Issues
  
  1. Indexes
    - Add missing index on orders.promo_code_id foreign key
  
  2. RLS Performance Optimization
    - Update all RLS policies to use (select auth.uid()) instead of auth.uid()
    - This prevents re-evaluation of auth functions for each row
  
  3. Policy Cleanup
    - Remove duplicate/conflicting policies
    - Keep only the necessary policies for authenticated users
*/

-- Add missing index for foreign key
CREATE INDEX IF NOT EXISTS idx_orders_promo_code_id ON orders(promo_code_id);

-- Drop all existing conflicting RLS policies on customers
DROP POLICY IF EXISTS "Customers can view own data" ON customers;
DROP POLICY IF EXISTS "Service role can manage customers" ON customers;
DROP POLICY IF EXISTS "Users can view own customer data" ON customers;
DROP POLICY IF EXISTS "Users can insert own customer data" ON customers;
DROP POLICY IF EXISTS "Users can update own customer data" ON customers;

-- Create optimized RLS policies for customers
CREATE POLICY "Users can view own customer data"
  ON customers
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own customer data"
  ON customers
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own customer data"
  ON customers
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Drop all existing conflicting RLS policies on orders
DROP POLICY IF EXISTS "Customers can view own orders" ON orders;
DROP POLICY IF EXISTS "Service role can manage orders" ON orders;
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;

-- Create optimized RLS policies for orders
CREATE POLICY "Users can view own orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = orders.customer_id
      AND customers.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert own orders"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = orders.customer_id
      AND customers.user_id = (select auth.uid())
    )
  );

-- Drop and recreate optimized RLS policies for stripe_customers
DROP POLICY IF EXISTS "Users can view their own customer data" ON stripe_customers;

CREATE POLICY "Users can view their own customer data"
  ON stripe_customers
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- Drop and recreate optimized RLS policies for stripe_subscriptions
DROP POLICY IF EXISTS "Users can view their own subscription data" ON stripe_subscriptions;

CREATE POLICY "Users can view their own subscription data"
  ON stripe_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT customer_id FROM stripe_customers WHERE user_id = (select auth.uid())
    )
  );

-- Drop and recreate optimized RLS policies for stripe_orders
DROP POLICY IF EXISTS "Users can view their own order data" ON stripe_orders;

CREATE POLICY "Users can view their own order data"
  ON stripe_orders
  FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT customer_id FROM stripe_customers WHERE user_id = (select auth.uid())
    )
  );