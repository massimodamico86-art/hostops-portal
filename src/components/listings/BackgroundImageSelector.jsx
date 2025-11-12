import { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';
import Modal from '../Modal';
import Button from '../Button';
export const BackgroundImageSelector = ({ isOpen, onClose, currentImage, onSelect }) => {
  const [selectedImage, setSelectedImage] = useState(currentImage || '');
  const fileInputRef = useRef(null);

  // Update selected image when currentImage prop changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedImage(currentImage || '');
    }
  }, [isOpen, currentImage]);
  
  const stockImages = [
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=3840',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=3840',
    'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=3840',
    'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=3840',
    'https://images.unsplash.com/photo-1540202404-a2f29016b523?w=3840',
    'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=3840',
    'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=3840',
    'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=3840',
  ];
  
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSave = () => {
    onSelect(selectedImage);
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <Modal isOpen={true} onClose={onClose} title="Select background image" size="large">
      <div className="space-y-4">
        {/* Stock Images Thumbnails */}
        <div className="flex gap-3 overflow-x-auto pb-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-shrink-0 w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-gray-400 transition-colors bg-gray-50"
          >
            <Plus size={32} className="text-gray-400" />
          </button>
          {stockImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedImage(img)}
              className={`flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                selectedImage === img ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-gray-300'
              }`}
              style={{ height: '96px' }}
            >
              <img 
                src={img} 
                alt={`Option ${idx + 1}`} 
                className="h-full object-cover"
                style={{ width: 'auto', maxWidth: '200px' }}
              />
            </button>
          ))}
        </div>
        
        {/* Current Background Preview */}
        <div>
          <label className="block text-sm font-medium mb-2">Current background</label>
          <div className="w-full h-64 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
            {selectedImage ? (
              <img src={selectedImage} alt="Selected background" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No image selected
              </div>
            )}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </div>
    </Modal>
  );
};
