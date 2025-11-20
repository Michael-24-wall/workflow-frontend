// components/chat/WorkspaceSelector.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { workspaceService } from '../../../services/chat/api';
import WorkspaceInviteModal from '../WorkspaceInviteModal';

export default function WorkspaceSelector() {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [newWorkspace, setNewWorkspace] = useState({ name: '', subdomain: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const isAuthenticated = () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.log('🚫 No access token found');
      return false;
    }
    
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.log('❌ Invalid token format');
        return false;
      }
      return true;
    } catch (error) {
      console.log('❌ Token validation error:', error);
      return false;
    }
  };

  const loadWorkspaces = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('🔄 Loading workspaces...');
      
      if (!isAuthenticated()) {
        setError('Please login to access workspaces');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      console.log('🔐 Token available, making API request...');
      const data = await workspaceService.getWorkspaces();
      console.log('✅ Workspaces loaded:', data);
      
      if (Array.isArray(data)) {
        setWorkspaces(data);
      } else if (data && Array.isArray(data.results)) {
        setWorkspaces(data.results);
      } else if (data && data.workspaces) {
        setWorkspaces(data.workspaces);
      } else {
        console.warn('⚠️ Unexpected workspaces response format:', data);
        setWorkspaces([]);
      }
    } catch (error) {
      console.error('❌ Failed to load workspaces:', error);
      handleWorkspaceError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleWorkspaceError = (error) => {
    const errorMessage = error.message || 'Failed to load workspaces';
    
    if (errorMessage.includes('401') || errorMessage.includes('Authentication')) {
      setError('Session expired. Please login again.');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('chat_token');
      setTimeout(() => navigate('/login'), 3000);
    } else if (errorMessage.includes('Network') || errorMessage.includes('fetch')) {
      setError('Network error. Please check your connection.');
    } else {
      setError(errorMessage);
    }
  };

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    try {
      setError('');
      console.log('🔄 Creating workspace:', newWorkspace);
      
      if (!newWorkspace.name.trim()) {
        throw new Error('Workspace name is required');
      }
      if (!newWorkspace.subdomain.trim()) {
        throw new Error('Subdomain is required');
      }
      
      const workspaceData = {
        name: newWorkspace.name.trim(),
        subdomain: newWorkspace.subdomain.trim().toLowerCase(),
        description: `Workspace for ${newWorkspace.name.trim()}`
      };
      
      console.log('📦 Sending workspace data:', workspaceData);
      const createdWorkspace = await workspaceService.createWorkspace(workspaceData);
      console.log('✅ Workspace created:', createdWorkspace);
      
      setNewWorkspace({ name: '', subdomain: '' });
      setShowCreateForm(false);
      await loadWorkspaces();
      
    } catch (error) {
      console.error('❌ Failed to create workspace:', error);
      setError(error.message || 'Failed to create workspace. Please try again.');
    }
  };

  const handleWorkspaceInvite = async (emailList) => {
    try {
      console.log('📧 Inviting to workspace:', { 
        workspaceId: selectedWorkspace?.id, 
        emails: emailList 
      });
      
      const response = await workspaceService.inviteToWorkspace(
        selectedWorkspace?.id, 
        emailList
      );
      
      console.log('✅ Workspace invitation response:', response);
      
      if (response.invited_users && response.invited_users.length > 0) {
        alert(`✅ Successfully invited ${response.invited_users.length} user(s) to the workspace!`);
      } else if (response.invitations_sent && response.invitations_sent.length > 0) {
        alert(`📧 Sent ${response.invitations_sent.length} invitation(s) to join the workspace!`);
      } else {
        alert('⚠️ No new users were invited. They might already be workspace members.');
      }
      
      return response;
    } catch (error) {
      console.error('❌ Workspace invite error:', error);
      
      const errorMessage = error.response?.data?.error || error.message || 'Failed to send workspace invitations';
      alert(`❌ Error: ${errorMessage}`);
      
      throw error;
    }
  };

  const openInviteModal = (workspace) => {
    console.log('🎯 Opening invite modal for workspace:', workspace);
    setSelectedWorkspace(workspace);
    setShowInviteModal(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('chat_token');
    localStorage.removeItem('user_email');
    navigate('/login');
  };

  const refreshWorkspaces = () => {
    loadWorkspaces();
  };

  const DebugInfo = () => {
    const token = localStorage.getItem('access_token');
    return (
      <div className="fixed top-4 right-4 bg-gray-800 p-4 rounded-lg text-xs text-gray-400 max-w-xs border border-gray-700 z-50">
        <div className="font-semibold mb-2">Debug Information</div>
        <div>🔐 Authenticated: {isAuthenticated() ? 'Yes' : 'No'}</div>
        <div>🔐 Token: {token ? `${token.substring(0, 15)}...` : 'None'}</div>
        <div>🔄 Loading: {loading ? 'Yes' : 'No'}</div>
        <div>📊 Workspaces: {workspaces.length}</div>
        <div>📝 Create Form: {showCreateForm ? 'Open' : 'Closed'}</div>
        <div>📧 Invite Modal: {showInviteModal ? 'Open' : 'Closed'}</div>
        <div className="mt-2 space-y-1">
          <button
            onClick={refreshWorkspaces}
            className="block w-full text-blue-400 hover:text-blue-300 text-left"
          >
            🔄 Refresh
          </button>
          <button
            onClick={handleLogout}
            className="block w-full text-red-400 hover:text-red-300 text-left"
          >
            🚪 Logout
          </button>
        </div>
        {error && (
          <div className="mt-2 p-2 bg-red-900/50 rounded text-red-400">
            ❌ {error}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <DebugInfo />
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading workspaces...</p>
          <p className="text-gray-500 text-sm mt-2">
            {isAuthenticated() ? 'Fetching your workspaces...' : 'Checking authentication...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <DebugInfo />
      
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-white mb-4">Select a Workspace</h1>
          <p className="text-gray-400">Choose a workspace to start chatting with your team</p>
          
          {/* User info */}
          <div className="mt-4 inline-flex items-center space-x-2 bg-gray-800 px-4 py-2 rounded-lg">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
              {localStorage.getItem('user_email')?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <span className="text-gray-300 text-sm">
              {localStorage.getItem('user_email') || 'User'}
            </span>
          </div>
        </div>

        {/* Error Display */}
        {error && !error.includes('Session expired') && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
              <button
                onClick={refreshWorkspaces}
                className="text-red-300 hover:text-white text-sm underline"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Session expired warning */}
        {error.includes('Session expired') && (
          <div className="mb-6 p-4 bg-yellow-900/50 border border-yellow-700 rounded-lg text-yellow-200">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        )}

        {/* Workspaces Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {workspaces.length > 0 ? (
            workspaces.map(workspace => (
              <div
                key={workspace.id}
                className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-all duration-200 border border-gray-700 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10"
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {workspace.name?.charAt(0).toUpperCase() || 'W'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-lg truncate">
                      {workspace.name || 'Unnamed Workspace'}
                    </h3>
                    <p className="text-gray-400 text-sm truncate">
                      {workspace.subdomain || 'no-subdomain'}
                    </p>
                  </div>
                </div>
                {workspace.description && (
                  <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                    {workspace.description}
                  </p>
                )}
                <div className="mt-4 flex justify-between text-sm text-gray-400">
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                    {workspace.member_count || 1}
                  </span>
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {workspace.channel_count || 0}
                  </span>
                </div>
                
                {/* Action Buttons */}
                <div className="mt-4 flex space-x-2">
                  <Link
                    to={`/chat/${workspace.id}`}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-3 rounded text-sm font-medium transition-colors"
                  >
                    Enter Workspace
                  </Link>
                  <button
                    onClick={() => openInviteModal(workspace)}
                    className="bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded text-sm font-medium transition-colors flex items-center justify-center"
                    title="Invite members to workspace"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <p className="text-xl font-semibold mb-2">No workspaces yet</p>
                <p className="text-gray-500">Create your first workspace to get started with team collaboration</p>
              </div>
            </div>
          )}
        </div>

        {/* Create Workspace Section */}
        <div className="text-center">
          {!showCreateForm ? (
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25 flex items-center justify-center mx-auto transform hover:scale-105"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Workspace
            </button>
          ) : (
            <form onSubmit={handleCreateWorkspace} className="bg-gray-800 rounded-lg p-6 max-w-md mx-auto border border-gray-700 shadow-xl">
              <h3 className="text-white font-semibold text-lg mb-4 text-center">Create New Workspace</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-2 font-medium">Workspace Name</label>
                  <input
                    type="text"
                    value={newWorkspace.name}
                    onChange={(e) => setNewWorkspace({ ...newWorkspace, name: e.target.value })}
                    className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-600 focus:border-blue-500 transition-colors"
                    placeholder="e.g., Acme Corporation"
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2 font-medium">Subdomain</label>
                  <input
                    type="text"
                    value={newWorkspace.subdomain}
                    onChange={(e) => setNewWorkspace({ ...newWorkspace, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-600 focus:border-blue-500 transition-colors"
                    placeholder="e.g., acme-corp"
                    pattern="[a-z0-9-]+"
                    title="Only lowercase letters, numbers, and hyphens allowed"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-2">This will be used in your workspace URL</p>
                </div>
                <div className="flex space-x-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Create Workspace
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setError('');
                      setNewWorkspace({ name: '', subdomain: '' });
                    }}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* WORKSPACE INVITE MODAL */}
      <WorkspaceInviteModal
        isOpen={showInviteModal}
        onClose={() => {
          setShowInviteModal(false);
          setSelectedWorkspace(null);
        }}
        workspace={selectedWorkspace}
        onInviteSent={handleWorkspaceInvite}
      />
    </div>
  );
}