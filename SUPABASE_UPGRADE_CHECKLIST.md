# Supabase Upgrade Checklist

## When You Upgrade to Paid Supabase Plan

After upgrading your Supabase subscription, follow these steps to re-enable RLS with proper security:

### 1. Re-enable RLS on Profiles Table

Run this in Supabase SQL Editor:

```sql
-- Re-enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
```

### 2. Verify RLS Policies Are Active

Run this to confirm all policies exist:

```sql
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;
```

**Expected: 4 policies**
- `service_role_full_access_profiles` - ALL
- `users_insert_own_profile` - INSERT
- `users_read_own_profile` - SELECT
- `users_update_own_profile` - UPDATE

### 3. Test Performance

The RLS queries should now work instantly with the improved connection pooling from the paid tier.

Test query:
```sql
EXPLAIN ANALYZE
SELECT id, email, full_name, role
FROM profiles
WHERE id = auth.uid();
```

**Expected execution time: < 5ms**

### 4. Update Connection Pooling (Optional)

For optimal performance on paid tier:

1. Go to **Database Settings** → **Connection pooling configuration**
2. Increase **Pool Size** to 20-30 (from 15)
3. Consider enabling **Transaction** mode instead of Session mode

### 5. Monitor Performance

After re-enabling RLS:
- Check production login works instantly
- Monitor Supabase dashboard for connection pool usage
- Verify no timeout errors in production console

---

## Current Status (Free Tier - Development)

- ❌ RLS is **DISABLED** for development
- ✅ All RLS policies are **CREATED** and ready
- ✅ Role constraints updated (super_admin, admin, client)
- ⏳ Waiting for paid tier upgrade to enable RLS

---

## Why RLS Is Disabled Now

The Free tier has limited connection pooling (15 connections max) which causes timeout issues when RLS is enabled. With the paid tier's better resources, RLS will work perfectly.

**Security Note:** Since this is a development environment, disabling RLS temporarily is acceptable. Once you upgrade and re-enable RLS, all security policies will be enforced.
