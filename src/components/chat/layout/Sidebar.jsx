import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/chat/AuthContext';
import { workspaceService, channelService, dmService } from '../../../services/chat/api'; // Fixed import path

export default function Sidebar({ onClose }) {
  const { workspaceId } = useParams();
  const { user, logout } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [channels, setChannels] = useState([]);
  const [directMessages, setDirectMessages] = useState([]);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');

  useEffect(() => {
    if (workspaceId) {
      loadWorkspaceData();
    }
  }, [workspaceId]);

  const loadWorkspaceData = async () => {
    try {
      const [channelsData, dmsData] = await Promise.all([
        channelService.getChannels(workspaceId),
        dmService.getDirectMessages()
      ]);
      setChannels(channelsData);
      setDirectMessages(dmsData);
    } catch (error) {
      console.error('Failed to load workspace data:', error);
    }
  };

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    try {
      await channelService.createChannel(workspaceId, {
        name: newChannelName,
        channel_type: 'public'
      });
      setNewChannelName('');
      setShowCreateChannel(false);
      loadWorkspaceData();
    } catch (error) {
      console.error('Failed to create channel:', error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 border-r border-gray-700">
      {/* Workspace header */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-white font-semibold text-lg">Workspace</h2>
      </div>

      {/* Channels section */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-400 text-sm font-semibold uppercase">Channels</h3>
            <button
              onClick={() => setShowCreateChannel(true)}
              className="text-gray-400 hover:text-white text-lg"
            >
              +
            </button>
          </div>

          {showCreateChannel && (
            <form onSubmit={handleCreateChannel} className="mb-3">
              <input
                type="text"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                placeholder="Channel name"
                className="w-full px-2 py-1 bg-gray-800 text-white text-sm rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                autoFocus
              />
              <div className="flex space-x-2 mt-2">
                <button
                  type="submit"
                  className="px-2 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateChannel(false)}
                  className="px-2 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Channels list */}
          {channels.map(channel => (
            <Link
              key={channel.id}
              to={`/chat/${workspaceId}/channel/${channel.id}`}
              onClick={onClose}
              className="block py-1 px-2 text-gray-300 hover:bg-gray-800 rounded text-sm mb-1"
            >
              # {channel.name}
            </Link>
          ))}
        </div>

        {/* Direct Messages section */}
        <div className="p-4 border-t border-gray-700">
          <h3 className="text-gray-400 text-sm font-semibold uppercase mb-2">Direct Messages</h3>
          {directMessages.map(dm => (
            <Link
              key={dm.id}
              to={`/chat/${workspaceId}/dm/${dm.id}`}
              onClick={onClose}
              className="flex items-center py-1 px-2 text-gray-300 hover:bg-gray-800 rounded text-sm mb-1"
            >
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              {dm.other_user?.display_name || dm.other_user?.email}
            </Link>
          ))}
        </div>
      </div>

      {/* User footer */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">
              {user?.display_name || user?.email}
            </p>
            <p className="text-gray-400 text-xs">Online</p>
          </div>
          <button
            onClick={logout}
            className="text-gray-400 hover:text-white"
            title="Logout"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}