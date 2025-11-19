import { useState, useEffect } from 'react';
import { Filter, Building2, Users, Star, Tv, Calendar, Plus } from 'lucide-react';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/Button';
import Card from '../components/Card';
import Badge from '../components/Badge';
import StatCard from '../components/StatCard';
import DateRangeModal from '../components/DateRangeModal';
import OptimizedImage from '../components/OptimizedImage';
import { AddListingModal } from '../components/listings/AddListingModal';

const DashboardPage = ({ setCurrentPage, showToast, listings, setListings }) => {
  const { user } = useAuth();
  const [showDateModal, setShowDateModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [dateRange, setDateRange] = useState('30');
  const [analytics, setAnalytics] = useState({
    totalTVs: 0,
    onlineTVs: 0,
    upcomingCheckIns: 0,
    currentGuests: 0
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user || listings.length === 0) return;

      try {
        const listingIds = listings.map(l => l.id);

        // Fetch TV devices count
        const { data: tvDevices, error: tvError } = await supabase
          .from('tv_devices')
          .select('id, is_online')
          .in('listing_id', listingIds);

        if (tvError) throw tvError;

        // Fetch guests data
        const today = new Date().toISOString().split('T')[0];
        const { data: guests, error: guestsError } = await supabase
          .from('guests')
          .select('id, check_in, check_out')
          .in('listing_id', listingIds);

        if (guestsError) throw guestsError;

        // Calculate analytics
        const totalTVs = tvDevices?.length || 0;
        const onlineTVs = tvDevices?.filter(tv => tv.is_online).length || 0;

        // Current guests (check-in <= today AND check-out >= today)
        const currentGuests = guests?.filter(g =>
          g.check_in <= today && g.check_out >= today
        ).length || 0;

        // Upcoming check-ins (check-in > today AND check-in within next 7 days)
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        const nextWeekStr = nextWeek.toISOString().split('T')[0];
        const upcomingCheckIns = guests?.filter(g =>
          g.check_in > today && g.check_in <= nextWeekStr
        ).length || 0;

        setAnalytics({
          totalTVs,
          onlineTVs,
          upcomingCheckIns,
          currentGuests
        });
      } catch (error) {
        console.error('Error fetching analytics:', error);
      }
    };

    fetchAnalytics();
  }, [user, listings]);

  const handleDateRangeApply = (range) => {
    setDateRange(range);
    showToast(`Date range updated to last ${range} days`);
  };

  const handleAddListing = async (newListingData) => {
    try {
      // Insert into Supabase with all default values
      const { data, error } = await supabase
        .from('listings')
        .insert([{
          owner_id: user.id,
          name: newListingData.name,
          description: newListingData.description || '',
          address: newListingData.address,
          image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
          active: true,
          bedrooms: newListingData.bedrooms || 1,
          bathrooms: newListingData.bathrooms || 1,
          guests: newListingData.guests || 2,
          price: 0,
          rating: 5.0,
          reviews: 0,
          tvs: newListingData.tvs || 1,
          amenities: [],
          carousel_images: [],
          background_image: null,
          background_video: null,
          background_music: null,
          tv_layout: 1,
          language: 'en',
          wifi_network: '',
          wifi_password: '',
          contact_phone: '',
          contact_email: '',
          welcome_greeting: '',
          welcome_message: '',
          weather_city: '',
          weather_unit: 'F',
          website_url: '',
          show_check_in_out: true,
          standard_check_in_time: '15:00:00',
          standard_check_out_time: '11:00:00',
          show_hours_of_operation: false,
          hours_of_operation_from: null,
          hours_of_operation_to: null,
          show_wifi: true,
          show_contact: true,
          show_weather: false,
          show_qr_codes: false,
          show_logo: false,
          logo: null,
          show_welcome_message: true,
          tours_link: ''
        }])
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setListings([data, ...listings]);
      showToast('Listing created successfully!');
    } catch (error) {
      console.error('Error adding listing:', error);
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's your property overview</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAddModal(true)}>
            <Plus size={18} />
            Add Listing
          </Button>
          <Button variant="outline" onClick={() => setShowDateModal(true)}>
            <Filter size={18} />
            Last {dateRange} days
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Listings"
          value={listings.filter(l => l.active).length}
          icon={Building2}
          subtitle={`${listings.length} total`}
        />
        <StatCard
          title="Current Guests"
          value={analytics.currentGuests}
          icon={Users}
          subtitle="Staying now"
        />
        <StatCard
          title="Upcoming Check-ins"
          value={analytics.upcomingCheckIns}
          icon={Calendar}
          subtitle="Next 7 days"
        />
        <StatCard
          title="TV Devices"
          value={`${analytics.onlineTVs}/${analytics.totalTVs}`}
          icon={Tv}
          subtitle="Online"
        />
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Your Listings</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {listings.map(listing => (
            <div key={listing.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
              <OptimizedImage src={listing.image} alt={listing.name} className="w-full h-48" />
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold">{listing.name}</h3>
                  <Badge variant={listing.active ? 'success' : 'default'}>
                    {listing.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-3">{listing.address}</p>
                <div className="flex items-center gap-1">
                  <Star size={14} className="text-yellow-400 fill-yellow-400" />
                  <span>{listing.rating}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          className="w-full mt-4"
          onClick={() => setCurrentPage('listings')}
        >
          Manage All Listings
        </Button>
      </Card>

      <DateRangeModal
        isOpen={showDateModal}
        onClose={() => setShowDateModal(false)}
        onApply={handleDateRangeApply}
      />

      {showAddModal && (
        <AddListingModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddListing}
          showToast={showToast}
        />
      )}
    </div>
  );
};

export default DashboardPage;
