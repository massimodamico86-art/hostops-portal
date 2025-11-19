# HostOps Portal - Testing Guide

## 🧪 Test User Accounts

### Test Credentials

**Super Admin Account** (Already exists)
```
Email: mvproperties305@gmail.com
Password: [Your existing password]
Role: super_admin
```

**Admin Account** (To be created)
```
Email: admin@hostops-test.com
Password: TestAdmin123!
Role: admin
```

**Client Account** (To be created)
```
Email: client@hostops-test.com
Password: TestClient123!
Role: client
```

---

## 📋 Role Testing Checklist

### 1. Super Admin Testing

**Expected Access:**
- ✅ SuperAdminDashboardPage
- ✅ System-wide analytics
- ✅ User management (create/edit/delete users)
- ✅ View ALL listings across all clients
- ✅ Full database access

**Test Steps:**
1. Log in with super_admin credentials
2. Verify you see "Super Admin Dashboard" heading
3. Check statistics: Total Users, Admins, Clients, Unassigned
4. Verify you can access Users page
5. Test creating new admin/client users
6. Test viewing all listings in system
7. Test editing any listing
8. Test deleting users/listings

---

### 2. Admin Testing

**Expected Access:**
- ✅ AdminDashboardPage
- ✅ View listings of their assigned clients only
- ✅ Manage clients they are assigned to
- ❌ Cannot see other admins' clients
- ❌ Cannot create/delete users
- ❌ Cannot access system-wide analytics

**Test Steps:**
1. Log in with admin credentials
2. Verify you see "Admin Dashboard" heading
3. Check you can only see listings where `owner.managed_by = admin_user_id`
4. Test adding/editing listings for assigned clients
5. Verify you CANNOT see unassigned listings
6. Verify you CANNOT access Users page
7. Test PMS integration for assigned clients

**Setup Required:**
- Create a test client user
- Set client's `managed_by` field to admin's user ID
- Create test listings owned by that client
- Verify admin can see these listings

---

### 3. Client Testing

**Expected Access:**
- ✅ Client Dashboard (full navigation)
- ✅ View/edit ONLY their own listings
- ✅ Manage their own TV devices
- ✅ Manage their own guests
- ✅ Access guidebooks, monetize, PMS, subscription
- ❌ Cannot see other clients' data
- ❌ Cannot access Users page
- ❌ Cannot create other users

**Test Steps:**
1. Log in with client credentials
2. Verify you see full navigation sidebar
3. Test Listings page - verify only your listings appear
4. Test creating a new listing
5. Test editing your listing
6. Test TV device management
7. Test guest list management
8. Test PMS integration
9. Test subscription page
10. Verify you CANNOT see other clients' listings
11. Verify you CANNOT access Users page

---

## 🔒 Security Testing

### Row Level Security (After upgrading Supabase)

**Test with RLS enabled:**
1. Log in as Client A
2. Attempt to query Client B's listings directly (via browser DevTools console):
   ```javascript
   // This should FAIL and return empty results
   const { data, error } = await window.supabase
     .from('listings')
     .select('*')
     .eq('owner_id', 'client-b-user-id');
   ```
3. Verify you get no results or permission denied error

**Test admin isolation:**
1. Create Admin A with Client A assigned
2. Create Admin B with Client B assigned
3. Log in as Admin A
4. Verify Admin A cannot see Client B's listings
5. Verify Admin A CAN see Client A's listings

---

## 🧩 Feature Testing

### Listings Management
- [ ] Create new listing
- [ ] Edit listing details
- [ ] Upload background images (Cloudinary)
- [ ] Upload carousel images
- [ ] Upload logo
- [ ] Delete listing
- [ ] Real-time updates (changes appear immediately)

### TV Device Management
- [ ] Add new TV device
- [ ] Assign device to listing
- [ ] Generate pairing code
- [ ] Test QR code generation
- [ ] Background video selection
- [ ] Background music selection
- [ ] Welcome message customization
- [ ] Preview TV layouts (Layout 1-6)

