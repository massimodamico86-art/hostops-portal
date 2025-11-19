-- =====================================================
-- CREATE TEST USERS FOR ROLE TESTING
-- =====================================================
-- This migration creates test users for admin and client roles
-- IMPORTANT: Run this in Supabase SQL Editor, NOT via migration

-- =====================================================
-- STEP 1: Create Auth Users via Supabase Dashboard
-- =====================================================
-- You CANNOT create auth users via SQL - must use Supabase Dashboard or API
-- Go to: Authentication → Users → Add User
--
-- Create these users:
--
-- 1. Admin Test User
--    Email: admin@hostops-test.com
--    Password: TestAdmin123!
--    Auto Confirm User: ✓ YES
--    Send Magic Link: ✗ NO
--
-- 2. Client Test User
--    Email: client@hostops-test.com
--    Password: TestClient123!
--    Auto Confirm User: ✓ YES
--    Send Magic Link: ✗ NO

-- =====================================================
-- STEP 2: After creating auth users, get their UUIDs
-- =====================================================
-- Run this query to get the user IDs:

SELECT id, email, created_at
FROM auth.users
WHERE email IN ('admin@hostops-test.com', 'client@hostops-test.com')
ORDER BY email;

-- Copy the UUIDs and replace them in the INSERT statements below

-- =====================================================
-- STEP 3: Create Profile Records
-- =====================================================
-- Replace 'ADMIN_USER_ID_HERE' and 'CLIENT_USER_ID_HERE' with actual UUIDs from Step 2

-- Insert admin profile
INSERT INTO public.profiles (id, email, full_name, role, managed_by)
VALUES (
  'ADMIN_USER_ID_HERE', -- Replace with actual UUID from Step 2
  'admin@hostops-test.com',
  'Test Admin User',
  'admin',
  NULL -- Admins are not managed by anyone
)
ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  managed_by = EXCLUDED.managed_by;

-- Insert client profile
INSERT INTO public.profiles (id, email, full_name, role, managed_by)
VALUES (
  'CLIENT_USER_ID_HERE', -- Replace with actual UUID from Step 2
  'client@hostops-test.com',
  'Test Client User',
  'client',
  NULL -- Set to admin's user ID if you want this client managed by the test admin
)
ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  managed_by = EXCLUDED.managed_by;

-- =====================================================
-- STEP 4: Verify Profiles Were Created
-- =====================================================

SELECT id, email, full_name, role, managed_by, created_at
FROM public.profiles
WHERE email IN ('admin@hostops-test.com', 'client@hostops-test.com')
ORDER BY role;

-- Expected Result:
-- | id | email | full_name | role | managed_by | created_at |
-- |----|-------|-----------|------|------------|------------|
-- | ... | admin@hostops-test.com | Test Admin User | admin | NULL | ... |
-- | ... | client@hostops-test.com | Test Client User | client | NULL | ... |

-- =====================================================
-- OPTIONAL: Assign Client to Admin
-- =====================================================
-- If you want the test client to be managed by the test admin:
--
-- 1. Copy the admin's user ID from Step 4
-- 2. Run this update:
--
-- UPDATE public.profiles
-- SET managed_by = 'ADMIN_USER_ID_HERE'
-- WHERE email = 'client@hostops-test.com';

-- =====================================================
-- TEST CREDENTIALS SUMMARY
-- =====================================================
--
-- Super Admin (existing):
-- Email: mvproperties305@gmail.com
-- Password: [Your existing password]
-- Role: super_admin
--
-- Admin (test):
-- Email: admin@hostops-test.com
-- Password: TestAdmin123!
-- Role: admin
--
-- Client (test):
-- Email: client@hostops-test.com
-- Password: TestClient123!
-- Role: client
