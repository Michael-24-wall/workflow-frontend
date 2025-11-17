import React, { useState } from 'react';
import useAuthStore from '../../../stores/authStore';
import { messageService } from '../../../services/chat/api';

export default function Message({ message, showAvatar, onReply, onPin, onReactionUpdate, onStartDirectMessage, onDelete, onEdit }) {
  const { user } = useAuthStore();
  
  const [showReactions, setShowReactions] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [quickReaction, setQuickReaction] = useState(null);
  const [reacting, setReacting] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content || '');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const isOwnMessage = message.user?.id === user?.id;
  const isDirectMessage = onStartDirectMessage && !isOwnMessage;

  // Convert message.id to string for safe checking
  const messageIdStr = String(message.id || '');

  // 🆕 IMPROVED: Better message type detection
  const isTemporaryMessage = message.is_temp || 
                            messageIdStr.includes('temp-') || 
                            messageIdStr.includes('text-') ||
                            messageIdStr.includes('file-') ||
                            messageIdStr.includes('reply-') ||
                            !message.id;

  const isRealMessage = !isTemporaryMessage && 
                       !isNaN(message.id) && 
                       Number.isInteger(Number(message.id)) && 
                       message.id > 0;

  // 🆕 ADDED: Debug helper for message types
  const debugMessageInfo = () => {
    return {
      id: message.id,
      idType: typeof message.id,
      isTemporary: isTemporaryMessage,
      isReal: isRealMessage,
      contentPreview: message.content ? message.content.substring(0, 50) + '...' : 'No content',
      hasFile: !!message.file_url
    };
  };

  // Check if message has an image file
  const hasImage = message.file_url && isImageFile(message.file_name);
  
  // Check if message has a regular file (not image)
  const hasFile = message.file_url && !isImageFile(message.file_name);

  // Function to check if file is an image
  function isImageFile(filename) {
    if (!filename) return false;
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
    return imageExtensions.some(ext => 
      filename.toLowerCase().endsWith(ext)
    );
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp || message.created_at).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // 🆕 IMPROVED: Delete message functionality with better error handling
  const handleDeleteMessage = async () => {
    if (isDeleting) return;
    
    setIsDeleting(true);
    try {
      console.log('🗑️ Deleting message:', {
        messageId: message.id,
        debugInfo: debugMessageInfo()
      });
      
      if (isRealMessage) {
        // Call the API for real messages
        console.log('🎯 Real database message - calling API');
        await messageService.deleteMessage(message.id);
        console.log('✅ Message deleted via API');
      } else {
        console.log('🔄 Temporary/optimistic message - skipping API call, updating UI only');
      }

      // 🆕 ALWAYS update UI (optimistic update for better UX)
      if (onDelete) {
        onDelete(message.id);
      }

      setShowDeleteConfirm(false);
      
    } catch (error) {
      console.error('❌ Failed to delete message:', error);
      
      // 🆕 BETTER ERROR HANDLING
      if (error.message.includes('404') || error.message.includes('not found')) {
        console.log('🔄 Message not found in database - removing from UI anyway');
        // Still remove from UI for consistent UX
        if (onDelete) {
          onDelete(message.id);
        }
      } else if (error.message.includes('403')) {
        alert('You do not have permission to delete this message');
        // Don't remove from UI if permission denied
      } else {
        console.error('❌ Unexpected error during delete:', error);
        alert('Failed to delete message. Please try again.');
        // Don't remove from UI on unexpected errors
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // 🆕 IMPROVED: Edit message functionality
  const handleEditMessage = async () => {
    if (!editContent.trim()) {
      // If empty content, treat as cancel
      setIsEditing(false);
      setEditContent(message.content || '');
      return;
    }

    // Don't save if content didn't change
    if (editContent === message.content) {
      setIsEditing(false);
      return;
    }

    try {
      console.log('✏️ Editing message:', {
        messageId: message.id,
        isRealMessage: isRealMessage,
        contentLength: editContent.length
      });

      let updatedMessage = { ...message, content: editContent, is_edited: true };

      if (isRealMessage) {
        // Call the API for real messages
        const response = await messageService.editMessage(message.id, editContent);
        console.log('✅ Message edited via API:', response);
        
        // Use the API response if available
        if (response && response.data) {
          updatedMessage = { ...updatedMessage, ...response.data };
        }
      } else {
        console.log('🔄 Temporary message - updating locally only');
        updatedMessage.is_temp_edit = true;
      }

      // Call the parent callback to update UI
      if (onEdit) {
        onEdit(message.id, updatedMessage);
      }

      setIsEditing(false);
      
    } catch (error) {
      console.error('❌ Failed to edit message:', error);
      
      // On error, we can still update locally for better UX but mark as having error
      if (onEdit) {
        onEdit(message.id, { 
          ...message, 
          content: editContent, 
          had_edit_error: true,
          original_content: message.content // Keep original in case of revert
        });
      }
      
      setIsEditing(false);
    }
  };

  // 🆕 ADDED: Cancel edit with escape key support
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(message.content || '');
  };

  // 🆕 IMPROVED: Reaction handler with better optimistic updates
  const handleReaction = async (emoji) => {
    if (reacting) return;
    
    setReacting(true);
    try {
      const reactionType = messageService.getReactionTypeFromEmoji(emoji);
      
      console.log('💖 Handling reaction for message:', {
        messageId: message.id,
        emoji,
        reactionType,
        isRealMessage: isRealMessage
      });

      // Update UI immediately for optimistic response
      const existingReaction = message.reactions?.find(
        r => r.user_id === user?.id && r.reaction_type === reactionType
      );

      let updatedReactions;
      
      if (existingReaction) {
        // Remove reaction optimistically
        updatedReactions = message.reactions?.filter(
          r => !(r.user_id === user?.id && r.reaction_type === reactionType)
        );
        console.log('🗑️ Optimistically removed reaction');
      } else {
        // Add reaction optimistically
        const newReaction = {
          id: `reaction-${Date.now()}`,
          user_id: user?.id,
          reaction_type: reactionType,
          created_at: new Date().toISOString(),
          user: user,
          is_optimistic: true
        };
        updatedReactions = [...(message.reactions || []), newReaction];
        console.log('➕ Optimistically added reaction');
      }

      // Update UI immediately
      if (onReactionUpdate) {
        onReactionUpdate(message.id, {
          ...message,
          reactions: updatedReactions
        });
      }

      // Show quick feedback
      setQuickReaction(emoji);
      setTimeout(() => setQuickReaction(null), 1000);

      // Only call API for real messages
      if (isRealMessage) {
        console.log('🎯 Real message - calling API with reaction type:', reactionType);
        
        let response;
        if (existingReaction) {
          response = await messageService.removeReaction(message.id, reactionType);
        } else {
          response = await messageService.reactToMessage(message.id, reactionType);
        }

        console.log('✅ API reaction response:', response);
        
        // Update with API response if available
        if (response?.data && onReactionUpdate) {
          onReactionUpdate(message.id, response.data);
        }
      }
      
      setShowReactions(false);

    } catch (error) {
      console.error('💥 Reaction handling failed:', error);
      
      // Show error feedback
      setQuickReaction('❌');
      setTimeout(() => setQuickReaction(null), 1000);
      
      // Revert optimistic update on error for real messages
      if (isRealMessage && onReactionUpdate) {
        onReactionUpdate(message.id, {
          ...message,
          had_reaction_error: true
        });
      }
    } finally {
      setReacting(false);
    }
  };

  // 🆕 IMPROVED: Quick reaction with better error handling
  const handleQuickReaction = async (emoji) => {
    if (reacting) return;
    
    setReacting(true);
    try {
      const reactionType = messageService.getReactionTypeFromEmoji(emoji);
      
      console.log('⚡ Quick reaction for message:', {
        messageId: message.id,
        emoji,
        reactionType,
        isRealMessage: isRealMessage
      });

      // Optimistic UI update
      const existingReaction = message.reactions?.find(
        r => r.user_id === user?.id && r.reaction_type === reactionType
      );

      let updatedReactions;
      
      if (existingReaction) {
        updatedReactions = message.reactions?.filter(
          r => !(r.user_id === user?.id && r.reaction_type === reactionType)
        );
      } else {
        const newReaction = {
          id: `quick-reaction-${Date.now()}`,
          user_id: user?.id,
          reaction_type: reactionType,
          created_at: new Date().toISOString(),
          user: user,
          is_optimistic: true
        };
        updatedReactions = [...(message.reactions || []), newReaction];
      }

      if (onReactionUpdate) {
        onReactionUpdate(message.id, {
          ...message,
          reactions: updatedReactions
        });
      }

      setQuickReaction(emoji);
      setTimeout(() => setQuickReaction(null), 1000);

      // API call only for real messages
      if (isRealMessage) {
        let response;
        if (existingReaction) {
          response = await messageService.removeReaction(message.id, reactionType);
        } else {
          response = await messageService.reactToMessage(message.id, reactionType);
        }

        // Update with actual API data if available
        if (response?.data && onReactionUpdate) {
          onReactionUpdate(message.id, response.data);
        }
      }

    } catch (error) {
      console.error('💥 Quick reaction failed:', error);
      setQuickReaction('❌');
      setTimeout(() => setQuickReaction(null), 1000);
      
      // Revert on error for real messages
      if (isRealMessage && onReactionUpdate) {
        onReactionUpdate(message.id, {
          ...message,
          had_reaction_error: true
        });
      }
    } finally {
      setReacting(false);
    }
  };

  // 🆕 IMPROVED: Reply handler with better error handling
  const handleReply = async () => {
    if (replyContent.trim() && onReply) {
      try {
        console.log('↪️ Sending reply to message:', message.id);
        await onReply(message.id, replyContent);
        setReplyContent('');
        setIsReplying(false);
      } catch (error) {
        console.error('❌ Failed to send reply:', error);
        alert('Failed to send reply. Please try again.');
      }
    }
  };

  const handlePinMessage = async () => {
    if (onPin) {
      try {
        await onPin(message.id);
      } catch (error) {
        console.error('❌ Failed to pin message:', error);
        alert('Failed to pin message. Please try again.');
      }
    }
  };

  const handleStartDirectMessage = async () => {
    if (onStartDirectMessage && message.user) {
      try {
        await onStartDirectMessage(message.user);
        setShowUserMenu(false);
      } catch (error) {
        console.error('❌ Failed to start direct message:', error);
        alert('Failed to start direct message. Please try again.');
      }
    }
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  // 🆕 UPDATED: Group reactions by type for display (using emojis)
  const groupedReactions = message.reactions?.reduce((acc, reaction) => {
    const emoji = messageService.getReactionEmoji(reaction.reaction_type);
    if (!acc[emoji]) {
      acc[emoji] = [];
    }
    acc[emoji].push(reaction);
    return acc;
  }, {}) || {};

  // Check if current user has reacted
  const userReaction = message.reactions?.find(r => r.user_id === user?.id);

  // Popular reaction emojis (like WhatsApp/Telegram)
  const quickReactions = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
  const allReactions = [
    { emoji: '👍', label: 'Like' },
    { emoji: '❤️', label: 'Love' },
    { emoji: '😂', label: 'Laugh' },
    { emoji: '😮', label: 'Wow' },
    { emoji: '😢', label: 'Sad' },
    { emoji: '😠', label: 'Angry' },
    { emoji: '🙏', label: 'Pray' },
    { emoji: '👏', label: 'Clap' },
    { emoji: '🔥', label: 'Fire' },
    { emoji: '🎉', label: 'Celebrate' }
  ];

  // Render replied message preview
  const renderReplyPreview = () => {
    if (!message.replied_to) return null;

    const repliedMessage = message.replied_to;
    const isRepliedMessageOwn = repliedMessage.user?.id === user?.id;
    
    return (
      <div className={`mb-2 p-2 rounded-lg border-l-4 ${
        isRepliedMessageOwn 
          ? 'bg-blue-900 bg-opacity-30 border-blue-500' 
          : 'bg-gray-600 bg-opacity-50 border-gray-400'
      }`}>
        <div className="flex items-center space-x-2 mb-1">
          <span className={`text-xs font-medium ${
            isRepliedMessageOwn ? 'text-blue-300' : 'text-gray-300'
          }`}>
            {isRepliedMessageOwn ? 'You' : repliedMessage.user?.display_name || repliedMessage.user?.email}
          </span>
        </div>
        
        {/* Replied message content */}
        <div className="text-sm">
          {repliedMessage.content ? (
            <p className="text-gray-200 truncate">{repliedMessage.content}</p>
          ) : repliedMessage.file_url ? (
            <div className="flex items-center space-x-2 text-gray-400">
              <span>📎</span>
              <span className="truncate text-xs">
                {repliedMessage.file_name || 'File'}
              </span>
            </div>
          ) : (
            <p className="text-gray-400 italic">Message deleted</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div 
      className={`flex group hover:bg-gray-800 rounded-lg p-2 ${isOwnMessage ? 'justify-end' : ''} ${
        message.is_pinned ? 'bg-yellow-900 bg-opacity-20 border-l-4 border-yellow-500' : ''
      } ${isTemporaryMessage ? 'opacity-80' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowReactions(false);
        setShowUserMenu(false);
      }}
    >
      {showAvatar && !isOwnMessage && (
        <div className="flex-shrink-0 mr-3 relative">
          <div 
            className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm cursor-pointer hover:bg-blue-700 transition-colors"
            onClick={() => setShowUserMenu(!showUserMenu)}
            title={`Message ${message.user?.display_name || message.user?.email} directly`}
          >
            {message.user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          
          {/* User Menu for Direct Messaging */}
          {showUserMenu && isDirectMessage && (
            <div className="absolute left-0 top-10 bg-gray-800 rounded-lg shadow-xl border border-gray-600 z-20 min-w-48">
              <div className="p-3 border-b border-gray-700">
                <div className="font-medium text-white text-sm">
                  {message.user?.display_name || message.user?.email}
                </div>
                <div className="text-gray-400 text-xs">
                  {message.user?.email}
                </div>
              </div>
              
              <div className="p-1">
                <button
                  onClick={handleStartDirectMessage}
                  className="w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-700 rounded-md flex items-center space-x-2"
                >
                  <span>💬</span>
                  <span>Send Direct Message</span>
                </button>
                
                <button
                  onClick={() => setShowUserMenu(false)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:bg-gray-700 rounded-md flex items-center space-x-2"
                >
                  <span>👤</span>
                  <span>View Profile</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className={`flex-1 ${isOwnMessage ? 'text-right' : ''}`}>
        {(showAvatar || isOwnMessage) && (
          <div className={`flex items-center space-x-2 mb-1 ${isOwnMessage ? 'justify-end' : ''}`}>
            {!isOwnMessage && (
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="text-white font-medium text-sm hover:text-blue-300 transition-colors"
                title={`Message ${message.user?.display_name || message.user?.email} directly`}
              >
                {message.user?.display_name || message.user?.email}
              </button>
            )}
            <span className="text-gray-400 text-xs">
              {formatTime(message.timestamp)}
            </span>
            
            {/* 🆕 ADDED: Message status indicators */}
            {message.is_pinned && (
              <span className="text-yellow-500 text-xs" title="Pinned message">
                📌
              </span>
            )}
            {message.had_edit_error && (
              <span className="text-red-500 text-xs" title="Edit failed - changes not saved">
                ⚠️
              </span>
            )}
            {message.is_edited && !message.had_edit_error && (
              <span className="text-gray-500 text-xs" title="Edited">
                (edited)
              </span>
            )}
            {isTemporaryMessage && (
              <span className="text-blue-400 text-xs" title="Sending...">
                ⏳
              </span>
            )}
          </div>
        )}
        
        <div className={`relative inline-block px-3 py-2 rounded-lg ${
          isOwnMessage 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-700 text-white'
        } ${hasImage ? 'p-1' : ''} ${isTemporaryMessage ? 'border border-dashed border-blue-400' : ''}`}>
          
          {/* Quick Reaction Feedback */}
          {quickReaction && (
            <div className={`absolute -top-8 ${isOwnMessage ? '-right-2' : '-left-2'} 
              animate-bounce bg-gray-800 rounded-full p-1 shadow-lg z-10`}>
              <span className="text-xl">{quickReaction}</span>
            </div>
          )}
          
          {/* Loading indicator for reactions */}
          {reacting && (
            <div className={`absolute -top-8 ${isOwnMessage ? '-right-2' : '-left-2'} 
              bg-gray-800 rounded-full p-1 shadow-lg z-10`}>
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          
          {/* Reply Preview - Shows the message being replied to */}
          {renderReplyPreview()}
          
          {/* Text Content or Edit Input */}
          {isEditing ? (
            <div className="mb-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full bg-gray-800 text-white rounded p-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                rows="3"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    handleEditMessage();
                  } else if (e.key === 'Escape') {
                    handleCancelEdit();
                  }
                }}
                placeholder="Edit your message..."
              />
              <div className="flex space-x-2 mt-2 justify-end">
                <button
                  onClick={handleCancelEdit}
                  className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditMessage}
                  disabled={!editContent.trim() || editContent === message.content}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded text-xs font-medium transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            message.content && (
              <div className={`${hasImage || hasFile ? 'mb-2' : ''}`}>
                {message.content}
                {message.had_edit_error && (
                  <span className="text-red-400 text-xs ml-2" title="Edit failed - changes not saved to server">
                    (unsaved)
                  </span>
                )}
              </div>
            )
          )}
          
          {/* Image Display - Like WhatsApp/Telegram */}
          {hasImage && (
            <div className="relative">
              {imageLoading && (
                <div className="w-64 h-48 bg-gray-600 rounded-lg flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                </div>
              )}
              
              {imageError ? (
                <div className="w-64 h-48 bg-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-400">
                  <span className="text-2xl mb-2">🖼️</span>
                  <span className="text-sm">Failed to load image</span>
                </div>
              ) : (
                <img
                  src={message.file_url}
                  alt={message.file_name || 'Shared image'}
                  className={`max-w-xs md:max-w-sm lg:max-w-md rounded-lg cursor-pointer transition-all duration-200 hover:opacity-90 ${
                    imageLoading ? 'hidden' : 'block'
                  }`}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  onClick={() => window.open(message.file_url, '_blank')}
                />
              )}
              
              {/* File info overlay for images */}
              <div className="absolute bottom-2 left-2 right-2 bg-black bg-opacity-50 rounded px-2 py-1">
                <div className="flex justify-between items-center text-white text-xs">
                  <span className="truncate flex-1 mr-2">
                    {message.file_name}
                  </span>
                  {message.file_size && (
                    <span className="flex-shrink-0">
                      {formatFileSize(message.file_size)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Regular File Attachment */}
          {hasFile && (
            <div className="mt-2">
              <a 
                href={message.file_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-3 p-3 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors duration-200"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-gray-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg">📎</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium text-sm truncate">
                    {message.file_name}
                  </div>
                  {message.file_size && (
                    <div className="text-gray-300 text-xs">
                      {formatFileSize(message.file_size)}
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0 text-blue-300 text-xs">
                  Download
                </div>
              </a>
            </div>
          )}

          {/* 🆕 UPDATED: Reactions Display - Like WhatsApp (using emojis) */}
          {Object.keys(groupedReactions).length > 0 && (
            <div className={`flex items-center space-x-1 mt-2 ${isOwnMessage ? 'justify-end' : ''}`}>
              <div className="bg-gray-800 bg-opacity-80 rounded-full px-2 py-1 flex items-center space-x-1">
                {Object.entries(groupedReactions)
                  .slice(0, 3)
                  .map(([emoji, reactions]) => (
                    <div key={emoji} className="flex items-center space-x-1">
                      <span className="text-xs">{emoji}</span>
                      <span className="text-gray-300 text-xs">
                        {reactions.length > 1 ? reactions.length : ''}
                      </span>
                    </div>
                  ))}
                {Object.keys(groupedReactions).length > 3 && (
                  <span className="text-gray-300 text-xs">+{Object.keys(groupedReactions).length - 3}</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Message actions */}
        {showActions && (
          <div className={`flex space-x-1 mt-1 ${isOwnMessage ? 'justify-end' : ''}`}>
            {/* Quick Reactions */}
            <div className="flex space-x-1 bg-gray-700 rounded-lg p-1">
              {quickReactions.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleQuickReaction(emoji)}
                  disabled={reacting}
                  className={`w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-600 transition-all duration-150 text-lg ${
                    userReaction?.reaction_type === messageService.getReactionTypeFromEmoji(emoji) ? 'bg-blue-500 scale-110' : ''
                  } ${reacting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={`React with ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* More reactions button */}
            <button
              onClick={() => setShowReactions(!showReactions)}
              disabled={reacting}
              className="text-gray-400 hover:text-white text-xs px-2 py-1 hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              title="More reactions"
            >
              ⋮
            </button>

            <button
              onClick={() => setIsReplying(true)}
              className="text-gray-400 hover:text-white text-xs px-2 py-1 hover:bg-gray-700 rounded"
              title="Reply"
            >
              ↪️
            </button>

            {/* 🆕 ADDED: Edit button (only for own text messages) */}
            {isOwnMessage && !message.file_url && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-gray-400 hover:text-yellow-400 text-xs px-2 py-1 hover:bg-gray-700 rounded"
                title="Edit message"
              >
                ✏️
              </button>
            )}

            {/* 🆕 ADDED: Delete button (only for own messages) */}
            {isOwnMessage && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting}
                className="text-gray-400 hover:text-red-400 text-xs px-2 py-1 hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                title="Delete message"
              >
                {isDeleting ? '⏳' : '🗑️'}
              </button>
            )}

            {/* Direct Message Button (only for others' messages) */}
            {isDirectMessage && (
              <button
                onClick={handleStartDirectMessage}
                className="text-gray-400 hover:text-white text-xs px-2 py-1 hover:bg-gray-700 rounded"
                title="Send Direct Message"
              >
                💬
              </button>
            )}

            <button
              onClick={handlePinMessage}
              className="text-gray-400 hover:text-white text-xs px-2 py-1 hover:bg-gray-700 rounded"
              title={message.is_pinned ? 'Unpin message' : 'Pin message'}
            >
              {message.is_pinned ? '📌' : '📍'}
            </button>
          </div>
        )}

        {/* 🆕 ADDED: Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className={`bg-gray-700 p-4 rounded-lg shadow-xl mt-2 inline-block ${
            isOwnMessage ? 'float-right' : 'float-left'
          }`}>
            <div className="text-white text-sm mb-3">
              Are you sure you want to delete this message?
            </div>
            <div className="flex space-x-2 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-xs font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteMessage}
                disabled={isDeleting}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors disabled:opacity-50 flex items-center space-x-1"
              >
                {isDeleting && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Full Reaction Picker */}
        {showReactions && (
          <div className={`bg-gray-700 p-3 rounded-lg shadow-xl mt-2 inline-block ${
            isOwnMessage ? 'float-right' : 'float-left'
          }`}>
            <div className="grid grid-cols-5 gap-2">
              {allReactions.map(({ emoji, label }) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  disabled={reacting}
                  className={`w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-600 transition-all duration-200 text-xl ${
                    userReaction?.reaction_type === messageService.getReactionTypeFromEmoji(emoji) ? 'bg-blue-500 scale-110' : ''
                  } ${reacting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={label}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Reply input */}
        {isReplying && (
          <div className="mt-2 bg-gray-700 rounded-lg p-2">
            {/* Show which message is being replied to */}
            <div className="mb-2 p-2 bg-gray-600 rounded text-sm">
              <div className="flex items-center space-x-2 text-gray-300">
                <span>↪️</span>
                <span>Replying to {isOwnMessage ? 'yourself' : message.user?.display_name || message.user?.email}</span>
              </div>
              <div className="text-gray-400 text-xs mt-1 truncate">
                {message.content || (message.file_url ? '📎 File' : 'Message')}
              </div>
            </div>
            
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write your reply..."
              className="w-full bg-gray-600 text-white rounded p-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows="3"
              autoFocus
            />
            <div className="flex space-x-2 mt-2 justify-end">
              <button
                onClick={() => {
                  setIsReplying(false);
                  setReplyContent('');
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReply}
                disabled={!replyContent.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
              >
                Send Reply
              </button>
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