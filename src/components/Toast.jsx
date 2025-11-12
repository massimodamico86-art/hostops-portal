
import { Check, X } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose }) => {
  return (
    <div className={`fixed bottom-4 right-4 ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'} text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 z-50`}>
      <Check size={20} />
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-75">
        <X size={18} />
      </button>
    </div>
  );
};

export default Toast;
