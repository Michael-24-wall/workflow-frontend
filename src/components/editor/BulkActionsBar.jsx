import React from 'react';

const BulkActionsBar = ({
  selectedCount,
  onBulkArchive,
  onBulkDelete,
  onBulkDuplicate,
  onClearSelection,
  loading
}) => {
  return (
    <div className="bg-blue-900 text-white rounded-lg shadow-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">{selectedCount}</span>
            </div>
            <span className="font-bold text-lg">
              {selectedCount} document{selectedCount !== 1 ? 's' : ''} selected
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onBulkDuplicate}
            disabled={loading}
            className="bg-white text-blue-900 px-4 py-2 rounded-lg font-bold hover:bg-blue-50 disabled:opacity-50 transition-colors flex items-center space-x-2"
          >
            <span>📋</span>
            <span>Duplicate</span>
          </button>

          <button
            onClick={onBulkArchive}
            disabled={loading}
            className="bg-blue-700 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-600 disabled:opacity-50 transition-colors flex items-center space-x-2"
          >
            <span>📁</span>
            <span>Archive</span>
          </button>

          <button
            onClick={onBulkDelete}
            disabled={loading}
            className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-500 disabled:opacity-50 transition-colors flex items-center space-x-2"
          >
            <span>🗑️</span>
            <span>Delete</span>
          </button>

          <button
            onClick={onClearSelection}
            className="text-white hover:text-blue-200 px-3 py-2 transition-colors"
            title="Clear selection"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkActionsBar;