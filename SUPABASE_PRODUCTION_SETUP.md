# Supabase Production Setup Guide

**HostOps Portal - Complete Database Deployment**

This guide walks you through setting up a production Supabase database for your HostOps Portal application.

---

## Prerequisites

- [ ] Supabase account (free tier available at [supabase.com](https://supabase.com))
- [ ] Git repository cloned locally
- [ ] All 9 migration files ready in `supabase/migrations/`

---

## Step 1: Create Production Supabase Project

### 1.1 Sign Up / Log In
1. Go to https://supabase.com
2. Click "Start your project"
3. Sign in with GitHub, Google, or email

### 1.2 Create New Project
1. Click "+ New Project"
2. Fill in project details:
   - **Name**: `hostops-portal-prod` (or your preferred name)
   - **Database Password**: Generate strong password (SAVE THIS!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free (or Pro for production)

3. Click "Create new project"
4. Wait 2-3 minutes for provisioning

### 1.3 Get API Credentials
1. Go to **Project Settings** (gear icon in sidebar)
2. Click **API** in left menu
3. Copy and save these values:
   ```
   Project URL: https://[your-project-ref].supabase.co
   anon/public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (keep secret!)
   ```

---

## Step 2: Run Database Migrations

You have two options for running migrations:

### Option A: Supabase Dashboard SQL Editor (Recommended for first-time)

#### 2.1 Open SQL Editor
1. In your Supabase dashboard, click **SQL Editor** in sidebar
2. Click "+ New query"

#### 2.2 Run Migrations in Order

**Migration 1: Initial Schema**
1. Open `/supabase/migrations/001_initial_schema.sql` locally
2. Copy entire contents
3. Paste into SQL Editor
4. Click "Run" (bottom right)
5. Verify success: Should see "Success. No rows returned"

**Migration 2: Seed Data**
1. Open `/supabase/migrations/002_seed_data.sql`
2. Copy entire contents
3. Paste into SQL Editor
4. Click "Run"
5. Verify success: Check "Table Editor" → profiles table should have 3 sample users

**Migration 3-9: Feature Migrations**
Repeat the same process for each migration in order:
- `003_tv_pairing_function.sql`
- `004_fix_tv_devices_columns.sql`
- `005_auto_offline_tv_devices.sql`
- `006_pms_connections.sql`
- `007_activity_log.sql`
- `008_user_settings.sql`
- `009_add_roles_and_rbac.sql` ⭐ **Critical for RBAC**

### Option B: Supabase CLI (Faster for experienced users)

#### 2.1 Install Supabase CLI
```bash
# macOS
brew install supabase/tap/supabase

# Windows (Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Linux
brew install supabase/tap/supabase
```

#### 2.2 Link to Project
```bash
cd /Users/massimodamico/hostops-portal
supabase login
supabase link --project-ref your-project-ref
```

#### 2.3 Push Migrations
```bash
supabase db push
```

This automatically runs all migrations in order!

---

## Step 3: Verify Database Setup

### 3.1 Check Tables Created
1. Go to **Table Editor** in Supabase dashboard
2. You should see these 9 tables:
   - ✅ profiles
   - ✅ listings
   - ✅ guests
   - ✅ tv_devices
   - ✅ qr_codes
   - ✅ pms_connections
   - ✅ user_settings
   - ✅ activity_log
   - ✅ monetization_stats (future use)

### 3.2 Verify RLS Policies
1. Go to **Authentication** → **Policies**
2. Verify RLS policies exist for:
   - **profiles**: 4 policies (select, update, insert, delete)
   - **listings**: 4 policies (select, update, insert, delete)
   - **guests**: 4 policies (select, update, insert, delete)

### 3.3 Check Database Functions
1. Go to **Database** → **Functions**
2. Verify these functions exist:
   - ✅ `get_my_role()`
   - ✅ `is_super_admin()`
   - ✅ `is_admin()`
   - ✅ `get_my_client_ids()`
   - ✅ `get_user_role(user_id)`
   - ✅ `is_admin_of_client(admin_id, client_id)`
   - ✅ `assign_client_to_admin(client_id, admin_id)`
   - ✅ `pair_tv_device(...)`
   - ✅ `update_tv_last_seen(device_id)`

### 3.4 Test Seed Data
1. Go to **Table Editor** → **profiles**
2. You should see 3 sample users:
   - Alice Johnson (client)
   - Bob Smith (client)
   - Admin User (admin)

3. Go to **listings** table
4. You should see 3 sample listings

---

## Step 4: Enable Row Level Security (RLS)

RLS should already be enabled by migration 009, but verify:

### 4.1 Check RLS Status
1. Go to **Table Editor**
2. For each table (profiles, listings, guests), click table name
3. Click "..." menu → "Edit table"
4. Verify "Enable Row Level Security (RLS)" is **checked**

### 4.2 Test RLS Policies

**Create a test user:**
1. Go to **Authentication** → **Users**
2. Click "Add user" → "Create new user"
3. Enter email and password
4. Click "Create user"

**Test access:**
1. Use this user's credentials to log into your app
2. Verify they can only see their own data
3. Verify they cannot access other users' listings

---

## Step 5: Configure Authentication

### 5.1 Email Authentication (Enabled by default)
1. Go to **Authentication** → **Providers**
2. Verify "Email" is enabled
3. Configure email templates (optional):
   - Go to **Authentication** → **Email Templates**
   - Customize "Confirm signup" and "Magic Link" emails

### 5.2 OAuth Providers (Optional)
Enable social login:
1. Go to **Authentication** → **Providers**
2. Enable desired providers (Google, GitHub, etc.)
3. Follow provider-specific setup instructions
4. Add redirect URLs: `https://your-domain.com/**`

### 5.3 Email Confirmation
Decide if you want email confirmation:
- **Development**: Disable for easier testing
  - Go to **Authentication** → **Settings**
  - Uncheck "Enable email confirmations"

- **Production**: Enable for security
  - Keep "Enable email confirmations" checked
  - Users must verify email before logging in

---

## Step 6: Set Up Database Backups (Recommended for Production)

### 6.1 Enable Point-in-Time Recovery (Pro Plan)
1. Go to **Database** → **Backups**
2. Enable PITR if on Pro plan
3. Configure retention period (7-30 days)

### 6.2 Manual Backups (Free Tier)
Free tier includes daily backups for 7 days:
1. Go to **Database** → **Backups**
2. View backup schedule
3. You can trigger manual backup: Click "Backup now"

### 6.3 Export Database (Additional Safety)
1. Go to **Database** → **Backups**
2. Click "Export" to download SQL dump
3. Store securely (encrypted storage recommended)

---

## Step 7: Security Configuration

### 7.1 Enable SSL Enforcement
1. Go to **Project Settings** → **Database**
2. Verify "Enforce SSL" is enabled
3. Download SSL certificate if needed

### 7.2 Configure API Rate Limits
1. Go to **Project Settings** → **API**
2. Review rate limits:
   - Free tier: 100 req/sec
   - Pro tier: 200 req/sec
3. Enable rate limiting if needed

### 7.3 Set Up Database Roles
Roles are created by migrations, but verify:
1. Go to **Database** → **Roles**
2. Verify `authenticator`, `anon`, `service_role` exist

### 7.4 Secrets Management
**CRITICAL**: Never expose these:
- ❌ Database password
- ❌ service_role key
- ❌ JWT secret

**Safe to expose** (in frontend):
- ✅ Project URL
- ✅ anon/public key

---

## Step 8: Monitoring and Alerts

### 8.1 Enable Logs
1. Go to **Logs** in sidebar
2. Review available logs:
   - API logs
   - Database logs
   - Auth logs

### 8.2 Set Up Alerts (Pro Plan)
1. Go to **Project Settings** → **Alerts**
2. Configure alerts for:
   - High database CPU usage
   - High API error rate
   - Storage limits approaching

### 8.3 Monitor Usage
1. Go to **Project Settings** → **Usage**
2. Monitor:
   - Database size (Free: 500MB, Pro: 8GB)
   - API requests (Free: 100 req/sec)
   - Bandwidth (Free: 2GB/month)

---

## Step 9: Create First Super Admin User

### 9.1 Sign Up First User
1. Run your app locally or in production
2. Sign up with your admin email
3. This creates a profile with default role 'client'

### 9.2 Promote to Super Admin
1. Go to **Table Editor** → **profiles**
2. Find your user by email
3. Click the row to edit
4. Change `role` field from `'client'` to `'super_admin'`
5. Save changes

### 9.3 Verify Super Admin Access
1. Log out and log back in to your app
2. You should now have full system access
3. You can now create admin and client users through the app

---

## Step 10: Production Checklist

Before going live, verify:

### Database
- [ ] All 9 migrations run successfully
- [ ] 9 tables created (profiles, listings, guests, etc.)
- [ ] RLS enabled on all tables
- [ ] Database functions created
- [ ] Seed data removed (or replaced with real data)

### Security
- [ ] RLS policies tested and working
- [ ] SSL enforcement enabled
- [ ] Service role key kept secret
- [ ] Database password stored securely
- [ ] Email confirmation enabled (production)

### Backup & Monitoring
- [ ] Daily backups enabled
- [ ] Manual backup taken
- [ ] Logs reviewed
- [ ] Usage monitoring set up

### Access Control
- [ ] Super admin user created
- [ ] Test user accounts created
- [ ] Role-based access tested
- [ ] Multi-tenant isolation verified

### Performance
- [ ] Indexes created (by migrations)
- [ ] Query performance tested
- [ ] Connection pooling configured (if needed)

---

## Troubleshooting

### Issue: "relation does not exist" error
**Solution**: Migration failed or ran out of order
```sql
-- Check which tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';

-- Re-run missing migrations in order
```

### Issue: "infinite recursion detected" in RLS
**Solution**: Make sure you ran migration 009 (RBAC with functions)
- The old recursive policies cause this
- Migration 009 replaces them with SECURITY DEFINER functions

### Issue: Cannot log in / Access denied
**Possible causes**:
1. Email confirmation required (check Authentication → Settings)
2. RLS policies too restrictive
3. User role not set correctly

**Debug**:
```sql
-- Check user exists
SELECT id, email, role FROM profiles WHERE email = 'your@email.com';

-- Temporarily disable RLS for testing (NEVER in production!)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
```

### Issue: Migrations won't run
**Solutions**:
1. Check for syntax errors in SQL
2. Verify you're running in correct order (001, 002, 003...)
3. Check migration history:
   ```sql
   SELECT * FROM supabase_migrations.schema_migrations;
   ```

### Issue: 500 errors in production
**Check**:
1. RLS policies (most common cause)
2. Database logs: **Logs** → **Postgres Logs**
3. API logs: **Logs** → **API Logs**

---

## Environment Variables

After setup, add these to your `.env`:

```bash
# Production Supabase
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Keep these SECRET (never in frontend):
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
# DATABASE_PASSWORD=your_db_password
```

---

## Next Steps

✅ Supabase setup complete!

**Now you can**:
1. Deploy your frontend to Vercel/Netlify
2. Point your app to production Supabase
3. Create real user accounts
4. Start using the app in production

**See also**:
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Deploy frontend to Vercel
- [.env.example](./.env.example) - Environment variables reference
- [RBAC_GUIDE.md](./RBAC_GUIDE.md) - Multi-tenant access control

---

## Support Resources

- **Supabase Docs**: https://supabase.com/docs
- **Supabase Discord**: https://discord.supabase.com
- **Stack Overflow**: Tag `supabase`
- **GitHub Issues**: https://github.com/supabase/supabase/issues

---

**Setup Status**: Ready for Production ✅
