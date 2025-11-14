# PMS Integration Guide

## Overview

The hostOps Portal now supports direct integration with major Property Management Systems (PMS) and booking platforms. This allows you to automatically sync reservations, guest information, and availability directly into your hostOps dashboard.

## Supported Platforms

### Direct API Integration
- **Guesty** - Full API integration
- **Hospitable** - Full API integration
- **Hostaway** - Full API integration
- **Booking.com** - API integration via Hotel ID
- **VRBO / HomeAway** - API integration via Property ID

### iCal Integration
- **Airbnb** - Via iCal calendar export

## How to Connect

### 1. Navigate to PMS Integration
- Go to **PMS** in the sidebar
- Select the listing you want to connect
- Click **Connect PMS**

### 2. Select Your Platform
Choose your PMS provider from the available options:
- Airbnb
- Booking.com
- VRBO
- Guesty
- Hospitable
- Hostaway

### 3. Enter Credentials

#### Airbnb
1. Go to Airbnb → Settings → Calendar
2. Click "Export Calendar"
3. Copy the iCal URL
4. Paste into hostOps

#### Booking.com
1. Log into Booking.com Extranet
2. Go to Settings → API Settings
3. Copy your Hotel ID and API Key
4. Enter both in hostOps

#### VRBO / HomeAway
1. Log into VRBO account
2. Go to Account → API Access
3. Copy Property ID and API Key
4. Enter both in hostOps

#### Guesty
1. Log into Guesty
2. Go to Settings → API
3. Click "Generate API Key"
4. Copy the key
5. Paste into hostOps

#### Hospitable
1. Log into Hospitable
2. Go to Settings → Integrations → API
3. Generate an API key
4. Copy and paste into hostOps

#### Hostaway
1. Log into Hostaway
2. Go to Settings → API Access
3. Note your Account ID
4. Generate an API Key
5. Enter both in hostOps

### 4. Test Connection
- Click **Test Connection** button
- Verify credentials are correct
- If successful, proceed to save

### 5. Save & Sync
- Click **Save Connection**
- Click **Sync Now** to import reservations

## What Gets Synced

When you sync with a PMS, the following information is imported:

✅ **Guest Information**
- First name
- Last name
- Email address
- Phone number

✅ **Reservation Details**
- Check-in date
- Check-out date
- Special requests
- Booking notes

✅ **Automatic Updates**
- New reservations are synced
- Existing reservations are skipped (no duplicates)
- Canceled reservations are handled

## Sync Frequency

### Manual Sync
- Click **Sync Now** anytime to manually pull latest reservations
- Useful for immediate updates

### Automatic Sync (Coming Soon)
- Automatic sync every hour
- Webhook support for real-time updates
- Background sync notifications

## Managing Connections

### Reconfigure
- Update API credentials
- Change providers
- Test new connections

### Disconnect
- Remove PMS integration
- Keeps existing guest data
- Can reconnect anytime

## Troubleshooting

### Connection Failed
**Problem**: Test connection fails
**Solution**:
- Double-check API credentials
- Ensure API key has proper permissions
- Verify Account/Hotel/Property ID is correct
- Check if API key has expired

### No Reservations Imported
**Problem**: Sync completes but no guests appear
**Solution**:
- Verify reservations exist in your PMS
- Check date range (only future reservations imported)
- Ensure listing ID matches between PMS and hostOps
- Review sync errors in console

### Duplicate Guests
**Problem**: Same guest appears multiple times
**Solution**:
- hostOps automatically prevents duplicates by check-in/check-out dates
- If duplicates occur, manually delete extras
- Contact support if issue persists

## Security & Privacy

### Data Encryption
- All API credentials are encrypted in database
- Secure HTTPS connections only
- No plaintext storage

### Access Control
- Row Level Security (RLS) enforced
- Only listing owners can view/modify connections
- API keys never exposed in frontend

### Best Practices
- ✅ Use read-only API keys when possible
- ✅ Rotate API keys regularly
- ✅ Disconnect unused integrations
- ✅ Monitor sync logs for anomalies
- ❌ Never share API credentials
- ❌ Don't use admin-level API keys

## API Rate Limits

### Airbnb (iCal)
- No official rate limits
- Recommended: Sync max once per hour

### Booking.com
- 60 requests per minute
- 1000 requests per day

### VRBO
- 100 requests per minute
- No daily limit

### Guesty
- 60 requests per minute
- No daily limit

### Hospitable
- 120 requests per minute
- No daily limit

### Hostaway
- 300 requests per minute
- No daily limit

## Developer Notes

### Database Schema
```sql
CREATE TABLE pms_connections (
  id UUID PRIMARY KEY,
  listing_id UUID REFERENCES listings(id),
  provider TEXT NOT NULL,
  credentials JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_sync TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Service Methods
```javascript
// Test connection
await testPMSConnection(provider, credentials);

// Save connection
await savePMSConnection(listingId, provider, credentials);

// Sync reservations
await syncReservations(listingId);

// Disconnect
await disconnectPMS(listingId);
```

### Adding New Providers
1. Add provider to `PMS_PROVIDERS` constant
2. Implement `test{Provider}Connection()` function
3. Implement `fetch{Provider}Reservations()` function
4. Add provider to UI selection
5. Update documentation

## Support

### Getting Help
- Check troubleshooting section above
- Review browser console for errors
- Contact support with:
  - Provider name
  - Error messages
  - Screenshots
  - Sync timestamp

### Feature Requests
- Request new PMS integrations
- Suggest improvements
- Report bugs

## Roadmap

### Coming Soon
- ✨ Automatic hourly sync
- ✨ Webhook support
- ✨ Two-way sync (send updates back to PMS)
- ✨ Sync statistics dashboard
- ✨ Email notifications for sync failures
- ✨ Calendar availability sync
- ✨ Pricing sync

### Under Consideration
- Multi-calendar merge
- Conflict resolution
- Smart duplicate detection
- Batch operations
- Import historical data

---

**Last Updated**: 2025-01-12
**Version**: 1.0.0
