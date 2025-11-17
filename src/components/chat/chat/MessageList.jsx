// MessageList.jsx - DEBUG VERSION
import React, { useEffect, useRef, useState } from 'react';
import Message from './Message';

export default function MessageList({ messages = [], roomId, onMessageUpdate, onMessageReact, onMessageReply }) {
  const [groupedMessages, setGroupedMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const listRef = useRef(null);

  // 🚨 DEBUG: Log all props and state
  useEffect(() => {
    console.log('🔍 MESSAGELIST DEBUG - Props:', {
      messagesCount: messages.length,
      messages: messages,
      roomId: roomId,
      groupedMessagesCount: groupedMessages.length,
      groupedMessages: groupedMessages
    });
  }, [messages, roomId, groupedMessages]);

  // Safe message grouping with error boundary
  useEffect(() => {
    try {
      console.log('🔄 Grouping messages:', messages.length);
      
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        console.log('📭 No messages to group');
        setGroupedMessages([]);
        return;
      }

      const grouped = [];
      let currentGroup = [];
      
      messages.forEach((message, index) => {
        console.log(`📦 Processing message ${index}:`, message);
        
        // Validate message structure
        if (!message || typeof message !== 'object') {
          console.warn('❌ Invalid message format at index:', index, message);
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

      console.log('✅ Final grouped messages:', grouped);
      setGroupedMessages(grouped);
    } catch (groupingError) {
      console.error('❌ Error grouping messages:', groupingError);
      // Fallback: treat each message as its own group
      const fallbackGroups = messages.map(msg => [msg]);
      console.log('🔄 Using fallback grouping:', fallbackGroups);
      setGroupedMessages(fallbackGroups);
    }
  }, [messages]);

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

  // Safe message count
  const messageCount = Array.isArray(messages) ? messages.length : 0;

  if (!messages || messageCount === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-900 p-4">
        <div className="text-center max-w-md">
          <div className="text-gray-400 text-lg mb-2">No messages yet</div>
          <div className="text-gray-500 text-sm mb-4">
            Start a conversation by sending the first message!
          </div>
          <div className="text-red-400 text-xs">
            🐛 DEBUG: messages prop is empty array
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-900">
      {/* Debug banner */}
      <div className="bg-blue-900/20 p-2 border-b border-blue-700/30">
        <div className="text-xs text-blue-300 text-center">
          🔍 MESSAGELIST DEBUG: {messageCount} messages • {groupedMessages.length} groups •
          <button 
            onClick={() => console.log('Current state:', { messages, groupedMessages })} 
            className="ml-2 underline"
          >
            Log State
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div ref={listRef} className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-4">
          {/* Messages */}
          {groupedMessages.map((messageGroup, groupIndex) => {
            if (!Array.isArray(messageGroup) || messageGroup.length === 0) {
              console.warn('❌ Empty message group at index:', groupIndex);
              return null;
            }

            const firstMessage = messageGroup[0];
            if (!firstMessage) {
              console.warn('❌ Invalid first message in group:', groupIndex);
              return null;
            }

            console.log(`🎯 Rendering group ${groupIndex}:`, messageGroup);

            return (
              <div key={`group-${groupIndex}`} className="mb-2">
                {/* Group header for debugging */}
                <div className="text-xs text-gray-500 mb-1">
                  Group {groupIndex} • {messageGroup.length} messages • 
                  User: {firstMessage.user?.display_name || 'Unknown'}
                </div>
                
                {/* Messages in this group */}
                {messageGroup.map((message, messageIndex) => {
                  if (!message) {
                    console.warn('❌ Invalid message in group:', groupIndex, messageIndex);
                    return null;
                  }

                  console.log(`📨 Rendering message ${messageIndex}:`, message);

                  return (
                    <Message 
                      key={message.id || `msg-${groupIndex}-${messageIndex}`} 
                      message={message} 
                      showAvatar={messageIndex === 0}
                      showTimestamp={messageIndex === 0}
                      onReply={onMessageReply}
                      onReact={onMessageReact}
                    />
                  );
                })}
              </div>
            );
          })}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
} 