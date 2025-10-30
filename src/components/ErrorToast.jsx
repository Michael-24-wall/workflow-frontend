// src/components/ErrorToast.jsx
import React from 'react';

const ErrorToast = ({ error, onClose }) => (
  <div className="fixed top-4 right-4 bg-red-600 text-white p-4 rounded-lg shadow-xl max-w-sm z-50">
    <div className="flex items-center space-x-4">
      <div className="flex-1">
        <div className="font-semibold">Error</div>
        <div className="text-sm mt-1">{error}</div>
      </div>
      <button 
        onClick={onClose}
        className="hover:bg-red-700 rounded-full w-6 h-6 flex items-center justify-center transition-colors"
        aria-label="Close error message"
      >
        ×
      </button>
    </div>
  </div>
);

export default ErrorToast;