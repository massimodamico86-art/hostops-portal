import { useState } from 'react';
import { Cable, Trash2, RefreshCcw } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';

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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="text-4xl">{connectedPMS.logo}</div>
              <div>
                <h3 className="font-semibold text-lg">Connected to {connectedPMS.name}</h3>
                <p className="text-sm text-gray-600">Last synced: 5 minutes ago</p>
              </div>
            </div>
            <Button
              variant="danger"
              onClick={() => {
                setConnectedPMS(null);
                showToast('Integration deleted');
              }}
            >
              <Trash2 size={16} />
              Delete integration
            </Button>
          </div>

          <div className="flex gap-2 pt-4 border-t border-green-200">
            <Button variant="outline" onClick={() => showToast('Listings synced!')}>
              <RefreshCcw size={16} />
              Sync listings
            </Button>
            <Button variant="outline" onClick={() => showToast('Reservations synced!')}>
              <RefreshCcw size={16} />
              Sync reservations
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

export default PMSPage;
