import { useState, useEffect, lazy, Suspense } from 'react';
import { Home, BookOpen, DollarSign, Cable, CreditCard, Users, HelpCircle, Share2, Settings, ChevronRight, Building2, LogOut } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { supabase } from './supabase';
import Toast from './components/Toast';
import { LoginPage } from './pages';

// Lazy load pages for better code splitting
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ListingsPage = lazy(() => import('./pages/ListingsPage'));
const GuidebooksPage = lazy(() => import('./pages/GuidebooksPage'));
const MonetizePage = lazy(() => import('./pages/MonetizePage'));
const PMSPage = lazy(() => import('./pages/PMSPage'));
const SubscriptionPage = lazy(() => import('./pages/SubscriptionPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const FAQsPage = lazy(() => import('./pages/FAQsPage'));
const ReferPage = lazy(() => import('./pages/ReferPage'));
const SetupPage = lazy(() => import('./pages/SetupPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const AdminTestPage = lazy(() => import('./pages/AdminTestPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const SuperAdminDashboardPage = lazy(() => import('./pages/SuperAdminDashboardPage'));

export default function HostOpsApp() {
  const { user, loading: authLoading, signOut, userProfile: authUserProfile } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [toast, setToast] = useState(null);
  const [listings, setListings] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [isPasswordReset, setIsPasswordReset] = useState(false);

  // Check if URL has password reset hash
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      setIsPasswordReset(true);
    }
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  /**
   * Fetch user data and set up real-time subscriptions
   *
   * This effect handles:
   * 1. Fetching user profile from profiles table
   * 2. Fetching listings based on user role (super_admin, admin, or client)
   * 3. Setting up real-time subscriptions for listing changes
   * 4. Auto-updating offline TV devices every 2 minutes
   *
   * Role-based data access:
   * - super_admin: See all listings from all users
   * - admin: See listings from assigned clients (managed_by relationship)
   * - client: See only their own listings
   *
   * Real-time updates:
   * - INSERT: New listings appear immediately
   * - UPDATE: Listing changes reflect in real-time
   * - DELETE: Deleted listings are removed from the list
   *
   * Cleanup:
   * - Unsubscribes from real-time channel on unmount
   * - Clears TV device status update interval
   */
  useEffect(() => {
    if (!user) {
      setLoadingData(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoadingData(true);

        // Fetch user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;
        setUserProfile(profile);

        // Fetch listings based on user role
        let listingsData = [];

        if (profile.role === 'super_admin') {
          // Super admins see all listings
          const { data, error } = await supabase
            .from('listings')
            .select('*, owner:profiles(id, full_name, email)')
            .order('created_at', { ascending: false });

          if (error && error.code !== 'PGRST116') throw error; // Ignore "no rows" error
          listingsData = data || [];
        } else if (profile.role === 'admin') {
          // Admins see listings of their assigned clients
          const { data, error } = await supabase
            .from('listings')
            .select('*, owner:profiles!listings_owner_id_fkey(id, full_name, email, managed_by)')
            .order('created_at', { ascending: false });

          if (error && error.code !== 'PGRST116') throw error; // Ignore "no rows" error
          // Filter to only show listings where owner is managed by this admin
          listingsData = (data || []).filter(listing =>
            listing.owner?.managed_by === user.id
          );
        } else {
          // Clients see only their own listings
          const { data, error } = await supabase
            .from('listings')
            .select('*')
            .eq('owner_id', user.id)
            .order('created_at', { ascending: false });

          if (error && error.code !== 'PGRST116') throw error; // Ignore "no rows" error
          listingsData = data || [];
        }

        setListings(listingsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        // Don't show error toast for "no rows" errors
        if (error.code !== 'PGRST116') {
          showToast('Error loading data: ' + error.message, 'error');
        }
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();

    // Subscribe to real-time changes for listings
    // RLS policies will control which listings the user can see
    const channel = supabase
      .channel(`listings-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'listings'
          // No filter - RLS handles access control
        },
        (payload) => {
          console.log('Listing change received:', payload);

          // Client-side check: only process listings we're managing
          const currentListingIds = listings.map(l => l.id);
          const isRelevantListing =
            userProfile?.role === 'super_admin' || // Super admins see all
            payload.new?.owner_id === user.id || // Own listings
            (userProfile?.role === 'admin' && currentListingIds.includes(payload.new?.id)); // Managed client listings

          // For DELETE events, check if we had this listing
          const isRelevantDelete =
            userProfile?.role === 'super_admin' ||
            currentListingIds.includes(payload.old?.id);

          if (payload.eventType === 'INSERT' && isRelevantListing) {
            setListings(prev => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE' && isRelevantListing) {
            setListings(prev =>
              prev.map(listing =>
                listing.id === payload.new.id ? payload.new : listing
              )
            );
          } else if (payload.eventType === 'DELETE' && isRelevantDelete) {
            setListings(prev =>
              prev.filter(listing => listing.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time subscription active');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Real-time subscription error:', err);
          // Optionally show toast notification to user
          showToast?.('Real-time updates temporarily unavailable', 'error');
        } else if (status === 'TIMED_OUT') {
          console.error('❌ Real-time subscription timed out');
          // Attempt to reconnect after a delay
          setTimeout(() => {
            console.log('🔄 Attempting to reconnect real-time subscription...');
            supabase.removeChannel(channel);
            // The next render will recreate the subscription
          }, 5000);
        } else if (status === 'CLOSED') {
          console.warn('⚠️  Real-time subscription closed');
        }
      });

    // Update offline TV devices every 2 minutes
    const updateOfflineDevicesInterval = setInterval(async () => {
      try {
        const { error } = await supabase.rpc('update_tv_device_status');
        // Silently ignore if RPC function doesn't exist yet
        if (error && error.code !== '42883') {
          console.error('Error updating TV device status:', error);
        }
      } catch (error) {
        // Silently ignore errors for missing RPC function
        if (error.code !== '42883' && error.message !== 'Function not found') {
          console.error('Error updating TV device status:', error);
        }
      }
    }, 2 * 60 * 1000); // 2 minutes

    // Cleanup subscription and interval on unmount
    return () => {
      supabase.removeChannel(channel);
      clearInterval(updateOfflineDevicesInterval);
    };
  }, [user]);

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut();
      showToast('Signed out successfully');
    } catch (error) {
      showToast('Error signing out: ' + error.message, 'error');
    }
  };

  const navigation = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'listings', label: 'Listings', icon: Building2 },
    { id: 'guidebooks', label: 'Guidebooks', icon: BookOpen },
    { id: 'monetize', label: 'Monetize', icon: DollarSign },
    { id: 'pms', label: 'PMS Integration', icon: Cable },
    { id: 'subscription', label: 'Subscription', icon: CreditCard },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'faqs', label: 'FAQs', icon: HelpCircle },
    { id: 'refer', label: 'Refer & Earn', icon: Share2 },
    { id: 'setup', label: 'Setup', icon: Settings }
  ];

  // Loading fallback component
  const PageLoader = () => (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );

  const pages = {
    dashboard: <Suspense fallback={<PageLoader />}><DashboardPage setCurrentPage={setCurrentPage} showToast={showToast} listings={listings} setListings={setListings} /></Suspense>,
    listings: <Suspense fallback={<PageLoader />}><ListingsPage showToast={showToast} listings={listings} setListings={setListings} /></Suspense>,
    guidebooks: <Suspense fallback={<PageLoader />}><GuidebooksPage showToast={showToast} /></Suspense>,
    monetize: <Suspense fallback={<PageLoader />}><MonetizePage showToast={showToast} /></Suspense>,
    pms: <Suspense fallback={<PageLoader />}><PMSPage showToast={showToast} listings={listings} /></Suspense>,
    subscription: <Suspense fallback={<PageLoader />}><SubscriptionPage showToast={showToast} /></Suspense>,
    users: <Suspense fallback={<PageLoader />}><UsersPage showToast={showToast} /></Suspense>,
    faqs: <Suspense fallback={<PageLoader />}><FAQsPage /></Suspense>,
    refer: <Suspense fallback={<PageLoader />}><ReferPage showToast={showToast} /></Suspense>,
    setup: <Suspense fallback={<PageLoader />}><SetupPage showToast={showToast} /></Suspense>,
    settings: <Suspense fallback={<PageLoader />}><SettingsPage showToast={showToast} /></Suspense>,
    'admin-test': <Suspense fallback={<PageLoader />}><AdminTestPage /></Suspense>
  };

  // Show password reset page if user clicked reset link
  if (isPasswordReset && user) {
    return (
      <Suspense fallback={<PageLoader />}>
        <ResetPasswordPage
          onSuccess={() => {
            setIsPasswordReset(false);
            setCurrentPage('dashboard');
            showToast('Password updated successfully!');
          }}
        />
      </Suspense>
    );
  }

  // Show login page if not authenticated
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl mx-auto mb-4 animate-pulse"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  // Show error state if profile fetch failed
  if (authUserProfile?.error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Profile Load Failed</h2>
          <p className="text-gray-600 mb-4">{authUserProfile.errorMessage}</p>
          <div className="bg-gray-100 rounded p-4 mb-4 text-left">
            <p className="text-sm text-gray-700 font-mono mb-2">Debug Info:</p>
            <p className="text-xs text-gray-600 font-mono">User ID: {user?.id}</p>
            <p className="text-xs text-gray-600 font-mono">Email: {user?.email}</p>
            {authUserProfile.errorCode && (
              <p className="text-xs text-gray-600 font-mono">Error Code: {authUserProfile.errorCode}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
            <button
              onClick={handleSignOut}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while fetching data OR userProfile
  if (loadingData || !authUserProfile) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl mx-auto mb-4 animate-pulse"></div>
          <p className="text-gray-600">Loading your data...</p>
          <p className="text-gray-400 text-sm mt-2">If this takes more than 10 seconds, check the console for errors</p>
        </div>
      </div>
    );
  }

  // Route to role-specific dashboards
  console.log('🔍 DEBUG: authUserProfile =', authUserProfile);
  console.log('🔍 DEBUG: role =', authUserProfile?.role);

  if (authUserProfile?.role === 'super_admin') {
    console.log('✅ Routing to SuperAdminDashboard');
    return (
      <Suspense fallback={<PageLoader />}>
        <SuperAdminDashboardPage />
      </Suspense>
    );
  }

  if (authUserProfile?.role === 'admin') {
    console.log('✅ Routing to AdminDashboard');
    return (
      <Suspense fallback={<PageLoader />}>
        <AdminDashboardPage />
      </Suspense>
    );
  }

  console.log('✅ Routing to ClientDashboard (default)');
  // Default: Client dashboard (existing UI)

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg"></div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">hostOps</h1>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map(item => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 font-medium shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200 space-y-2">
          {/* Settings Button */}
          <button
            onClick={() => setCurrentPage('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              currentPage === 'settings'
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Settings size={20} />
            <span className="font-medium">Settings</span>
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-3 p-2 rounded-lg">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
              {(userProfile?.full_name || user.email || 'U')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">{userProfile?.full_name || 'User'}</div>
              <div className="text-xs text-gray-500 truncate">{user.email}</div>
            </div>
            <button
              onClick={handleSignOut}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Sign out"
            >
              <LogOut size={18} className="text-gray-400" />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 flex items-center justify-between">
          <span className="text-sm">Love hostOps? Refer friends and earn $9.99 credit</span>
          <button
            onClick={() => setCurrentPage('refer')}
            className="text-sm font-medium hover:underline flex items-center gap-1"
          >
            Refer Now
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="p-6">
          {pages[currentPage]}
        </div>
      </main>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
