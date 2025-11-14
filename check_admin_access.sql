-- Quick check: Can admin access their own profile?
-- Run this in Supabase SQL Editor

-- Step 1: Verify testadmin profile exists and has correct role
SELECT
  id,
  email,
  role,
  managed_by,
  created_at
FROM profiles
WHERE email = 'testadmin@hostops.com';

-- Step 2: Check what policies exist on profiles table
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Step 3: If policies don't exist, the migration wasn't run
-- You need to run: supabase/migrations/003_add_roles_and_rbac.sql
