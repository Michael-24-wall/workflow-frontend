import React from 'react';
import { Link } from 'react-router-dom';

const EditorHeader = ({ user, onLogout, document, hasUnsavedChanges, onSave, onExport, onShare }) => {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side */}
          <div className="flex items-center space-x-4">
            <Link 
              to="/editor" 
              className="text-gray-600 hover:text-gray-900 flex items-center"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Editor
            </Link>
            
            {document && (
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {document.title}
                </h1>
                <p className="text-sm text-gray-500">
                  {hasUnsavedChanges ? 'Unsaved changes' : 'All changes saved'}
                </p>
              </div>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {document && (
              <>
                <button
                  onClick={onSave}
                  disabled={!hasUnsavedChanges}
                  className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  Save
                </button>
                
                <button
                  onClick={onExport}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded text-sm"
                >
                  Export
                </button>
                
                <button
                  onClick={onShare}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded text-sm"
                >
                  Share
                </button>
              </>
            )}

            <div className="flex items-center space-x-2 border-l pl-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-800 text-sm font-medium">
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="text-gray-600 hover:text-gray-900 text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default EditorHeader;