import React, { useEffect, useRef, useState } from 'react';
import Message from './Message';
import { messageService } from '../../../services/chat/api';

export default function MessageList({ messages, roomId, onMessageUpdate, onMessageReact, onMessageReply }) {
  const [groupedMessages, setGroupedMessages] = useState([]);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [loadingPinned, setLoadingPinned] = useState(false);
  const messagesEndRef = useRef(null);
  const listRef = useRef(null);

  // Group messages by user and time proximity
  useEffect(() => {
    if (!messages || messages.length === 0) {
      setGroupedMessages([]);
      return;
    }

    const grouped = [];
    let currentGroup = [];
    
    messages.forEach((message, index) => {
      const prevMessage = messages[index - 1];
      
      // Check if we should start a new group
      const shouldStartNewGroup = 
        !prevMessage ||
        prevMessage.user?.id !== message.user?.id ||
        new Date(message.timestamp || message.created_at) - new Date(prevMessage.timestamp || prevMessage.created_at) > 300000 || // 5 minutes
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
  }, [messages]);

  // Load pinned messages
  useEffect(() => {
    loadPinnedMessages();
  }, [roomId]);

  const loadPinnedMessages = async () => {
    if (!roomId) return;
    
    setLoadingPinned(true);
    try {
      const pinned = await messageService.getPinnedMessages();
      // Filter pinned messages for current room if needed
      const roomPinned = pinned.filter(msg => msg.room?.id === roomId || msg.room_id === roomId);
      setPinnedMessages(roomPinned);
    } catch (error) {
      console.error('Failed to load pinned messages:', error);
    } finally {
      setLoadingPinned(false);
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleMessageReact = async (messageId, reactionType) => {
    try {
      if (onMessageReact) {
        onMessageReact(messageId, reactionType);
      }
      // Optionally refresh messages to get updated reactions
      if (onMessageUpdate) {
        onMessageUpdate();
      }
    } catch (error) {
      console.error('Failed to handle reaction:', error);
    }
  };

  const handleMessageReply = async (messageId, replyContent) => {
    try {
      if (onMessageReply) {
        onMessageReply(messageId, replyContent);
      }
      // Optionally refresh messages to show the new reply
      if (onMessageUpdate) {
        onMessageUpdate();
      }
    } catch (error) {
      console.error('Failed to handle reply:', error);
    }
  };

  const handleMessagePin = async (messageId) => {
    try {
      // Refresh pinned messages
      await loadPinnedMessages();
      // Notify parent to refresh messages
      if (onMessageUpdate) {
        onMessageUpdate();
      }
    } catch (error) {
      console.error('Failed to handle pin:', error);
    }
  };

  const handleLoadMore = async () => {
    // Implement pagination if needed
    console.log('Load more messages...');
  };

  const shouldShowAvatar = (messageGroup, messageIndex) => {
    return messageIndex === 0; // Show avatar only for first message in group
  };

  const shouldShowTimestamp = (messageGroup, messageIndex) => {
    // Show timestamp for first message in group or if time gap is large
    return messageIndex === 0;
  };

  const formatDateHeader = (timestamp) => {
    const messageDate = new Date(timestamp);
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
  };

  const shouldShowDateHeader = (currentMessage, previousMessage) => {
    if (!previousMessage) return true;
    
    const currentDate = new Date(currentMessage.timestamp || currentMessage.created_at);
    const previousDate = new Date(previousMessage.timestamp || previousMessage.created_at);
    
    return currentDate.toDateString() !== previousDate.toDateString();
  };

  if (!messages || messages.length === 0) {
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
                {pinnedMessages.map(pinned => (
                  <div key={pinned.id} className="bg-yellow-900 bg-opacity-20 p-3 rounded-lg border-l-4 border-yellow-500">
                    <div className="text-white text-sm">{pinned.content}</div>
                    <div className="text-gray-400 text-xs mt-1">
                      {pinned.user?.email} • {new Date(pinned.timestamp || pinned.created_at).toLocaleDateString()}
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
          {groupedMessages.flatMap((messageGroup, groupIndex) => {
            const firstMessage = messageGroup[0];
            const elements = [];

            // Add date header if needed
            if (shouldShowDateHeader(firstMessage, groupedMessages.flat()[groupIndex - 1])) {
              elements.push(
                <div key={`date-${firstMessage.id}`} className="flex justify-center my-6">
                  <div className="bg-gray-700 px-3 py-1 rounded-full text-gray-300 text-xs font-medium">
                    {formatDateHeader(firstMessage.timestamp || firstMessage.created_at)}
                  </div>
                </div>
              );
            }

            // Add messages in this group
            messageGroup.forEach((message, messageIndex) => {
              elements.push(
                <Message 
                  key={message.id} 
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