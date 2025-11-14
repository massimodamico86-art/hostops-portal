# HostOps Portal - Quick Reference

## 🚀 Development Server

**URL**: http://localhost:5176/

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 📱 Main Pages

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/` | Statistics and recent activity |
| Listings | `/listings` | Property management |
| PMS | `/pms` | PMS integration setup |
| Settings | `/settings` | User preferences |
| Guidebooks | `/guidebooks` | Placeholder |
| Monetize | `/monetize` | Placeholder |
| Refer | `/refer` | Placeholder |
| FAQs | `/faqs` | Placeholder |
| Users | `/users` | Placeholder |
| Subscription | `/subscription` | Placeholder |
| Setup | `/setup` | Placeholder |

---

## 🎯 Key Features

### **Property Management**
- Create/Edit/Delete properties
- 4 TV layouts (Layout 1-4)
- Background images/videos/carousel
- Welcome messages
- WiFi credentials
- Contact information
- QR codes

### **Guest Management**
- Add/Edit/Delete guests
- iCal import
- CSV export
- Search and sort
- Real-time updates

### **TV Displays**
- Live preview of TV layouts
- Weather integration
- Guest personalization
- Dynamic content

### **PMS Integration**
- 6 PMS platforms supported
- Connection testing
- Reservation syncing
- Per-listing configuration

### **Settings**
- Notifications
- Display preferences
- Privacy settings
- Activity log

---

## 🗂️ Key Files

```
src/
├── App.jsx                    # Main application
├── pages/
│   ├── DashboardPage.jsx      # Dashboard
│   ├── ListingsPage.jsx       # Listings
│   ├── PMSPage.jsx            # PMS
│   └── SettingsPage.jsx       # Settings
├── components/listings/
│   ├── PropertyDetailsModal.jsx  # Property editor
│   ├── GuestListTab.jsx          # Guest management
│   ├── TVPreviewModal.jsx        # TV preview
│   └── PMSSetupModal.jsx         # PMS setup
├── services/
│   ├── listingService.js      # Listing operations
│   ├── guestService.js        # Guest operations
│   ├── pmsService.js          # PMS integration
│   ├── weatherService.js      # Weather API
│   └── userSettingsService.js # User settings
└── supabase.js                # Supabase client
```

---

## 🛠️ Common Tasks

### **Add a New Property**
1. Go to Dashboard or Listings
2. Click "Add Listing"
3. Fill in Property Details tab
4. Add background media
5. Configure content settings
6. Click "Save"

### **Add a Guest**
1. Edit a property
2. Go to Guest List tab
3. Click "Add Guest"
4. Fill in guest details
5. Click "Add Guest"

### **Preview TV Display**
1. Click "Preview" on a property card
2. View how TV will appear
3. Check guest name appears if guest exists

### **Import Guests from iCal**
1. Edit property → Guest List
2. Click "Import iCal"
3. Enter iCal URL
4. Click "Import"

### **Setup PMS Connection**
1. Go to PMS page
2. Click "Setup PMS" on a listing
3. Select PMS provider
4. Enter credentials
5. Test connection
6. Save

### **Change User Settings**
1. Go to Settings page
2. Navigate to desired tab
3. Toggle or change settings
4. Settings auto-save

---

## 🔑 Environment Variables

Create `.env` file:

```env
# Supabase (Required)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Cloudinary (Required for image uploads)
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=your-preset

# Weather (Optional)
VITE_OPENWEATHER_API_KEY=your-api-key
```

---

## 📊 Database Tables

| Table | Purpose |
|-------|---------|
| profiles | User accounts |
| listings | Property data |
| guests | Reservation info |
| tv_devices | TV registration |
| qr_codes | QR codes |
| pms_connections | PMS credentials |
| user_settings | User preferences |
| activity_log | Audit trail |

---

## 🐛 Troubleshooting

### **Dev Server Won't Start**
```bash
pkill -f vite
rm -rf node_modules/.vite
npm run dev
```

### **Supabase Connection Error**
- Check `.env` has correct URL and key
- Verify Supabase project is running
- Check browser console for errors

### **Images Won't Upload**
- Verify Cloudinary credentials in `.env`
- Check upload preset is configured
- Check browser console for errors

### **Weather Not Showing**
- Add `VITE_OPENWEATHER_API_KEY` to `.env`
- Verify city name is correct
- Check API key has quota remaining

### **Build Fails**
```bash
# Clear cache
rm -rf dist node_modules/.vite

