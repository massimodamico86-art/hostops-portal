# RLS & RBAC Complete Analysis

## 1. Intended Final RLS Behavior

### **PROFILES Table**

| Role | SELECT | INSERT | UPDATE | DELETE |
|------|--------|--------|--------|--------|
| **client** | Own profile only | Own profile (auto-create) | Own profile only | ❌ No |
| **admin** | Own + Managed clients | New profiles (for clients) | Own + Managed clients | ❌ No |
| **super_admin** | All profiles | All profiles | All profiles | All profiles |

**Business Rules:**
- Clients can only see and edit their own profile
- Admins can view/edit profiles of clients they manage (managed_by = admin.id)
- Super admins have full access to all profiles
- Only super admins can delete profiles

---

### **LISTINGS Table**

| Role | SELECT | INSERT | UPDATE | DELETE |
|------|--------|--------|--------|--------|
| **client** | Own listings | Own listings | Own listings | Own listings |
| **admin** | Own + Managed clients' | Own + Managed clients' | Own + Managed clients' | Own + Managed clients' |
| **super_admin** | All listings | All listings | All listings | All listings |

**Business Rules:**
- Clients manage their own properties
- Admins can manage listings for all clients under their management
- Super admins see everything

---

### **GUESTS Table**

| Role | SELECT | INSERT | UPDATE | DELETE |
|------|--------|--------|--------|--------|
| **client** | For own listings | For own listings | For own listings | For own listings |
| **admin** | For managed clients' listings | For managed clients' listings | For managed clients' listings | For managed clients' listings |
| **super_admin** | All guests | All guests | All guests | All guests |

**Business Rules:**
- Access tied to listing ownership
- Guests belong to listings, which have owners
- Admins can manage guests for listings owned by their managed clients

---

### **TV_DEVICES Table**

| Role | SELECT | INSERT | UPDATE | DELETE |
|------|--------|--------|--------|--------|
| **client** | For own listings | For own listings | For own listings | For own listings |
| **admin** | For managed clients' listings | For managed clients' listings | For managed clients' listings | For managed clients' listings |
| **super_admin** | All devices | All devices | All devices | All devices |

**Business Rules:**
- TV devices are tied to listings
- Same access pattern as guests

---

### **QR_CODES Table**

| Role | SELECT | INSERT | UPDATE | DELETE |
|------|--------|--------|--------|--------|
| **client** | For own listings | For own listings | For own listings | For own listings |
| **admin** | For managed clients' listings | For managed clients' listings | For managed clients' listings | For managed clients' listings |
| **super_admin** | All QR codes | All QR codes | All QR codes | All QR codes |

**Business Rules:**
- QR codes are tied to listings
- Same access pattern as tv_devices and guests

---

### **PMS_CONNECTIONS Table**

| Role | SELECT | INSERT | UPDATE | DELETE |
|------|--------|--------|--------|--------|
| **client** | For own listings | For own listings | For own listings | For own listings |
| **admin** | For managed clients' listings | For managed clients' listings | For managed clients' listings | For managed clients' listings |
| **super_admin** | All connections | All connections | All connections | All connections |

**Business Rules:**
- PMS connections are tied to listings
- Same access pattern as other listing-dependent tables

---

### **ACTIVITY_LOG Table**

| Role | SELECT | INSERT | UPDATE | DELETE |
|------|--------|--------|--------|--------|
| **client** | Own activity | Own activity | ❌ No | ❌ No |
| **admin** | Own + Managed clients' | Own activity | ❌ No | ❌ No |
| **super_admin** | All activity | All activity | ✅ Yes | ✅ Yes |

**Business Rules:**
- Activity logs are immutable for regular users
- Admins can view logs of their managed clients
- Only super admins can modify/delete logs
- Users can insert their own activity (for audit trail)

---

## 2. Current Policies After Fresh Database Setup

### Migration Execution Order (Fresh DB):
1. **001_initial_schema.sql** - Creates tables and initial policies
2. **003_complete_rls_fix.sql** - Drops and recreates profile policies (CONFLICT!)
3. **009_add_roles_and_rbac.sql** - Drops old policies, creates RBAC policies
4. **011_rbac_tv_qr_pms_activity.sql** - Adds RBAC to remaining tables

### **PROFILES - Policy Conflicts** ⚠️

**From Migration 001:**
```sql
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

**From Migration 003:** (DROPS 001 policies, then creates)
```sql
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;  -- Removes 001 policy
DROP POLICY IF EXISTS "Users can update own profile" ON profiles; -- Removes 001 policy

CREATE POLICY "users_read_own_profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_insert_own_profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own_profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "service_role_full_access_profiles" ON profiles
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
```

**From Migration 009:** (DROPS 003 policies, creates RBAC)
```sql
DROP POLICY IF EXISTS "users_read_own_profile" ON profiles;      -- Removes 003 policy
DROP POLICY IF EXISTS "users_insert_own_profile" ON profiles;    -- Removes 003 policy
DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;    -- Removes 003 policy
DROP POLICY IF EXISTS "service_role_full_access_profiles" ON profiles; -- Removes 003 policy

CREATE POLICY "profiles_select_policy" ON profiles FOR SELECT
  USING (id = auth.uid() OR is_super_admin() OR (is_admin() AND managed_by = auth.uid()));

CREATE POLICY "profiles_update_policy" ON profiles FOR UPDATE
  USING (id = auth.uid() OR is_super_admin() OR (is_admin() AND managed_by = auth.uid()));

CREATE POLICY "profiles_insert_policy" ON profiles FOR INSERT
  WITH CHECK (is_super_admin() OR is_admin());

CREATE POLICY "profiles_delete_policy" ON profiles FOR DELETE
  USING (is_super_admin());
```

**✅ FINAL STATE (after 009):**
- `profiles_select_policy` - ✅ RBAC complete
- `profiles_update_policy` - ✅ RBAC complete
- `profiles_insert_policy` - ✅ RBAC complete
- `profiles_delete_policy` - ✅ RBAC complete

**⚠️ ISSUE:** Migration 003 is unnecessary and creates churn. It should be skipped or removed.

---

### **LISTINGS - Final State** ✅

**After Migration 009:**
```sql
CREATE POLICY "listings_select_policy" ON listings FOR SELECT
  USING (owner_id = auth.uid() OR is_super_admin()
    OR (is_admin() AND owner_id IN (SELECT client_id FROM get_my_client_ids())));

CREATE POLICY "listings_insert_policy" ON listings FOR INSERT
  WITH CHECK (owner_id = auth.uid() OR is_super_admin()
    OR (is_admin() AND owner_id IN (SELECT client_id FROM get_my_client_ids())));

CREATE POLICY "listings_update_policy" ON listings FOR UPDATE
  USING (owner_id = auth.uid() OR is_super_admin()
    OR (is_admin() AND owner_id IN (SELECT client_id FROM get_my_client_ids())));

CREATE POLICY "listings_delete_policy" ON listings FOR DELETE
  USING (owner_id = auth.uid() OR is_super_admin()
    OR (is_admin() AND owner_id IN (SELECT client_id FROM get_my_client_ids())));
```

**✅ Status:** Complete and correct

---

### **GUESTS - Final State** ✅

**After Migration 009:**
```sql
CREATE POLICY "guests_select_policy" ON guests FOR SELECT
  USING (is_super_admin()
    OR listing_id IN (SELECT id FROM listings WHERE owner_id = auth.uid())
    OR (is_admin() AND listing_id IN (
      SELECT l.id FROM listings l WHERE l.owner_id IN (SELECT client_id FROM get_my_client_ids())
    )));

-- Similar for INSERT, UPDATE, DELETE
```

**✅ Status:** Complete and correct

---

### **TV_DEVICES - Final State** ✅

**After Migration 011:**
```sql
CREATE POLICY "tv_devices_select_policy" ON tv_devices FOR SELECT
  USING (is_super_admin()
    OR listing_id IN (SELECT id FROM listings WHERE owner_id = auth.uid())
    OR (is_admin() AND listing_id IN (
      SELECT l.id FROM listings l WHERE l.owner_id IN (SELECT client_id FROM get_my_client_ids())
    )));

