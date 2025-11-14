# Troubleshooting Admin 500 Errors

## Problem
Admin user (testadmin@hostops.com) gets 500 errors when trying to access the app:
- "Error fetching user profile" - 500 error
- "Error fetching data" - 500 error

## Most Likely Cause
The RLS (Row Level Security) migration `003_add_roles_and_rbac.sql` either:
1. Was not run yet, OR
2. Has policies that are blocking the admin from reading their own profile

## Solution

### Step 1: Check if Migration Was Run

Run this query in Supabase SQL Editor:

```sql
-- Check if RBAC policies exist
SELECT policyname
FROM pg_policies
WHERE tablename = 'profiles'
  AND policyname LIKE '%role%';
```

**Expected Result**: Should show policies like:
- `View profiles based on role`
- `Update profiles based on role`
- `Insert profiles based on role`
- `Delete profiles based on role`

**If NO policies are returned**: The migration wasn't run. Go to Step 2.

**If policies ARE returned**: Go to Step 3 (policies exist but might have an issue).

---

### Step 2: Run the RBAC Migration

If the migration wasn't run:

1. Go to Supabase Dashboard
2. Navigate to **SQL Editor**
3. Open file: `supabase/migrations/003_add_roles_and_rbac.sql`
4. Copy the ENTIRE contents
5. Paste into SQL Editor
6. Click **Run**
7. Verify no errors
8. Refresh your browser and test admin login again

---

### Step 3: Fix Recursive Policy Issue (if migration was run)

If the policies exist but admin still can't access, the issue is the recursive query in the RLS policy.

Run this fix in Supabase SQL Editor:

```sql
-- Drop the problematic policy
DROP POLICY IF EXISTS "View profiles based on role" ON profiles;

-- Recreate with optimized logic
CREATE POLICY "View profiles based on role"
ON profiles FOR SELECT
USING (
  -- Everyone can see their own profile
  id = auth.uid()
  OR
  -- Super admins see everything
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  )
  OR
  -- Admins see their assigned clients
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
      AND profiles.managed_by = auth.uid()
  )
);
```

---

### Step 4: Verify Admin Profile

Check that testadmin has correct role:

```sql
SELECT id, email, role, managed_by
FROM profiles
WHERE email = 'testadmin@hostops.com';
```

**Expected Result**:
- `role` should be `'admin'`
- `managed_by` should be `NULL`

**If role is NOT 'admin'**: Run this fix:

```sql
UPDATE profiles
SET role = 'admin'
WHERE email = 'testadmin@hostops.com';
```

---

### Step 5: Test Again

1. Refresh your browser (F5 or Cmd+R)
2. Log in as testadmin@hostops.com
3. Check browser console for errors

**Expected Result**: No 500 errors, dashboard loads successfully

---

## Understanding the Issue

The original RLS policy uses:
```sql
(SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
```

This creates a recursive query that PostgreSQL might not optimize well, causing 500 errors.

The fix uses `EXISTS` which is more efficient and reliable:
```sql
EXISTS (
  SELECT 1 FROM profiles
  WHERE id = auth.uid() AND role = 'admin'
)
```

---

## Next Steps After Fix

Once the admin can log in without errors:

1. **Test Admin View**: Should see empty dashboard (no listings yet)
2. **Create Test Listing**: Log in as testclient1, create a listing
3. **Verify Admin Sees It**: Log back in as admin, should see testclient1's listing
4. **Test Client Isolation**: testclient2 should NOT see testclient1's listing

---

## If Still Not Working

1. Check Supabase Logs:
   - Dashboard → Logs → Database
   - Look for the actual SQL error causing the 500

2. Disable RLS temporarily to test:
   ```sql
   ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
   ```
   - If this fixes it, the issue is definitely the RLS policy
   - Don't forget to re-enable: `ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;`

3. Check if profile exists:
   ```sql
   SELECT * FROM auth.users WHERE email = 'testadmin@hostops.com';
   SELECT * FROM profiles WHERE email = 'testadmin@hostops.com';
   ```
   - Both should return rows
   - IDs should match
