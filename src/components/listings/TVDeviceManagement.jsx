import { Plus, Trash2 } from 'lucide-react';
import Button from '../Button';

export const TVDeviceManagement = ({ formData, setFormData }) => {
  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-semibold mb-3">Manage TVs</h3>
      {(formData.tvDevices || []).map((tv, idx) => (
        <div key={idx} className="flex gap-2 items-center mb-2">
          <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-sm">📺</div>
          <input
            type="text"
            value={tv.name}
            onChange={(e) => {
              const newTvs = [...(formData.tvDevices || [])];
              newTvs[idx].name = e.target.value;
              setFormData({ ...formData, tvDevices: newTvs });
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
            onClick={() => {
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
        onClick={() =>
          setFormData({
            ...formData,
            tvDevices: [
              ...(formData.tvDevices || []),
              { name: '', otp: Math.floor(100000 + Math.random() * 900000).toString() },
            ],
          })
        }
      >
        <Plus size={14} /> Add New
      </Button>
    </div>
  );
};
