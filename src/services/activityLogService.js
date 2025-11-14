// Activity Log Service - Track user actions and changes
import { supabase } from '../supabase';

/**
 * Action types for activity log
 */
export const ACTION_TYPES = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LOGIN: 'login',
  LOGOUT: 'logout',
  SYNC: 'sync',
  EXPORT: 'export',
  IMPORT: 'import',
  CONNECT: 'connect',
  DISCONNECT: 'disconnect'
};

/**
 * Entity types for activity log
 */
export const ENTITY_TYPES = {
  LISTING: 'listing',
  GUEST: 'guest',
  TV_DEVICE: 'tv_device',
  QR_CODE: 'qr_code',
  PMS_CONNECTION: 'pms_connection',
  USER: 'user',
  SETTINGS: 'settings'
};

/**
 * Log an activity
 * @param {string} actionType - Type of action performed
 * @param {string} entityType - Type of entity affected
 * @param {string} entityId - ID of the entity (optional)
 * @param {string} entityName - Human-readable name (optional)
 * @param {object} details - Additional details (optional)
 * @returns {Promise<string>} - Log ID
 */
export async function logActivity(actionType, entityType, entityId = null, entityName = null, details = null) {
  try {
    const { data, error } = await supabase.rpc('log_activity', {
      p_action_type: actionType,
      p_entity_type: entityType,
      p_entity_id: entityId,
      p_entity_name: entityName,
      p_details: details
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error logging activity:', error);
    // Don't throw - logging failures shouldn't break the app
    return null;
  }
}

/**
 * Get activity log for current user
 * @param {object} options - Query options
 * @returns {Promise<Array>} - Activity log entries
 */
export async function getActivityLog(options = {}) {
  const {
    limit = 50,
    offset = 0,
    actionType = null,
    entityType = null,
    startDate = null,
    endDate = null
  } = options;

  try {
    let query = supabase
      .from('activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (actionType) {
      query = query.eq('action_type', actionType);
    }

    if (entityType) {
      query = query.eq('entity_type', entityType);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching activity log:', error);
    throw error;
  }
}

/**
 * Get activity log for a specific entity
 * @param {string} entityType - Type of entity
 * @param {string} entityId - ID of the entity
 * @returns {Promise<Array>} - Activity log entries
 */
export async function getEntityActivityLog(entityType, entityId) {
  try {
    const { data, error } = await supabase
      .from('activity_log')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching entity activity log:', error);
    throw error;
  }
}

/**
 * Get activity log statistics
 * @returns {Promise<object>} - Statistics
 */
export async function getActivityStats() {
  try {
    // Get total activities
    const { count: totalActivities } = await supabase
      .from('activity_log')
      .select('*', { count: 'exact', head: true });

    // Get activities by type
    const { data: byType } = await supabase
      .from('activity_log')
      .select('action_type')
      .limit(1000);

    // Get activities today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count: todayCount } = await supabase
      .from('activity_log')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    // Count by action type
    const actionCounts = {};
    if (byType) {
      byType.forEach(item => {
        actionCounts[item.action_type] = (actionCounts[item.action_type] || 0) + 1;
      });
    }

    return {
      totalActivities: totalActivities || 0,
      todayActivities: todayCount || 0,
      byActionType: actionCounts
    };
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    throw error;
  }
}

/**
 * Format activity log entry for display
 * @param {object} activity - Activity log entry
 * @returns {object} - Formatted activity
 */
export function formatActivity(activity) {
  const actionIcons = {
    create: '➕',
    update: '✏️',
    delete: '🗑️',
    login: '🔓',
    logout: '🔒',
    sync: '🔄',
    export: '📤',
    import: '📥',
    connect: '🔗',
    disconnect: '🔌'
  };

  const actionColors = {
    create: 'text-green-600',
    update: 'text-blue-600',
    delete: 'text-red-600',
    login: 'text-purple-600',
    logout: 'text-gray-600',
    sync: 'text-orange-600',
    export: 'text-indigo-600',
    import: 'text-teal-600',
    connect: 'text-cyan-600',
    disconnect: 'text-pink-600'
  };

  const actionLabels = {
    create: 'Created',
    update: 'Updated',
    delete: 'Deleted',
    login: 'Logged in',
    logout: 'Logged out',
    sync: 'Synced',
    export: 'Exported',
    import: 'Imported',
    connect: 'Connected',
    disconnect: 'Disconnected'
  };

  const entityLabels = {
    listing: 'Listing',
    guest: 'Guest',
    tv_device: 'TV Device',
    qr_code: 'QR Code',
    pms_connection: 'PMS Connection',
    user: 'User',
    settings: 'Settings'
  };

  return {
    ...activity,
    icon: actionIcons[activity.action_type] || '📝',
    color: actionColors[activity.action_type] || 'text-gray-600',
    actionLabel: actionLabels[activity.action_type] || activity.action_type,
    entityLabel: entityLabels[activity.entity_type] || activity.entity_type,
    formattedTime: formatTime(activity.created_at)
  };
}

/**
 * Format timestamp
 */
function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}
