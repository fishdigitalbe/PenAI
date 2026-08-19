/*
  # Restore Blog Public Access
  
  1. Changes
    - Add policy for anonymous (non-authenticated) users to view published blogs
    - The previous migration only created a policy for authenticated users
  
  2. Security
    - Anonymous users can view published blogs
    - Authenticated users can view published blogs OR all blogs if admin
    - This restores the public blog functionality
*/

-- Drop the authenticated-only policy
DROP POLICY IF EXISTS "Users can view published or admin can view all" ON blogs;

-- Create policy for anonymous users to view published blogs
CREATE POLICY "Public can view published blogs"
  ON blogs
  FOR SELECT
  TO anon
  USING (status = 'published');

-- Create policy for authenticated users (can view published or all if admin)
CREATE POLICY "Authenticated users can view blogs"
  ON blogs
  FOR SELECT
  TO authenticated
  USING (status = 'published' OR is_user_admin());