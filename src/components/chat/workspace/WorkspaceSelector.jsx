// components/chat/WorkspaceSelector.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { workspaceService } from '../../../services/chat/api';
import WorkspaceInviteModal from '../WorkspaceInviteModal';
import WorkspaceMembersModal from './WorkspaceMembersModal'; // 🆕 Import members modal

export default function WorkspaceSelector() {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false); // 🆕 Members modal state
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [newWorkspace, setNewWorkspace] = useState({ name: '', subdomain: '' });
  const [error, setError] = useState('');
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null });
  const [showDeletedWorkspaces, setShowDeletedWorkspaces] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadWorkspaces();
  }, []);

  // 🆕 Show notification function
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 5000);
  };

  // 🆕 Show confirmation modal function
  const showConfirmation = (title, message, onConfirm) => {
    setConfirmModal({ show: true, title, message, onConfirm });
  };

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

  // 🆕 UPDATED: Workspace Delete Functionality with Confirmation Modal
  const handleDeleteWorkspace = async (workspace) => {
    showConfirmation(
      'Delete Workspace',
      `Are you sure you want to delete the workspace "${workspace.name}"? This action cannot be undone and all data will be permanently lost.`,
      async () => {
        try {
          console.log('🗑️ Deleting workspace:', workspace.id);
          setError('');

          await workspaceService.deleteWorkspace(workspace.id);
          
          console.log('✅ Workspace deleted successfully');
          
          // Remove workspace from local state
          setWorkspaces(prev => prev.filter(w => w.id !== workspace.id));
          
          showNotification(`Workspace "${workspace.name}" has been deleted successfully.`, 'success');
          
        } catch (error) {
          console.error('❌ Failed to delete workspace:', error);
          
          const errorMessage = error.response?.data?.error || error.message || 'Failed to delete workspace';
          
          if (errorMessage.includes('Only workspace owners can delete')) {
            showNotification('Only workspace owners can delete workspaces.', 'error');
          } else if (errorMessage.includes('Transfer ownership')) {
            showNotification('Cannot delete workspace. Transfer ownership to another owner first.', 'error');
          } else {
            showNotification(errorMessage, 'error');
          }
        }
      }
    );
  };

  // 🆕 UPDATED: Workspace Restore Functionality with Confirmation Modal
  const handleRestoreWorkspace = async (workspace) => {
    showConfirmation(
      'Restore Workspace',
      `Are you sure you want to restore the workspace "${workspace.name}"?`,
      async () => {
        try {
          console.log('🔄 Restoring workspace:', workspace.id);
          setError('');

          await workspaceService.restoreWorkspace(workspace.id);
          
          console.log('✅ Workspace restored successfully');
          
          // Reload workspaces to get updated list
          await loadWorkspaces();
          
          showNotification(`Workspace "${workspace.name}" has been restored successfully.`, 'success');
          
        } catch (error) {
          console.error('❌ Failed to restore workspace:', error);
          
          const errorMessage = error.response?.data?.error || error.message || 'Failed to restore workspace';
          showNotification(errorMessage, 'error');
        }
      }
    );
  };

  // 🆕 ADDED: Burn User Functionality
  const handleBurnUser = async (workspaceId, userId, userName) => {
    showConfirmation(
      'Remove User from Workspace',
      `Are you sure you want to remove "${userName}" from this workspace? This will remove them from all channels and workspace access.`,
      async () => {
        try {
          console.log('🔥 Burning user from workspace:', { workspaceId, userId, userName });
          setError('');

          await workspaceService.burnUserFromWorkspace(workspaceId, userId);
          
          console.log('✅ User burned from workspace successfully');
          
          showNotification(`User "${userName}" has been removed from the workspace successfully.`, 'success');
          
          // Refresh workspace data to update member counts
          await loadWorkspaces();
          
        } catch (error) {
          console.error('❌ Failed to remove user from workspace:', error);
          
          const errorMessage = error.response?.data?.error || error.message || 'Failed to remove user from workspace';
          
          if (errorMessage.includes('Only workspace owners and admins can remove users')) {
            showNotification('Only workspace owners and admins can remove users.', 'error');
          } else if (errorMessage.includes('You cannot remove yourself')) {
            showNotification('You cannot remove yourself from the workspace.', 'error');
          } else if (errorMessage.includes('Only workspace owners can remove other owners')) {
            showNotification('Only workspace owners can remove other owners.', 'error');
          } else {
            showNotification(errorMessage, 'error');
          }
        }
      }
    );
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
      
      showNotification(`Workspace "${createdWorkspace.name}" created successfully!`, 'success');
      
    } catch (error) {
      console.error('❌ Failed to create workspace:', error);
      const errorMessage = error.message || 'Failed to create workspace. Please try again.';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
    }
  };

  // 🆕 UPDATED: Workspace Invite with Notification
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
        showNotification(`Successfully invited ${response.invited_users.length} user(s) to the workspace!`, 'success');
      } else if (response.invitations_sent && response.invitations_sent.length > 0) {
        showNotification(`Sent ${response.invitations_sent.length} invitation(s) to join the workspace!`, 'success');
      } else {
        showNotification('No new users were invited. They might already be workspace members.', 'info');
      }
      
      return response;
    } catch (error) {
      console.error('❌ Workspace invite error:', error);
      
      const errorMessage = error.response?.data?.error || error.message || 'Failed to send workspace invitations';
      showNotification(errorMessage, 'error');
      
      throw error;
    }
  };

  const openInviteModal = (workspace) => {
    console.log('🎯 Opening invite modal for workspace:', workspace);
    setSelectedWorkspace(workspace);
    setShowInviteModal(true);
  };

  // 🆕 ADDED: Open Members Modal
  const openMembersModal = (workspace) => {
    console.log('🎯 Opening members modal for workspace:', workspace);
    setSelectedWorkspace(workspace);
    setShowMembersModal(true);
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

  // 🆕 Filter workspaces by status
  const activeWorkspaces = workspaces.filter(workspace => workspace.is_active !== false);
  const deletedWorkspaces = workspaces.filter(workspace => workspace.is_active === false);

  const DebugInfo = () => {
    const token = localStorage.getItem('access_token');
    return (
      <div className="fixed top-4 right-4 bg-gray-800 p-4 rounded-lg text-xs text-gray-400 max-w-xs border border-gray-700 z-50">
        <div className="font-semibold mb-2">Debug Information</div>
        <div>🔐 Authenticated: {isAuthenticated() ? 'Yes' : 'No'}</div>
        <div>🔐 Token: {token ? `${token.substring(0, 15)}...` : 'None'}</div>
        <div>🔄 Loading: {loading ? 'Yes' : 'No'}</div>
        <div>📊 Active Workspaces: {activeWorkspaces.length}</div>
        <div>🗑️ Deleted Workspaces: {deletedWorkspaces.length}</div>
        <div>📝 Create Form: {showCreateForm ? 'Open' : 'Closed'}</div>
        <div>📧 Invite Modal: {showInviteModal ? 'Open' : 'Closed'}</div>
        <div>👥 Members Modal: {showMembersModal ? 'Open' : 'Closed'}</div>
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
      
      {/* 🆕 NOTIFICATION POPUP */}
      {notification.show && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 p-4 rounded-lg shadow-lg border ${
          notification.type === 'success' 
            ? 'bg-green-900/90 border-green-700 text-green-200' 
            : notification.type === 'error'
            ? 'bg-red-900/90 border-red-700 text-red-200'
            : 'bg-blue-900/90 border-blue-700 text-blue-200'
        }`}>
          <div className="flex items-center space-x-2">
            {notification.type === 'success' && <span>✅</span>}
            {notification.type === 'error' && <span>❌</span>}
            {notification.type === 'info' && <span>ℹ️</span>}
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification({ show: false, message: '', type: 'success' })}
              className="ml-4 text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 🆕 CONFIRMATION MODAL */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg w-full max-w-md mx-auto border border-gray-700 shadow-xl">
            <div className="p-6">
              <h3 className="text-white font-semibold text-lg mb-2">{confirmModal.title}</h3>
              <p className="text-gray-300 mb-6">{confirmModal.message}</p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    confirmModal.onConfirm();
                    setConfirmModal({ show: false, title: '', message: '', onConfirm: null });
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  Yes, Continue
                </button>
                <button
                  onClick={() => setConfirmModal({ show: false, title: '', message: '', onConfirm: null })}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-6xl mx-auto">
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

        {/* 🆕 DELETED WORKSPACES SECTION */}
        {deletedWorkspaces.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-red-400 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Deleted Workspaces ({deletedWorkspaces.length})
              </h2>
              <button
                onClick={() => setShowDeletedWorkspaces(!showDeletedWorkspaces)}
                className="text-gray-400 hover:text-white text-sm flex items-center"
              >
                {showDeletedWorkspaces ? 'Hide' : 'Show'} Deleted
                <svg className={`w-4 h-4 ml-1 transition-transform ${showDeletedWorkspaces ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {showDeletedWorkspaces && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {deletedWorkspaces.map(workspace => (
                  <div
                    key={workspace.id}
                    className="bg-red-900/20 border border-red-500/50 rounded-lg p-6 hover:bg-red-900/30 transition-all duration-200"
                  >
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {workspace.name?.charAt(0).toUpperCase() || 'W'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-red-300 font-semibold text-lg truncate">
                          {workspace.name || 'Unnamed Workspace'}
                        </h3>
                        <p className="text-red-400 text-sm truncate">
                          {workspace.subdomain || 'no-subdomain'}
                        </p>
                      </div>
                    </div>
                    
                    {workspace.description && (
                      <p className="text-red-400 text-sm mb-4 line-clamp-2">
                        {workspace.description}
                      </p>
                    )}
                    
                    <div className="mt-4 flex space-x-2">
                      <button
                        onClick={() => handleRestoreWorkspace(workspace)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white text-center py-2 px-3 rounded text-sm font-medium transition-colors flex items-center justify-center"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Restore Workspace
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ACTIVE WORKSPACES SECTION */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Active Workspaces ({activeWorkspaces.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeWorkspaces.length > 0 ? (
              activeWorkspaces.map(workspace => (
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
                  
                  {/* 🆕 UPDATED Action Buttons with Members Management */}
                  <div className="mt-4 flex space-x-2">
                    <Link
                      to={`/chat/${workspace.id}`}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-3 rounded text-sm font-medium transition-colors"
                    >
                      Enter Workspace
                    </Link>
                    
                    {/* 🆕 Members Management Button */}
                    <button
                      onClick={() => openMembersModal(workspace)}
                      className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-3 rounded text-sm font-medium transition-colors flex items-center justify-center"
                      title="Manage workspace members"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </button>
                    
                    {/* Invite Button */}
                    <button
                      onClick={() => openInviteModal(workspace)}
                      className="bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded text-sm font-medium transition-colors flex items-center justify-center"
                      title="Invite members to workspace"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                    
                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteWorkspace(workspace)}
                      className="bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded text-sm font-medium transition-colors flex items-center justify-center"
                      title="Delete workspace"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
                  <p className="text-xl font-semibold mb-2">No active workspaces yet</p>
                  <p className="text-gray-500">Create your first workspace to get started with team collaboration</p>
                </div>
              </div>
            )}
          </div>
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

      {/* 🆕 WORKSPACE MEMBERS MODAL */}
      <WorkspaceMembersModal
        isOpen={showMembersModal}
        onClose={() => {
          setShowMembersModal(false);
          setSelectedWorkspace(null);
        }}
        workspace={selectedWorkspace}
        onBurnUser={handleBurnUser}
        onMembersUpdate={loadWorkspaces}
      />
    </div>
  );
}