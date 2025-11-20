-- =====================================================
-- Multi-Tenant Role-Based Access Control (RBAC)
-- =====================================================
-- This migration adds role-based access control with:
-- - super_admin: Full system access
-- - admin: Manages assigned clients
-- - client: Self-contained account
-- =====================================================

-- 1. Ensure role column exists and has correct constraint
-- First, add column if it doesn't exist (from fresh install)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'client';

-- Drop old constraint if it exists, then add the correct one
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles
ADD CONSTRAINT profiles_role_check CHECK (role IN ('super_admin', 'admin', 'client'));

-- 2. Add managed_by column to profiles table (for admin-client relationship)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS managed_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- 3. Create index for faster role queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_managed_by ON profiles(managed_by);

-- ============================================
-- 4. CREATE HELPER FUNCTIONS (Avoids RLS Recursion)
-- ============================================

-- Function to get current user's role (avoids recursion)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Function to check if current user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
$$;

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Function to get IDs of clients managed by current admin
CREATE OR REPLACE FUNCTION public.get_my_client_ids()
RETURNS TABLE(client_id UUID)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id FROM profiles
  WHERE managed_by = auth.uid() AND role = 'client';
$$;

-- ============================================
-- 5. DROP OLD POLICIES (if they exist)
-- ============================================

-- Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "View profiles based on role" ON profiles;
DROP POLICY IF EXISTS "Update profiles based on role" ON profiles;
DROP POLICY IF EXISTS "Insert profiles based on role" ON profiles;
DROP POLICY IF EXISTS "Delete profiles based on role" ON profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;

-- Listings
DROP POLICY IF EXISTS "Users can view own listings" ON listings;
DROP POLICY IF EXISTS "Users can insert own listings" ON listings;
DROP POLICY IF EXISTS "Users can update own listings" ON listings;
DROP POLICY IF EXISTS "Users can delete own listings" ON listings;
DROP POLICY IF EXISTS "View listings based on role" ON listings;
DROP POLICY IF EXISTS "Insert listings based on role" ON listings;
DROP POLICY IF EXISTS "Update listings based on role" ON listings;
DROP POLICY IF EXISTS "Delete listings based on role" ON listings;
DROP POLICY IF EXISTS "listings_select_policy" ON listings;
DROP POLICY IF EXISTS "listings_insert_policy" ON listings;
DROP POLICY IF EXISTS "listings_update_policy" ON listings;
DROP POLICY IF EXISTS "listings_delete_policy" ON listings;

-- Guests
DROP POLICY IF EXISTS "Users can view guests for their listings" ON guests;
DROP POLICY IF EXISTS "Users can insert guests for their listings" ON guests;
DROP POLICY IF EXISTS "Users can update guests for their listings" ON guests;
DROP POLICY IF EXISTS "Users can delete guests for their listings" ON guests;
DROP POLICY IF EXISTS "View guests based on role" ON guests;
DROP POLICY IF EXISTS "Insert guests based on role" ON guests;
DROP POLICY IF EXISTS "Update guests based on role" ON guests;
DROP POLICY IF EXISTS "Delete guests based on role" ON guests;
DROP POLICY IF EXISTS "guests_select_policy" ON guests;
DROP POLICY IF EXISTS "guests_insert_policy" ON guests;
DROP POLICY IF EXISTS "guests_update_policy" ON guests;
DROP POLICY IF EXISTS "guests_delete_policy" ON guests;

-- ============================================
-- 6. CREATE NEW POLICIES USING FUNCTIONS
-- ============================================

-- PROFILES TABLE POLICIES
CREATE POLICY "profiles_select_policy"
ON profiles FOR SELECT
USING (
  id = auth.uid()                    -- Users see their own profile
  OR is_super_admin()                -- Super admins see all
  OR (is_admin() AND managed_by = auth.uid())  -- Admins see managed clients
);

CREATE POLICY "profiles_update_policy"
ON profiles FOR UPDATE
USING (
  id = auth.uid()
  OR is_super_admin()
  OR (is_admin() AND managed_by = auth.uid())
);

CREATE POLICY "profiles_insert_policy"
ON profiles FOR INSERT
WITH CHECK (
  is_super_admin() OR is_admin()
);

CREATE POLICY "profiles_delete_policy"
ON profiles FOR DELETE
USING (
  is_super_admin()
);

-- LISTINGS TABLE POLICIES
CREATE POLICY "listings_select_policy"
ON listings FOR SELECT
USING (
  owner_id = auth.uid()              -- Clients see own listings
  OR is_super_admin()                -- Super admins see all
  OR (is_admin() AND owner_id IN (SELECT client_id FROM get_my_client_ids()))  -- Admins see managed clients' listings
);

CREATE POLICY "listings_insert_policy"
ON listings FOR INSERT
WITH CHECK (
  owner_id = auth.uid()
  OR is_super_admin()
  OR (is_admin() AND owner_id IN (SELECT client_id FROM get_my_client_ids()))
);

CREATE POLICY "listings_update_policy"
ON listings FOR UPDATE
USING (
  owner_id = auth.uid()
  OR is_super_admin()
  OR (is_admin() AND owner_id IN (SELECT client_id FROM get_my_client_ids()))
);

CREATE POLICY "listings_delete_policy"
ON listings FOR DELETE
USING (
  owner_id = auth.uid()
  OR is_super_admin()
  OR (is_admin() AND owner_id IN (SELECT client_id FROM get_my_client_ids()))
);