### Guest Management
- [ ] Add guest manually
- [ ] Import from iCal URL
- [ ] Edit guest details
- [ ] Delete guest
- [ ] Search guests
- [ ] Sort by check-in/check-out
- [ ] Filter by current/past/upcoming

### Weather Integration
- [ ] Verify weather displays on TV previews
- [ ] Check weather updates every 30 minutes
- [ ] Test with different locations
- [ ] Verify weather cache (30-min TTL)

### PMS Integration
- [ ] Connect Guesty account
- [ ] Sync listings from PMS
- [ ] Manual sync trigger
- [ ] View sync status

### Monetization
- [ ] View revenue statistics
- [ ] View experience listings
- [ ] Test recommendation engine

---

## 🚀 Performance Testing

### Load Times
- [ ] Login: < 2 seconds
- [ ] Profile fetch: < 100ms (with RLS disabled)
- [ ] Dashboard load: < 1 second
- [ ] Listings page: < 1 second
- [ ] Image upload: < 5 seconds (depends on file size)

### Real-time Updates
- [ ] Open app in 2 browsers as same user
- [ ] Create listing in Browser 1
- [ ] Verify it appears in Browser 2 within 2 seconds
- [ ] Edit listing in Browser 2
- [ ] Verify changes appear in Browser 1

---

## 🐛 Known Issues & Limitations

### Current Limitations (Free Tier Supabase)
- ✅ RLS is **DISABLED** for development
- ⚠️ Connection pool limited to 15 connections
- ⚠️ No automatic backups
- ⚠️ Limited storage (500MB)

### After Upgrade (Paid Tier)
- ✅ Re-enable RLS for security
- ✅ Increase connection pool to 20-30
- ✅ Enable automatic backups
- ✅ Unlimited storage

---

## 📝 Test Results Log

### Test Session: [Date]

**Super Admin:**
- [ ] Login successful
- [ ] Dashboard loads
- [ ] Can view all users
- [ ] Can create users
- [ ] Can view all listings
- [ ] Can edit any listing

**Admin:**
- [ ] Login successful
- [ ] Dashboard loads
- [ ] Can only see assigned clients' listings
- [ ] Cannot access Users page
- [ ] Cannot see unassigned listings

**Client:**
- [ ] Login successful
- [ ] Dashboard loads
- [ ] Can only see own listings
- [ ] Can create new listing
- [ ] Can edit own listing
- [ ] Cannot see other clients' listings
- [ ] Cannot access Users page

**Notes:**
[Add any issues or observations here]

---

## 🔧 Troubleshooting

### Issue: "Profile Load Failed"
**Solution:**
1. Check Supabase connection in DevTools console
2. Verify environment variables are correct
3. Check if user has a profile in `profiles` table
4. Verify role is one of: super_admin, admin, client

### Issue: "Loading your data..." stuck
**Solution:**
1. Check browser console for errors
2. Verify Supabase is responding
3. Check if RLS is causing timeout (disable temporarily)
4. Hard refresh browser (Ctrl+Shift+R)

### Issue: Can't see listings
**Solution:**
1. Verify user has correct role
2. For admin: verify `managed_by` is set correctly
3. For client: verify `owner_id` matches user ID
4. Check RLS policies if enabled

---

## ✅ Sign-Off

Before launching to production:

- [ ] All super_admin tests pass
- [ ] All admin tests pass
- [ ] All client tests pass
- [ ] Security testing complete
- [ ] Performance acceptable
- [ ] Supabase upgraded to paid tier
- [ ] RLS re-enabled and tested
- [ ] All users have correct roles
- [ ] Real-time updates working
- [ ] Image uploads working
- [ ] Weather API working
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Browser compatibility tested

**Tested By:** _________________
**Date:** _________________
**Approved By:** _________________
**Date:** _________________

---

## 🚀 Quick Start

**Development Server**: http://localhost:5176/

---

## 📋 What's Been Built

### **Phase 1: Foundation** ✅
- React + Vite application setup
- Tailwind CSS styling
- Responsive layout with sidebar navigation
- Toast notification system
- Modal component system

