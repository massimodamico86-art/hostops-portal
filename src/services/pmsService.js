// PMS Integration Service - Connect to Airbnb, Booking.com, VRBO
import { supabase } from '../supabase';

/**
 * PMS Provider Types
 */
export const PMS_PROVIDERS = {
  AIRBNB: 'airbnb',
  BOOKING: 'booking',
  VRBO: 'vrbo',
  GUESTY: 'guesty',
  HOSPITABLE: 'hospitable',
  HOSTAWAY: 'hostaway'
};

/**
 * Sync status types
 */
export const SYNC_STATUS = {
  IDLE: 'idle',
  SYNCING: 'syncing',
  SUCCESS: 'success',
  ERROR: 'error'
};

/**
 * Get PMS connection for a listing
 * @param {string} listingId - The listing ID
 * @returns {Promise<object>} - PMS connection details
 */
export async function getPMSConnection(listingId) {
  const { data, error } = await supabase
    .from('pms_connections')
    .select('*')
    .eq('listing_id', listingId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data;
}

/**
 * Save PMS connection credentials
 * @param {string} listingId - The listing ID
 * @param {string} provider - PMS provider name
 * @param {object} credentials - API credentials
 * @returns {Promise<object>} - Saved connection
 */
export async function savePMSConnection(listingId, provider, credentials) {
  // Check if connection already exists
  const existing = await getPMSConnection(listingId);

  const connectionData = {
    listing_id: listingId,
    provider,
    credentials: credentials, // Encrypted in production
    is_active: true,
    last_sync: null
  };

  if (existing) {
    // Update existing connection
    const { data, error } = await supabase
      .from('pms_connections')
      .update(connectionData)
      .eq('listing_id', listingId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    // Create new connection
    const { data, error } = await supabase
      .from('pms_connections')
      .insert([connectionData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

/**
 * Test PMS connection
 * @param {string} provider - PMS provider
 * @param {object} credentials - API credentials
 * @returns {Promise<boolean>} - Connection success
 */
export async function testPMSConnection(provider, credentials) {
  try {
    // In production, this would make actual API calls to test credentials
    // For now, we'll simulate the connection test

    switch (provider) {
      case PMS_PROVIDERS.AIRBNB:
        return testAirbnbConnection(credentials);

      case PMS_PROVIDERS.BOOKING:
        return testBookingConnection(credentials);

      case PMS_PROVIDERS.VRBO:
        return testVRBOConnection(credentials);

      case PMS_PROVIDERS.GUESTY:
        return testGuestyConnection(credentials);

      case PMS_PROVIDERS.HOSPITABLE:
        return testHospitableConnection(credentials);

      case PMS_PROVIDERS.HOSTAWAY:
        return testHostawayConnection(credentials);

      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  } catch (error) {
    console.error('PMS connection test failed:', error);
    return false;
  }
}

/**
 * Sync reservations from PMS
 * @param {string} listingId - The listing ID
 * @returns {Promise<object>} - Sync result with imported count
 */
export async function syncReservations(listingId) {
  const connection = await getPMSConnection(listingId);

  if (!connection || !connection.is_active) {
    throw new Error('No active PMS connection found for this listing');
  }

  try {
    // Fetch reservations from PMS provider
    let reservations = [];

    switch (connection.provider) {
      case PMS_PROVIDERS.AIRBNB:
        reservations = await fetchAirbnbReservations(connection.credentials);
        break;

      case PMS_PROVIDERS.BOOKING:
        reservations = await fetchBookingReservations(connection.credentials);
        break;

      case PMS_PROVIDERS.VRBO:
        reservations = await fetchVRBOReservations(connection.credentials);
        break;

      case PMS_PROVIDERS.GUESTY:
        reservations = await fetchGuestyReservations(connection.credentials);
        break;

      case PMS_PROVIDERS.HOSPITABLE:
        reservations = await fetchHospitableReservations(connection.credentials);
        break;

      case PMS_PROVIDERS.HOSTAWAY:
        reservations = await fetchHostawayReservations(connection.credentials);
        break;

      default:
        throw new Error(`Unknown provider: ${connection.provider}`);
    }

    // Import reservations into guests table
    const result = await importReservationsToGuests(listingId, reservations);

    // Update last sync timestamp
    await supabase
      .from('pms_connections')
      .update({ last_sync: new Date().toISOString() })
      .eq('listing_id', listingId);

    return result;
  } catch (error) {
    console.error('PMS sync failed:', error);
    throw error;
  }
}

/**
 * Import reservations into guests table
 * @param {string} listingId - The listing ID
 * @param {Array} reservations - Array of reservation objects
 * @returns {Promise<object>} - Import result
 */
async function importReservationsToGuests(listingId, reservations) {
  const results = {
    imported: 0,
    skipped: 0,
    errors: []
  };

  for (const reservation of reservations) {
    try {
      // Check if guest already exists
      const { data: existing } = await supabase
        .from('guests')
        .select('id')
        .eq('listing_id', listingId)
        .eq('check_in', reservation.checkIn)
        .eq('check_out', reservation.checkOut)
        .limit(1);

      if (existing && existing.length > 0) {
        results.skipped++;
        continue;
      }

      // Insert new guest
      const { error } = await supabase
        .from('guests')
        .insert([{
          listing_id: listingId,
          first_name: reservation.firstName,
          last_name: reservation.lastName,
          email: reservation.email || '',
          phone: reservation.phone || '',
          check_in: reservation.checkIn,
          check_out: reservation.checkOut,
          language: reservation.language || 'English',
          special_requests: reservation.specialRequests || '',
          notes: `Imported from ${reservation.source || 'PMS'}`
        }]);

      if (error) {
        results.errors.push(`Error importing ${reservation.firstName}: ${error.message}`);
        results.skipped++;
      } else {
        results.imported++;
      }
    } catch (error) {
      results.errors.push(`Error processing reservation: ${error.message}`);
      results.skipped++;
    }
  }

  return results;
}

// ==================== Provider-specific implementations ====================

/**
 * Test Airbnb connection
 */
async function testAirbnbConnection(credentials) {
  // Placeholder - In production, make actual Airbnb API call
  // Airbnb doesn't have a public API, would need to use iCal or partner API
  return credentials.apiKey && credentials.apiKey.length > 0;
}

/**
 * Fetch Airbnb reservations
 */
async function fetchAirbnbReservations(credentials) {
  // Placeholder - In production, fetch from Airbnb API or iCal
  // For now, return empty array
  return [];
}

/**
 * Test Booking.com connection
 */
async function testBookingConnection(credentials) {
  // Placeholder - In production, make actual Booking.com API call
  return credentials.hotelId && credentials.apiKey && credentials.apiKey.length > 0;
}

/**
 * Fetch Booking.com reservations
 */
async function fetchBookingReservations(credentials) {
  // Placeholder - In production, fetch from Booking.com API
  return [];
}

/**
 * Test VRBO connection
 */
async function testVRBOConnection(credentials) {
  // Placeholder - In production, make actual VRBO API call
  return credentials.propertyId && credentials.apiKey && credentials.apiKey.length > 0;
}

/**
 * Fetch VRBO reservations
 */
async function fetchVRBOReservations(credentials) {
  // Placeholder - In production, fetch from VRBO API
  return [];
}

/**
 * Test Guesty connection
 */
async function testGuestyConnection(credentials) {
  // Placeholder - Guesty has a proper API
  return credentials.apiKey && credentials.apiKey.length > 0;
}

/**
 * Fetch Guesty reservations
 */
async function fetchGuestyReservations(credentials) {
  // Placeholder - In production, fetch from Guesty API
  // Guesty API endpoint: https://api.guesty.com/api/v1/reservations
  return [];
}

/**
 * Test Hospitable connection
 */
async function testHospitableConnection(credentials) {
  // Placeholder - Hospitable has a proper API
  return credentials.apiKey && credentials.apiKey.length > 0;
}

/**
 * Fetch Hospitable reservations
 */
async function fetchHospitableReservations(credentials) {
  // Placeholder - In production, fetch from Hospitable API
  return [];
}

/**
 * Test Hostaway connection
 */
async function testHostawayConnection(credentials) {
  // Placeholder - Hostaway has a proper API
  return credentials.apiKey && credentials.accountId && credentials.apiKey.length > 0;
}

/**
 * Fetch Hostaway reservations
 */
async function fetchHostawayReservations(credentials) {
  // Placeholder - In production, fetch from Hostaway API
  // Hostaway API endpoint: https://api.hostaway.com/v1/reservations
  return [];
}

/**
 * Disconnect PMS integration
 * @param {string} listingId - The listing ID
 * @returns {Promise<void>}
 */
export async function disconnectPMS(listingId) {
  const { error } = await supabase
    .from('pms_connections')
    .update({ is_active: false })
    .eq('listing_id', listingId);

  if (error) throw error;
}
