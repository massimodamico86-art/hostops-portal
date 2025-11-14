// Guest helper utilities

/**
 * Get the active guest from a guest list based on current date
 * @param {Array} guestList - Array of guest objects with checkIn and checkOut dates
 * @returns {Object|null} The active guest or null if none found
 */
export const getActiveGuest = (guestList = []) => {
  if (!Array.isArray(guestList) || guestList.length === 0) {
    return null;
  }

  const now = new Date();
  const today = now.toISOString().split('T')[0];

  return guestList.find((g) => {
    const checkIn = g.checkIn || g.check_in;
    const checkOut = g.checkOut || g.check_out;
    return checkIn <= today && checkOut >= today;
  }) || null;
};

/**
 * Format guest data for layout components
 * @param {Object|null} guest - Guest object with firstName/first_name and lastName/last_name
 * @returns {Object|null} Formatted guest data with guest_first and guest_last or null
 */
export const formatGuestData = (guest) => {
  if (!guest) return null;

  // Support both camelCase and snake_case property names
  const firstName = guest.firstName || guest.first_name || guest.guest_first || '';
  const lastName = guest.lastName || guest.last_name || guest.guest_last || '';

  return {
    guest_first: firstName,
    guest_last: lastName
  };
};

/**
 * Get active guest formatted for layout components
 * @param {Array} guestList - Array of guest objects
 * @returns {Object|null} Formatted guest data or null
 */
export const getActiveGuestForLayout = (guestList) => {
  const activeGuest = getActiveGuest(guestList);
  return formatGuestData(activeGuest);
};

/**
 * Replace guest placeholders in text with actual guest data
 * @param {string} text - Text containing placeholders like {{first-name}}, {{last-name}}
 * @param {Object|null} guest - Guest object with firstName/first_name and lastName/last_name
 * @returns {string} Text with placeholders replaced
 */
export const replaceGuestPlaceholders = (text, guest) => {
  if (!text || !guest) return text;

  // Support both camelCase and snake_case property names
  const firstName = guest.firstName || guest.first_name || guest.guest_first || '';
  const lastName = guest.lastName || guest.last_name || guest.guest_last || '';

  return text
    .replace(/\{\{first-name\}\}/gi, firstName)
    .replace(/\{\{last-name\}\}/gi, lastName);
};
