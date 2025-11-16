import React, { useEffect, useRef, useState } from 'react';
import Message from './Message';
import { messageService } from '../../../services/chat/api';

export default function MessageList({ messages = [], roomId, onMessageUpdate, onMessageReact, onMessageReply }) {
  const [groupedMessages, setGroupedMessages] = useState([]);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [loadingPinned, setLoadingPinned] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const listRef = useRef(null);

  // Safe message grouping with error boundary
  useEffect(() => {
    try {
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        setGroupedMessages([]);
        return;
      }

      const grouped = [];
      let currentGroup = [];
      
      messages.forEach((message, index) => {
        // Validate message structure
        if (!message || typeof message !== 'object') {
          console.warn('Invalid message format at index:', index, message);
          return;
        }

        const prevMessage = messages[index - 1];
        
        // Check if we should start a new group
        const shouldStartNewGroup = 
          !prevMessage ||
          prevMessage.user?.id !== message.user?.id ||
          (message.timestamp && prevMessage.timestamp && 
           new Date(message.timestamp) - new Date(prevMessage.timestamp) > 300000) || // 5 minutes
          (message.is_pinned !== prevMessage.is_pinned);

        if (shouldStartNewGroup && currentGroup.length > 0) {
          grouped.push([...currentGroup]);
          currentGroup = [];
        }
        
        currentGroup.push(message);
      });

      // Add the last group
      if (currentGroup.length > 0) {
        grouped.push(currentGroup);
      }

      setGroupedMessages(grouped);
      setError(null);
    } catch (groupingError) {
      console.error('Error grouping messages:', groupingError);
      setError('Failed to organize messages');
      // Fallback: treat each message as its own group
      setGroupedMessages(messages.map(msg => [msg]));
    }
  }, [messages]);

  // Load pinned messages with error handling
  useEffect(() => {
    if (roomId) {
      loadPinnedMessages();
    }
  }, [roomId]);

  const loadPinnedMessages = async () => {
    if (!roomId) return;
    
    setLoadingPinned(true);
    setError(null);
    try {
      console.log(`📌 Loading pinned messages for room: ${roomId}`);
      const pinned = await messageService.getPinnedMessages();
      console.log('✅ Pinned messages loaded:', pinned);
      
      // Filter pinned messages for current room if needed
      const roomPinned = Array.isArray(pinned) 
        ? pinned.filter(msg => msg && (msg.room?.id === roomId || msg.room_id === roomId))
        : [];
      setPinnedMessages(roomPinned);
    } catch (error) {
      console.error('❌ Failed to load pinned messages:', error);
      setError('Failed to load pinned messages');
      setPinnedMessages([]); // Ensure pinnedMessages is always an array
    } finally {
      setLoadingPinned(false);
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    try {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (scrollError) {
      console.warn('Scroll error:', scrollError);
    }
  };

  const handleMessageReact = async (messageId, reactionType) => {
    try {
      if (onMessageReact) {
        await onMessageReact(messageId, reactionType);
      }
    } catch (error) {
      console.error('Failed to handle reaction:', error);
      setError('Failed to add reaction');
    }
  };

  const handleMessageReply = async (messageId, replyContent) => {
    try {
      if (onMessageReply) {
        await onMessageReply(messageId, replyContent);
      }
    } catch (error) {
      console.error('Failed to handle reply:', error);
      setError('Failed to send reply');
    }
  };

  const handleMessagePin = async (messageId) => {
    try {
      await loadPinnedMessages();
      if (onMessageUpdate) {
        onMessageUpdate();
      }
    } catch (error) {
      console.error('Failed to handle pin:', error);
      setError('Failed to pin message');
    }
  };

  const handleLoadMore = async () => {
    try {
      console.log('Load more messages...');
      // Implement pagination here
    } catch (error) {
      console.error('Failed to load more messages:', error);
      setError('Failed to load more messages');
    }
  };

  const shouldShowAvatar = (messageGroup, messageIndex) => {
    return messageIndex === 0;
  };

  const shouldShowTimestamp = (messageGroup, messageIndex) => {
    return messageIndex === 0;
  };

  const formatDateHeader = (timestamp) => {
    try {
      if (!timestamp) return 'Unknown date';
      
      const messageDate = new Date(timestamp);
      if (isNaN(messageDate.getTime())) return 'Invalid date';
      
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (messageDate.toDateString() === today.toDateString()) {
        return 'Today';
      } else if (messageDate.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      } else {
        return messageDate.toLocaleDateString([], { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      }
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Unknown date';
    }
  };

  const shouldShowDateHeader = (currentMessage, previousMessage) => {
    if (!currentMessage) return false;
    if (!previousMessage) return true;
    
    try {
      const currentDate = new Date(currentMessage.timestamp || currentMessage.created_at);
      const previousDate = new Date(previousMessage.timestamp || previousMessage.created_at);
      
      if (isNaN(currentDate.getTime()) || isNaN(previousDate.getTime())) {
        return false;
      }
      
      return currentDate.toDateString() !== previousDate.toDateString();
    } catch (error) {
      console.error('Date comparison error:', error);
      return false;
    }
  };

  const handleRetry = () => {
    setError(null);
    if (roomId) {
      loadPinnedMessages();
    }
  };

  // Safe message count
  const messageCount = Array.isArray(messages) ? messages.length : 0;

  // Error state
  if (error && messageCount === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-900 p-4">
        <div className="text-center max-w-md">
          <div className="text-red-400 text-lg mb-2">Error Loading Messages</div>
          <div className="text-gray-400 text-sm mb-4">{error}</div>
          <button
            onClick={handleRetry}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!messages || messageCount === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-900 p-4">
        <div className="text-center max-w-md">
          <div className="text-gray-400 text-lg mb-2">No messages yet</div>
          <div className="text-gray-500 text-sm mb-4">
            Start a conversation by sending the first message!
          </div>
          {pinnedMessages.length > 0 && (
            <div className="mt-4">
              <div className="text-yellow-500 text-sm font-medium mb-2">📌 Pinned Messages</div>
              <div className="space-y-2">
                {pinnedMessages.map((pinned, index) => (
                  <div key={pinned?.id || `pinned-${index}`} className="bg-yellow-900 bg-opacity-20 p-3 rounded-lg border-l-4 border-yellow-500">
                    <div className="text-white text-sm">{pinned?.content || 'No content'}</div>
                    <div className="text-gray-400 text-xs mt-1">
                      {pinned?.user?.email || 'Unknown user'} • {pinned?.timestamp ? new Date(pinned.timestamp).toLocaleDateString() : 'Unknown date'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-900">
      {/* Error Banner */}
      {error && (
        <div className="bg-red-900 bg-opacity-20 border-b border-red-800 p-3">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-red-500">⚠️</span>
              <span className="text-red-200 text-sm">{error}</span>
            </div>
            <button
              onClick={handleRetry}
              className="text-red-400 hover:text-red-300 text-xs"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Pinned Messages Banner */}
      {pinnedMessages.length > 0 && (
        <div className="bg-yellow-900 bg-opacity-20 border-b border-yellow-800 p-3">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-yellow-500">📌</span>
                <span className="text-yellow-200 text-sm font-medium">
                  {pinnedMessages.length} Pinned Message{pinnedMessages.length !== 1 ? 's' : ''}
                </span>
              </div>
              <button
                onClick={loadPinnedMessages}
                disabled={loadingPinned}
                className="text-yellow-400 hover:text-yellow-300 text-xs disabled:opacity-50"
              >
                {loadingPinned ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div ref={listRef} className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-4">
          {/* Debug info - remove in production */}
          <div className="text-xs text-gray-500 mb-4 text-center">
            Showing {messageCount} messages • Room: {roomId || 'None'} • Groups: {groupedMessages.length}
          </div>

          {/* Load more button for pagination */}
          <div className="flex justify-center mb-4">
            <button
              onClick={handleLoadMore}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm transition-colors"
            >
              Load older messages
            </button>
          </div>

          {/* Messages */}
          {groupedMessages.map((messageGroup, groupIndex) => {
            if (!Array.isArray(messageGroup) || messageGroup.length === 0) {
              return null;
            }

            const firstMessage = messageGroup[0];
            if (!firstMessage) return null;

            const elements = [];

            // Add date header if needed
            const previousMessages = groupedMessages.slice(0, groupIndex).flat();
            const previousMessage = previousMessages[previousMessages.length - 1];
            
            if (shouldShowDateHeader(firstMessage, previousMessage)) {
              elements.push(
                <div key={`date-${firstMessage.id || groupIndex}`} className="flex justify-center my-6">
                  <div className="bg-gray-700 px-3 py-1 rounded-full text-gray-300 text-xs font-medium">
                    {formatDateHeader(firstMessage.timestamp || firstMessage.created_at)}
                  </div>
                </div>
              );
            }

            // Add messages in this group
            messageGroup.forEach((message, messageIndex) => {
              if (!message) return;
              
              elements.push(
                <Message 
                  key={message.id || `msg-${groupIndex}-${messageIndex}`} 
                  message={message} 
                  showAvatar={shouldShowAvatar(messageGroup, messageIndex)}
                  showTimestamp={shouldShowTimestamp(messageGroup, messageIndex)}
                  onReply={handleMessageReply}
                  onReact={handleMessageReact}
                  onPin={handleMessagePin}
                />
              );
            });

            return elements;
          })}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* New message indicator */}
      <div className="sticky bottom-4 flex justify-center">
        <button
          onClick={scrollToBottom}
          className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-full text-sm shadow-lg transition-all transform hover:scale-105"
        >
          ↓ New messages
        </button>
      </div>
    </div>
  );
}