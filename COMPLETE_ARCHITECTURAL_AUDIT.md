# COMPLETE ARCHITECTURAL AUDIT - hostOps Portal
**Generated:** 2025-11-18
**Status:** Production Deployment Active
**Current Issue:** Infinite "Loading..." after login in production

---

## EXECUTIVE SUMMARY

### Critical Finding
**ROOT CAUSE OF PRODUCTION FAILURE**: The production app is stuck on "Loading..." because the RLS policies on the `profiles` table are **blocking** the authenticated user from reading their own profile, even though:
- The profile EXISTS in the database (ID: `8bbacf1b-3990-4775-a99d-dc8454d33e33`)
- The user is AUTHENTICATED
- RLS has been DISABLED manually

**Why RLS Disable Didn't Work**: Even with `ALTER TABLE profiles DISABLE ROW LEVEL SECURITY`, the Supabase JavaScript SDK goes through the **PostgREST API** which still enforces policies regardless of the table-level RLS setting.

**Immediate Fix Required**: Replace the broken RLS policies with properly scoped policies that explicitly grant `authenticated` role access.

---

## 1. PROJECT STRUCTURE

```
hostops-portal/
├── public/
│   └── vite.svg
├── src/
│   ├── components/
│   │   ├── listings/           # 15 listing-related components
│   │   │   ├── AddGuestModal.jsx
│   │   │   ├── AddICalModal.jsx
│   │   │   ├── AddListingModal.jsx
│   │   │   ├── BackgroundImageSelector.jsx
│   │   │   ├── BackgroundMediaManager.jsx
│   │   │   ├── BackgroundMusicSelector.jsx
│   │   │   ├── BackgroundVideoSelector.jsx
│   │   │   ├── CarouselMediaManager.jsx
│   │   │   ├── GuestEditModal.jsx
│   │   │   ├── GuestListTab.jsx
│   │   │   ├── ImageUploadModal.jsx
│   │   │   ├── PMSSetupModal.jsx
│   │   │   ├── QRCodeManager.jsx
│   │   │   ├── TVDeviceManagement.jsx
│   │   │   ├── TVPreviewModal.jsx
│   │   │   └── WelcomeMessageForm.jsx
│   │   ├── Badge.jsx
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── DateRangeModal.jsx
│   │   ├── ImageUploadButton.jsx
│   │   ├── Modal.jsx
│   │   ├── OptimizedImage.jsx
│   │   ├── StatCard.jsx
│   │   └── Toast.jsx
│   ├── contexts/
│   │   └── AuthContext.jsx     # ⚠️ CRITICAL: Profile fetch failing
│   ├── data/
│   │   └── mockData.js
│   ├── hooks/
│   │   ├── useCloudinaryUpload.js
│   │   └── useDebounce.js
│   ├── layouts/               # TV display layouts
│   │   ├── Layout1.jsx
│   │   ├── Layout2.jsx
│   │   ├── Layout3.jsx
│   │   ├── Layout4.jsx
│   │   └── index.js
│   ├── pages/                 # 16 page components
│   │   ├── AdminDashboardPage.jsx
│   │   ├── AdminTestPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── FAQsPage.jsx
│   │   ├── ForgotPasswordPage.jsx
│   │   ├── GuidebooksPage.jsx
│   │   ├── ListingsPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── MonetizePage.jsx
│   │   ├── PMSPage.jsx
│   │   ├── ReferPage.jsx
│   │   ├── ResetPasswordPage.jsx
│   │   ├── SetupPage.jsx
│   │   ├── SettingsPage.jsx
│   │   ├── SubscriptionPage.jsx
│   │   ├── SuperAdminDashboardPage.jsx
│   │   ├── UsersPage.jsx
│   │   └── index.js
│   ├── services/
│   │   ├── activityLogService.js
│   │   ├── adminService.js
│   │   ├── exportService.js
│   │   ├── icalService.js
│   │   ├── pmsService.js
│   │   ├── qrcodeService.js
│   │   ├── userSettingsService.js
│   │   └── weatherService.js
│   ├── utils/
│   │   ├── guestHelpers.js
│   │   └── listingHelpers.js
│   ├── App.jsx               # Main app component (client dashboard)
│   ├── TV.jsx                # TV display app with OTP pairing
│   ├── ScaledStage.jsx
│   ├── constants.js
│   ├── getConfig.js
│   ├── index.css
│   ├── main.jsx              # ⚠️ Entry point with routing
│   └── supabase.js           # Supabase client config
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql
│       ├── 002_seed_data.sql
│       ├── 003_tv_pairing_function.sql
│       ├── 004_fix_tv_devices_columns.sql
│       ├── 005_auto_offline_tv_devices.sql
│       ├── 006_pms_connections.sql
│       ├── 007_activity_log.sql
│       ├── 008_user_settings.sql
│       └── 009_add_roles_and_rbac.sql  # ⚠️ PROBLEMATIC POLICIES
├── package.json
├── vite.config.js
├── vercel.json
├── tailwind.config.js
├── postcss.config.js
└── .env                      # ⚠️ NOT IN GIT (good)
```

