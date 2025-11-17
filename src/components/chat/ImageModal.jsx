// components/chat/ImageModal.jsx
import React from 'react';

export default function ImageModal({ imageUrl, imageName, onClose }) {
  if (!imageUrl) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="relative max-w-7xl max-h-full">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 bg-black bg-opacity-50 rounded-full p-2"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <img 
          src={imageUrl} 
          alt={imageName || 'Image'} 
          className="max-w-full max-h-full object-contain"
        />
        
        {imageName && (
          <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded text-sm">
            {imageName}
          </div>
        )}
      </div>
    </div>
  );
}