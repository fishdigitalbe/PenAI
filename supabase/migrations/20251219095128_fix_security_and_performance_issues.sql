/*
  # Fix Security and Performance Issues
  
  1. RLS Performance Optimization
    - Replace `auth.uid()` with `(select auth.uid())` in all policies
    - Replace `auth.jwt()` with `(select auth.jwt())` in all policies
    - This prevents re-evaluation for each row, improving query performance
  
  2. Remove Unused Indexes
    - Drop 20 unused indexes that impact write performance
    - These indexes were never used in queries
  
  3. Fix Multiple Permissive Policies
    - Merge duplicate SELECT policies on blogs table
    - Keep only one comprehensive SELECT policy
  
  4. Fix Function Search Path Security
    - Add explicit search_path to all functions
    - Prevents potential SQL injection through search path manipulation
  
  5. Tables Affected
    - content_plans: 4 policies optimized
    - content_plan_outputs: 2 policies optimized  
    - blog_views: 1 policy optimized
    - blogs: SELECT policies merged
    - Functions: increment_blog_views, is_user_admin, submit_blog_to_google_indexing, process_scheduled_linkedin_posts
*/

-- ============================================
-- 1. OPTIMIZE RLS POLICIES FOR PERFORMANCE
-- ============================================

-- Drop and recreate content_plans policies with optimized auth checks
DROP POLICY IF EXISTS "Users can view own content plans" ON content_plans;
DROP POLICY IF EXISTS "Users can create own content plans" ON content_plans;
DROP POLICY IF EXISTS "Users can update own content plans" ON content_plans;
DROP POLICY IF EXISTS "Users can delete own content plans" ON content_plans;

CREATE POLICY "Users can view own content plans"
  ON content_plans
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create own content plans"
  ON content_plans
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own content plans"
  ON content_plans
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own content plans"
  ON content_plans
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- Drop and recreate content_plan_outputs policies with optimized auth checks
DROP POLICY IF EXISTS "Users can view own plan outputs" ON content_plan_outputs;
DROP POLICY IF EXISTS "Users can create plan outputs" ON content_plan_outputs;

CREATE POLICY "Users can view own plan outputs"
  ON content_plan_outputs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM content_plans
      WHERE content_plans.id = content_plan_outputs.content_plan_id
      AND content_plans.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can create plan outputs"
  ON content_plan_outputs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM content_plans
      WHERE content_plans.id = content_plan_outputs.content_plan_id
      AND content_plans.user_id = (select auth.uid())
    )
  );

-- Drop and recreate blog_views policy with optimized auth check
DROP POLICY IF EXISTS "Admin can view blog statistics" ON blog_views;

CREATE POLICY "Admin can view blog statistics"
  ON blog_views FOR SELECT
  TO authenticated
  USING ((select auth.jwt()) -> 'email' = '"stein@fishdigital.be"');

-- ============================================
-- 2. FIX MULTIPLE PERMISSIVE POLICIES ON BLOGS
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage all blogs" ON blogs;
DROP POLICY IF EXISTS "Anyone can view published blogs" ON blogs;
DROP POLICY IF EXISTS "Public can view published blogs" ON blogs;

-- Create single comprehensive SELECT policy
CREATE POLICY "Users can view published or admin can view all"
  ON blogs
  FOR SELECT
  TO authenticated
  USING (status = 'published' OR is_user_admin());

-- Recreate admin management policy (for INSERT/UPDATE/DELETE)
CREATE POLICY "Admins can manage all blogs"
  ON blogs
  FOR ALL
  TO authenticated
  USING (is_user_admin())
  WITH CHECK (is_user_admin());

-- ============================================
-- 3. REMOVE UNUSED INDEXES
-- ============================================

DROP INDEX IF EXISTS idx_blogs_author_email;
DROP INDEX IF EXISTS idx_orders_promo_code_id;
DROP INDEX IF EXISTS idx_orders_stripe_session_id;
DROP INDEX IF EXISTS idx_orders_status;
DROP INDEX IF EXISTS idx_customers_email;
DROP INDEX IF EXISTS idx_promotional_emails_customer_id;
DROP INDEX IF EXISTS idx_meta_conversion_logs_created_at;
DROP INDEX IF EXISTS idx_linkedin_conversion_logs_created_at;
DROP INDEX IF EXISTS idx_blogs_related_blog_ids;
DROP INDEX IF EXISTS idx_promo_codes_is_active;
DROP INDEX IF EXISTS idx_customers_user_id;
DROP INDEX IF EXISTS idx_image_generation_logs_created_at;
DROP INDEX IF EXISTS idx_customers_user_id_id;
DROP INDEX IF EXISTS idx_blogs_linkedin_post_id;
DROP INDEX IF EXISTS idx_google_indexing_log_status;
DROP INDEX IF EXISTS idx_google_indexing_log_submitted_at;
DROP INDEX IF EXISTS idx_content_plans_created_at;
DROP INDEX IF EXISTS idx_blog_views_viewed_at;
DROP INDEX IF EXISTS idx_blogs_views_count;

-- ============================================
-- 4. FIX FUNCTION SEARCH PATH SECURITY
-- ============================================

-- Fix increment_blog_views function
CREATE OR REPLACE FUNCTION increment_blog_views()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.blogs
  SET views_count = views_count + 1
  WHERE id = NEW.blog_id;
  RETURN NEW;
END;
$$;

-- Fix is_user_admin function
CREATE OR REPLACE FUNCTION is_user_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.customers
    WHERE user_id = auth.uid()
    AND is_admin = true
  );
END;
$$;

-- Fix submit_blog_to_google_indexing function
CREATE OR REPLACE FUNCTION submit_blog_to_google_indexing()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  blog_url text;
  function_url text;
  supabase_url text;
  anon_key text;
  http_response jsonb;
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.status = 'published') OR 
     (TG_OP = 'UPDATE' AND OLD.status != 'published' AND NEW.status = 'published') THEN
    
    blog_url := 'https://ebookgenerator.ai/blog/' || NEW.slug;
    
    supabase_url := current_setting('app.settings.supabase_url', true);
    anon_key := current_setting('app.settings.supabase_anon_key', true);
    
    IF supabase_url IS NULL THEN
      supabase_url := 'https://kkrdtrxnlaqhkoxivckp.supabase.co';
    END IF;
    
    function_url := supabase_url || '/functions/v1/submit-to-google-indexing';
    
    INSERT INTO public.google_indexing_log (blog_id, url, status, request_type)
    VALUES (NEW.id, blog_url, 'pending', 'URL_UPDATED');
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Fix process_scheduled_linkedin_posts function
CREATE OR REPLACE FUNCTION process_scheduled_linkedin_posts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  supabase_url text;
  service_role_key text;
BEGIN
  supabase_url := current_setting('request.headers', true)::json->>'x-forwarded-host';
  
  IF supabase_url IS NULL OR supabase_url = '' THEN
    supabase_url := 'https://' || current_setting('app.settings.project_ref', true) || '.supabase.co';
  END IF;
  
  PERFORM net.http_post(
    url := supabase_url || '/functions/v1/process-scheduled-linkedin-posts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    )
  );
END;
$$;