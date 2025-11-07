import React from 'react';

const DocumentList = ({
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
    <div className="bg-white rounded-lg shadow-sm border border-blue-100 overflow-hidden">
      {/* Table Header */}
      <div className="bg-blue-50 border-b border-blue-100 px-6 py-4">
        <div className="flex items-center space-x-6">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={isSelectAllChecked}
              onChange={(e) => onSelectAll(e.target.checked)}
              className="rounded border-blue-900 text-blue-900 focus:ring-blue-900"
            />
            <span className="font-bold text-blue-900 text-sm">Select All</span>
          </label>
          <div className="flex-1 grid grid-cols-12 gap-4 text-blue-900 font-bold text-sm">
            <div className="col-span-5">Document</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-2">Size</div>
            <div className="col-span-3">Last Modified</div>
          </div>
          <div className="w-20 text-center text-blue-900 font-bold text-sm">Actions</div>
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-blue-50">
        {documents.map((document) => (
          <div
            key={document.id}
            className={`
              px-6 py-4 hover:bg-blue-50 transition-colors
              ${selectedDocuments.includes(document.id) ? 'bg-blue-25' : ''}
            `}
          >
            <div className="flex items-center space-x-6">
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={selectedDocuments.includes(document.id)}
                onChange={(e) => onDocumentSelect(document.id, e.target.checked)}
                className="rounded border-blue-900 text-blue-900 focus:ring-blue-900"
              />

              {/* Document Info */}
              <div className="flex-1 grid grid-cols-12 gap-4 items-center">
                <div className="col-span-5 flex items-center space-x-4">
                  <div className="text-2xl">
                    {getDocumentIcon(document.document_type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-blue-900 text-lg truncate">
                      {document.title}
                    </h3>
                    {document.description && (
                      <p className="text-gray-600 text-sm truncate">
                        {document.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="col-span-2">
                  <span className="bg-blue-100 text-blue-900 px-3 py-1 rounded-full text-sm font-medium capitalize">
                    {document.document_type}
                  </span>
                </div>

                <div className="col-span-2 text-gray-600 text-sm">
                  {formatFileSize(document.size)}
                </div>

                <div className="col-span-3 text-gray-600 text-sm">
                  {formatDate(document.updated_at)}
                  {document.is_archived && (
                    <span className="ml-2 bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">Archived</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="w-20 flex items-center justify-center space-x-2">
                <button
                  onClick={() => onDocumentOpen(document.id)}
                  className="bg-blue-900 text-white px-3 py-2 rounded-lg font-medium hover:bg-blue-800 transition-colors text-sm"
                >
                  Open
                </button>
                
                <div className="relative group">
                  <button className="p-2 text-gray-400 hover:text-blue-900 rounded-lg hover:bg-blue-100 transition-colors">
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
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentList;