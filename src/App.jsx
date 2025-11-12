import { useState } from 'react';
import { Home, BookOpen, DollarSign, Cable, CreditCard, Users, HelpCircle, Share2, Settings, ChevronRight, Building2 } from 'lucide-react';
import Toast from './components/Toast';
import { mockData } from './data/mockData';
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
  SetupPage
} from './pages';

export default function HostOpsApp() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [toast, setToast] = useState(null);
  const [listings, setListings] = useState(mockData.listings);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
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
    pms: <PMSPage showToast={showToast} />,
    subscription: <SubscriptionPage showToast={showToast} />,
    users: <UsersPage showToast={showToast} />,
    faqs: <FAQsPage />,
    refer: <ReferPage showToast={showToast} />,
    setup: <SetupPage showToast={showToast} />
  };

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

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
              A
            </div>
            <div className="flex-1">
              <div className="font-semibold text-sm">Admin User</div>
              <div className="text-xs text-gray-500">admin@hostops.com</div>
            </div>
            <Settings size={18} className="text-gray-400" />
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
