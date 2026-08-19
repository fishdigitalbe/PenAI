/*
  # Fix RLS Performance and Security Issues

  1. RLS Performance Optimization
    - Update all RLS policies to use `(select auth.uid())` instead of `auth.uid()`
    - This prevents re-evaluation of auth functions for each row
    - Affects tables: meta_conversion_logs, promotional_emails, linkedin_settings, 
      linkedin_conversion_logs, blogs, meta_settings, shopify_stores, 
      linkedin_post_settings, linkedin_oauth_tokens, scheduled_linkedin_posts

  2. Function Security Fixes
    - Set immutable search_path for all trigger functions
    - Prevents search_path manipulation attacks

  3. Policy Consolidation
    - Remove duplicate permissive policies
    - Keep only the necessary policies per table
*/

-- =====================================================
-- 1. FIX META CONVERSION LOGS RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view own Meta conversion logs" ON meta_conversion_logs;

CREATE POLICY "Users can view own Meta conversion logs"
  ON meta_conversion_logs
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- =====================================================
-- 2. FIX PROMOTIONAL EMAILS RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can create promotional emails for their orders" ON promotional_emails;
DROP POLICY IF EXISTS "Users can view their own promotional emails" ON promotional_emails;

CREATE POLICY "Users can create promotional emails for their orders"
  ON promotional_emails
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders o
      JOIN customers c ON o.customer_id = c.id
      WHERE o.id = promotional_emails.order_id
      AND c.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can view their own promotional emails"
  ON promotional_emails
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      JOIN customers c ON o.customer_id = c.id
      WHERE o.id = promotional_emails.order_id
      AND c.user_id = (select auth.uid())
    )
  );

-- =====================================================
-- 3. FIX LINKEDIN SETTINGS RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view own LinkedIn settings" ON linkedin_settings;
DROP POLICY IF EXISTS "Users can insert own LinkedIn settings" ON linkedin_settings;
DROP POLICY IF EXISTS "Users can update own LinkedIn settings" ON linkedin_settings;
DROP POLICY IF EXISTS "Users can delete own LinkedIn settings" ON linkedin_settings;

CREATE POLICY "Users can view own LinkedIn settings"
  ON linkedin_settings
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own LinkedIn settings"
  ON linkedin_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own LinkedIn settings"
  ON linkedin_settings
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own LinkedIn settings"
  ON linkedin_settings
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- =====================================================
-- 4. FIX LINKEDIN CONVERSION LOGS RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view own conversion logs" ON linkedin_conversion_logs;

CREATE POLICY "Users can view own conversion logs"
  ON linkedin_conversion_logs
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- =====================================================
-- 5. FIX BLOGS RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Admin can view all blogs" ON blogs;
DROP POLICY IF EXISTS "Admin can create blogs" ON blogs;
DROP POLICY IF EXISTS "Admin can update blogs" ON blogs;
DROP POLICY IF EXISTS "Admin can delete blogs" ON blogs;
DROP POLICY IF EXISTS "Anyone can view published blogs" ON blogs;

CREATE POLICY "Admin can manage and view all blogs"
  ON blogs
  FOR ALL
  TO authenticated
  USING ((select auth.uid()) = '00000000-0000-0000-0000-000000000000'::uuid)
  WITH CHECK ((select auth.uid()) = '00000000-0000-0000-0000-000000000000'::uuid);

CREATE POLICY "Anyone can view published blogs"
  ON blogs
  FOR SELECT
  TO authenticated
  USING (status = 'published');

-- =====================================================
-- 6. FIX META SETTINGS RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view own Meta settings" ON meta_settings;
DROP POLICY IF EXISTS "Users can insert own Meta settings" ON meta_settings;
DROP POLICY IF EXISTS "Users can update own Meta settings" ON meta_settings;
DROP POLICY IF EXISTS "Users can delete own Meta settings" ON meta_settings;

CREATE POLICY "Users can view own Meta settings"
  ON meta_settings
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own Meta settings"
  ON meta_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own Meta settings"
  ON meta_settings
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own Meta settings"
  ON meta_settings
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- =====================================================
-- 7. FIX SHOPIFY STORES RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view own Shopify stores" ON shopify_stores;
DROP POLICY IF EXISTS "Users can insert own Shopify stores" ON shopify_stores;
DROP POLICY IF EXISTS "Users can update own Shopify stores" ON shopify_stores;
DROP POLICY IF EXISTS "Users can delete own Shopify stores" ON shopify_stores;

