# Role-Based Access Control (RBAC) - Complete Guide

## 🎯 Overview

The HostOps Portal now has a **multi-tenant role-based access control system** that supports remote admin management with the following hierarchy:

```
┌─────────────────────────────────────┐
│         SUPER ADMIN (You)           │
│  - Full system access               │
│  - Manages all users                │
│  - Assigns clients to admins        │
└──────────────┬──────────────────────┘
               │
       ┌───────┴───────┐
       │               │
┌──────▼──────┐ ┌─────▼──────┐
│    ADMIN    │ │   ADMIN    │
│   (Remote)  │ │  (Remote)  │
│             │ │            │
│  Manages    │ │  Manages   │
│  assigned   │ │  assigned  │
│  clients    │ │  clients   │
└──────┬──────┘ └─────┬──────┘
       │               │
   ┌───┴───┐       ┌───┴───┐
   │       │       │       │
┌──▼──┐ ┌─▼──┐ ┌─▼──┐ ┌──▼──┐
│Client│ │Client│ │Client│ │Client│
└──────┘ └────┘ └────┘ └────┘
```

---

## 🔐 User Roles

### 1. **Super Admin**
**Role**: `super_admin`

**Permissions**:
- ✅ View ALL users, listings, guests
- ✅ Create/edit/delete ANY user
- ✅ Create admin accounts
- ✅ Assign clients to admins
- ✅ View all activity logs
- ✅ Full system access

**Use Case**: System owner (you)

---

### 2. **Admin**
**Role**: `admin`

**Permissions**:
- ✅ View only ASSIGNED clients
- ✅ View/edit listings for assigned clients
- ✅ Manage guests for assigned clients
- ✅ Configure PMS for assigned clients
- ❌ Cannot see other admins' clients
- ❌ Cannot delete users
- ❌ Cannot assign clients

**Use Case**: Remote admin managing multiple property owners

---

### 3. **Client**
**Role**: `client`

**Permissions**:
- ✅ View only OWN listings
- ✅ Manage own guests
- ✅ Configure own PMS
- ❌ Cannot see other clients
- ❌ Cannot access admin features

**Use Case**: Property owner managing their properties

---

## 📊 Database Schema

### **profiles table**
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'client'
    CHECK (role IN ('super_admin', 'admin', 'client')),
  managed_by UUID REFERENCES profiles(id),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Fields**:
- `role`: User's role (super_admin, admin, or client)
- `managed_by`: For clients only - the admin managing this client (NULL for super_admin and admin)

---

## 🚀 Setup Instructions

### Step 1: Run the Migration

You need to run the SQL migration to add RBAC to your Supabase database.

**Option A: Supabase Dashboard (Recommended)**

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Open the file: `supabase/migrations/003_add_roles_and_rbac.sql`
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run**
7. Verify no errors

**Option B: Supabase CLI**

```bash
# If you have Supabase CLI installed
supabase db push
```

### Step 2: Make Yourself Super Admin

After running the migration, you need to promote your account to super_admin:

```sql
-- Replace 'your@email.com' with your actual email
UPDATE profiles
SET role = 'super_admin'
WHERE email = 'your@email.com';
```

Run this in Supabase Dashboard → SQL Editor.

### Step 3: Verify Setup

```sql
-- Check your role
SELECT id, email, role FROM profiles WHERE email = 'your@email.com';

-- Should return role = 'super_admin'
```

---

## 👥 User Management

### Creating an Admin User

**As Super Admin**, you can create admin accounts:

```javascript
import { createAdminUser } from './services/adminService';

// Create admin
await createAdminUser(
  'admin@example.com',
  'secure_password_123',
  'Admin Name'
);
```

### Creating a Client User

**As Super Admin or Admin**:

```javascript
import { createClientUser } from './services/adminService';

// Create unassigned client (super_admin only)
await createClientUser(
  'client@example.com',
  'password123',
  'Client Name'
);

// Create client and assign to current admin
await createClientUser(
  'client@example.com',
  'password123',
  'Client Name',
  currentAdminId
);
```

### Assigning Clients to Admins

**As Super Admin**:

```javascript
import { assignClientToAdmin } from './services/adminService';

await assignClientToAdmin(clientId, adminId);
```

---

## 🔒 Row Level Security (RLS)

The system uses Supabase RLS policies to enforce access control at the database level.

### Profiles Access

```sql
-- Super admins see everything
-- Admins see their profile + assigned clients
-- Clients see only themselves
```

### Listings Access

```sql
-- Super admins see all listings
-- Admins see listings of assigned clients
-- Clients see only own listings
```

### Guests Access

```sql
-- Super admins see all guests
-- Admins see guests of assigned clients' listings
-- Clients see guests of own listings
```

---

## 💻 Frontend Integration

### Checking User Role

```javascript
import { useAuth } from './contexts/AuthContext';

function MyComponent() {
  const { user Profile, isSuperAdmin, isAdmin, isClient } = useAuth();

  if (isSuperAdmin) {
    return <SuperAdminDashboard />;
  }

  if (isAdmin) {
    return <AdminDashboard />;
  }

  return <ClientDashboard />;
}
```

### Role-Based Rendering

```javascript
{isSuperAdmin && (
  <button onClick={createAdmin}>Create Admin</button>
)}

{(isSuperAdmin || isAdmin) && (
  <button onClick={viewClientListings}>View Client Listings</button>
)}
```

---

## 📝 Common Operations

### For Super Admin:

