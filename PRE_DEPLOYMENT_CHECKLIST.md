# Pre-Deployment Checklist

**HostOps Portal - Production Readiness Verification**

Use this checklist before deploying to production to ensure everything is configured correctly and your app is ready for real users.

---

## 📋 Quick Status

- **Project**: HostOps Portal
- **Target Platform**: Vercel (or Netlify/AWS Amplify)
- **Database**: Supabase PostgreSQL
- **Date**: ________
- **Deployment URL**: ________

---

## Phase 1: Code Quality & Cleanup ✅

### Migration Files
- [ ] All migrations numbered sequentially (001-009)
- [ ] No duplicate migration files
- [ ] `009_add_roles_and_rbac.sql` uses SECURITY DEFINER functions (not recursive subqueries)
- [ ] All migration files tested locally

**Status**: ✅ COMPLETE (from Phase 1 cleanup)

### Git Repository
- [ ] All changes committed
- [ ] `.env` file in `.gitignore`
- [ ] No sensitive data in git history
- [ ] Pushed to GitHub/GitLab
- [ ] Repository accessible to deployment platform

### Dependencies
- [ ] `package.json` up to date
- [ ] `package-lock.json` committed
- [ ] No security vulnerabilities (`npm audit`)
- [ ] All dependencies compatible with production

**Check dependencies**:
```bash
npm audit
npm outdated
```

---

## Phase 2: Environment Configuration

### Local Environment
- [ ] `.env` file exists and populated
- [ ] `.env.example` documented with all variables
- [ ] App runs locally without errors (`npm run dev`)
- [ ] Production build works (`npm run build`)
- [ ] Preview build works (`npm run preview`)

### Environment Variables Required
- [ ] `VITE_SUPABASE_URL` - Production Supabase URL
- [ ] `VITE_SUPABASE_ANON_KEY` - Production anon key
- [ ] `VITE_OPENWEATHER_API_KEY` - Weather API key
- [ ] `VITE_CLOUDINARY_CLOUD_NAME` - Cloud name
- [ ] `VITE_CLOUDINARY_UPLOAD_PRESET` - Upload preset
- [ ] `VITE_DEVICE_TOKEN` - Unique production token

**Generate production device token**:
```bash
openssl rand -hex 32
```

---

## Phase 3: Supabase Production Database

### Project Setup
- [ ] Production Supabase project created
- [ ] Project URL and anon key saved securely
- [ ] Database password stored safely
- [ ] Service role key stored safely (DO NOT expose in frontend!)

### Migrations Executed
- [ ] `001_initial_schema.sql` - Base schema
- [ ] `002_seed_data.sql` - Seed data (or removed for production)
- [ ] `003_tv_pairing_function.sql` - TV pairing
- [ ] `004_fix_tv_devices_columns.sql` - TV schema fix
- [ ] `005_auto_offline_tv_devices.sql` - Auto-offline
- [ ] `006_pms_connections.sql` - PMS integration
- [ ] `007_activity_log.sql` - Activity logging
- [ ] `008_user_settings.sql` - User settings
- [ ] `009_add_roles_and_rbac.sql` - RBAC with functions

### Database Verification
- [ ] All 9 tables created successfully
- [ ] RLS enabled on `profiles`, `listings`, `guests`
- [ ] All RLS policies created (12 total: 4 per table)
- [ ] Database functions created (7 total)
- [ ] Indexes created (from migrations)
- [ ] Triggers created (from migrations)

**Verify tables exist**:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Expected tables**:
1. profiles
2. listings
3. guests
4. tv_devices
5. qr_codes
6. pms_connections
7. user_settings
8. activity_log
9. monetization_stats

### Security Configuration
- [ ] Row Level Security (RLS) enabled
- [ ] RLS policies tested with test users
- [ ] Email confirmation enabled (production)
- [ ] Password strength requirements configured
- [ ] SSL enforcement enabled
- [ ] Rate limiting configured

### Backup & Recovery
- [ ] Daily backups enabled
- [ ] Manual backup taken before launch
- [ ] Backup retention policy set (7-30 days)
- [ ] Recovery plan documented

---

## Phase 4: External Services

### OpenWeatherMap API
- [ ] Account created
- [ ] API key generated
- [ ] Email verified
- [ ] API key activated (wait 10 minutes after signup)
- [ ] Free tier quota understood (1000 calls/day)

