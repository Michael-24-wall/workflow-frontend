// components/chat/ChannelInviteModal.jsx
import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:9000/api';

export default function ChannelInviteModal({ channelId, channelName, isOpen, onClose, onInviteMembers }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);

  const displayChannelName = channelName || `Channel ${channelId}` || 'Unknown Channel';

  useEffect(() => {
    if (isOpen && channelId) {
      console.log('🔍 Modal opened with channelId:', channelId);
      console.log('🔍 Channel name:', channelName);
      loadSuggestions();
    }
  }, [isOpen, channelId]);

  const getWorkspaceMembers = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No access token found');
      }

      console.log('🔄 Loading workspace members for channel invitations...');

      // Method 1: Try to get workspace ID from channel first
      const channelResponse = await fetch(`${API_BASE_URL}/chat/channels/${channelId}/`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!channelResponse.ok) {
        throw new Error(`Failed to fetch channel: ${channelResponse.statusText}`);
      }

      const channelData = await channelResponse.json();
      const workspaceId = channelData.workspace;
      
      console.log(`🏢 Channel ${channelId} belongs to workspace ${workspaceId}`);

      // Method 2: Try workspace members endpoint
      try {
        const response = await fetch(`${API_BASE_URL}/chat/workspaces/${workspaceId}/members/`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const members = await response.json();
          console.log(`✅ Loaded ${members.length} workspace members from endpoint`);
          return members;
        }
      } catch (workspaceError) {
        console.log('⚠️ Workspace members endpoint not available:', workspaceError.message);
      }

      // Method 3: Fallback - get all users from organization (temporary)
      console.log('🔄 Using organization members as fallback...');
      const orgResponse = await fetch(`${API_BASE_URL}/organizations/members/`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (orgResponse.ok) {
        const orgMembers = await orgResponse.json();
        console.log(`✅ Loaded ${orgMembers.length} organization members as fallback`);
        
        // TEMPORARY: Add test user if not in organization
        if (!orgMembers.find(m => m.email === 'testuser@example.com')) {
          orgMembers.push({
            id: 5,
            email: 'testuser@example.com',
            first_name: 'Test',
            last_name: 'User',
            organization_role: 'member',
            is_active: true
          });
          console.log('➕ Added test user to organization members temporarily');
        }
        
        return orgMembers;
      }

      throw new Error('Could not load workspace or organization members');

    } catch (error) {
      console.error('❌ Failed to load workspace members:', error);
      throw error;
    }
  };

  const loadSuggestions = async (query = '') => {
    if (!channelId) {
      console.error('❌ No channelId provided');
      return;
    }
    
    setSearching(true);
    setError(null);
    
    try {
      console.log('🔍 Loading workspace members for suggestions...');
      
      const workspaceMembers = await getWorkspaceMembers();
      
      console.log('📋 Workspace members loaded:', workspaceMembers);
      console.log('📊 Members count:', workspaceMembers?.length);
      
      if (!workspaceMembers || workspaceMembers.length === 0) {
        console.warn('⚠️ No workspace members found');
        setError('No workspace members found. Users must be workspace members to be invited to channels.');
        setSuggestions([]);
        return;
      }
      
      let filteredMembers = workspaceMembers;
      if (query) {
        filteredMembers = workspaceMembers.filter(member => {
          const searchTerm = query.toLowerCase();
          const displayName = `${member.first_name || ''} ${member.last_name || ''}`.toLowerCase().trim();
          const email = member.email?.toLowerCase() || '';
          
          return displayName.includes(searchTerm) || email.includes(searchTerm);
        });
        console.log(`🔍 Filtered to ${filteredMembers.length} members for query: "${query}"`);
      }
      
      const formattedSuggestions = filteredMembers.map(member => ({
        user: {
          id: member.id,
          display_name: `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.email,
          email: member.email,
          role: member.role || member.organization_role || 'member',
          first_name: member.first_name,
          last_name: member.last_name,
          is_active: member.is_active !== false
        }
      }));
      
      console.log('✅ Formatted suggestions:', formattedSuggestions);
      setSuggestions(formattedSuggestions);
      
    } catch (error) {
      console.error('❌ Failed to load suggestions:', error);
      setError('Failed to load workspace members: ' + error.message);
      setSuggestions([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    loadSuggestions(query);
  };

  const toggleUserSelection = (user) => {
    if (!user?.user?.id) return;
    
    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u.user?.id === user.user?.id);
      if (isSelected) {
        return prev.filter(u => u.user?.id !== user.user?.id);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedUsers.length === 0 || !channelId) {
      setError('Please select at least one user to invite');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const userIds = selectedUsers
        .map(user => {
          const id = user.user?.id;
          console.log('🔍 User mapping:', { 
            user, 
            rawId: id, 
            type: typeof id,
            parsedId: parseInt(id) 
          });
          return parseInt(id);
        })
        .filter(id => !isNaN(id) && id != null);
      
      console.log('📨 FINAL - Inviting users to channel:', { 
        channelId, 
        userIds,
        userIdsType: typeof userIds[0],
        selectedUsers: selectedUsers.map(u => ({
          id: u.user?.id,
          type: typeof u.user?.id,
          name: u.user?.display_name,
          email: u.user?.email
        }))
      });
      
      if (onInviteMembers) {
        const result = await onInviteMembers(userIds);
        console.log('✅ Invitation response:', result);
        
        // Check the response for details
        if (result.data) {
          console.log('📊 INVITATION RESULTS:', {
            invited: result.data.added_users,
            already_members: result.data.already_members,
            not_in_workspace: result.data.not_in_workspace,
            workspace: result.data.workspace_name
          });
          
          if (result.data.not_in_workspace && result.data.not_in_workspace.length > 0) {
            setError(`Some users are not workspace members: ${result.data.not_in_workspace.join(', ')}. They need to be added to the workspace first.`);
            return;
          }
          
          if (result.data.already_members && result.data.already_members.length > 0) {
            setError(`Some users are already channel members: ${result.data.already_members.join(', ')}`);
            return;
          }
        }
        
        if (result.data && result.data.added_users && result.data.added_users.length > 0) {
          setSelectedUsers([]);
          setSearchQuery('');
          console.log('✅ Invitations sent successfully');
          onClose();
        } else {
          setError('No users were invited. Check if they are already members or not in the workspace.');
        }
      } else {
        throw new Error('No invite handler provided');
      }
      
    } catch (error) {
      console.error('❌ Failed to send invitations:', error);
      setError(error.message || 'Failed to send invitations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedUsers([]);
    setSearchQuery('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">
            Invite to #{displayChannelName}
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
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search workspace members..."
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {selectedUsers.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-slate-300 mb-2">Selected Users:</h3>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map(user => (
                  <div
                    key={user.user?.id}
                    className="flex items-center space-x-2 bg-blue-600 px-3 py-1 rounded-full"
                  >
                    <span className="text-white text-sm">
                      {user.user?.display_name || user.user?.email || 'Unknown User'}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleUserSelection(user)}
                      className="text-white hover:text-slate-200 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mb-4 max-h-60 overflow-y-auto">
            {searching ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-slate-400 mt-2">Searching workspace members...</p>
              </div>
            ) : suggestions.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-slate-400">
                  {searchQuery ? 'No users found' : 'No workspace members available to invite'}
                </p>
                {error && !searchQuery && (
                  <p className="text-red-400 text-sm mt-2">{error}</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {suggestions.map(user => (
                  <div
                    key={user.user?.id}
                    className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer ${
                      selectedUsers.some(u => u.user?.id === user.user?.id)
                        ? 'bg-blue-600'
                        : 'bg-slate-700 hover:bg-slate-600'
                    }`}
                    onClick={() => toggleUserSelection(user)}
                  >
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {user.user?.first_name?.[0] || user.user?.last_name?.[0] || user.user?.email?.[0] || '?'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">
                        {user.user?.first_name && user.user?.last_name 
                          ? `${user.user.first_name} ${user.user.last_name}`
                          : user.user?.display_name || user.user?.email || 'Unknown User'
                        }
                      </p>
                      <p className="text-slate-300 text-sm">
                        {user.user?.email || 'No email'}
                      </p>
                      <p className="text-slate-400 text-xs capitalize">
                        {user.user?.role || 'member'}
                      </p>
                    </div>
                    <div className={`w-4 h-4 rounded border-2 ${
                      selectedUsers.some(u => u.user?.id === user.user?.id)
                        ? 'bg-white border-white'
                        : 'border-slate-400'
                    }`} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && !searching && (
            <div className="mb-4 p-3 bg-red-900 border border-red-700 rounded-md">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-slate-300 hover:text-white disabled:opacity-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || selectedUsers.length === 0}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Inviting...
                </span>
              ) : (
                `Invite ${selectedUsers.length} User${selectedUsers.length !== 1 ? 's' : ''}`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}