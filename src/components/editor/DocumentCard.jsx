import React, { useState } from 'react';
import { 
  MoreVertical, 
  FileText, 
  Users, 
  Calendar,
  Share2,
  Archive,
  Copy,
  Trash2
} from 'lucide-react';
import useEditorStore from '../../stores/editorStore';

const DocumentCard = ({ document, viewMode }) => {
  const [showMenu, setShowMenu] = useState(false);
  const { setCurrentDocument, duplicateDocument, archiveDocument } = useEditorStore();

  const handleMenuAction = async (action) => {
    setShowMenu(false);
    
    switch (action) {
      case 'open':
        setCurrentDocument(document);
        // Navigate to editor - you'll handle this based on your routing
        break;
      case 'duplicate':
        await duplicateDocument(document.id);
        break;
      case 'archive':
        await archiveDocument(document.id);
        break;
      case 'share':
        // Handle share logic
        break;
      default:
        break;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (viewMode === 'list') {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <div className="flex-shrink-0">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {document.title}
              </h3>
              <p className="text-gray-600 text-sm truncate">
                {document.description || 'No description'}
              </p>
              
              <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {formatDate(document.updated_at)}
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  {document.collaborators_count || 0} collaborators
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  document.status === 'active' 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {document.status}
                </span>
              </div>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-gray-400" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <button
                  onClick={() => handleMenuAction('open')}
                  className="flex items-center w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Open
                </button>
                <button
                  onClick={() => handleMenuAction('duplicate')}
                  className="flex items-center w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate
                </button>
                <button
                  onClick={() => handleMenuAction('share')}
                  className="flex items-center w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </button>
                <button
                  onClick={() => handleMenuAction('archive')}
                  className="flex items-center w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Archive className="w-4 h-4 mr-2" />
                  {document.is_archived ? 'Unarchive' : 'Archive'}
                </button>
                <div className="border-t border-gray-200">
                  <button className="flex items-center w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Grid View
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between mb-3">
        <FileText className="w-10 h-10 text-blue-600 flex-shrink-0" />
        
        <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              <button
                onClick={() => handleMenuAction('open')}
                className="flex items-center w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                <FileText className="w-4 h-4 mr-2" />
                Open
              </button>
              <button
                onClick={() => handleMenuAction('duplicate')}
                className="flex items-center w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
              </button>
              <button
                onClick={() => handleMenuAction('share')}
                className="flex items-center w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </button>
              <button
                onClick={() => handleMenuAction('archive')}
                className="flex items-center w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                <Archive className="w-4 h-4 mr-2" />
                {document.is_archived ? 'Unarchive' : 'Archive'}
              </button>
            </div>
          )}
        </div>
      </div>

      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
        {document.title}
      </h3>
      
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
        {document.description || 'No description'}
      </p>

      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            {formatDate(document.updated_at)}
          </div>
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-1" />
            {document.collaborators_count || 0}
          </div>
        </div>
        
        <span className={`px-2 py-1 rounded-full text-xs ${
          document.status === 'active' 
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {document.status}
        </span>
      </div>
    </div>
  );
};

export default DocumentCard;