**Test API key**:
```bash
curl "https://api.openweathermap.org/data/2.5/weather?q=London&appid=YOUR_API_KEY"
```

### Cloudinary CDN
- [ ] Account created
- [ ] Cloud name copied
- [ ] Upload preset created
- [ ] Upload preset set to "Unsigned"
- [ ] Folder structure configured (optional: `hostops/backgrounds`, `hostops/carousel`, `hostops/logos`)
- [ ] Free tier quota understood (25GB storage + bandwidth/month)

**Test upload**:
- Go to Cloudinary dashboard → Media Library
- Try manual upload
- Verify images appear

---

## Phase 5: Application Testing

### Functional Testing (Local)
- [ ] User registration works
- [ ] Email login works
- [ ] Password reset works (if enabled)
- [ ] Dashboard loads with correct stats
- [ ] Can create new listings
- [ ] Can edit existing listings
- [ ] Can delete listings
- [ ] Guest management works
- [ ] Image uploads work (Cloudinary)
- [ ] Weather displays correctly
- [ ] TV layouts render correctly
- [ ] QR codes generate correctly
- [ ] Toggle features work (all 8 toggles)

### Toggle Features Testing
- [ ] Welcome Message toggle
- [ ] Weather Settings toggle
- [ ] Branding/Logo toggle
- [ ] Check-in/Check-out toggle
- [ ] Hours of Operation toggle
- [ ] WiFi Details toggle
- [ ] Contact Information toggle
- [ ] QR Codes toggle

**Reference**: See [END_TO_END_TEST_RESULTS.md](./END_TO_END_TEST_RESULTS.md)

### RBAC Testing
- [ ] Client users see only their own data
- [ ] Admin users see assigned clients' data
- [ ] Super admin sees all data
- [ ] Role permissions enforced by database (not just UI)
- [ ] Cannot escalate privileges

**Test scenarios**:
1. Create client user → verify can only see own listings
2. Create admin user → verify can see assigned clients
3. Create super admin → verify full access

### Performance Testing
- [ ] Initial page load < 3 seconds
- [ ] Dashboard loads quickly (< 1 second)
- [ ] Listings page loads quickly
- [ ] Image uploads complete in reasonable time
- [ ] No memory leaks (check DevTools)
- [ ] No console errors or warnings

### Mobile Testing
- [ ] Responsive design works on mobile
- [ ] Touch interactions work
- [ ] Forms usable on mobile
- [ ] Images scale properly
- [ ] Navigation works on small screens

---

## Phase 6: Security Audit

### Code Security
- [ ] No hardcoded secrets in code
- [ ] No API keys in client-side code (except public keys)
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] Input validation on all forms
- [ ] CSRF protection (Supabase handles this)

### Authentication Security
- [ ] Passwords hashed (Supabase handles this)
- [ ] Session tokens secure
- [ ] Logout works correctly
- [ ] Password requirements enforced
- [ ] Email confirmation required (production)

### Data Security
- [ ] RLS policies prevent data leaks
- [ ] Multi-tenant isolation verified
- [ ] Admin cannot access other admin's clients
- [ ] Clients cannot access other clients' data
- [ ] Sensitive data not exposed in API responses

### Network Security
- [ ] HTTPS enforced (Vercel automatic)
- [ ] Security headers configured
- [ ] CORS configured correctly
- [ ] No mixed content warnings

---

## Phase 7: Deployment Platform Setup

### Vercel (Recommended)
- [ ] Vercel account created
- [ ] GitHub connected to Vercel
- [ ] Repository imported to Vercel
- [ ] All environment variables added
- [ ] Environment variables set for Production, Preview, Development
- [ ] Build settings configured (auto-detected for Vite)