### Dependencies
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.80.0",
    "ical.js": "^2.2.1",          // Calendar sync
    "lucide-react": "^0.548.0",   // Icons
    "qrcode": "^1.5.4",           // QR code generation
    "react": "^19.1.1",
    "react-dom": "^19.1.1",
    "react-router-dom": "^7.9.5"
  }
}
```

---

## 2. FRONTEND ARCHITECTURE ANALYSIS

### 2.1 Routing Flow

```
main.jsx (Entry Point)
  └── BrowserRouter
      └── AuthProvider (wraps entire app)
          └── Routes
              ├── /app/*    → App.jsx (Main dashboard)
              ├── /tv/*     → TV.jsx (TV display)
              └── /*        → Navigate to /app
```

**Issues Identified:**
1. ❌ **No lazy loading** - All pages bundled together
2. ❌ **No code splitting** - Single large bundle
3. ❌ **No Suspense boundaries** - No loading fallbacks for components
4. ❌ **Wildcard routing** - `/app/*` doesn't actually have nested routes defined

### 2.2 Authentication Flow

```mermaid
AuthContext Initialization
  ↓
supabase.auth.getSession()
  ↓
If session exists → fetchUserProfile(user.id)
  ↓
Query: SELECT * FROM profiles WHERE id = user.id
  ↓
⚠️ BLOCKS HERE IN PRODUCTION ⚠️
  ↓
(Never resolves due to RLS policy blocking)
  ↓
App stuck on "Loading..."
```

**AuthContext.jsx Issues:**
1. ✅ Properly uses `useState` and `useEffect`
2. ✅ Handles session state changes
3. ✅ Provides helper functions (`isSuperAdmin`, `isAdmin`, `isClient`)
4. ❌ **CRITICAL BUG**: `fetchUserProfile` query never resolves in production
5. ❌ No timeout on profile fetch (hangs indefinitely)
6. ❌ No retry logic
7. ❌ Doesn't check if RLS is blocking the query

### 2.3 Role-Based Routing

**App.jsx Lines 255-265:**
```javascript
if (authUserProfile?.role === 'super_admin') {
  return <SuperAdminDashboardPage />;
}

if (authUserProfile?.role === 'admin') {
  return <AdminDashboardPage />;
}

// Default: Client dashboard
return <ClientUI />;
```

**Issues:**
1. ✅ Clean role-based routing
2. ❌ **NEVER REACHED** because `authUserProfile` is never set (stuck loading profile)
3. ❌ No fallback for undefined role
4. ❌ Hard navigation replacement (loses entire client UI)

### 2.4 Data Fetching Pattern

**App.jsx Lines 54-114:**
```javascript
useEffect(() => {
  const fetchData = async () => {
    // 1. Fetch user profile (DUPLICATE - also in AuthContext!)
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // 2. Fetch listings based on role
    if (profile.role === 'super_admin') {
      // All listings with owner details
    } else if (profile.role === 'admin') {
      // Managed client listings
    } else {
      // Own listings only
    }
  };
}, [user]);
```

**Issues:**
1. ❌ **DUPLICATE PROFILE FETCH** - AuthContext already fetches profile
2. ❌ **RLS Will Block** - Same policy issue affects this query too
3. ❌ No error boundaries
4. ❌ Silently ignores "PGRST116" errors (0 rows) which masks the real problem
5. ❌ Real-time subscription only listens to own listings, not managed client listings for admins

### 2.5 State Management

**Current Approach:**
- ✅ AuthContext for global auth state
- ❌ Prop drilling for `listings`, `showToast`, `setCurrentPage`
- ❌ No centralized state management (Redux, Zustand, Jotai)
- ❌ Duplicate state (userProfile in both AuthContext and App.jsx)

### 2.6 Performance Issues

1. **Bundle Size**: All 16 pages + 15 listing components + 4 layouts loaded upfront
2. **No Code Splitting**: No dynamic imports
3. **No Memoization**: Components re-render unnecessarily
4. **Inefficient Queries**: Fetching entire listings with all fields when dashboard only needs summary
5. **Real-time Overhead**: Every user polls TV device status every 2 minutes

---

## 3. SUPABASE/BACKEND ARCHITECTURE

### 3.1 Database Schema

**9 Core Tables:**
```sql
profiles          -- User profiles (extends auth.users)
listings          -- Properties with all config
guests            -- Guest reservations
tv_devices        -- TV devices paired with listings
qr_codes          -- QR codes for TV display
tasks             -- Property management tasks
faqs              -- FAQ content
monetization_stats -- Earnings tracking
experiences       -- Tours/activities offered
```

**Additional Tables (from later migrations):**
```sql
pms_connections   -- PMS integrations (Guesty, Airbnb, etc.)
activity_logs     -- Audit trail
user_settings     -- User preferences
```

### 3.2 Supabase Client Configuration

**src/supabase.js:**
```javascript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});
```

**Issues:**
1. ✅ Correct environment variable naming (`VITE_` prefix)
2. ✅ PKCE flow for security
3. ⚠️ **Console logs in production** (lines 6-10) - Should be removed
4. ❌ No error handling if env vars missing (throws generic error)

### 3.3 RLS Policies - THE CRITICAL ISSUE

**Migration 009 Created These Policies:**

```sql
-- PROFILES TABLE
CREATE POLICY "profiles_select_policy"
ON profiles FOR SELECT
USING (
  id = auth.uid()                    -- Users see their own profile
  OR is_super_admin()                -- Super admins see all
  OR (is_admin() AND managed_by = auth.uid())  -- Admins see managed clients
);
```

**⚠️ THE PROBLEM:**

The policy calls `is_super_admin()` which is defined as:
```sql
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles          -- ⚠️ RECURSION!
    WHERE id = auth.uid() AND role = 'super_admin'
  );
$$;
```

**This creates INFINITE RECURSION:**
1. User tries to SELECT from profiles
2. RLS policy calls `is_super_admin()`
3. `is_super_admin()` tries to SELECT from profiles
4. RLS policy calls `is_super_admin()` again
5. **INFINITE LOOP** → Query hangs forever

**Why It Works Locally But Fails in Production:**
- Local: RLS might be disabled during development
- Production: RLS is enforced, causing the recursion

### 3.4 Supabase RPCs/Functions

**Created Functions:**
```sql
-- Helper Functions (PROBLEMATIC - cause recursion)
get_my_role()           -- Returns current user's role
is_super_admin()        -- Checks if user is super admin  ⚠️ RECURSIVE
is_admin()              -- Checks if user is admin        ⚠️ RECURSIVE
get_my_client_ids()     -- Returns IDs of managed clients ⚠️ RECURSIVE

-- Business Logic Functions
assign_client_to_admin()     -- Assigns client to admin
update_tv_device_status()    -- Marks offline TV devices
ping_tv_device()             -- Updates TV device last_seen
get_listing_config()         -- Returns listing config for TV
```

**Issues:**
1. ❌ **ALL helper functions query profiles table** → triggers RLS recursion
2. ❌ `SECURITY DEFINER` doesn't bypass RLS in this context
3. ❌ No caching of role lookups
4. ❌ No indexes on role column (added in migration 009 but may not be effective)

### 3.5 Database Performance

**Missing Indexes:**
- ❌ `profiles.email` (has UNIQUE but could use explicit index)
- ❌ `profiles.role` + `profiles.managed_by` composite index
- ❌ `listings.owner_id` + `listings.active` composite index
- ❌ `guests` date range queries (check_in/check_out)

**Slow Queries Identified:**
1. Admin fetching all managed client listings (no index on owner_id IN subquery)
2. Super admin dashboard fetching all listings with owner details (N+1 problem)
3. Real-time subscription filters

---

## 4. TV APP ARCHITECTURE

### 4.1 OTP Pairing Flow

```mermaid
TV Display Boot
  ↓
Check localStorage for 'tv_otp'
  ↓
If no OTP → Show pairing screen
  ↓
User enters 6-digit OTP from dashboard
  ↓
Call getConfig(otp)
  ↓
Supabase RPC: get_listing_config(otp)
  ↓
Returns { layout, guest }
  ↓
Render appropriate Layout component
  ↓
Start ping interval (60s)
  ↓
Start weather refresh (30min)
```

**TV.jsx Issues:**
1. ✅ Clean OTP flow with localStorage persistence
2. ✅ Automatic reconnection on refresh
3. ❌ **No OTP expiration** - OTPs stored in localStorage forever
4. ❌ **No device fingerprinting** - Same OTP can be used on multiple devices
5. ❌ Ping interval continues even if config fails
6. ❌ No error recovery if OTP becomes invalid

### 4.2 Layout System

**4 Layout Components:**
- Layout1: Classic welcome screen
- Layout2: Modern card-based
- Layout3: Minimalist
- Layout4: Full-screen media

**Issues:**
1. ✅ Clean abstraction with layout selection in database
2. ❌ All 4 layouts loaded in bundle (no lazy loading)
3. ❌ No preview mode for testing layouts
4. ❌ Background images not optimized (no srcset, no WebP)

### 4.3 Weather Integration

**weatherService.js:**
```javascript
const cache = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export async function getWeather(city) {
  // Check cache
  if (cache.has(city)) {
    const { data, timestamp } = cache.get(city);
    if (Date.now() - timestamp < CACHE_DURATION) {
      return data;
    }
  }

  // Fetch from OpenWeatherMap API
  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`
  );

  const data = await response.json();
  cache.set(city, { data, timestamp: Date.now() });
  return data;
}
```

**Issues:**
1. ✅ Proper caching (30min)
2. ✅ API key from environment
3. ❌ **API key exposed in client bundle** - Should use backend proxy
4. ❌ Cache is in-memory only (doesn't persist across refreshes)
5. ❌ No error handling for invalid city names
6. ❌ Rate limiting not implemented

---

## 5. ROOT-CAUSE ANALYSIS OF ALL BUGS

### Bug #1: Production "Loading..." Hang (P0 - CRITICAL)

**Symptom:** After login, production app shows "Loading..." indefinitely

**Root Cause:**
```
RLS Policy Recursion
  └── profiles_select_policy calls is_super_admin()
      └── is_super_admin() queries profiles table
          └── Triggers profiles_select_policy again
              └── INFINITE RECURSION
```

**Evidence:**
1. Console log shows: `Query built, executing...` (never completes)
2. Supabase error: `PGRST116: The result contains 0 rows`
3. Profile EXISTS in database (confirmed via SQL Editor)
4. RLS disabled manually but didn't help (PostgREST still enforces policies)

**Fix:**
```sql
-- DROP problematic policies
DROP POLICY "profiles_select_policy" ON profiles;

-- CREATE simple, non-recursive policy
CREATE POLICY "authenticated_users_read_own_profile"
ON profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Super admin access (separate policy)
CREATE POLICY "service_role_full_access"
ON profiles FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

### Bug #2: Duplicate Profile Fetch (P1 - Performance)

**Symptom:** Profile fetched twice on every page load

**Root Cause:**
- AuthContext.jsx fetches profile (line 20-60)
- App.jsx also fetches profile (line 59-66)

**Fix:** Remove duplicate fetch from App.jsx, use AuthContext's `userProfile`

### Bug #3: Real-time Subscription Only for Own Listings (P1 - Functionality)

**Symptom:** Admins don't see real-time updates for managed client listings

**Root Cause:** Subscription filter in App.jsx line 127:
```javascript
filter: `owner_id=eq.${user.id}`
```

**Fix:** Admin/Super Admin should subscribe to multiple filters or use wildcard

### Bug #4: Silent Error Suppression (P2 - Debugging)

**Symptom:** Errors hidden with generic "Loading data..." message

**Root Cause:** App.jsx lines 108-110:
```javascript
if (error.code !== 'PGRST116') {
  showToast('Error loading data: ' + error.message, 'error');
}
```

**Fix:** Log all errors to console, show user-friendly messages

### Bug #5: TV OTP Security (P1 - Security)

**Symptom:** OTPs never expire, can be reused indefinitely

**Root Cause:** No expiration logic in TV device pairing

**Fix:** Add `otp_expires_at` column, regenerate OTPs periodically

### Bug #6: Weather API Key Exposure (P1 - Security)

**Symptom:** OpenWeather API key visible in client bundle

**Root Cause:** Direct API call from frontend (weatherService.js)

**Fix:** Create Supabase Edge Function to proxy weather requests

### Bug #7: Missing Error Boundaries (P2 - Reliability)

**Symptom:** Component crashes bring down entire app

**Root Cause:** No React Error Boundaries

**Fix:** Wrap page components in ErrorBoundary

### Bug #8: No Bundle Optimization (P2 - Performance)

**Symptom:** Large initial bundle size

**Root Cause:** No code splitting, all components loaded upfront

**Fix:** Implement React.lazy() and Suspense

---

## 6. FEATURE COMPLETENESS AUDIT

### ✅ Implemented Features

| Feature | Status | DB Tables | UI Components | Notes |
|---------|--------|-----------|---------------|-------|
| Listings Management | ✅ | listings | ListingsPage, AddListingModal, PropertyDetailsModal | Fully functional |
| Guest Management | ✅ | guests | GuestListTab, AddGuestModal, GuestEditModal | With iCal import |
| TV Layouts (1-4) | ✅ | tv_devices | Layout1-4, TVPreviewModal | 4 layouts available |
| TV Device Pairing | ✅ | tv_devices | TVDeviceManagement | OTP-based pairing |
| QR Codes | ✅ | qr_codes | QRCodeManager | WiFi, website, custom |
| Weather Display | ✅ | listings (weather_city) | All layouts | OpenWeather integration |
| Background Media | ✅ | listings | BackgroundImageSelector, BackgroundVideoSelector, BackgroundMusicSelector | Cloudinary upload |
| Carousel Images | ✅ | listings (carousel_images) | CarouselMediaManager | Multiple images |
| Welcome Messages | ✅ | listings | WelcomeMessageForm | Customizable greetings |
| User Settings | ✅ | user_settings | SettingsPage | Preferences |
| Activity Logs | ✅ | activity_logs | Admin dashboard | Audit trail |
| Multi-tenant RBAC | ✅ | profiles (role, managed_by) | AuthContext | Super admin, admin, client |
| Admin Dashboard | ✅ | N/A | AdminDashboardPage | Manage clients |
| Super Admin Dashboard | ✅ | N/A | SuperAdminDashboardPage | Full system view |

### ⚠️ Partially Implemented Features

| Feature | Status | Missing Components | Priority |
|---------|--------|--------------------|----------|
| PMS Integration | ⚠️ | Sync logic incomplete | P1 |
| Guidebooks | ⚠️ | CRUD operations missing | P2 |
| Monetization (Viator) | ⚠️ | No actual API integration | P3 |
| FAQs Management | ⚠️ | Admin CRUD missing | P2 |
| Tasks/To-dos | ⚠️ | No UI at all | P3 |
| Experiences | ⚠️ | No UI at all | P3 |

### ❌ Missing Features

| Feature | Needed DB Tables | Required Components | Priority |
|---------|------------------|---------------------|----------|
| Checkout Instructions | `checkout_instructions` | Editor component | P2 |
| Property-specific Settings | Exists in `listings` | UI improvements needed | P3 |
| Analytics Dashboard | `analytics_events` | Charts, metrics | P2 |
| Email Notifications | `email_templates`, `notifications` | Email service | P2 |
| Payment Processing | `subscriptions`, `invoices` | Stripe integration | P1 |
| Calendar Sync (Full) | Partial in `pms_connections` | Airbnb/Vrbo OAuth | P1 |
| Guest Reviews | `reviews` | Rating system | P3 |
| Multi-language Support | `translations` | i18n setup | P3 |

---

## 7. CODE QUALITY & SECURITY AUDIT

### 7.1 Security Vulnerabilities

| Issue | Severity | Location | Fix |
|-------|----------|----------|-----|
| ❌ **RLS Recursion** | CRITICAL | Migration 009 | Replace policies (see Bug #1) |
| ❌ **Weather API Key Exposure** | HIGH | weatherService.js | Use Edge Function proxy |
| ❌ **No Rate Limiting** | MEDIUM | All APIs | Implement Supabase rate limits |
| ❌ **OTP Never Expires** | MEDIUM | tv_devices table | Add expiration column |
| ❌ **No CSRF Protection** | MEDIUM | All forms | Add CSRF tokens |
| ❌ **Console Logs in Production** | LOW | supabase.js | Remove debug logs |
| ❌ **Hardcoded URLs** | LOW | Various | Use environment variables |

### 7.2 Code Anti-Patterns

```javascript
// ❌ BAD: Silent error suppression
if (error.code !== 'PGRST116') {
  showToast('Error loading data: ' + error.message, 'error');
}

// ✅ GOOD: Log all errors, show user-friendly messages
console.error('Data fetch error:', error);
if (error.code === 'PGRST116') {
  // Expected: no data
} else {
  showToast('Unable to load data. Please try again.', 'error');
}
```

```javascript
// ❌ BAD: Duplicate state
const [userProfile, setUserProfile] = useState(null); // in App.jsx
const { userProfile } = useAuth(); // from AuthContext

// ✅ GOOD: Single source of truth
const { userProfile } = useAuth();
```

```javascript
// ❌ BAD: Prop drilling
<DashboardPage showToast={showToast} listings={listings} />

// ✅ GOOD: Context or state management
const { showToast } = useToast();
const { listings } = useListings();
```

### 7.3 Missing Error Handling

**Uncaught Promise Failures:**
1. weatherService.getWeather() - no .catch()
2. supabase.rpc('ping_tv_device') - errors silently ignored
3. Image upload failures - no retry logic

**No Timeout Handling:**
```javascript
// ❌ Current: Hangs forever
const result = await query;

// ✅ Better: Timeout after 10 seconds
const result = await Promise.race([
  query,
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), 10000)
  )
]);
```

### 7.4 Performance Issues

**Inefficient Queries:**
```javascript
// ❌ Fetches ALL columns for ALL listings
const { data } = await supabase
  .from('listings')
  .select('*, owner:profiles(id, full_name, email)')
  .order('created_at', { ascending: false });

// ✅ Select only needed columns for dashboard
const { data } = await supabase
  .from('listings')
  .select('id, name, active, created_at, owner:profiles(full_name)')
  .order('created_at', { ascending: false })
  .limit(50);
```

**No Memoization:**
```javascript
// ❌ Re-renders on every parent render
const ListingsPage = ({ listings }) => {
  const activeListings = listings.filter(l => l.active);
  // ...
};

// ✅ Memoize derived state
const activeListings = useMemo(
  () => listings.filter(l => l.active),
  [listings]
);
```

### 7.5 Missing Abstractions

**Duplicate Supabase Queries:**
- Profile fetching logic duplicated in 3 places
- Listing queries scattered across components
- No query hooks or abstractions

**Should Create:**
```javascript
// hooks/useProfile.js
export function useProfile(userId) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Centralized profile fetching logic
  }, [userId]);

  return { profile, loading, error };
}

// hooks/useListings.js
export function useListings(ownerId) {
  // Centralized listings logic with real-time
}
```

---

## 8. ACTIONABLE FIXES

### P0: CRITICAL - Breaking Issues

#### Fix #1: Replace RLS Policies (MUST DO FIRST)

**File:** `/tmp/FIX_RLS_POLICIES_PRODUCTION.sql`

```sql
-- ============================================
-- FIX RLS RECURSION - PRODUCTION EMERGENCY
-- ============================================

-- 1. DROP ALL EXISTING POLICIES ON PROFILES
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;

-- 2. CREATE SIMPLE, NON-RECURSIVE POLICIES

-- Allow authenticated users to read their own profile
CREATE POLICY "users_read_own_profile"
ON profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Allow authenticated users to update their own profile
CREATE POLICY "users_update_own_profile"
ON profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Allow users to insert their own profile during signup
CREATE POLICY "users_insert_own_profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- 3. GRANT SERVICE ROLE FULL ACCESS (for admin operations via backend)
CREATE POLICY "service_role_full_access_profiles"
ON profiles FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 4. ENSURE RLS IS ENABLED
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check RLS status
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'profiles';

-- Check policies
SELECT policyname, roles, cmd FROM pg_policies WHERE tablename = 'profiles';

-- Test profile query (should return 1 row for authenticated user)
SELECT id, email, full_name, role FROM profiles WHERE id = auth.uid();
```

**Run this SQL in production Supabase SQL Editor NOW.**

#### Fix #2: Remove Broken Helper Functions

```sql
-- These functions cause recursion - DROP THEM
DROP FUNCTION IF EXISTS is_super_admin();
DROP FUNCTION IF EXISTS is_admin();
DROP FUNCTION IF EXISTS get_my_role();
DROP FUNCTION IF EXISTS get_my_client_ids();
```

**Replace with client-side role checks:**

```javascript
// utils/rbac.js
export function isSuperAdmin(userProfile) {
  return userProfile?.role === 'super_admin';
}

export function isAdmin(userProfile) {
  return userProfile?.role === 'admin';
}

export function canManageUser(currentUser, targetUser) {
  if (isSuperAdmin(currentUser)) return true;
  if (isAdmin(currentUser) && targetUser.managed_by === currentUser.id) return true;
  return false;
}
```

#### Fix #3: Add Timeout to Profile Fetch

**File:** `src/contexts/AuthContext.jsx`

```javascript
const fetchUserProfile = async (userId) => {
  if (!userId) {
    setUserProfile(null);
    return;
  }

  try {
    console.log('🔍 Fetching profile for user:', userId);

    // Add timeout
    const queryPromise = supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Profile fetch timeout')), 10000)
    );

    const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

    if (error) {
      console.error('❌ Profile fetch error:', error);

      // If RLS is blocking, show helpful error
      if (error.code === 'PGRST116') {
        throw new Error('Profile not found. Please contact support.');
      }

      throw error;
    }

    console.log('✅ Profile fetched successfully:', data);
    setUserProfile(data);
  } catch (error) {
    console.error('❌ Error fetching user profile:', error);
    setUserProfile(null);
    // Show error to user instead of hanging
    alert(`Unable to load profile: ${error.message}. Please refresh the page.`);
  }
};
```

### P1: SERIOUS - Non-Breaking but Important

#### Fix #4: Remove Duplicate Profile Fetch

**File:** `src/App.jsx`

```diff
- // Fetch user profile
- const { data: profile, error: profileError } = await supabase
-   .from('profiles')
-   .select('*')
-   .eq('id', user.id)
-   .single();
-
- if (profileError) throw profileError;
- setUserProfile(profile);
+ // Use profile from AuthContext
+ const profile = authUserProfile;
```

#### Fix #5: Fix Admin Real-time Subscriptions

```javascript
// For admins, subscribe to managed client listings
if (profile.role === 'admin' || profile.role === 'super_admin') {
  const channel = supabase
    .channel(`listings-admin-${user.id}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'listings'
        // No filter - listen to all changes, filter client-side
      },
      (payload) => {
        // Filter based on role
        if (profile.role === 'super_admin') {
          // Apply change
        } else if (profile.role === 'admin') {
          // Check if listing owner is managed by this admin
        }
      }
    )
    .subscribe();
}
```

#### Fix #6: Add OTP Expiration

**Migration:**
```sql
ALTER TABLE tv_devices ADD COLUMN otp_expires_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION refresh_tv_otp(device_id_param UUID)
RETURNS TEXT AS $$
DECLARE
  new_otp TEXT;
BEGIN
  new_otp := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));

  UPDATE tv_devices
  SET otp = new_otp, otp_expires_at = NOW() + INTERVAL '24 hours'
  WHERE id = device_id_param;

  RETURN new_otp;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Update TV pairing logic:**
```javascript
// Check OTP expiration
const { data: device } = await supabase
  .from('tv_devices')
  .select('*')
  .eq('otp', otp)
  .single();

if (!device) throw new Error('Invalid OTP');
if (new Date(device.otp_expires_at) < new Date()) {
  throw new Error('OTP expired. Please generate a new one.');
}
```

#### Fix #7: Proxy Weather API

**Create Edge Function:**
```javascript
// supabase/functions/weather/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const url = new URL(req.url);
  const city = url.searchParams.get('city');

  const apiKey = Deno.env.get('OPENWEATHER_API_KEY');

  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`
  );

  const data = await response.json();

  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

**Update client:**
```javascript
// services/weatherService.js
const response = await supabase.functions.invoke('weather', {
  body: { city }
});
```

### P2: CLEANUP - Code Quality

#### Fix #8: Add Error Boundaries

```javascript
// components/ErrorBoundary.jsx
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <button onClick={() => window.location.reload()}>
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

#### Fix #9: Implement Code Splitting

```javascript
// App.jsx
const SuperAdminDashboardPage = lazy(() => import('./pages/SuperAdminDashboardPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));

// Wrap in Suspense
<Suspense fallback={<LoadingSpinner />}>
  {authUserProfile?.role === 'super_admin' && <SuperAdminDashboardPage />}
  {authUserProfile?.role === 'admin' && <AdminDashboardPage />}
</Suspense>
```

#### Fix #10: Create Query Hooks

```javascript
// hooks/useProfile.js
export function useProfile(userId) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;

    const fetchProfile = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        setError(error);
      } else {
        setProfile(data);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [userId]);

  return { profile, loading, error };
}
```

### P3: NICE-TO-HAVE - Enhancements

#### Fix #11: Add Analytics

```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  event_type TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analytics_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_created_at ON analytics_events(created_at);
```

#### Fix #12: Implement Caching

```javascript
// Use TanStack Query (React Query)
const { data: listings, isLoading } = useQuery({
  queryKey: ['listings', userProfile?.role, user?.id],
  queryFn: () => fetchListings(user.id, userProfile?.role),
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

---

## 9. DEPLOYMENT CHECKLIST

### Pre-Deployment

- [ ] Run RLS fix SQL in production
- [ ] Test profile fetch in production
- [ ] Verify super admin can log in
- [ ] Remove console.log statements
- [ ] Set environment variables in Vercel
- [ ] Enable Vercel caching
- [ ] Configure redirect rules

### Post-Deployment

- [ ] Monitor error logs
- [ ] Check bundle size
- [ ] Test all user roles (super_admin, admin, client)
- [ ] Verify TV pairing works
- [ ] Test real-time updates
- [ ] Check performance metrics

### Environment Variables Needed

```env
# Supabase
VITE_SUPABASE_URL=https://arqdwxpdotafjdyairm.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>

# Cloudinary
VITE_CLOUDINARY_CLOUD_NAME=<cloud-name>
VITE_CLOUDINARY_UPLOAD_PRESET=<preset>

# OpenWeather (move to backend)
OPENWEATHER_API_KEY=<api-key>  # NOT VITE_ prefix (server-only)
```

---

## 10. FINAL DELIVERABLES

### Deliverable 1: System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT BROWSER                            │
│  ┌────────────────┐              ┌─────────────────────┐    │
│  │   /app/*       │              │      /tv/*          │    │
│  │  Main Portal   │              │   TV Display        │    │
│  └────────┬───────┘              └──────┬──────────────┘    │
│           │                             │                    │
└───────────┼─────────────────────────────┼────────────────────┘
            │                             │
            └─────────────┬───────────────┘
                          │
                          ▼
            ┌─────────────────────────────┐
            │   Supabase (Backend)        │
            │  ┌───────────────────────┐  │
            │  │  PostgREST API        │  │
            │  │  (RLS Enforcement)    │◄─┼─── ⚠️ ISSUE HERE
            │  └───────────────────────┘  │
            │  ┌───────────────────────┐  │
            │  │  PostgreSQL Database  │  │
            │  │  - profiles           │  │
            │  │  - listings           │  │
            │  │  - guests             │  │
            │  │  - tv_devices         │  │
            │  │  - qr_codes           │  │
            │  └───────────────────────┘  │
            │  ┌───────────────────────┐  │
            │  │  Auth (Supabase)      │  │
            │  │  - JWT tokens         │  │
            │  │  - PKCE flow          │  │
            │  └───────────────────────┘  │
            │  ┌───────────────────────┐  │
            │  │  Realtime             │  │
            │  │  - Listings updates   │  │
            │  │  - TV status pings    │  │
            │  └───────────────────────┘  │
            └─────────────────────────────┘
                          │
                          ▼
            ┌─────────────────────────────┐
            │   External Services         │
            │  - OpenWeatherMap API       │
            │  - Cloudinary CDN           │
            │  - PMS APIs (Guesty, etc.)  │
            └─────────────────────────────┘
```

### Deliverable 2: Auth & Role Routing Flow

```
User Opens App
  │
  ├─ /tv/* → TV.jsx
  │    ├─ Check localStorage for OTP
  │    ├─ If OTP → getConfig(otp) → Render Layout
  │    └─ Else → Show Pairing Screen
  │
  └─ /app/* → App.jsx
       │
       ├─ AuthContext: supabase.auth.getSession()
       │    │
       │    ├─ No session → Show LoginPage
       │    │
       │    └─ Session exists
       │         │
       │         └─ Fetch profile: SELECT * FROM profiles WHERE id = auth.uid()
       │              │
       │              ├─ ⚠️ RLS BLOCKS HERE (PRODUCTION) ⚠️
       │              │
       │              └─ Profile loaded
       │                   │
       │                   ├─ role = 'super_admin' → SuperAdminDashboardPage
       │                   ├─ role = 'admin' → AdminDashboardPage
       │                   └─ role = 'client' → ClientDashboard (App.jsx default UI)
       │
       └─ Listings Fetch (role-based)
            ├─ super_admin: SELECT * FROM listings (all)
            ├─ admin: SELECT * FROM listings WHERE owner_id IN (managed_clients)
            └─ client: SELECT * FROM listings WHERE owner_id = auth.uid()
```

### Deliverable 3: Supabase Data Flow

```
Frontend Query
  │
  ▼
Supabase Client (JS SDK)
  │
  ▼
PostgREST API
  │
  ├─ Parse JWT token
  ├─ Extract auth.uid()
  │
  ▼
RLS Policy Evaluation
  │
  ├─ Check USING clause
  │    │
  │    └─ If policy calls SQL function
  │         │
  │         └─ ⚠️ Function queries same table
  │              │
  │              └─ RLS triggers again
  │                   │
  │                   └─ INFINITE RECURSION ⚠️
  │
  ▼
Execute Query (if RLS passes)
  │
  ▼
Return Results
```

### Deliverable 4: TV Pairing Flow

```
Dashboard: User creates TV device
  │
  ├─ Generate 6-digit OTP (A1B2C3)
  ├─ INSERT INTO tv_devices (listing_id, otp)
  ├─ Display OTP to user
  │
TV Display: /tv
  │
  ├─ User enters OTP: A1B2C3
  ├─ localStorage.setItem('tv_otp', 'A1B2C3')
  ├─ Call getConfig('A1B2C3')
  │    │
  │    └─ RPC: get_listing_config('A1B2C3')
  │         │
  │         └─ SELECT listing.*, guest.* FROM listings
  │              JOIN tv_devices ON tv_devices.listing_id = listings.id
  │              LEFT JOIN guests ON guest.listing_id = listings.id
  │              WHERE tv_devices.otp = 'A1B2C3'
  │              AND guests.check_in <= NOW()
  │              AND guests.check_out >= NOW()
  │
  ├─ Render Layout (layout1/2/3/4)
  ├─ Start ping interval (60s)
  │    └─ RPC: ping_tv_device('A1B2C3')
  │         └─ UPDATE tv_devices SET last_seen_at = NOW()
  │
  └─ Start weather refresh (30min)
       └─ getWeather(listing.weather_city)
```

### Deliverable 5: RLS Rules Audit

| Table | Policy Name | Roles | USING Clause | Status | Issue |
|-------|-------------|-------|--------------|--------|-------|
| profiles | `profiles_select_policy` | authenticated | `id = auth.uid() OR is_super_admin() OR (is_admin() AND managed_by = auth.uid())` | ❌ BROKEN | Calls `is_super_admin()` which queries profiles → recursion |
| profiles | `profiles_update_policy` | authenticated | Same as above | ❌ BROKEN | Same recursion issue |
| profiles | `profiles_insert_policy` | authenticated | `is_super_admin() OR is_admin()` | ❌ BROKEN | Same recursion issue |
| profiles | `profiles_delete_policy` | authenticated | `is_super_admin()` | ❌ BROKEN | Same recursion issue |
| listings | `listings_select_policy` | authenticated | `owner_id = auth.uid() OR is_super_admin() OR ...` | ❌ BROKEN | Calls `is_super_admin()` |
| listings | `listings_insert_policy` | authenticated | Similar | ❌ BROKEN | Same issue |
| listings | `listings_update_policy` | authenticated | Similar | ❌ BROKEN | Same issue |
| listings | `listings_delete_policy` | authenticated | Similar | ❌ BROKEN | Same issue |
| guests | `guests_select_policy` | authenticated | Similar | ❌ BROKEN | Same issue |

**Recommended Policies:**

| Table | Policy Name | Roles | USING Clause | Status |
|-------|-------------|-------|--------------|--------|
| profiles | `users_read_own_profile` | authenticated | `id = auth.uid()` | ✅ SIMPLE, NO RECURSION |
| profiles | `users_update_own_profile` | authenticated | `id = auth.uid()` | ✅ SAFE |
| profiles | `service_role_full_access` | service_role | `true` | ✅ ADMIN ACCESS VIA BACKEND |

### Deliverable 6: RPC Functions Audit

| Function | Purpose | Safe? | Issue | Fix |
|----------|---------|-------|-------|-----|
| `is_super_admin()` | Check if user is super admin | ❌ NO | Queries profiles table → RLS recursion | DELETE - check role client-side |
| `is_admin()` | Check if user is admin | ❌ NO | Same issue | DELETE - check role client-side |
| `get_my_role()` | Get current user's role | ❌ NO | Same issue | DELETE - use AuthContext |
| `get_my_client_ids()` | Get IDs of managed clients | ❌ NO | Same issue | DELETE - query from backend |
| `assign_client_to_admin()` | Assign client to admin | ⚠️ MAYBE | Uses `get_user_role()` | Rewrite without helper functions |
| `update_tv_device_status()` | Mark offline devices | ✅ YES | No RLS issues | Keep |
| `ping_tv_device()` | Update device last_seen | ✅ YES | No RLS issues | Keep |
| `get_listing_config()` | Get config for TV | ✅ YES | No RLS issues | Keep |
| `refresh_tv_otp()` | Generate new OTP | ✅ YES | No RLS issues (after adding) | Keep |

### Deliverable 7: Step-by-Step Production Stabilization Roadmap

#### Phase 1: Emergency Fixes (DO NOW - 1 hour)

1. **Fix RLS Policies** (30 min)
   - [ ] Open Supabase SQL Editor (production)
   - [ ] Run `/tmp/FIX_RLS_POLICIES_PRODUCTION.sql`
   - [ ] Verify with test query: `SELECT * FROM profiles WHERE id = auth.uid()`
   - [ ] Confirm returns 1 row

2. **Delete Broken Helper Functions** (10 min)
   - [ ] Run `DROP FUNCTION` statements for `is_super_admin()`, `is_admin()`, etc.
   - [ ] Verify no policies reference these functions

3. **Test Production Login** (20 min)
   - [ ] Open production app in incognito
   - [ ] Log in with super admin credentials
   - [ ] Verify profile loads
   - [ ] Verify dashboard appears

#### Phase 2: Code Cleanup (2-3 hours)

4. **Remove Duplicate Profile Fetch** (30 min)
   - [ ] Edit `src/App.jsx`
   - [ ] Remove lines 59-66 (duplicate profile fetch)
   - [ ] Use `authUserProfile` from AuthContext
   - [ ] Test locally
   - [ ] Deploy

5. **Add Timeout to Profile Fetch** (30 min)
   - [ ] Edit `src/contexts/AuthContext.jsx`
   - [ ] Add `Promise.race()` with 10s timeout
   - [ ] Add user-friendly error message
   - [ ] Test locally
   - [ ] Deploy

6. **Remove Console Logs** (15 min)
   - [ ] Edit `src/supabase.js` - remove logs
   - [ ] Search for `console.log` across project
   - [ ] Remove or replace with proper logging
   - [ ] Deploy

7. **Fix Real-time Subscriptions** (1 hour)
   - [ ] Edit subscription logic in `src/App.jsx`
   - [ ] Add role-based filters for admin/super_admin
   - [ ] Test with multiple roles
   - [ ] Deploy

#### Phase 3: Security Hardening (3-4 hours)

8. **Add OTP Expiration** (1 hour)
   - [ ] Create migration: `ALTER TABLE tv_devices ADD COLUMN otp_expires_at`
   - [ ] Create `refresh_tv_otp()` function
   - [ ] Update TV pairing UI to regenerate OTPs
   - [ ] Test TV pairing flow
   - [ ] Deploy

9. **Proxy Weather API** (2 hours)
   - [ ] Create Supabase Edge Function: `supabase/functions/weather/index.ts`
   - [ ] Move `OPENWEATHER_API_KEY` to Supabase secrets
   - [ ] Update `weatherService.js` to call Edge Function
   - [ ] Test weather display
   - [ ] Deploy

10. **Add Rate Limiting** (1 hour)
    - [ ] Configure Supabase rate limits (dashboard)
    - [ ] Add client-side throttling for frequent requests
    - [ ] Test under load

#### Phase 4: Performance Optimization (4-6 hours)

11. **Implement Code Splitting** (2 hours)
    - [ ] Add `React.lazy()` for dashboard pages
    - [ ] Add `Suspense` boundaries
    - [ ] Test bundle sizes
    - [ ] Deploy

12. **Add Error Boundaries** (1 hour)
    - [ ] Create `ErrorBoundary` component
    - [ ] Wrap page components
    - [ ] Test error scenarios
    - [ ] Deploy

13. **Create Query Hooks** (2 hours)
    - [ ] Create `hooks/useProfile.js`
    - [ ] Create `hooks/useListings.js`
    - [ ] Refactor components to use hooks
    - [ ] Test
    - [ ] Deploy

14. **Optimize Queries** (1 hour)
    - [ ] Add `select()` column filtering
    - [ ] Add pagination
    - [ ] Add caching
    - [ ] Deploy

#### Phase 5: Feature Completion (1-2 weeks)

15. **Complete PMS Integration** (3 days)
16. **Add Guidebooks CRUD** (2 days)
17. **Implement Payment Processing** (3 days)
18. **Add Analytics Dashboard** (2 days)

#### Phase 6: Monitoring & Maintenance (Ongoing)

19. **Set Up Monitoring**
    - [ ] Add error tracking (Sentry)
    - [ ] Set up performance monitoring
    - [ ] Create alerting for critical errors

20. **Regular Audits**
    - [ ] Weekly performance checks
    - [ ] Monthly security audits
    - [ ] Quarterly dependency updates

---

## CONCLUSION

The hostOps portal is a well-architected application with a solid foundation, but it's currently **broken in production due to recursive RLS policies**. The immediate priority is to:

1. ✅ **Replace RLS policies** (30 minutes)
2. ✅ **Delete broken helper functions** (10 minutes)
3. ✅ **Test login** (20 minutes)

Once these are done, the app will be functional. The remaining fixes are performance improvements and feature additions.

**Estimated Time to Production Stability:**
- Emergency fixes: 1 hour
- Code cleanup: 3 hours
- Security hardening: 4 hours
- **Total: 8 hours (1 working day)**

After this, the app will be production-ready and scalable.
