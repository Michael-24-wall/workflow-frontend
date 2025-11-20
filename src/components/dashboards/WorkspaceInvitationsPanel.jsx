// components/dashboard/WorkspaceInvitationsPanel.jsx
import React, { useState, useEffect } from 'react';
import { workspaceService } from '../../services/chat/api';

export default function WorkspaceInvitationsPanel() {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Loading workspace invitations...');
      
      const response = await workspaceService.getMyWorkspaceInvitations();
      console.log('📨 Workspace invitations response:', response);
      
      const invitationsData = response.invitations || [];
      setInvitations(invitationsData);
      
    } catch (error) {
      console.error('❌ Failed to load workspace invitations:', error);
      setError('Failed to load workspace invitations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async (workspaceId) => {
    try {
      console.log('✅ Accepting workspace invitation:', workspaceId);
      
      await workspaceService.acceptWorkspaceInvitation(workspaceId);
      
      // Remove from local state
      setInvitations(prev => prev.filter(inv => inv.id !== workspaceId));
      
      console.log('🎉 Successfully joined workspace!');
      
      alert('You have successfully joined the workspace!');
      
    } catch (error) {
      console.error('❌ Failed to accept workspace invitation:', error);
      alert('Failed to accept invitation. Please try again.');
    }
  };

  const handleDeclineInvitation = async (workspaceId) => {
    try {
      console.log('❌ Declining workspace invitation:', workspaceId);
      
      await workspaceService.declineWorkspaceInvitation(workspaceId);
      
      // Remove from local state
      setInvitations(prev => prev.filter(inv => inv.id !== workspaceId));
      
      console.log('✅ Workspace invitation declined');
      
    } catch (error) {
      console.error('❌ Failed to decline workspace invitation:', error);
      alert('Failed to decline invitation. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            🏢 Workspace Invitations
            {invitations.length > 0 && (
              <span className="ml-2 bg-orange-500 text-white text-xs rounded-full px-2 py-1">
                {invitations.length} new
              </span>
            )}
          </h3>
          <button
            onClick={loadInvitations}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {error ? (
          <div className="text-center py-8">
            <div className="text-red-500 mb-2">❌ {error}</div>
            <button
              onClick={loadInvitations}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Try Again
            </button>
          </div>
        ) : invitations.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-3">🏢</div>
            <p className="text-gray-500 text-sm">No pending workspace invitations</p>
            <p className="text-gray-400 text-xs mt-1">
              You'll see workspace invitations here when they're sent to you
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {invitations.map(invitation => (
              <div
                key={invitation.id}
                className="border border-orange-200 rounded-lg p-4 bg-orange-50 hover:bg-orange-100 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 flex items-center">
                      {invitation.name}
                      <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                        Workspace
                      </span>
                    </h4>
                    
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">{invitation.invited_by_name}</span> invited you to join this workspace
                    </p>
                    
                    {invitation.description && (
                      <p className="text-sm text-gray-500 mt-2">
                        {invitation.description}
                      </p>
                    )}
                    
                    {invitation.organization_name && (
                      <p className="text-xs text-gray-400 mt-2">
                        Organization: {invitation.organization_name}
                      </p>
                    )}
                    
                    <p className="text-xs text-gray-400">
                      Invited: {new Date(invitation.invited_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleAcceptInvitation(invitation.id)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleDeclineInvitation(invitation.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}