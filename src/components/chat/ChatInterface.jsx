// components/chat/ChatInterface.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWebSocket } from '../../../contexts/chat/WebSocketContext';
import { workspaceService, channelService } from '../../../services/chat/api';
import ChannelList from './ChannelList';
import ChannelChat from './ChannelChat';
import DirectMessageList from './DirectMessageList';
import DirectMessageChat from './DirectMessageChat';

export default function ChatInterface() {
  const { workspaceId, channelId, dmId } = useParams();
  const navigate = useNavigate();
  const { connectToChannel, connectToDM, isRoomConnected } = useWebSocket();
  
  const [workspace, setWorkspace] = useState(null);
  const [channels, setChannels] = useState([]);
  const [directMessages, setDirectMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('channels'); // 'channels' or 'dms'
  const [error, setError] = useState(null);

  // Load workspace data
  useEffect(() => {
    const loadWorkspaceData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [workspaceData, channelsData, dmData] = await Promise.all([
          workspaceService.getWorkspace(workspaceId),
          channelService.getChannels(),
          dmService.getDirectMessages()
        ]);

        setWorkspace(workspaceData);
        setChannels(Array.isArray(channelsData) ? channelsData : []);
        setDirectMessages(Array.isArray(dmData) ? dmData : []);

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

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
        {/* Workspace Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
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
            </div>
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
          {activeView === 'channels' ? (
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
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {channelId ? (
          <ChannelChat 
            workspaceId={workspaceId} 
            channelId={channelId} 
          />
        ) : dmId ? (
          <DirectMessageChat 
            workspaceId={workspaceId} 
            dmId={dmId} 
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
              {channels.length === 0 && (
                <button
                  onClick={handleCreateChannel}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
                >
                  Create Your First Channel
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}