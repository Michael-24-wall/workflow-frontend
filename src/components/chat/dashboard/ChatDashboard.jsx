import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { workspaceService, channelService, dmService, roomService } from '../../../services/chat/api';
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
  const [apiStatus, setApiStatus] = useState('checking');

  // Use Zustand store for authentication
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    console.log('🔐 ChatDashboard - Authentication Check:', {
      isAuthenticated,
      user: user?.email,
      tokenExists: !!localStorage.getItem('access_token'),
      workspaceId
    });

    if (!isAuthenticated || !user) {
      setError('Please log in to access the chat');
      setLoading(false);
      setApiStatus('unauthorized');
      return;
    }

    if (workspaceId) {
      loadWorkspaceData();
    } else {
      setLoading(false);
      setError('No workspace selected');
    }
  }, [workspaceId, isAuthenticated, user]);

  const loadWorkspaceData = async () => {
    try {
      setLoading(true);
      setError(null);
      setApiStatus('loading');
      
      console.log('🔄 Loading workspace data for:', workspaceId);

      // First check if chat API is accessible
      try {
        const health = await roomService.checkHealth();
        setApiStatus(health ? 'connected' : 'disconnected');
      } catch (healthError) {
        console.log('⚠️ Chat API health check failed, using fallback mode');
        setApiStatus('fallback');
      }

      // Load workspace details with fallback
      let workspaceData = null;
      try {
        workspaceData = await workspaceService.getWorkspace(workspaceId);
        console.log('✅ Workspace loaded:', workspaceData);
      } catch (workspaceError) {
        console.warn('⚠️ Could not load workspace, using fallback:', workspaceError.message);
        workspaceData = { 
          id: workspaceId, 
          name: `Workspace ${workspaceId}`,
          description: 'Team collaboration space'
        };
      }
      setWorkspace(workspaceData);

      // Load channels/rooms with fallback
      await loadChannels();

      // Load direct messages with fallback
      await loadDirectMessages();

      console.log('✅ Chat dashboard loaded successfully');

    } catch (error) {
      console.error('❌ Failed to load workspace data:', error);
      setError('Chat features are currently unavailable. Using demo mode.');
      setApiStatus('fallback');
      
      // Provide comprehensive fallback data
      setWorkspace({ 
        id: workspaceId, 
        name: `Workspace ${workspaceId}`,
        description: 'Team collaboration space'
      });
      setChannels(getFallbackChannels());
      setDirectMessages(getFallbackDMs());
    } finally {
      setLoading(false);
    }
  };

  const loadChannels = async () => {
    try {
      console.log('📡 Fetching channels...');
      
      let channelsData = [];
      
      // Try multiple endpoints
      try {
        // First try rooms endpoint
        channelsData = await roomService.getRooms();
        console.log('✅ Rooms loaded:', channelsData);
      } catch (roomsError) {
        console.warn('⚠️ Rooms endpoint failed, trying channels:', roomsError.message);
        // Fallback to channels endpoint
        channelsData = await channelService.getChannels();
        console.log('✅ Channels loaded:', channelsData);
      }

      // Filter for current workspace if needed
      const filteredChannels = channelsData.filter(channel => 
        !workspaceId || 
        channel.workspace?.id === workspaceId || 
        channel.workspace_id === workspaceId ||
        !channel.workspace
      );
      
      console.log('📊 Filtered channels:', filteredChannels);
      setChannels(filteredChannels.length > 0 ? filteredChannels : getFallbackChannels());

    } catch (error) {
      console.error('❌ Failed to load channels:', error);
      setChannels(getFallbackChannels());
    }
  };

  const loadDirectMessages = async () => {
    try {
      console.log('📡 Fetching direct messages...');
      const dmData = await dmService.getDirectMessages();
      console.log('✅ DMs loaded:', dmData);
      setDirectMessages(dmData || []);
    } catch (error) {
      console.error('❌ Failed to load direct messages:', error);
      setDirectMessages(getFallbackDMs());
    }
  };

  const getFallbackChannels = () => {
    return [
      {
        id: '1',
        name: 'general',
        description: 'General discussions and announcements',
        member_count: 1,
        is_private: false,
        created_at: new Date().toISOString()
      },
      {
        id: '2', 
        name: 'random',
        description: 'Random conversations and off-topic discussions',
        member_count: 1,
        is_private: false,
        created_at: new Date().toISOString()
      },
      {
        id: '3',
        name: 'help',
        description: 'Get help and ask questions',
        member_count: 1,
        is_private: false,
        created_at: new Date().toISOString()
      }
    ];
  };

  const getFallbackDMs = () => {
    return [
      {
        id: 'dm-1',
        other_user: {
          id: '2',
          email: 'teammate@example.com',
          display_name: 'Team Member'
        },
        last_message: {
          content: 'Hey there! How are you?',
          timestamp: new Date(Date.now() - 3600000).toISOString()
        },
        unread_count: 0
      }
    ];
  };

  const handleJoinChannel = async (channelId) => {
    try {
      console.log('🎯 Joining channel:', channelId);
      
      // This will not throw error even if API fails
      await channelService.joinChannel(channelId);
      console.log('✅ Joined channel successfully');
      
      // Navigate to the channel
      navigate(`/chat/${workspaceId}/channel/${channelId}`);
    } catch (error) {
      console.log('⚠️ Join API call failed, but navigating anyway:', error.message);
      // Still navigate even if join fails
      navigate(`/chat/${workspaceId}/channel/${channelId}`);
    }
  };

  const handleStartDM = async (userId) => {
    try {
      console.log('💬 Starting DM with user:', userId);
      const dm = await dmService.startDirectMessage(userId);
      console.log('✅ DM started:', dm);
      navigate(`/chat/${workspaceId}/dm/${dm.id}`);
    } catch (error) {
      console.log('⚠️ Start DM API call failed, but navigating anyway:', error.message);
      // Navigate with fallback DM ID
      navigate(`/chat/${workspaceId}/dm/dm-${userId}`);
    }
  };

  const handleCreateChannel = () => {
    navigate(`/chat/${workspaceId}/create-channel`);
  };

  const handleReconnect = () => {
    setError(null);
    loadWorkspaceData();
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-900 p-8">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Authentication Required</h1>
          <p className="text-gray-400 mb-6">
            Please log in to access the chat features.
          </p>
          <div className="flex space-x-4 justify-center">
            <button
              onClick={() => navigate('/login')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Go to Login
            </button>
            <button
              onClick={handleReconnect}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading chat dashboard...</p>
          <p className="text-gray-500 text-sm mt-2">
            {apiStatus === 'checking' && 'Checking chat service...'}
            {apiStatus === 'loading' && 'Loading your workspace...'}
            {apiStatus === 'connected' && 'Connected to chat service'}
            {apiStatus === 'fallback' && 'Using demo mode'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-2xl font-bold text-white">
                {workspace?.name || 'Chat Workspace'}
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                {workspace?.description || 'Team collaboration space'}
              </p>
            </div>
            {/* API Status Badge */}
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              apiStatus === 'connected' ? 'bg-green-900 text-green-300' :
              apiStatus === 'fallback' ? 'bg-yellow-900 text-yellow-300' :
              'bg-gray-700 text-gray-300'
            }`}>
              {apiStatus === 'connected' ? '🟢 Connected' :
               apiStatus === 'fallback' ? '🟡 Demo Mode' :
               '⚪ Checking'}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* User info */}
            <div className="flex items-center space-x-3 bg-gray-700 px-3 py-2 rounded-lg">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="text-gray-300 text-sm hidden md:block">
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
        <div className="bg-yellow-900 border-b border-yellow-700 px-6 py-3">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-yellow-200 text-sm">{error}</span>
            </div>
            <button
              onClick={handleReconnect}
              className="text-yellow-300 hover:text-yellow-200 text-sm underline flex items-center space-x-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Retry Connection</span>
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Section */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Welcome to {workspace?.name || 'Chat'}
            </h2>
            <p className="text-gray-400 text-lg">
              Connect with your team through channels or start private conversations
            </p>
            {apiStatus === 'fallback' && (
              <p className="text-yellow-400 text-sm mt-2">
                🔄 Using demo data - some features may be limited
              </p>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="bg-gray-800 rounded-lg p-1 mb-6 inline-flex mx-auto">
            <button
              onClick={() => setActiveTab('channels')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'channels'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Channels ({channels.length})
            </button>
            <button
              onClick={() => setActiveTab('direct-messages')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'direct-messages'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Direct Messages ({directMessages.length})
            </button>
          </div>

          {/* Channels Tab */}
          {activeTab === 'channels' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">Workspace Channels</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={loadWorkspaceData}
                    className="text-gray-400 hover:text-white text-sm flex items-center space-x-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {channels.length === 0 ? (
                <div className="bg-gray-800 rounded-lg p-8 text-center">
                  <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h4 className="text-white font-medium mb-2">No channels yet</h4>
                  <p className="text-gray-400 text-sm mb-4">
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
                      className="bg-gray-800 hover:bg-gray-750 rounded-lg p-6 border border-gray-700 transition-all duration-200 cursor-pointer group hover:border-blue-500"
                      onClick={() => navigate(`/chat/${workspaceId}/channel/${channel.id}`)}
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold">#</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-semibold group-hover:text-blue-400 transition-colors truncate">
                            {channel.name}
                          </h4>
                          <p className="text-gray-400 text-sm">
                            {channel.member_count || 1} member{channel.member_count !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                        {channel.description || 'General discussions'}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs px-2 py-1 rounded ${
                          channel.is_private 
                            ? 'bg-purple-900 text-purple-300' 
                            : 'bg-green-900 text-green-300'
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
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">Direct Messages</h3>
                <button
                  onClick={loadWorkspaceData}
                  className="text-gray-400 hover:text-white text-sm flex items-center space-x-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Refresh</span>
                </button>
              </div>

              {directMessages.length === 0 ? (
                <div className="bg-gray-800 rounded-lg p-8 text-center">
                  <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h4 className="text-white font-medium mb-2">No direct messages</h4>
                  <p className="text-gray-400 text-sm mb-4">
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
                      className="bg-gray-800 hover:bg-gray-750 rounded-lg p-6 border border-gray-700 transition-all duration-200 cursor-pointer group hover:border-purple-500"
                      onClick={() => navigate(`/chat/${workspaceId}/dm/${dm.id}`)}
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {dm.other_user?.email?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-semibold group-hover:text-purple-400 transition-colors truncate">
                            {dm.other_user?.display_name || dm.other_user?.email || 'Unknown User'}
                          </h4>
                          <p className="text-gray-400 text-sm">
                            Direct message
                          </p>
                        </div>
                      </div>
                      {dm.last_message && (
                        <p className="text-gray-400 text-sm mb-2 line-clamp-2">
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

      {/* Debug Footer */}
      <div className="bg-gray-800 border-t border-gray-700 px-6 py-2">
        <div className="max-w-4xl mx-auto flex justify-between items-center text-xs text-gray-500">
          <div>
            Workspace: {workspaceId} • 
            User: {user?.email} • 
            Status: {apiStatus}
          </div>
          <div>
            Channels: {channels.length} • 
            DMs: {directMessages.length}
          </div>
        </div>
      </div>
    </div>
  );
}