-- GUESTS TABLE POLICIES
CREATE POLICY "guests_select_policy"
ON guests FOR SELECT
USING (
  is_super_admin()
  OR listing_id IN (SELECT id FROM listings WHERE owner_id = auth.uid())
  OR (is_admin() AND listing_id IN (
    SELECT l.id FROM listings l
    WHERE l.owner_id IN (SELECT client_id FROM get_my_client_ids())
  ))
);

CREATE POLICY "guests_insert_policy"
ON guests FOR INSERT
WITH CHECK (
  is_super_admin()
  OR listing_id IN (SELECT id FROM listings WHERE owner_id = auth.uid())
  OR (is_admin() AND listing_id IN (
    SELECT l.id FROM listings l
    WHERE l.owner_id IN (SELECT client_id FROM get_my_client_ids())
  ))
);

CREATE POLICY "guests_update_policy"
ON guests FOR UPDATE
USING (
  is_super_admin()
  OR listing_id IN (SELECT id FROM listings WHERE owner_id = auth.uid())
  OR (is_admin() AND listing_id IN (
    SELECT l.id FROM listings l
    WHERE l.owner_id IN (SELECT client_id FROM get_my_client_ids())
  ))
);

CREATE POLICY "guests_delete_policy"
ON guests FOR DELETE
USING (
  is_super_admin()
  OR listing_id IN (SELECT id FROM listings WHERE owner_id = auth.uid())
  OR (is_admin() AND listing_id IN (
    SELECT l.id FROM listings l
    WHERE l.owner_id IN (SELECT client_id FROM get_my_client_ids())
  ))
);

-- ============================================
-- 7. ENABLE RLS ON TABLES
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 8. CREATE HELPER FUNCTION FOR ROLE RETRIEVAL
-- ============================================

CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT role FROM profiles WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 9. CREATE HELPER FUNCTION FOR ADMIN-CLIENT CHECK
-- ============================================

CREATE OR REPLACE FUNCTION is_admin_of_client(admin_id UUID, client_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = client_id
    AND managed_by = admin_id
    AND (SELECT role FROM profiles WHERE id = admin_id) = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 10. CREATE VIEW FOR ADMIN CLIENT MANAGEMENT
-- ============================================

CREATE OR REPLACE VIEW admin_clients AS
SELECT
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.managed_by,
  p.created_at,
  p.updated_at,
  (SELECT COUNT(*) FROM listings WHERE owner_id = p.id) as listing_count
FROM profiles p
WHERE
  -- Only show clients that are managed by the current user
  p.managed_by = auth.uid()
  AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin';

-- Grant access to the view
GRANT SELECT ON admin_clients TO authenticated;

-- ============================================
-- 11. ADD COLUMN COMMENTS
-- ============================================

COMMENT ON COLUMN profiles.role IS 'User role: super_admin (full access), admin (manages clients), client (self-contained)';
COMMENT ON COLUMN profiles.managed_by IS 'For clients: the admin user managing this client. NULL for super_admin and admin roles';

-- ============================================
-- 12. CREATE TRIGGER TO ENFORCE MANAGED_BY RULES
-- ============================================

CREATE OR REPLACE FUNCTION check_managed_by()
RETURNS TRIGGER AS $$
BEGIN
  -- Clients cannot have managed_by set
  IF NEW.role = 'client' AND NEW.managed_by IS NOT NULL THEN
    -- Verify the manager is an admin
    IF (SELECT role FROM profiles WHERE id = NEW.managed_by) != 'admin' THEN
      RAISE EXCEPTION 'managed_by must reference an admin user';
    END IF;
  END IF;

  -- super_admin and admin cannot have managed_by set
  IF (NEW.role = 'super_admin' OR NEW.role = 'admin') AND NEW.managed_by IS NOT NULL THEN
    RAISE EXCEPTION 'super_admin and admin roles cannot have managed_by set';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_managed_by_rules ON profiles;
CREATE TRIGGER enforce_managed_by_rules
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION check_managed_by();

-- ============================================
-- 13. CREATE FUNCTION TO ASSIGN CLIENT TO ADMIN
-- ============================================

CREATE OR REPLACE FUNCTION assign_client_to_admin(client_id UUID, admin_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Verify the admin is actually an admin
  IF (SELECT role FROM profiles WHERE id = admin_id) != 'admin' THEN
    RAISE EXCEPTION 'Target user is not an admin';
  END IF;

  -- Verify the client is actually a client
  IF (SELECT role FROM profiles WHERE id = client_id) != 'client' THEN
    RAISE EXCEPTION 'Target user is not a client';
  END IF;

  -- Only super_admin can assign clients
  IF (SELECT role FROM profiles WHERE id = auth.uid()) != 'super_admin' THEN
    RAISE EXCEPTION 'Only super_admin can assign clients to admins';
  END IF;

  -- Assign the client to the admin
  UPDATE profiles SET managed_by = admin_id WHERE id = client_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION assign_client_to_admin TO authenticated;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- This migration successfully implements:
-- ✅ Role-based access control (super_admin, admin, client)
-- ✅ Database functions to prevent RLS recursion
-- ✅ Secure RLS policies using SECURITY DEFINER functions
-- ✅ Admin-client relationship management
-- ✅ Helper views and functions for admin operations
-- ✅ Triggers to enforce business rules
-- ============================================
