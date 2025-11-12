
import { Plus, Eye, Edit } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import { mockData } from '../data/mockData';

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

export default GuidebooksPage;
