/*
  # Fix Orders Table Performance Issues

  1. Performance Optimizations
    - Remove duplicate RLS policies that cause unnecessary overhead
    - Add composite index for customer_id + created_at (commonly queried together)
    - Keep only the essential RLS policies

  2. Changes
    - Drop duplicate policies: authenticated_users_read_own_orders, authenticated_users_insert_own_orders
    - Add composite index: idx_orders_customer_created for faster order listing by customer
    - Keep policies: Users can view/insert/update/delete own orders + service_role_manage_orders

  3. Security
    - Maintains same security level with optimized policy structure
    - All user access still properly restricted through user_id checks
*/

-- Drop duplicate RLS policies (keeping the newer "Users can..." versions)
DROP POLICY IF EXISTS "authenticated_users_read_own_orders" ON orders;
DROP POLICY IF EXISTS "authenticated_users_insert_own_orders" ON orders;

-- Add composite index for customer_id + created_at (common query pattern)
CREATE INDEX IF NOT EXISTS idx_orders_customer_created 
ON orders(customer_id, created_at DESC);

-- Add index on user_id in customers table for faster RLS policy lookups
CREATE INDEX IF NOT EXISTS idx_customers_user_id_id 
ON customers(user_id, id);
