# Quick Deploy Guide - HostOps Portal

**Fast-track deployment to production in 3 steps**

---

## ✅ Step 1: Production Supabase (30 min)

### 1.1 Create Supabase Project
1. Go to https://supabase.com
2. Sign in / Create account
3. Click "+ New Project"
4. Fill in:
   - **Name**: `hostops-portal-prod`
   - **Password**: (generate strong password - SAVE IT!)
   - **Region**: Choose closest to you
5. Click "Create new project"
6. Wait 2-3 minutes ⏰

### 1.2 Get API Credentials
1. Go to **Project Settings** (gear icon) → **API**
2. Copy and save:
   ```
   Project URL: ___________________________________
   anon public key: _______________________________
   ```

### 1.3 Run Migrations
**Option A: SQL Editor (Easiest)**

For each file in `supabase/migrations/` (in order):

1. Open file locally
2. Copy entire contents
3. In Supabase dashboard → **SQL Editor**
4. Click "+ New query"
5. Paste SQL
6. Click "Run"
7. Verify "Success. No rows returned"

**Files to run (IN THIS ORDER)**:
- ✅ `001_initial_schema.sql`
- ✅ `002_seed_data.sql`
- ✅ `003_tv_pairing_function.sql`
- ✅ `004_fix_tv_devices_columns.sql`
- ✅ `005_auto_offline_tv_devices.sql`
- ✅ `006_pms_connections.sql`
- ✅ `007_activity_log.sql`
- ✅ `008_user_settings.sql`
- ✅ `009_add_roles_and_rbac.sql` ⭐ **Critical!**

**Option B: Supabase CLI (Faster if you have CLI)**
```bash
supabase login
supabase link --project-ref your-project-ref
supabase db push
```

### 1.4 Verify Setup
1. Go to **Table Editor**
2. Verify 9 tables exist:
   - profiles
   - listings
   - guests
   - tv_devices
   - qr_codes
   - pms_connections
   - user_settings
   - activity_log
   - monetization_stats

**✅ Supabase Ready!**

---

## ✅ Step 2: Deploy to Vercel (20 min)

### 2.1 Create Vercel Account
1. Go to https://vercel.com
2. Click "Sign Up"
3. Choose "Continue with GitHub" (recommended)
4. Authorize Vercel

### 2.2 Import Project
1. Click "+ New Project"
2. Find `hostops-portal` repository
3. Click "Import"
4. Build settings (auto-detected):
   - Framework: Vite ✅
   - Build Command: `npm run build` ✅
   - Output Directory: `dist` ✅
5. **Don't deploy yet!** (will fail without env vars)

### 2.3 Add Environment Variables

Click "Environment Variables" → Add these:

| Variable | Value | Where to Get |
|----------|-------|--------------|
| `VITE_SUPABASE_URL` | Your production URL | From Step 1.2 |
| `VITE_SUPABASE_ANON_KEY` | Your anon key | From Step 1.2 |
| `VITE_OPENWEATHER_API_KEY` | Your weather key | From current .env |
| `VITE_CLOUDINARY_CLOUD_NAME` | Your cloud name | From current .env |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | Your preset | From current .env |
| `VITE_DEVICE_TOKEN` | **NEW TOKEN** | Generate below |

**Generate production device token**:
```bash
openssl rand -hex 32
```

**For each variable**:
1. Click "Add New"
2. Enter name (e.g., `VITE_SUPABASE_URL`)
3. Enter value
4. Check all: Production, Preview, Development
5. Click "Save"

### 2.4 Deploy!
1. Click "Deploy"
2. Wait 1-2 minutes for build
3. Build will complete successfully ✅
4. Click "Visit" to see your live site!

**🎉 Your app is now live at**: `https://your-project.vercel.app`

---

## ✅ Step 3: Test & Create Admin (10 min)

### 3.1 Test Production App
Visit your Vercel URL and verify:
- [ ] App loads without errors
- [ ] Can sign up for new account
- [ ] Can log in
- [ ] Dashboard displays
- [ ] Can create a listing
- [ ] Images upload (Cloudinary)
- [ ] Weather displays

### 3.2 Create Super Admin User
1. Sign up with your admin email in the production app
2. Go to Supabase → **Table Editor** → **profiles**
3. Find your user by email
4. Click the row to edit
5. Change `role` from `'client'` to `'super_admin'`
6. Save
7. Log out and log back in
8. You now have full admin access! ✅

---

## 🎉 You're Live!

**Your production app is now deployed at**:
```
https://your-project.vercel.app
```

### What happens now:
- ✅ Every push to `main` branch auto-deploys
- ✅ Pull requests get preview deployments
- ✅ Automatic HTTPS with SSL certificate
- ✅ Global CDN for fast loading worldwide
- ✅ Automatic image optimization

---

## Next Steps

### Immediate
- [ ] Share app URL with users
- [ ] Monitor first few hours for errors
- [ ] Create additional admin/client users as needed

### This Week
- [ ] Monitor Vercel deployment logs
- [ ] Check Supabase usage dashboard
- [ ] Gather user feedback
- [ ] Fix any reported issues

### Optional Enhancements
- [ ] Add custom domain
- [ ] Enable Vercel Analytics
- [ ] Set up monitoring alerts
- [ ] Build multi-tenant admin dashboard

---

## Troubleshooting

### Build fails in Vercel
**Check**: Environment variables set correctly?
**Fix**: Vercel Settings → Environment Variables → Verify all 6 vars

### "Failed to fetch" errors
**Check**: Supabase URL correct? RLS policies enabled?
**Fix**: Verify VITE_SUPABASE_URL matches your project

### Images won't upload
**Check**: Cloudinary credentials correct?
**Fix**: Verify cloud name and upload preset

### Weather not showing
**Check**: API key activated? (takes 10 min after signup)
**Fix**: Wait or generate new key at openweathermap.org

---

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Detailed Guide**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **Checklist**: [PRE_DEPLOYMENT_CHECKLIST.md](./PRE_DEPLOYMENT_CHECKLIST.md)

---

**Estimated Total Time**: 60 minutes
**Difficulty**: Easy (mostly copy/paste)
**Cost**: $0 (all free tiers)

**Good luck! 🚀**
