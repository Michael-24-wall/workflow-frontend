// components/chat/WorkspaceMembersModal.jsx
import React, { useState, useEffect } from 'react';
import { workspaceService } from '../../../services/chat/api';
import { useAuth } from '../../../contexts/chat/AuthContext'; // Import your auth context

export default function WorkspaceMembersModal({ isOpen, onClose, workspace, onBurnUser, onMembersUpdate }) {
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const { user: currentUser } = useAuth(); // Get current user from auth context

  useEffect(() => {
    if (isOpen && workspace?.id) {
      fetchWorkspaceMembers();
    }
  }, [isOpen, workspace?.id]);

  // Filter members based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMembers(members);
    } else {
      const query = searchQuery.toLowerCase().trim();
      const filtered = members.filter(member => 
        member.user?.first_name?.toLowerCase().includes(query) ||
        member.user?.last_name?.toLowerCase().includes(query) ||
        member.user?.email?.toLowerCase().includes(query) ||
        member.role?.toLowerCase().includes(query)
      );
      setFilteredMembers(filtered);
    }
  }, [members, searchQuery]);

  const fetchWorkspaceMembers = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('👥 Fetching workspace members for:', workspace.id);
      const response = await workspaceService.getWorkspaceMembers(workspace.id);
      
      console.log('✅ Workspace members loaded:', response);
      setMembers(Array.isArray(response) ? response : []);
      
    } catch (error) {
      console.error('❌ Failed to fetch workspace members:', error);
      setError('Failed to load workspace members');
    } finally {
      setLoading(false);
    }
  };

  const handleBurnUser = async (userId, userName) => {
    try {
      await onBurnUser(workspace.id, userId, userName);
      // Refresh members list after burning user
      await fetchWorkspaceMembers();
      // Notify parent to update workspace counts
      if (onMembersUpdate) {
        onMembersUpdate();
      }
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'owner': return 'bg-purple-600 text-white';
      case 'admin': return 'bg-red-600 text-white';
      case 'moderator': return 'bg-blue-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  // Check if current user is the workspace owner
  const isCurrentUserOwner = () => {
    if (!currentUser || !members.length) return false;
    
    const currentUserMembership = members.find(member => 
      member.user?.id === currentUser.id
    );
    
    return currentUserMembership?.role === 'owner';
  };

  // Check if current user can burn a specific member
  const canBurnUser = (member) => {
    // Only owners can burn users
    if (!isCurrentUserOwner()) return false;
    
    // Cannot burn yourself
    if (member.user?.id === currentUser.id) return false;
    
    // Owners can burn anyone except themselves
    return true;
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-2xl mx-auto border border-gray-700 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-white">
              Workspace Members ({filteredMembers.length})
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              {workspace?.name} • Manage workspace members
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b border-gray-700">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search members by name, email, or role..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-10 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {searchQuery && (
            <div className="text-gray-400 text-sm mt-2">
              Found {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''} matching "{searchQuery}"
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        {/* Members List */}
        <div className="max-h-96 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">
                {searchQuery ? 'No members found matching your search' : 'No members found'}
              </div>
              <div className="text-gray-500 text-sm">
                {searchQuery ? 'Try adjusting your search terms' : 'Invite members to get started'}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700/70 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    {/* User Avatar */}
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {member.user?.first_name?.[0] || member.user?.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                    
                    {/* User Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-1">
                        <span className="text-white font-medium">
                          {member.user?.first_name && member.user?.last_name 
                            ? `${member.user.first_name} ${member.user.last_name}`
                            : member.user?.email || 'Unknown User'
                          }
                        </span>
                        {member.role && (
                          <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getRoleBadgeColor(member.role)}`}>
                            {member.role}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm">
                        {member.user?.email || 'No email'}
                      </p>
                      {member.joined_at && (
                        <p className="text-gray-500 text-xs mt-1">
                          Joined {new Date(member.joined_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2">
                    {/* Burn User Button - Only show for owners and for users they can burn */}
                    {canBurnUser(member) && (
                      <button
                        onClick={() => handleBurnUser(
                          member.user?.id || member.id,
                          member.user?.first_name && member.user?.last_name 
                            ? `${member.user.first_name} ${member.user.last_name}`
                            : member.user?.email || 'this user'
                        )}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-lg transition-colors border border-red-400/30"
                        title={`Remove ${member.user?.first_name || member.user?.email || 'user'} from workspace`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-700">
          <div className="text-gray-400 text-sm">
            {filteredMembers.length} of {members.length} member{members.length !== 1 ? 's' : ''}
            {searchQuery && ` • Searching: "${searchQuery}"`}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={fetchWorkspaceMembers}
              disabled={loading}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}