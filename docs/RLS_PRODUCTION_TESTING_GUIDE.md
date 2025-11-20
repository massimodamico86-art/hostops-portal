# RLS Production Testing Guide

This guide walks you through testing the RLS/RBAC system in your production Supabase environment.

## Prerequisites

- ✅ Migrations 011 and 012 must be deployed to production
- ✅ Frontend deployed to Vercel
- ✅ Supabase project in production mode

---

## Step 1: Deploy RLS Migrations to Supabase

### Option A: Via Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor**
4. Run migrations in order:

```sql
-- First, run migration 011
-- Copy contents from: supabase/migrations/011_rbac_tv_qr_pms_activity.sql
-- Paste and execute in SQL Editor

-- Then, run migration 012
-- Copy contents from: supabase/migrations/012_finalize_rls_rbac.sql
-- Paste and execute in SQL Editor
```

5. Verify policies were created:

```sql
-- Copy contents from: supabase/migrations/VERIFY_RLS_RBAC.sql
-- Paste and execute in SQL Editor
-- Should show ✓ PASS for all tests
```

### Option B: Via Supabase CLI (Alternative)

```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy migrations
supabase db push
```

---

## Step 2: Create Test Users

Create 3 test users with different roles to test access control:

### A. Create Super Admin User

1. Go to **Authentication** → **Users** → **Add user**
2. Email: `superadmin@test.yourdomain.com`
3. Password: (use a secure password)
4. Click **Create user**
5. After creation, go to **Table Editor** → **profiles**
6. Find the new user's profile
7. Set `role` = `'super_admin'`

### B. Create Admin User

1. **Authentication** → **Users** → **Add user**
2. Email: `admin@test.yourdomain.com`
3. Password: (use a secure password)
4. In **profiles** table, set `role` = `'admin'`

### C. Create Client Users (2)

Create two client users:
- `client1@test.yourdomain.com` (will be managed by admin)
- `client2@test.yourdomain.com` (independent)

For client1, set `managed_by` to the admin user's UUID.

---

## Step 3: Create Test Data

### A. Add Listings for Each Client

**As client1:**
1. Sign in at your app: https://your-app.vercel.app
2. Navigate to **Listings** page
3. Add a test property: "Client 1 Test Property"

**As client2:**
1. Sign out, sign in as client2
2. Navigate to **Listings**
3. Add a test property: "Client 2 Test Property"

### B. Add Related Data

For each listing, add:
- **Guests**: 1-2 test reservations
- **TV Devices**: 1 test device
- **QR Codes**: 1-2 test QR codes

---

## Step 4: Test RLS Access Control

### Test 1: Client Data Isolation

**Expected**: Each client sees ONLY their own data.

**Test Steps:**
1. Sign in as **client1@test.yourdomain.com**
2. Navigate to **Listings** page
3. ✅ **Should see**: "Client 1 Test Property" ONLY
4. ❌ **Should NOT see**: "Client 2 Test Property"
5. Navigate to **Guests** tab
6. ✅ **Should see**: Only guests for Client 1's property
7. Try to access client2's listing directly via URL manipulation
8. ❌ **Should fail**: RLS should block access

**Sign in as client2 and repeat - should only see their own data.**

---

### Test 2: Admin Access to Managed Clients

**Expected**: Admin sees only data from managed clients.

**Test Steps:**
1. Sign in as **admin@test.yourdomain.com**
2. Navigate to **Listings** page
3. ✅ **Should see**: "Client 1 Test Property" (managed client)
4. ❌ **Should NOT see**: "Client 2 Test Property" (unmanaged)
5. Check **Guests** tab
6. ✅ **Should see**: Guests from Client 1's property only
7. Try to edit Client 1's listing
8. ✅ **Should work**: Admin can edit managed client data
9. Try to access Client 2's listing via URL
10. ❌ **Should fail**: RLS blocks unmanaged client data

---

### Test 3: Super Admin Full Access

**Expected**: Super admin sees ALL data.

**Test Steps:**
1. Sign in as **superadmin@test.yourdomain.com**
2. Navigate to **Listings** page
3. ✅ **Should see**: BOTH "Client 1" and "Client 2" properties
4. Navigate to **Guests** tab
5. ✅ **Should see**: Guests from ALL listings
6. Navigate to **Users** or **Admin Dashboard** (if implemented)
7. ✅ **Should see**: All user profiles
8. Try to edit any listing
9. ✅ **Should work**: Super admin has full edit access

---

### Test 4: Self-Registration

**Expected**: New users can create their own profile.

