// components/chat/ChatInterface.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWebSocket } from '../../../contexts/chat/WebSocketContext';
import { workspaceService, channelService, dmService } from '../../../services/chat/api';
import ChannelList from './ChannelList';
import ChannelChat from './ChannelChat';
import DirectMessageList from './DirectMessageList';
import DirectMessageChat from './DirectMessageChat';
import OrganizationMembersList from './OrganizationMembersList';
import ChatMembersSidebar from './ChatMembersSidebar';
import WorkspaceInviteModal from './WorkspaceInviteModal';
import ChannelInviteModal from './ChannelInviteModal';

export default function ChatInterface() {
  const { workspaceId, channelId, dmId } = useParams();
  const navigate = useNavigate();
  const { connectToChannel, connectToDM, isRoomConnected } = useWebSocket();
  
  const [workspace, setWorkspace] = useState(null);
  const [channels, setChannels] = useState([]);
  const [directMessages, setDirectMessages] = useState([]);
  const [organizationMembers, setOrganizationMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('channels'); // 'channels' or 'dms'
  const [showMembersSidebar, setShowMembersSidebar] = useState(false);
  const [showOrganizationMembers, setShowOrganizationMembers] = useState(false);
  const [showWorkspaceInviteModal, setShowWorkspaceInviteModal] = useState(false);
  const [showChannelInviteModal, setShowChannelInviteModal] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [error, setError] = useState(null);

  // Load workspace data and organization members
  useEffect(() => {
    const loadWorkspaceData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load workspace data, channels, DMs, and organization members in parallel
        const [workspaceData, channelsData, dmData, orgMembersData] = await Promise.all([
          workspaceService.getWorkspace(workspaceId),
          channelService.getChannels(workspaceId),
          dmService.getDirectMessages(),
          workspaceService.getOrganizationMembers()
        ]);

        setWorkspace(workspaceData);
        setChannels(Array.isArray(channelsData) ? channelsData : []);
        setDirectMessages(Array.isArray(dmData) ? dmData : []);
        setOrganizationMembers(Array.isArray(orgMembersData) ? orgMembersData : []);
        setUserRole(workspaceData.user_role);

        console.log(`✅ Loaded workspace: ${workspaceData.name}, User role: ${workspaceData.user_role}`);
        console.log(`✅ Loaded ${orgMembersData.length} organization members`);

      } catch (error) {
        console.error('Failed to load workspace data:', error);
        setError('Failed to load chat data');
      } finally {
        setLoading(false);
      }
    };

    if (workspaceId) {
      loadWorkspaceData();
    }
  }, [workspaceId]);

  // Connect to WebSocket when channel or DM is selected
  useEffect(() => {
    if (channelId && !isRoomConnected(channelId, 'channel')) {
      connectToChannel(channelId);
    }
    
    if (dmId && !isRoomConnected(dmId, 'dm')) {
      connectToDM(dmId);
    }
  }, [channelId, dmId, connectToChannel, connectToDM, isRoomConnected]);

  const handleChannelSelect = (channel) => {
    navigate(`/chat/${workspaceId}/channel/${channel.id}`);
  };

  const handleDMSelect = (dm) => {
    navigate(`/chat/${workspaceId}/dm/${dm.id}`);
  };

  const handleCreateChannel = () => {
    navigate(`/chat/${workspaceId}/create-channel`);
  };

  const handleMemberSelect = (member) => {
    console.log('Selected member:', member);
    // You can implement starting a DM, viewing profile, etc.
    // For now, just show a notification or open DM
    alert(`Selected: ${member.display_name} (${member.email})`);
  };

  const handleStartDM = async (memberId) => {
    try {
      console.log('Starting DM with member:', memberId);
      // Implement DM creation logic here
      // This would typically create or get an existing DM conversation
      const dm = await dmService.startDirectMessage(memberId);
      if (dm && dm.id) {
        navigate(`/chat/${workspaceId}/dm/${dm.id}`);
      }
    } catch (error) {
      console.error('Failed to start DM:', error);
      alert('Failed to start direct message');
    }
  };

  const handleInviteToChannel = async (memberId) => {
    if (!channelId) {
      alert('Please select a channel first');
      return;
    }

    try {
      await channelService.inviteToChannel(channelId, [memberId]);
      alert('Member invited to channel successfully');
    } catch (error) {
      console.error('Failed to invite member:', error);
      alert('Failed to invite member to channel');
    }
  };

  const handleWorkspaceInvite = async (emails) => {
    try {
      const result = await workspaceService.inviteToWorkspace(workspaceId, emails);
      console.log('Workspace invitation result:', result);
      
      // Refresh organization members to show new invites
      refreshOrganizationMembers();
      
      return result;
    } catch (error) {
      console.error('Failed to invite to workspace:', error);
      throw error;
    }
  };

  const handleChannelInvite = async (userIds) => {
    try {
      const result = await channelService.inviteToChannel(channelId, userIds);
      console.log('Channel invitation result:', result);
      
      // Refresh channel data to show new members
      if (channelId) {
        const updatedChannel = await channelService.getChannel(channelId);
        // You might want to update the channel in your state here
      }
      
      return result;
    } catch (error) {
      console.error('Failed to invite to channel:', error);
      throw error;
    }
  };

  const refreshOrganizationMembers = async () => {
    try {
      const members = await workspaceService.getOrganizationMembers();
      setOrganizationMembers(members);
      console.log(`🔄 Refreshed organization members: ${members.length}`);
    } catch (error) {
      console.error('Failed to refresh organization members:', error);
    }
  };

  const refreshChannels = async () => {
    try {
      const channelsData = await channelService.getChannels(workspaceId);
      setChannels(Array.isArray(channelsData) ? channelsData : []);
    } catch (error) {
      console.error('Failed to refresh channels:', error);
    }
  };

  // Check if user can invite to workspace (owner or admin)
  const canInviteToWorkspace = userRole && ['owner', 'admin'].includes(userRole);
  
  // Check if user can invite to current channel (admin or moderator)
  const canInviteToChannel = channelId && userRole && ['owner', 'admin', 'moderator'].includes(userRole);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-red-600">⚠️</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Failed to Load Chat
          </h3>
          <p className="text-gray-600 mb-4">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
        {/* Workspace Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-semibold text-lg">💬</span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 truncate">
                {workspace?.name || 'Workspace'}
              </h2>
              <p className="text-sm text-gray-500 truncate">
                {workspace?.description || 'Team workspace'}
              </p>
              {userRole && (
                <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded capitalize">
                  {userRole}
                </span>
              )}
            </div>
          </div>

          {/* Organization Members Info */}
          <div className="p-3 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {organizationMembers.length} Members
                </p>
                <p className="text-xs text-gray-500">
                  In organization
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowOrganizationMembers(!showOrganizationMembers)}
                  className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded"
                >
                  {showOrganizationMembers ? 'Hide' : 'View'}
                </button>
                <button
                  onClick={refreshOrganizationMembers}
                  className="text-xs bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded"
                  title="Refresh members"
                >
                  ↻
                </button>
              </div>
            </div>

            {/* Workspace Invite Button */}
            {canInviteToWorkspace && (
              <button
                onClick={() => setShowWorkspaceInviteModal(true)}
                className="w-full mt-2 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-sm font-medium flex items-center justify-center space-x-2"
              >
                <span>+</span>
                <span>Invite to Workspace</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveView('channels')}
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              activeView === 'channels'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Channels ({channels.length})
          </button>
          <button
            onClick={() => setActiveView('dms')}
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              activeView === 'dms'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Messages ({directMessages.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {showOrganizationMembers ? (
            <div className="h-full">
              <div className="p-3 border-b border-gray-200 bg-white">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Organization Members
                  </h3>
                  <button
                    onClick={() => setShowOrganizationMembers(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <OrganizationMembersList
                workspaceId={workspaceId}
                channelId={channelId}
                onMemberSelect={handleMemberSelect}
                onStartDM={handleStartDM}
                onInviteToChannel={handleInviteToChannel}
              />
            </div>
          ) : activeView === 'channels' ? (
            <ChannelList
              channels={channels}
              selectedChannelId={channelId}
              onChannelSelect={handleChannelSelect}
              onCreateChannel={handleCreateChannel}
            />
          ) : (
            <DirectMessageList
              directMessages={directMessages}
              selectedDMId={dmId}
              onDMSelect={handleDMSelect}
            />
          )}
        </div>

        {/* Quick Actions Footer */}
        <div className="p-3 border-t border-gray-200 bg-white">
          <div className="space-y-2">
            <button
              onClick={() => setShowMembersSidebar(true)}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium"
            >
              View Members
            </button>
            
            {/* Channel Invite Button - Only show when a channel is selected */}
            {canInviteToChannel && (
              <button
                onClick={() => setShowChannelInviteModal(true)}
                className="w-full bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-sm font-medium flex items-center justify-center space-x-2"
              >
                <span>+</span>
                <span>Invite to Channel</span>
              </button>
            )}
            
            <button
              onClick={() => setShowOrganizationMembers(true)}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm font-medium"
            >
              All Members
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {channelId ? (
          <ChannelChat 
            workspaceId={workspaceId} 
            channelId={channelId} 
            onShowMembers={() => setShowMembersSidebar(true)}
            onShowInvite={() => setShowChannelInviteModal(true)}
          />
        ) : dmId ? (
          <DirectMessageChat 
            workspaceId={workspaceId} 
            dmId={dmId} 
            onShowMembers={() => setShowMembersSidebar(true)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💬</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Welcome to {workspace?.name || 'Chat'}
              </h3>
              <p className="text-gray-600 mb-4">
                Select a channel or start a conversation to begin chatting with your team.
              </p>
              <div className="space-y-2">
                {channels.length === 0 && (
                  <button
                    onClick={handleCreateChannel}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
                  >
                    Create Your First Channel
                  </button>
                )}
                <button
                  onClick={() => setShowOrganizationMembers(true)}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium"
                >
                  Browse Organization Members ({organizationMembers.length})
                </button>
                {canInviteToWorkspace && (
                  <button
                    onClick={() => setShowWorkspaceInviteModal(true)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
                  >
                    Invite People to Workspace
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Members Sidebar */}
      <ChatMembersSidebar
        workspaceId={workspaceId}
        channelId={channelId}
        isOpen={showMembersSidebar}
        onClose={() => setShowMembersSidebar(false)}
        onStartDM={handleStartDM}
        onInviteToChannel={handleInviteToChannel}
      />

      {/* Invitation Modals */}
      <WorkspaceInviteModal
        workspace={workspace}
        isOpen={showWorkspaceInviteModal}
        onClose={() => setShowWorkspaceInviteModal(false)}
        onInviteSent={handleWorkspaceInvite}
      />

      <ChannelInviteModal
        channel={channels.find(c => c.id === parseInt(channelId))}
        isOpen={showChannelInviteModal}
        onClose={() => setShowChannelInviteModal(false)}
        onInviteSent={handleChannelInvite}
      />
    </div>
  );
}