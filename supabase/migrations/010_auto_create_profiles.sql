-- Migration: Auto-create profiles for new auth users
-- This replaces the insecure client-side auto-profile creation
-- with a secure server-side database trigger

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'client', -- Default role for all new users
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent duplicate key errors if profile already exists

  RETURN NEW;
END;
$$;

-- Create trigger that fires when a new user is created in auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Add comment explaining the trigger
COMMENT ON FUNCTION public.handle_new_user() IS
'Automatically creates a profile in public.profiles when a new user signs up via Supabase Auth. This ensures all authenticated users have a profile with the default client role.';
