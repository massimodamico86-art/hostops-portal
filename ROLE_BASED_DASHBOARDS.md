# Role-Based Dashboards - Complete Guide

## Overview

The HostOps Portal now has **three separate dashboards** designed for different user roles. This follows SaaS best practices for multi-tenant applications.

---

## Architecture

```
┌─────────────────────────────────────────────┐
│           LOGIN / AUTHENTICATION            │
│         (LoginPage.jsx)                     │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
         ┌─────────────────┐
         │   App.jsx       │
         │  Route by Role  │
         └────────┬────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
   ┌────▼────┐         ┌────▼────┐         ┌────▼────┐
   │  SUPER  │         │  ADMIN  │         │ CLIENT  │
   │  ADMIN  │         │         │         │         │
   └─────────┘         └─────────┘         └─────────┘
        │                   │                   │
        ▼                   ▼                   ▼
SuperAdminDashboard   AdminDashboard     DashboardPage
     Page.jsx          Page.jsx          (existing)
```

---

## Dashboard Comparison

| Feature | Super Admin | Admin | Client |
|---------|------------|-------|--------|
| **View** | All users, admins, clients | Assigned clients only | Own data only |
| **User Management** | Create/edit/delete all users | View assigned clients | View own profile |
| **Client Assignment** | Assign clients to admins | N/A | N/A |
| **Listings** | All listings | Assigned clients' listings | Own listings |
| **Guests** | All guests | Assigned clients' guests | Own guests |
| **Analytics** | System-wide | Assigned clients only | Own data only |
| **Billing/Subscription** | All accounts | N/A | Own subscription |

---

## 1. Super Admin Dashboard

**File**: `src/pages/SuperAdminDashboardPage.jsx`

**Access**: `userProfile.role === 'super_admin'`

### Features:

#### Stats Overview
- Total users count
- Total admins count
- Total clients count
- Unassigned clients count (with warning)

#### Tabs:

**Overview Tab**:
- Recent admins list with client counts
- Unassigned clients list with quick assign

**Admins Tab**:
- Complete admin list
- Client count per admin
- Join date
- Actions: View details, Create new admin

**Clients Tab**:
- Complete client list
- Managed by (admin name or "Unassigned")
- Dropdown to assign/reassign clients
- Quick unassign button

#### Actions:
- Create admin user
- Create client user
- Assign/unassign clients to admins
- View detailed analytics

---

## 2. Admin Dashboard

**File**: `src/pages/AdminDashboardPage.jsx`

**Access**: `userProfile.role === 'admin'`

### Features:

#### Stats Overview
- Total clients assigned to this admin
- Total properties managed
- Total guests across all managed properties

#### Clients List Table
- Client avatar (generated from initial)
- Full name and email
- Properties count (badge)
- Guests count (badge)
- Join date
- "View Details" action button

#### Empty State
- Friendly message when no clients assigned
- Instructions to contact administrator

#### Quick Actions
- Add New Property (for clients)
- Import Guests (bulk)
- Generate Report

---

## 3. Client Dashboard (Existing)

**File**: `src/pages/DashboardPage.jsx` (and existing pages)

**Access**: `userProfile.role === 'client'` (or no role check - default)

### Features:

**Existing functionality remains unchanged**:
- Listings management
- Guidebooks
- Monetization
- PMS Integration
- Subscription
- Users
- FAQs
- Refer & Earn
- Setup

---

## Routing Logic

In `App.jsx`:

```javascript
// After authentication and data loading...

// Route to role-specific dashboards
if (userProfile?.role === 'super_admin') {
  return <SuperAdminDashboardPage />;
}

if (userProfile?.role === 'admin') {
  return <AdminDashboardPage />;
}

// Default: Client dashboard (existing UI)
return (
  <div className="flex h-screen">
    {/* Existing sidebar and client dashboard */}
  </div>
);
```

---

## Testing the Dashboards

### Test Super Admin Dashboard

1. Log in with: `mvproperties305@gmail.com`
2. Expected view:
   - System-wide stats
   - All admins list
   - All clients list
   - Assign/unassign functionality
   - Create user buttons

### Test Admin Dashboard

1. Log in with: `testadmin@hostops.com / TestAdmin123!`
2. Expected view:
   - Stats for YOUR assigned clients only
   - Client list showing: testclient1@hostops.com (assigned)
   - Empty state if no clients assigned
   - Quick actions for managing client data

### Test Client Dashboard

1. Log in with: `testclient1@hostops.com / TestClient123!`
2. Expected view:
   - Existing HostOps UI
   - Listings, Guidebooks, Monetize, etc.
   - Own data only

---

## RLS Policies (Security)

The following RLS policies enforce access control:

### Profiles Table
```sql
-- Everyone sees their own profile first
-- Super admins see all
-- Admins see assigned clients
CREATE POLICY "View profiles based on role"
ON profiles FOR SELECT
USING (
  id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  )
  OR
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
      AND profiles.managed_by = auth.uid()
  )
);
```

### Listings Table
```sql
CREATE POLICY "View listings based on role"
ON listings FOR SELECT
USING (
  -- Super admins see all
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  )
  OR
  -- Admins see assigned clients' listings
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
      AND listings.owner_id IN (
        SELECT id FROM profiles WHERE managed_by = auth.uid()
      )
  )
  OR
  -- Clients see own listings
  (owner_id = auth.uid())
);
```

---

## API Services

### adminService.js

Key functions for admin/super admin operations:

```javascript
// Super Admin
getAllUsers()           // Get all users
getAllAdmins()          // Get all admins
getAllClients()         // Get all clients
getUnassignedClients()  // Get clients without admin
assignClientToAdmin(clientId, adminId)
unassignClient(clientId)
createAdminUser(email, password, fullName)
createClientUser(email, password, fullName, managedBy)

// Admin
getMyClients()          // Get assigned clients only
getClientListings(clientId)
getAllManagedListings() // Get all listings for assigned clients
```

