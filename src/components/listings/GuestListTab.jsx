import { useState, useEffect } from 'react';
import { Plus, Search, Calendar, UserPlus, Upload, RefreshCw, Download } from 'lucide-react';
import Button from '../Button';
import { AddGuestModal } from './AddGuestModal';
import { AddICalModal } from './AddICalModal';
import { supabase } from '../../supabase';
import { importICalToGuests } from '../../services/icalService';
import { downloadGuestsCSV } from '../../services/exportService';
import { useDebounce } from '../../hooks/useDebounce';

export const GuestListTab = ({ formData, setFormData, showToast }) => {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300); // Debounce search by 300ms
  const [sortField, setSortField] = useState('checkIn');
  const [sortDirection, setSortDirection] = useState('asc');
  const [showAddGuestModal, setShowAddGuestModal] = useState(false);
  const [showAddICalModal, setShowAddICalModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState(null);

  const guests = formData.guestList || [];

  // Fetch guests from Supabase on mount and subscribe to real-time changes
  useEffect(() => {
    if (!formData.id) return;

    const fetchGuests = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('guests')
          .select('*')
          .eq('listing_id', formData.id)
          .order('check_in', { ascending: true });

        if (error) throw error;

        // Convert snake_case to camelCase for frontend
        const guestsData = (data || []).map(guest => ({
          id: guest.id,
          firstName: guest.first_name,
          lastName: guest.last_name,
          email: guest.email,
          phone: guest.phone,
          checkIn: guest.check_in,
          checkOut: guest.check_out,
          language: guest.language,
          specialRequests: guest.special_requests,
          notes: guest.notes
        }));

        setFormData({
          ...formData,
          guestList: guestsData
        });
      } catch (error) {
        console.error('Error fetching guests:', error);
        showToast('Error loading guests: ' + error.message, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchGuests();

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`guests-${formData.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'guests',
          filter: `listing_id=eq.${formData.id}`
        },
        (payload) => {
          console.log('Guest change received:', payload);

          if (payload.eventType === 'INSERT') {
            const newGuest = {
              id: payload.new.id,
              firstName: payload.new.first_name,
              lastName: payload.new.last_name,
              email: payload.new.email,
              phone: payload.new.phone,
              checkIn: payload.new.check_in,
              checkOut: payload.new.check_out,
              language: payload.new.language,
              specialRequests: payload.new.special_requests,
              notes: payload.new.notes
            };
            setFormData(prev => ({
              ...prev,
              guestList: [...(prev.guestList || []), newGuest]
            }));
          } else if (payload.eventType === 'UPDATE') {
            const updatedGuest = {
              id: payload.new.id,
              firstName: payload.new.first_name,
              lastName: payload.new.last_name,
              email: payload.new.email,
              phone: payload.new.phone,
              checkIn: payload.new.check_in,
              checkOut: payload.new.check_out,
              language: payload.new.language,
              specialRequests: payload.new.special_requests,
              notes: payload.new.notes
            };
            setFormData(prev => ({
              ...prev,
              guestList: (prev.guestList || []).map(g =>
                g.id === updatedGuest.id ? updatedGuest : g
              )
            }));
          } else if (payload.eventType === 'DELETE') {
            setFormData(prev => ({
              ...prev,
              guestList: (prev.guestList || []).filter(g => g.id !== payload.old.id)
            }));
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [formData.id]);

  // Filter guests based on debounced search query
  const filteredGuests = guests.filter(guest => {
    const searchLower = debouncedSearchQuery.toLowerCase();
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
  const handleAddGuest = async (guestData) => {
    try {
      // Insert into Supabase
      const { data, error } = await supabase
        .from('guests')
        .insert([{
          listing_id: formData.id,
          first_name: guestData.firstName,
          last_name: guestData.lastName,
          email: guestData.email,
          phone: guestData.phone,
          check_in: guestData.checkIn,
          check_out: guestData.checkOut,
          language: guestData.language,
          special_requests: guestData.specialRequests,
          notes: guestData.notes
        }])
        .select()
        .single();

      if (error) throw error;

      // Convert back to camelCase and update local state
      const newGuest = {
        id: data.id,
        firstName: data.first_name,
        lastName: data.last_name,
        email: data.email,
        phone: data.phone,
        checkIn: data.check_in,
        checkOut: data.check_out,
        language: data.language,
        specialRequests: data.special_requests,
        notes: data.notes
      };

      setFormData({
        ...formData,
        guestList: [...guests, newGuest]
      });
      showToast('Guest added successfully!');
      setShowAddGuestModal(false);
    } catch (error) {
      console.error('Error adding guest:', error);
      showToast('Error adding guest: ' + error.message, 'error');
    }
  };

  // Handle edit guest
  const handleEditGuest = async (guestData) => {
    try {
      // Update in Supabase
      const { error } = await supabase
        .from('guests')
        .update({
          first_name: guestData.firstName,
          last_name: guestData.lastName,
          email: guestData.email,
          phone: guestData.phone,
          check_in: guestData.checkIn,
          check_out: guestData.checkOut,
          language: guestData.language,
          special_requests: guestData.specialRequests,
          notes: guestData.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingGuest.id);

      if (error) throw error;

      // Update local state
      const updatedGuests = guests.map(g =>
        g.id === editingGuest.id ? { ...g, ...guestData } : g
      );
      setFormData({
        ...formData,
        guestList: updatedGuests
      });
      showToast('Guest updated successfully!');
      setEditingGuest(null);
    } catch (error) {
      console.error('Error updating guest:', error);
      showToast('Error updating guest: ' + error.message, 'error');
    }
  };

  // Handle delete guest
  const handleDeleteGuest = async (guestId) => {
    if (!window.confirm('Are you sure you want to delete this guest?')) {
      return;
    }

    try {
      // Delete from Supabase
      const { error } = await supabase
        .from('guests')
        .delete()
        .eq('id', guestId);

      if (error) throw error;

      // Update local state
      setFormData({
        ...formData,
        guestList: guests.filter(g => g.id !== guestId)
      });
      showToast('Guest deleted successfully!');
    } catch (error) {
      console.error('Error deleting guest:', error);
      showToast('Error deleting guest: ' + error.message, 'error');
    }
  };

  // Handle iCal import
  const handleICalImport = async (url) => {
    try {
      setLoading(true);
      showToast('Importing reservations from iCal...');

      const result = await importICalToGuests(url, formData.id, supabase);

      showToast(result.message);

      if (result.errors.length > 0) {
        console.error('iCal import errors:', result.errors);
      }

      setShowAddICalModal(false);
    } catch (error) {
      console.error('Error importing iCal:', error);
      showToast(`Error importing iCal: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
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
            onClick={() => {
              try {
                downloadGuestsCSV(guests);
                showToast(`Exported ${guests.length} guest(s) to CSV`);
              } catch (error) {
                showToast('Error exporting guests: ' + error.message, 'error');
              }
            }}
            disabled={guests.length === 0}
          >
            <Download size={16} />
            Export
          </Button>
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
