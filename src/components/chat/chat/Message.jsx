import React, { useState, useEffect, useRef } from 'react';
import useAuthStore from '../../../stores/authStore';
import { messageService } from '../../../services/chat/api';

// Image Modal Component
const ImageModal = ({ imageUrl, imageName, onClose }) => {
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div className="relative max-w-7xl max-h-full" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-gray-300 text-2xl z-10 bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center"
        >
          ✕
        </button>
        <img 
          src={imageUrl} 
          alt={imageName || 'Uploaded image'}
          className="max-w-full max-h-[90vh] object-contain"
        />
        {imageName && (
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-3 text-sm">
            {imageName}
          </div>
        )}
      </div>
    </div>
  );
};

// Smart Message Component
export default function Message({ message, showAvatar, onDelete, onEdit, onReact, onRemoveReaction, onReply, onPin }) {
  const { user } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message?.content || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showReactionDetails, setShowReactionDetails] = useState(false);
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  
  const dropdownRef = useRef(null);
  const isOwnMessage = message?.user?.id === user?.id;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowActionsDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Safe message data access
  const safeMessage = message || {};
  const safeReplyTo = safeMessage.reply_to || {};

  // Smart time formatting
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const now = new Date();
    const messageDate = new Date(timestamp);
    const diffInHours = (now - messageDate) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString([], {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  // File size formatting
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // File icon based on type
  const getFileIcon = (fileType) => {
    if (!fileType) return '📎';
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.startsWith('video/')) return '🎥';
    if (fileType.startsWith('audio/')) return '🎵';
    if (fileType.includes('pdf')) return '📕';
    if (fileType.includes('word')) return '📄';
    if (fileType.includes('excel') || fileType.includes('sheet')) return '📊';
    if (fileType.includes('zip') || fileType.includes('archive')) return '📦';
    if (fileType.includes('text')) return '📝';
    return '📎';
  };

  // Message actions
  const handleEditMessage = async () => {
    if (!editContent.trim() || editContent === safeMessage.content) {
      setIsEditing(false);
      return;
    }
    try {
      await onEdit(safeMessage.id, editContent);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to edit message:', error);
    }
  };

  const handleDeleteMessage = async () => {
    try {
      await onDelete(safeMessage.id);
      setShowDeleteConfirm(false);
      setShowActionsDropdown(false);
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const handleReaction = async (emoji) => {
    try {
      const reactionType = messageService.getReactionTypeFromEmoji(emoji);
      await onReact(safeMessage.id, reactionType);
      setShowActionsDropdown(false);
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  };

  const handleRemoveReaction = async (emoji) => {
    try {
      const reactionType = messageService.getReactionTypeFromEmoji(emoji);
      await onRemoveReaction(safeMessage.id, reactionType);
      setShowActionsDropdown(false);
    } catch (error) {
      console.error('Failed to remove reaction:', error);
    }
  };

  const handleReply = () => {
    if (onReply) {
      onReply(safeMessage.id);
      setShowActionsDropdown(false);
    }
  };

  const handlePin = () => {
    if (onPin) {
      onPin(safeMessage.id, !safeMessage.is_pinned);
      setShowActionsDropdown(false);
    }
  };

  // All reactions
  const allReactions = [
    { emoji: '👍', label: 'Like', type: 'like' },
    { emoji: '❤️', label: 'Love', type: 'love' },
    { emoji: '😂', label: 'Laugh', type: 'laugh' },
    { emoji: '😮', label: 'Wow', type: 'wow' },
    { emoji: '😢', label: 'Sad', type: 'sad' },
    { emoji: '😠', label: 'Angry', type: 'angry' },
    { emoji: '👏', label: 'Clap', type: 'clap' },
    { emoji: '🎉', label: 'Celebrate', type: 'celebrate' },
    { emoji: '🔥', label: 'Fire', type: 'fire' },
    { emoji: '⭐', label: 'Star', type: 'star' }
  ];

  // Group reactions smartly and get user details
  const groupedReactions = safeMessage.reactions?.reduce((acc, reaction) => {
    const emoji = messageService.getReactionEmoji(reaction.reaction_type) || reaction.reaction_type;
    if (!acc[emoji]) {
      acc[emoji] = {
        reactions: [],
        count: 0,
        hasReacted: false,
        users: []
      };
    }
    acc[emoji].reactions.push(reaction);
    acc[emoji].count = acc[emoji].reactions.length;
    acc[emoji].hasReacted = acc[emoji].hasReacted || reaction.user?.id === user?.id;
    
    // Store user info for reaction details
    if (reaction.user) {
      acc[emoji].users.push({
        id: reaction.user.id,
        name: reaction.user.display_name || `${reaction.user.first_name || ''} ${reaction.user.last_name || ''}`.trim() || reaction.user.email || 'Unknown User',
        avatar: reaction.user.profile_picture || reaction.user.avatar
      });
    }
    
    return acc;
  }, {}) || {};

  // Check if message has reactions
  const hasReactions = Object.keys(groupedReactions).length > 0;

  // User info helpers
  const getUserAvatar = (messageUser) => {
    return messageUser?.profile_picture || messageUser?.avatar || null;
  };

  const getUserInitial = (messageUser) => {
    return messageUser?.display_name?.charAt(0) || 
           messageUser?.first_name?.charAt(0) || 
           messageUser?.email?.charAt(0).toUpperCase() || 
           'U';
  };

  const getUserName = (messageUser) => {
    return messageUser?.display_name || 
           `${messageUser?.first_name || ''} ${messageUser?.last_name || ''}`.trim() || 
           messageUser?.email ||
           'Unknown User';
  };

  // Check if message has content
  const hasContent = safeMessage.content && safeMessage.content.trim().length > 0;
  const hasFile = safeMessage.file_url && safeMessage.file_type;

  // If message is undefined, return null
  if (!message) {
    return null;
  }

  return (
    <>
      <div 
        className={`flex group transition-all duration-200 ${
          isOwnMessage ? 'flex-row-reverse' : ''
        } ${
          safeMessage.is_pinned 
            ? 'bg-yellow-900 bg-opacity-30 border-l-4 border-yellow-500 rounded-lg p-3 mb-2 shadow-lg' 
            : 'rounded-lg p-3'
        }`}
      >
        {/* Pinned Badge - Only show for pinned messages */}
        {safeMessage.is_pinned && (
          <div className={`absolute top-2 ${isOwnMessage ? 'left-2' : 'right-2'} flex items-center space-x-1 bg-yellow-500 bg-opacity-90 px-2 py-1 rounded-full z-10`}>
            <span className="text-white text-xs">📌 Pinned</span>
          </div>
        )}
        
        {/* Avatar */}
        {showAvatar && (
          <div className={`flex-shrink-0 ${isOwnMessage ? 'ml-3' : 'mr-3'}`}>
            {getUserAvatar(safeMessage.user) ? (
              <img 
                src={getUserAvatar(safeMessage.user)} 
                alt={getUserName(safeMessage.user)}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                isOwnMessage ? 'bg-green-600' : 'bg-blue-600'
              }`}>
                {getUserInitial(safeMessage.user)}
              </div>
            )}
          </div>
        )}
        
        {/* Message Content Area */}
        <div className={`flex-1 max-w-2xl ${isOwnMessage ? 'flex flex-col items-end' : ''}`}>
          {/* Message Header - Name, Time, Status */}
          {showAvatar && (
            <div className={`flex items-center space-x-2 mb-1 ${isOwnMessage ? 'justify-end' : ''}`}>
              {!isOwnMessage && (
                <span className="text-white font-medium text-sm">
                  {getUserName(safeMessage.user)}
                </span>
              )}
              <span className="text-slate-400 text-xs">
                {formatTime(safeMessage.timestamp || safeMessage.created_at)}
              </span>
              {safeMessage.is_edited && (
                <span className="text-slate-500 text-xs" title="Edited">
                  (edited)
                </span>
              )}
            </div>
          )}
          
          {/* Message Bubble */}
          <div className={`inline-block rounded-2xl max-w-full transition-all ${
            isOwnMessage 
              ? 'bg-blue-600 text-white rounded-br-md' 
              : 'bg-slate-700 text-white rounded-bl-md'
          } ${hasFile ? 'p-3' : 'px-4 py-2'} ${
            safeMessage.is_pinned ? 'border-2 border-yellow-400 border-opacity-50' : ''
          } relative`}>
            
            {/* Actions Dropdown Button - Always visible */}
            <button
              onClick={() => setShowActionsDropdown(!showActionsDropdown)}
              className={`absolute top-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
                isOwnMessage ? 'left-2' : 'right-2'
              } w-6 h-6 flex items-center justify-center bg-slate-800 bg-opacity-80 hover:bg-slate-700 rounded text-slate-300 hover:text-white text-sm`}
            >
              ⋮
            </button>
            
            {/* Reply Context - Only show if reply_to exists and has content */}
            {safeReplyTo && (safeReplyTo.content || safeReplyTo.user) && (
              <div className={`mb-2 p-2 bg-black bg-opacity-20 rounded-lg border-l-3 ${
                isOwnMessage ? 'border-blue-400' : 'border-slate-400'
              }`}>
                <div className="text-slate-300 text-xs mb-1 font-medium">
                  Replying to {safeReplyTo.user?.display_name || 'user'}
                </div>
                <div className="text-slate-400 text-xs truncate">
                  {safeReplyTo.content || 'Message'}
                </div>
              </div>
            )}

            {/* Text Content */}
            {hasContent && !isEditing && (
              <div className="whitespace-pre-wrap break-words text-left text-sm leading-relaxed">
                {safeMessage.content}
              </div>
            )}

            {/* Edit Mode */}
            {isEditing && (
              <div className="mb-2 text-left">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full bg-slate-800 text-white rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 border border-slate-600"
                  rows="3"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                      handleEditMessage();
                    } else if (e.key === 'Escape') {
                      setIsEditing(false);
                      setEditContent(safeMessage.content || '');
                    }
                  }}
                />
                <div className="flex space-x-2 mt-2 justify-end">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditContent(safeMessage.content || '');
                    }}
                    className="px-3 py-1 bg-slate-600 hover:bg-slate-500 text-white rounded-lg text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEditMessage}
                    disabled={!editContent.trim() || editContent === safeMessage.content}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-500 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}

            {/* Image Display */}
            {hasFile && safeMessage.file_type?.startsWith('image/') && (
              <div className="text-left">
                <div className="bg-slate-600 rounded-xl overflow-hidden border border-slate-500">
                  <img 
                    src={safeMessage.file_url} 
                    alt={safeMessage.file_name || 'Uploaded image'}
                    className="w-full max-h-80 object-cover cursor-pointer transition-transform hover:scale-105"
                    onClick={() => setSelectedImage({
                      url: safeMessage.file_url,
                      name: safeMessage.file_name
                    })}
                  />
                  <div className="p-3 bg-slate-700 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-medium truncate">
                        {safeMessage.file_name || 'Image'}
                      </div>
                      {safeMessage.file_size && (
                        <div className="text-slate-300 text-xs">
                          {formatFileSize(safeMessage.file_size)}
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2 ml-3">
                      <a 
                        href={safeMessage.file_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-white transition-colors p-1"
                        title="Open in new tab"
                      >
                        ↗
                      </a>
                      <a 
                        href={safeMessage.file_url} 
                        download={safeMessage.file_name}
                        className="text-slate-400 hover:text-white transition-colors p-1"
                        title="Download"
                      >
                        ⬇
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* File Display */}
            {hasFile && !safeMessage.file_type?.startsWith('image/') && (
              <div className="text-left">
                <div className="flex items-center space-x-3 p-3 bg-slate-600 rounded-xl border border-slate-500">
                  <div className="flex-shrink-0 w-12 h-12 bg-slate-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xl">
                      {getFileIcon(safeMessage.file_type)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium text-sm truncate">
                      {safeMessage.file_name || 'File'}
                    </div>
                    {safeMessage.file_size && (
                      <div className="text-slate-300 text-xs">
                        {formatFileSize(safeMessage.file_size)}
                      </div>
                    )}
                  </div>
                  <a 
                    href={safeMessage.file_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-shrink-0 px-3 py-2 bg-slate-500 hover:bg-slate-400 text-white rounded-lg text-sm transition-colors flex items-center space-x-1"
                    download={safeMessage.file_name}
                  >
                    <span>Download</span>
                  </a>
                </div>
              </div>
            )}

            {/* Sticky Reactions - Always visible when reactions exist */}
            {hasReactions && (
              <div className={`flex items-center space-x-1 mt-3 ${isOwnMessage ? 'justify-end' : ''}`}>
                <div 
                  className="bg-slate-800 bg-opacity-80 rounded-full px-2 py-1 flex items-center space-x-1 flex-wrap gap-1 cursor-pointer hover:bg-slate-700 transition-colors"
                  onClick={() => setShowReactionDetails(!showReactionDetails)}
                  title="Click to see who reacted"
                >
                  {Object.entries(groupedReactions).map(([emoji, data]) => (
                    <div
                      key={emoji}
                      className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs transition-all ${
                        data.hasReacted 
                          ? 'bg-blue-500 bg-opacity-50 border border-blue-400 transform scale-105' 
                          : 'bg-slate-700'
                      }`}
                    >
                      <span>{emoji}</span>
                      <span className="text-slate-300 font-medium">{data.count > 1 ? data.count : ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reaction Details Popup */}
            {showReactionDetails && hasReactions && (
              <div className={`bg-slate-800 border border-slate-600 rounded-xl p-4 mt-2 shadow-xl ${
                isOwnMessage ? 'text-right' : 'text-left'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-white font-medium text-sm">Reactions</h4>
                  <button
                    onClick={() => setShowReactionDetails(false)}
                    className="text-slate-400 hover:text-white text-lg"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {Object.entries(groupedReactions).map(([emoji, data]) => (
                    <div key={emoji} className="border-b border-slate-700 pb-2 last:border-b-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-lg">{emoji}</span>
                        <span className="text-white font-medium text-sm">
                          {data.count} {data.count === 1 ? 'reaction' : 'reactions'}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {data.users.map((user) => (
                          <div key={user.id} className="flex items-center space-x-2">
                            {user.avatar ? (
                              <img 
                                src={user.avatar} 
                                alt={user.name}
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-6 h-6 bg-slate-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                                {user.name.charAt(0)}
                              </div>
                            )}
                            <span className="text-slate-300 text-sm">{user.name}</span>
                            {user.id === user?.id && (
                              <span className="text-blue-400 text-xs">(You)</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions Dropdown Menu */}
          {showActionsDropdown && (
            <div 
              ref={dropdownRef}
              className={`absolute mt-2 w-64 bg-slate-800 border border-slate-600 rounded-xl shadow-xl z-50 ${
                isOwnMessage ? 'right-0' : 'left-0'
              }`}
            >
              {/* Reactions Section */}
              <div className="p-3 border-b border-slate-700">
                <h4 className="text-white font-medium text-sm mb-2">Add Reaction</h4>
                <div className="grid grid-cols-6 gap-1">
                  {allReactions.map(({ emoji, label }) => {
                    const hasReacted = groupedReactions[emoji]?.hasReacted;
                    return (
                      <button
                        key={emoji}
                        onClick={() => hasReacted ? handleRemoveReaction(emoji) : handleReaction(emoji)}
                        className={`w-8 h-8 flex items-center justify-center rounded-full transition-all text-lg ${
                          hasReacted 
                            ? 'bg-blue-500 bg-opacity-50 border-2 border-blue-400 transform scale-110' 
                            : 'hover:bg-slate-700 hover:scale-110'
                        }`}
                        title={`${hasReacted ? 'Remove' : 'Add'} ${label}`}
                      >
                        {emoji}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Message Actions Section */}
              <div className="p-2">
                {onReply && (
                  <button
                    onClick={handleReply}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg transition-colors text-sm"
                  >
                    <span>↪️</span>
                    <span>Reply</span>
                  </button>
                )}

                {onPin && (
                  <button
                    onClick={handlePin}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg transition-colors text-sm"
                  >
                    <span>{safeMessage.is_pinned ? '📌' : '📍'}</span>
                    <span>{safeMessage.is_pinned ? 'Unpin Message' : 'Pin Message'}</span>
                  </button>
                )}

                {isOwnMessage && (
                  <>
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setShowActionsDropdown(false);
                      }}
                      className="w-full flex items-center space-x-3 px-3 py-2 text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg transition-colors text-sm"
                    >
                      <span>✏️</span>
                      <span>Edit Message</span>
                    </button>

                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full flex items-center space-x-3 px-3 py-2 text-red-400 hover:bg-red-500 hover:bg-opacity-20 hover:text-red-300 rounded-lg transition-colors text-sm"
                    >
                      <span>🗑️</span>
                      <span>Delete Message</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Delete Confirmation */}
          {showDeleteConfirm && (
            <div className={`bg-slate-700 p-4 rounded-xl shadow-xl mt-2 border border-slate-600 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
              <div className="text-white text-sm mb-3 font-medium">
                Delete this message?
              </div>
              <div className="flex space-x-2 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1 bg-slate-600 hover:bg-slate-500 text-white rounded-lg text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteMessage}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <ImageModal 
          imageUrl={selectedImage.url}
          imageName={selectedImage.name}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </>
  );
}