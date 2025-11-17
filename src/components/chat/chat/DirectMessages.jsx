import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useWebSocket } from '../../../contexts/chat/WebSocketContext';
import { useAuth } from '../../../contexts/chat/AuthContext';
import { messageService, dmService } from '../../../services/chat/api';
import Message from './Message';
import MessageInput from './MessageInput';

export default function DirectMessages() {
  const { dmId } = useParams();
  const { user } = useAuth();
  const { sendMessage: sendWsMessage, lastMessage, isConnected } = useWebSocket();
  const [dm, setDm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Load DM data and messages
  useEffect(() => {
    if (dmId) {
      loadDMData();
    }
  }, [dmId]);

  const loadDMData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load DM details
      const dmData = await dmService.getDirectMessages();
      const currentDm = Array.isArray(dmData) 
        ? dmData.find(d => d.id === dmId || d.id === parseInt(dmId))
        : null;

      if (currentDm) {
        setDm(currentDm);
      } else {
        // Create fallback DM data
        const mockDm = {
          id: dmId,
          other_user: {
            id: '2',
            email: 'user@example.com',
            display_name: 'Direct Message User'
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setDm(mockDm);
      }

      // Load messages
      await loadMessages();

    } catch (error) {
      console.error('Failed to load DM data:', error);
      setError('Failed to load conversation');
      // Set fallback data
      const mockDm = {
        id: dmId,
        other_user: {
          id: '2',
          email: 'user@example.com',
          display_name: 'Direct Message User'
        }
      };
      setDm(mockDm);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      const messagesData = await dmService.getDMMessages(dmId, {
        page: 1,
        page_size: 50
      });
      
      // Handle different response formats
      const messagesArray = Array.isArray(messagesData) 
        ? messagesData 
        : (messagesData.results || messagesData.messages || []);
      
      setMessages(messagesArray);
    } catch (error) {
      console.error('Failed to load DM messages:', error);
      setMessages([]);
    }
  };

  // Handle WebSocket messages for real-time updates
  useEffect(() => {
    if (!lastMessage) return;

    console.log('💬 DM WebSocket message:', lastMessage);

    switch (lastMessage.type) {
      case 'direct_message':
        if (lastMessage.dm_id === dmId) {
          setMessages(prev => {
            const exists = prev.some(msg => msg.id === lastMessage.message.id);
            if (!exists) {
              return [...prev, lastMessage.message];
            }
            return prev;
          });
        }
        break;

      case 'message_updated':
        setMessages(prev => prev.map(msg => 
          msg.id === lastMessage.message.id ? lastMessage.message : msg
        ));
        break;

      case 'message_deleted':
        setMessages(prev => prev.filter(msg => msg.id !== lastMessage.message_id));
        break;

      case 'reaction_added':
        if (lastMessage.dm_id === dmId) {
          setMessages(prev => prev.map(msg => {
            if (msg.id === lastMessage.message_id) {
              const updatedReactions = [...(msg.reactions || [])];
              const existingIndex = updatedReactions.findIndex(
                r => r.user_id === lastMessage.user_id && r.reaction_type === lastMessage.reaction_type
              );
              
              if (existingIndex === -1) {
                updatedReactions.push({
                  id: Date.now(),
                  user_id: lastMessage.user_id,
                  reaction_type: lastMessage.reaction_type,
                  created_at: new Date().toISOString()
                });
              }
              
              return { ...msg, reactions: updatedReactions };
            }
            return msg;
          }));
        }
        break;

      case 'reaction_removed':
        if (lastMessage.dm_id === dmId) {
          setMessages(prev => prev.map(msg => {
            if (msg.id === lastMessage.message_id) {
              const updatedReactions = (msg.reactions || []).filter(
                r => !(r.user_id === lastMessage.user_id && r.reaction_type === lastMessage.reaction_type)
              );
              return { ...msg, reactions: updatedReactions };
            }
            return msg;
          }));
        }
        break;

      case 'typing_start':
        // Handle typing indicators
        console.log('User is typing...', lastMessage.user_id);
        break;

      case 'typing_stop':
        // Handle typing stop
        console.log('User stopped typing...', lastMessage.user_id);
        break;
    }
  }, [lastMessage, dmId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (content, file = null) => {
    if ((!content || !content.trim()) && !file) return;

    setSending(true);
    try {
      let messageData;

      if (file) {
        // Upload file - for DMs, we might need to handle this differently
        // Since your API might not support room_id for DMs
        const uploadResult = await messageService.uploadFile(file, null, content || '');
        messageData = uploadResult;
      } else {
        // Send text message to DM
        messageData = await dmService.sendDMMessage(dmId, content);
      }

      // Send via WebSocket for real-time update
      if (sendWsMessage && messageData) {
        sendWsMessage({
          type: 'send_direct_message',
          dm_id: dmId,
          content: content,
          message_type: file ? 'file' : 'text',
          file: file ? {
            name: file.name,
            size: file.size,
            type: file.type
          } : null
        });
      }

      // Optimistically add to local state
      const newMessage = {
        id: `temp-${Date.now()}`,
        content: content,
        user: user,
        created_at: new Date().toISOString(),
        message_type: file ? 'file' : 'text',
        file_url: messageData?.file_url,
        file_name: file?.name,
        file_size: file?.size,
        reactions: [],
        is_temp: true
      };

      setMessages(prev => [...prev, newMessage]);

    } catch (error) {
      console.error('❌ Failed to send message:', error);
      setError('Failed to send message: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  const handleReply = async (messageId, replyContent) => {
    try {
      const replyData = await messageService.replyToMessage(messageId, replyContent);
      
      // Send via WebSocket
      if (sendWsMessage) {
        sendWsMessage({
          type: 'send_direct_message',
          dm_id: dmId,
          content: replyContent,
          message_type: 'text',
          replied_to: messageId
        });
      }

      // Add to local state
      const repliedMessage = messages.find(msg => msg.id === messageId);
      const newMessage = {
        id: `temp-reply-${Date.now()}`,
        content: replyContent,
        user: user,
        created_at: new Date().toISOString(),
        message_type: 'text',
        replied_to: repliedMessage,
        reactions: [],
        is_temp: true
      };

      setMessages(prev => [...prev, newMessage]);

    } catch (error) {
      console.error('❌ Failed to send reply:', error);
      setError('Failed to send reply: ' + error.message);
    }
  };

  const handleReactionUpdate = (messageId, updatedMessage) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, ...updatedMessage } : msg
    ));
  };

  const handlePinMessage = async (messageId) => {
    try {
      const currentMessage = messages.find(msg => msg.id === messageId);
      if (currentMessage?.is_pinned) {
        await messageService.unpinMessage(messageId);
      } else {
        await messageService.pinMessage(messageId);
      }
      // Reload messages to reflect changes
      loadMessages();
    } catch (error) {
      console.error('❌ Failed to pin/unpin message:', error);
      setError('Failed to pin message: ' + error.message);
    }
  };

  const getOtherUser = () => {
    if (!dm) return null;
    
    // Handle different DM response formats
    if (dm.other_user) {
      return dm.other_user;
    } else if (dm.participants && Array.isArray(dm.participants)) {
      return dm.participants.find(p => p.id !== user?.id);
    } else if (dm.users && Array.isArray(dm.users)) {
      return dm.users.find(u => u.id !== user?.id);
    }
    
    return null;
  };

  const otherUser = getOtherUser();

  if (loading) {
    return (
      <div className="flex-1 flex flex-col h-full bg-gray-900">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading conversation...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !dm) {
    return (
      <div className="flex-1 flex flex-col h-full bg-gray-900">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-400 text-lg mb-2">Error</div>
            <p className="text-gray-400">{error}</p>
            <button
              onClick={loadDMData}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {otherUser?.email?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">
              {otherUser?.display_name || otherUser?.email || 'Direct Message'}
            </h1>
            <div className="flex items-center space-x-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <p className="text-gray-400 text-sm">
                {isConnected ? 'Online' : 'Offline'} • {messages.length} messages
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-xl font-semibold mb-2">No messages yet</h3>
              <p>Start a conversation with {otherUser?.display_name || otherUser?.email}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((message, index) => {
              const showAvatar = index === 0 || 
                messages[index - 1]?.user?.id !== message.user?.id;
              
              return (
                <Message
                  key={message.id}
                  message={message}
                  showAvatar={showAvatar}
                  onReply={handleReply}
                  onPin={handlePinMessage}
                  onReactionUpdate={handleReactionUpdate}
                />
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-700 p-4">
        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={sending || !isConnected}
          placeholder={`Message ${otherUser?.display_name || otherUser?.email || 'user'}`}
        />
        
        {!isConnected && (
          <div className="text-center mt-2">
            <p className="text-yellow-500 text-sm">
              🔌 Connecting... Messages may be delayed
            </p>
          </div>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-900 bg-opacity-50 border-t border-red-700 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-red-400">⚠️</span>
              <span className="text-red-200 text-sm">{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-300"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}