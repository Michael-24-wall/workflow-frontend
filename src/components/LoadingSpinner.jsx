import React from 'react';

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <p className="text-lg">Loading chat...</p>
    </div>
  </div>

  
);




export default LoadingSpinner;