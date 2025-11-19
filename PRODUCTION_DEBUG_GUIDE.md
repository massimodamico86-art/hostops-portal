# Production Authentication Debug Guide

## 🚨 CRITICAL: Root Cause Identified

### The Primary Issue: Wrong Supabase Project URL

**Your production environment is pointing to the WRONG Supabase project!**

- **Local .env**: `https://cymticrjzidywukflwtv.supabase.co`
- **Vercel ENV (VERCEL_ENV_VARS.txt)**: `https://arqdwxpdodtafjdyairm.supabase.co` ⚠️ **TYPO: "odta" should be "ota"**
- **Correct Production URL**: `https://arqdwxpdotafjdyairm.supabase.co`

### What's Happening:
1. User logs in successfully (auth.users table)
2. Supabase Auth creates a session with user ID `8bbacf1b-3990-4775-a99d-dc8454d33e33`
3. Frontend tries to fetch profile from `profiles` table
4. **FAILS with PGRST116** because the profile exists in a DIFFERENT Supabase project!

---

## ✅ Code Changes Made

### 1. Enhanced Profile Fetching (AuthContext.jsx)

**Added automatic profile creation fallback:**
```javascript
// If PGRST116 (no rows), auto-create profile
if (error.code === 'PGRST116') {
  const { data: newProfile, error: insertError } = await supabase
    .from('profiles')
    .insert([{
      id: userId,
      email: userEmail,
      full_name: userEmail.split('@')[0],
      role: 'client'
    }])
    .select()
    .single();
}
```

**Enhanced logging:**
- Logs exact Supabase URL being used
- Logs user ID and email
- Logs full error details (code, message, hint)

**Better error handling:**
- Sets error state object instead of null
- No more infinite loading spinner
- Shows clear error UI with retry/sign-out options

### 2. Improved Error UI (App.jsx)

**Before:** Infinite "Loading your data..." spinner

**After:** Clear error card showing:
- Error message
- Debug info (User ID, Email, Error Code)
- Retry button
- Sign Out button

### 3. Removed `alert()` Calls
Replaced intrusive browser alerts with proper React error states.

---

## 🔧 Immediate Fix Required

### Update Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your `hostops-portal` project
3. Go to **Settings → Environment Variables**
4. Find `VITE_SUPABASE_URL` and update it to:

```
https://arqdwxpdotafjdyairm.supabase.co
```

**Note the spelling:** `arqdwxpdo**t**afjdyairm` (not "odta")

5. Click **Save**
6. **Redeploy** the application for changes to take effect

---

## 🧪 Testing After Deploy

### Step 1: Open DevTools BEFORE Login

1. Go to https://hostops-portal.vercel.app/app
2. Open Browser DevTools (F12)
3. Go to **Console** tab
4. Clear console

### Step 2: Monitor During Login

When you log in, you should see these console logs:

```
✅ Expected Flow:
🔍 Supabase Config: { url: 'https://arqdwxpdotafjdyairm.supabase.co', hasKey: true }
🔄 AuthContext: Initializing auth...
✅ AuthContext: Session retrieved { hasSession: true }
🔍 [AuthContext] Fetching profile for user: 8bbacf1b-3990-4775-a99d-dc8454d33e33
🔍 [AuthContext] Using Supabase URL: https://arqdwxpdotafjdyairm.supabase.co
🔍 [AuthContext] User email: mvproperties305@gmail.com
🔍 [AuthContext] Query built, executing with 10s timeout...
✅ [AuthContext] Profile fetched successfully: { id: '...', email: '...', role: 'super_admin' }
✅ Routing to SuperAdminDashboard
```

### Step 3: Check Network Tab

1. Go to **Network** tab in DevTools
2. Filter by "profiles"
3. Look for `GET /rest/v1/profiles?...`

**Expected:**
- Status: `200 OK`
- Response: JSON object with your profile

**If still failing:**
- Status: `406 Not Acceptable` or `401 Unauthorized`
- Response: `{ code: 'PGRST116', ... }`

### Step 4: Verify Supabase URL

In the console, check the very first log:

```javascript
🔍 Supabase Config: { url: 'https://arqdwxpdotafjdyairm.supabase.co', ... }
```

**If this shows the WRONG URL:**
- Vercel environment variables were not updated
- Or app was not redeployed after update

---

## 🔍 Advanced Debugging

### Check Auth Token (if profile still fails)

Run this in browser console AFTER login:

```javascript
const session = await window.supabase.auth.getSession();
console.log('Session:', session);
console.log('Access Token:', session.data.session?.access_token);

// Decode JWT to see claims
const token = session.data.session?.access_token;
if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  console.log('JWT Payload:', payload);
  console.log('User ID from JWT:', payload.sub);
}
```

**What to check:**
- `payload.sub` should match user ID `8bbacf1b-3990-4775-a99d-dc8454d33e33`
- `payload.aud` should be `authenticated`
- `payload.role` should be `authenticated`

### Manual Profile Query

Run this in browser console:

```javascript
const { data, error } = await window.supabase
  .from('profiles')
  .select('*')
  .eq('id', '8bbacf1b-3990-4775-a99d-dc8454d33e33')
  .single();

console.log('Profile data:', data);
console.log('Profile error:', error);
```

**Expected:** Should return your profile object

**If PGRST116:** Profile doesn't exist (auto-create will trigger)

**If RLS error:** RLS policies are blocking the query (but you verified they're correct)

---

## 🛡️ RLS Policy Verification

Your policies look correct, but to verify they're working:

### Test in Supabase SQL Editor

```sql
-- Run as authenticated user (mimics frontend)
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "8bbacf1b-3990-4775-a99d-dc8454d33e33"}';

SELECT * FROM profiles WHERE id = '8bbacf1b-3990-4775-a99d-dc8454d33e33';
```

**Expected:** Should return 1 row

**If 0 rows:** RLS policy is blocking (but you said USING(true) works)

---

## 📊 What Changed & Why

### Before This Fix:

1. **Wrong Supabase URL** → Auth works but profile queries go to wrong DB
2. **No error handling** → Infinite loading spinner
3. **No auto-create** → Missing profiles cause permanent hang
4. **Poor logging** → Can't diagnose issues

### After This Fix:

1. **Enhanced logging** → Can see exact URL, user ID, and errors
2. **Auto-create profiles** → Missing profiles are created automatically
3. **Error UI** → Clear feedback instead of infinite spinner
4. **Better debugging** → Full error details in console

---

## 🎯 Next Steps

1. **Fix Vercel ENV** → Update `VITE_SUPABASE_URL` to correct value
2. **Redeploy** → Trigger new Vercel deployment
3. **Test login** → Follow testing steps above
4. **Monitor logs** → Watch console for errors
5. **Report back** → Share console logs if still failing

---

## 🔗 Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Supabase JS Client Docs](https://supabase.com/docs/reference/javascript/introduction)

---

## 💡 Pro Tips

- Always check the Supabase URL in console first
- Use browser DevTools Network tab to inspect API calls
- Check RLS policies in Supabase Dashboard
- Use SQL Editor to test queries as authenticated user
- Keep browser console open when testing in production
