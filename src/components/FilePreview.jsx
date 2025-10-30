// src/components/FilePreview.jsx
import React from 'react';

const FilePreview = ({ file, filePreview, uploadProgress, uploading, onRemove }) => (
  <div className="bg-gray-800 border-t border-gray-700 p-4">
    <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
      <div className="flex items-center space-x-3">
        <div className="text-2xl">
          📄
        </div>
        <div>
          <div className="text-white font-medium">{file.name}</div>
          <div className="text-gray-400 text-sm">
            {formatFileSize(file.size)}
          </div>
        </div>
      </div>
      <button 
        onClick={onRemove}
        className="text-gray-400 hover:text-white transition-colors"
        aria-label="Remove file"
        disabled={uploading}
      >
        ✕
      </button>
    </div>
    
    {uploading && (
      <div className="mt-2">
        <div className="flex justify-between text-sm text-gray-400 mb-1">
          <span>Uploading...</span>
          <span>{uploadProgress}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          ></div>
        </div>
      </div>
    )}
    
    {filePreview && (
      <div className="mt-3">
        <img 
          src={filePreview} 
          alt="Preview" 
          className="max-w-48 max-h-48 rounded-lg border border-gray-600 object-cover"
        />
      </div>
    )}
  </div>
);

export default FilePreview;