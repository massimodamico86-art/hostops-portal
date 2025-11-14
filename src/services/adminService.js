import { supabase } from '../supabase';

/**
 * Admin Management Service
 * Handles all admin-related operations including:
 * - Creating admin users
 * - Managing client assignments
 * - Viewing assigned clients
 */

/**
 * Get all users (super_admin only)
 */
export const getAllUsers = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

/**
 * Get all admin users (super_admin only)
 */
export const getAllAdmins = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'admin')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

/**
 * Get all client users (super_admin or admin)
 * If called by admin, only returns their assigned clients
 */
export const getAllClients = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'client')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

/**
 * Get clients assigned to current admin (admin only)
 */
export const getMyClients = async () => {
  const { data, error } = await supabase
    .from('admin_clients')
    .select('*');

  if (error) throw error;
  return data;
};

/**
 * Get unassigned clients (clients with no admin assigned)
 */
export const getUnassignedClients = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'client')
    .is('managed_by', null)
    .order('created_at', { ascending: false});

  if (error) throw error;
  return data;
};

/**
 * Create a new admin user (super_admin only)
 */
export const createAdminUser = async (email, password, fullName) => {
  // First create the auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: 'admin'
      }
    }
  });

  if (authError) throw authError;

  // Update the profile with admin role
  const { data, error } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', authData.user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Create a new client user (super_admin or admin)
 */
export const createClientUser = async (email, password, fullName, managedBy = null) => {
  // First create the auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: 'client'
      }
    }
  });

  if (authError) throw authError;

  // Update the profile with client role and optional admin assignment
  const updateData = { role: 'client' };
  if (managedBy) {
    updateData.managed_by = managedBy;
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', authData.user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Assign a client to an admin (super_admin only)
 */
export const assignClientToAdmin = async (clientId, adminId) => {
  const { error } = await supabase.rpc('assign_client_to_admin', {
    client_id: clientId,
    admin_id: adminId
  });

  if (error) throw error;

  // Return the updated client profile
  const { data, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', clientId)
    .single();

  if (fetchError) throw fetchError;
  return data;
};

/**
 * Unassign a client from their admin (super_admin only)
 */
export const unassignClient = async (clientId) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ managed_by: null })
    .eq('id', clientId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Update user role (super_admin only)
 */
export const updateUserRole = async (userId, newRole) => {
  // Validate role
  if (!['super_admin', 'admin', 'client'].includes(newRole)) {
    throw new Error('Invalid role');
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Delete user (super_admin only)
 * Note: This only updates the profile. Actual auth user deletion requires admin API
 */
export const deleteUser = async (userId) => {
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId);

  if (error) throw error;
};

/**
 * Get user statistics for admin dashboard
 */
export const getUserStatistics = async () => {
  // Get counts by role
  const { data: roleCounts, error: roleError } = await supabase
    .from('profiles')
    .select('role');

  if (roleError) throw roleError;

  const stats = {
    totalUsers: roleCounts.length,
    superAdmins: roleCounts.filter(u => u.role === 'super_admin').length,
    admins: roleCounts.filter(u => u.role === 'admin').length,
    clients: roleCounts.filter(u => u.role === 'client').length,
    unassignedClients: roleCounts.filter(u => u.role === 'client' && !u.managed_by).length
  };

  return stats;
};

/**
 * Get admin performance metrics (super_admin only)
 */
export const getAdminMetrics = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      email,
      role,
      created_at,
      managed_clients:profiles!managed_by(count)
    `)
    .eq('role', 'admin');

  if (error) throw error;
  return data;
};

/**
 * Get listings for a specific client (admin or super_admin)
 */
export const getClientListings = async (clientId) => {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('owner_id', clientId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

/**
 * Get all listings for clients managed by current admin
 */
export const getAllManagedListings = async () => {
  // Get current user's clients
  const clients = await getMyClients();
  const clientIds = clients.map(c => c.id);

  if (clientIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('listings')
    .select(`
      *,
      owner:profiles(id, full_name, email)
    `)
    .in('owner_id', clientIds)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};
