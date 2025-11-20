# Cloudinary Setup Guide

This guide will walk you through setting up Cloudinary for image uploads in HostOps Portal.

## Why Cloudinary?

Cloudinary provides:
- **Free Tier**: 25GB storage + 25GB bandwidth/month
- **Automatic Optimization**: WebP/AVIF conversion, quality optimization
- **Image Transformations**: Resize, crop, and format images on-the-fly
- **CDN Delivery**: Fast global content delivery
- **Easy Integration**: Upload widget works seamlessly with React

## Step 1: Create a Cloudinary Account

1. Go to [https://cloudinary.com/users/register/free](https://cloudinary.com/users/register/free)
2. Sign up with your email or GitHub account
3. Verify your email address
4. Complete your profile information

## Step 2: Get Your Cloud Name

1. After logging in, you'll be on the **Dashboard**
2. Look for the **Account Details** section at the top
3. Copy your **Cloud Name** (e.g., `dxy1234abc`)
4. Save this for later - you'll need it in Step 4

## Step 3: Create an Upload Preset

Upload presets define how images should be processed when uploaded.

### 3.1 Navigate to Upload Settings

1. Click the **Settings** icon (⚙️) in the top right
2. In the left sidebar, click **Upload**
3. Scroll down to the **Upload presets** section
4. Click **Add upload preset**

### 3.2 Configure the Upload Preset

**Preset name**: `hostops-unsigned` (or any name you prefer)

**Signing mode**:
- ✅ Select **Unsigned** (this allows client-side uploads without authentication)

**Folder**: `hostops` (optional - organizes uploads)

**Allowed formats**:
- jpg, jpeg, png, gif, webp

**Image transformations** (optional but recommended):
- Max file size: 10MB
- Quality: Auto
- Format: Auto

**Access mode**: Public (default)

### 3.3 Save the Preset

1. Click **Save** at the bottom
2. Copy the **Upload preset name** (e.g., `hostops-unsigned`)
3. Save this for later - you'll need it in Step 4

## Step 4: Configure Environment Variables

1. Open your `.env` file in the project root
2. Add your Cloudinary credentials:

```env
# Cloudinary Configuration
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset_here
```

3. Replace the values with your actual credentials:
   - `your_cloud_name_here` → Your Cloud Name from Step 2
   - `your_upload_preset_here` → Your Upload Preset name from Step 3

Example:
```env
VITE_CLOUDINARY_CLOUD_NAME=dxy1234abc
VITE_CLOUDINARY_UPLOAD_PRESET=hostops-unsigned
```

4. Save the `.env` file
5. Restart your dev server if it's running:
   ```bash
   # Press Ctrl+C to stop, then:
   npm run dev
   ```

## Step 5: Test the Integration

1. Start your development server (if not already running):
   ```bash
   npm run dev
   ```

2. Open the app in your browser (usually `http://localhost:5173`)

3. Navigate to **Listings** → Click on a listing → **Display** tab

4. Try uploading an image in any of these locations:
   - **Background Image**: Click "Upload from Computer"
   - **Carousel Media**: Click "Add Image"
   - **Logo**: Click "Upload"

5. The Cloudinary upload widget should open. You can:
   - Drag and drop an image
   - Click "Browse" to select a file
   - Paste an image URL
   - Take a photo with your camera (on mobile)

6. After upload, the image URL will be automatically inserted

## Troubleshooting

### Upload Widget Doesn't Open

**Problem**: Clicking upload button does nothing

**Solutions**:
1. Check browser console for errors (F12 → Console tab)
2. Verify the Cloudinary script is loaded:
   - Open `index.html`
   - Check for: `<script src="https://upload-widget.cloudinary.com/global/all.js">`
3. Restart the dev server

### "Cloudinary credentials not configured" Error

**Problem**: Toast message shows this error

**Solutions**:
1. Check your `.env` file has both variables set
2. Verify there are no typos in variable names:
   - Must be: `VITE_CLOUDINARY_CLOUD_NAME`
   - Must be: `VITE_CLOUDINARY_UPLOAD_PRESET`
3. Restart the dev server after changing `.env`

### Upload Fails with "Unauthorized" Error

**Problem**: Upload widget opens but upload fails

**Solutions**:
1. Verify your upload preset is **Unsigned**:
   - Go to Cloudinary Dashboard → Settings → Upload
   - Find your preset
   - Check "Signing Mode" is set to "Unsigned"
2. Double-check Cloud Name and Upload Preset in `.env`

### Images Not Loading After Upload

**Problem**: Upload succeeds but images don't display

**Solutions**:
1. Check that the upload preset's **Access Mode** is "Public"
2. Verify the image URL starts with `https://res.cloudinary.com/`
3. Check browser console for CORS errors

## Advanced Configuration

### Custom Upload Preset Settings

You can customize your upload preset for better optimization:

**Transformations**:
- **Quality**: Set to "Auto" for automatic quality optimization
- **Format**: Set to "Auto" for automatic format conversion (WebP, AVIF)
- **Eager transformations**: Pre-generate common sizes

**Restrictions**:
- **Max file size**: 10MB (10485760 bytes)
- **Max dimensions**: 4096 x 4096 pixels
- **Allowed formats**: jpg, jpeg, png, gif, webp

**Folder structure**:
- The app automatically organizes uploads:
  - `hostops/backgrounds/` - Background images
  - `hostops/carousel/` - Carousel images
  - `hostops/logos/` - Logo images

### Multiple Upload Presets

You can create different presets for different image types:

1. **Backgrounds**: Large images (1920x1080), high quality
2. **Logos**: Small images (400x400), PNG with transparency
3. **Carousel**: Medium images (1200x800), optimized for web

Just create multiple presets and update the `ImageUploadButton` components to use different presets.

## Security Considerations

### Why Unsigned Uploads?

- **Simplicity**: No backend API needed
- **Speed**: Direct client-to-Cloudinary uploads
- **Security**: Unsigned presets can still have restrictions (file size, formats, folders)

### Securing Your Upload Preset

Even though the preset is unsigned, you can secure it:

1. **Restrict allowed formats**: Only allow jpg, png, webp
2. **Set max file size**: Prevent abuse with large files
3. **Set max dimensions**: Limit image resolution
4. **Enable moderation**: Review uploads before they go live
5. **Rate limiting**: Cloudinary automatically rate-limits requests

### Monitoring Usage

1. Go to Cloudinary Dashboard
2. Click **Reports** → **Usage**
3. Monitor:
   - Storage used (GB)
   - Bandwidth used (GB)
   - Transformations
   - Requests

Free tier limits:
- **Storage**: 25 GB
- **Bandwidth**: 25 GB/month
- **Transformations**: 25,000/month

## Upgrading to Paid Plan

If you exceed free tier limits, you can upgrade:

- **Plus Plan**: $89/month
  - 50GB storage
  - 50GB bandwidth
  - 50,000 transformations

- **Advanced Plan**: $249/month
  - 150GB storage
  - 150GB bandwidth
  - 150,000 transformations

Visit [Cloudinary Pricing](https://cloudinary.com/pricing) for more details.

## Support

- **Cloudinary Documentation**: [https://cloudinary.com/documentation](https://cloudinary.com/documentation)
- **Upload Widget Docs**: [https://cloudinary.com/documentation/upload_widget](https://cloudinary.com/documentation/upload_widget)
- **Support**: [https://support.cloudinary.com](https://support.cloudinary.com)

## Next Steps

After setting up Cloudinary:

1. ✅ Upload background images for your listings
2. ✅ Add carousel images to showcase your property
3. ✅ Upload a logo for branding
4. 🔄 Consider setting up automatic image optimization
5. 🔄 Explore advanced transformations (filters, effects, etc.)

---

**Need Help?** If you encounter any issues, check the Troubleshooting section above or open an issue on GitHub.
