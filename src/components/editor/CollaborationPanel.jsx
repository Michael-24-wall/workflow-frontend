import React, { useEffect, useState } from 'react';
import { X, Search, UserPlus, MoreVertical, Mail } from 'lucide-react';
import useEditorStore from '../../stores/editorStore';

const CollaborationPanel = ({ documentId, onClose }) => {
  const { collaborators, getDocumentCollaborators, shareDocument } = useEditorStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  useEffect(() => {
    if (documentId) {
      getDocumentCollaborators(documentId);
    }
  }, [documentId]);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    // This would typically search for users by email and then share
    await shareDocument(documentId, [/* user IDs */], 'view');
    setInviteEmail('');
    setShowInviteDialog(false);
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Collaborators</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Search and Invite */}
      <div className="p-4 border-b border-gray-200 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search collaborators..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={() => setShowInviteDialog(true)}
          className="flex items-center w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Invite people
        </button>
      </div>

      {/* Collaborators List */}
      <div className="flex-1 overflow-y-auto">
        {collaborators.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <UserPlus className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No collaborators yet</p>
          </div>
        ) : (
          <div className="p-2">
            {collaborators.map((collaborator) => (
              <div
                key={collaborator.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-medium">
                      {collaborator.user?.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {collaborator.user?.email}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {collaborator.permission_level}
                    </p>
                  </div>
                </div>

                <button className="p-1 hover:bg-gray-200 rounded transition-colors">
                  <MoreVertical className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite Dialog */}
      {showInviteDialog && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-sm p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Invite to collaborate</h4>
            <form onSubmit={handleInvite}>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowInviteDialog(false)}
                  className="px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Send invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollaborationPanel;