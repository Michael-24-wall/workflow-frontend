// components/chat/DirectMessageList.jsx
import React from 'react';

export default function DirectMessageList({ directMessages, onDMSelect }) {
  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
        Direct Messages
      </h3>

      {directMessages.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-lg">👤</span>
          </div>
          <p className="text-gray-500 text-sm">
            No direct messages yet
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {directMessages.map((dm) => (
            <button
              key={dm.id}
              onClick={() => onDMSelect(dm)}
              className="w-full text-left px-3 py-2 rounded-lg transition-colors text-gray-700 hover:bg-gray-100"
            >
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                  {dm.other_user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="flex-1 truncate font-medium">
                  {dm.other_user?.display_name || dm.other_user?.email || 'Unknown User'}
                </span>
                {dm.unread_count > 0 && (
                  <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {dm.unread_count}
                  </span>
                )}
              </div>
              {dm.last_message && (
                <p className="text-xs text-gray-500 truncate mt-1">
                  {dm.last_message.content}
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}