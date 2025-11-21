// components/chat/ChannelInviteModal.jsx
import React, { useState, useEffect } from 'react';
import { channelService } from '../../services/chat/api';

export default function ChannelInviteModal({ channel, isOpen, onClose, onInviteSent }) {
  const [suggestions, setSuggestions] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen && channel?.id) {
      fetchInviteSuggestions();
    }
  }, [isOpen, channel?.id, searchQuery]);

  const fetchInviteSuggestions = async () => {
    try {
      setLoading(true);
      const response = await channelService.getChannelInviteSuggestions(channel.id, searchQuery);
      
      // Handle different response formats
      const suggestionsData = Array.isArray(response) ? response : 
                             response?.results ? response.results : 
                             response?.data ? response.data : [];
      
      setSuggestions(suggestionsData);
    } catch (err) {
      console.error('Failed to fetch invite suggestions:', err);
      setError('Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserSelection = (user) => {
    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u.id === user.id);
      if (isSelected) {
        return prev.filter(u => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleInvite = async () => {
    if (selectedUsers.length === 0) {
      setError('Please select at least one user to invite');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const userIds = selectedUsers.map(user => user.id);
      console.log('📨 Inviting users:', userIds);
      
      await channelService.inviteToChannel(channel.id, userIds);
      
      setSuccess(`Invited ${selectedUsers.length} user${selectedUsers.length !== 1 ? 's' : ''} successfully`);
      setSelectedUsers([]);
      
      // Notify parent
      if (onInviteSent) {
        onInviteSent();
      }

      // Clear success message and close after delay
      setTimeout(() => {
        setSuccess('');
        onClose();
      }, 2000);
      
    } catch (err) {
      console.error('Failed to invite users:', err);
      setError(err.message || 'Failed to send invitations');
    } finally {
      setLoading(false);
    }
  };

  const getUserDisplayName = (user) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user.display_name) {
      return user.display_name;
    }
    if (user.email) {
      return user.email;
    }
    return 'Unknown User';
  };

  const getUserEmail = (user) => {
    return user.email || 'No email';
  };

  const getUserAvatar = (user) => {
    return user.first_name?.[0] || user.email?.[0]?.toUpperCase() || 'U';
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-md mx-auto border border-gray-700 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-white">
              Invite to #{channel?.name}
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Select members to invite to this channel
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
              placeholder="Search workspace members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mx-6 mt-4 p-3 bg-green-900/50 border border-green-700 rounded-lg text-green-200 text-sm">
            {success}
          </div>
        )}

        {/* Selected Users */}
        {selectedUsers.length > 0 && (
          <div className="p-6 border-b border-gray-700">
            <h3 className="text-sm font-medium text-gray-300 mb-2">
              Selected ({selectedUsers.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map(user => (
                <div
                  key={user.id}
                  className="flex items-center space-x-2 bg-blue-600/20 text-blue-300 px-3 py-1 rounded-full text-sm border border-blue-500/30"
                >
                  <span>{getUserDisplayName(user)}</span>
                  <button
                    onClick={() => toggleUserSelection(user)}
                    className="text-blue-200 hover:text-white"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggestions List */}
        <div className="max-h-96 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">
                {searchQuery ? 'No members found matching your search' : 'No members available to invite'}
              </div>
              <div className="text-gray-500 text-sm">
                {searchQuery ? 'Try adjusting your search terms' : 'All workspace members are already in this channel'}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {suggestions.map((user) => {
                const isSelected = selectedUsers.some(u => u.id === user.id);
                return (
                  <div
                    key={user.id}
                    onClick={() => toggleUserSelection(user)}
                    className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-blue-600/20 border border-blue-500/30' 
                        : 'bg-gray-700/50 hover:bg-gray-700/70'
                    }`}
                  >
                    {/* User Avatar */}
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                      {getUserAvatar(user)}
                    </div>
                    
                    {/* User Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-white font-medium">
                          {getUserDisplayName(user)}
                        </span>
                        {user.role && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-gray-600 text-white capitalize">
                            {user.role}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm">
                        {getUserEmail(user)}
                      </p>
                    </div>

                    {/* Selection Indicator */}
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected 
                        ? 'bg-blue-500 border-blue-500' 
                        : 'border-gray-500'
                    }`}>
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-700">
          <div className="text-gray-400 text-sm">
            {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleInvite}
              disabled={loading || selectedUsers.length === 0}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Inviting...' : `Invite ${selectedUsers.length} User${selectedUsers.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}