---

## Database Schema

### profiles table
```sql
id UUID PRIMARY KEY
email TEXT NOT NULL
full_name TEXT
role TEXT NOT NULL DEFAULT 'client'
  CHECK (role IN ('super_admin', 'admin', 'client'))
managed_by UUID REFERENCES profiles(id)  -- For clients only
avatar_url TEXT
created_at TIMESTAMP
updated_at TIMESTAMP
```

**Key Field**: `managed_by`
- NULL for super_admin and admin users
- Points to admin's ID for client users
- Enables client-to-admin relationship

---

## User Flows

### Super Admin Onboarding New Admin

1. Super admin logs in → sees SuperAdminDashboardPage
2. Clicks "Create Admin" button
3. Enters admin details (email, password, name)
4. Admin created with `role = 'admin'`
5. Admin receives welcome email (optional)
6. Super admin assigns clients to new admin

### Admin Managing Assigned Clients

1. Admin logs in → sees AdminDashboardPage
2. Views assigned clients in table
3. Clicks "View Details" on a client
4. Sees client's properties, guests, settings
5. Can edit client data, manage listings
6. Cannot see or access other admins' clients

### Client Self-Service

1. Client logs in → sees existing DashboardPage
2. Manages own properties
3. Sees own guests
4. Manages own subscription
5. No visibility into other clients' data

---

## Styling and UX

### Color Coding

- **Super Admin**: Purple/violet theme (`bg-purple-600`, `text-purple-800`)
- **Admin**: Blue theme (`bg-blue-600`, `text-blue-800`)
- **Client**: Green theme (existing, `bg-green-600`)

### Icons

Uses Lucide React icons:
- Users: Multi-user groups
- Shield: Admin/security
- Home: Properties
- Chart: Analytics

### Layout

Both admin dashboards use:
- Full-width layout (no sidebar - single purpose)
- Stats cards at top
- Table or grid for main content
- Clear headings and descriptions
- Responsive design (mobile-friendly)

---

## Next Steps / Roadmap

### Phase 1 (Current)
- ✅ Super Admin Dashboard with user management
- ✅ Admin Dashboard with client list
- ✅ Role-based routing in App.jsx
- ✅ RLS policies optimized

### Phase 2 (Recommended)
- [ ] Admin: Client detail page (click client → see all their data)
- [ ] Super Admin: Analytics and reporting
- [ ] Admin: Create listings for clients
- [ ] Client invite/onboarding flow

### Phase 3 (Advanced)
- [ ] Admin: Impersonate client (view as they see)
- [ ] Super Admin: Billing management
- [ ] Admin performance metrics
- [ ] Notification system for admins

---

## Troubleshooting

### Admin sees 500 errors
- **Cause**: RLS policies using recursive queries
- **Fix**: Run the optimized policies from `TROUBLESHOOT_ADMIN_500.md`

### Admin sees no clients
- **Cause**: No clients assigned yet
- **Solution**: Log in as super admin and assign clients

### Client sees admin dashboard
- **Cause**: Profile role set incorrectly
- **Fix**: Run SQL to update role:
  ```sql
  UPDATE profiles
  SET role = 'client'
  WHERE email = 'clientemail@example.com';
  ```

### Super admin doesn't see all data
- **Cause**: Role not set to 'super_admin'
- **Fix**: Run SQL:
  ```sql
  UPDATE profiles
  SET role = 'super_admin'
  WHERE email = 'youremail@example.com';
  ```

---

## Security Considerations

### Row Level Security (RLS)
- **Enabled** on all tables (profiles, listings, guests)
- Policies enforce data isolation at database level
- Cannot be bypassed from client-side code

### Role Assignment
- Only super_admin can create admin users
- Only super_admin can change user roles
- Admins cannot promote themselves

### Audit Trail
- All actions logged in activity_log table
- Track who did what and when
- Super admin can view all activity

---

## Commercial SaaS Best Practices

This implementation follows industry standards:

1. **Separate Interfaces**: Different dashboards for different roles (not tabs/toggles)
2. **Client Isolation**: Admins only see assigned clients
3. **Database-Level Security**: RLS policies at PostgreSQL level
4. **Clear Navigation**: Each role sees only relevant actions
5. **Scalability**: Can support hundreds of admins managing thousands of clients

Examples of similar architecture:
- **Shopify Partners** dashboard vs merchant dashboard
- **HubSpot Agency** portal vs client portal
- **Gusto** accountant dashboard vs business dashboard

---

## Files Created/Modified

### New Files
- ✅ `src/pages/AdminDashboardPage.jsx` - Admin interface
- ✅ `src/pages/SuperAdminDashboardPage.jsx` - Super admin interface
- ✅ `ROLE_BASED_DASHBOARDS.md` - This guide
- ✅ `TROUBLESHOOT_ADMIN_500.md` - RLS debugging guide

### Modified Files
- ✅ `src/App.jsx` - Added role-based routing
- ✅ `src/contexts/AuthContext.jsx` - Added role helpers
- ✅ `src/services/adminService.js` - Admin management functions
- ✅ `supabase/migrations/003_add_roles_and_rbac.sql` - RBAC migration

---

## Support

For issues or questions:

1. Check `RBAC_GUIDE.md` for complete RBAC documentation
2. Check `TROUBLESHOOT_ADMIN_500.md` for RLS errors
3. Check Supabase Dashboard → Logs for database errors
4. Verify user roles with: `SELECT id, email, role FROM profiles`

---

**Status**: ✅ Ready for testing

**Version**: 1.0

**Last Updated**: 2025-11-13
