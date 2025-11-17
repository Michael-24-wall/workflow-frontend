// components/chat/ChannelList.jsx
import React from 'react';

export default function ChannelList({ channels, onChannelSelect, onCreateChannel }) {
  // Safe channel data handling
  const safeChannels = Array.isArray(channels) ? channels : [];
  
  console.log('📋 ChannelList rendering with channels:', safeChannels);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Channels
        </h3>
        <button
          onClick={onCreateChannel}
          className="text-gray-400 hover:text-gray-600 text-lg font-bold"
          title="Create Channel"
        >
          +
        </button>
      </div>

      {safeChannels.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-lg">📢</span>
          </div>
          <p className="text-gray-500 text-sm mb-4">No channels yet</p>
          <button
            onClick={onCreateChannel}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
          >
            Create Channel
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {safeChannels.map((channel) => {
            // Safe data extraction with proper workspace handling
            const channelId = channel?.id || channel?.pk || 'unknown';
            const channelName = channel?.name || 'Unnamed Channel';
            const channelType = channel?.channel_type || 'public';
            const topic = channel?.topic || '';
            const purpose = channel?.purpose || '';
            
            // FIX: Properly handle workspace object
            const workspace = channel?.workspace;
            const workspaceName = typeof workspace === 'object' 
              ? workspace?.name || workspace?.subdomain || 'Unknown Workspace'
              : String(workspace || 'Unknown Workspace');

            return (
              <button
                key={channelId}
                onClick={() => onChannelSelect(channel)}
                className="w-full text-left p-3 rounded-lg transition-colors text-gray-700 hover:bg-gray-100 border border-gray-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-sm">#</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-semibold text-gray-900 truncate">
                        {channelName}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        channelType === 'private' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {channelType}
                      </span>
                    </div>
                    
                    {topic && (
                      <p className="text-sm text-gray-600 mb-1">
                        {topic}
                      </p>
                    )}
                    
                    {purpose && (
                      <p className="text-xs text-gray-500 truncate">
                        {purpose}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between mt-2">
                      {/* FIX: Render workspace name instead of workspace object */}
                      <span className="text-xs text-gray-400">
                        Workspace: {workspaceName}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}