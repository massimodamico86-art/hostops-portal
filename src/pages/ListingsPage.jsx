import { useState } from 'react';
import { Search, Plus, Download, Filter, MapPin, Tv, Star, Users, Eye, Edit, Trash2 } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import Badge from '../components/Badge';
import { PropertyDetailsModal } from '../components/listings/PropertyDetailsModal';
import { TVPreviewModal } from '../components/listings/TVPreviewModal';

const ListingsPage = ({ showToast, listings, setListings }) => {
  const [search, setSearch] = useState('');
  const [selectedListing, setSelectedListing] = useState(null);
  const [previewListing, setPreviewListing] = useState(null);

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
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => showToast('Export listings feature coming soon!')}>
            <Download size={18} />
            Export Listings
          </Button>
          <Button onClick={() => showToast('Add listing feature coming soon!')}>
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
    </div>
  );
};

export default ListingsPage;
