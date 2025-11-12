import { useState } from 'react';
import { Plus, Search, Calendar, UserPlus, Upload, RefreshCw } from 'lucide-react';
import Button from '../Button';
import { AddGuestModal } from './AddGuestModal';
import { AddICalModal } from './AddICalModal';

export const GuestListTab = ({ formData, setFormData, showToast }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('checkIn');
  const [sortDirection, setSortDirection] = useState('asc');
  const [showAddGuestModal, setShowAddGuestModal] = useState(false);
  const [showAddICalModal, setShowAddICalModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState(null);

  const guests = formData.guestList || [];

  // Filter guests based on search query
  const filteredGuests = guests.filter(guest => {
    const searchLower = searchQuery.toLowerCase();
    const fullName = `${guest.firstName} ${guest.lastName}`.toLowerCase();
    return fullName.includes(searchLower) ||
           guest.email?.toLowerCase().includes(searchLower);
  });

  // Sort guests
  const sortedGuests = [...filteredGuests].sort((a, b) => {
    let aVal, bVal;

    if (sortField === 'name') {
      aVal = `${a.firstName} ${a.lastName}`.toLowerCase();
      bVal = `${b.firstName} ${b.lastName}`.toLowerCase();
    } else if (sortField === 'checkIn') {
      aVal = new Date(a.checkIn);
      bVal = new Date(b.checkIn);
    } else if (sortField === 'checkOut') {
      aVal = new Date(a.checkOut);
      bVal = new Date(b.checkOut);
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Handle sort toggle
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handle add guest
  const handleAddGuest = (guestData) => {
    const newGuest = {
      id: Date.now().toString(),
      ...guestData
    };
    setFormData({
      ...formData,
      guestList: [...guests, newGuest]
    });
    showToast('Guest added successfully!');
    setShowAddGuestModal(false);
  };

  // Handle edit guest
  const handleEditGuest = (guestData) => {
    const updatedGuests = guests.map(g =>
      g.id === editingGuest.id ? { ...g, ...guestData } : g
    );
    setFormData({
      ...formData,
      guestList: updatedGuests
    });
    showToast('Guest updated successfully!');
    setEditingGuest(null);
  };

  // Handle delete guest
  const handleDeleteGuest = (guestId) => {
    if (window.confirm('Are you sure you want to delete this guest?')) {
      setFormData({
        ...formData,
        guestList: guests.filter(g => g.id !== guestId)
      });
      showToast('Guest deleted successfully!');
    }
  };

  // Handle iCal import
  const handleICalImport = (url) => {
    // TODO: Implement actual iCal parsing
    showToast('iCal import feature coming soon!');
    setShowAddICalModal(false);
  };

  // Handle PMS sync
  const handlePMSSync = () => {
    showToast('Syncing with PMS...');
    // TODO: Implement actual PMS sync
    setTimeout(() => {
      showToast('PMS sync completed!');
    }, 2000);
  };

  // Format date
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  // Get guest status
  const getGuestStatus = (guest) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkIn = new Date(guest.checkIn);
    const checkOut = new Date(guest.checkOut);
    checkIn.setHours(0, 0, 0, 0);
    checkOut.setHours(0, 0, 0, 0);

    if (today >= checkIn && today <= checkOut) {
      return 'active';
    } else if (today < checkIn) {
      return 'upcoming';
    } else {
      return 'past';
    }
  };

  return (
    <div className="space-y-4">
      {/* PMS Sync Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <RefreshCw size={20} className="text-blue-600" />
          <div>
            <p className="text-sm font-medium text-blue-900">
              Reservations are synced every 8 hours with PMS
            </p>
            <p className="text-xs text-blue-700">
              Last sync: 2 hours ago
            </p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={handlePMSSync}>
          <RefreshCw size={16} />
          Sync Now
        </Button>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search guests by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAddICalModal(true)}
          >
            <Upload size={16} />
            Add iCal
          </Button>
          <Button
            size="sm"
            onClick={() => setShowAddGuestModal(true)}
          >
            <UserPlus size={16} />
            Add Guest
          </Button>
        </div>
      </div>

      {/* Guest Table */}
      {sortedGuests.length === 0 ? (
        <div className="border rounded-lg p-12 text-center">
          <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No guests yet</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery
              ? 'No guests match your search criteria'
              : 'Add guests manually or import from your PMS'}
          </p>
          {!searchQuery && (
            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                onClick={() => setShowAddICalModal(true)}
              >
                <Upload size={16} />
                Add iCal
              </Button>
              <Button onClick={() => setShowAddGuestModal(true)}>
                <UserPlus size={16} />
                Add Guest
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-2 text-xs font-medium text-gray-700 uppercase tracking-wider hover:text-gray-900"
                  >
                    Name
                    {sortField === 'name' && (
                      <span className="text-blue-600">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left">
                  <button
                    onClick={() => handleSort('checkIn')}
                    className="flex items-center gap-2 text-xs font-medium text-gray-700 uppercase tracking-wider hover:text-gray-900"
                  >
                    Check In
                    {sortField === 'checkIn' && (
                      <span className="text-blue-600">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left">
                  <button
                    onClick={() => handleSort('checkOut')}
                    className="flex items-center gap-2 text-xs font-medium text-gray-700 uppercase tracking-wider hover:text-gray-900"
                  >
                    Check Out
                    {sortField === 'checkOut' && (
                      <span className="text-blue-600">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedGuests.map((guest) => {
                const status = getGuestStatus(guest);
                return (
                  <tr key={guest.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {guest.firstName} {guest.lastName}
                      </div>
                      {guest.language && (
                        <div className="text-sm text-gray-500">{guest.language}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(guest.checkIn)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(guest.checkOut)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {guest.email || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : status === 'upcoming'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {status === 'active' ? 'Checked In' : status === 'upcoming' ? 'Upcoming' : 'Checked Out'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setEditingGuest(guest)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteGuest(guest.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Guest count */}
      {sortedGuests.length > 0 && (
        <p className="text-sm text-gray-600">
          Showing {sortedGuests.length} of {guests.length} guest{guests.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Modals */}
      {showAddGuestModal && (
        <AddGuestModal
          onClose={() => setShowAddGuestModal(false)}
          onSave={handleAddGuest}
        />
      )}

      {editingGuest && (
        <AddGuestModal
          guest={editingGuest}
          onClose={() => setEditingGuest(null)}
          onSave={handleEditGuest}
        />
      )}

      {showAddICalModal && (
        <AddICalModal
          onClose={() => setShowAddICalModal(false)}
          onImport={handleICalImport}
        />
      )}
    </div>
  );
};
