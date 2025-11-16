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
      console.log('🔄 Loading sidebar data...');

      // Load channels and DMs in parallel with proper error handling
      const [channelsResult, dmResult] = await Promise.allSettled([
        channelService.getChannels(),
        dmService.getDirectMessages()
      ]);

      console.log('📊 Channels result:', channelsResult);
      console.log('📊 DMs result:', dmResult);

      // Handle channels response - ensure it's always an array
      if (channelsResult.status === 'fulfilled') {
        const channelsData = channelsResult.value;
        if (Array.isArray(channelsData)) {
          setChannels(channelsData);
        } else if (channelsData && Array.isArray(channelsData.results)) {
          setChannels(channelsData.results);
        } else if (channelsData && Array.isArray(channelsData.channels)) {
          setChannels(channelsData.channels);
        } else {
          console.warn('⚠️ Unexpected channels format, defaulting to empty array:', channelsData);
          setChannels([]);
        }
      } else {
        console.error('❌ Failed to load channels:', channelsResult.reason);
        setChannels([]);
      }

      // Handle DMs response - ensure it's always an array
      if (dmResult.status === 'fulfilled') {
        const dmData = dmResult.value;
        if (Array.isArray(dmData)) {
          setDirectMessages(dmData);
        } else if (dmData && Array.isArray(dmData.results)) {
          setDirectMessages(dmData.results);
        } else if (dmData && Array.isArray(dmData.direct_messages)) {
          setDirectMessages(dmData.direct_messages);
        } else {
          console.warn('⚠️ Unexpected DMs format, defaulting to empty array:', dmData);
          setDirectMessages([]);
        }
      } else {
        console.error('❌ Failed to load DMs:', dmResult.reason);
        setDirectMessages([]);
      }

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
    <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
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
        <div className="mt-2 text-xs text-gray-500">
          <div>Channels: {channels.length}</div>
          <div>DMs: {directMessages.length}</div>
        </div>
      </div>

      {/* Channels Section */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-gray-400 text-sm font-semibold uppercase tracking-wide">Channels</h2>
            <span className="text-gray-500 text-xs">{channels.length}</span>
          </div>
          
          {/* Safe channels rendering */}
          <div className="space-y-1">
            {Array.isArray(channels) && channels.length > 0 ? (
              channels.map(channel => (
                <button
                  key={channel.id}
                  onClick={() => onChannelSelect && onChannelSelect(channel)}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  <span className="text-gray-500 mr-1">#</span>
                  {channel.name || 'Unnamed Channel'}
                </button>
              ))
            ) : (
              <p className="text-gray-500 text-sm px-3 py-2">No channels available</p>
            )}
          </div>
        </div>

        {/* Direct Messages Section */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-gray-400 text-sm font-semibold uppercase tracking-wide">Direct Messages</h2>
            <span className="text-gray-500 text-xs">{directMessages.length}</span>
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
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>{dm.other_user?.display_name || dm.other_user?.email || 'Unknown User'}</span>
                </button>
              ))
            ) : (
              <p className="text-gray-500 text-sm px-3 py-2">No direct messages</p>
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