```javascript
// Get all users
const users = await getAllUsers();

// Get all admins
const admins = await getAllAdmins();

// Get all clients
const clients = await getAllClients();

// Get unassigned clients
const unassigned = await getUnassignedClients();

// Assign client to admin
await assignClientToAdmin(clientId, adminId);

// Unassign client
await unassignClient(clientId);

// Change user role
await updateUserRole(userId, 'admin');
```

### For Admin:

```javascript
// Get my assigned clients
const myClients = await getMyClients();

// Get all listings for my clients
const listings = await getAllManagedListings();

// Get specific client's listings
const clientListings = await getClientListings(clientId);
```

---

## 🧪 Testing the System

### Test 1: Super Admin Access

1. Log in as super admin
2. Navigate to Admin Management page
3. Verify you can see all users
4. Try creating an admin user
5. Try assigning clients to admins

### Test 2: Admin Access

1. Create an admin account
2. Assign some clients to this admin
3. Log in as the admin
4. Verify you only see assigned clients
5. Try to edit a client's listing
6. Verify you cannot see other admins' clients

### Test 3: Client Access

1. Create a client account
2. Log in as the client
3. Create some listings
4. Verify you only see your own listings
5. Try to access admin features (should be hidden/blocked)

### Test 4: Assignment Changes

1. As super admin, assign a client to Admin A
2. Admin A should see the client
3. Reassign the client to Admin B
4. Admin A should no longer see the client
5. Admin B should now see the client

---

## 🔐 Security Features

### Database-Level Security
- ✅ RLS policies enforce access at database level
- ✅ Cannot bypass security from client-side code
- ✅ All queries filtered by user role automatically

### Audit Trail
- ✅ All actions logged in activity_log table
- ✅ Track who did what and when
- ✅ Super admin can view all activity

### Isolation
- ✅ Admins cannot see each other's clients
- ✅ Clients cannot see other clients
- ✅ No data leakage between tenants

---

## 📊 Admin Management Page

The Admin Management page provides:

1. **User Overview**
   - Total users count
   - Breakdown by role
   - Unassigned clients count

2. **Admin List**
   - All admin users
   - Client count per admin
   - Actions: View clients, Delete

3. **Client Management**
   - All clients list
   - Assignment status
   - Actions: Assign to admin, Edit, Delete

4. **Quick Actions**
   - Create admin user
   - Create client user
   - Bulk assign clients

---

## 🚨 Important Notes

### DO:
- ✅ Always run migrations in a test environment first
- ✅ Backup your database before running migrations
- ✅ Test role-based access thoroughly
- ✅ Use strong passwords for admin accounts
- ✅ Regularly review admin assignments

### DON'T:
- ❌ Manually edit the `role` field without understanding RLS
- ❌ Give super_admin role to untrusted users
- ❌ Delete users without checking their data first
- ❌ Bypass RLS policies (security risk)

---

## 🐛 Troubleshooting

### Issue: "Permission denied" errors

**Cause**: RLS policies not properly applied

**Solution**:
1. Check if migration ran successfully
2. Verify your user role: `SELECT role FROM profiles WHERE id = auth.uid()`
3. Check RLS policies are enabled: Supabase Dashboard → Database → Tables → profiles → Policies

### Issue: Admin can't see assigned clients

**Cause**: Client not properly assigned or RLS policy issue

**Solution**:
```sql
-- Check client assignment
SELECT id, email, role, managed_by
FROM profiles
WHERE role = 'client';

-- Verify managed_by points to correct admin
```

### Issue: Client can see other clients' data

**Cause**: RLS policies not working

**Solution**:
1. Verify RLS is enabled on all tables
2. Check policies are active
3. Re-run migration if needed

---

## 🎓 Best Practices

1. **Admin Assignment**
   - Assign clients to admins based on geographic region or workload
   - Balance client count across admins
   - Review assignments monthly

2. **Security**
   - Require 2FA for admin accounts (future feature)
   - Use strong passwords
   - Regularly audit admin activity
   - Revoke access immediately when admin leaves

3. **Onboarding**
   - Train admins on system usage
   - Provide clear documentation
   - Set expectations for response times
   - Regular check-ins with remote admins

4. **Monitoring**
   - Track admin activity
   - Monitor client satisfaction
   - Review system usage metrics
   - Identify bottlenecks

---

## 📚 API Reference

See [adminService.js](src/services/adminService.js) for complete API documentation.

Key Functions:
- `getAllUsers()` - Get all users (super_admin)
- `getAllAdmins()` - Get all admin users
- `getAllClients()` - Get all clients
- `getMyClients()` - Get assigned clients (admin)
- `createAdminUser()` - Create admin
- `createClientUser()` - Create client
- `assignClientToAdmin()` - Assign client to admin
- `unassignClient()` - Remove admin assignment
- `deleteUser()` - Delete user (super_admin)

---

## 🔄 Migration Path

If you have existing users:

```sql
-- Make all existing users clients by default
UPDATE profiles
SET role = 'client'
WHERE role IS NULL OR role = 'user';

-- Promote specific users to admin
UPDATE profiles
SET role = 'admin'
WHERE email IN ('admin1@example.com', 'admin2@example.com');

-- Make yourself super admin
UPDATE profiles
SET role = 'super_admin'
WHERE email = 'your@email.com';
```

---

## 📞 Support

**Database Issues**: Check Supabase Dashboard → Logs
**RLS Issues**: Verify policies in Supabase Dashboard → Database → Policies
**Access Issues**: Check user role with `SELECT role FROM profiles WHERE id = auth.uid()`

---

**RBAC System Version**: 1.0
**Last Updated**: 2025-11-13
**Status**: ✅ Ready for testing