### **Phase 2: Core Features** ✅
- Dashboard with statistics overview
- Listings management page
- Property details editor
- TV layout previews (4 layouts)
- Real-time weather integration

### **Phase 3: Supabase Integration** ✅
- Database schema with 9 tables
- Row Level Security (RLS) policies
- Real-time subscriptions
- Automatic triggers and logging
- Complete CRUD operations

### **Phase 4: Guest Management** ✅
- Guest list with search and sorting
- Add/edit/delete guests
- iCal import for PMS sync
- CSV export functionality
- Real-time guest updates

### **Phase 5: PMS Integration** ✅
- Support for 6 PMS platforms (Guesty, Hostaway, OwnerRez, Lodgify, Hostfully, Beds24)
- Connection testing and validation
- Reservation syncing
- Per-listing PMS connections
- Sync status tracking

### **Phase 6: User Settings & Activity Log** ✅
- User preferences management
- Notification settings
- Display preferences (theme, language, timezone)
- Privacy settings
- Activity log with formatted display
- Settings persistence

---

## 🧪 Testing Checklist

### 1. **Dashboard Page** (`/`)

#### Visual Check
- [ ] Page loads without errors
- [ ] Statistics cards display correctly (Total Listings, Active Guests, TVs Online, QR Scans)
- [ ] Recent activity section shows formatted entries
- [ ] Responsive layout on different screen sizes

#### Functionality
- [ ] Click "Add Listing" button → Opens property details modal
- [ ] Statistics update when adding/removing listings
- [ ] Activity log shows recent actions with icons and timestamps

**Expected Behavior**:
- All stats should show "0" initially
- Activity log empty on first load
- No console errors

---

### 2. **Listings Page** (`/listings`)

#### Visual Check
- [ ] Property cards display in grid layout
- [ ] Each card shows property image, name, status, TV layout, guest count
- [ ] Action buttons visible (Edit, Preview, TV Devices, QR Codes)
- [ ] "Add Listing" button in top-right

#### Test Property CRUD Operations

**Create**:
1. [ ] Click "Add Listing"
2. [ ] Fill in property details:
   - Name: "Test Beach House"
   - Address: "123 Ocean Drive"
   - Description: "Beautiful beachfront property"
   - Standard Check-in: "3:00 PM"
   - Standard Check-out: "11:00 AM"
3. [ ] Click "Save"
4. [ ] Verify property appears in listings grid
5. [ ] Check toast notification shows success

**Read/View**:
1. [ ] Click "Edit" on a property
2. [ ] Verify all fields populated correctly
3. [ ] Check all tabs load (Details, Background, Content, Guest List)

**Update**:
1. [ ] Edit property name to "Updated Test Beach House"
2. [ ] Click "Save"
3. [ ] Verify name updates in grid
4. [ ] Check activity log records the update

**Delete**:
1. [ ] Click "Edit" on test property
2. [ ] Click "Delete Property"
3. [ ] Confirm deletion
4. [ ] Verify property removed from grid

---

### 3. **Property Editor Modal**

#### Tab 1: Property Details
- [ ] All input fields work correctly
- [ ] WiFi toggle shows/hides WiFi fields
- [ ] Contact toggle shows/hides contact fields
- [ ] Hours of operation fields appear when toggled
- [ ] Logo upload button works
- [ ] Image upload shows progress and preview

#### Tab 2: Background Media
- [ ] Background type selector (Image/Video/Carousel)
- [ ] Image upload works
- [ ] Video upload works
- [ ] URL input works for both
- [ ] Carousel images can be added/removed
- [ ] Preview shows selected media

#### Tab 3: Content Settings
- [ ] Welcome message toggle works
- [ ] Custom greeting text saves
- [ ] Weather integration toggle works
- [ ] Weather city/unit saves correctly
- [ ] QR codes can be added/edited/deleted
- [ ] QR code preview displays

