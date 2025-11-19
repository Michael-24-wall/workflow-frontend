// components/chat/dashboard/ChatDashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { workspaceService, channelService, dmService } from '../../../services/chat/api';
import { useWebSocket } from '../../../contexts/chat/WebSocketContext';
import { useAuth } from '../../../contexts/chat/AuthContext';
import Sidebar from '../layout/Sidebar';

export default function ChatDashboard() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState(null);
  const [channels, setChannels] = useState([]);
  const [directMessages, setDirectMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('channels');
  const [error, setError] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { 
    connectToWorkspace, 
    isRoomConnected, 
    isConnected,
    connectionStatus,
    lastMessage 
  } = useWebSocket();

  // Use ref to track if we've loaded data to prevent WebSocket overwrites
  const dataLoadedRef = useRef(false);

  // FIXED: Correct WebSocket status checking
  const workspaceKey = `workspace_${workspaceId}`;
  const isWsConnected = isRoomConnected(workspaceId, 'workspace') || isConnected[workspaceKey] || false;

  // Debug WebSocket connection
  useEffect(() => {
    console.log('🔌 WebSocket Status Debug:', {
      workspaceId,
      workspaceKey,
      isRoomConnected: isRoomConnected(workspaceId, 'workspace'),
      isConnectedDirect: isConnected[workspaceKey],
      finalStatus: isWsConnected,
      connectionStatus,
      hasLastMessage: !!lastMessage,
      lastMessageType: lastMessage?.type
    });
  }, [workspaceId, isWsConnected, lastMessage, connectionStatus]);

  // Load workspace data from API
  useEffect(() => {
    console.log('🔍 ChatDashboard mounted:', { workspaceId, isAuthenticated });
    
    if (!isAuthenticated || !workspaceId) {
      console.log('⏳ Waiting for auth or workspaceId...');
      return;
    }

    const loadWorkspaceData = async () => {
      try {
        setLoading(true);
        setError(null);
        dataLoadedRef.current = false;

        console.log('🔄 Loading workspace data for workspace:', workspaceId);

          const [workspaceData, channelsData, dmData] = await Promise.all([
          workspaceService.getWorkspace(workspaceId),
          channelService.getChannels(workspaceId),  
          dmService.getDirectMessages(workspaceId)      
        ]);

        console.log('✅ Workspace data:', workspaceData);
        console.log('✅ Raw channels data:', channelsData);
        console.log('✅ DM data:', dmData);

        setWorkspace(workspaceData);
        
        // Handle different response formats for channels
        let channelsArray = [];
        if (Array.isArray(channelsData)) {
          channelsArray = channelsData;
        } else if (channelsData && channelsData.results) {
          channelsArray = channelsData.results;
        } else if (channelsData && Array.isArray(channelsData.data)) {
          channelsArray = channelsData.data;
        }

        console.log('📋 Channels array length:', channelsArray.length);

        // Filter channels for current workspace
        console.log('🔍 Filtering channels for workspace:', workspaceId);
        const workspaceChannels = channelsArray.filter(channel => {
          // Handle both object and ID formats
          const channelWorkspaceId = channel.workspace?.id || channel.workspace || channel.workspace_id;
          const matches = channelWorkspaceId == workspaceId;
          console.log(`   Channel ${channel.id}: workspaceId=${channelWorkspaceId}, matches=${matches}`);
          return matches;
        });

        console.log('🎯 Final channels to display:', workspaceChannels);
        setChannels(workspaceChannels);
        setDirectMessages(Array.isArray(dmData) ? dmData : []);
        
        // Mark data as loaded to prevent WebSocket overwrites
        dataLoadedRef.current = true;

      } catch (error) {
        console.error('❌ Failed to load workspace data:', error);
        setError('Failed to load chat data: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    loadWorkspaceData();
  }, [workspaceId, isAuthenticated]);

  // Connect to workspace WebSocket
  useEffect(() => {
    if (workspaceId && isAuthenticated) {
      console.log('🔌 Connecting to workspace WebSocket:', workspaceId);
      connectToWorkspace(workspaceId);
    }
  }, [workspaceId, isAuthenticated, connectToWorkspace]);

  // Handle WebSocket messages WITHOUT overwriting API data
  useEffect(() => {
    if (!lastMessage || !dataLoadedRef.current) return;

    console.log('📨 Processing WebSocket message:', lastMessage);

    switch (lastMessage.type) {
      case 'workspace_initial_data':
        console.log('📨 Workspace initial data (ignoring channels to prevent conflict):', lastMessage);
        // Only update workspace info, not channels
        if (lastMessage.workspace) {
          setWorkspace(prev => ({ ...prev, ...lastMessage.workspace }));
        }
        break;

      case 'channel_created':
        console.log('📨 Adding new channel from WebSocket:', lastMessage.channel);
        // Add new channel to existing list
        setChannels(prev => {
          const exists = prev.some(ch => ch.id === lastMessage.channel.id);
          if (!exists) {
            return [...prev, lastMessage.channel];
          }
          return prev;
        });
        break;

      case 'channel_updated':
        console.log('📨 Updating channel from WebSocket:', lastMessage.channel);
        // Update existing channel
        setChannels(prev => prev.map(channel => 
          channel.id === lastMessage.channel.id ? lastMessage.channel : channel
        ));
        break;

      case 'channel_archived':
        console.log('📨 Removing archived channel:', lastMessage.channel);
        // Remove archived channel
        setChannels(prev => prev.filter(channel => 
          channel.id !== lastMessage.channel.id
        ));
        break;

      default:
        console.log('📨 Unknown message type:', lastMessage.type);
    }
  }, [lastMessage]);

  const handleChannelSelect = (channel) => {
    console.log('🎯 Selecting channel:', channel);
    setSelectedChannel(channel);
    navigate(`/chat/${workspaceId}/channel/${channel.id}`);
  };

  const handleDMSelect = (dm) => {
    console.log('🎯 Selecting DM:', dm);
    setSelectedChannel(null);
    navigate(`/chat/${workspaceId}/dm/${dm.id}`);
  };

  const handleCreateChannel = () => {
    navigate(`/chat/${workspaceId}/create-channel`);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Add a manual refresh function
  const handleRefresh = async () => {
    console.log('🔄 Manual refresh triggered');
    setLoading(true);
    dataLoadedRef.current = false;
    
    try {
      const channelsData = await channelService.getChannels(workspaceId);
      console.log('🔄 Refreshed channels data:', channelsData);
      
      let channelsArray = [];
      if (Array.isArray(channelsData)) channelsArray = channelsData;
      else if (channelsData?.results) channelsArray = channelsData.results;
      else if (channelsData?.data) channelsArray = channelsData.data;
      
      const workspaceChannels = channelsArray.filter(channel => {
        const channelWorkspaceId = channel.workspace?.id || channel.workspace || channel.workspace_id;
        return channelWorkspaceId == workspaceId;
      });
      
      setChannels(workspaceChannels);
      dataLoadedRef.current = true;
    } catch (error) {
      console.error('❌ Refresh failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Debug: Log when channels change
  useEffect(() => {
    console.log('📊 Channels state updated:', channels.length, 'channels');
  }, [channels]);

  if (loading || authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat workspace...</p>
          <p className="text-sm text-gray-500 mt-2">Workspace ID: {workspaceId}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex h-screen bg-white">
      {/* Sidebar with Toggle */}
      <div className={`transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'w-0' : 'w-80'}`}>
        <Sidebar 
          workspaceId={workspaceId}
          onChannelSelect={handleChannelSelect}
          onDmSelect={handleDMSelect}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Sidebar Toggle Button */}
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <svg 
                  className={`w-5 h-5 text-gray-600 transition-transform duration-300 ${
                    sidebarCollapsed ? 'rotate-180' : ''
                  }`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4 6h16M4 12h16M4 18h16" 
                  />
                </svg>
              </button>

              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {workspace?.name?.charAt(0) || 'W'}
                </span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {workspace?.name || `Workspace ${workspaceId}`}
                </h1>
                <p className="text-gray-500 text-sm">
                  {workspace?.description || 'Team collaboration space'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                className="text-gray-500 hover:text-gray-700 transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-gray-100"
                title="Refresh"
              >
                <span className="text-sm font-medium">Refresh</span>
              </button>
              
              {/* FIXED: WebSocket Status Indicator */}
              <div className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-lg">
                <div 
                  className={`w-3 h-3 rounded-full ${
                    isWsConnected 
                      ? 'bg-green-500 animate-pulse' 
                      : 'bg-red-400'
                  }`} 
                  title={
                    isWsConnected 
                      ? 'WebSocket connected and active' 
                      : 'WebSocket disconnected'
                  } 
                />
                <span className="text-sm text-gray-600">
                  {isWsConnected ? 'Live' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-gray-50 overflow-y-auto">
          <div className="p-8 max-w-4xl mx-auto">
            {/* Welcome Section */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">C</span>
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Welcome to {workspace?.name || `Workspace ${workspaceId}`}
              </h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">
                {channels.length > 0 
                  ? `You have ${channels.length} channels available. Select one from the sidebar to start collaborating with your team.`
                  : 'Get started by creating your first channel to organize conversations and collaborate with your team members.'
                }
              </p>
              
              {/* Sidebar Hint when collapsed */}
              {sidebarCollapsed && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200 max-w-md mx-auto">
                  <div className="flex items-center justify-center space-x-2 text-blue-700">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                    <span className="text-sm font-medium">Sidebar is collapsed. Click the menu icon to expand.</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Channels</p>
                    <p className="text-2xl font-bold text-gray-900">{channels.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-bold">#</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Direct Messages</p>
                    <p className="text-2xl font-bold text-gray-900">{directMessages.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 font-bold">💬</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Connection</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {isWsConnected ? 'Live' : 'Offline'}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    isWsConnected ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <div className={`w-4 h-4 rounded-full ${
                      isWsConnected ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* WebSocket Debug Info */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
              <div className="text-sm text-blue-800 space-y-1">
                <div className="flex justify-between">
                  <span>WebSocket Status:</span>
                  <span className={`font-semibold ${isWsConnected ? 'text-green-600' : 'text-red-600'}`}>
                    {isWsConnected ? 'CONNECTED' : 'DISCONNECTED'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Workspace ID:</span>
                  <span className="font-mono">{workspaceId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Message:</span>
                  <span className="font-mono">{lastMessage?.type || 'None'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sidebar:</span>
                  <span className="font-semibold">{sidebarCollapsed ? 'Collapsed' : 'Expanded'}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={handleRefresh}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors duration-200 shadow-sm"
              >
                Refresh Data
              </button>
              {channels.length === 0 && (
                <button
                  onClick={handleCreateChannel}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors duration-200 shadow-sm"
                >
                  Create First Channel
                </button>
              )}
              <button
                onClick={toggleSidebar}
                className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors duration-200 shadow-sm"
              >
                {sidebarCollapsed ? 'Show Sidebar' : 'Hide Sidebar'}
              </button>
            </div>
          </div>
        </div>

        {/* Selected Channel Info */}
        {selectedChannel && (
          <div className="bg-blue-50 border-t border-blue-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs">#</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedChannel.name}</h3>
                  <p className="text-sm text-gray-600">Currently selected channel</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedChannel(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="bg-yellow-50 border-t border-yellow-200 p-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-yellow-800 text-sm font-medium">{error}</span>
              <button
                onClick={() => setError(null)}
                className="text-yellow-600 hover:text-yellow-800 ml-auto"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}