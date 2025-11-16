import React, { useState } from 'react';
import useAuthStore from '../../../stores/authStore'; // Import Zustand store

export default function Message({ message, showAvatar, onReply, onReact, onPin }) {
  // Use Zustand store instead of useAuth
  const { user } = useAuthStore();
  
  const [showReactions, setShowReactions] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  
  const isOwnMessage = message.user?.id === user?.id;

  const formatTime = (timestamp) => {
    return new Date(timestamp || message.created_at).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleReaction = async (reactionType) => {
    try {
      if (onReact) {
        await onReact(message.id, reactionType);
      }
      setShowReactions(false);
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  };

  const handleReply = async () => {
    if (replyContent.trim() && onReply) {
      try {
        await onReply(message.id, replyContent);
        setReplyContent('');
        setIsReplying(false);
      } catch (error) {
        console.error('Failed to send reply:', error);
      }
    }
  };

  const handlePinMessage = async () => {
    if (onPin) {
      try {
        await onPin(message.id);
      } catch (error) {
        console.error('Failed to pin message:', error);
      }
    }
  };

  return (
    <div 
      className={`flex group hover:bg-gray-800 rounded-lg p-2 ${isOwnMessage ? 'justify-end' : ''} ${
        message.is_pinned ? 'bg-yellow-900 bg-opacity-20 border-l-4 border-yellow-500' : ''
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowReactions(false);
      }}
    >
      {showAvatar && !isOwnMessage && (
        <div className="flex-shrink-0 mr-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
            {message.user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
        </div>
      )}
      
      <div className={`flex-1 ${isOwnMessage ? 'text-right' : ''}`}>
        {(showAvatar || isOwnMessage) && (
          <div className={`flex items-center space-x-2 mb-1 ${isOwnMessage ? 'justify-end' : ''}`}>
            {!isOwnMessage && (
              <span className="text-white font-medium text-sm">
                {message.user?.display_name || message.user?.email}
              </span>
            )}
            <span className="text-gray-400 text-xs">
              {formatTime(message.timestamp)}
            </span>
            {message.is_pinned && (
              <span className="text-yellow-500 text-xs" title="Pinned message">
                📌
              </span>
            )}
          </div>
        )}
        
        <div className={`inline-block px-3 py-2 rounded-lg max-w-xs lg:max-w-md ${
          isOwnMessage 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-700 text-white'
        }`}>
          {message.content}
          
          {message.file_url && (
            <div className="mt-2">
              <a 
                href={message.file_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-300 hover:text-blue-200 underline text-sm flex items-center space-x-1"
              >
                <span>📎</span>
                <span>{message.file_name}</span>
                {message.file_size && (
                  <span className="text-gray-400 text-xs">
                    ({Math.round(message.file_size / 1024)} KB)
                  </span>
                )}
              </a>
            </div>
          )}
        </div>

        {/* Message actions */}
        {showActions && (
          <div className={`flex space-x-1 mt-1 ${isOwnMessage ? 'justify-end' : ''}`}>
            <button
              onClick={() => setShowReactions(!showReactions)}
              className="text-gray-400 hover:text-white text-xs px-2 py-1 hover:bg-gray-700 rounded"
              title="Add reaction"
            >
              😄
            </button>
            <button
              onClick={() => setIsReplying(true)}
              className="text-gray-400 hover:text-white text-xs px-2 py-1 hover:bg-gray-700 rounded"
              title="Reply"
            >
              ↪️
            </button>
            <button
              onClick={handlePinMessage}
              className="text-gray-400 hover:text-white text-xs px-2 py-1 hover:bg-gray-700 rounded"
              title={message.is_pinned ? 'Unpin message' : 'Pin message'}
            >
              {message.is_pinned ? '📌' : '📍'}
            </button>
          </div>
        )}

        {/* Reply input */}
        {isReplying && (
          <div className="mt-2 bg-gray-700 rounded-lg p-2">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a reply..."
              className="w-full bg-gray-600 text-white rounded p-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows="2"
              autoFocus
            />
            <div className="flex space-x-2 mt-1 justify-end">
              <button
                onClick={() => setIsReplying(false)}
                className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleReply}
                disabled={!replyContent.trim()}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded text-sm"
              >
                Reply
              </button>
            </div>
          </div>
        )}

        {/* Reaction picker */}
        {showReactions && (
          <div className="bg-gray-700 p-2 rounded-lg shadow-lg mt-2 inline-block">
            <div className="flex space-x-1">
              {['👍', '❤️', '😂', '😮', '😢', '😠'].map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className="hover:bg-gray-600 p-1 rounded text-lg transition-transform hover:scale-110"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {showAvatar && isOwnMessage && (
        <div className="flex-shrink-0 ml-3">
          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
        </div>
      )}
    </div>
  );
}