-- ============================================
-- EMERGENCY FIX: Temporarily Disable RLS to Test Dashboards
-- ============================================
-- This will temporarily disable RLS so we can verify the dashboards work
-- Then we'll re-enable with a proper fix using database functions

-- ============================================
-- STEP 1: DISABLE RLS TEMPORARILY
-- ============================================

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE listings DISABLE ROW LEVEL SECURITY;
ALTER TABLE guests DISABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 2: VERIFY RLS IS DISABLED
-- ============================================

SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'listings', 'guests');

-- Expected: rowsecurity = false for all three tables

-- ============================================
-- INSTRUCTIONS
-- ============================================
-- 1. Run this script in Supabase SQL Editor
-- 2. Refresh your browser
-- 3. Log in as testadmin@hostops.com
-- 4. You should now see the Admin Dashboard without errors
-- 5. Once verified working, we'll re-enable RLS with proper policies
