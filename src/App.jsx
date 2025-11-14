import { useState, useEffect } from 'react';
import { Home, BookOpen, DollarSign, Cable, CreditCard, Users, HelpCircle, Share2, Settings, ChevronRight, Building2, LogOut } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { supabase } from './supabase';
import Toast from './components/Toast';
import {
  DashboardPage,
  ListingsPage,
  GuidebooksPage,
  MonetizePage,
  PMSPage,
  SubscriptionPage,
  UsersPage,
  FAQsPage,
  ReferPage,
  SetupPage,
  SettingsPage,
  LoginPage,
  ResetPasswordPage
} from './pages';
import AdminTestPage from './pages/AdminTestPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import SuperAdminDashboardPage from './pages/SuperAdminDashboardPage';

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

  // Fetch user profile and listings from Supabase and subscribe to real-time changes
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
    const channel = supabase
      .channel(`listings-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'listings',
          filter: `owner_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Listing change received:', payload);

          if (payload.eventType === 'INSERT') {
            setListings(prev => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setListings(prev =>
              prev.map(listing =>
                listing.id === payload.new.id ? payload.new : listing
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setListings(prev =>
              prev.filter(listing => listing.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

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

  const pages = {
    dashboard: <DashboardPage setCurrentPage={setCurrentPage} showToast={showToast} listings={listings} />,
    listings: <ListingsPage showToast={showToast} listings={listings} setListings={setListings} />,
    guidebooks: <GuidebooksPage showToast={showToast} />,
    monetize: <MonetizePage showToast={showToast} />,
    pms: <PMSPage showToast={showToast} listings={listings} />,
    subscription: <SubscriptionPage showToast={showToast} />,
    users: <UsersPage showToast={showToast} />,
    faqs: <FAQsPage />,
    refer: <ReferPage showToast={showToast} />,
    setup: <SetupPage showToast={showToast} />,
    settings: <SettingsPage showToast={showToast} />,
    'admin-test': <AdminTestPage />
  };

  // Show password reset page if user clicked reset link
  if (isPasswordReset && user) {
    return (
      <ResetPasswordPage
        onSuccess={() => {
          setIsPasswordReset(false);
          setCurrentPage('dashboard');
          showToast('Password updated successfully!');
        }}
      />
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

  // Show loading state while fetching data OR userProfile
  if (loadingData || !authUserProfile) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl mx-auto mb-4 animate-pulse"></div>
          <p className="text-gray-600">Loading your data...</p>
        </div>
      </div>
    );
  }

  // Route to role-specific dashboards
  console.log('🔍 DEBUG: authUserProfile =', authUserProfile);
  console.log('🔍 DEBUG: role =', authUserProfile?.role);

  if (authUserProfile?.role === 'super_admin') {
    console.log('✅ Routing to SuperAdminDashboard');
    return <SuperAdminDashboardPage />;
  }

  if (authUserProfile?.role === 'admin') {
    console.log('✅ Routing to AdminDashboard');
    return <AdminDashboardPage />;
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
