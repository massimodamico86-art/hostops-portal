import React, { useState } from 'react';
import { Home, BookOpen, DollarSign, Cable, CreditCard, Users, HelpCircle, Share2, Settings, Search, Plus, Eye, Edit, ChevronRight, X, Calendar, MapPin, Tv, Clock, Filter, Star, Phone, Mail, TrendingUp, Download, Target, Check, Trash2, Building2 } from 'lucide-react';

// Mock Data
const mockData = {
  listings: [
    { 
      id: '1', 
      name: 'Luxury Beach House', 
      address: '123 Ocean Drive, Miami Beach, FL', 
      image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400', 
      active: true,
      bedrooms: 4,
      bathrooms: 3,
      guests: 8,
      price: 450,
      rating: 4.8,
      reviews: 124,
      tvs: 2,
      amenities: ['WiFi', 'Pool', 'Beach Access', 'Parking', 'Kitchen', 'Smart TV'],
      description: 'Stunning beachfront property with panoramic ocean views'
    },
    { 
      id: '2', 
      name: 'Downtown Loft', 
      address: '456 Main St, New York, NY', 
      image: 'https://images.unsplash.com/photo-1502672260066-6bc35f0af07e?w=400', 
      active: true,
      bedrooms: 2,
      bathrooms: 2,
      guests: 4,
      price: 320,
      rating: 4.6,
      reviews: 87,
      tvs: 1,
      amenities: ['WiFi', 'Gym', 'Parking', 'Kitchen'],
      description: 'Modern loft in the heart of downtown'
    },
    { 
      id: '3', 
      name: 'Mountain Cabin', 
      address: '789 Pine Trail, Aspen, CO', 
      image: 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=400', 
      active: true,
      bedrooms: 3,
      bathrooms: 2,
      guests: 6,
      price: 380,
      rating: 4.9,
      reviews: 156,
      tvs: 2,
      amenities: ['WiFi', 'Fireplace', 'Hot Tub', 'Ski Storage', 'Kitchen'],
      description: 'Cozy mountain retreat with stunning views'
    }
  ],
  bookings: [
    { id: '1', guest: 'John Smith', listing: 'Luxury Beach House', checkIn: '2024-10-25', checkOut: '2024-10-28', status: 'confirmed' },
    { id: '2', guest: 'Sarah Johnson', listing: 'Downtown Loft', checkIn: '2024-10-26', checkOut: '2024-10-29', status: 'confirmed' },
    { id: '3', guest: 'Mike Brown', listing: 'Mountain Cabin', checkIn: '2024-10-27', checkOut: '2024-10-30', status: 'pending' },
    { id: '4', guest: 'Emily Davis', listing: 'Luxury Beach House', checkIn: '2024-11-01', checkOut: '2024-11-05', status: 'confirmed' },
    { id: '5', guest: 'Tom Wilson', listing: 'Downtown Loft', checkIn: '2024-11-03', checkOut: '2024-11-06', status: 'pending' }
  ],
  tasks: [
    { id: '1', title: 'Deep clean Luxury Beach House', listing: 'Luxury Beach House', dueDate: '2024-10-24', priority: 'high', status: 'pending' },
    { id: '2', title: 'Restock amenities Downtown Loft', listing: 'Downtown Loft', dueDate: '2024-10-25', priority: 'medium', status: 'in-progress' },
  ],
  users: [
    { id: '1', name: 'Admin User', email: 'admin@hostops.com', role: 'Admin', lastActive: '2 hours ago', status: 'active' },
    { id: '2', name: 'Editor User', email: 'editor@hostops.com', role: 'Editor', lastActive: '1 day ago', status: 'active' }
  ],
  faqs: [
    { id: '1', category: 'General', question: 'How do I get started with hostOps?', answer: 'Complete the setup wizard, connect your PMS, and add your first listing.' },
    { id: '2', category: 'Billing', question: 'How does billing work?', answer: 'You are billed monthly based on your plan. All major credit cards are accepted.' },
    { id: '3', category: 'Integration', question: 'Which PMS platforms do you support?', answer: 'We support Guesty, Hostfully, Lodgify, Hostaway, and manual entry.' }
  ],
  viatorStats: {
    totalEarnings: 1245.50,
    thisMonth: 342.80,
    bookings: 28,
    experiences: [
      { id: '1', name: 'Miami City Tour', price: 89.99, commission: 12.99, rating: 4.8, image: 'https://images.unsplash.com/photo-1514214246283-d427a95c5d2f?w=300' },
      { id: '2', name: 'Everglades Adventure', price: 129.99, commission: 18.99, rating: 4.9, image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=300' }
    ]
  }
};

const Modal = ({ isOpen, onClose, title, children, size = 'medium' }) => {
  if (!isOpen) return null;
  
  const sizeClasses = {
    small: 'max-w-md',
    medium: 'max-w-2xl',
    large: 'max-w-4xl'
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className={`bg-white rounded-lg ${sizeClasses[size]} w-full max-h-[90vh] overflow-auto`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

const Toast = ({ message, type = 'success', onClose }) => {
  return (
    <div className={`fixed bottom-4 right-4 ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'} text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 z-50`}>
      <Check size={20} />
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-75">
        <X size={18} />
      </button>
    </div>
  );
};

const Button = ({ children, onClick, variant = 'primary', size = 'md', className = '', disabled = false, type = 'button' }) => {
  const variants = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600 disabled:bg-blue-300',
    outline: 'border border-gray-300 bg-white hover:bg-gray-50 text-gray-700',
    success: 'bg-green-500 text-white hover:bg-green-600',
    danger: 'bg-red-500 text-white hover:bg-red-600'
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
  };
  return (
    <button 
      type={type}
      onClick={onClick} 
      disabled={disabled}
      className={`${variants[variant]} ${sizes[size]} rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, variant = 'default' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700'
  };
  return (
    <span className={`${variants[variant]} px-2 py-1 rounded-full text-xs font-medium inline-block`}>
      {children}
    </span>
  );
};

const StatCard = ({ title, value, icon: Icon, trend, subtitle }) => (
  <Card className="p-6 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between mb-2">
      <div className="text-sm font-medium text-gray-600">{title}</div>
      {Icon && <Icon size={20} className="text-gray-400" />}
    </div>
    <div className="text-3xl font-bold mb-1">{value}</div>
    {trend !== undefined && (
      <div className={`text-sm font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% from last month
      </div>
    )}
    {subtitle && <div className="text-sm text-gray-500 mt-1">{subtitle}</div>}
  </Card>
);

const DateRangeModal = ({ isOpen, onClose, onApply }) => {
  const [range, setRange] = useState('30');
  
  const handleApply = () => {
    onApply(range);
    onClose();
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Date Range" size="small">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Date Range</label>
          <select 
            value={range} 
            onChange={(e) => setRange(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleApply}>Apply</Button>
        </div>
      </div>
    </Modal>
  );
};

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Revenue" value="$15,240" icon={DollarSign} trend={12} />
        <StatCard title="Active Listings" value={listings.length} icon={Building2} trend={5} />
        <StatCard title="Bookings" value="24" icon={Calendar} trend={8} />
        <StatCard title="Occupancy Rate" value="87%" icon={TrendingUp} trend={3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Bookings</h2>
          <div className="space-y-3">
            {mockData.bookings.slice(0, 3).map(booking => (
              <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">{booking.guest}</div>
                  <div className="text-sm text-gray-600">{booking.listing}</div>
                </div>
                <Badge variant={booking.status === 'confirmed' ? 'success' : 'warning'}>
                  {booking.status}
                </Badge>
              </div>
            ))}
          </div>
          <Button 
            variant="outline" 
            className="w-full mt-4"
            onClick={() => setCurrentPage('bookings')}
          >
            View All Bookings
          </Button>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Upcoming Tasks</h2>
          <div className="space-y-3">
            {mockData.tasks.map(task => (
              <div key={task.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <input type="checkbox" className="mt-1" />
                <div className="flex-1">
                  <div className="font-medium">{task.title}</div>
                  <div className="text-sm text-gray-600">{task.listing}</div>
                </div>
                <Badge variant={task.priority === 'high' ? 'danger' : 'warning'}>
                  {task.priority}
                </Badge>
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full mt-4">
            <Plus size={18} />
            Add Task
          </Button>
        </Card>
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
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">${listing.price}/night</span>
                  <div className="flex items-center gap-1">
                    <Star size={14} className="text-yellow-400 fill-yellow-400" />
                    <span>{listing.rating}</span>
                  </div>
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

const PropertyDetailsModal = ({ listing, onClose, onSave, showToast }) => {
  const [formData, setFormData] = useState({ ...listing });
  const [activeTab, setActiveTab] = useState('display');

  const handleSave = () => {
    onSave(formData);
    showToast(`${formData.name} updated successfully!`);
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={`Edit ${listing.name}`} size="large">
      <div className="space-y-6">
        <div className="border-b">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('display')}
              className={`px-4 py-2 font-medium ${activeTab === 'display' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            >
              Display
            </button>
            <button
              onClick={() => setActiveTab('property')}
              className={`px-4 py-2 font-medium ${activeTab === 'property' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            >
              Property Config
            </button>
          </div>
        </div>

        {activeTab === 'display' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Property Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Bedrooms</label>
                <input
                  type="number"
                  value={formData.bedrooms}
                  onChange={(e) => setFormData({ ...formData, bedrooms: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Bathrooms</label>
                <input
                  type="number"
                  value={formData.bathrooms}
                  onChange={(e) => setFormData({ ...formData, bathrooms: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Price per Night ($)</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          </div>
        )}

        {activeTab === 'property' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Number of TVs</label>
              <input
                type="number"
                value={formData.tvs}
                onChange={(e) => setFormData({ ...formData, tvs: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={formData.active ? 'active' : 'inactive'}
                onChange={(e) => setFormData({ ...formData, active: e.target.value === 'active' })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        )}

        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </div>
    </Modal>
  );
};

const ListingsPage = ({ showToast, listings, setListings }) => {
  const [search, setSearch] = useState('');
  const [selectedListing, setSelectedListing] = useState(null);

  const filteredListings = listings.filter(listing =>
    listing.name.toLowerCase().includes(search.toLowerCase()) ||
    listing.address.toLowerCase().includes(search.toLowerCase())
  );

  const handleSaveListing = (updatedListing) => {
    setListings(listings.map(l => l.id === updatedListing.id ? updatedListing : l));
  };

  const handleDeleteListing = (listingId) => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      setListings(listings.filter(l => l.id !== listingId));
      showToast('Listing deleted successfully');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Listings</h1>
          <p className="text-gray-600">Manage your vacation rental properties</p>
        </div>
        <Button onClick={() => showToast('Add listing feature coming soon!')}>
          <Plus size={18} />
          Add Listing
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search listings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <Button variant="outline">
          <Filter size={18} />
          Filters
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredListings.map(listing => (
          <Card key={listing.id} className="p-6 hover:shadow-md transition-shadow">
            <div className="flex gap-6">
              <img src={listing.image} alt={listing.name} className="w-48 h-32 object-cover rounded-lg" />
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-xl font-semibold">{listing.name}</h3>
                    <p className="text-gray-600 flex items-center gap-1 mt-1">
                      <MapPin size={14} />
                      {listing.address}
                    </p>
                  </div>
                  <Badge variant={listing.active ? 'success' : 'default'}>
                    {listing.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <p className="text-gray-600 mb-3">{listing.description}</p>
                <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                  <span>{listing.bedrooms} beds</span>
                  <span>{listing.bathrooms} baths</span>
                  <span>{listing.guests} guests</span>
                  <span className="flex items-center gap-1">
                    <Tv size={14} />
                    {listing.tvs} TVs
                  </span>
                  <span className="flex items-center gap-1">
                    <Star size={14} className="text-yellow-400 fill-yellow-400" />
                    {listing.rating} ({listing.reviews})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-blue-600">${listing.price}<span className="text-sm text-gray-600 font-normal">/night</span></div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => showToast('Preview display (TV preview)')}>
                      <Eye size={16} />
                      Preview
                    </Button>
                    <Button size="sm" onClick={() => setSelectedListing(listing)}>
                      <Edit size={16} />
                      Edit
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleDeleteListing(listing.id)}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {selectedListing && (
        <PropertyDetailsModal
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
          onSave={handleSaveListing}
          showToast={showToast}
        />
      )}
    </div>
  );
};

const BookingsPage = ({ showToast }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredBookings = mockData.bookings.filter(booking => {
    const matchesSearch = booking.guest.toLowerCase().includes(search.toLowerCase()) ||
                         booking.listing.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bookings</h1>
        <p className="text-gray-600">View and manage guest reservations</p>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search bookings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border rounded-lg">
          <option value="all">All Status</option>
          <option value="confirmed">Confirmed</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guest</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Listing</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check-in</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check-out</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredBookings.map(booking => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{booking.guest}</td>
                  <td className="px-6 py-4">{booking.listing}</td>
                  <td className="px-6 py-4">{booking.checkIn}</td>
                  <td className="px-6 py-4">{booking.checkOut}</td>
                  <td className="px-6 py-4">
                    <Badge variant={booking.status === 'confirmed' ? 'success' : 'warning'}>
                      {booking.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Button size="sm" variant="outline" onClick={() => showToast('View booking details')}>
                      <Eye size={14} />
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

const GuidebooksPage = ({ showToast }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Digital Guidebooks</h1>
          <p className="text-gray-600">Create custom guides for your guests</p>
        </div>
        <Button onClick={() => showToast('Create guidebook feature coming soon!')}>
          <Plus size={18} />
          Create Guidebook
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {mockData.listings.map(listing => (
          <Card key={listing.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <img src={listing.image} alt={listing.name} className="w-full h-48 object-cover" />
            <div className="p-6">
              <h3 className="font-semibold text-lg mb-2">{listing.name}</h3>
              <p className="text-sm text-gray-600 mb-4">WiFi, Check-in, Local Tips</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1">
                  <Eye size={14} />
                  Preview
                </Button>
                <Button size="sm" className="flex-1">
                  <Edit size={14} />
                  Edit
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

const MonetizePage = ({ showToast }) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Monetize with Viator</h1>
        <p className="text-gray-600">Earn commission by recommending local experiences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          title="Total Earnings" 
          value={`$${mockData.viatorStats.totalEarnings.toFixed(2)}`} 
          icon={DollarSign} 
          subtitle="All time"
        />
        <StatCard 
          title="This Month" 
          value={`$${mockData.viatorStats.thisMonth.toFixed(2)}`} 
          icon={TrendingUp} 
          trend={15}
        />
        <StatCard 
          title="Total Bookings" 
          value={mockData.viatorStats.bookings} 
          icon={Target} 
          subtitle="Via your links"
        />
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Featured Experiences</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mockData.viatorStats.experiences.map(exp => (
            <div key={exp.id} className="flex gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow">
              <img src={exp.image} alt={exp.name} className="w-32 h-32 object-cover rounded-lg" />
              <div className="flex-1">
                <h3 className="font-semibold mb-1">{exp.name}</h3>
                <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                  <Star size={14} className="text-yellow-400 fill-yellow-400" />
                  <span>{exp.rating}</span>
                </div>
                <div className="text-lg font-bold text-blue-600 mb-2">${exp.price}</div>
                <div className="text-sm text-green-600 font-medium">
                  You earn: ${exp.commission}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
        <h2 className="text-xl font-bold mb-2">How It Works</h2>
        <div className="space-y-2 text-gray-700">
          <p>1. Browse and add Viator experiences to your guidebooks</p>
          <p>2. Guests book experiences through your unique links</p>
          <p>3. Earn commission on every booking (typically 8-15%)</p>
        </div>
        <Button className="mt-4" onClick={() => showToast('Browse experiences feature coming soon!')}>
          Browse Experiences
        </Button>
      </Card>
    </div>
  );
};

const PMSPage = ({ showToast }) => {
  const [connectedPMS, setConnectedPMS] = useState(null);

  const pmsOptions = [
    { id: 'guesty', name: 'Guesty', logo: '🏢' },
    { id: 'hostfully', name: 'Hostfully', logo: '🏠' },
    { id: 'lodgify', name: 'Lodgify', logo: '🏨' },
    { id: 'hostaway', name: 'Hostaway', logo: '🏘️' },
  ];

  const handleConnect = (pms) => {
    setConnectedPMS(pms);
    showToast(`Successfully connected to ${pms.name}!`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">PMS Integration</h1>
        <p className="text-gray-600">Connect your property management system</p>
      </div>

      {connectedPMS ? (
        <Card className="p-6 bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-4xl">{connectedPMS.logo}</div>
              <div>
                <h3 className="font-semibold text-lg">Connected to {connectedPMS.name}</h3>
                <p className="text-sm text-gray-600">Last synced: 5 minutes ago</p>
              </div>
            </div>
            <Button variant="danger" onClick={() => { setConnectedPMS(null); showToast('Disconnected from PMS'); }}>
              Disconnect
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pmsOptions.map(pms => (
            <Card key={pms.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="text-5xl">{pms.logo}</div>
                <h3 className="text-xl font-semibold">{pms.name}</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Sync your listings, bookings, and calendar automatically
              </p>
              <Button className="w-full" onClick={() => handleConnect(pms)}>
                <Cable size={18} />
                Connect {pms.name}
              </Button>
            </Card>
          ))}
        </div>
      )}

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Manual Entry</h2>
        <p className="text-gray-600 mb-4">Don't use a PMS? You can manually add and manage your listings</p>
        <Button variant="outline" onClick={() => showToast('Manual entry mode enabled')}>
          Use Manual Entry
        </Button>
      </Card>
    </div>
  );
};

const SubscriptionPage = ({ showToast }) => {
  const [currentPlan, setCurrentPlan] = useState('pro');

  const plans = [
    { id: 'starter', name: 'Starter', price: 29, listings: 3 },
    { id: 'pro', name: 'Pro', price: 59, listings: 10 },
    { id: 'enterprise', name: 'Enterprise', price: 149, listings: 'Unlimited' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Subscription & Billing</h1>
        <p className="text-gray-600">Manage your plan and payment methods</p>
      </div>

      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Current Plan: Pro</h2>
            <p className="text-gray-600">$59/month • 10 listings included</p>
            <p className="text-sm text-gray-500 mt-1">Next billing date: November 28, 2025</p>
          </div>
          <Button onClick={() => showToast('Payment details feature coming soon!')}>
            <CreditCard size={18} />
            Update Payment
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map(plan => (
          <Card key={plan.id} className={`p-6 ${currentPlan === plan.id ? 'border-2 border-blue-500' : ''}`}>
            <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
            <div className="text-3xl font-bold mb-1">${plan.price}<span className="text-lg text-gray-600 font-normal">/mo</span></div>
            <p className="text-gray-600 mb-4">{plan.listings} listings</p>
            {currentPlan === plan.id ? (
              <Badge variant="success" className="w-full text-center">Current Plan</Badge>
            ) : (
              <Button 
                className="w-full" 
                variant={currentPlan === plan.id ? 'outline' : 'primary'}
                onClick={() => { setCurrentPlan(plan.id); showToast(`Switched to ${plan.name} plan!`); }}
              >
                {plan.price > plans.find(p => p.id === currentPlan).price ? 'Upgrade' : 'Downgrade'}
              </Button>
            )}
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Billing History</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium">October 2025 - Pro Plan</div>
              <div className="text-sm text-gray-600">Oct 28, 2025</div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-bold">$59.00</span>
              <Button size="sm" variant="outline">
                <Download size={14} />
                Invoice
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

const UsersPage = ({ showToast }) => {
  const [showInviteModal, setShowInviteModal] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team Members</h1>
          <p className="text-gray-600">Manage user access and permissions</p>
        </div>
        <Button onClick={() => setShowInviteModal(true)}>
          <Plus size={18} />
          Invite User
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Active</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {mockData.users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-gray-600">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={user.role === 'Admin' ? 'info' : 'default'}>{user.role}</Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{user.lastActive}</td>
                  <td className="px-6 py-4">
                    <Badge variant="success">{user.status}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Button size="sm" variant="outline" onClick={() => showToast('Edit user permissions')}>
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showInviteModal && (
        <Modal isOpen={true} onClose={() => setShowInviteModal(false)} title="Invite Team Member" size="small">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email Address</label>
              <input type="email" placeholder="user@example.com" className="w-full px-4 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Role</label>
              <select className="w-full px-4 py-2 border rounded-lg">
                <option>Admin</option>
                <option>Editor</option>
                <option>Viewer</option>
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowInviteModal(false)}>Cancel</Button>
              <Button onClick={() => { setShowInviteModal(false); showToast('Invitation sent!'); }}>
                Send Invite
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

const FAQsPage = () => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const filteredFaqs = mockData.faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(search.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'all' || faq.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">FAQs</h1>
        <p className="text-gray-600">Find answers to common questions</p>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search FAQs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-4 py-2 border rounded-lg">
          <option value="all">All Categories</option>
          <option value="General">General</option>
          <option value="Billing">Billing</option>
          <option value="Integration">Integration</option>
        </select>
      </div>

      {filteredFaqs.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-500">No FAQs found matching your criteria</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredFaqs.map(faq => (
            <Card key={faq.id} className="p-6">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-lg">{faq.question}</h3>
                <Badge variant="info">{faq.category}</Badge>
              </div>
              <p className="text-gray-600 mb-4">{faq.answer}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <button className="hover:text-green-600">👍 Helpful</button>
                <button className="hover:text-red-600">👎 Not helpful</button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

const ReferPage = ({ showToast }) => {
  const copyCode = () => {
    navigator.clipboard.writeText('ADMIN2024');
    showToast('Referral code copied to clipboard!');
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Refer & Earn</h1>
        <p className="text-gray-600">Earn $9.99 credit for every friend you refer</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Referrals" value="5" icon={Users} />
        <StatCard title="Total Earnings" value="$49.95" icon={DollarSign} />
        <StatCard title="Conversion Rate" value="80%" icon={Target} />
      </div>

      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
        <h2 className="text-xl font-bold mb-4">Your Referral Code</h2>
        <div className="flex gap-2">
          <input type="text" value="ADMIN2024" readOnly className="flex-1 px-4 py-3 border-2 border-blue-200 rounded-lg font-mono text-lg font-bold bg-white" />
          <Button onClick={copyCode}>
            <Share2 size={18} />
            Copy Code
          </Button>
        </div>
        <p className="text-sm text-gray-600 mt-3">Share this code with friends. When they sign up, you both get $9.99 credit!</p>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Share on Social Media</h2>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => showToast('Opening Facebook...')}>
            Facebook
          </Button>
          <Button variant="outline" onClick={() => showToast('Opening Twitter...')}>
            Twitter
          </Button>
          <Button variant="outline" onClick={() => showToast('Opening LinkedIn...')}>
            LinkedIn
          </Button>
        </div>
      </Card>
    </div>
  );
};

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
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'guidebooks', label: 'Guidebooks', icon: BookOpen },
    { id: 'monetize', label: 'Monetize', icon: DollarSign },
    { id: 'pms', label: 'PMS Integration', icon: Cable },
    { id: 'subscription', label: 'Subscription', icon: CreditCard },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'faqs', label: 'FAQs', icon: HelpCircle },
    { id: 'refer', label: 'Refer & Earn', icon: Share2 }
  ];

  const pages = {
    dashboard: <DashboardPage setCurrentPage={setCurrentPage} showToast={showToast} listings={listings} />,
    listings: <ListingsPage showToast={showToast} listings={listings} setListings={setListings} />,
    bookings: <BookingsPage showToast={showToast} />,
    guidebooks: <GuidebooksPage showToast={showToast} />,
    monetize: <MonetizePage showToast={showToast} />,
    pms: <PMSPage showToast={showToast} />,
    subscription: <SubscriptionPage showToast={showToast} />,
    users: <UsersPage showToast={showToast} />,
    faqs: <FAQsPage />,
    refer: <ReferPage showToast={showToast} />,
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
          <span className="text-sm">❤️ Love hostOps? Refer friends and earn $9.99 credit</span>
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