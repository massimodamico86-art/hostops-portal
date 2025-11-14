import { useState } from 'react';
import { Link2, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import Modal from '../Modal';
import Button from '../Button';
import { PMS_PROVIDERS, testPMSConnection, savePMSConnection } from '../../services/pmsService';

export const PMSSetupModal = ({ listing, onClose, onSave, showToast }) => {
  const [selectedProvider, setSelectedProvider] = useState('');
  const [credentials, setCredentials] = useState({});
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saving, setSaving] = useState(false);

  const providers = [
    {
      id: PMS_PROVIDERS.AIRBNB,
      name: 'Airbnb',
      description: 'Connect via iCal URL',
      fields: [
        { key: 'icalUrl', label: 'iCal URL', type: 'url', placeholder: 'https://www.airbnb.com/calendar/ical/...' }
      ]
    },
    {
      id: PMS_PROVIDERS.BOOKING,
      name: 'Booking.com',
      description: 'Connect via Hotel ID and API Key',
      fields: [
        { key: 'hotelId', label: 'Hotel ID', type: 'text', placeholder: '123456' },
        { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Enter your API key' }
      ]
    },
    {
      id: PMS_PROVIDERS.VRBO,
      name: 'VRBO / HomeAway',
      description: 'Connect via Property ID and API Key',
      fields: [
        { key: 'propertyId', label: 'Property ID', type: 'text', placeholder: '123456' },
        { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Enter your API key' }
      ]
    },
    {
      id: PMS_PROVIDERS.GUESTY,
      name: 'Guesty',
      description: 'Connect via API Key',
      fields: [
        { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Enter your Guesty API key' }
      ]
    },
    {
      id: PMS_PROVIDERS.HOSPITABLE,
      name: 'Hospitable',
      description: 'Connect via API Key',
      fields: [
        { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Enter your Hospitable API key' }
      ]
    },
    {
      id: PMS_PROVIDERS.HOSTAWAY,
      name: 'Hostaway',
      description: 'Connect via Account ID and API Key',
      fields: [
        { key: 'accountId', label: 'Account ID', type: 'text', placeholder: '123456' },
        { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Enter your API key' }
      ]
    }
  ];

  const selectedProviderData = providers.find(p => p.id === selectedProvider);

  const handleTestConnection = async () => {
    if (!selectedProvider) {
      showToast('Please select a provider', 'error');
      return;
    }

    // Validate all fields are filled
    const requiredFields = selectedProviderData.fields.map(f => f.key);
    const missingFields = requiredFields.filter(key => !credentials[key] || credentials[key].trim() === '');

    if (missingFields.length > 0) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const success = await testPMSConnection(selectedProvider, credentials);

      if (success) {
        setTestResult({ success: true, message: 'Connection successful!' });
        showToast('Connection test successful!');
      } else {
        setTestResult({ success: false, message: 'Connection failed. Please check your credentials.' });
        showToast('Connection test failed', 'error');
      }
    } catch (error) {
      setTestResult({ success: false, message: error.message });
      showToast('Connection test failed: ' + error.message, 'error');
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!selectedProvider) {
      showToast('Please select a provider', 'error');
      return;
    }

    if (!testResult || !testResult.success) {
      showToast('Please test the connection first', 'error');
      return;
    }

    setSaving(true);

    try {
      await savePMSConnection(listing.id, selectedProvider, credentials);
      showToast('PMS connection saved successfully!');
      onSave();
      onClose();
    } catch (error) {
      showToast('Error saving PMS connection: ' + error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Connect PMS"
      size="medium"
    >
      <div className="space-y-6">
        {/* Provider Selection */}
        <div>
          <label className="block text-sm font-medium mb-3">
            Select PMS Provider
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {providers.map(provider => (
              <button
                key={provider.id}
                onClick={() => {
                  setSelectedProvider(provider.id);
                  setCredentials({});
                  setTestResult(null);
                }}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  selectedProvider === provider.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium mb-1">{provider.name}</div>
                <div className="text-xs text-gray-600">{provider.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Credentials Form */}
        {selectedProviderData && (
          <div className="space-y-4">
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Enter Credentials</h4>

              {selectedProviderData.fields.map(field => (
                <div key={field.key} className="mb-3">
                  <label className="block text-sm font-medium mb-1">
                    {field.label} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type={field.type}
                    value={credentials[field.key] || ''}
                    onChange={(e) => {
                      setCredentials({
                        ...credentials,
                        [field.key]: e.target.value
                      });
                      setTestResult(null);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder={field.placeholder}
                  />
                </div>
              ))}
            </div>

            {/* Test Connection Button */}
            <div>
              <Button
                onClick={handleTestConnection}
                disabled={testing}
                variant="outline"
                className="w-full"
              >
                {testing ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    Testing Connection...
                  </>
                ) : (
                  <>
                    <Link2 size={16} />
                    Test Connection
                  </>
                )}
              </Button>
            </div>

            {/* Test Result */}
            {testResult && (
              <div
                className={`p-3 rounded-lg flex items-center gap-2 ${
                  testResult.success
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle size={20} className="text-green-600" />
                ) : (
                  <AlertCircle size={20} className="text-red-600" />
                )}
                <span
                  className={`text-sm ${
                    testResult.success ? 'text-green-800' : 'text-red-800'
                  }`}
                >
                  {testResult.message}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-2">
            <AlertCircle size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">How to find your credentials:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-800">
                <li><strong>Airbnb:</strong> Settings → Calendar → Export Calendar</li>
                <li><strong>Booking.com:</strong> Extranet → API Settings</li>
                <li><strong>VRBO:</strong> Account → API Access</li>
                <li><strong>Guesty:</strong> Settings → API → Generate Key</li>
                <li><strong>Hospitable:</strong> Settings → Integrations → API</li>
                <li><strong>Hostaway:</strong> Settings → API Access</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!testResult || !testResult.success || saving}
          >
            {saving ? 'Saving...' : 'Save Connection'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
