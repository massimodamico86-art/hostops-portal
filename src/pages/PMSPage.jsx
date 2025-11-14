import { useState, useEffect } from 'react';
import { Cable, Trash2, RefreshCcw, Plus, CheckCircle, XCircle, Clock } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import { PMSSetupModal } from '../components/listings/PMSSetupModal';
import { getPMSConnection, syncReservations, disconnectPMS } from '../services/pmsService';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';

const PMSPage = ({ showToast, listings }) => {
  const { user } = useAuth();
  const [pmsConnections, setPmsConnections] = useState({});
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [syncing, setSyncing] = useState({});
  const [loading, setLoading] = useState(true);

  // Fetch PMS connections for all listings
  useEffect(() => {
    if (!user || !listings || listings.length === 0) {
      setLoading(false);
      return;
    }

    const fetchConnections = async () => {
      try {
        setLoading(true);
        const connections = {};

        for (const listing of listings) {
          const connection = await getPMSConnection(listing.id);
          if (connection) {
            connections[listing.id] = connection;
          }
        }

        setPmsConnections(connections);
      } catch (error) {
        console.error('Error fetching PMS connections:', error);
        showToast('Error loading PMS connections', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchConnections();
  }, [user, listings]);

  const handleSetupPMS = (listing) => {
    setSelectedListing(listing);
    setShowSetupModal(true);
  };

  const handleSyncReservations = async (listing) => {
    setSyncing({ ...syncing, [listing.id]: true });

    try {
      const result = await syncReservations(listing.id);

      let message = `Successfully imported ${result.imported} reservation(s)`;
      if (result.skipped > 0) {
        message += `, skipped ${result.skipped}`;
      }

      showToast(message);

      // Update last sync timestamp
      setPmsConnections({
        ...pmsConnections,
        [listing.id]: {
          ...pmsConnections[listing.id],
          last_sync: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error syncing reservations:', error);
      showToast('Error syncing reservations: ' + error.message, 'error');
    } finally {
      setSyncing({ ...syncing, [listing.id]: false });
    }
  };

  const handleDisconnect = async (listingId) => {
    if (!confirm('Are you sure you want to disconnect this PMS integration?')) {
      return;
    }

    try {
      await disconnectPMS(listingId);

      // Remove from local state
      const newConnections = { ...pmsConnections };
      delete newConnections[listingId];
      setPmsConnections(newConnections);

      showToast('PMS integration disconnected');
    } catch (error) {
      console.error('Error disconnecting PMS:', error);
      showToast('Error disconnecting PMS: ' + error.message, 'error');
    }
  };

  const formatLastSync = (timestamp) => {
    if (!timestamp) return 'Never';

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  };

  const getProviderName = (providerId) => {
    const names = {
      airbnb: 'Airbnb',
      booking: 'Booking.com',
      vrbo: 'VRBO',
      guesty: 'Guesty',
      hospitable: 'Hospitable',
      hostaway: 'Hostaway'
    };
    return names[providerId] || providerId;
  };

  const getProviderLogo = (providerId) => {
    const logos = {
      airbnb: '🏠',
      booking: '🏨',
      vrbo: '🏖️',
      guesty: '🏢',
      hospitable: '🏘️',
      hostaway: '🏛️'
    };
    return logos[providerId] || '🔗';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCcw className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">PMS Integration</h1>
        <p className="text-gray-600">Connect your property management systems and sync reservations</p>
      </div>

      {/* Connected Listings */}
      {listings && listings.length > 0 ? (
        <div className="space-y-4">
          {listings.map(listing => {
            const connection = pmsConnections[listing.id];
            const isSyncing = syncing[listing.id];

            return (
              <Card key={listing.id} className={`p-6 ${connection?.is_active ? 'bg-green-50 border-green-200' : ''}`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{listing.name}</h3>
                    <p className="text-sm text-gray-600">{listing.address}</p>
                  </div>

                  {connection?.is_active ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle size={20} />
                      <span className="text-sm font-medium">Connected</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-400">
                      <XCircle size={20} />
                      <span className="text-sm font-medium">Not Connected</span>
                    </div>
                  )}
                </div>

                {connection?.is_active ? (
                  <div>
                    {/* Connection Info */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="text-3xl">{getProviderLogo(connection.provider)}</div>
                      <div>
                        <div className="font-medium">{getProviderName(connection.provider)}</div>
                        <div className="text-xs text-gray-600 flex items-center gap-1">
                          <Clock size={12} />
                          Last synced: {formatLastSync(connection.last_sync)}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-4 border-t border-green-200">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSyncReservations(listing)}
                        disabled={isSyncing}
                      >
                        {isSyncing ? (
                          <>
                            <RefreshCcw size={14} className="animate-spin" />
                            Syncing...
                          </>
                        ) : (
                          <>
                            <RefreshCcw size={14} />
                            Sync Now
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetupPMS(listing)}
                      >
                        <Cable size={14} />
                        Reconfigure
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDisconnect(listing.id)}
                      >
                        <Trash2 size={14} />
                        Disconnect
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-4 border-t">
                    <Button
                      onClick={() => handleSetupPMS(listing)}
                      size="sm"
                    >
                      <Plus size={14} />
                      Connect PMS
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-gray-600 mb-4">No listings found. Create a listing first to connect a PMS.</p>
        </Card>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <h3 className="font-semibold mb-2">Supported Platforms</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>✓ Airbnb (via iCal)</li>
            <li>✓ Booking.com</li>
            <li>✓ VRBO / HomeAway</li>
            <li>✓ Guesty</li>
            <li>✓ Hospitable</li>
            <li>✓ Hostaway</li>
          </ul>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-2">What Gets Synced?</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>✓ Guest reservations</li>
            <li>✓ Check-in / Check-out dates</li>
            <li>✓ Guest contact information</li>
            <li>✓ Special requests & notes</li>
          </ul>
        </Card>
      </div>

      {/* Setup Modal */}
      {showSetupModal && selectedListing && (
        <PMSSetupModal
          listing={selectedListing}
          onClose={() => {
            setShowSetupModal(false);
            setSelectedListing(null);
          }}
          onSave={async () => {
            // Refresh connections
            const connection = await getPMSConnection(selectedListing.id);
            setPmsConnections({
              ...pmsConnections,
              [selectedListing.id]: connection
            });
          }}
          showToast={showToast}
        />
      )}
    </div>
  );
};

export default PMSPage;