-- Similar for INSERT, UPDATE, DELETE (4 policies total)
```

**✅ Status:** Complete and correct

---

### **QR_CODES - Final State** ✅

**After Migration 011:** Same pattern as tv_devices (4 policies)

**✅ Status:** Complete and correct

---

### **PMS_CONNECTIONS - Final State** ✅

**After Migration 011:** Same pattern as tv_devices (4 policies)

**✅ Status:** Complete and correct

---

### **ACTIVITY_LOG - Final State** ✅

**After Migration 011:**
```sql
CREATE POLICY "activity_log_select_policy" ON activity_log FOR SELECT
  USING (user_id = auth.uid() OR is_super_admin()
    OR (is_admin() AND user_id IN (SELECT client_id FROM get_my_client_ids())));

CREATE POLICY "activity_log_insert_policy" ON activity_log FOR INSERT
  WITH CHECK (user_id = auth.uid());
```

**✅ Status:** Complete (2 policies, no UPDATE/DELETE for regular users)

---

## 3. Identified Issues

### **Critical Issues:**

1. **Migration 003 is Redundant** ⚠️
   - Creates policies that Migration 009 immediately deletes
   - Adds unnecessary churn
   - Should be removed or marked as superseded by 009

2. **Missing RBAC INSERT Policy for Profiles** ⚠️
   - Migration 009 `profiles_insert_policy` requires `is_super_admin() OR is_admin()`
   - This blocks auto-profile creation for new clients!
   - Should allow `auth.uid() = id` for self-registration

### **Minor Issues:**

3. **Helper Function `get_my_role()` Unused**
   - Defined in migration 009 but never used in policies
   - Can be removed or kept for debugging

4. **No Explicit UPDATE/DELETE for Activity Log**
   - Only super_admin should be able to modify logs
   - Currently no policies exist (implicit deny is fine, but explicit is clearer)

---

## 4. Conflicts & Legacy Policies

### **After Fresh Install (001 → 003 → 009 → 011):**

**Legacy policies that should NOT exist:**
- ❌ `"Users can view own profile"` (from 001, dropped by 003)
- ❌ `"Users can update own profile"` (from 001, dropped by 003)
- ❌ `"users_read_own_profile"` (from 003, dropped by 009)
- ❌ `"users_insert_own_profile"` (from 003, dropped by 009)
- ❌ `"users_update_own_profile"` (from 003, dropped by 009)
- ❌ `"service_role_full_access_profiles"` (from 003, dropped by 009)
- ❌ All `"Users can *"` policies for listings/guests/tv/qr (dropped by 009/011)

**Policies that SHOULD exist (Final State):**
- ✅ `profiles_select_policy`, `profiles_update_policy`, `profiles_insert_policy`, `profiles_delete_policy` (4)
- ✅ `listings_select_policy`, `listings_insert_policy`, `listings_update_policy`, `listings_delete_policy` (4)
- ✅ `guests_select_policy`, `guests_insert_policy`, `guests_update_policy`, `guests_delete_policy` (4)
- ✅ `tv_devices_select_policy`, `tv_devices_insert_policy`, `tv_devices_update_policy`, `tv_devices_delete_policy` (4)
- ✅ `qr_codes_select_policy`, `qr_codes_insert_policy`, `qr_codes_update_policy`, `qr_codes_delete_policy` (4)
- ✅ `pms_connections_select_policy`, `pms_connections_insert_policy`, `pms_connections_update_policy`, `pms_connections_delete_policy` (4)
- ✅ `activity_log_select_policy`, `activity_log_insert_policy` (2)

**Total:** 26 policies

---

## Recommendations

1. **Create Migration 012** to consolidate and finalize all RLS policies
2. **Fix profiles_insert_policy** to allow self-registration
3. **Remove or skip Migration 003** in production (superseded by 009)
4. **Add explicit activity_log UPDATE/DELETE policies** for super_admin
5. **Add verification queries** to confirm correct RBAC behavior
