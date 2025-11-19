-- TEMPORARY: Disable RLS on profiles table to unblock development
-- WARNING: This removes security temporarily - must re-enable with proper policies later

-- Step 1: Disable RLS completely on profiles table
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Verify the profile exists
SELECT id, email, full_name, role, created_at
FROM public.profiles
WHERE email = 'vmdamico615@gmail.com';

-- Step 3: Show current policies (for reference)
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'profiles';
