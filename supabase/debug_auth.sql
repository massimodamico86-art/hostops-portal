-- Debug function to check auth context and profile access
-- Run this in Supabase SQL Editor when logged in as a user

CREATE OR REPLACE FUNCTION debug_auth_context()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Gather debug information
  SELECT jsonb_build_object(
    'current_user_id', auth.uid(),
    'current_role', current_setting('role', true),
    'jwt_claims', current_setting('request.jwt.claims', true)::jsonb,
    'profile_exists', EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid()),
    'profile_data', (SELECT row_to_json(p.*) FROM profiles p WHERE id = auth.uid()),
    'rls_policies', (
      SELECT jsonb_agg(jsonb_build_object(
        'policy_name', polname,
        'command', polcmd,
        'permissive', polpermissive
      ))
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'profiles'
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION debug_auth_context() TO authenticated;

-- Example usage in browser console:
-- const { data, error } = await window.supabase.rpc('debug_auth_context');
-- console.log('Debug info:', data);
