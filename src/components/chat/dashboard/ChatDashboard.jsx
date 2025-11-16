import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { workspaceService, channelService, dmService } from '../../../services/chat/api';
import { useWebSocket } from '../../../contexts/chat/WebSocketContext';
import useAuthStore from '../../../stores/authStore';

export default function ChatDashboard() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState(null);
  const [channels, setChannels] = useState([]);
  const [directMessages, setDirectMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('channels');
  const [error, setError] = useState(null);

  // Use Zustand store for authentication - SIMPLE like other dashboards
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  
  // Use WebSocket context
  const { connect, isRoomConnected } = useWebSocket();

  // ✅ SIMPLE authentication check - NO complex logic
  useEffect(() => {
    console.log('🔐 ChatDashboard auth check:', { isAuthenticated, hasUser: !!user });
    
    // Simple redirect if not authenticated
    if (!isAuthenticated || !user) {
      console.log('❌ Not authenticated, redirecting to login');
      navigate('/login');
      return;
    }

    // If authenticated, load workspace data
    if (workspaceId) {
      console.log('✅ User authenticated, loading workspace data');
      loadWorkspaceData();
    }
  }, [workspaceId, isAuthenticated, user, navigate]);

  // ✅ SIMPLE WebSocket connection
  useEffect(() => {
    if (!workspaceId || !isAuthenticated || !user) return;

    console.log('🔌 Setting up WebSocket for workspace:', workspaceId);
    
    try {
      connect(workspaceId, 'workspace');
    } catch (error) {
      console.error('WebSocket connection failed:', error);
    }
  }, [workspaceId, isAuthenticated, user, connect]);

  // ✅ SIMPLE workspace data loading
  const loadWorkspaceData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Loading workspace data for:', workspaceId);

      // Load data in parallel
      const [workspaceData, channelsData, dmData] = await Promise.all([
        workspaceService.getWorkspace(workspaceId),
        channelService.getChannels(),
        dmService.getDirectMessages()
      ]);

      setWorkspace(workspaceData);
      setChannels(Array.isArray(channelsData) ? channelsData : []);
      setDirectMessages(Array.isArray(dmData) ? dmData : []);

      console.log('✅ Chat dashboard loaded successfully');

    } catch (error) {
      console.error('❌ Failed to load workspace data:', error);
      setError('Failed to load chat data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinChannel = (channelId) => {
    if (!isRoomConnected(channelId, 'channel')) {
      connect(channelId, 'channel');
    }
    navigate(`/chat/${workspaceId}/channel/${channelId}`);
  };

  const handleStartDM = (dmId) => {
    if (!isRoomConnected(dmId, 'dm')) {
      connect(dmId, 'dm');
    }
    navigate(`/chat/${workspaceId}/dm/${dmId}`);
  };

  const handleCreateChannel = () => {
    navigate(`/chat/${workspaceId}/create-channel`);
  };

  const handleReconnect = () => {
    setError(null);
    loadWorkspaceData();
  };

  // Safe navigation handlers
  const navigateToChannel = (channelId) => {
    if (channelId) {
      if (!isRoomConnected(channelId, 'channel')) {
        connect(channelId, 'channel');
      }
      navigate(`/chat/${workspaceId}/channel/${channelId}`);
    }
  };

  const navigateToDM = (dmId) => {
    if (dmId) {
      if (!isRoomConnected(dmId, 'dm')) {
        connect(dmId, 'dm');
      }
      navigate(`/chat/${workspaceId}/dm/${dmId}`);
    }
  };

  // Show authentication loading
  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show authentication required message only if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔒</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-4">Please log in to access chat features</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat workspace...</p>
        </div>
      </div>
    );
  }

  const wsConnected = isRoomConnected(workspaceId, 'workspace');

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg font-semibold">💬</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {workspace?.name || 'Chat Workspace'}
              </h1>
              <p className="text-gray-600 text-sm">
                {workspace?.description || 'Team collaboration space'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Connection Status */}
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
              wsConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span>{wsConnected ? 'Connected' : 'Disconnected'}</span>
            </div>

            {/* User Info */}
            <div className="flex items-center space-x-3 bg-gray-50 px-3 py-2 rounded-lg">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="text-gray-700 text-sm hidden md:block">
                {user?.email}
              </span>
            </div>

            <button
              onClick={handleCreateChannel}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              + Create Channel
            </button>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex items-center space-x-3">
              <span className="text-yellow-600">⚠️</span>
              <span className="text-yellow-800 text-sm">{error}</span>
            </div>
            <button
              onClick={handleReconnect}
              className="text-yellow-700 hover:text-yellow-800 text-sm underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6">
          {/* Welcome Section */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">💬</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to {workspace?.name || 'Chat'}
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Connect with your team through channels or start private conversations.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-1 bg-gray-100 rounded-2xl p-1 mb-8 max-w-md mx-auto">
            <button
              onClick={() => setActiveTab('channels')}
              className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                activeTab === 'channels'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Channels ({channels.length})
            </button>
            <button
              onClick={() => setActiveTab('direct-messages')}
              className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                activeTab === 'direct-messages'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Messages ({directMessages.length})
            </button>
          </div>

          {/* Channels Tab */}
          {activeTab === 'channels' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Workspace Channels</h3>
                <button
                  onClick={handleReconnect}
                  className="text-gray-600 hover:text-gray-900 text-sm flex items-center space-x-1"
                >
                  <span>🔄</span>
                  <span>Refresh</span>
                </button>
              </div>

              {channels.length === 0 ? (
                <div className="bg-gray-50 rounded-2xl p-8 text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📢</span>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No channels yet</h4>
                  <p className="text-gray-600 text-sm mb-4">
                    Create the first channel to start team conversations
                  </p>
                  <button
                    onClick={handleCreateChannel}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
                  >
                    Create Channel
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {channels.map((channel) => (
                    <div
                      key={channel.id}
                      className="bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-500 transition-all duration-200 cursor-pointer group"
                      onClick={() => navigateToChannel(channel.id)}
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold">#</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-gray-900 font-semibold group-hover:text-blue-600 transition-colors truncate">
                            {channel.name}
                          </h4>
                          <p className="text-gray-500 text-sm">
                            {channel.member_count || 1} member{channel.member_count !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {channel.description || 'General discussions'}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs px-2 py-1 rounded ${
                          channel.is_private 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {channel.is_private ? 'Private' : 'Public'}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleJoinChannel(channel.id);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          Join
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Direct Messages Tab */}
          {activeTab === 'direct-messages' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Direct Messages</h3>
                <button
                  onClick={handleReconnect}
                  className="text-gray-600 hover:text-gray-900 text-sm flex items-center space-x-1"
                >
                  <span>🔄</span>
                  <span>Refresh</span>
                </button>
              </div>

              {directMessages.length === 0 ? (
                <div className="bg-gray-50 rounded-2xl p-8 text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">👤</span>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h4>
                  <p className="text-gray-600 text-sm mb-4">
                    Start a conversation with a team member
                  </p>
                  <button
                    onClick={() => alert('DM creation feature coming soon!')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
                  >
                    Start New DM
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {directMessages.map((dm) => (
                    <div
                      key={dm.id}
                      className="bg-white border border-gray-200 rounded-xl p-6 hover:border-purple-500 transition-all duration-200 cursor-pointer group"
                      onClick={() => navigateToDM(dm.id)}
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {dm.other_user?.email?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-gray-900 font-semibold group-hover:text-purple-600 transition-colors truncate">
                            {dm.other_user?.display_name || dm.other_user?.email || 'Unknown User'}
                          </h4>
                          <p className="text-gray-500 text-sm">
                            Direct message
                          </p>
                        </div>
                      </div>
                      {dm.last_message && (
                        <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                          {dm.last_message.content}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>
                          {dm.unread_count > 0 ? (
                            <span className="bg-red-500 text-white px-2 py-1 rounded-full">
                              {dm.unread_count} unread
                            </span>
                          ) : (
                            'All read'
                          )}
                        </span>
                        <span>
                          {dm.last_message && new Date(dm.last_message.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}