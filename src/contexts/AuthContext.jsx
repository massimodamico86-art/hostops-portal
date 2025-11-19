import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';

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

  // Fetch user profile including role information
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
          console.error('❌ [AuthContext] Profile not found (PGRST116)');
          console.error('❌ [AuthContext] This should not happen - database trigger should auto-create profiles');
          throw new Error('Profile not found. Please contact support if this issue persists.');
        }

        throw error;
      }

      console.log('✅ [AuthContext] Profile fetched successfully:', data);
      setUserProfile(data);
    } catch (err) {
      console.error('❌ [AuthContext] Error fetching user profile:', err);
      console.error('❌ [AuthContext] Full error object:', err);

      // Don't overwrite existing valid profile with error state on re-fetch failures
      setUserProfile(prevProfile => {
        if (prevProfile && !prevProfile.error) {
          console.warn('⚠️ [AuthContext] Profile re-fetch failed, keeping existing profile');
          return prevProfile; // Keep existing valid profile
        }

        // Set a special error state instead of null
        return {
          error: true,
          errorMessage: err.message || 'Unknown error',
          errorCode: err.code
        };
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
