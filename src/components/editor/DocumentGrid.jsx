import React from 'react';

const DocumentGrid = ({
  documents,
  selectedDocuments,
  onDocumentSelect,
  onDocumentOpen,
  onDocumentDuplicate,
  onDocumentArchive,
  onDocumentDelete,
  onDocumentExport,
  isSelectAllChecked,
  onSelectAll,
}) => {
  const getDocumentIcon = (documentType) => {
    const icons = {
      spreadsheet: '📊',
      budget: '💰',
      report: '📈',
      inventory: '📦',
      schedule: '📅',
      default: '📄'
    };
    return icons[documentType] || icons.default;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Select All Header */}
      {documents.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-blue-100 p-4">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={isSelectAllChecked}
              onChange={(e) => onSelectAll(e.target.checked)}
              className="rounded border-blue-900 text-blue-900 focus:ring-blue-900"
            />
            <span className="font-medium text-blue-900">
              Select all {documents.length} documents
            </span>
          </label>
        </div>
      )}

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {documents.map((document) => (
          <div
            key={document.id}
            className={`
              bg-white rounded-lg shadow-sm border-2 transition-all duration-200 hover:shadow-md
              ${selectedDocuments.includes(document.id) 
                ? 'border-blue-900 ring-2 ring-blue-900 ring-opacity-20' 
                : 'border-blue-100 hover:border-blue-300'
              }
            `}
          >
            {/* Document Header */}
            <div className="p-4 border-b border-blue-50">
              <div className="flex items-start justify-between mb-3">
                <div className="text-3xl">
                  {getDocumentIcon(document.document_type)}
                </div>
                <input
                  type="checkbox"
                  checked={selectedDocuments.includes(document.id)}
                  onChange={(e) => onDocumentSelect(document.id, e.target.checked)}
                  className="rounded border-blue-900 text-blue-900 focus:ring-blue-900"
                />
              </div>
              
              <h3 className="font-bold text-blue-900 text-lg mb-2 truncate">
                {document.title}
              </h3>
              
              {document.description && (
                <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                  {document.description}
                </p>
              )}
            </div>

            {/* Document Metadata */}
            <div className="p-4 space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Type: {document.document_type}</span>
                <span>{formatFileSize(document.size)}</span>
              </div>
              
              <div className="flex justify-between text-xs text-gray-500">
                <span>Updated: {formatDate(document.updated_at)}</span>
                {document.is_archived && (
                  <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">Archived</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-blue-50 flex justify-between items-center">
              <button
                onClick={() => onDocumentOpen(document.id)}
                className="bg-blue-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-800 transition-colors text-sm"
              >
                Open
              </button>
              
              <div className="relative group">
                <button className="p-2 text-gray-400 hover:text-blue-900 rounded-lg hover:bg-blue-50 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                  </svg>
                </button>
                
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-blue-100 py-1 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <button
                    onClick={() => onDocumentDuplicate(document.id)}
                    className="w-full text-left px-4 py-2 text-sm text-blue-900 hover:bg-blue-50 flex items-center space-x-2"
                  >
                    <span>📋</span>
                    <span>Duplicate</span>
                  </button>
                  <button
                    onClick={() => onDocumentExport(document.id, 'json')}
                    className="w-full text-left px-4 py-2 text-sm text-blue-900 hover:bg-blue-50 flex items-center space-x-2"
                  >
                    <span>📤</span>
                    <span>Export JSON</span>
                  </button>
                  <button
                    onClick={() => onDocumentExport(document.id, 'csv')}
                    className="w-full text-left px-4 py-2 text-sm text-blue-900 hover:bg-blue-50 flex items-center space-x-2"
                  >
                    <span>📊</span>
                    <span>Export CSV</span>
                  </button>
                  <button
                    onClick={() => onDocumentArchive(document.id)}
                    className="w-full text-left px-4 py-2 text-sm text-blue-900 hover:bg-blue-50 flex items-center space-x-2"
                  >
                    <span>📁</span>
                    <span>{document.is_archived ? 'Unarchive' : 'Archive'}</span>
                  </button>
                  <button
                    onClick={() => onDocumentDelete(document.id)}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                  >
                    <span>🗑️</span>
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentGrid;