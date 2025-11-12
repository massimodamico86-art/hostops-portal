import { Plus, X, Trash2 } from 'lucide-react';
import Button from '../Button';

export const QRCodeManager = ({ formData, setFormData }) => {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold">QR codes</h3>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.showQRCodes || false}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  showQRCodes: e.target.checked,
                })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            setFormData({
              ...formData,
              qrCodes: [
                ...(formData.qrCodes || []),
                { type: '', name: '', details: '' },
              ],
            })
          }
        >
          <Plus size={14} /> Add New
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b text-xs text-gray-600">
            <tr>
              <th className="px-3 py-2 text-left w-12"></th>
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">QR Code Image / URL</th>
              <th className="px-3 py-2 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {(formData.qrCodes || []).length > 0 ? (
              (formData.qrCodes || []).map((qr, idx) => (
                <tr key={idx} className="border-b">
                  <td className="px-3 py-2 text-center">
                    <div className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center">
                      <span className="text-xs">☰</span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={qr.type}
                      onChange={(e) => {
                        const newQrs = [...(formData.qrCodes || [])];
                        newQrs[idx].type = e.target.value;
                        setFormData({ ...formData, qrCodes: newQrs });
                      }}
                      placeholder="Type"
                      className="w-full px-2 py-1 border rounded text-sm"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={qr.name}
                      onChange={(e) => {
                        const newQrs = [...(formData.qrCodes || [])];
                        newQrs[idx].name = e.target.value;
                        setFormData({ ...formData, qrCodes: newQrs });
                      }}
                      placeholder="Name"
                      className="w-full px-2 py-1 border rounded text-sm"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="space-y-2">
                      {/* QR Code Preview */}
                      {qr.details && (
                        <div className="flex items-center gap-2">
                          {qr.details.startsWith('data:image') || qr.details.startsWith('http') ? (
                            <img
                              src={qr.details}
                              alt="QR preview"
                              className="w-12 h-12 object-contain border rounded"
                            />
                          ) : (
                            <div className="text-xs text-gray-500 truncate max-w-[150px]">
                              {qr.details}
                            </div>
                          )}
                          <button
                            onClick={() => {
                              const newQrs = [...(formData.qrCodes || [])];
                              newQrs[idx].details = '';
                              setFormData({ ...formData, qrCodes: newQrs });
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}

                      {/* Input and Upload Buttons */}
                      <div className="flex gap-1">
                        <input
                          type="text"
                          value={qr.details && !qr.details.startsWith('data:image') && !qr.details.startsWith('http') ? qr.details : ''}
                          onChange={(e) => {
                            const newQrs = [...(formData.qrCodes || [])];
                            newQrs[idx].details = e.target.value;
                            setFormData({ ...formData, qrCodes: newQrs });
                          }}
                          placeholder="Enter URL"
                          className="flex-1 px-2 py-1 border rounded text-sm"
                        />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file && file.type.startsWith('image/')) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                const newQrs = [...(formData.qrCodes || [])];
                                newQrs[idx].details = reader.result;
                                setFormData({ ...formData, qrCodes: newQrs });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                          id={`qr-upload-${idx}`}
                        />
                        <label
                          htmlFor={`qr-upload-${idx}`}
                          className="px-2 py-1 text-xs border rounded cursor-pointer hover:bg-gray-50 flex items-center gap-1"
                        >
                          <Plus size={12} />
                          Upload
                        </label>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => {
                        const newQrs = (formData.qrCodes || []).filter((_, i) => i !== idx);
                        setFormData({ ...formData, qrCodes: newQrs });
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-3 py-8 text-center text-gray-500 text-sm">
                  No QR codes added yet. Click "Add New" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
