-- Verify RLS Policies for RBAC System
-- Run this in Supabase SQL Editor to check if policies exist

-- 1. Check if RLS is enabled on profiles table
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'profiles';

-- 2. List all policies on profiles table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles'
ORDER BY policyname;

-- 3. Check if role column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name IN ('role', 'managed_by');

-- 4. Test admin user can read own profile
-- Replace 'ADMIN_USER_ID' with the actual admin user ID
SET request.jwt.claims.sub = '7e35cb8c-86e4-4da7-96f7-f96e7b6fa37c';
SELECT id, email, role, managed_by FROM profiles WHERE id = auth.uid();

-- 5. Check if testadmin profile exists with correct role
SELECT id, email, role, managed_by
FROM profiles
WHERE email = 'testadmin@hostops.com';
