import React, { useState } from 'react';
import useAuthStore from '../../../stores/authStore';
import { messageService } from '../../../services/chat/api';

export default function Message({ message, showAvatar, onReply, onPin, onReactionUpdate, onStartDirectMessage }) {
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
  
  const isOwnMessage = message.user?.id === user?.id;
  const isDirectMessage = onStartDirectMessage && !isOwnMessage;

  // 🆕 Convert message.id to string for safe checking
  const messageIdStr = String(message.id || '');

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

  const handleReaction = async (reactionType) => {
    if (reacting) return;
    
    setReacting(true);
    try {
      console.log('💖 Handling reaction for message:', {
        messageId: message.id,
        messageContent: message.content?.substring(0, 50),
        reactionType,
        isTemporary: message.is_temp || messageIdStr.includes('temp-') || messageIdStr.includes('text-'),
        isNumericId: !isNaN(message.id) && Number.isInteger(Number(message.id))
      });

      // Check if this is a temporary message (optimistic update)
      const isTemporaryMessage = message.is_temp || 
                                messageIdStr.includes('temp-') || 
                                messageIdStr.includes('text-') ||
                                !message.id;

      // Check if this is a valid numeric ID (real backend message)
      const isRealMessage = !isTemporaryMessage && 
                           !isNaN(message.id) && 
                           Number.isInteger(Number(message.id)) && 
                           message.id > 0;

      if (!isRealMessage) {
        console.log('🔄 Temporary or invalid message - using optimistic update only');
        
        // For temporary/invalid messages, just update the UI optimistically
        const existingReaction = message.reactions?.find(
          r => r.user_id === user?.id && r.reaction_type === reactionType
        );

        let updatedReactions;
        
        if (existingReaction) {
          // Remove reaction
          updatedReactions = message.reactions?.filter(
            r => !(r.user_id === user?.id && r.reaction_type === reactionType)
          );
          console.log('🗑️ Optimistically removed reaction');
        } else {
          // Add reaction
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

        setQuickReaction(reactionType);
        setTimeout(() => setQuickReaction(null), 1000);
        setShowReactions(false);
        return;
      }

      // For real messages with valid numeric IDs, use the API
      console.log('🎯 Real message - calling API');
      const existingReaction = message.reactions?.find(
        r => r.user_id === user?.id && r.reaction_type === reactionType
      );

      let response;

      if (existingReaction) {
        // Remove existing reaction
        console.log('🗑️ Removing reaction via API');
        response = await messageService.removeReaction(message.id, reactionType);
      } else {
        // Add new reaction
        console.log('➕ Adding reaction via API');
        response = await messageService.reactToMessage(message.id, reactionType);
      }

      // Show quick reaction feedback
      setQuickReaction(reactionType);
      setTimeout(() => setQuickReaction(null), 1000);
      
      // Handle the response
      if (response?.is_optimistic || response?.is_fallback) {
        console.log('🔄 Using optimistic/fallback reaction data');
        // Update UI optimistically
        if (onReactionUpdate) {
          const updatedReactions = existingReaction
            ? message.reactions?.filter(r => !(r.user_id === user?.id && r.reaction_type === reactionType))
            : [
                ...(message.reactions || []),
                {
                  id: response.data?.id || `reaction-${Date.now()}`,
                  user_id: user?.id,
                  reaction_type: reactionType,
                  created_at: new Date().toISOString(),
                  user: user,
                  is_optimistic: true
                }
              ];

          onReactionUpdate(message.id, {
            ...message,
            reactions: updatedReactions
          });
        }
      } else if (onReactionUpdate && response?.data) {
        // Use actual API response
        console.log('✅ Using API response data');
        onReactionUpdate(message.id, response.data);
      }
      
      setShowReactions(false);

    } catch (error) {
      console.error('💥 Reaction handling failed:', error);
      
      // Show error feedback
      setQuickReaction('❌');
      setTimeout(() => setQuickReaction(null), 1000);
      
      // For API errors, still update UI optimistically for better UX
      const existingReaction = message.reactions?.find(
        r => r.user_id === user?.id && r.reaction_type === reactionType
      );

      if (onReactionUpdate) {
        const updatedReactions = existingReaction
          ? message.reactions?.filter(r => !(r.user_id === user?.id && r.reaction_type === reactionType))
          : [
              ...(message.reactions || []),
              {
                id: `error-reaction-${Date.now()}`,
                user_id: user?.id,
                reaction_type: reactionType,
                created_at: new Date().toISOString(),
                user: user,
                is_optimistic: true,
                had_error: true
              }
            ];

        onReactionUpdate(message.id, {
          ...message,
          reactions: updatedReactions
        });
      }
    } finally {
      setReacting(false);
    }
  };

  const handleQuickReaction = async (reactionType) => {
    if (reacting) return;
    
    setReacting(true);
    try {
      console.log('⚡ Quick reaction for message:', {
        messageId: message.id,
        reactionType,
        isTemporary: message.is_temp || messageIdStr.includes('temp-') || messageIdStr.includes('text-'),
        isNumericId: !isNaN(message.id) && Number.isInteger(Number(message.id))
      });

      // Check if this is a valid numeric ID (real backend message)
      const isRealMessage = !isNaN(message.id) && 
                           Number.isInteger(Number(message.id)) && 
                           message.id > 0 &&
                           !messageIdStr.includes('temp-') &&
                           !messageIdStr.includes('text-');

      if (!isRealMessage) {
        console.log('🔄 Quick reaction - temporary message, using optimistic update');
        
        // For temporary messages, update UI optimistically
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

        setQuickReaction(reactionType);
        setTimeout(() => setQuickReaction(null), 1000);
        return;
      }

      // For real messages, use the API
      console.log('⚡ Quick reaction - real message, calling API');
      const existingReaction = message.reactions?.find(
        r => r.user_id === user?.id && r.reaction_type === reactionType
      );

      let response;

      if (existingReaction) {
        response = await messageService.removeReaction(message.id, reactionType);
      } else {
        response = await messageService.reactToMessage(message.id, reactionType);
      }

      setQuickReaction(reactionType);
      setTimeout(() => setQuickReaction(null), 1000);
      
      // Handle response
      if (response?.is_optimistic || response?.is_fallback) {
        if (onReactionUpdate) {
          const updatedReactions = existingReaction
            ? message.reactions?.filter(r => !(r.user_id === user?.id && r.reaction_type === reactionType))
            : [
                ...(message.reactions || []),
                {
                  id: response.data?.id || `quick-${Date.now()}`,
                  user_id: user?.id,
                  reaction_type: reactionType,
                  created_at: new Date().toISOString(),
                  user: user,
                  is_optimistic: true
                }
              ];

          onReactionUpdate(message.id, {
            ...message,
            reactions: updatedReactions
          });
        }
      } else if (onReactionUpdate && response?.data) {
        onReactionUpdate(message.id, response.data);
      }

    } catch (error) {
      console.error('💥 Quick reaction failed:', error);
      setQuickReaction('❌');
      setTimeout(() => setQuickReaction(null), 1000);
      
      // Fallback to optimistic update on error
      const existingReaction = message.reactions?.find(
        r => r.user_id === user?.id && r.reaction_type === reactionType
      );

      if (onReactionUpdate) {
        const updatedReactions = existingReaction
          ? message.reactions?.filter(r => !(r.user_id === user?.id && r.reaction_type === reactionType))
          : [
              ...(message.reactions || []),
              {
                id: `error-quick-${Date.now()}`,
                user_id: user?.id,
                reaction_type: reactionType,
                created_at: new Date().toISOString(),
                user: user,
                is_optimistic: true
              }
            ];

        onReactionUpdate(message.id, {
          ...message,
          reactions: updatedReactions
        });
      }
    } finally {
      setReacting(false);
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

  const handleStartDirectMessage = async () => {
    if (onStartDirectMessage && message.user) {
      try {
        await onStartDirectMessage(message.user);
        setShowUserMenu(false);
      } catch (error) {
        console.error('Failed to start direct message:', error);
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

  // Group reactions by type for display
  const groupedReactions = message.reactions?.reduce((acc, reaction) => {
    if (!acc[reaction.reaction_type]) {
      acc[reaction.reaction_type] = [];
    }
    acc[reaction.reaction_type].push(reaction);
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
      }`}
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
            {message.is_pinned && (
              <span className="text-yellow-500 text-xs" title="Pinned message">
                📌
              </span>
            )}
          </div>
        )}
        
        <div className={`relative inline-block px-3 py-2 rounded-lg ${
          isOwnMessage 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-700 text-white'
        } ${hasImage ? 'p-1' : ''}`}>
          
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
          
          {/* Text Content */}
          {message.content && (
            <div className={`${hasImage || hasFile ? 'mb-2' : ''}`}>
              {message.content}
            </div>
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

          {/* Reactions Display - Like WhatsApp */}
          {Object.keys(groupedReactions).length > 0 && (
            <div className={`flex items-center space-x-1 mt-2 ${isOwnMessage ? 'justify-end' : ''}`}>
              <div className="bg-gray-800 bg-opacity-80 rounded-full px-2 py-1 flex items-center space-x-1">
                {Object.entries(groupedReactions)
                  .slice(0, 3)
                  .map(([reactionType, reactions]) => (
                    <div key={reactionType} className="flex items-center space-x-1">
                      <span className="text-xs">{reactionType}</span>
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
                    userReaction?.reaction_type === emoji ? 'bg-blue-500 scale-110' : ''
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
                    userReaction?.reaction_type === emoji ? 'bg-blue-500 scale-110' : ''
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