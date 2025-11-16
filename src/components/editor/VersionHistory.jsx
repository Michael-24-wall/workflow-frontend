import React, { useEffect } from 'react';
import { X, Download, RotateCcw, User, Calendar } from 'lucide-react';
import useEditorStore from '../../stores/editorStore';

const VersionHistory = ({ documentId, onClose }) => {
  const { documentHistory, getDocumentVersions, restoreDocumentVersion } = useEditorStore();

  useEffect(() => {
    if (documentId) {
      getDocumentVersions(documentId);
    }
  }, [documentId]);

  const handleRestore = async (versionId) => {
    if (confirm('Are you sure you want to restore this version? Current changes will be lost.')) {
      await restoreDocumentVersion(documentId, versionId);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Version History</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Versions List */}
      <div className="flex-1 overflow-y-auto">
        {documentHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No version history available</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {documentHistory.map((version, index) => (
              <div
                key={version.id}
                className="border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">
                      {version.created_by?.email || 'Unknown User'}
                    </span>
                  </div>
                  {index === 0 && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      Current
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(version.created_at)}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleRestore(version.id)}
                    className="flex items-center px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Restore
                  </button>
                  <button className="flex items-center px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded transition-colors">
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VersionHistory;