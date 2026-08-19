/*
  # Fix Blog RLS Policies with Admin System
  
  1. Changes
    - Add is_admin column to customers table
    - Drop existing blog policies with hardcoded UUID
    - Create new blog policies that check for admin status
    - Create helper function to check if user is admin
  
  2. Security
    - Only admins can insert, update, or delete blogs
    - Everyone can view published blogs
    - Admins are identified by is_admin flag in customers table
*/

-- Add is_admin column to customers table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE customers ADD COLUMN is_admin boolean DEFAULT false;
  END IF;
END $$;

-- Create helper function to check if current user is admin
CREATE OR REPLACE FUNCTION is_user_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM customers
    WHERE user_id = auth.uid()
    AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing blog policies
DROP POLICY IF EXISTS "Admin can manage and view all blogs" ON blogs;
DROP POLICY IF EXISTS "Anyone can view published blogs" ON blogs;

-- Create new policies with proper admin check
CREATE POLICY "Admins can manage all blogs"
  ON blogs
  FOR ALL
  TO authenticated
  USING (is_user_admin())
  WITH CHECK (is_user_admin());

CREATE POLICY "Anyone can view published blogs"
  ON blogs
  FOR SELECT
  TO authenticated
  USING (status = 'published' OR is_user_admin());