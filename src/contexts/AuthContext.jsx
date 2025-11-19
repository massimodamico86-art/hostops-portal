import { createContext, useContext, useState, useEffect } from 'react';
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
  const fetchUserProfile = async (userId, userEmail, skipIfExists = false) => {
    if (!userId) {
      setUserProfile(null);
      return;
    }

    // Skip fetch if profile already exists and skipIfExists is true
    if (skipIfExists && userProfile && !userProfile.error) {
      console.log('⏭️ [AuthContext] Skipping profile fetch - already loaded');
      return;
    }

    try {
      console.log('🔍 [AuthContext] Fetching profile for user:', userId);
      console.log('🔍 [AuthContext] Using Supabase URL:', supabase.supabaseUrl);
      console.log('🔍 [AuthContext] User email:', userEmail);

      // Build the query
      const queryPromise = supabase
        .from('profiles')
        .select('id, email, full_name, role, managed_by, created_at')
        .eq('id', userId)
        .single();

      // 10s timeout so we never hang forever
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile fetch timeout after 10 seconds')), 10000)
      );

      console.log('🔍 [AuthContext] Query built, executing with 10s timeout...');
      const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

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
          console.log('⚠️ [AuthContext] Profile not found (PGRST116), attempting to create...');

          // Attempt to auto-create profile
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert([
              {
                id: userId,
                email: userEmail,
                full_name: userEmail.split('@')[0], // Use email prefix as default name
                role: 'client' // Default role
              }
            ])
            .select()
            .single();

          if (insertError) {
            console.error('❌ [AuthContext] Failed to auto-create profile:', insertError);
            throw new Error(`Profile not found and could not be created. Error: ${insertError.message}`);
          }

          console.log('✅ [AuthContext] Profile auto-created:', newProfile);
          setUserProfile(newProfile);
          return;
        }

        throw error;
      }

      console.log('✅ [AuthContext] Profile fetched successfully:', data);
      setUserProfile(data);
    } catch (err) {
      console.error('❌ [AuthContext] Error fetching user profile:', err);
      console.error('❌ [AuthContext] Full error object:', err);

      // Don't overwrite existing valid profile with error state on re-fetch failures
      if (userProfile && !userProfile.error) {
        console.warn('⚠️ [AuthContext] Profile re-fetch failed, keeping existing profile');
        return;
      }

      // Set a special error state instead of null
      setUserProfile({
        error: true,
        errorMessage: err.message || 'Unknown error',
        errorCode: err.code
      });
    }
  };

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
  }, []);

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

    // Create profile
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: data.user.id,
            email: data.user.email,
            full_name: fullName,
            role: 'client'
          }
        ]);

      if (profileError) console.error('Profile creation error:', profileError);
    }

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
