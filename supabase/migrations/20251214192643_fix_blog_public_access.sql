/*
  # Fix Blog Public Access
  
  1. Changes
    - Drop existing "Anyone can view published blogs" policy
    - Create new policy that allows both authenticated AND anonymous users to view published blogs
  
  2. Security
    - Anonymous users (not logged in) can view published blogs
    - Authenticated users can view published blogs
    - Admins can view all blogs (existing policy remains)
*/

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Anyone can view published blogs" ON blogs;

-- Create new policy that allows both authenticated and anonymous users
CREATE POLICY "Public can view published blogs"
  ON blogs
  FOR SELECT
  TO authenticated, anon
  USING ((status = 'published') OR is_user_admin());