CREATE POLICY "Users can view own Shopify stores"
  ON shopify_stores
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own Shopify stores"
  ON shopify_stores
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own Shopify stores"
  ON shopify_stores
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own Shopify stores"
  ON shopify_stores
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- =====================================================
-- 8. FIX LINKEDIN POST SETTINGS RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view own LinkedIn post settings" ON linkedin_post_settings;
DROP POLICY IF EXISTS "Users can insert own LinkedIn post settings" ON linkedin_post_settings;
DROP POLICY IF EXISTS "Users can update own LinkedIn post settings" ON linkedin_post_settings;
DROP POLICY IF EXISTS "Users can delete own LinkedIn post settings" ON linkedin_post_settings;

CREATE POLICY "Users can view own LinkedIn post settings"
  ON linkedin_post_settings
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own LinkedIn post settings"
  ON linkedin_post_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own LinkedIn post settings"
  ON linkedin_post_settings
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own LinkedIn post settings"
  ON linkedin_post_settings
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- =====================================================
-- 9. FIX LINKEDIN OAUTH TOKENS RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view own LinkedIn tokens" ON linkedin_oauth_tokens;
DROP POLICY IF EXISTS "Users can insert own LinkedIn tokens" ON linkedin_oauth_tokens;
DROP POLICY IF EXISTS "Users can update own LinkedIn tokens" ON linkedin_oauth_tokens;
DROP POLICY IF EXISTS "Users can delete own LinkedIn tokens" ON linkedin_oauth_tokens;

CREATE POLICY "Users can view own LinkedIn tokens"
  ON linkedin_oauth_tokens
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own LinkedIn tokens"
  ON linkedin_oauth_tokens
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own LinkedIn tokens"
  ON linkedin_oauth_tokens
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own LinkedIn tokens"
  ON linkedin_oauth_tokens
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- =====================================================
-- 10. FIX SCHEDULED LINKEDIN POSTS RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view own scheduled posts" ON scheduled_linkedin_posts;
DROP POLICY IF EXISTS "Users can create own scheduled posts" ON scheduled_linkedin_posts;
DROP POLICY IF EXISTS "Users can update own scheduled posts" ON scheduled_linkedin_posts;
DROP POLICY IF EXISTS "Users can delete own scheduled posts" ON scheduled_linkedin_posts;

CREATE POLICY "Users can view own scheduled posts"
  ON scheduled_linkedin_posts
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can create own scheduled posts"
  ON scheduled_linkedin_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own scheduled posts"
  ON scheduled_linkedin_posts
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own scheduled posts"
  ON scheduled_linkedin_posts
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- =====================================================
-- 11. FIX FUNCTION SEARCH PATHS (SECURITY)
-- =====================================================

CREATE OR REPLACE FUNCTION update_blogs_updated_at()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION update_linkedin_settings_updated_at()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION update_meta_settings_updated_at()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION update_linkedin_post_settings_updated_at()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION update_linkedin_oauth_tokens_updated_at()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION update_scheduled_linkedin_posts_updated_at()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =====================================================
-- 12. CONSOLIDATE DUPLICATE POLICIES
-- =====================================================

-- Remove old duplicate customer policies (keeping the newer ones)
DROP POLICY IF EXISTS "authenticated_users_read_own_customer" ON customers;
DROP POLICY IF EXISTS "authenticated_users_insert_own_customer" ON customers;
DROP POLICY IF EXISTS "authenticated_users_update_own_customer" ON customers;

-- Remove old duplicate stripe customer policies
DROP POLICY IF EXISTS "authenticated_users_read_own_stripe_customer" ON stripe_customers;

-- Remove old duplicate stripe order policies
DROP POLICY IF EXISTS "authenticated_users_read_own_stripe_order" ON stripe_orders;

-- Remove old duplicate stripe subscription policies
DROP POLICY IF EXISTS "authenticated_users_read_own_subscription" ON stripe_subscriptions;
