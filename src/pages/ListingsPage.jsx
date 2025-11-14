import { useState } from 'react';
import { Search, Plus, Download, Filter, MapPin, Tv, Star, Users, Eye, Edit, Trash2 } from 'lucide-react';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/Button';
import Card from '../components/Card';
import Badge from '../components/Badge';
import { PropertyDetailsModal } from '../components/listings/PropertyDetailsModal';
import { TVPreviewModal } from '../components/listings/TVPreviewModal';
import { AddListingModal } from '../components/listings/AddListingModal';
import { downloadListingsCSV } from '../services/exportService';

const ListingsPage = ({ showToast, listings, setListings }) => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedListing, setSelectedListing] = useState(null);
  const [previewListing, setPreviewListing] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const filteredListings = listings.filter(listing =>
    listing.name.toLowerCase().includes(search.toLowerCase()) ||
    listing.address.toLowerCase().includes(search.toLowerCase())
  );

  const handleSaveListing = async (updatedListing) => {
    try {
      setSaving(true);

      // Update in Supabase
      const { error } = await supabase
        .from('listings')
        .update({
          name: updatedListing.name,
          description: updatedListing.description,
          address: updatedListing.address,
          image: updatedListing.image,
          active: updatedListing.active,
          bedrooms: updatedListing.bedrooms,
          bathrooms: updatedListing.bathrooms,
          guests: updatedListing.guests,
          price: updatedListing.price,
          tvs: updatedListing.tvs,
          amenities: updatedListing.amenities,
          carousel_images: updatedListing.carouselImages,
          background_image: updatedListing.backgroundImage,
          background_video: updatedListing.backgroundVideo,
          background_music: updatedListing.backgroundMusic,
          tv_layout: updatedListing.tvLayout,
          language: updatedListing.language,
          wifi_network: updatedListing.wifiNetwork,
          wifi_password: updatedListing.wifiPassword,
          contact_phone: updatedListing.contactPhone,
          contact_email: updatedListing.contactEmail,
          welcome_greeting: updatedListing.welcomeGreeting,
          welcome_message: updatedListing.welcomeMessage,
          weather_city: updatedListing.weatherCity,
          weather_unit: updatedListing.weatherUnit,
          website_url: updatedListing.websiteUrl,
          show_check_in_out: updatedListing.showCheckInOut,
          standard_check_in_time: updatedListing.standardCheckInTime,
          standard_check_out_time: updatedListing.standardCheckOutTime,
          show_hours_of_operation: updatedListing.showHoursOfOperation,
          hours_of_operation_from: updatedListing.hoursOfOperationFrom,
          hours_of_operation_to: updatedListing.hoursOfOperationTo,
          show_wifi: updatedListing.showWifi,
          show_contact: updatedListing.showContact,
          show_weather: updatedListing.showWeather,
          show_qr_codes: updatedListing.showQRCodes,
          show_logo: updatedListing.showLogo,
          logo: updatedListing.logo,
          show_welcome_message: updatedListing.showWelcomeMessage,
          tours_link: updatedListing.toursLink,
          updated_at: new Date().toISOString()
        })
        .eq('id', updatedListing.id);

      if (error) throw error;

      // Update local state
      setListings(listings.map(l => l.id === updatedListing.id ? updatedListing : l));
      showToast('Listing saved successfully!');
    } catch (error) {
      console.error('Error saving listing:', error);
      showToast('Error saving listing: ' + error.message, 'error');
    } finally {
      setSaving(false);
    }
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
          image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800',
          active: true,
          bedrooms: newListingData.bedrooms,
          bathrooms: newListingData.bathrooms,
          guests: newListingData.guests,
          price: 0,
          tvs: newListingData.tvs,
          rating: 0,
          reviews: 0,
          amenities: [],
          carousel_images: [],
          background_image: '',
          background_video: '',
          background_music: '',
          tv_layout: 'layout1',
          language: 'en',
          wifi_network: '',
          wifi_password: '',
          contact_phone: '',
          contact_email: '',
          welcome_greeting: 'Welcome',
          welcome_message: '',
          weather_city: '',
          weather_unit: 'F',
          website_url: '',
          show_check_in_out: true,
          standard_check_in_time: '3:00 PM',
          standard_check_out_time: '11:00 AM',
          show_hours_of_operation: false,
          hours_of_operation_from: '',
          hours_of_operation_to: '',
          show_wifi: true,
          show_contact: true,
          show_weather: true,
          show_qr_codes: true,
          show_logo: false,
          logo: '',
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

  const handleDeleteListing = async (listingId) => {
    if (!window.confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      return;
    }

    try {
      // Delete from Supabase
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', listingId);

      if (error) throw error;

      // Update local state
      setListings(listings.filter(l => l.id !== listingId));
      showToast('Listing deleted successfully');
    } catch (error) {
      console.error('Error deleting listing:', error);
      showToast('Error deleting listing: ' + error.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Listings</h1>
          <p className="text-gray-600">Manage your vacation rental properties</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => {
            try {
              downloadListingsCSV(listings);
              showToast(`Exported ${listings.length} listing(s) to CSV`);
            } catch (error) {
              showToast('Error exporting listings: ' + error.message, 'error');
            }
          }}>
            <Download size={18} />
            Export Listings
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus size={18} />
            Add Listing
          </Button>
        </div>
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
                  <span className="flex items-center gap-1">
                    <Users size={14} className="text-blue-500" />
                    {(listing.guestList || []).length} guests
                  </span>
                </div>
                <div className="flex items-center justify-end">
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setPreviewListing(listing)}>
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
          listings={listings}
        />
      )}

      {previewListing && (
        <TVPreviewModal
          listing={previewListing}
          onClose={() => setPreviewListing(null)}
        />
      )}

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

export default ListingsPage;
