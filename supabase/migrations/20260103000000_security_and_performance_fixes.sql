-- Security and Performance Fixes Migration
-- Addresses Supabase Advisor warnings

-- ============================================
-- 1. FIX: Function search_path security issue
-- ============================================

-- Recreate handle_new_user with immutable search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    CASE 
      WHEN (SELECT COUNT(*) FROM public.profiles) = 0 THEN 'admin'
      ELSE 'viewer'
    END
  );
  RETURN NEW;
END;
$$;

-- Recreate update_updated_at with immutable search_path
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================
-- 2. FIX: Add missing index on products.created_by
-- ============================================

CREATE INDEX IF NOT EXISTS idx_products_created_by ON public.products(created_by);

-- ============================================
-- 3. FIX: Consolidate duplicate RLS policies
-- ============================================

-- Drop redundant policies for categories
-- Keep "Anyone can view categories" for SELECT
-- Modify "Admins can manage categories" to exclude SELECT (use INSERT, UPDATE, DELETE only)
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;

CREATE POLICY "Admins can insert categories"
  ON public.categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update categories"
  ON public.categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete categories"
  ON public.categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- Drop redundant policies for product_specs
-- Keep "Anyone can view product_specs" for SELECT
-- Modify "Admins can manage product_specs" to exclude SELECT
DROP POLICY IF EXISTS "Admins can manage product_specs" ON public.product_specs;

CREATE POLICY "Admins can insert product_specs"
  ON public.product_specs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update product_specs"
  ON public.product_specs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete product_specs"
  ON public.product_specs FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- 4. Add comments for documentation
-- ============================================

COMMENT ON FUNCTION public.handle_new_user IS 'Auto-creates profile on user signup. First user becomes admin.';
COMMENT ON FUNCTION public.update_updated_at IS 'Trigger function to auto-update updated_at timestamp.';
COMMENT ON INDEX public.idx_products_created_by IS 'Index for FK products.created_by to improve join performance.';
