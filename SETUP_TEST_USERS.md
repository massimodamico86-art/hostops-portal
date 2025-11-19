# Setup Test Users - Step-by-Step Guide

Follow these steps to create test users for role-based testing.

---

## 🎯 Test Users to Create

1. **Admin Test User** - For testing admin role
2. **Client Test User** - For testing client role

Your Super Admin account already exists: `mvproperties305@gmail.com`

---

## 📝 Step-by-Step Instructions

### Step 1: Open Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project: `arqdwxpdodtafjdyairm`
3. Click **Authentication** in the left sidebar
4. Click **Users**

---

### Step 2: Create Admin Test User

1. Click **Add User** button (top right)
2. Fill in the form:
   - **Email**: `admin@hostops-test.com`
   - **Password**: `TestAdmin123!`
   - **Auto Confirm User**: ✓ **YES** (important!)
   - **Send Magic Link**: ✗ NO
3. Click **Create User**
4. **Copy the User ID (UUID)** - you'll need this in Step 4

Example User ID: `a1b2c3d4-1234-5678-90ab-cdef12345678`

---

### Step 3: Create Client Test User

1. Click **Add User** again
2. Fill in the form:
   - **Email**: `client@hostops-test.com`
   - **Password**: `TestClient123!`
   - **Auto Confirm User**: ✓ **YES** (important!)
   - **Send Magic Link**: ✗ NO
3. Click **Create User**
4. **Copy the User ID (UUID)** - you'll need this in Step 4

---

### Step 4: Create Profile Records

Now you need to create profile records for these users in the `profiles` table.

1. Go to **SQL Editor** in Supabase dashboard
2. Click **New Query**
3. Copy and paste this SQL (replace the UUIDs with the ones from Steps 2 and 3):

```sql
-- Replace 'ADMIN_USER_ID_HERE' with the UUID from Step 2
-- Replace 'CLIENT_USER_ID_HERE' with the UUID from Step 3

-- Create admin profile
INSERT INTO public.profiles (id, email, full_name, role, managed_by)
VALUES (
  'ADMIN_USER_ID_HERE',
  'admin@hostops-test.com',
  'Test Admin User',
  'admin',
  NULL
)
ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  managed_by = EXCLUDED.managed_by;

-- Create client profile
INSERT INTO public.profiles (id, email, full_name, role, managed_by)
VALUES (
  'CLIENT_USER_ID_HERE',
  'client@hostops-test.com',
  'Test Client User',
  'client',
  NULL
)
ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  managed_by = EXCLUDED.managed_by;
```

4. Click **Run** (or press Cmd/Ctrl + Enter)

**Expected Output:**
```
Success. No rows returned
```

---

### Step 5: Verify Profiles Were Created

Run this query in SQL Editor:

```sql
SELECT id, email, full_name, role, managed_by, created_at
FROM public.profiles
WHERE email IN ('admin@hostops-test.com', 'client@hostops-test.com')
ORDER BY role;
```

**Expected Results:**

| id | email | full_name | role | managed_by | created_at |
|----|-------|-----------|------|------------|------------|
| a1b2c3... | admin@hostops-test.com | Test Admin User | admin | NULL | 2025-... |
| x9y8z7... | client@hostops-test.com | Test Client User | client | NULL | 2025-... |

---

### Step 6: (Optional) Assign Client to Admin

If you want to test admin managing clients, assign the client to the admin:

```sql
-- Replace 'ADMIN_USER_ID_HERE' with the admin's UUID
UPDATE public.profiles
SET managed_by = 'ADMIN_USER_ID_HERE'
WHERE email = 'client@hostops-test.com';
```

Verify:
```sql
SELECT email, role, managed_by
FROM public.profiles
WHERE email = 'client@hostops-test.com';
```

---

## ✅ Test Credentials

After completing the setup, you should have these credentials:

### Super Admin (existing)
```
Email: mvproperties305@gmail.com
Password: [Your existing password]
Role: super_admin
```

### Admin (test)
```
Email: admin@hostops-test.com
Password: TestAdmin123!
Role: admin
```

### Client (test)
```
Email: client@hostops-test.com
Password: TestClient123!
Role: client
```

---

## 🧪 Testing the Users

### Test Admin Login

1. Go to https://hostops-portal.vercel.app/app
2. Sign out if logged in
3. Login with:
   - Email: `admin@hostops-test.com`
   - Password: `TestAdmin123!`
4. **Expected**: You should see "Admin Dashboard" heading
5. Verify you CANNOT see Super Admin features
6. Check console logs for role confirmation

### Test Client Login

1. Go to https://hostops-portal.vercel.app/app
2. Sign out if logged in
3. Login with:
   - Email: `client@hostops-test.com`
   - Password: `TestClient123!`
4. **Expected**: You should see the client dashboard with full navigation
5. Verify you can only see your own listings
6. Verify you CANNOT access Users page

---

## 🔧 Troubleshooting

### Issue: User created but can't login

**Cause**: User was not auto-confirmed

**Solution**:
1. Go to Authentication → Users in Supabase dashboard
2. Find the user
3. Click the three dots menu
4. Select "Send confirmation email" OR manually confirm the user

### Issue: Profile not found (PGRST116)

**Cause**: Profile record was not created in Step 4

**Solution**:
1. Run the verification query from Step 5
2. If profile doesn't exist, re-run the INSERT query from Step 4
3. Make sure you replaced the UUID placeholders with actual IDs

### Issue: Wrong role showing

**Cause**: Profile role doesn't match expected role

**Solution**:
```sql
-- Fix admin role
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'admin@hostops-test.com';

-- Fix client role
UPDATE public.profiles
SET role = 'client'
WHERE email = 'client@hostops-test.com';
```

---

## 📋 Next Steps

After creating test users, proceed with comprehensive testing:

1. Open [TESTING_GUIDE.md](TESTING_GUIDE.md)
2. Follow the Role Testing Checklist
3. Test all features for each role
4. Document any issues in the Test Results Log

---

## 🔒 Security Note

These are **test accounts** with simple passwords. For production:
- Use strong, unique passwords
- Enable MFA (Multi-Factor Authentication)
- Rotate credentials regularly
- Delete test accounts before going live
