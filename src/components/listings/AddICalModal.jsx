import { useState } from 'react';
import { Link, AlertCircle } from 'lucide-react';
import Modal from '../Modal';
import Button from '../Button';

export const AddICalModal = ({ onClose, onImport }) => {
  const [icalUrl, setIcalUrl] = useState('');
  const [error, setError] = useState('');

  // Validate iCal URL
  const validateUrl = (url) => {
    if (!url.trim()) {
      return 'iCal URL is required';
    }

    try {
      const urlObj = new URL(url);
      if (!['http:', 'https:', 'webcal:'].includes(urlObj.protocol)) {
        return 'URL must start with http://, https://, or webcal://';
      }
    } catch {
      return 'Invalid URL format';
    }

    return '';
  };

  // Handle submit
  const handleSubmit = (e) => {
    e.preventDefault();

    const validationError = validateUrl(icalUrl);
    if (validationError) {
      setError(validationError);
      return;
    }

    onImport(icalUrl);
  };

  // Handle URL change
  const handleUrlChange = (e) => {
    setIcalUrl(e.target.value);
    if (error) {
      setError('');
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Import from iCal"
      size="medium"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
          <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">How to get your iCal URL:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-800">
              <li>Airbnb: Calendar → Export Calendar → Copy Link</li>
              <li>Booking.com: Calendar → Sync Calendar → Copy Link</li>
              <li>VRBO: Calendar → Export Calendar → Copy URL</li>
              <li>Google Calendar: Settings → Integrate → Secret address in iCal format</li>
            </ul>
          </div>
        </div>

        {/* URL Input */}
        <div>
          <label className="block text-sm font-medium mb-2">
            iCal URL <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Link size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={icalUrl}
              onChange={handleUrlChange}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="https://www.airbnb.com/calendar/ical/..."
            />
          </div>
          {error && (
            <p className="text-red-500 text-sm mt-1">{error}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Paste the iCal URL from your booking platform
          </p>
        </div>

        {/* Features Info */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <h4 className="text-sm font-medium mb-2">What will be imported:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>✓ Guest names (if available)</li>
            <li>✓ Check-in and check-out dates</li>
            <li>✓ Reservation status</li>
          </ul>
        </div>

        {/* Warning */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex gap-2">
          <AlertCircle size={16} className="text-yellow-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-800">
            Imported guests will be added to your existing guest list. This action cannot be undone.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            Import from iCal
          </Button>
        </div>
      </form>
    </Modal>
  );
};
