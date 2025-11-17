// components/chat/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { channelService, dmService } from '../../../services/chat/api';

export default function Sidebar({ workspaceId, onChannelSelect, onDmSelect }) {
  const [channels, setChannels] = useState([]);
  const [directMessages, setDirectMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sections, setSections] = useState({
    channels: true,
    dms: true
  });

  useEffect(() => {
    if (workspaceId) {
      loadSidebarData();
    }
  }, [workspaceId]);

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        // Focus search input
        document.querySelector('input[type="text"]')?.focus();
      }
      if (e.ctrlKey && e.key === '1') {
        e.preventDefault();
        toggleSection('channels');
      }
      if (e.ctrlKey && e.key === '2') {
        e.preventDefault();
        toggleSection('dms');
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

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

  const toggleSection = (section) => {
    setSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleCreateChannel = () => {
    // TODO: Implement channel creation modal
    console.log('Open channel creation modal');
    // You can integrate this with a modal component
  };

  const handleStartDM = () => {
    // TODO: Implement DM creation modal
    console.log('Open DM creation modal');
  };

  // Filter channels and DMs based on search term
  const filteredChannels = channels.filter(channel =>
    channel.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDMs = directMessages.filter(dm => {
    const userName = dm.other_user?.display_name || dm.other_user?.email || dm.user?.display_name || dm.user?.email || '';
    return userName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col h-full">
        {/* Search Skeleton */}
        <div className="p-4 border-b border-gray-700">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded"></div>
          </div>
        </div>

        {/* Workspace Header Skeleton */}
        <div className="p-4 border-b border-gray-700">
          <div className="animate-pulse">
            <div className="h-5 bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>

        {/* Channels Section Skeleton */}
        <div className="p-4">
          <div className="animate-pulse mb-4">
            <div className="h-4 bg-gray-700 rounded w-1/3 mb-3"></div>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-8 bg-gray-700 rounded w-full mb-2"></div>
            ))}
          </div>
        </div>

        {/* DMs Section Skeleton */}
        <div className="p-4 border-t border-gray-700">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-1/3 mb-3"></div>
            {[1, 2, 3].map(i => (
              <div key={i} className="h-8 bg-gray-700 rounded w-full mb-2"></div>
            ))}
          </div>
        </div>

        {/* User Info Skeleton */}
        <div className="p-4 border-t border-gray-700 mt-auto">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-700 rounded w-2/3 mb-1"></div>
              <div className="h-3 bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col h-full">
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-700">
        <div className="relative">
          <input
            type="text"
            placeholder="Search channels & messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 pl-9 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg 
            className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <div className="mt-2 text-xs text-gray-500">
          <kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">Ctrl+K</kbd> to search
        </div>
      </div>

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
            <button
              onClick={() => toggleSection('channels')}
              className="flex items-center space-x-2 text-gray-400 text-sm font-semibold uppercase tracking-wide hover:text-white transition-colors group"
            >
              <svg 
                className={`w-4 h-4 transition-transform ${sections.channels ? 'rotate-90' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span>Channels</span>
            </button>
            <div className="flex items-center space-x-2">
              <span className="text-gray-500 text-xs bg-gray-700 px-2 py-1 rounded-full">
                {filteredChannels.length}
              </span>
              <button
                onClick={handleCreateChannel}
                className="text-gray-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                title="Create Channel"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Channels List */}
          {sections.channels && (
            <div className="space-y-1">
              {filteredChannels.length > 0 ? (
                filteredChannels.map(channel => (
                  <button
                    key={channel.id}
                    onClick={() => onChannelSelect && onChannelSelect(channel)}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors text-gray-300 hover:bg-gray-700 hover:text-white flex items-center justify-between group"
                  >
                    <div className="flex items-center min-w-0 flex-1">
                      <span className="text-gray-500 mr-2 flex-shrink-0">#</span>
                      <span className="truncate">{channel.name || `Channel ${channel.id}`}</span>
                    </div>
                    {channel.unread_count > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-6 text-center flex-shrink-0 ml-2">
                        {channel.unread_count > 99 ? '99+' : channel.unread_count}
                      </span>
                    )}
                  </button>
                ))
              ) : searchTerm ? (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm">No channels match your search</p>
                  <p className="text-gray-600 text-xs mt-1">Try different keywords</p>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm">No channels in this workspace</p>
                  <button
                    onClick={handleCreateChannel}
                    className="text-blue-400 hover:text-blue-300 text-xs mt-1 underline"
                  >
                    Create your first channel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Direct Messages Section */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => toggleSection('dms')}
              className="flex items-center space-x-2 text-gray-400 text-sm font-semibold uppercase tracking-wide hover:text-white transition-colors group"
            >
              <svg 
                className={`w-4 h-4 transition-transform ${sections.dms ? 'rotate-90' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span>Direct Messages</span>
            </button>
            <div className="flex items-center space-x-2">
              <span className="text-gray-500 text-xs bg-gray-700 px-2 py-1 rounded-full">
                {filteredDMs.length}
              </span>
              <button
                onClick={handleStartDM}
                className="text-gray-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                title="Start New DM"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* DMs List */}
          {sections.dms && (
            <div className="space-y-2">
              {filteredDMs.length > 0 ? (
                filteredDMs.map(dm => (
                  <button
                    key={dm.id}
                    onClick={() => onDmSelect && onDmSelect(dm)}
                    className="w-full text-left p-3 rounded-lg text-sm transition-colors text-gray-300 hover:bg-gray-700 hover:text-white flex items-center space-x-3 group"
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                        {(dm.other_user?.display_name || dm.other_user?.email || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gray-800 ${
                        dm.other_user?.is_online ? 'bg-green-500' : 'bg-gray-500'
                      }`}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <span className="truncate text-sm font-medium">
                          {dm.other_user?.display_name || dm.other_user?.email || dm.user?.display_name || dm.user?.email || 'Unknown User'}
                        </span>
                        {dm.last_message && (
                          <span className="text-gray-500 text-xs flex-shrink-0 ml-2">
                            {new Date(dm.last_message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      {dm.last_message && (
                        <p className="text-gray-400 text-xs truncate mt-1">
                          {dm.last_message.content}
                        </p>
                      )}
                      {dm.unread_count > 0 && (
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-blue-400 text-xs">New messages</span>
                          <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-5 text-center">
                            {dm.unread_count}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                ))
              ) : searchTerm ? (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm">No users match your search</p>
                  <p className="text-gray-600 text-xs mt-1">Try different keywords</p>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm">No direct messages</p>
                  <button
                    onClick={handleStartDM}
                    className="text-blue-400 hover:text-blue-300 text-xs mt-1 underline"
                  >
                    Start a conversation
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-t border-gray-700 mt-auto">
        <div className="flex items-center space-x-3">
          <div className="relative flex-shrink-0">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
              {localStorage.getItem('user_email')?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">
              {localStorage.getItem('user_email') || 'User'}
            </p>
            <p className="text-green-400 text-xs">Online</p>
          </div>
          <button
            className="text-gray-400 hover:text-white transition-colors"
            title="Settings"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="p-2 border-t border-gray-700 bg-gray-900">
        <div className="text-xs text-gray-500 text-center">
          <span className="inline-flex items-center space-x-1">
            <kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">Ctrl+1</kbd>
            <span>Channels</span>
          </span>
          <span className="mx-2">•</span>
          <span className="inline-flex items-center space-x-1">
            <kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">Ctrl+2</kbd>
            <span>DMs</span>
          </span>
        </div>
      </div>
    </div>
  );
}