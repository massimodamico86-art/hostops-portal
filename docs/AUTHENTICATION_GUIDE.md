# Authentication System - Complete Guide

## 🔐 Overview

The HostOps Portal now has a **production-grade authentication system** powered by Supabase with the following features:

✅ **Email/Password Authentication**
✅ **Password Reset via Email**
✅ **Email Verification**
✅ **OAuth Provider (Google)**
✅ **Secure Session Management**
✅ **Row Level Security (RLS)**

---

## 🎯 Features

### 1. **Email/Password Sign Up & Login**
- Users can create accounts with email and password
- Password must be at least 6 characters
- Automatic profile creation in database
- Email verification sent automatically

### 2. **Forgot Password / Password Reset**
- Users can request password reset via email
- Secure reset link sent to user's email
- Link expires after set time period
- New password must meet minimum requirements

### 3. **OAuth Sign In**
- **Google Sign In** - One-click authentication
- Automatic account creation on first OAuth login
- Profile synced with Google account

### 4. **Email Verification**
- Verification email sent on sign up
- Users can resend verification email
- Optional: Enforce verification before access

### 5. **Session Management**
- Secure JWT tokens
- Automatic session refresh
- Persistent sessions across browser sessions
- Secure logout

---

## 🚀 Quick Start

### **For End Users:**

1. **Sign Up**:
   - Go to http://localhost:5176/
   - Click "Don't have an account? Sign up"
   - Enter your details
   - Check email for verification link

2. **Sign In**:
   - Enter email and password
   - Or click "Continue with Google"
   - Access granted to dashboard

3. **Forgot Password**:
   - Click "Forgot your password?"
   - Enter your email
   - Check email for reset link
   - Click link and enter new password

---

## ⚙️ Setup for Developers

### **Step 1: Supabase Email Configuration**

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Email Templates**
3. Customize email templates (optional):
   - **Confirm signup**: Verification email
   - **Reset password**: Password reset email
   - **Magic Link**: Magic link login (if enabled)

### **Step 2: Configure Email Settings**

1. In Supabase Dashboard → **Authentication** → **Settings**
2. **Site URL**: Set to your production URL (e.g., `https://yourapp.com`)
3. **Redirect URLs**: Add allowed redirect URLs:
   ```
   http://localhost:5176/*
   https://yourapp.com/*
   ```

### **Step 3: Enable Google OAuth**

#### **Google OAuth Setup:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure consent screen:
   - Application name: "HostOps"
   - Support email: your email
   - Add scopes: email, profile
6. Create OAuth Client:
   - Application type: **Web application**
   - Authorized redirect URIs:
     ```
     https://your-project.supabase.co/auth/v1/callback
     ```
7. Copy **Client ID** and **Client Secret**
8. In Supabase Dashboard → **Authentication** → **Providers**
9. Enable **Google**
10. Paste Client ID and Client Secret
11. Click **Save**

### **Step 4: Email Verification Settings**

In Supabase Dashboard → **Authentication** → **Settings**:

**Option A: Optional Verification** (Recommended for development)
- **Enable email confirmations**: ON
- **Secure email change**: ON
- Users can log in without verifying, but receive reminder

**Option B: Required Verification** (Recommended for production)
- **Enable email confirmations**: ON
- **Require email verification**: ON
- Users must verify before accessing app

---

## 📱 User Interface

### **Login Page**

```
┌─────────────────────────────────┐
│         hostOps Logo            │
│     Welcome back                │
│ Sign in to access your dashboard│
├─────────────────────────────────┤
│  Email: [________________]      │
│  Password: [____________]       │
│  [      Sign In      ]          │
│                                 │
│  Forgot your password?          │
├─────────────────────────────────┤
│    Or continue with             │
│  [  Continue with Google  ]     │
├─────────────────────────────────┤
│  Don't have an account?         │
│       Sign up                   │
└─────────────────────────────────┘
```

### **Sign Up Page**

```
┌─────────────────────────────────┐
│         hostOps Logo            │
│   Create your account           │
│ Sign up to get started          │
├─────────────────────────────────┤
│  Full Name: [___________]       │
│  Email: [________________]      │
│  Password: [____________]       │
│  [      Sign Up      ]          │
├─────────────────────────────────┤
│    Or continue with             │
│  [  Continue with Google  ]     │
├─────────────────────────────────┤
│  Already have an account?       │
│       Sign in                   │
└─────────────────────────────────┘
```

### **Forgot Password Page**

```
┌─────────────────────────────────┐
│         hostOps Logo            │
│   Reset your password           │
│ Enter your email and we'll      │
│     send you a reset link       │
├─────────────────────────────────┤
│  Email: [________________]      │
│  [   Send Reset Link   ]        │
├─────────────────────────────────┤
│  Remember your password?        │
│       Sign in                   │
└─────────────────────────────────┘
```

### **Reset Password Page**

```
┌─────────────────────────────────┐
│         hostOps Logo            │
│    Set new password             │
│  Enter your new password below  │
├─────────────────────────────────┤
│  New Password: [________]       │
│  Confirm Password: [____]       │
│  [   Update Password   ]        │
├─────────────────────────────────┤
│  Password Requirements:         │
│  • At least 6 characters        │
│  • Passwords must match         │
└─────────────────────────────────┘
```

---

## 🔒 Security Features

### **1. Password Security**
- Passwords hashed with bcrypt
- Minimum 6 characters (configurable in Supabase)
- Never stored in plain text
- Secure password reset flow

### **2. Session Security**
- JWT tokens with expiration
- Secure HTTP-only cookies (when configured)
- Automatic token refresh
- Logout clears all tokens