### Build Configuration
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist`
- [ ] Install command: `npm install`
- [ ] Node version: 18.x or higher (auto-detected)

### Domain Configuration (Optional)
- [ ] Custom domain purchased
- [ ] DNS records configured
- [ ] SSL certificate issued (Vercel automatic)
- [ ] HTTPS redirect enabled

---

## Phase 8: Monitoring & Analytics

### Error Monitoring
- [ ] Vercel error logging reviewed
- [ ] Supabase logs accessible
- [ ] Browser console errors checked
- [ ] Error tracking plan (optional: Sentry, LogRocket)

### Performance Monitoring
- [ ] Vercel Analytics enabled (optional)
- [ ] Lighthouse audit run (score > 90)
- [ ] Core Web Vitals checked
- [ ] Page load times acceptable

### Usage Monitoring
- [ ] Supabase usage dashboard reviewed
- [ ] API quota monitoring plan
- [ ] Database size monitoring plan
- [ ] Bandwidth monitoring plan

---

## Phase 9: Documentation

### User Documentation
- [ ] README updated with production URLs
- [ ] User guide created (optional)
- [ ] FAQ document created (optional)
- [ ] Help/Support contact info added

### Technical Documentation
- [ ] `.env.example` comprehensive and up-to-date
- [ ] [SUPABASE_PRODUCTION_SETUP.md](./SUPABASE_PRODUCTION_SETUP.md) complete
- [ ] [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) complete
- [ ] [RBAC_GUIDE.md](./RBAC_GUIDE.md) available
- [ ] [TOGGLE_FEATURES_STATUS.md](./TOGGLE_FEATURES_STATUS.md) available

### Deployment Documentation
- [ ] Deployment process documented
- [ ] Rollback procedure documented
- [ ] Environment variables documented
- [ ] Migration process documented

---

## Phase 10: Post-Deployment Plan

### Launch Day
- [ ] Create first super admin user
- [ ] Test all features in production
- [ ] Monitor error logs (first 24 hours)
- [ ] Monitor performance metrics
- [ ] Monitor API usage

### Week 1
- [ ] Gather user feedback
- [ ] Fix critical bugs
- [ ] Monitor API quotas
- [ ] Review analytics data
- [ ] Adjust as needed

### Ongoing Maintenance
- [ ] Weekly error log review
- [ ] Monthly dependency updates
- [ ] Monthly security audit
- [ ] Quarterly feature releases
- [ ] Backup verification monthly

---

## Sign-Off

### Pre-Deployment Approval

**Technical Review**:
- [ ] All checklist items completed
- [ ] No blocking issues
- [ ] Performance acceptable
- [ ] Security verified

**Stakeholder Sign-Off**:
- [ ] Product owner approval
- [ ] Technical lead approval
- [ ] Security review passed
- [ ] Ready for production

**Deployment Authorization**:
- **Approved by**: ___________________
- **Date**: ___________________
- **Deployment scheduled for**: ___________________

---

## Emergency Contacts

**Technical Issues**:
- Developer: ___________________
- Email: ___________________
- Phone: ___________________

**Service Providers**:
- Vercel Support: support@vercel.com (Pro plan)
- Supabase Support: support@supabase.com
- Cloudinary Support: support@cloudinary.com

**Escalation Path**:
1. Check error logs (Vercel + Supabase)
2. Review recent deployments
3. Rollback if necessary
4. Contact service provider support
5. Escalate to technical lead

---

## Rollback Plan

If deployment fails:

### Immediate Actions
1. Go to Vercel → Deployments
2. Find last working deployment
3. Click "..." → "Promote to Production"
4. Verify rollback successful

### Database Rollback
1. Supabase → Backups
2. Restore to last known good state
3. Verify data integrity
4. Test application

### Communication
1. Notify stakeholders
2. Post status update
3. Investigate root cause
4. Plan fix and redeployment

---

## Success Criteria

Deployment is successful when:

- ✅ App accessible at production URL
- ✅ HTTPS working (green padlock)
- ✅ All features functional
- ✅ No console errors
- ✅ Users can register and login
- ✅ Database operations work
- ✅ File uploads work
- ✅ External APIs respond
- ✅ Performance acceptable (< 3s load)
- ✅ Mobile responsive
- ✅ RLS security verified
- ✅ Monitoring active

---

## Summary

**Total Checklist Items**: 150+
**Estimated Time**: 2-3 hours for thorough review
**Critical Items**: 25 (marked with ⚠️ in detailed sections)

**Checklist Status**:
- [ ] Not Started
- [ ] In Progress
- [ ] Completed ✅
- [ ] Production Live 🚀

**Next Step**: Follow [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

---

**Good luck with your deployment! 🚀**
