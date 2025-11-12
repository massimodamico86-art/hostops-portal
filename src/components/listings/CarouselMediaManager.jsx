import { Plus, X, Edit } from 'lucide-react';

export const CarouselMediaManager = ({ formData, setFormData, setShowImageUpload, setUploadTarget, showToast }) => {
  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-semibold mb-3">Carousel Media</h3>
      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">📷 Images</label>
            <span className="text-xs text-gray-500">
              {(formData.carouselImages || []).length}/6
            </span>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            (Aspect ratio should be either 3:2 or 2:3:1)
          </p>

          {/* Image Grid */}
          <div className="grid grid-cols-3 gap-3">
            {/* Existing Images */}
            {(formData.carouselImages || []).map((img, idx) => (
              <div
                key={idx}
                className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200 cursor-pointer hover:border-gray-300 transition-colors group"
              >
                <img
                  src={img}
                  alt={`Carousel ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                {/* Hover Overlay with Edit and Delete */}
                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-50 transition-opacity"></div>
                <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setUploadTarget({ type: 'carousel', index: idx });
                      setShowImageUpload(true);
                    }}
                    className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100"
                  >
                    <Edit size={16} className="text-gray-700" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const newImages = (formData.carouselImages || []).filter((_, i) => i !== idx);
                      setFormData({ ...formData, carouselImages: newImages });
                    }}
                    className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-50"
                  >
                    <X size={16} className="text-red-500" />
                  </button>
                </div>
              </div>
            ))}

            {/* Add New Image Button */}
            {(!formData.carouselImages || formData.carouselImages.length < 6) && (
              <button
                onClick={() => {
                  const currentImages = formData.carouselImages || [];
                  const newIndex = currentImages.length;
                  setFormData({
                    ...formData,
                    carouselImages: [...currentImages, '']
                  });
                  setUploadTarget({ type: 'carousel', index: newIndex });
                  setShowImageUpload(true);
                }}
                className="aspect-video border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-gray-400 transition-colors bg-gray-50 hover:bg-gray-100"
              >
                <Plus size={32} className="text-gray-400 mb-1" />
                <span className="text-xs text-gray-500">Add Image</span>
              </button>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">🎥 Video</label>
            <span className="text-xs text-gray-500">0/1</span>
          </div>
          <p className="text-xs text-gray-500 mb-2">
            (Video must be in .mp4, .mov, .mks or .webm format; maximum size 40MB)
          </p>
          <button
            onClick={() => showToast('Video upload coming soon!')}
            className="w-full border-2 border-dashed border-gray-300 rounded-lg py-8 flex items-center justify-center hover:border-gray-400 transition-colors"
          >
            <Plus size={24} className="text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
};
