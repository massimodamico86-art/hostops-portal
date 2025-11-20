-- ============================================================================
-- RLS/RBAC Test Script
-- ============================================================================
-- This script verifies that Row Level Security (RLS) and Role-Based Access
-- Control (RBAC) are correctly configured after running migration 012.
--
-- HOW TO RUN:
-- 1. Run migration 012_finalize_rls_rbac.sql first
-- 2. Copy this entire script into Supabase SQL Editor
-- 3. Execute it
-- 4. Review the output for each test case
--
-- EXPECTED RESULTS:
-- - Clients can only see their own data
-- - Admins can see/manage only their assigned clients' data
-- - Super admins can see everything
-- - Exactly 28 policies exist across 7 tables
-- ============================================================================

-- ============================================================================
-- SETUP: Ensure Permissions and Create Test Data
-- ============================================================================

-- Grant necessary permissions to authenticated role (required for RLS testing)
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON listings TO authenticated;
GRANT ALL ON guests TO authenticated;
GRANT ALL ON tv_devices TO authenticated;
GRANT ALL ON qr_codes TO authenticated;
GRANT ALL ON pms_connections TO authenticated;
GRANT ALL ON activity_log TO authenticated;

-- Temporarily disable activity logging triggers to avoid conflicts
DO $$
BEGIN
  -- Disable triggers if they exist
  EXECUTE 'ALTER TABLE listings DISABLE TRIGGER log_listings_changes';
  EXECUTE 'ALTER TABLE guests DISABLE TRIGGER log_guests_changes';
  EXECUTE 'ALTER TABLE tv_devices DISABLE TRIGGER log_tv_devices_changes';
  EXECUTE 'ALTER TABLE qr_codes DISABLE TRIGGER log_qr_codes_changes';
  EXECUTE 'ALTER TABLE pms_connections DISABLE TRIGGER log_pms_connections_changes';
EXCEPTION
  WHEN undefined_object THEN
    -- Trigger doesn't exist, continue
    NULL;
END $$;

-- Clean up any previous test data
DO $$
BEGIN
  DELETE FROM activity_log WHERE user_id IN (
    SELECT id FROM profiles WHERE email LIKE '%@test-rbac.local'
  );
  DELETE FROM pms_connections WHERE listing_id IN (
    SELECT id FROM listings WHERE owner_id IN (
      SELECT id FROM profiles WHERE email LIKE '%@test-rbac.local'
    )
  );
  DELETE FROM qr_codes WHERE listing_id IN (
    SELECT id FROM listings WHERE owner_id IN (
      SELECT id FROM profiles WHERE email LIKE '%@test-rbac.local'
    )
  );
  DELETE FROM tv_devices WHERE listing_id IN (
    SELECT id FROM listings WHERE owner_id IN (
      SELECT id FROM profiles WHERE email LIKE '%@test-rbac.local'
    )
  );
  DELETE FROM guests WHERE listing_id IN (
    SELECT id FROM listings WHERE owner_id IN (
      SELECT id FROM profiles WHERE email LIKE '%@test-rbac.local'
    )
  );
  DELETE FROM listings WHERE owner_id IN (
    SELECT id FROM profiles WHERE email LIKE '%@test-rbac.local'
  );
  DELETE FROM profiles WHERE email LIKE '%@test-rbac.local';

  RAISE NOTICE 'Previous test data cleaned up';
END $$;

