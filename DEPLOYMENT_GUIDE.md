# Production Deployment Guide

**HostOps Portal - Deploy to Vercel**

This guide walks you through deploying your HostOps Portal to production using Vercel (recommended) or alternative platforms.

---

## Why Vercel?

✅ **Best for React/Vite apps**
✅ **Free tier includes**:
- Unlimited deployments
- Automatic HTTPS
- Global CDN
- 100GB bandwidth/month
- Custom domains
- Automatic preview deployments

✅ **Zero configuration** for Vite projects
✅ **GitHub integration** for CI/CD

---

## Prerequisites

Before deploying, ensure you have:

- [ ] ✅ Phase 1 cleanup complete (migrations fixed, no conflicts)
- [ ] ✅ Supabase production database set up ([SUPABASE_PRODUCTION_SETUP.md](./SUPABASE_PRODUCTION_SETUP.md))
- [ ] ✅ Cloudinary account configured
- [ ] ✅ OpenWeatherMap API key obtained
- [ ] ✅ GitHub repository (public or private)
- [ ] ✅ Vercel account (free at [vercel.com](https://vercel.com))

---

## Part 1: Pre-Deployment Preparation

### Step 1.1: Verify Build Works Locally

```bash
cd /Users/massimodamico/hostops-portal

# Clean install dependencies
rm -rf node_modules package-lock.json
npm install

# Run production build
npm run build

# Test production build locally
npm run preview
```

**Expected output**:
```
✓ built in 2.5s
dist/index.html                   0.45 kB
dist/assets/index-abc123.css     12.34 kB
dist/assets/index-def456.js     234.56 kB

Local:   http://localhost:4173/
```

Visit `http://localhost:4173/` and verify:
- [ ] App loads without errors
- [ ] Login works
- [ ] Dashboard displays correctly
- [ ] Listings page works
- [ ] No console errors

### Step 1.2: Verify .gitignore

Ensure sensitive files are not committed:

```bash
# Check .gitignore contains
cat .gitignore
```

Must include:
```
.env
.env.local
.env.production
node_modules/
dist/
.DS_Store
*.log
```

### Step 1.3: Commit Latest Changes

```bash
# Check git status
git status

# Add and commit
git add .
git commit -m "Prepare for production deployment

- Fixed migration numbering
- Updated RBAC with working RLS policies
- Enhanced .env.example documentation
- All toggle features tested and working
- Production-ready configuration"

# Push to GitHub
git push origin main
```

---

## Part 2: Deploy to Vercel

### Step 2.1: Create Vercel Account

1. Go to https://vercel.com
2. Click "Sign Up"
3. Choose "Continue with GitHub" (recommended)
4. Authorize Vercel to access your repositories

### Step 2.2: Import Project

1. Click "+ New Project" on Vercel dashboard
2. Find your repository: `hostops-portal`
3. Click "Import"

### Step 2.3: Configure Project

**Framework Preset**: Vite (auto-detected) ✅

**Build Settings**:
- Build Command: `npm run build` (auto-filled)
- Output Directory: `dist` (auto-filled)
- Install Command: `npm install` (auto-filled)

**Root Directory**: `.` (leave as default)

Click "Deploy" to start first deployment.

⚠️ **This first deploy will FAIL** because environment variables are not set yet. That's expected!

### Step 2.4: Add Environment Variables

1. After the failed deployment, click "Project Settings"
2. Click "Environment Variables" in sidebar
3. Add each variable:

**Add these variables one by one:**

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `VITE_SUPABASE_URL` | Your production Supabase URL | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | Your production anon key | Production, Preview, Development |
| `VITE_OPENWEATHER_API_KEY` | Your weather API key | Production, Preview, Development |
| `VITE_CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name | Production, Preview, Development |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | Your upload preset | Production, Preview, Development |
| `VITE_DEVICE_TOKEN` | Generate new token for prod | Production, Preview, Development |

**How to add each variable:**
1. Click "Add New"
2. Enter variable name (e.g., `VITE_SUPABASE_URL`)
3. Enter value
4. Select all three checkboxes: Production, Preview, Development
5. Click "Save"

**Generate new device token**:
```bash
openssl rand -hex 32
```

### Step 2.5: Redeploy

1. Go to "Deployments" tab
2. Click "..." on failed deployment
3. Click "Redeploy"
4. Check "Use existing Build Cache"
5. Click "Redeploy"

Wait 1-2 minutes for build to complete.

### Step 2.6: Verify Deployment

1. When build succeeds, click "Visit" button
2. Your app should now be live at: `https://your-project-name.vercel.app`

**Test the deployment:**
- [ ] App loads without errors
- [ ] Can sign up for new account
- [ ] Can log in
- [ ] Dashboard loads with correct data
- [ ] Can create/edit listings
- [ ] Weather displays correctly
- [ ] Image uploads work (Cloudinary)
- [ ] TV layouts render correctly

---

## Part 3: Custom Domain Setup (Optional)

### Step 3.1: Add Custom Domain

1. Go to Project Settings → Domains
2. Enter your domain: `yourdomain.com`
3. Click "Add"

### Step 3.2: Configure DNS

Vercel will show you DNS records to add:

**For root domain (yourdomain.com)**:
```
Type: A
Name: @
Value: 76.76.21.21
```

**For www subdomain**:
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### Step 3.3: Wait for DNS Propagation

- Usually takes 5-60 minutes
- Vercel will automatically provision SSL certificate
- Your app will be live at `https://yourdomain.com`

---

## Part 4: Production Optimizations

### Step 4.1: Enable Analytics (Free)

1. Go to Project Settings → Analytics
2. Enable "Vercel Analytics"
3. Install analytics package:

```bash
npm install @vercel/analytics
```

Add to `src/main.jsx`:
```javascript
import { inject } from '@vercel/analytics';

// ... existing code ...

inject(); // Add this line
```

Commit and push - will auto-deploy.

### Step 4.2: Configure Security Headers

1. Create `vercel.json` in project root:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

2. Commit and push:
```bash
git add vercel.json
git commit -m "Add security headers"
git push
```

### Step 4.3: Enable Automatic Git Integration

Already enabled by default! Every push to `main` automatically deploys to production.

**Branch deployments**:
- Push to any branch creates preview deployment
- Get unique URL for testing
- Perfect for feature development

---

## Part 5: Monitoring and Maintenance

### Step 5.1: Monitor Deployments

1. Go to Vercel dashboard → Deployments
2. See real-time build status
3. View deployment logs
4. Check build times

### Step 5.2: Set Up Vercel Notifications

1. Go to Project Settings → Notifications
2. Enable:
   - Deployment succeeded
   - Deployment failed
   - Deployment ready (for previews)

3. Connect to:
   - Email
   - Slack (optional)
   - Discord (optional)

### Step 5.3: Monitor Performance

1. Go to Analytics (if enabled)
2. Track:
   - Page views
   - User sessions
   - Core Web Vitals
   - Top pages

### Step 5.4: Check Error Logs

1. Go to Project → Runtime Logs
2. View errors and warnings
3. Filter by deployment or timeframe

---

## Part 6: Rollback and Recovery

### Rollback to Previous Version

If something goes wrong:

1. Go to Deployments tab
2. Find last working deployment
3. Click "..." → "Promote to Production"
4. Confirm

Your app instantly rolls back!

### Instant Rollback (Alternative)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# List deployments
vercel list

# Promote specific deployment
vercel promote <deployment-url>
```

---

## Alternative Platforms

### Option B: Netlify

**Pros**: Similar to Vercel, great for static sites
**Free Tier**: 100GB bandwidth, 300 build minutes

**Quick Deploy**:
1. Go to https://netlify.com
2. "Add new site" → "Import from Git"
3. Choose repository
4. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Add environment variables
6. Deploy!

### Option C: AWS Amplify

**Pros**: Part of AWS ecosystem, good for enterprise
**Pricing**: Pay per request

**Quick Deploy**:
1. Go to AWS Amplify console
2. "New app" → "Host web app"
3. Connect GitHub repository
4. Build settings: Same as Vercel
5. Add environment variables
6. Deploy!

### Option D: GitHub Pages

**Pros**: Free, simple
**Cons**: No server-side features, requires custom config

**Not recommended** for this app (needs SPA routing support).

---

## Troubleshooting

### Build Fails: "Module not found"

**Solution**: Missing dependency
```bash
# Locally, check if app builds
npm run build

# If successful, check package.json is committed
git status
git add package.json package-lock.json
git commit -m "Update dependencies"
git push
```

### Build Fails: "Out of memory"

**Solution**: Increase Node memory (rare with Vite)
```bash
# Add to package.json scripts
"build": "NODE_OPTIONS='--max-old-space-size=4096' vite build"
```

### App Loads but Shows "Failed to fetch"

**Possible causes**:
1. Environment variables not set correctly
2. Supabase URL incorrect
3. CORS issues

**Check**:
1. Vercel → Settings → Environment Variables
2. Verify all variables are set for "Production"
3. Check browser console for specific errors

### Images Not Loading

**Check**:
1. Cloudinary credentials correct?
2. Upload preset is "unsigned"?
3. CORS allowed for your domain?

**Fix**: Go to Cloudinary → Settings → Security → Allowed fetch domains
- Add: `*.vercel.app`
- Add: `yourdomain.com` (if using custom domain)

### Weather Not Showing

**Check**:
1. OpenWeatherMap API key valid?
2. Key activated? (takes ~10 min after signup)
3. Free tier limit reached? (1000 calls/day)

**Test**: Visit in browser:
```
https://api.openweathermap.org/data/2.5/weather?q=London&appid=YOUR_API_KEY
```

---

## Performance Checklist

Before marking deployment complete:

### Page Load Performance
- [ ] Initial load < 3 seconds
- [ ] Largest Contentful Paint (LCP) < 2.5s
- [ ] First Input Delay (FID) < 100ms
- [ ] Cumulative Layout Shift (CLS) < 0.1

**Check with**:
- Chrome DevTools → Lighthouse
- https://pagespeed.web.dev/
- Vercel Analytics → Web Vitals

### Image Optimization
- [ ] Images served from Cloudinary CDN
- [ ] WebP format enabled
- [ ] Responsive image sizes
- [ ] Lazy loading enabled

### Asset Optimization
- [ ] CSS minified (Vite does this)
- [ ] JS minified (Vite does this)
- [ ] Gzip/Brotli compression (Vercel does this)
- [ ] Static assets cached

### API Performance
- [ ] Supabase queries optimized
- [ ] RLS policies efficient
- [ ] Database indexes in place (from migrations)
- [ ] No N+1 query problems

---

## Security Checklist

### Pre-Production
- [ ] `.env` NOT committed to git
- [ ] Service role key NOT in frontend
- [ ] HTTPS enforced (Vercel automatic)
- [ ] Security headers configured
- [ ] CORS configured correctly

### Supabase Security
- [ ] RLS enabled on all tables
- [ ] RLS policies tested
- [ ] Email confirmation enabled
- [ ] Strong password requirements
- [ ] Rate limiting configured

### Monitoring
- [ ] Error tracking set up
- [ ] Uptime monitoring (optional)
- [ ] Log aggregation (optional)
- [ ] Performance monitoring enabled

---

## Post-Deployment Tasks

### Immediate (Day 1)
1. ✅ Verify deployment successful
2. ✅ Test all features in production
3. ✅ Create first super admin user
4. ✅ Monitor errors for first few hours
5. ✅ Share app URL with stakeholders

### Week 1
1. Monitor usage patterns
2. Check API quota (OpenWeather, Cloudinary)
3. Review Vercel analytics
4. Gather user feedback
5. Fix any reported bugs

### Ongoing
1. Weekly: Check error logs
2. Monthly: Review API usage and costs
3. Quarterly: Update dependencies
4. As needed: Deploy new features

---

## Costs Estimate

### Free Tier (Perfectly viable for small-medium apps)

| Service | Free Tier | Cost if Exceeded |
|---------|-----------|------------------|
| **Vercel** | 100GB bandwidth/mo | $20/mo (Pro) |
| **Supabase** | 500MB database, 2GB transfer | $25/mo (Pro) |
| **Cloudinary** | 25GB storage + bandwidth | $99/mo (Plus) |
| **OpenWeather** | 1000 calls/day | $40/mo (Startup) |

**Total for free tier**: $0/month ✅
**Total if all paid**: ~$184/month

**Most apps stay on free tier indefinitely!**

---

## Success Criteria

Your deployment is successful when:

- ✅ App accessible at public URL
- ✅ HTTPS certificate active (green padlock)
- ✅ All features working in production
- ✅ No console errors
- ✅ Can create users and log in
- ✅ Database operations work
- ✅ File uploads work
- ✅ Weather API responds
- ✅ TV layouts render correctly
- ✅ Mobile responsive
- ✅ Fast page loads (< 3s)

---

## Next Steps After Deployment

1. **Share with Users**
   - Send access link
   - Create demo accounts
   - Provide user documentation

2. **Set Up Monitoring**
   - Enable Vercel Analytics
   - Monitor Supabase usage
   - Track API quotas

3. **Plan Updates**
   - Gather user feedback
   - Prioritize new features
   - Schedule regular updates

4. **Consider Enhancements**
   - Multi-tenant admin dashboard
   - Advanced analytics
   - Mobile app (React Native)
   - TV device management UI

---

## Support and Resources

### Vercel
- Docs: https://vercel.com/docs
- Community: https://github.com/vercel/vercel/discussions
- Twitter: @vercel

### Deployment Help
- Vercel Support: support@vercel.com (Pro plan)
- Community Discord: https://vercel.com/discord

### HostOps Portal
- Your repo issues: GitHub Issues
- Documentation: Project README

---

**Deployment Status**: Ready to Deploy ✅

**Estimated Time**: 30-60 minutes for first deployment
**Difficulty**: Easy (Vercel handles most complexity)

**Good luck with your launch! 🚀**
