-- ============================================
-- FINAL FIX: RLS Policies + Auth Debugging
-- ============================================
-- This script will:
-- 1. Simplify RLS policies to absolute minimum
-- 2. Add logging to debug auth issues
-- 3. Verify user setup

-- ============================================
-- STEP 1: VERIFY USERS EXIST
-- ============================================

-- Check if users exist
SELECT
  id,
  email,
  role,
  managed_by,
  created_at
FROM profiles
WHERE email IN ('testadmin@hostops.com', 'testclient1@hostops.com', 'mvproperties305@gmail.com')
ORDER BY email;

-- ============================================
-- STEP 2: SIMPLIFY RLS POLICIES (MINIMAL)
-- ============================================

-- Drop all existing policies
DROP POLICY IF EXISTS "View profiles based on role" ON profiles;
DROP POLICY IF EXISTS "Update profiles based on role" ON profiles;
DROP POLICY IF EXISTS "Insert profiles based on role" ON profiles;
DROP POLICY IF EXISTS "Delete profiles based on role" ON profiles;

-- Create SIMPLE policies that prioritize self-access
CREATE POLICY "profiles_select_policy"
ON profiles FOR SELECT
USING (
  -- ALWAYS allow users to see their own profile first
  id = auth.uid()
  OR
  -- Super admins see all (simple check)
  (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1) = 'super_admin'
  OR
  -- Admins see clients they manage
  (
    (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1) = 'admin'
    AND managed_by = auth.uid()
  )
);

CREATE POLICY "profiles_update_policy"
ON profiles FOR UPDATE
USING (
  id = auth.uid()
  OR
  (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1) = 'super_admin'
  OR
  (
    (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1) = 'admin'
    AND managed_by = auth.uid()
  )
);

CREATE POLICY "profiles_insert_policy"
ON profiles FOR INSERT
WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1) IN ('super_admin', 'admin')
);

CREATE POLICY "profiles_delete_policy"
ON profiles FOR DELETE
USING (
  (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1) = 'super_admin'
);

-- ============================================
-- STEP 3: FIX LISTINGS POLICIES
-- ============================================

DROP POLICY IF EXISTS "View listings based on role" ON listings;
DROP POLICY IF EXISTS "Insert listings based on role" ON listings;
DROP POLICY IF EXISTS "Update listings based on role" ON listings;
DROP POLICY IF EXISTS "Delete listings based on role" ON listings;

CREATE POLICY "listings_select_policy"
ON listings FOR SELECT
USING (
  -- Clients see their own
  owner_id = auth.uid()
  OR
  -- Super admins see all
  (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1) = 'super_admin'
  OR
  -- Admins see listings of managed clients
  owner_id IN (
    SELECT id FROM profiles
    WHERE managed_by = auth.uid()
  )
);

CREATE POLICY "listings_insert_policy"
ON listings FOR INSERT
WITH CHECK (
  owner_id = auth.uid()
  OR
  (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1) = 'super_admin'
  OR
  (
    (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1) = 'admin'
    AND owner_id IN (SELECT id FROM profiles WHERE managed_by = auth.uid())
  )
);

CREATE POLICY "listings_update_policy"
ON listings FOR UPDATE
USING (
  owner_id = auth.uid()
  OR
  (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1) = 'super_admin'
  OR
  owner_id IN (SELECT id FROM profiles WHERE managed_by = auth.uid())
);

CREATE POLICY "listings_delete_policy"
ON listings FOR DELETE
USING (
  owner_id = auth.uid()
  OR
  (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1) = 'super_admin'
  OR
  owner_id IN (SELECT id FROM profiles WHERE managed_by = auth.uid())
);

-- ============================================
-- STEP 4: FIX GUESTS POLICIES
-- ============================================

DROP POLICY IF EXISTS "View guests based on role" ON guests;
DROP POLICY IF EXISTS "Insert guests based on role" ON guests;
DROP POLICY IF EXISTS "Update guests based on role" ON guests;
DROP POLICY IF EXISTS "Delete guests based on role" ON guests;

CREATE POLICY "guests_select_policy"
ON guests FOR SELECT
USING (
  -- Super admins see all
  (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1) = 'super_admin'
  OR
  -- Clients see guests of their own listings
  listing_id IN (
    SELECT id FROM listings WHERE owner_id = auth.uid()
  )
  OR
  -- Admins see guests of managed clients' listings
  listing_id IN (
    SELECT l.id FROM listings l
    INNER JOIN profiles p ON l.owner_id = p.id
    WHERE p.managed_by = auth.uid()
  )
);

CREATE POLICY "guests_insert_policy"
ON guests FOR INSERT
WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1) = 'super_admin'
  OR
  listing_id IN (SELECT id FROM listings WHERE owner_id = auth.uid())
  OR
  listing_id IN (
    SELECT l.id FROM listings l
    INNER JOIN profiles p ON l.owner_id = p.id
    WHERE p.managed_by = auth.uid()
  )
);

CREATE POLICY "guests_update_policy"
ON guests FOR UPDATE
USING (
  (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1) = 'super_admin'
  OR
  listing_id IN (SELECT id FROM listings WHERE owner_id = auth.uid())
  OR
  listing_id IN (
    SELECT l.id FROM listings l
    INNER JOIN profiles p ON l.owner_id = p.id
    WHERE p.managed_by = auth.uid()
  )
);

CREATE POLICY "guests_delete_policy"
ON guests FOR DELETE
USING (
  (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1) = 'super_admin'
  OR
  listing_id IN (SELECT id FROM listings WHERE owner_id = auth.uid())
  OR
  listing_id IN (
    SELECT l.id FROM listings l
    INNER JOIN profiles p ON l.owner_id = p.id
    WHERE p.managed_by = auth.uid()
  )
);

-- ============================================
-- STEP 5: VERIFY POLICIES CREATED
-- ============================================

SELECT
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'listings', 'guests')
ORDER BY tablename, policyname;

-- ============================================
-- STEP 6: TEST AUTH CONTEXT
-- ============================================

-- This should return the current user's profile
SELECT
  id,
  email,
  role,
  managed_by,
  'Current auth.uid() = ' || auth.uid() AS debug_info
FROM profiles
WHERE id = auth.uid();
