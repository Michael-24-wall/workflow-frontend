// components/chat/WorkspaceInviteModal.jsx
import React, { useState } from 'react';
import { workspaceService } from '../../services/chat/api';

export default function WorkspaceInviteModal({ workspace, isOpen, onClose, onInviteSent }) {
  const [emails, setEmails] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  console.log('🔍 WorkspaceInviteModal props:', { 
    isOpen, 
    workspace: workspace?.name,
    hasOnClose: !!onClose 
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!emails.trim()) return;

    setLoading(true);
    setError(null);
    
    try {
      const emailList = emails.split(',').map(email => email.trim()).filter(email => email);
      
      console.log('📤 Sending workspace invite:', {
        workspaceId: workspace.id,
        workspaceName: workspace.name,
        emails: emailList
      });
      
      const response = await workspaceService.inviteToWorkspace(workspace.id, emailList);
      setResult(response);
      
      console.log('✅ Workspace invite response:', response);
      
      if (onInviteSent) {
        await onInviteSent(emailList);
      }
      
      // Clear form on success
      setEmails('');
      
    } catch (error) {
      console.error('❌ Workspace invite failed:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    console.log('🔒 Closing modal');
    setEmails('');
    setError(null);
    setResult(null);
    if (onClose) {
      onClose();
    }
  };

  // 🆕 ADD THIS: Debug why modal might not be showing
  if (!isOpen) {
    console.log('🚫 Modal not open, isOpen:', isOpen);
    return null;
  }

  console.log('✅ Modal is open, rendering...');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">
            Invite to {workspace?.name}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Addresses
            </label>
            <textarea
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              placeholder="Enter email addresses separated by commas"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="3"
              disabled={loading}
            />
            <p className="text-xs text-gray-400 mt-1">
              Separate multiple emails with commas
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-900 border border-red-700 rounded-md">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {result && (
            <div className="mb-4 p-3 bg-green-900 border border-green-700 rounded-md">
              <h4 className="text-green-200 font-semibold mb-2">Invitation Results:</h4>
              {result.invited_users?.length > 0 && (
                <p className="text-green-200 text-sm">
                  ✅ Invited: {result.invited_users.join(', ')}
                </p>
              )}
              {result.invitations_sent?.length > 0 && (
                <p className="text-green-200 text-sm">
                  📧 Invitations sent: {result.invitations_sent.join(', ')}
                </p>
              )}
              {result.already_members?.length > 0 && (
                <p className="text-yellow-200 text-sm">
                  ⚠️ Already members: {result.already_members.join(', ')}
                </p>
              )}
              {result.invalid_emails?.length > 0 && (
                <p className="text-red-200 text-sm">
                  ❌ Invalid emails: {result.invalid_emails.join(', ')}
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-300 hover:text-white disabled:opacity-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !emails.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Sending...' : 'Send Invites'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}