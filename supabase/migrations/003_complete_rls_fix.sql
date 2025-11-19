-- =====================================================
-- COMPLETE RLS FIX - Drops ALL existing policies first
-- =====================================================
-- This migration completely resets RLS policies and role constraints
-- Run this if you get "policy already exists" errors

-- 1. DROP ALL existing profile policies (including new ones)
DROP POLICY IF EXISTS "users_read_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_insert_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "service_role_full_access_profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- 2. DROP the old role constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 3. ADD new role constraint with three roles
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('super_admin', 'admin', 'client'));

-- 4. CREATE comprehensive profile policies

-- Allow users to read their own profile
CREATE POLICY "users_read_own_profile" ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Allow users to insert their own profile (for auto-create)
CREATE POLICY "users_insert_own_profile" ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "users_update_own_profile" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow service_role to manage all profiles (for admin operations)
CREATE POLICY "service_role_full_access_profiles" ON public.profiles
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- 5. Add index on auth.uid() for faster RLS queries
CREATE INDEX IF NOT EXISTS idx_profiles_auth_uid ON public.profiles(id);

-- 6. Verify RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTION FOR DEBUGGING (Optional)
-- =====================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_auth_context();

-- Function to check current auth context
CREATE OR REPLACE FUNCTION get_auth_context()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT jsonb_build_object(
    'uid', auth.uid(),
    'role', auth.role(),
    'email', auth.email()
  );
$$;

GRANT EXECUTE ON FUNCTION get_auth_context() TO authenticated;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON POLICY "users_read_own_profile" ON public.profiles IS 'Users can read their own profile using auth.uid()';
COMMENT ON POLICY "users_insert_own_profile" ON public.profiles IS 'Users can insert their own profile for auto-creation';
COMMENT ON POLICY "users_update_own_profile" ON public.profiles IS 'Users can update their own profile';
COMMENT ON POLICY "service_role_full_access_profiles" ON public.profiles IS 'Service role has full access for admin operations';
