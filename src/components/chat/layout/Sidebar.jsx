// components/chat/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { channelService, dmService } from '../../../services/chat/api';

export default function Sidebar({ workspaceId, onChannelSelect, onDmSelect }) {
  const [channels, setChannels] = useState([]);
  const [directMessages, setDirectMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (workspaceId) {
      loadSidebarData();
    }
  }, [workspaceId]);

  const loadSidebarData = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('🔄 Loading sidebar data for workspace:', workspaceId);

      // Load channels and DMs in parallel with proper error handling
      const [channelsResult, dmResult] = await Promise.allSettled([
        channelService.getChannels(),
        dmService.getDirectMessages()
      ]);

      console.log('📊 Channels result:', channelsResult);
      console.log('📊 DMs result:', dmResult);

      let allChannels = [];
      let allDMs = [];

      // Handle channels response - ensure it's always an array
      if (channelsResult.status === 'fulfilled') {
        const channelsData = channelsResult.value;
        if (Array.isArray(channelsData)) {
          allChannels = channelsData;
        } else if (channelsData && Array.isArray(channelsData.results)) {
          allChannels = channelsData.results;
        } else if (channelsData && Array.isArray(channelsData.channels)) {
          allChannels = channelsData.channels;
        } else if (channelsData && Array.isArray(channelsData.data)) {
          allChannels = channelsData.data;
        } else {
          console.warn('⚠️ Unexpected channels format, defaulting to empty array:', channelsData);
          allChannels = [];
        }
      } else {
        console.error('❌ Failed to load channels:', channelsResult.reason);
        allChannels = [];
      }

      // Filter channels for current workspace (CRITICAL FIX)
      const workspaceChannels = allChannels.filter(channel => {
        const channelWorkspaceId = channel.workspace?.id || channel.workspace || channel.workspace_id;
        const matches = channelWorkspaceId == workspaceId;
        console.log(`🔍 Sidebar - Channel ${channel.id}: workspaceId=${channelWorkspaceId}, matches=${matches}`);
        return matches;
      });

      console.log('🎯 Sidebar - Filtered channels:', workspaceChannels);

      setChannels(workspaceChannels);

      // Handle DMs response - ensure it's always an array
      if (dmResult.status === 'fulfilled') {
        const dmData = dmResult.value;
        if (Array.isArray(dmData)) {
          allDMs = dmData;
        } else if (dmData && Array.isArray(dmData.results)) {
          allDMs = dmData.results;
        } else if (dmData && Array.isArray(dmData.direct_messages)) {
          allDMs = dmData.direct_messages;
        } else if (dmData && Array.isArray(dmData.data)) {
          allDMs = dmData.data;
        } else {
          console.warn('⚠️ Unexpected DMs format, defaulting to empty array:', dmData);
          allDMs = [];
        }
      } else {
        console.error('❌ Failed to load DMs:', dmResult.reason);
        allDMs = [];
      }

      setDirectMessages(allDMs);

    } catch (error) {
      console.error('❌ Failed to load sidebar data:', error);
      setError('Failed to load sidebar data');
      // Ensure arrays are always set to empty arrays
      setChannels([]);
      setDirectMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    loadSidebarData();
  };

  if (loading) {
    return (
      <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
        <div className="flex-1 p-4 space-y-4">
          <div className="animate-pulse">
            <div className="h-3 bg-gray-700 rounded w-1/2 mb-2"></div>
            {[1, 2, 3].map(i => (
              <div key={i} className="h-4 bg-gray-700 rounded w-full mb-1"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col h-full">
      {/* Workspace Header */}
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-white font-semibold text-lg">Workspace</h1>
        <p className="text-gray-400 text-sm">ID: {workspaceId}</p>
        
        {/* Error Display */}
        {error && (
          <div className="mt-2 p-2 bg-red-900/50 border border-red-700 rounded text-red-200 text-xs">
            <div className="flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={handleRetry}
                className="text-red-300 hover:text-white underline text-xs"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Debug Info */}
        <div className="mt-2 text-xs text-gray-500 space-y-1">
          <div className="flex justify-between">
            <span>Channels:</span>
            <span className={channels.length > 0 ? 'text-green-400' : 'text-gray-400'}>
              {channels.length} found
            </span>
          </div>
          <div className="flex justify-between">
            <span>DMs:</span>
            <span className={directMessages.length > 0 ? 'text-green-400' : 'text-gray-400'}>
              {directMessages.length} found
            </span>
          </div>
        </div>
      </div>

      {/* Channels Section */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-gray-400 text-sm font-semibold uppercase tracking-wide">Channels</h2>
            <span className="text-gray-500 text-xs bg-gray-700 px-2 py-1 rounded-full">
              {channels.length}
            </span>
          </div>
          
          {/* Safe channels rendering */}
          <div className="space-y-1">
            {Array.isArray(channels) && channels.length > 0 ? (
              channels.map(channel => (
                <button
                  key={channel.id}
                  onClick={() => onChannelSelect && onChannelSelect(channel)}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors text-gray-300 hover:bg-gray-700 hover:text-white flex items-center"
                >
                  <span className="text-gray-500 mr-2">#</span>
                  <span className="truncate">{channel.name || `Channel ${channel.id}`}</span>
                </button>
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 text-sm">No channels in this workspace</p>
                <p className="text-gray-600 text-xs mt-1">Create a channel to get started</p>
              </div>
            )}
          </div>
        </div>

        {/* Direct Messages Section */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-gray-400 text-sm font-semibold uppercase tracking-wide">Direct Messages</h2>
            <span className="text-gray-500 text-xs bg-gray-700 px-2 py-1 rounded-full">
              {directMessages.length}
            </span>
          </div>
          
          {/* Safe DMs rendering */}
          <div className="space-y-1">
            {Array.isArray(directMessages) && directMessages.length > 0 ? (
              directMessages.map(dm => (
                <button
                  key={dm.id}
                  onClick={() => onDmSelect && onDmSelect(dm)}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors text-gray-300 hover:bg-gray-700 hover:text-white flex items-center space-x-2"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                  <span className="truncate">
                    {dm.other_user?.display_name || dm.other_user?.email || dm.user?.display_name || dm.user?.email || 'Unknown User'}
                  </span>
                </button>
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 text-sm">No direct messages</p>
                <p className="text-gray-600 text-xs mt-1">Start a conversation</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
            {localStorage.getItem('user_email')?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">
              {localStorage.getItem('user_email') || 'User'}
            </p>
            <p className="text-gray-400 text-xs">Online</p>
          </div>
        </div>
      </div>
    </div>
  );
}