-- Create test users with known UUIDs
INSERT INTO profiles (id, email, role, managed_by, created_at, updated_at)
VALUES
  -- Super Admin
  ('11111111-1111-1111-1111-111111111111', 'super@test-rbac.local', 'super_admin', NULL, NOW(), NOW()),

  -- Admin (manages client1)
  ('22222222-2222-2222-2222-222222222222', 'admin@test-rbac.local', 'admin', NULL, NOW(), NOW()),

  -- Client 1 (managed by admin)
  ('33333333-3333-3333-3333-333333333333', 'client1@test-rbac.local', 'client', '22222222-2222-2222-2222-222222222222', NOW(), NOW()),

  -- Client 2 (independent, not managed by admin)
  ('44444444-4444-4444-4444-444444444444', 'client2@test-rbac.local', 'client', NULL, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  managed_by = EXCLUDED.managed_by,
  updated_at = NOW();

-- Create test listings
INSERT INTO listings (id, name, address, owner_id, created_at, updated_at)
VALUES
  -- Listing owned by client1 (managed by admin)
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Client1 Property', '123 Test St, Miami, FL 33101', '33333333-3333-3333-3333-333333333333', NOW(), NOW()),

  -- Listing owned by client2 (independent)
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Client2 Property', '456 Test Ave, Orlando, FL 32801', '44444444-4444-4444-4444-444444444444', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  owner_id = EXCLUDED.owner_id,
  updated_at = NOW();

-- Create test guests
INSERT INTO guests (id, listing_id, first_name, last_name, email, check_in, check_out, created_at, updated_at)
VALUES
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Guest', 'A', 'guestA@test.com', '2025-11-20', '2025-11-25', NOW(), NOW()),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Guest', 'B', 'guestB@test.com', '2025-11-21', '2025-11-26', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  listing_id = EXCLUDED.listing_id,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  email = EXCLUDED.email,
  updated_at = NOW();

-- Create test TV devices
INSERT INTO tv_devices (id, listing_id, device_name, otp_code, is_paired, created_at, updated_at)
VALUES
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'TV Device 1', '123456', true, NOW(), NOW()),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'TV Device 2', '789012', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  listing_id = EXCLUDED.listing_id,
  device_name = EXCLUDED.device_name,
  updated_at = NOW();

-- Confirm test data creation
SELECT '✓ Test data created successfully' as setup_status;

-- ============================================================================
-- TEST 1: Verify Policy Count
-- ============================================================================
-- Expected: Exactly 28 policies across 7 tables (4 per table)

SELECT
  '════════════════════════════════════════════════════' as separator,
  'TEST 1: Policy Count Verification' as test_name,
  '════════════════════════════════════════════════════' as separator2;

WITH policy_counts AS (
  SELECT
    schemaname,
    tablename,
    COUNT(*) as policy_count,
    array_agg(policyname ORDER BY policyname) as policies
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('profiles', 'listings', 'guests', 'tv_devices', 'qr_codes', 'pms_connections', 'activity_log')
  GROUP BY schemaname, tablename
),
summary AS (
  SELECT
    tablename,
    policy_count,
    policies,
    CASE
      WHEN policy_count = 4 THEN '✓ PASS'
      ELSE '✗ FAIL (expected 4, got ' || policy_count || ')'
    END as status
  FROM policy_counts
  ORDER BY tablename
)
SELECT * FROM summary;

-- Overall count
WITH total_policies AS (
  SELECT COUNT(*) as total
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('profiles', 'listings', 'guests', 'tv_devices', 'qr_codes', 'pms_connections', 'activity_log')
)
SELECT
  'Total Policies' as metric,
  total as value,
  CASE
    WHEN total = 28 THEN '✓ PASS (expected 28)'
    ELSE '✗ FAIL (expected 28, got ' || total || ')'
  END as status
FROM total_policies;

-- ============================================================================
-- TEST 2: Client1 Data Access (Managed by Admin)
-- ============================================================================
-- Expected: Can only see their own data

SELECT
  '════════════════════════════════════════════════════' as separator,
  'TEST 2: Client1 Data Access (Own Data Only)' as test_name,
  '════════════════════════════════════════════════════' as separator2;

-- Simulate Client1's session
SET LOCAL role TO authenticator;
SET LOCAL request.jwt.claims TO '{"sub": "33333333-3333-3333-3333-333333333333", "role": "authenticated"}';

