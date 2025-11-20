// components/chat/ChannelHeader.jsx
import React, { useState } from 'react';
import ChannelInviteModal from './ChannelInviteModal';
import ChannelSettingsModal from './ChannelSettingsModal';
import ChannelMembersModal from './ChannelMembersModal'; // New import

export default function ChannelHeader({ channel, onChannelUpdate, userRole }) {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false); // New state

  // Check if user has permission to invite (admin, moderator, or owner)
  const canInvite = userRole && ['owner', 'admin', 'moderator'].includes(userRole);
  const canManageSettings = userRole && ['owner', 'admin'].includes(userRole);
  const canManageMembers = userRole && ['owner', 'admin', 'moderator'].includes(userRole);

  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
      {/* Channel Info */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">#</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">#{channel.name}</h1>
            {channel.topic && (
              <p className="text-gray-400 text-sm mt-1">{channel.topic}</p>
            )}
            {channel.purpose && !channel.topic && (
              <p className="text-gray-400 text-sm mt-1">{channel.purpose}</p>
            )}
          </div>
        </div>
        
        {/* Channel Stats */}
        <div className="flex items-center space-x-4 text-sm text-gray-400">
          {channel.member_count > 0 && (
            <span>{channel.member_count} members</span>
          )}
          {channel.last_activity && (
            <span>Last activity: {new Date(channel.last_activity).toLocaleDateString()}</span>
          )}
          {userRole && (
            <span className="px-2 py-1 bg-gray-700 rounded-md text-xs capitalize">
              {userRole}
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-3">
        {/* Invite Button - Only show if user has permission */}
        {canInvite && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
            title="Invite people to this channel"
          >
            <div className="flex items-center space-x-2">
              <span>+</span>
              <span>Invite</span>
            </div>
          </button>
        )}

        {/* Settings Button - Only show for admins/owners */}
        {canManageSettings && (
          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            title="Channel settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        )}

        {/* Members Button */}
        <button
          onClick={() => setShowMembersModal(true)}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          title="View channel members"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        </button>

        {/* Burn User Button - Only show for admins/moderators/owners */}
        {canManageMembers && (
          <button
            onClick={() => setShowMembersModal(true)}
            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors border border-red-400/30"
            title="Manage channel members (remove users)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {/* Modals */}
      <ChannelInviteModal
        channel={channel}
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onInviteSent={() => {
          setShowInviteModal(false);
          // Refresh channel data if needed
          if (onChannelUpdate) onChannelUpdate();
        }}
      />

      <ChannelSettingsModal
        channel={channel}
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onChannelUpdate={onChannelUpdate}
      />

      {/* Members Modal with Burn User Functionality */}
      <ChannelMembersModal
        channel={channel}
        isOpen={showMembersModal}
        onClose={() => setShowMembersModal(false)}
        userRole={userRole}
        onMembersUpdate={() => {
          if (onChannelUpdate) onChannelUpdate();
        }}
      />
    </div>
  );
}