**Test Steps:**
1. Sign out completely
2. Click **Sign Up** on your app
3. Create a new account: `newuser@test.yourdomain.com`
4. Complete registration
5. ✅ **Should work**: Profile automatically created
6. Check **Table Editor** → **profiles**
7. ✅ **Should see**: New profile with `role = 'client'`
8. Sign in as the new user
9. ✅ **Should work**: User can access app with client permissions

---

### Test 5: Activity Log Restrictions

**Expected**: Only super_admin can modify activity logs.

**Test Steps:**
1. Sign in as **client1@test.yourdomain.com**
2. Create a new listing (triggers activity log)
3. Go to **Activity Log** page (if implemented)
4. ✅ **Should see**: Your own activity entries
5. Try to delete an activity log entry via console/API
6. ❌ **Should fail**: Clients cannot delete logs

**As super_admin:**
1. Sign in as **superadmin@test.yourdomain.com**
2. Go to **Activity Log** page
3. ✅ **Should see**: ALL activity entries from all users
4. Try to delete an activity log entry
5. ✅ **Should work**: Super admin can delete logs

---

## Step 5: Browser Console Testing

For each role, test RLS via browser console:

### Client Test (Browser Console)

```javascript
// In your app, open browser console
const { data, error } = await window.supabase
  .from('listings')
  .select('*');

console.log('Listings visible:', data.length);
// Should only show listings owned by current user
```

### Admin Test (Browser Console)

```javascript
const { data: managedClients } = await window.supabase
  .from('profiles')
  .select('*')
  .eq('managed_by', window.supabase.auth.user().id);

console.log('Managed clients:', managedClients.length);
// Should show only clients managed by this admin
```

### Super Admin Test (Browser Console)

```javascript
const { data: allProfiles } = await window.supabase
  .from('profiles')
  .select('*');

console.log('All profiles:', allProfiles.length);
// Should show ALL profiles in the system
```

---

## Step 6: Verify RLS Policies in Supabase

Go to **Supabase Dashboard** → **Authentication** → **Policies**

Verify:
- ✅ 28 policies exist across 7 tables
- ✅ Each table has 4 policies (SELECT, INSERT, UPDATE, DELETE)
- ✅ All policies show "Enabled"

---

## Expected Test Results Summary

| Role         | Own Data | Managed Clients | Unmanaged Clients | All Users |
|--------------|----------|-----------------|-------------------|-----------|
| **client**   | ✅ Yes   | ❌ No          | ❌ No            | ❌ No    |
| **admin**    | ✅ Yes   | ✅ Yes         | ❌ No            | ❌ No    |
| **super_admin** | ✅ Yes   | ✅ Yes         | ✅ Yes           | ✅ Yes   |

---

## Troubleshooting

### Issue: Client sees other clients' data

**Solution:**
1. Verify RLS is enabled: Run `VERIFY_RLS_RBAC.sql`
2. Check policy structure in Supabase Dashboard
3. Ensure migrations 011 and 012 were applied
4. Check user's role in `profiles` table

### Issue: Admin sees all data (not just managed clients)

**Solution:**
1. Check `managed_by` field in client profiles
2. Verify `get_my_client_ids()` function exists
3. Run `VERIFY_RLS_RBAC.sql` to check policies

### Issue: Super admin cannot see all data

**Solution:**
1. Verify user's role is exactly `'super_admin'` (not `'superadmin'`)
2. Check `is_super_admin()` function exists
3. Run `VERIFY_RLS_RBAC.sql`

### Issue: Self-registration fails

**Solution:**
1. Check `profiles_insert_policy` allows `id = auth.uid()`
2. Verify no trigger conflicts
3. Check Supabase logs for errors

---

## Production Deployment Checklist

Once testing is complete:

- [ ] All RLS tests passed
- [ ] Test users removed or disabled
- [ ] Test data cleaned up
- [ ] Migrations applied to production
- [ ] Frontend deployed to production (Vercel)
- [ ] Environment variables verified
- [ ] Monitoring and logging enabled
- [ ] Backup strategy in place
- [ ] Security audit completed
- [ ] Documentation updated

---

## Next Steps After Testing

1. **Remove test users and data** from production
2. **Monitor RLS performance** with real usage
3. **Set up alerts** for security events
4. **Document** any RLS customizations for your team
5. **Train users** on role-based access

---

## Support & Resources

- **RLS Analysis**: See `docs/RLS_RBAC_ANALYSIS.md`
- **Verification Script**: Run `supabase/migrations/VERIFY_RLS_RBAC.sql`
- **Supabase Docs**: https://supabase.com/docs/guides/auth/row-level-security
- **Issue Tracker**: Report bugs in your GitHub repo

---

**Last Updated**: 2025-11-20
**Version**: 1.0
**Author**: HostOps Portal Team
