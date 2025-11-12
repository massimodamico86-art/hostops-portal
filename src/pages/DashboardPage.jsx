import { useState } from 'react';
import { Filter, Building2, Users, Star } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import Badge from '../components/Badge';
import StatCard from '../components/StatCard';
import DateRangeModal from '../components/DateRangeModal';

const DashboardPage = ({ setCurrentPage, showToast, listings }) => {
  const [showDateModal, setShowDateModal] = useState(false);
  const [dateRange, setDateRange] = useState('30');

  const handleDateRangeApply = (range) => {
    setDateRange(range);
    showToast(`Date range updated to last ${range} days`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's your property overview</p>
        </div>
        <Button onClick={() => setShowDateModal(true)}>
          <Filter size={18} />
          Last {dateRange} days
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard title="Active Listings" value={listings.length} icon={Building2} trend={5} />
        <StatCard title="Total Guests" value={listings.reduce((sum, l) => sum + (l.guestList || []).length, 0)} icon={Users} subtitle="Across all listings" />
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Your Listings</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {listings.map(listing => (
            <div key={listing.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
              <img src={listing.image} alt={listing.name} className="w-full h-48 object-cover" />
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
    </div>
  );
};

export default DashboardPage;
