// src/components/chat/chat/DirectMessages.jsx
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useWebSocket } from "../../../contexts/chat/WebSocketContext";
import { useAuth } from "../../../contexts/chat/AuthContext";
import { dmService, messageService } from "../../../services/chat/api";
import Message from "./Message";
import MessageInput from "./MessageInput";

export default function DirectMessages() {
  const { workspaceId, dmId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    messages, 
    sendMessage, 
    sendTyping, 
    isRoomConnected,
    markAsRead,
    lastMessage 
  } = useWebSocket();

  const [dm, setDm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (dmId && workspaceId) {
      loadDMData();
    }
  }, [dmId, workspaceId]);

  const loadDMData = async () => {
    try {
      setLoading(true);
      setError("");
      console.log(`🔄 Loading DM data for: ${dmId} in workspace: ${workspaceId}`);
      
      // Check authentication
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Authentication required. Please login again.');
      }

      console.log('🔐 Token available, fetching DM details...');
      
      // Load DM details and messages
      const [dmData, messagesData] = await Promise.all([
        dmService.getDirectMessage(dmId),
        messageService.getDMMessages(dmId)
      ]);

      console.log('✅ DM data loaded:', dmData);
      console.log('✅ DM messages loaded:', messagesData);
      
      setDm(dmData);

      // Mark as read via WebSocket
      if (isRoomConnected(workspaceId, 'workspace')) {
        markAsRead('dm', dmId);
      }

    } catch (error) {
      console.error("❌ Failed to load DM:", error);
      setError(error.message || "Failed to load direct messages");
      
      // Handle authentication errors
      if (error.message.includes('401') || error.message.includes('Authentication')) {
        setError("Session expired. Redirecting to login...");
        setTimeout(() => {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          navigate('/login');
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle WebSocket messages for this DM
  useEffect(() => {
    if (!lastMessage || !dmId) return;

    console.log('📨 DM WebSocket message:', lastMessage);

    switch (lastMessage.type) {
      case 'dm_message':
        if (lastMessage.dm_id === parseInt(dmId)) {
          // Message will be automatically added to messages state via WebSocket context
          console.log('✅ New DM message received');
          
          // Mark as read
          if (isRoomConnected(workspaceId, 'workspace')) {
            markAsRead('dm', dmId);
          }
        }
        break;

      case 'message_edited':
        if (lastMessage.dm_id === parseInt(dmId)) {
          console.log('✏️ DM message edited');
        }
        break;

      case 'message_deleted':
        if (lastMessage.dm_id === parseInt(dmId)) {
          console.log('🗑️ DM message deleted');
        }
        break;
    }
  }, [lastMessage, dmId, workspaceId, isRoomConnected, markAsRead]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages[dmId]]);

  const handleSendMessage = async (content, file = null) => {
    try {
      setSending(true);
      console.log(`💬 Sending message to DM ${dmId}:`, content);
      
      if (file) {
        console.log('📁 Uploading file to DM:', file.name);
        await dmService.uploadFile(dmId, file);
      } else {
        // Send via WebSocket for real-time
        await sendMessage({
          room_id: dmId,
          room_type: 'dm',
          content: content,
          reply_to: replyingTo?.id || null
        });
      }

      // Clear reply if set
      if (replyingTo) {
        setReplyingTo(null);
      }

    } catch (error) {
      console.error("❌ Failed to send message:", error);
      setError("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleReply = (message) => {
    setReplyingTo(message);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleEditMessage = async (messageId, newContent) => {
    try {
      await messageService.editMessage(messageId, newContent);
    } catch (error) {
      console.error('Failed to edit message:', error);
      throw error;
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await messageService.deleteMessage(messageId);
    } catch (error) {
      console.error('Failed to delete message:', error);
      throw error;
    }
  };

  const handleReact = async (messageId, reactionType) => {
    try {
      await messageService.addReaction(messageId, reactionType);
    } catch (error) {
      console.error('Failed to add reaction:', error);
      throw error;
    }
  };

  const handleRemoveReaction = async (messageId, reactionType) => {
    try {
      await messageService.removeReaction(messageId, reactionType);
    } catch (error) {
      console.error('Failed to remove reaction:', error);
      throw error;
    }
  };

  const handleRetry = () => {
    loadDMData();
  };

  // Get current DM messages (combine WebSocket and fallback)
  const getCurrentMessages = () => {
    const wsMessages = messages[dmId] || [];
    if (wsMessages.length > 0) return wsMessages;
    
    // Fallback to API messages if WebSocket not populated yet
    return dm?.messages || dm?.recent_messages || [];
  };

  // Get other user info
  const getOtherUser = () => {
    return dm?.other_user || dm?.participants?.find(p => p.id !== user?.id) || {};
  };

  const otherUser = getOtherUser();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading direct messages...</p>
          <p className="text-gray-500 text-sm">DM ID: {dmId}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900">
        <div className="text-center max-w-md mx-4">
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-6">
            <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-white text-lg font-semibold mb-2">Unable to Load Messages</h3>
            <p className="text-red-200 mb-4">{error}</p>
            {!error.includes('Redirecting') && (
              <button
                onClick={handleRetry}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-900 h-full">
      {/* DM Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* User Avatar */}
            <div className="relative">
              {otherUser.profile_picture || otherUser.avatar ? (
                <img 
                  src={otherUser.profile_picture || otherUser.avatar} 
                  alt={otherUser.display_name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {otherUser.display_name?.charAt(0) || otherUser.email?.charAt(0) || 'U'}
                </div>
              )}
              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gray-800 ${
                otherUser.is_online ? 'bg-green-500' : 'bg-gray-500'
              }`}></div>
            </div>

            <div>
              <h1 className="text-white font-semibold text-lg">
                {otherUser.display_name || otherUser.email || 'Unknown User'}
              </h1>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <span>Direct message</span>
                <span>•</span>
                <span className={otherUser.is_online ? 'text-green-400' : 'text-gray-500'}>
                  {otherUser.is_online ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Connection Status */}
            <div className="flex items-center space-x-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${
                isRoomConnected(workspaceId, 'workspace') ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="text-gray-400">
                {isRoomConnected(workspaceId, 'workspace') ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            <button
              onClick={handleRetry}
              className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700 transition-colors"
              title="Refresh messages"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Reply Preview */}
      {replyingTo && (
        <div className="bg-gray-800 border-b border-gray-700 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <span>Replying to</span>
              <span className="text-blue-400">
                {replyingTo.user?.display_name || replyingTo.user?.email || 'User'}
              </span>
            </div>
            <button
              onClick={handleCancelReply}
              className="text-gray-400 hover:text-white text-sm"
            >
              ✕
            </button>
          </div>
          <div className="text-gray-300 text-sm mt-1 truncate">
            {replyingTo.content || 'Message'}
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="space-y-4">
          {getCurrentMessages().map((message, index) => (
            <Message
              key={message.id || `msg-${index}`}
              message={message}
              showAvatar={true}
              onDelete={handleDeleteMessage}
              onEdit={handleEditMessage}
              onReact={handleReact}
              onRemoveReaction={handleRemoveReaction}
              onReply={handleReply}
              onPin={() => console.log('Pin not available in DMs')}
            />
          ))}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-700 p-4">
        <MessageInput
          onSendMessage={handleSendMessage}
          onTyping={(isTyping) => sendTyping(dmId, isTyping, 'dm')}
          disabled={!!error || sending}
          replyingTo={replyingTo}
          onCancelReply={handleCancelReply}
          placeholder={`Message ${otherUser.display_name || otherUser.email || 'user'}`}
        />
      </div>
    </div>
  );
}