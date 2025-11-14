# HostOps Portal - Testing & Review Guide

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
