import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import Button from '../Button';
import { supabase } from '../../supabase';

export const TVDeviceManagement = ({ formData, setFormData, showToast }) => {
  const [loading, setLoading] = useState(false);

  // Fetch TV devices from Supabase on mount and subscribe to real-time changes
  useEffect(() => {
    if (!formData.id) return;

    const fetchDevices = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('tv_devices')
          .select('*')
          .eq('listing_id', formData.id)
          .order('created_at', { ascending: true });

        if (error) throw error;

        // Convert snake_case to camelCase for frontend
        const devicesData = (data || []).map(device => ({
          id: device.id,
          name: device.device_name,
          otp: device.otp_code,
          isOnline: device.is_online,
          lastSeen: device.last_seen
        }));

        setFormData({
          ...formData,
          tvDevices: devicesData
        });
      } catch (error) {
        console.error('Error fetching TV devices:', error);
        if (showToast) {
          showToast('Error loading TV devices: ' + error.message, 'error');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`tv-devices-${formData.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tv_devices',
          filter: `listing_id=eq.${formData.id}`
        },
        (payload) => {
          console.log('TV device change received:', payload);

          if (payload.eventType === 'INSERT') {
            const newDevice = {
              id: payload.new.id,
              name: payload.new.device_name,
              otp: payload.new.otp_code,
              isOnline: payload.new.is_online,
              lastSeen: payload.new.last_seen
            };
            setFormData(prev => ({
              ...prev,
              tvDevices: [...(prev.tvDevices || []), newDevice]
            }));
          } else if (payload.eventType === 'UPDATE') {
            const updatedDevice = {
              id: payload.new.id,
              name: payload.new.device_name,
              otp: payload.new.otp_code,
              isOnline: payload.new.is_online,
              lastSeen: payload.new.last_seen
            };
            setFormData(prev => ({
              ...prev,
              tvDevices: (prev.tvDevices || []).map(d =>
                d.id === updatedDevice.id ? updatedDevice : d
              )
            }));
          } else if (payload.eventType === 'DELETE') {
            setFormData(prev => ({
              ...prev,
              tvDevices: (prev.tvDevices || []).filter(d => d.id !== payload.old.id)
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
  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-semibold mb-3">Manage TVs</h3>
      {(formData.tvDevices || []).map((tv, idx) => (
        <div key={tv.id || idx} className="flex gap-2 items-center mb-2">
          <div className="relative w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-sm">
            📺
            {/* Online status indicator */}
            <div
              className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                tv.isOnline ? 'bg-green-500' : 'bg-gray-400'
              }`}
              title={tv.isOnline ? 'Online' : 'Offline'}
            />
          </div>
          <input
            type="text"
            value={tv.name}
            onChange={async (e) => {
              const newName = e.target.value;
              const newTvs = [...(formData.tvDevices || [])];
              newTvs[idx].name = newName;
              setFormData({ ...formData, tvDevices: newTvs });

              // Save to Supabase if device has an ID
              if (tv.id) {
                try {
                  const { error } = await supabase
                    .from('tv_devices')
                    .update({
                      device_name: newName,
                      updated_at: new Date().toISOString()
                    })
                    .eq('id', tv.id);

                  if (error) throw error;
                } catch (error) {
                  console.error('Error updating TV device:', error);
                  if (showToast) {
                    showToast('Error updating TV device: ' + error.message, 'error');
                  }
                }
              }
            }}
            placeholder="TV name"
            className="flex-1 px-3 py-2 border rounded-lg text-sm"
          />
          <div className="text-sm text-gray-500">OTP:</div>
          <input
            type="text"
            value={tv.otp}
            readOnly
            className="w-24 px-3 py-2 border rounded-lg text-sm bg-gray-50"
          />
          <button
            onClick={async () => {
              if (!window.confirm('Are you sure you want to delete this TV device?')) {
                return;
              }

              // Delete from Supabase if device has an ID
              if (tv.id) {
                try {
                  const { error } = await supabase
                    .from('tv_devices')
                    .delete()
                    .eq('id', tv.id);

                  if (error) throw error;

                  if (showToast) {
                    showToast('TV device deleted successfully!');
                  }
                } catch (error) {
                  console.error('Error deleting TV device:', error);
                  if (showToast) {
                    showToast('Error deleting TV device: ' + error.message, 'error');
                  }
                  return;
                }
              }

              // Update local state
              const newTvs = (formData.tvDevices || []).filter((_, i) => i !== idx);
              setFormData({ ...formData, tvDevices: newTvs });
            }}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      <Button
        size="sm"
        variant="outline"
        className="mt-2"
        onClick={async () => {
          try {
            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

            // Insert into Supabase
            const { data, error } = await supabase
              .from('tv_devices')
              .insert([{
                listing_id: formData.id,
                device_name: '',
                otp_code: otpCode,
                is_online: false
              }])
              .select()
              .single();

            if (error) throw error;

            // Convert back to camelCase and update local state
            const newDevice = {
              id: data.id,
              name: data.device_name,
              otp: data.otp_code,
              isOnline: data.is_online,
              lastSeen: data.last_seen
            };

            setFormData({
              ...formData,
              tvDevices: [
                ...(formData.tvDevices || []),
                newDevice
              ]
            });

            if (showToast) {
              showToast('TV device added successfully!');
            }
          } catch (error) {
            console.error('Error adding TV device:', error);
            if (showToast) {
              showToast('Error adding TV device: ' + error.message, 'error');
            }
          }
        }}
      >
        <Plus size={14} /> Add New
      </Button>
    </div>
  );
};
