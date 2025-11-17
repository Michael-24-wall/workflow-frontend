import React, { useState, useEffect } from 'react';
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

export default function Message({ message, showAvatar, onDelete, onEdit, onReact, onRemoveReaction, onReply, onPin }) {
  const { user } = useAuthStore();
  const [showActions, setShowActions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const isOwnMessage = message.user?.id === user?.id;

  // Debug: Log message data to see what's available
  useEffect(() => {
    if (message.file_url) {
      console.log('📁 Message file data:', {
        file_url: message.file_url,
        file_type: message.file_type,
        file_name: message.file_name,
        file_size: message.file_size,
        has_files: !!message.files,
        files_count: message.files?.length
      });
    }
  }, [message]);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // File size formatting helper function
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // File icon helper function
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

  const handleEditMessage = async () => {
    if (!editContent.trim() || editContent === message.content) {
      setIsEditing(false);
      return;
    }

    try {
      await onEdit(message.id, editContent);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to edit message:', error);
    }
  };

  const handleDeleteMessage = async () => {
    try {
      await onDelete(message.id);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const handleReaction = async (emoji) => {
    try {
      const reactionType = messageService.getReactionTypeFromEmoji(emoji);
      console.log('🎯 Adding reaction:', { messageId: message.id, emoji, reactionType });
      await onReact(message.id, reactionType);
      setShowReactions(false);
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  };

  const handleRemoveReaction = async (emoji) => {
    try {
      const reactionType = messageService.getReactionTypeFromEmoji(emoji);
      console.log('🗑️ Removing reaction:', { messageId: message.id, emoji, reactionType });
      await onRemoveReaction(message.id, reactionType);
      setShowReactions(false);
    } catch (error) {
      console.error('Failed to remove reaction:', error);
    }
  };

  // Quick reactions for the toolbar
  const quickReactions = ['👍', '❤️', '😂', '😮', '😢'];
  
  // All available reactions - matching Django backend valid reactions
  const allReactions = [
    { emoji: '👍', label: 'Like', type: 'like' },
    { emoji: '❤️', label: 'Love', type: 'love' },
    { emoji: '😂', label: 'Laugh', type: 'laugh' },
    { emoji: '😮', label: 'Wow', type: 'wow' },
    { emoji: '😢', label: 'Sad', type: 'sad' },
    { emoji: '😠', label: 'Angry', type: 'angry' }
  ];

  // Group reactions by type and check if current user has reacted
  const groupedReactions = message.reactions?.reduce((acc, reaction) => {
    const emoji = messageService.getReactionEmoji(reaction.reaction_type) || reaction.reaction_type;
    if (!acc[emoji]) {
      acc[emoji] = {
        reactions: [],
        count: 0,
        hasReacted: false
      };
    }
    acc[emoji].reactions.push(reaction);
    acc[emoji].count = acc[emoji].reactions.length;
    acc[emoji].hasReacted = acc[emoji].hasReacted || reaction.user?.id === user?.id;
    return acc;
  }, {}) || {};

  const getUserAvatar = (messageUser) => {
    if (messageUser?.profile_picture) return messageUser.profile_picture;
    if (messageUser?.avatar) return messageUser.avatar;
    return null;
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

  return (
    <>
      <div 
        className={`flex group hover:bg-slate-800 rounded-lg p-3 transition-colors ${
          isOwnMessage ? 'flex-row-reverse' : ''
        } ${message.is_pinned ? 'bg-yellow-900 bg-opacity-20 border-l-4 border-yellow-500' : ''}`}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => {
          setShowActions(false);
          setShowReactions(false);
        }}
      >
        {/* Avatar for other users */}
        {showAvatar && !isOwnMessage && (
          <div className="flex-shrink-0 mr-3">
            {getUserAvatar(message.user) ? (
              <img 
                src={getUserAvatar(message.user)} 
                alt={getUserName(message.user)}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {getUserInitial(message.user)}
              </div>
            )}
          </div>
        )}
        
        {/* Message content area */}
        <div className={`flex-1 max-w-2xl ${isOwnMessage ? 'flex flex-col items-end' : ''}`}>
          {showAvatar && (
            <div className={`flex items-center space-x-2 mb-1 ${isOwnMessage ? 'justify-end' : ''}`}>
              {!isOwnMessage && (
                <span className="text-white font-medium text-sm">
                  {getUserName(message.user)}
                </span>
              )}
              <span className="text-slate-400 text-xs">
                {formatTime(message.timestamp || message.created_at)}
              </span>
              {message.is_pinned && (
                <span className="text-yellow-500 text-xs" title="Pinned message">
                  📌
                </span>
              )}
              {message.is_edited && (
                <span className="text-slate-500 text-xs" title="Edited">
                  (edited)
                </span>
              )}
            </div>
          )}
          
          {/* Message bubble */}
          <div className={`inline-block px-4 py-2 rounded-xl max-w-full ${
            isOwnMessage 
              ? 'bg-blue-600 text-white' 
              : 'bg-slate-700 text-white'
          }`}>
            
            {message.reply_to && (
              <div className={`mb-2 p-2 bg-slate-600 rounded text-sm border-l-4 border-blue-500 ${
                isOwnMessage ? 'text-left' : ''
              }`}>
                <div className="text-slate-300 text-xs mb-1">
                  Replying to {message.reply_to.user?.display_name || 'user'}
                </div>
                <div className="text-slate-400 text-xs truncate">
                  {message.reply_to.content || 'Message'}
                </div>
              </div>
            )}

            {message.content && !isEditing && (
              <div className="whitespace-pre-wrap break-words text-left">
                {message.content}
              </div>
            )}

            {isEditing && (
              <div className="mb-2 text-left">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full bg-slate-800 text-white rounded p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                      handleEditMessage();
                    } else if (e.key === 'Escape') {
                      setIsEditing(false);
                      setEditContent(message.content || '');
                    }
                  }}
                />
                <div className="flex space-x-2 mt-2 justify-end">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditContent(message.content || '');
                    }}
                    className="px-3 py-1 bg-slate-600 hover:bg-slate-500 text-white rounded text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEditMessage}
                    disabled={!editContent.trim() || editContent === message.content}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-500 disabled:cursor-not-allowed text-white rounded text-sm transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}

            {/* SIMPLIFIED File Display Section - Let's debug what's happening */}
            {message.file_url && (
              <div className="mt-2 text-left">
                <div className="bg-yellow-900 bg-opacity-20 p-2 rounded mb-2">
                  <div className="text-yellow-400 text-xs">
                    Debug: File URL exists - {message.file_url}
                  </div>
                  <div className="text-yellow-300 text-xs">
                    File type: {message.file_type || 'Unknown'}
                  </div>
                </div>

                {message.file_type?.startsWith('image/') ? (
                  // Simple image display
                  <div className="bg-slate-600 rounded-lg overflow-hidden">
                    <img 
                      src={message.file_url} 
                      alt={message.file_name || 'Uploaded image'}
                      className="max-w-full max-h-96 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setSelectedImage({
                        url: message.file_url,
                        name: message.file_name
                      })}
                      onError={(e) => {
                        console.error('❌ Image failed to load:', message.file_url);
                        e.target.style.display = 'none';
                      }}
                      onLoad={() => console.log('✅ Image loaded successfully:', message.file_url)}
                    />
                    <div className="p-3 bg-slate-700 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-medium truncate">
                          {message.file_name || 'Image'}
                        </div>
                        {message.file_size && (
                          <div className="text-slate-300 text-xs">
                            {formatFileSize(message.file_size)}
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2 ml-3">
                        <a 
                          href={message.file_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-slate-400 hover:text-white transition-colors p-1"
                          title="Open in new tab"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                        <a 
                          href={message.file_url} 
                          download={message.file_name}
                          className="text-slate-400 hover:text-white transition-colors p-1"
                          title="Download"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Non-image files
                  <div className="flex items-center space-x-3 p-3 bg-slate-600 rounded-lg">
                    <div className="flex-shrink-0 w-12 h-12 bg-slate-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-lg">
                        {getFileIcon(message.file_type)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <a 
                        href={message.file_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-white font-medium text-sm hover:underline block truncate"
                      >
                        {message.file_name || 'File'}
                      </a>
                      {message.file_size && (
                        <div className="text-slate-300 text-xs">
                          {formatFileSize(message.file_size)}
                        </div>
                      )}
                      {message.content && message.content !== `File: ${message.file_name}` && (
                        <div className="text-slate-400 text-sm mt-1">
                          {message.content}
                        </div>
                      )}
                    </div>
                    <a 
                      href={message.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-shrink-0 px-3 py-1 bg-slate-500 hover:bg-slate-400 text-white rounded text-sm transition-colors"
                      download={message.file_name}
                    >
                      Download
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Check if there are any files at all */}
            {!message.file_url && message.files?.length > 0 && (
              <div className="mt-2 text-left bg-red-900 bg-opacity-20 p-2 rounded">
                <div className="text-red-400 text-xs">
                  Debug: No file_url but files array exists with {message.files.length} files
                </div>
              </div>
            )}

            {Object.keys(groupedReactions).length > 0 && (
              <div className={`flex items-center space-x-1 mt-2 ${isOwnMessage ? 'justify-end' : ''}`}>
                <div className="bg-slate-800 bg-opacity-80 rounded-full px-2 py-1 flex items-center space-x-1 flex-wrap gap-1">
                  {Object.entries(groupedReactions).map(([emoji, data]) => (
                    <button
                      key={emoji}
                      onClick={() => data.hasReacted ? handleRemoveReaction(emoji) : handleReaction(emoji)}
                      className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs transition-colors ${
                        data.hasReacted 
                          ? 'bg-blue-500 bg-opacity-50 border border-blue-400' 
                          : 'bg-slate-700 hover:bg-slate-600'
                      }`}
                      title={`${data.count} reaction(s) - Click to ${data.hasReacted ? 'remove' : 'add'}`}
                    >
                      <span>{emoji}</span>
                      <span className="text-slate-300">{data.count > 1 ? data.count : ''}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions toolbar */}
          {showActions && (
            <div className={`flex space-x-1 mt-2 ${isOwnMessage ? 'justify-end' : ''}`}>
              <div className="flex space-x-1 bg-slate-700 rounded-lg p-1">
                {quickReactions.map(emoji => {
                  const hasReacted = groupedReactions[emoji]?.hasReacted;
                  return (
                    <button
                      key={emoji}
                      onClick={() => hasReacted ? handleRemoveReaction(emoji) : handleReaction(emoji)}
                      className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors text-lg ${
                        hasReacted 
                          ? 'bg-blue-500 bg-opacity-50 border border-blue-400' 
                          : 'hover:bg-slate-600'
                      }`}
                      title={`${hasReacted ? 'Remove' : 'Add'} ${emoji} reaction`}
                    >
                      {emoji}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setShowReactions(!showReactions)}
                className="text-slate-400 hover:text-white text-sm px-2 py-1 hover:bg-slate-700 rounded transition-colors"
                title="More reactions"
              >
                ⋮
              </button>

              {onReply && (
                <button
                  onClick={() => {
                    console.log('🔍 Reply clicked - passing message ID:', message.id);
                    onReply(message.id);
                  }}
                  className="text-slate-400 hover:text-green-400 text-sm px-2 py-1 hover:bg-slate-700 rounded transition-colors"
                  title="Reply to message"
                >
                  ↪️
                </button>
              )}

              {isOwnMessage && (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-slate-400 hover:text-yellow-400 text-sm px-2 py-1 hover:bg-slate-700 rounded transition-colors"
                    title="Edit message"
                  >
                    ✏️
                  </button>

                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-slate-400 hover:text-red-400 text-sm px-2 py-1 hover:bg-slate-700 rounded transition-colors"
                    title="Delete message"
                  >
                    🗑️
                  </button>
                </>
              )}

              {onPin && (
                <button
                  onClick={() => onPin(message.id, !message.is_pinned)}
                  className="text-slate-400 hover:text-white text-sm px-2 py-1 hover:bg-slate-700 rounded transition-colors"
                  title={message.is_pinned ? 'Unpin message' : 'Pin message'}
                >
                  {message.is_pinned ? '📌' : '📍'}
                </button>
              )}
            </div>
          )}

          {/* Delete confirmation */}
          {showDeleteConfirm && (
            <div className={`bg-slate-700 p-4 rounded-lg shadow-xl mt-2 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
              <div className="text-white text-sm mb-3">
                Delete this message?
              </div>
              <div className="flex space-x-2 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1 bg-slate-600 hover:bg-slate-500 text-white rounded text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteMessage}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          )}

          {/* Reactions popup */}
          {showReactions && (
            <div className={`bg-slate-700 p-3 rounded-lg shadow-xl mt-2 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
              <div className="grid grid-cols-4 gap-2">
                {allReactions.map(({ emoji, label }) => {
                  const hasReacted = groupedReactions[emoji]?.hasReacted;
                  return (
                    <button
                      key={emoji}
                      onClick={() => hasReacted ? handleRemoveReaction(emoji) : handleReaction(emoji)}
                      className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors text-xl ${
                        hasReacted 
                          ? 'bg-blue-500 bg-opacity-50 border-2 border-blue-400' 
                          : 'hover:bg-slate-600'
                      }`}
                      title={`${hasReacted ? 'Remove' : 'Add'} ${label}`}
                    >
                      {emoji}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Avatar for own messages */}
        {showAvatar && isOwnMessage && (
          <div className="flex-shrink-0 ml-3">
            {user?.profile_picture ? (
              <img 
                src={user.profile_picture} 
                alt={user.display_name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {user?.display_name?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
          </div>
        )}
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