### **3. Row Level Security (RLS)**
- Users can only see their own data
- Database-level access control
- Prevents data leakage
- Applied to all tables

### **4. OAuth Security**
- State parameter for CSRF protection
- Secure redirect URLs
- Token validation
- Profile verification

### **5. Email Verification**
- Prevents fake account creation
- Verifies email ownership
- Optional or required (configurable)
- Resend verification option

---

## 🧪 Testing the Authentication Flow

### **Test 1: Email/Password Sign Up**

1. Go to http://localhost:5176/
2. Click "Don't have an account? Sign up"
3. Enter:
   - Full Name: "Test User"
   - Email: "test@example.com"
   - Password: "test123456"
4. Click "Sign Up"
5. Expected: "Account created! Please check your email for verification."
6. Check email inbox (or Supabase logs if email not configured)
7. Click verification link
8. Expected: Redirected to login, can now sign in

### **Test 2: Sign In**

1. Go to http://localhost:5176/
2. Enter credentials
3. Click "Sign In"
4. Expected: Redirected to dashboard

### **Test 3: Forgot Password**

1. Go to http://localhost:5176/
2. Click "Forgot your password?"
3. Enter your email
4. Click "Send Reset Link"
5. Expected: "Password reset email sent! Please check your inbox."
6. Check email inbox
7. Click reset link
8. Enter new password twice
9. Click "Update Password"
10. Expected: "Password Reset Successful!" → Redirected to dashboard

### **Test 4: OAuth Sign In (Google)**

1. Go to http://localhost:5176/
2. Click "Continue with Google"
3. Select Google account
4. Grant permissions
5. Expected: Redirected back to app, logged in automatically

### **Test 5: Sign Out**

1. While logged in, click profile icon
2. Click "Sign Out"
3. Expected: "Signed out successfully" → Redirected to login page

---

## 🐛 Troubleshooting

### **Issue: "Invalid login credentials"**

**Causes**:
- Wrong email or password
- Account doesn't exist
- Email not verified (if required)

**Solutions**:
- Double-check email and password
- Click "Forgot your password?" to reset
- Check email for verification link
- Create new account if needed

### **Issue: "Email not confirmed"**

**Cause**: Email verification required but not completed

**Solution**:
- Check inbox for verification email
- Click verification link
- Or resend verification email from settings

### **Issue: OAuth doesn't work**

**Causes**:
- OAuth provider not configured in Supabase
- Redirect URLs not whitelisted
- Provider credentials incorrect

**Solutions**:
- Verify OAuth setup in Supabase Dashboard
- Check Client ID and Secret are correct
- Ensure redirect URL matches exactly
- Test with a different provider

### **Issue: Password reset email not received**

**Causes**:
- Email in spam folder
- Email service not configured
- Wrong email address

**Solutions**:
- Check spam/junk folder
- Verify email address is correct
- Configure SMTP in Supabase (for production)
- Check Supabase logs for email sending errors

### **Issue: "User already registered"**

**Cause**: Email already has an account

**Solution**:
- Use "Sign in" instead of "Sign up"
- Or use "Forgot password" to reset

---

## 📊 Database Schema

### **auth.users** (Supabase Managed)
- `id` - User UUID
- `email` - User email
- `encrypted_password` - Hashed password
- `email_confirmed_at` - Verification timestamp
- `last_sign_in_at` - Last login
- `created_at` - Account creation

### **public.profiles** (Custom)
- `id` - Links to auth.users.id
- `email` - User email
- `full_name` - Display name
- `avatar_url` - Profile picture
- `role` - User role (user, admin)
- `created_at` - Profile creation
- `updated_at` - Last update

---

## 🎨 Customization

### **Change Password Requirements**

In Supabase Dashboard → **Authentication** → **Settings**:
- **Minimum password length**: Default 6, increase for security
- **Password strength**: None, Weak, Fair, Good, Strong

### **Customize Email Templates**

In Supabase Dashboard → **Authentication** → **Email Templates**:

Edit templates with variables:
- `{{ .ConfirmationURL }}` - Verification link
- `{{ .Token }}` - Reset token
- `{{ .SiteURL }}` - Your app URL
- `{{ .Email }}` - User email

### **Add More OAuth Providers (Optional)**

Supabase supports additional providers:
- Azure
- Bitbucket
- Discord
- Facebook
- GitHub
- GitLab
- LinkedIn
- Slack
- Spotify
- Twitch
- Twitter

Follow similar setup process as Google.

---

## 🚀 Production Checklist

Before deploying to production:

- [ ] Configure custom SMTP for emails
- [ ] Set production Site URL in Supabase
- [ ] Add production redirect URLs
- [ ] Enable email verification requirement
- [ ] Set strong password requirements (min 8+ characters)
- [ ] Configure OAuth with production redirect URLs
- [ ] Test all authentication flows
- [ ] Set up email monitoring
- [ ] Configure rate limiting (Supabase handles this)
- [ ] Enable 2FA for admin accounts (future feature)
- [ ] Review and test RLS policies
- [ ] Set up error monitoring (Sentry, etc.)

---

## 📞 Support

**Email Issues**: Check Supabase Dashboard → **Authentication** → **Logs**
**OAuth Issues**: Verify provider configuration and redirect URLs
**Password Reset**: Ensure SMTP configured for production
**RLS Issues**: Check policies in Supabase Dashboard → **Database** → **Policies**

---

## 📚 Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [OAuth Setup Guides](https://supabase.com/docs/guides/auth/social-login)
- [Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)

---

**Authentication System Version**: 2.0
**Last Updated**: 2025-11-12
**Status**: ✅ Production Ready
