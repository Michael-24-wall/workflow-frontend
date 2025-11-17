import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useWebSocket } from '../../../contexts/chat/WebSocketContext';
import { channelService, messageService } from '../../../services/chat/api'; // Use channelService instead of roomService
import useAuthStore from '../../../stores/authStore';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

export default function ChannelChat() {
  const { channelId } = useParams();
  const { 
    connectToChannel, // Use connectToChannel instead of connectToRoom
    sendMessage: sendWsMessage, 
    getMessages,
    isRoomConnected 
  } = useWebSocket();
  
  const { user } = useAuthStore();
  
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiMessages, setApiMessages] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (channelId) {
      loadChannelData();
      loadMessages();
      connectToChannel(channelId); // Use connectToChannel
    }
  }, [channelId]);

  const loadChannelData = async () => {
    try {
      console.log('🔄 Loading channel data for:', channelId);
      const channelData = await channelService.getChannel(channelId);
      console.log('✅ Channel data:', channelData);
      setChannel(channelData);
    } catch (error) {
      console.error('❌ Failed to load channel:', error);
      // Fallback channel data
      setChannel({ 
        id: channelId, 
        name: `Channel ${channelId}`,
        description: 'Channel description'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      console.log('🔄 Loading messages for channel:', channelId);
      
      // Try different possible endpoints
      let messagesData;
      try {
        // First try the channels messages endpoint
        messagesData = await channelService.getChannelMessages(channelId, {
          page: 1,
          page_size: 50
        });
      } catch (error) {
        console.log('⚠️ Channel messages endpoint failed, trying messages endpoint...');
        // Fallback to general messages endpoint
        messagesData = await messageService.getMessages({
          channel: channelId,
          page: 1,
          page_size: 50
        });
      }
      
      console.log('✅ Messages data:', messagesData);
      
      // Handle different response formats
      const messages = messagesData.results || messagesData.data || messagesData || [];
      setApiMessages(messages);
    } catch (error) {
      console.error('❌ Failed to load messages:', error);
      setApiMessages([]);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [apiMessages]);

  // Get WebSocket messages for this channel
  const wsMessages = getMessages(channelId) || [];
  
  // Combine API messages with WebSocket messages
  const allMessages = [...apiMessages, ...wsMessages];

  const handleSendMessage = async (content, file = null) => {
    try {
      console.log('📤 Sending message:', { content, file, channelId });
      
      if (file) {
        // Handle file upload
        await messageService.uploadFile(file, channelId, content || 'Shared a file');
        await loadMessages(); // Reload messages after file upload
      } else {
        // Try to send via WebSocket first
        const wsSent = sendWsMessage(channelId, content, 'channel');
        
        if (!wsSent) {
          console.log('📤 WebSocket not available, using API');
          // Fallback to API
          await messageService.sendMessage(channelId, content);
          await loadMessages(); // Reload messages after sending
        } else {
          console.log('📤 Message sent via WebSocket');
        }
      }
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      alert('Failed to send message: ' + error.message);
    }
  };

  const handleReplyToMessage = async (messageId, replyContent) => {
    try {
      console.log('💬 Replying to message:', messageId);
      await messageService.replyToMessage(messageId, replyContent);
      await loadMessages(); // Reload to see the reply
    } catch (error) {
      console.error('❌ Failed to send reply:', error);
      alert('Failed to send reply: ' + error.message);
    }
  };

  const handleReactToMessage = async (messageId, reactionType) => {
    try {
      console.log('👍 Reacting to message:', messageId, reactionType);
      await messageService.reactToMessage(messageId, reactionType);
      await loadMessages(); // Reload to see the reaction
    } catch (error) {
      console.error('❌ Failed to react to message:', error);
    }
  };

  const handlePinMessage = async (messageId) => {
    try {
      console.log('📌 Pinning message:', messageId);
      await messageService.pinMessage(messageId);
      await loadMessages(); // Reload to see pinned message
    } catch (error) {
      console.error('❌ Failed to pin message:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-400 text-sm">Loading channel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-900">
      {/* Channel Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`w-3 h-3 rounded-full ${
              isRoomConnected(channelId, 'channel') ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            }`} 
            title={isRoomConnected(channelId, 'channel') ? 'Connected' : 'Disconnected'}
            ></div>
            <div>
              <h1 className="text-white font-semibold text-lg">
                {channel?.name || `Channel ${channelId}`}
              </h1>
              {channel?.description && (
                <p className="text-gray-400 text-sm mt-1">
                  {channel.description}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Connection Status */}
            {!isRoomConnected(channelId, 'channel') && (
              <div className="text-yellow-500 text-sm bg-yellow-900/20 px-2 py-1 rounded">
                Connecting...
              </div>
            )}
            
            {/* Messages Count */}
            <div className="text-gray-400 text-sm bg-gray-700 px-2 py-1 rounded">
              {allMessages.length} messages
            </div>
            
            {/* Refresh Button */}
            <button 
              onClick={loadMessages}
              className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
              title="Refresh messages"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <MessageList 
          messages={allMessages}
          roomId={channelId}
          onMessageUpdate={loadMessages}
          onMessageReply={handleReplyToMessage}
          onMessageReact={handleReactToMessage}
          onMessagePin={handlePinMessage}
          currentUser={user}
        />
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-700 p-4">
        <MessageInput 
          onSendMessage={handleSendMessage}
          onTyping={() => {}} // You can implement typing indicators later
          placeholder={`Message in #${channel?.name || 'channel'}`}
          disabled={!isRoomConnected(channelId, 'channel')}
        />
        
        {/* Connection Status Hint */}
        {!isRoomConnected(channelId, 'channel') && (
          <div className="text-center mt-2">
            <p className="text-yellow-500 text-sm">
              Connecting to channel... Messages may not send until connected.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}