# Reinstall
npm install

# Try again
npm run build
```

---

## 📝 Testing Checklist

Quick test to verify everything works:

- [ ] Dashboard loads with stats
- [ ] Can create a new property
- [ ] Can edit property details
- [ ] TV preview modal opens
- [ ] Can add a guest
- [ ] Guest appears in list
- [ ] Settings page loads
- [ ] Settings save correctly
- [ ] Activity log shows actions
- [ ] No console errors

---

## 🎨 Component Library

### **Buttons**
```jsx
<Button>Default</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
```

### **Cards**
```jsx
<Card>Content</Card>
<Card className="p-6">With padding</Card>
```

### **Modals**
```jsx
<Modal isOpen={true} onClose={fn} title="Title" size="large">
  Content
</Modal>
```

### **Badges**
```jsx
<Badge status="active">Active</Badge>
<Badge status="inactive">Inactive</Badge>
```

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) | Complete project overview |
| [TESTING_GUIDE.md](TESTING_GUIDE.md) | Comprehensive testing instructions |
| [CLOUDINARY_SETUP.md](CLOUDINARY_SETUP.md) | Image upload configuration |
| [PMS_INTEGRATION_GUIDE.md](PMS_INTEGRATION_GUIDE.md) | PMS setup and troubleshooting |
| [QUICK_REFERENCE.md](QUICK_REFERENCE.md) | This file |

---

## 🔗 External Services

### **Supabase**
- Dashboard: https://app.supabase.com
- Docs: https://supabase.com/docs

### **Cloudinary**
- Dashboard: https://cloudinary.com/console
- Docs: https://cloudinary.com/documentation

### **OpenWeatherMap**
- Dashboard: https://home.openweathermap.org
- API Docs: https://openweathermap.org/api

---

## 📞 Quick Help

**Issue**: Can't see my data
→ Check Supabase connection, verify RLS policies

**Issue**: Upload not working
→ Check Cloudinary setup, verify credentials

**Issue**: Weather not showing
→ Add OpenWeatherMap API key, check city name

**Issue**: PMS sync failing
→ Verify credentials, check connection status

**Issue**: Changes not saving
→ Check browser console, verify Supabase connection

---

## ⚡ Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Save form | `Cmd/Ctrl + S` (if implemented) |
| Close modal | `Esc` |
| Navigate | Arrow keys (where applicable) |

---

## 🎯 Feature Status

| Feature | Status |
|---------|--------|
| Property Management | ✅ Complete |
| Guest Management | ✅ Complete |
| TV Layouts | ✅ Complete (4 layouts) |
| Weather | ✅ Complete |
| PMS Integration | ✅ Complete (6 platforms) |
| User Settings | ✅ Complete |
| Activity Log | ✅ Complete |
| Image Upload | ✅ Complete |
| Real-time Sync | ✅ Complete |
| Email Notifications | ❌ Removed |
| Multi-language | ❌ Not implemented |
| Advanced Search | ❌ Not implemented |
| Analytics | ❌ Not implemented |

---

## 💡 Pro Tips

1. **Use TV Preview** to see changes in real-time
2. **Import iCal** to quickly add multiple guests
3. **Export CSV** to backup guest data
4. **Enable Weather** to enhance guest experience
5. **Use Activity Log** to track all changes
6. **Set up PMS** for automatic guest syncing
7. **Test Connection** before saving PMS credentials
8. **Use Search** in guest list to quickly find guests

---

**Quick Access**: Open http://localhost:5176/ to start testing!

**Need Help?**: See [TESTING_GUIDE.md](TESTING_GUIDE.md) for detailed instructions.
