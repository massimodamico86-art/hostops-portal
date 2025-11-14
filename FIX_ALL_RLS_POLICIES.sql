-- Complete RLS Policy Fix for Admin Dashboard
-- Run this entire script in Supabase SQL Editor

-- ============================================
-- 1. FIX PROFILES TABLE
-- ============================================

DROP POLICY IF EXISTS "View profiles based on role" ON profiles;
DROP POLICY IF EXISTS "Update profiles based on role" ON profiles;
DROP POLICY IF EXISTS "Insert profiles based on role" ON profiles;
DROP POLICY IF EXISTS "Delete profiles based on role" ON profiles;

-- View policy (optimized)
CREATE POLICY "View profiles based on role"
ON profiles FOR SELECT
USING (
  -- Everyone sees their own profile FIRST (fastest path)
  id = auth.uid()
  OR
  -- Super admins see all
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  )
  OR
  -- Admins see their assigned clients
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
      AND profiles.managed_by = auth.uid()
  )
);

-- Update policy
CREATE POLICY "Update profiles based on role"
ON profiles FOR UPDATE
USING (
  -- Own profile
  id = auth.uid()
  OR
  -- Super admin can update anyone
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  )
  OR
  -- Admins can update assigned clients
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
      AND profiles.managed_by = auth.uid()
  )
);

-- Insert policy
CREATE POLICY "Insert profiles based on role"
ON profiles FOR INSERT
WITH CHECK (
  -- Super admins can create anyone
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  )
  OR
  -- Admins can create clients
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
      AND profiles.role = 'client'
  )
);

-- Delete policy
CREATE POLICY "Delete profiles based on role"
ON profiles FOR DELETE
USING (
  -- Only super admins can delete
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- ============================================
-- 2. FIX LISTINGS TABLE
-- ============================================

DROP POLICY IF EXISTS "View listings based on role" ON listings;
DROP POLICY IF EXISTS "Insert listings based on role" ON listings;
DROP POLICY IF EXISTS "Update listings based on role" ON listings;
DROP POLICY IF EXISTS "Delete listings based on role" ON listings;

-- View policy
CREATE POLICY "View listings based on role"
ON listings FOR SELECT
USING (
  -- Super admins see all
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  )
  OR
  -- Admins see assigned clients' listings
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
      AND listings.owner_id IN (
        SELECT id FROM profiles WHERE managed_by = auth.uid()
      )
  )
  OR
  -- Clients see own listings
  (owner_id = auth.uid())
);

-- Insert policy
CREATE POLICY "Insert listings based on role"
ON listings FOR INSERT
WITH CHECK (
  -- Super admins can create for anyone
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  )
  OR
  -- Admins can create for assigned clients
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
      AND owner_id IN (SELECT id FROM profiles WHERE managed_by = auth.uid())
  )
  OR
  -- Clients can create their own
  (owner_id = auth.uid())
);

-- Update policy
CREATE POLICY "Update listings based on role"
ON listings FOR UPDATE
USING (
  -- Super admins can update any
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  )
  OR
  -- Admins can update assigned clients' listings
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
      AND owner_id IN (SELECT id FROM profiles WHERE managed_by = auth.uid())
  )
  OR
  -- Clients can update own
  (owner_id = auth.uid())
);

-- Delete policy
CREATE POLICY "Delete listings based on role"
ON listings FOR DELETE
USING (
  -- Super admins can delete any
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  )
  OR
  -- Admins can delete assigned clients' listings
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
      AND owner_id IN (SELECT id FROM profiles WHERE managed_by = auth.uid())
  )
  OR
  -- Clients can delete own
  (owner_id = auth.uid())
);

-- ============================================
-- 3. FIX GUESTS TABLE
-- ============================================

DROP POLICY IF EXISTS "View guests based on role" ON guests;
DROP POLICY IF EXISTS "Insert guests based on role" ON guests;
DROP POLICY IF EXISTS "Update guests based on role" ON guests;
DROP POLICY IF EXISTS "Delete guests based on role" ON guests;

-- View policy
CREATE POLICY "View guests based on role"
ON guests FOR SELECT
USING (
  -- Super admins see all
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  )
  OR
  -- Admins see guests of assigned clients' listings
  EXISTS (
    SELECT 1
    FROM listings l
    INNER JOIN profiles p ON l.owner_id = p.id
    WHERE l.id = guests.listing_id
      AND p.managed_by = auth.uid()
  )
  OR
  -- Clients see guests of own listings
  EXISTS (
    SELECT 1 FROM listings
    WHERE listings.id = guests.listing_id
      AND listings.owner_id = auth.uid()
  )
);

-- Insert policy
CREATE POLICY "Insert guests based on role"
ON guests FOR INSERT
WITH CHECK (
  -- Super admins can insert for any listing
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  )
  OR
  -- Admins can insert for assigned clients' listings
  EXISTS (
    SELECT 1
    FROM listings l
    INNER JOIN profiles p ON l.owner_id = p.id
    WHERE l.id = listing_id
      AND p.managed_by = auth.uid()
  )
  OR
  -- Clients can insert for own listings
  EXISTS (
    SELECT 1 FROM listings
    WHERE listings.id = listing_id
      AND listings.owner_id = auth.uid()
  )
);

-- Update policy
CREATE POLICY "Update guests based on role"
ON guests FOR UPDATE
USING (
  -- Super admins can update any
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  )
  OR
  -- Admins can update guests of assigned clients' listings
  EXISTS (
    SELECT 1
    FROM listings l
    INNER JOIN profiles p ON l.owner_id = p.id
    WHERE l.id = guests.listing_id
      AND p.managed_by = auth.uid()
  )
  OR
  -- Clients can update guests of own listings
  EXISTS (
    SELECT 1 FROM listings
    WHERE listings.id = guests.listing_id
      AND listings.owner_id = auth.uid()
  )
);

-- Delete policy
CREATE POLICY "Delete guests based on role"
ON guests FOR DELETE
USING (
  -- Super admins can delete any
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  )
  OR
  -- Admins can delete guests of assigned clients' listings
  EXISTS (
    SELECT 1
    FROM listings l
    INNER JOIN profiles p ON l.owner_id = p.id
    WHERE l.id = guests.listing_id
      AND p.managed_by = auth.uid()
  )
  OR
  -- Clients can delete guests of own listings
  EXISTS (
    SELECT 1 FROM listings
    WHERE listings.id = guests.listing_id
      AND listings.owner_id = auth.uid()
  )
);

-- ============================================
-- 4. VERIFY SETUP
-- ============================================

-- Check that policies were created
SELECT
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'listings', 'guests')
ORDER BY tablename, policyname;

-- Test: Can you see your own profile?
SELECT id, email, role, managed_by
FROM profiles
WHERE id = auth.uid();
