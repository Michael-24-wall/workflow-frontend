import React from 'react';

const RecentDocuments = ({ documents, onDocumentOpen }) => {
  if (!documents || documents.length === 0) return null;

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
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-blue-100 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-blue-900">Recent Documents</h3>
        <span className="text-sm text-gray-500">Last 5 opened documents</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {documents.slice(0, 5).map((document) => (
          <button
            key={document.id}
            onClick={() => onDocumentOpen(document.id)}
            className="text-left p-4 border-2 border-blue-100 rounded-xl hover:border-blue-900 hover:bg-blue-50 transition-all duration-200 group"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="text-2xl group-hover:scale-110 transition-transform">
                {getDocumentIcon(document.document_type)}
              </div>
              {document.is_archived && (
                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">Archived</span>
              )}
            </div>
            
            <h4 className="font-bold text-blue-900 text-sm mb-2 line-clamp-2 group-hover:text-blue-800">
              {document.title}
            </h4>
            
            <div className="text-xs text-gray-500">
              Updated {formatDate(document.updated_at)}
            </div>
            
            <div className="mt-3 text-blue-900 text-sm font-medium group-hover:text-blue-800">
              Open →
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default RecentDocuments;