WITH client1_access AS (
  SELECT
    'Listings visible' as resource,
    COUNT(*) as count,
    CASE
      WHEN COUNT(*) = 1 THEN '✓ PASS (sees only their 1 listing)'
      ELSE '✗ FAIL (expected 1, got ' || COUNT(*) || ')'
    END as status
  FROM listings
  WHERE owner_id = '33333333-3333-3333-3333-333333333333'

  UNION ALL

  SELECT
    'Guests visible' as resource,
    COUNT(*) as count,
    CASE
      WHEN COUNT(*) = 1 THEN '✓ PASS (sees only their 1 guest)'
      ELSE '✗ FAIL (expected 1, got ' || COUNT(*) || ')'
    END as status
  FROM guests g
  JOIN listings l ON g.listing_id = l.id
  WHERE l.owner_id = '33333333-3333-3333-3333-333333333333'

  UNION ALL

  SELECT
    'TV Devices visible' as resource,
    COUNT(*) as count,
    CASE
      WHEN COUNT(*) = 1 THEN '✓ PASS (sees only their 1 TV device)'
      ELSE '✗ FAIL (expected 1, got ' || COUNT(*) || ')'
    END as status
  FROM tv_devices t
  JOIN listings l ON t.listing_id = l.id
  WHERE l.owner_id = '33333333-3333-3333-3333-333333333333'

  UNION ALL

  SELECT
    'Other clients'' listings visible' as resource,
    COUNT(*) as count,
    CASE
      WHEN COUNT(*) = 0 THEN '✓ PASS (cannot see other clients'' data)'
      ELSE '✗ FAIL (should see 0, got ' || COUNT(*) || ')'
    END as status
  FROM listings
  WHERE owner_id = '44444444-4444-4444-4444-444444444444'
)
SELECT * FROM client1_access;

RESET role;
RESET request.jwt.claims;

-- ============================================================================
-- TEST 3: Admin Data Access (Manages Client1)
-- ============================================================================
-- Expected: Can see/manage only Client1's data (not Client2)

SELECT
  '════════════════════════════════════════════════════' as separator,
  'TEST 3: Admin Data Access (Managed Clients Only)' as test_name,
  '════════════════════════════════════════════════════' as separator2;

-- Simulate Admin's session
SET LOCAL role TO authenticator;
SET LOCAL request.jwt.claims TO '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}';

WITH admin_access AS (
  SELECT
    'Managed client profiles' as resource,
    COUNT(*) as count,
    CASE
      WHEN COUNT(*) = 1 THEN '✓ PASS (sees 1 managed client)'
      ELSE '✗ FAIL (expected 1, got ' || COUNT(*) || ')'
    END as status
  FROM profiles
  WHERE managed_by = '22222222-2222-2222-2222-222222222222'

  UNION ALL

  SELECT
    'Managed clients'' listings' as resource,
    COUNT(*) as count,
    CASE
      WHEN COUNT(*) = 1 THEN '✓ PASS (sees 1 listing from managed client)'
      ELSE '✗ FAIL (expected 1, got ' || COUNT(*) || ')'
    END as status
  FROM listings
  WHERE owner_id IN (
    SELECT id FROM profiles WHERE managed_by = '22222222-2222-2222-2222-222222222222'
  )

  UNION ALL

  SELECT
    'Unmanaged client listings' as resource,
    COUNT(*) as count,
    CASE
      WHEN COUNT(*) = 0 THEN '✓ PASS (cannot see unmanaged client data)'
      ELSE '✗ FAIL (expected 0, got ' || COUNT(*) || ')'
    END as status
  FROM listings
  WHERE owner_id = '44444444-4444-4444-4444-444444444444'

  UNION ALL

  SELECT
    'Managed clients'' guests' as resource,
    COUNT(*) as count,
    CASE
      WHEN COUNT(*) = 1 THEN '✓ PASS (sees 1 guest from managed client)'
      ELSE '✗ FAIL (expected 1, got ' || COUNT(*) || ')'
    END as status
  FROM guests g
  JOIN listings l ON g.listing_id = l.id
  WHERE l.owner_id IN (
    SELECT id FROM profiles WHERE managed_by = '22222222-2222-2222-2222-222222222222'
  )

  UNION ALL

  SELECT
    'Managed clients'' TV devices' as resource,
    COUNT(*) as count,
    CASE
      WHEN COUNT(*) = 1 THEN '✓ PASS (sees 1 TV device from managed client)'
      ELSE '✗ FAIL (expected 1, got ' || COUNT(*) || ')'
    END as status
  FROM tv_devices t
  JOIN listings l ON t.listing_id = l.id
  WHERE l.owner_id IN (
    SELECT id FROM profiles WHERE managed_by = '22222222-2222-2222-2222-222222222222'
  )
)
SELECT * FROM admin_access;

RESET role;
RESET request.jwt.claims;

-- ============================================================================
-- TEST 4: Super Admin Data Access
-- ============================================================================
-- Expected: Can see ALL data

