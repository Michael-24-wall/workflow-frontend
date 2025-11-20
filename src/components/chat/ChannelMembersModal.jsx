// components/chat/ChannelMembersModal.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../chat/services/api';

export default function ChannelMembersModal({ channel, isOpen, onClose, userRole, onMembersUpdate }) {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Check if current user can manage members
  const canManageMembers = userRole && ['owner', 'admin', 'moderator'].includes(userRole);

  useEffect(() => {
    if (isOpen && channel?.id) {
      fetchChannelMembers();
    }
  }, [isOpen, channel?.id]);

  const fetchChannelMembers = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/channels/${channel.id}/members/`);
      setMembers(response.data);
    } catch (err) {
      console.error('Failed to fetch channel members:', err);
      setError('Failed to load channel members');
    } finally {
      setLoading(false);
    }
  };

  const burnUser = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this user from the channel? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await api.delete(`/channels/${channel.id}/burn_user/`, {
        data: { user_id: userId }
      });

      setSuccess('User removed from channel successfully');
      
      // Refresh members list
      await fetchChannelMembers();
      
      // Notify parent component
      if (onMembersUpdate) {
        onMembersUpdate();
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Failed to remove user:', err);
      setError(err.response?.data?.error || 'Failed to remove user from channel');
    } finally {
      setLoading(false);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">
            Channel Members ({members.length})
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
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

        {/* Members List */}
        <div className="max-h-96 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : members.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No members found</p>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700/70 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    {/* User Avatar */}
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {member.user?.first_name?.[0] || member.user?.email?.[0]?.toUpperCase()}
                      </span>
                    </div>
                    
                    {/* User Info */}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-white font-medium">
                          {member.user?.first_name && member.user?.last_name 
                            ? `${member.user.first_name} ${member.user.last_name}`
                            : member.user?.email
                          }
                        </span>
                        {member.role && (
                          <span className={`px-2 py-1 rounded text-xs capitalize ${getRoleBadgeColor(member.role)}`}>
                            {member.role}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm">{member.user?.email}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2">
                    {/* Burn User Button - Hide for self and based on permissions */}
                    {canManageMembers && 
                     member.user?.id !== user?.id && 
                     (userRole === 'owner' || member.role !== 'owner') && (
                      <button
                        onClick={() => burnUser(member.user.id)}
                        disabled={loading}
                        className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded transition-colors disabled:opacity-50"
                        title="Remove user from channel"
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
        <div className="flex justify-end p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}