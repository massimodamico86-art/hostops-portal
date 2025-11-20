-- ============================================================================
-- RLS/RBAC Policy Verification Script
-- ============================================================================
-- This script verifies that all RLS policies are correctly configured.
-- It checks policy existence and structure, but does NOT test access control.
--
-- NOTE: RLS access control testing requires the Supabase API, not SQL Editor.
-- Use the Supabase Dashboard or client libraries to test actual data access.
-- ============================================================================

SELECT
  '════════════════════════════════════════════════════' as separator,
  'RLS/RBAC POLICY VERIFICATION' as title,
  '════════════════════════════════════════════════════' as separator2;

-- ============================================================================
-- TEST 1: Verify All Tables Have RLS Enabled
-- ============================================================================

SELECT
  '─────────────────────────────────────────────────────' as separator,
  'TEST 1: RLS Enabled on All Tables' as test_name;

WITH rls_status AS (
  SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename IN ('profiles', 'listings', 'guests', 'tv_devices', 'qr_codes', 'pms_connections', 'activity_log')
)
SELECT
  tablename,
  CASE
    WHEN rls_enabled THEN '✓ ENABLED'
    ELSE '✗ DISABLED'
  END as status
FROM rls_status
ORDER BY tablename;

-- ============================================================================
-- TEST 2: Verify Policy Count (28 total, 4 per table)
-- ============================================================================

SELECT
  '─────────────────────────────────────────────────────' as separator,
  'TEST 2: Policy Count Verification' as test_name;

WITH policy_counts AS (
  SELECT
    tablename,
    COUNT(*) as policy_count,
    array_agg(policyname ORDER BY policyname) as policies
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('profiles', 'listings', 'guests', 'tv_devices', 'qr_codes', 'pms_connections', 'activity_log')
  GROUP BY tablename
)
SELECT
  tablename,
  policy_count,
  CASE
    WHEN policy_count = 4 THEN '✓ PASS (4 policies)'
    ELSE '✗ FAIL (expected 4, got ' || policy_count || ')'
  END as status
FROM policy_counts
ORDER BY tablename;

-- Overall count
WITH total_policies AS (
  SELECT COUNT(*) as total
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('profiles', 'listings', 'guests', 'tv_devices', 'qr_codes', 'pms_connections', 'activity_log')
)
SELECT
  'TOTAL' as tablename,
  total as policy_count,
  CASE
    WHEN total = 28 THEN '✓ PASS (28 policies)'
    ELSE '✗ FAIL (expected 28, got ' || total || ')'
  END as status
FROM total_policies;

-- ============================================================================
-- TEST 3: Verify Helper Functions Exist
-- ============================================================================

SELECT
  '─────────────────────────────────────────────────────' as separator,
  'TEST 3: Helper Functions' as test_name;

WITH functions AS (
  SELECT
    proname as function_name,
    CASE
      WHEN prosecdef THEN 'SECURITY DEFINER'
      ELSE 'SECURITY INVOKER'
    END as security_type
  FROM pg_proc
  WHERE pronamespace = 'public'::regnamespace
    AND proname IN ('is_super_admin', 'is_admin', 'get_my_client_ids')
)
SELECT
  function_name,
  security_type,
  '✓ EXISTS' as status
FROM functions
ORDER BY function_name;

-- ============================================================================
-- TEST 4: Verify Policy Structure for Each Table
-- ============================================================================

SELECT
  '─────────────────────────────────────────────────────' as separator,
  'TEST 4: Policy Details' as test_name;

SELECT
  tablename,
  policyname,
  cmd as operation,
  CASE
    WHEN qual IS NOT NULL THEN '✓ USING clause'
    ELSE '  (none)'
  END as using_clause,
  CASE
    WHEN with_check IS NOT NULL THEN '✓ WITH CHECK clause'
    ELSE '  (none)'
  END as with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'listings', 'guests', 'tv_devices', 'qr_codes', 'pms_connections', 'activity_log')
ORDER BY tablename, cmd, policyname;

-- ============================================================================
-- TEST 5: Verify Profiles Policies Allow Self-Registration
-- ============================================================================

SELECT
  '─────────────────────────────────────────────────────' as separator,
  'TEST 5: Self-Registration Policy Check' as test_name;

SELECT
  policyname,
  cmd,
  with_check,
  CASE
    WHEN with_check LIKE '%id = auth.uid()%' OR with_check LIKE '%id = auth.uid() OR%' THEN '✓ PASS (allows self-registration)'
    ELSE '✗ FAIL (may not allow self-registration)'
  END as self_registration_status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles'
  AND cmd = 'INSERT';

-- ============================================================================
-- TEST 6: Verify Activity Log Has UPDATE and DELETE Policies
-- ============================================================================

SELECT
  '─────────────────────────────────────────────────────' as separator,
  'TEST 6: Activity Log Modification Policies' as test_name;

WITH activity_policies AS (
  SELECT
    cmd,
    EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activity_log' AND cmd = 'UPDATE') as has_update,
    EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activity_log' AND cmd = 'DELETE') as has_delete
  FROM pg_policies
  WHERE tablename = 'activity_log'
  LIMIT 1
)
SELECT
  'UPDATE policy' as policy_type,
  CASE WHEN has_update THEN '✓ EXISTS' ELSE '✗ MISSING' END as status
FROM activity_policies
UNION ALL
SELECT
  'DELETE policy' as policy_type,
  CASE WHEN has_delete THEN '✓ EXISTS' ELSE '✗ MISSING' END as status
FROM activity_policies;

-- ============================================================================
-- TEST 7: Verify Permissions Granted to Authenticated Role
-- ============================================================================

SELECT
  '─────────────────────────────────────────────────────' as separator,
  'TEST 7: Table Permissions for authenticated Role' as test_name;

SELECT
  table_name,
  string_agg(DISTINCT privilege_type, ', ' ORDER BY privilege_type) as granted_privileges,
  CASE
    WHEN COUNT(*) >= 4 THEN '✓ HAS PERMISSIONS'
    ELSE '⚠ LIMITED PERMISSIONS'
  END as status
FROM information_schema.table_privileges
WHERE grantee = 'authenticated'
  AND table_schema = 'public'
  AND table_name IN ('profiles', 'listings', 'guests', 'tv_devices', 'qr_codes', 'pms_connections', 'activity_log')
GROUP BY table_name
ORDER BY table_name;

-- ============================================================================
-- SUMMARY
-- ============================================================================

SELECT
  '════════════════════════════════════════════════════' as separator,
  'VERIFICATION COMPLETE' as summary,
  '════════════════════════════════════════════════════' as separator2;

SELECT
  'All structural checks completed.' as message,
  'To test actual RLS access control, use the Supabase API or Dashboard.' as note;
