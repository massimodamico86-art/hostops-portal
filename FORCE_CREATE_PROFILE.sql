-- FORCE CREATE PROFILE - Bypass RLS temporarily
-- Run this in Supabase SQL Editor

-- Step 1: Temporarily disable RLS on profiles table
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Force create the profile
INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
VALUES (
  'b7c6a6f9-718e-4c26-a3aa-c1ab9060b8b6',  -- The user ID from your screenshot
  'vmdamico615@gmail.com',
  'vmdamico615',
  'client',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  updated_at = NOW();

-- Step 3: Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Ensure the INSERT policy exists for authenticated users
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Step 5: Ensure the SELECT policy exists for authenticated users
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Step 6: Verify the profile exists
SELECT id, email, full_name, role, created_at
FROM public.profiles
WHERE id = 'b7c6a6f9-718e-4c26-a3aa-c1ab9060b8b6';
