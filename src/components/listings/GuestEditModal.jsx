import { useState } from 'react';
import Modal from '../Modal';
import Button from '../Button';
export const GuestEditModal = ({ guest, onClose, onSave, showToast }) => {
  const [formData, setFormData] = useState(
    guest || {
      id: Date.now().toString(),
      firstName: '',
      lastName: '',
      checkIn: '',
      checkOut: '',
      language: 'English'
    }
  );

  const handleSave = () => {
    if (!formData.firstName || !formData.lastName || !formData.checkIn || !formData.checkOut) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    onSave(formData);
    showToast(guest ? 'Guest updated successfully!' : 'Guest added successfully!');
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={guest ? 'Edit Guest' : 'Add Guest'} size="small">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">First Name *</label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            placeholder="John"
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Last Name *</label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            placeholder="Doe"
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Check In *</label>
          <input
            type="date"
            value={formData.checkIn}
            onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Check Out *</label>
          <input
            type="date"
            value={formData.checkOut}
            onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Preferred Language</label>
          <select
            value={formData.language}
            onChange={(e) => setFormData({ ...formData, language: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option value="English">English</option>
            <option value="Spanish">Spanish</option>
            <option value="French">French</option>
            <option value="German">German</option>
            <option value="Italian">Italian</option>
            <option value="Portuguese">Portuguese</option>
            <option value="Chinese">Chinese</option>
            <option value="Japanese">Japanese</option>
          </select>
        </div>
        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Guest</Button>
        </div>
      </div>
    </Modal>
  );
};