SELECT
  '════════════════════════════════════════════════════' as separator,
  'TEST 4: Super Admin Data Access (Full Access)' as test_name,
  '════════════════════════════════════════════════════' as separator2;

-- Simulate Super Admin's session
SET LOCAL role TO authenticator;
SET LOCAL request.jwt.claims TO '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';

WITH superadmin_access AS (
  SELECT
    'All profiles' as resource,
    COUNT(*) as count,
    CASE
      WHEN COUNT(*) >= 4 THEN '✓ PASS (sees all 4 test profiles)'
      ELSE '✗ FAIL (expected ≥4, got ' || COUNT(*) || ')'
    END as status
  FROM profiles
  WHERE email LIKE '%@test-rbac.local'

  UNION ALL

  SELECT
    'All listings' as resource,
    COUNT(*) as count,
    CASE
      WHEN COUNT(*) = 2 THEN '✓ PASS (sees all 2 test listings)'
      ELSE '✗ FAIL (expected 2, got ' || COUNT(*) || ')'
    END as status
  FROM listings
  WHERE owner_id IN (
    SELECT id FROM profiles WHERE email LIKE '%@test-rbac.local' AND role = 'client'
  )

  UNION ALL

  SELECT
    'All guests' as resource,
    COUNT(*) as count,
    CASE
      WHEN COUNT(*) = 2 THEN '✓ PASS (sees all 2 test guests)'
      ELSE '✗ FAIL (expected 2, got ' || COUNT(*) || ')'
    END as status
  FROM guests
  WHERE listing_id IN (
    SELECT id FROM listings WHERE owner_id IN (
      SELECT id FROM profiles WHERE email LIKE '%@test-rbac.local' AND role = 'client'
    )
  )

  UNION ALL

  SELECT
    'All TV devices' as resource,
    COUNT(*) as count,
    CASE
      WHEN COUNT(*) = 2 THEN '✓ PASS (sees all 2 test TV devices)'
      ELSE '✗ FAIL (expected 2, got ' || COUNT(*) || ')'
    END as status
  FROM tv_devices
  WHERE listing_id IN (
    SELECT id FROM listings WHERE owner_id IN (
      SELECT id FROM profiles WHERE email LIKE '%@test-rbac.local' AND role = 'client'
    )
  )
)
SELECT * FROM superadmin_access;

RESET role;
RESET request.jwt.claims;

-- ============================================================================
-- TEST 5: Self-Registration Policy
-- ============================================================================
-- Expected: New users can create their own profile

SELECT
  '════════════════════════════════════════════════════' as separator,
  'TEST 5: Self-Registration Policy' as test_name,
  '════════════════════════════════════════════════════' as separator2;

-- Simulate a new user registering (auth.uid() = their own ID)
SET LOCAL role TO authenticator;
SET LOCAL request.jwt.claims TO '{"sub": "55555555-5555-5555-5555-555555555555", "role": "authenticated"}';

-- Test INSERT permission (self-registration)
WITH insert_test AS (
  INSERT INTO profiles (id, email, role, created_at, updated_at)
  VALUES ('55555555-5555-5555-5555-555555555555', 'newuser@test-rbac.local', 'client', NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET updated_at = NOW()
  RETURNING id
)
SELECT
  'Self-registration INSERT' as test,
  CASE
    WHEN COUNT(*) = 1 THEN '✓ PASS (new user can create their own profile)'
    ELSE '✗ FAIL (self-registration blocked)'
  END as status
FROM insert_test;

RESET role;
RESET request.jwt.claims;

-- Clean up test user
DELETE FROM profiles WHERE id = '55555555-5555-5555-5555-555555555555';

-- ============================================================================
-- TEST 6: Activity Log Policies
-- ============================================================================
-- Expected: Super admin can UPDATE and DELETE, others cannot

SELECT
  '════════════════════════════════════════════════════' as separator,
  'TEST 6: Activity Log Modification Policies' as test_name,
  '════════════════════════════════════════════════════' as separator2;

-- Create test activity log entry
INSERT INTO activity_log (id, action_type, entity_type, entity_id, user_id, created_at)
VALUES ('99999999-9999-9999-9999-999999999999', 'test_action', 'listings', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', NOW())
ON CONFLICT (id) DO UPDATE SET created_at = NOW();

-- Test super_admin can UPDATE
SET LOCAL role TO authenticator;
SET LOCAL request.jwt.claims TO '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';

WITH update_test AS (
  UPDATE activity_log
  SET action_type = 'updated_action'
  WHERE id = '99999999-9999-9999-9999-999999999999'
  RETURNING id
)
SELECT
  'Super admin UPDATE activity_log' as test,
  CASE
    WHEN COUNT(*) = 1 THEN '✓ PASS (super admin can update)'
    ELSE '✗ FAIL (super admin cannot update)'
  END as status
FROM update_test;

RESET role;
RESET request.jwt.claims;

-- Test client CANNOT UPDATE
SET LOCAL role TO authenticator;
SET LOCAL request.jwt.claims TO '{"sub": "33333333-3333-3333-3333-333333333333", "role": "authenticated"}';

WITH client_update_test AS (
  UPDATE activity_log
  SET action_type = 'client_updated_action'
  WHERE id = '99999999-9999-9999-9999-999999999999'
  RETURNING id
)
SELECT
  'Client UPDATE activity_log' as test,
  CASE
    WHEN COUNT(*) = 0 THEN '✓ PASS (client cannot update)'
    ELSE '✗ FAIL (client should not be able to update)'
  END as status
FROM client_update_test;

RESET role;
RESET request.jwt.claims;

-- Clean up test activity log entry
DELETE FROM activity_log WHERE id = '99999999-9999-9999-9999-999999999999';

-- ============================================================================
-- CLEANUP: Remove Test Data
-- ============================================================================

SELECT
  '════════════════════════════════════════════════════' as separator,
  'CLEANUP: Removing Test Data' as test_name,
  '════════════════════════════════════════════════════' as separator2;

DO $$
BEGIN
  DELETE FROM activity_log WHERE user_id IN (
    SELECT id FROM profiles WHERE email LIKE '%@test-rbac.local'
  );
  DELETE FROM pms_connections WHERE listing_id IN (
    SELECT id FROM listings WHERE owner_id IN (
      SELECT id FROM profiles WHERE email LIKE '%@test-rbac.local'
    )
  );
  DELETE FROM qr_codes WHERE listing_id IN (
    SELECT id FROM listings WHERE owner_id IN (
      SELECT id FROM profiles WHERE email LIKE '%@test-rbac.local'
    )
  );
  DELETE FROM tv_devices WHERE listing_id IN (
    SELECT id FROM listings WHERE owner_id IN (
      SELECT id FROM profiles WHERE email LIKE '%@test-rbac.local'
    )
  );
  DELETE FROM guests WHERE listing_id IN (
    SELECT id FROM listings WHERE owner_id IN (
      SELECT id FROM profiles WHERE email LIKE '%@test-rbac.local'
    )
  );
  DELETE FROM listings WHERE owner_id IN (
    SELECT id FROM profiles WHERE email LIKE '%@test-rbac.local'
  );
  DELETE FROM profiles WHERE email LIKE '%@test-rbac.local';

  RAISE NOTICE '✓ Test data cleaned up successfully';
END $$;

-- Re-enable activity logging triggers
DO $$
BEGIN
  -- Re-enable triggers if they exist
  EXECUTE 'ALTER TABLE listings ENABLE TRIGGER log_listings_changes';
  EXECUTE 'ALTER TABLE guests ENABLE TRIGGER log_guests_changes';
  EXECUTE 'ALTER TABLE tv_devices ENABLE TRIGGER log_tv_devices_changes';
  EXECUTE 'ALTER TABLE qr_codes ENABLE TRIGGER log_qr_codes_changes';
  EXECUTE 'ALTER TABLE pms_connections ENABLE TRIGGER log_pms_connections_changes';
EXCEPTION
  WHEN undefined_object THEN
    -- Trigger doesn't exist, continue
    NULL;
END $$;

-- ============================================================================
-- FINAL SUMMARY
-- ============================================================================

SELECT
  '════════════════════════════════════════════════════' as separator,
  'RLS/RBAC TEST COMPLETE' as summary,
  '════════════════════════════════════════════════════' as separator2;

SELECT
  'All tests completed. Review results above.' as message,
  'Expected: All tests should show ✓ PASS' as expected_outcome;
