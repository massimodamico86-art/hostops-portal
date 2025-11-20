import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';

// Auth context for user authentication and profile management
const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Fetch user profile from Supabase including role information
   *
   * This function handles profile fetching with built-in error handling and retry logic.
   * It supports skipping unnecessary fetches if the profile is already loaded.
   *
   * @param {string} userId - The UUID of the user to fetch profile for
   * @param {string} userEmail - The user's email address (used for logging)
   * @param {boolean} [skipIfExists=false] - If true, skip fetch if profile already exists in state
   * @param {number} [retryCount=0] - Current retry attempt number (used for logging)
   *
   * @returns {Promise<void>} Updates userProfile state with either:
   *   - Profile data object: {id, email, full_name, role}
   *   - Error object: {error: true, errorMessage: string, errorCode: string}
   *
   * @example
   * // Fetch profile on initial login
   * await fetchUserProfile(user.id, user.email);
   *
   * @example
   * // Skip fetch if profile already loaded
   * await fetchUserProfile(user.id, user.email, true);
   *
   * Error Codes:
   * - PGRST116: Profile not found in database
   * - Other codes: RLS policy violations, network errors, etc.
   */
  const fetchUserProfile = useCallback(async (userId, userEmail, skipIfExists = false, retryCount = 0) => {
    if (!userId) {
      setUserProfile(null);
      return;
    }

    // Skip fetch if profile already exists and skipIfExists is true
    // Note: We check userProfile in the closure, but it's stable due to dependencies
    setUserProfile(prevProfile => {
      if (skipIfExists && prevProfile && !prevProfile.error) {
        console.log('⏭️ [AuthContext] Skipping profile fetch - already loaded');
        return prevProfile; // Return existing profile
      }
      return prevProfile; // Continue with fetch
    });

    // If skipIfExists and profile exists, return early
    if (skipIfExists) {
      const shouldSkip = await new Promise(resolve => {
        setUserProfile(prevProfile => {
          resolve(prevProfile && !prevProfile.error);
          return prevProfile;
        });
      });
      if (shouldSkip) return;
    }

    try {
      console.log(`🔍 [AuthContext] Fetching profile for user (attempt ${retryCount + 1}):`, userId);
      console.log('🔍 [AuthContext] Using Supabase URL:', supabase.supabaseUrl);
      console.log('🔍 [AuthContext] User email:', userEmail);

      // Build the query with minimal fields for faster response
      console.log('🔍 [AuthContext] Query built, executing...');
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ [AuthContext] Profile fetch error:', error);
        console.error('❌ [AuthContext] Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          supabaseUrl: supabase.supabaseUrl
        });

        // PGRST116 = no rows returned - profile doesn't exist
        if (error.code === 'PGRST116') {
          console.error('❌ CRITICAL: Profile not found for user', userId);
          setUserProfile({
            error: true,
            errorMessage: 'Your profile was not created properly. Please contact support.',
            errorCode: error.code
          });
          return;
        }

        // Other errors (RLS, network, etc.)
        setUserProfile({
          error: true,
          errorMessage: `Profile load failed: ${error.message}`,
          errorCode: error.code
        });
        return;
      }

      console.log('✅ [AuthContext] Profile fetched successfully:', data);
      setUserProfile(data);
    } catch (err) {
      console.error('❌ [AuthContext] Error fetching user profile:', err);
      setUserProfile({
        error: true,
        errorMessage: `Unexpected error: ${err.message}`,
        errorCode: err.code
      });
    }
  }, []); // Empty dependencies - function is stable

  useEffect(() => {
    console.log('🔄 AuthContext: Initializing auth...');

    let mounted = true;

    // Initialize auth state
    const initAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('❌ AuthContext: Session error', error);
        } else {
          console.log('✅ AuthContext: Session retrieved', { hasSession: !!session });
        }

        if (!mounted) return;

        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchUserProfile(session.user.id, session.user.email);
        }
      } catch (error) {
        console.error('❌ AuthContext: Init error', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('🔔 Auth state changed:', _event, { hasSession: !!session });

      if (!mounted) return;

      setUser(session?.user ?? null);
      if (session?.user) {
        // Skip re-fetching if profile already loaded (unless SIGNED_IN event)
        const skipIfExists = _event !== 'SIGNED_IN';
        await fetchUserProfile(session.user.id, session.user.email, skipIfExists);
      } else {
        setUserProfile(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]); // Add fetchUserProfile to dependencies

  const signUp = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });

    if (error) throw error;

    // Profile will be automatically created by database trigger (010_auto_create_profiles.sql)
    // The trigger reads full_name from user metadata (raw_user_meta_data->>'full_name')

    return data;
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const resetPassword = async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) throw error;
    return data;
  };

  const updatePassword = async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;
    return data;
  };

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });

    if (error) throw error;
    return data;
  };

  const resendVerificationEmail = async () => {
    if (!user?.email) throw new Error('No user email found');

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user.email
    });

    if (error) throw error;
  };

  // Helper functions to check user role
  const isSuperAdmin = userProfile?.role === 'super_admin';
  const isAdmin = userProfile?.role === 'admin';
  const isClient = userProfile?.role === 'client';

  const value = {
    user,
    userProfile,
    loading,
    isSuperAdmin,
    isAdmin,
    isClient,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    signInWithGoogle,
    resendVerificationEmail,
    refreshProfile: () => fetchUserProfile(user?.id, user?.email)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