#### Tab 4: Guest List
- [ ] Guest list displays with search
- [ ] Sorting works (by name, check-in, check-out)
- [ ] Add guest modal opens
- [ ] Edit guest modal opens with pre-filled data
- [ ] Delete guest works with confirmation
- [ ] Export CSV downloads file
- [ ] iCal import modal opens

---

### 4. **TV Preview**

#### Test Each Layout
1. [ ] Click "Preview" on a property
2. [ ] Layout 1: Full-screen background with overlays
3. [ ] Layout 2: Split-screen design
4. [ ] Layout 3: Card-based layout
5. [ ] Layout 4: Minimalist design

#### Verify Content Displays
- [ ] Property name shows
- [ ] Welcome message (if enabled)
- [ ] Guest name (if guest exists)
- [ ] Check-in/out dates
- [ ] WiFi credentials (if enabled)
- [ ] Weather (if enabled and configured)
- [ ] QR codes (if enabled)
- [ ] Contact information (if enabled)
- [ ] Background image/video displays

---

### 5. **Guest Management**

#### Add Guest
1. [ ] Open property editor → Guest List tab
2. [ ] Click "Add Guest"
3. [ ] Fill in:
   - First Name: "John"
   - Last Name: "Doe"
   - Email: "john@example.com"
   - Check-in: (today's date)
   - Check-out: (tomorrow's date)
   - Language: "English"
4. [ ] Click "Add Guest"
5. [ ] Verify guest appears in list
6. [ ] Check activity log shows guest creation

#### Edit Guest
1. [ ] Click edit icon on guest
2. [ ] Change first name to "Jane"
3. [ ] Click "Update Guest"
4. [ ] Verify name updates in list

#### Delete Guest
1. [ ] Click delete icon
2. [ ] Confirm deletion
3. [ ] Verify guest removed

#### Search & Sort
- [ ] Type guest name in search box
- [ ] Verify filtering works
- [ ] Click column headers to sort
- [ ] Test ascending/descending sort

#### iCal Import
1. [ ] Click "Import iCal" button
2. [ ] Enter test iCal URL (or use sample)
3. [ ] Click "Import"
4. [ ] Verify guests imported from calendar

#### CSV Export
1. [ ] Click "Export CSV" button
2. [ ] Verify CSV file downloads
3. [ ] Open CSV and check data format

---

### 6. **PMS Integration** (`/pms`)

#### Connection Setup
1. [ ] Navigate to PMS page
2. [ ] Click "Setup PMS" on a listing
3. [ ] Select PMS provider (e.g., "Guesty")
4. [ ] Enter credentials:
   - API Key: "test_api_key_123"
   - Account ID: "test_account_123"
5. [ ] Click "Test Connection"
6. [ ] Verify connection status displays

#### Sync Operations
- [ ] Click "Sync Now" button
- [ ] Verify sync status updates
- [ ] Check last sync timestamp
- [ ] Verify activity log shows sync event

#### Per-Listing Configuration
- [ ] Verify each listing can have different PMS
- [ ] Test multiple PMS connections simultaneously
- [ ] Check connection status indicators

---

### 7. **Settings Page** (`/settings`)

#### Notifications Tab
- [ ] Toggle "Email Notifications" on/off
- [ ] Toggle "Guest Check-in Notifications"
- [ ] Toggle "PMS Sync Notifications"
- [ ] Toggle "TV Offline Notifications"
- [ ] Verify settings save (toast notification)
- [ ] Refresh page, verify settings persist

#### Display Tab
- [ ] Change theme (Light/Dark/Auto)
- [ ] Change language
- [ ] Change date format
- [ ] Change time format
- [ ] Verify settings save and persist

#### Privacy Tab
- [ ] Toggle "Activity Tracking"
- [ ] Toggle "Analytics"
- [ ] Toggle "Auto-Sync PMS"
- [ ] Change sync frequency
- [ ] Verify conditional fields show/hide

#### Activity Log Tab
- [ ] Recent activities display with icons
- [ ] Timestamps show relative time (e.g., "5m ago")
- [ ] Different action types have different colors
- [ ] Activity details are readable

#### Reset Settings
- [ ] Click "Reset to Defaults" button
- [ ] Confirm reset
- [ ] Verify all settings return to defaults

---

### 8. **Weather Integration**

#### Setup
1. [ ] Edit a property
2. [ ] Enable "Show Weather"
3. [ ] Enter city: "New York"
4. [ ] Select unit: "Fahrenheit"
5. [ ] Save property

#### Verification
- [ ] Open TV preview
- [ ] Verify weather displays with:
  - Temperature
  - Weather description
  - Weather icon
- [ ] Check weather updates every 30 minutes

#### Error Handling
- [ ] Enter invalid city name
- [ ] Verify graceful error handling
- [ ] Check console for error messages

---

### 9. **Real-time Features**

#### Test Subscriptions
1. [ ] Open same property in two browser tabs
2. [ ] Edit property name in Tab 1
3. [ ] Verify Tab 2 updates automatically
4. [ ] Add guest in Tab 1
5. [ ] Verify guest appears in Tab 2

#### Test Activity Log
1. [ ] Keep Settings → Activity Log open
2. [ ] Perform actions in another tab
3. [ ] Verify activity log updates in real-time

---

### 10. **Image Upload (Cloudinary)**

#### Background Images
1. [ ] Edit property → Background tab
2. [ ] Select "Image" type
3. [ ] Click "Upload from Computer"
4. [ ] Select image file
5. [ ] Verify upload progress
6. [ ] Verify image displays in preview
7. [ ] Check URL is from Cloudinary CDN

#### Logo Upload
1. [ ] Edit property → Details tab
2. [ ] Enable "Show Logo"
3. [ ] Click "Upload Logo" button
4. [ ] Select logo file
5. [ ] Verify upload and preview

#### Carousel Images
1. [ ] Edit property → Background tab
2. [ ] Select "Carousel" type
3. [ ] Click "Add Image"
4. [ ] Upload multiple images
5. [ ] Verify carousel preview

---

### 11. **Database & Persistence**

#### Supabase Connection
- [ ] Check browser console for Supabase connection
- [ ] Verify no authentication errors
- [ ] Check network tab for API calls

#### Data Persistence
1. [ ] Create a property with all fields filled
2. [ ] Refresh the browser
3. [ ] Verify all data persists
4. [ ] Check database directly in Supabase dashboard

#### RLS Policies
- [ ] Verify user can only see their own data
- [ ] Test with multiple user accounts
- [ ] Verify data isolation between users

---

### 12. **Error Handling**

#### Network Errors
- [ ] Disable network in DevTools
- [ ] Try to save a property
- [ ] Verify error toast appears
- [ ] Re-enable network and retry

#### Validation Errors
- [ ] Try to create property without name
- [ ] Try to add guest without required fields
- [ ] Verify validation messages display
- [ ] Check form highlights invalid fields

#### 404/Missing Data
- [ ] Try to edit non-existent property
- [ ] Verify graceful error handling
- [ ] Check error messages are user-friendly

---

### 13. **Responsive Design**

#### Desktop (1920x1080)
- [ ] All features accessible
- [ ] Layout looks professional
- [ ] No horizontal scrolling

#### Tablet (768x1024)
- [ ] Sidebar collapses or adapts
- [ ] Cards stack appropriately
- [ ] Touch targets are adequate

#### Mobile (375x667)
- [ ] Hamburger menu works
- [ ] Forms are usable
- [ ] Modals fit screen
- [ ] Text is readable

---

### 14. **Performance**

#### Load Times
- [ ] Dashboard loads in < 2 seconds
- [ ] Listings page loads in < 2 seconds
- [ ] Image uploads complete in reasonable time
- [ ] No lag when typing in forms

#### Memory Usage
- [ ] Open DevTools → Performance
- [ ] Record session while navigating
- [ ] Check for memory leaks
- [ ] Verify no excessive re-renders

#### Network
- [ ] Check Network tab in DevTools
- [ ] Verify API calls are optimized
- [ ] Check image sizes are reasonable
- [ ] Verify caching is working

---

### 15. **Browser Compatibility**

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

---

## 🐛 Known Issues & Limitations

### Current Limitations:
1. **Authentication**: No login system implemented yet (uses mock auth)
2. **Email Notifications**: Removed as per user request
3. **Multi-language**: Not implemented
4. **Search & Filtering**: Basic search only, advanced filtering not implemented
5. **Backup & Restore**: Not implemented

### Minor Issues:
- Weather API requires OpenWeatherMap key (set in `.env`)
- Cloudinary requires account setup for image uploads
- PMS integration requires actual API credentials for testing

---

## 📊 Test Results Template

Use this template to record your test results:

```markdown
## Test Session: [Date]

### Environment
- Browser:
- Screen Size:
- Supabase Project:

### Dashboard
- [ ] PASS / [ ] FAIL - Statistics display
- [ ] PASS / [ ] FAIL - Activity log
- Notes:

### Listings
- [ ] PASS / [ ] FAIL - Create property
- [ ] PASS / [ ] FAIL - Edit property
- [ ] PASS / [ ] FAIL - Delete property
- Notes:

### Guest Management
- [ ] PASS / [ ] FAIL - Add guest
- [ ] PASS / [ ] FAIL - Edit guest
- [ ] PASS / [ ] FAIL - iCal import
- [ ] PASS / [ ] FAIL - CSV export
- Notes:

### PMS Integration
- [ ] PASS / [ ] FAIL - Connection setup
- [ ] PASS / [ ] FAIL - Sync operation
- Notes:

### Settings
- [ ] PASS / [ ] FAIL - Notifications
- [ ] PASS / [ ] FAIL - Display preferences
- [ ] PASS / [ ] FAIL - Activity log
- Notes:

### Real-time Features
- [ ] PASS / [ ] FAIL - Data sync between tabs
- [ ] PASS / [ ] FAIL - Activity log updates
- Notes:

### Performance
- Dashboard load time: ___ seconds
- Listings load time: ___ seconds
- Memory usage: ___ MB
- Notes:

### Bugs Found
1.
2.
3.

### Suggestions
1.
2.
3.
```

---

## 🎯 Priority Test Areas

If you have limited time, focus on these critical areas:

1. **Property CRUD** (Create, Read, Update, Delete)
2. **Guest Management** (Add, Edit, Delete, Import)
3. **TV Preview** (All 4 layouts)
4. **Real-time Sync** (Multi-tab testing)
5. **Settings Persistence**

---

## 🔧 Troubleshooting

### Development Server Not Starting
```bash
# Kill existing processes
pkill -f vite

# Clear cache
rm -rf node_modules/.vite

# Restart
npm run dev
```

### Supabase Connection Issues
1. Check `.env` file has correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
2. Verify Supabase project is running
3. Check browser console for specific errors

### Image Upload Failures
1. Verify Cloudinary credentials in `.env`:
   - `VITE_CLOUDINARY_CLOUD_NAME`
   - `VITE_CLOUDINARY_UPLOAD_PRESET`
2. Check Cloudinary dashboard for upload limits
3. Verify unsigned upload preset is configured

### Weather Not Displaying
1. Check `.env` has `VITE_OPENWEATHER_API_KEY`
2. Verify city name is correct
3. Check browser console for API errors
4. Verify API key has sufficient quota

---

## 📝 Feedback & Reporting

When reporting issues, please include:
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Browser and version
5. Screenshot/video if applicable
6. Console error messages

---

## ✅ Final Checklist

Before considering the project "production-ready":

- [ ] All features tested
- [ ] No critical bugs
- [ ] Performance is acceptable
- [ ] Responsive design works
- [ ] Error handling is graceful
- [ ] Data persists correctly
- [ ] Real-time features work
- [ ] Settings save properly
- [ ] Activity logging works
- [ ] Documentation is complete

---

**Testing Notes**:
- Test incrementally (one feature at a time)
- Check browser console frequently
- Test happy path first, then edge cases
- Use multiple browser tabs for real-time testing
- Clear browser cache if seeing old data

**Good luck testing! 🚀**
