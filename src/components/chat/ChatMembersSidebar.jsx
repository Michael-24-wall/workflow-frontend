// components/chat/ChatMembersSidebar.jsx
import React, { useState, useEffect } from 'react';
import { workspaceService, channelService } from '../../services/chat/api';

const ChatMembersSidebar = ({ workspaceId, channelId, isOpen, onClose }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('channel'); // 'channel', 'workspace', 'organization'

  useEffect(() => {
    if (isOpen) {
      loadMembers();
    }
  }, [isOpen, channelId, workspaceId, view]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      let membersData = [];

      switch (view) {
        case 'channel':
          if (channelId) {
            const channelMembers = await channelService.getChannelMembers(channelId);
            membersData = channelMembers;
          }
          break;
        
        case 'workspace':
          if (workspaceId) {
            membersData = await workspaceService.getWorkspaceMembers(workspaceId);
          }
          break;
        
        case 'organization':
          membersData = await workspaceService.getOrganizationMembers();
          break;
        
        default:
          membersData = [];
      }

      setMembers(membersData);
    } catch (error) {
      console.error('Failed to load members:', error);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const inviteToChannel = async (memberId) => {
    try {
      await channelService.inviteToChannel(channelId, [memberId]);
      // Refresh members list
      loadMembers();
    } catch (error) {
      console.error('Failed to invite member:', error);
      alert('Failed to invite member to channel');
    }
  };

  const startDirectMessage = async (memberId) => {
    try {
      // This would start a DM with the member
      console.log('Starting DM with member:', memberId);
      // Implement your DM logic here
    } catch (error) {
      console.error('Failed to start DM:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-lg border-l z-50">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Members</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* View Toggle */}
        <div className="flex space-x-1 mt-3">
          {channelId && (
            <button
              onClick={() => setView('channel')}
              className={`flex-1 px-3 py-1 text-xs rounded ${
                view === 'channel'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Channel
            </button>
          )}
          {workspaceId && (
            <button
              onClick={() => setView('workspace')}
              className={`flex-1 px-3 py-1 text-xs rounded ${
                view === 'workspace'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Workspace
            </button>
          )}
          <button
            onClick={() => setView('organization')}
            className={`flex-1 px-3 py-1 text-xs rounded ${
              view === 'organization'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Organization
          </button>
        </div>
      </div>

      {/* Members List */}
      <div className="h-full overflow-y-auto">
        {loading ? (
          <div className="p-4">
            <div className="animate-pulse space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-2">
            {members.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                view={view}
                channelId={channelId}
                onInvite={inviteToChannel}
                onStartDM={startDirectMessage}
              />
            ))}
            
            {members.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No members found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const MemberCard = ({ member, view, channelId, onInvite, onStartDM }) => {
  const hasOrganizationData = member.organization_data;
  const orgMember = hasOrganizationData ? member.organization_data : member;

  return (
    <div className="p-3 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {orgMember.profile_picture_url ? (
              <img
                src={orgMember.profile_picture_url}
                alt={orgMember.display_name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                {orgMember.display_name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
          </div>

          {/* Member Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {orgMember.display_name || 'Unknown User'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {orgMember.role || 'member'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-1">
          {view !== 'channel' && channelId && (
            <button
              onClick={() => onInvite(orgMember.id)}
              className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
              title="Invite to channel"
            >
              Invite
            </button>
          )}
          
          <button
            onClick={() => onStartDM(orgMember.id)}
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            title="Start direct message"
          >
            DM
          </button>
        </div>
      </div>

      {/* Enhanced Info */}
      {hasOrganizationData && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Email: {orgMember.email}</span>
            <span className={
              orgMember.is_active 
                ? 'text-green-600' 
                : 'text-red-600'
            }>
              {orgMember.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatMembersSidebar;