// iCal Service - Fetch and parse iCal feeds
import ICAL from 'ical.js';

/**
 * Fetch and parse iCal feed from URL
 * @param {string} icalUrl - The iCal URL to fetch
 * @returns {Promise<Array>} - Array of parsed events
 */
export async function fetchICalFeed(icalUrl) {
  if (!icalUrl) {
    throw new Error('iCal URL is required');
  }

  // Convert webcal:// to https://
  const url = icalUrl.replace(/^webcal:\/\//i, 'https://');

  try {
    // Fetch the iCal data
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch iCal feed: ${response.statusText}`);
    }

    const icalData = await response.text();

    // Parse the iCal data
    const events = parseICalData(icalData);

    return events;
  } catch (error) {
    console.error('Error fetching iCal feed:', error);
    throw new Error(`Failed to import iCal feed: ${error.message}`);
  }
}

/**
 * Parse iCal data string and extract events
 * @param {string} icalData - Raw iCal data
 * @returns {Array} - Array of parsed events
 */
export function parseICalData(icalData) {
  try {
    const jcalData = ICAL.parse(icalData);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents('vevent');

    const events = vevents.map(vevent => {
      const event = new ICAL.Event(vevent);

      // Extract guest name from summary (e.g., "Reserved - John Doe" or "John Doe")
      const summary = event.summary || '';
      let guestName = summary.replace(/^(Reserved|Blocked|Reservation)\s*-?\s*/i, '').trim();

      // Split name into first and last
      const nameParts = guestName.split(/\s+/);
      const firstName = nameParts[0] || 'Guest';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Get dates
      const checkIn = event.startDate?.toJSDate() || new Date();
      const checkOut = event.endDate?.toJSDate() || new Date();

      // Format dates as YYYY-MM-DD
      const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      return {
        firstName,
        lastName,
        email: '',
        phone: '',
        checkIn: formatDate(checkIn),
        checkOut: formatDate(checkOut),
        language: 'English',
        specialRequests: '',
        notes: `Imported from iCal: ${summary}`
      };
    });

    // Filter out events that are in the past or have invalid dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return events.filter(event => {
      const checkOut = new Date(event.checkOut);
      return checkOut >= today;
    });
  } catch (error) {
    console.error('Error parsing iCal data:', error);
    throw new Error(`Failed to parse iCal data: ${error.message}`);
  }
}

/**
 * Import iCal events into Supabase guests table
 * @param {string} icalUrl - The iCal URL to import from
 * @param {string} listingId - The listing ID to associate guests with
 * @param {object} supabase - Supabase client instance
 * @returns {Promise<object>} - Result with imported count and errors
 */
export async function importICalToGuests(icalUrl, listingId, supabase) {
  if (!icalUrl || !listingId || !supabase) {
    throw new Error('Missing required parameters');
  }

  try {
    // Fetch and parse iCal feed
    const events = await fetchICalFeed(icalUrl);

    if (events.length === 0) {
      return {
        imported: 0,
        skipped: 0,
        errors: [],
        message: 'No upcoming reservations found in iCal feed'
      };
    }

    const results = {
      imported: 0,
      skipped: 0,
      errors: []
    };

    // Import each event as a guest
    for (const event of events) {
      try {
        // Check if guest already exists for these dates
        const { data: existing, error: searchError } = await supabase
          .from('guests')
          .select('id')
          .eq('listing_id', listingId)
          .eq('check_in', event.checkIn)
          .eq('check_out', event.checkOut)
          .limit(1);

        if (searchError) {
          results.errors.push(`Error checking for existing guest: ${searchError.message}`);
          results.skipped++;
          continue;
        }

        // Skip if guest already exists for these dates
        if (existing && existing.length > 0) {
          results.skipped++;
          continue;
        }

        // Insert new guest
        const { error: insertError } = await supabase
          .from('guests')
          .insert([{
            listing_id: listingId,
            first_name: event.firstName,
            last_name: event.lastName,
            email: event.email,
            phone: event.phone,
            check_in: event.checkIn,
            check_out: event.checkOut,
            language: event.language,
            special_requests: event.specialRequests,
            notes: event.notes
          }]);

        if (insertError) {
          results.errors.push(`Error importing ${event.firstName} ${event.lastName}: ${insertError.message}`);
          results.skipped++;
        } else {
          results.imported++;
        }
      } catch (error) {
        results.errors.push(`Error processing event: ${error.message}`);
        results.skipped++;
      }
    }

    // Build result message
    let message = `Successfully imported ${results.imported} reservation(s)`;
    if (results.skipped > 0) {
      message += `, skipped ${results.skipped} (already exists or error)`;
    }

    return {
      ...results,
      message
    };
  } catch (error) {
    console.error('Error importing iCal feed:', error);
    throw error;
  }
}
