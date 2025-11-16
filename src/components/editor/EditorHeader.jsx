import React, { useState } from 'react';
import {
  Save,
  Users,
  History,
  Share2,
  Download,
  MoreVertical,
  ChevronLeft
} from 'lucide-react';

const EditorHeader = ({
  document,
  isSaving,
  hasUnsavedChanges,
  onSave,
  onPanelToggle,
  activePanel
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const handlePanelToggle = (panel) => {
    if (activePanel === panel) {
      onPanelToggle(null);
    } else {
      onPanelToggle(panel);
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => window.history.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>

          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {document?.title}
            </h1>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              {hasUnsavedChanges && (
                <span className="text-orange-600">Unsaved changes</span>
              )}
              {isSaving && (
                <span className="text-blue-600">Saving...</span>
              )}
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-2">
          {/* Save Button */}
          <button
            onClick={onSave}
            disabled={!hasUnsavedChanges || isSaving}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save'}
          </button>

          {/* Action Buttons */}
          <button
            onClick={() => handlePanelToggle('collaboration')}
            className={`p-2 rounded-lg transition-colors ${
              activePanel === 'collaboration'
                ? 'bg-blue-100 text-blue-600'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Users className="w-5 h-5" />
          </button>

          <button
            onClick={() => handlePanelToggle('history')}
            className={`p-2 rounded-lg transition-colors ${
              activePanel === 'history'
                ? 'bg-blue-100 text-blue-600'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <History className="w-5 h-5" />
          </button>

          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <Share2 className="w-5 h-5" />
          </button>

          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <Download className="w-5 h-5" />
          </button>

          {/* More Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <button className="flex items-center w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                  Make a copy
                </button>
                <button className="flex items-center w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                  Rename
                </button>
                <button className="flex items-center w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                  Export as PDF
                </button>
                <div className="border-t border-gray-200">
                  <button className="flex items-center w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50">
                    Delete document
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorHeader;