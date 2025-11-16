import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useWebSocket } from '../../../contexts/chat/WebSocketContext';
import { roomService, messageService } from '../../../services/chat/api';
import useAuthStore from '../../../stores/authStore'; // Import Zustand store
import MessageList from './MessageList';
import MessageInput from './MessageInput';

export default function ChannelChat() {
  const { channelId } = useParams();
  const { 
    connectToRoom, 
    sendMessage: sendWsMessage, 
    getMessages,
    isRoomConnected 
  } = useWebSocket();
  
  // Use Zustand store instead of useAuth
  const { user } = useAuthStore();
  
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiMessages, setApiMessages] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (channelId) {
      loadRoomData();
      loadMessages();
      connectToRoom(channelId, 'channel');
    }
  }, [channelId]);

  const loadRoomData = async () => {
    try {
      const roomData = await roomService.getRoom(channelId);
      setRoom(roomData);
    } catch (error) {
      console.error('Failed to load room:', error);
      setRoom({ id: channelId, name: `Room ${channelId}` });
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      const messagesData = await roomService.getRoomMessages(channelId, {
        page: 1,
        page_size: 50
      });
      setApiMessages(messagesData.results || messagesData || []);
    } catch (error) {
      console.error('Failed to load messages:', error);
      setApiMessages([]);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [apiMessages]);

  const wsMessages = getMessages(channelId) || [];
  const allMessages = [...apiMessages, ...wsMessages];

  const handleSendMessage = async (content, file = null) => {
    try {
      if (file) {
        await messageService.uploadFile(file, channelId, content || 'Shared a file');
        await loadMessages();
      } else {
        const wsSent = sendWsMessage(channelId, content, 'channel');
        if (!wsSent) {
          await messageService.sendMessage(channelId, content);
          await loadMessages();
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message: ' + error.message);
    }
  };

  const handleReplyToMessage = async (messageId, replyContent) => {
    try {
      await messageService.replyToMessage(messageId, replyContent);
      await loadMessages();
    } catch (error) {
      console.error('Failed to send reply:', error);
      alert('Failed to send reply: ' + error.message);
    }
  };

  const handleReactToMessage = async (messageId, reactionType) => {
    try {
      await messageService.reactToMessage(messageId, reactionType);
      await loadMessages();
    } catch (error) {
      console.error('Failed to react to message:', error);
    }
  };

  const handlePinMessage = async (messageId) => {
    try {
      await messageService.pinMessage(messageId);
      await loadMessages();
    } catch (error) {
      console.error('Failed to pin message:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-900">
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-2 h-2 rounded-full ${
              isRoomConnected(channelId, 'channel') ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <h1 className="text-white font-semibold">
              {room?.name || `Room ${channelId}`}
            </h1>
            <div className="text-gray-400 text-sm">
              {allMessages.length} messages
            </div>
          </div>
          <div className="flex space-x-2">
            {!isRoomConnected(channelId, 'channel') && (
              <div className="text-yellow-500 text-sm">Connecting...</div>
            )}
            <button 
              onClick={loadMessages}
              className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <MessageList 
          messages={allMessages}
          roomId={channelId}
          onMessageUpdate={loadMessages}
          onMessageReply={handleReplyToMessage}
          onMessageReact={handleReactToMessage}
          onMessagePin={handlePinMessage}
          currentUser={user} // Pass user from Zustand
        />
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-gray-700 p-4">
        <MessageInput 
          onSendMessage={handleSendMessage}
          onTyping={() => {}}
          placeholder={`Message in ${room?.name || 'this room'}`}
        />
      </div>
    </div>
  );
}