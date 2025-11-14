-- ============================================
-- PROPER RLS FIX: Using Database Functions
-- ============================================
-- This approach uses PostgreSQL functions to avoid recursion in RLS policies
-- Run this AFTER verifying dashboards work with RLS disabled

-- ============================================
-- STEP 1: CREATE HELPER FUNCTIONS
-- ============================================

-- Function to get current user's role (avoids recursion)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Function to check if current user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
$$;

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Function to get IDs of clients managed by current admin
CREATE OR REPLACE FUNCTION public.get_my_client_ids()
RETURNS TABLE(client_id UUID)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id FROM profiles
  WHERE managed_by = auth.uid() AND role = 'client';
$$;

-- ============================================
-- STEP 2: DROP OLD POLICIES
-- ============================================

-- Profiles
DROP POLICY IF EXISTS "View profiles based on role" ON profiles;
DROP POLICY IF EXISTS "Update profiles based on role" ON profiles;
DROP POLICY IF EXISTS "Insert profiles based on role" ON profiles;
DROP POLICY IF EXISTS "Delete profiles based on role" ON profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;

-- Listings
DROP POLICY IF EXISTS "View listings based on role" ON listings;
DROP POLICY IF EXISTS "Insert listings based on role" ON listings;
DROP POLICY IF EXISTS "Update listings based on role" ON listings;
DROP POLICY IF EXISTS "Delete listings based on role" ON listings;
DROP POLICY IF EXISTS "listings_select_policy" ON listings;
DROP POLICY IF EXISTS "listings_insert_policy" ON listings;
DROP POLICY IF EXISTS "listings_update_policy" ON listings;
DROP POLICY IF EXISTS "listings_delete_policy" ON listings;

-- Guests
DROP POLICY IF EXISTS "View guests based on role" ON guests;
DROP POLICY IF EXISTS "Insert guests based on role" ON guests;
DROP POLICY IF EXISTS "Update guests based on role" ON guests;
DROP POLICY IF EXISTS "Delete guests based on role" ON guests;
DROP POLICY IF EXISTS "guests_select_policy" ON guests;
DROP POLICY IF EXISTS "guests_insert_policy" ON guests;
DROP POLICY IF EXISTS "guests_update_policy" ON guests;
DROP POLICY IF EXISTS "guests_delete_policy" ON guests;

-- ============================================
-- STEP 3: CREATE NEW POLICIES USING FUNCTIONS
-- ============================================

-- PROFILES TABLE
CREATE POLICY "profiles_select_policy"
ON profiles FOR SELECT
USING (
  id = auth.uid()                    -- Users see their own profile
  OR is_super_admin()                -- Super admins see all
  OR (is_admin() AND managed_by = auth.uid())  -- Admins see managed clients
);

CREATE POLICY "profiles_update_policy"
ON profiles FOR UPDATE
USING (
  id = auth.uid()
  OR is_super_admin()
  OR (is_admin() AND managed_by = auth.uid())
);

CREATE POLICY "profiles_insert_policy"
ON profiles FOR INSERT
WITH CHECK (
  is_super_admin() OR is_admin()
);

CREATE POLICY "profiles_delete_policy"
ON profiles FOR DELETE
USING (
  is_super_admin()
);

-- LISTINGS TABLE
CREATE POLICY "listings_select_policy"
ON listings FOR SELECT
USING (
  owner_id = auth.uid()              -- Clients see own listings
  OR is_super_admin()                -- Super admins see all
  OR (is_admin() AND owner_id IN (SELECT client_id FROM get_my_client_ids()))  -- Admins see managed clients' listings
);

CREATE POLICY "listings_insert_policy"
ON listings FOR INSERT
WITH CHECK (
  owner_id = auth.uid()
  OR is_super_admin()
  OR (is_admin() AND owner_id IN (SELECT client_id FROM get_my_client_ids()))
);

CREATE POLICY "listings_update_policy"
ON listings FOR UPDATE
USING (
  owner_id = auth.uid()
  OR is_super_admin()
  OR (is_admin() AND owner_id IN (SELECT client_id FROM get_my_client_ids()))
);

CREATE POLICY "listings_delete_policy"
ON listings FOR DELETE
USING (
  owner_id = auth.uid()
  OR is_super_admin()
  OR (is_admin() AND owner_id IN (SELECT client_id FROM get_my_client_ids()))
);

-- GUESTS TABLE
CREATE POLICY "guests_select_policy"
ON guests FOR SELECT
USING (
  is_super_admin()
  OR listing_id IN (SELECT id FROM listings WHERE owner_id = auth.uid())
  OR (is_admin() AND listing_id IN (
    SELECT l.id FROM listings l
    WHERE l.owner_id IN (SELECT client_id FROM get_my_client_ids())
  ))
);

CREATE POLICY "guests_insert_policy"
ON guests FOR INSERT
WITH CHECK (
  is_super_admin()
  OR listing_id IN (SELECT id FROM listings WHERE owner_id = auth.uid())
  OR (is_admin() AND listing_id IN (
    SELECT l.id FROM listings l
    WHERE l.owner_id IN (SELECT client_id FROM get_my_client_ids())
  ))
);

CREATE POLICY "guests_update_policy"
ON guests FOR UPDATE
USING (
  is_super_admin()
  OR listing_id IN (SELECT id FROM listings WHERE owner_id = auth.uid())
  OR (is_admin() AND listing_id IN (
    SELECT l.id FROM listings l
    WHERE l.owner_id IN (SELECT client_id FROM get_my_client_ids())
  ))
);

CREATE POLICY "guests_delete_policy"
ON guests FOR DELETE
USING (
  is_super_admin()
  OR listing_id IN (SELECT id FROM listings WHERE owner_id = auth.uid())
  OR (is_admin() AND listing_id IN (
    SELECT l.id FROM listings l
    WHERE l.owner_id IN (SELECT client_id FROM get_my_client_ids())
  ))
);

-- ============================================
-- STEP 4: RE-ENABLE RLS
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 5: VERIFY SETUP
-- ============================================

-- Check functions exist
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('get_my_role', 'is_super_admin', 'is_admin', 'get_my_client_ids');

-- Check policies exist
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'listings', 'guests')
ORDER BY tablename, policyname;

-- Test: Get your own profile (should work for anyone)
SELECT id, email, role, managed_by
FROM profiles
WHERE id = auth.uid();
