import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useWebSocket } from '../../../contexts/chat/WebSocketContext';
import useAuthStore from '../../../stores/authStore'; // CHANGED: Use authStore instead of useAuth
import { messageService, dmService } from '../../../services/chat/api';
import Message from './Message';
import MessageInput from './MessageInput';

export default function DirectMessages() {
  const { dmId } = useParams();
  const { user } = useAuthStore(); // CHANGED: Get user from authStore
  const { sendMessage: sendWsMessage, lastMessage, isConnected } = useWebSocket();
  const [dm, setDm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
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

      let currentDm = null;

      // First, try to find existing DM
      try {
        const dmData = await dmService.getDirectMessages();
        currentDm = Array.isArray(dmData) 
          ? dmData.find(d => d.id === parseInt(dmId) || d.id === dmId)
          : null;
      } catch (error) {
        console.error('Failed to fetch DMs:', error);
      }

      if (currentDm) {
        // DM exists, use it
        setDm(currentDm);
        await loadMessages();
      } else {
        // DM doesn't exist, check if dmId is a user ID for new conversation
        const otherUserId = dmId;
        
        if (otherUserId && otherUserId !== user?.id) {
          // Show creating state
          setError('Creating conversation...');
          
          // Create temporary DM for UI
          const tempDm = {
            id: `temp-${dmId}`,
            other_user: {
              id: otherUserId,
              email: 'Loading user...',
              display_name: 'Loading...'
            },
            is_temp: true,
            created_at: new Date().toISOString()
          };
          setDm(tempDm);

          try {
            // Create the actual DM
            const newDm = await dmService.startDirectMessage(otherUserId);
            console.log('✅ Created new DM:', newDm);
            
            // Replace temporary DM with real one
            setDm(newDm);
            setError(null);
            
            // Load messages for the new DM
            await loadMessages();
          } catch (createError) {
            console.error('❌ Failed to create DM:', createError);
            setError('Failed to create conversation. Please try again.');
          }
        } else {
          setError('Invalid conversation');
        }
      }

    } catch (error) {
      console.error('Failed to load DM data:', error);
      setError('Loading conversation...');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (pageNum = 1, append = false) => {
    try {
      const messagesData = await dmService.getDMMessages(dmId, {
        page: pageNum,
        page_size: 50
      });
      
      // Handle different response formats
      const messagesArray = Array.isArray(messagesData) 
        ? messagesData 
        : (messagesData.results || messagesData.messages || []);
      
      if (append) {
        setMessages(prev => [...messagesArray, ...prev]);
      } else {
        setMessages(messagesArray);
      }
      
      // Check if there are more messages
      setHasMore(messagesArray.length === 50);
      setPage(pageNum);
      
    } catch (error) {
      console.error('Failed to load DM messages:', error);
      setMessages([]);
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadMessages(page + 1, true);
    }
  };

  // Handle WebSocket messages for real-time updates
  useEffect(() => {
    if (!lastMessage) return;

    console.log('💬 DM WebSocket message:', lastMessage);

    switch (lastMessage.type) {
      case 'direct_message':
      case 'new_direct_message':
        if (lastMessage.dm_id === dmId || lastMessage.dm_id === parseInt(dmId)) {
          setMessages(prev => {
            const exists = prev.some(msg => msg.id === lastMessage.message?.id);
            if (!exists) {
              return [...prev, lastMessage.message];
            }
            return prev;
          });
        }
        break;

      case 'message_updated':
        setMessages(prev => prev.map(msg => 
          msg.id === lastMessage.message?.id ? lastMessage.message : msg
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
        if (lastMessage.dm_id === dmId && lastMessage.user_id !== user?.id) {
          setTypingUsers(prev => {
            const exists = prev.find(u => u.id === lastMessage.user_id);
            return exists ? prev : [...prev, { 
              id: lastMessage.user_id, 
              name: lastMessage.user_name || 'User' 
            }];
          });
        }
        break;

      case 'typing_stop':
        if (lastMessage.dm_id === dmId) {
          setTypingUsers(prev => prev.filter(u => u.id !== lastMessage.user_id));
        }
        break;

      default:
        console.log('Unhandled WebSocket message type:', lastMessage.type);
    }
  }, [lastMessage, dmId, user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const                     handleSendMessage = async (content, file = null) => {
    if ((!content || !content.trim()) && !file) return;

    setSending(true);
    
    // Create temporary message ID for optimistic update
    const tempId = `temp-${Date.now()}`;
    
    try {
      // Optimistically add to local state
      const tempMessage = {
        id: tempId,
        content: content,
        user: user,
        created_at: new Date().toISOString(),
        message_type: file ? 'file' : 'text',
        file_name: file?.name,
        file_size: file?.size,
        reactions: [],
        is_temp: true,
        sending: true
      };

      setMessages(prev => [...prev, tempMessage]);

      let messageData;

      if (file) {
        // Try DM-specific file upload first, then fallback
        try {
          messageData = await dmService.uploadDMFile(dmId, file);
        } catch (uploadError) {
          console.error('DM file upload failed, trying general method:', uploadError);
          // Fallback to sending as a regular message with file info
          messageData = await dmService.sendDMMessage(
            dmId, 
            content || `File: ${file.name}`
          );
        }
      } else {
        messageData = await dmService.sendDMMessage(dmId, content);
      }

      // Replace temporary message with real one
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? { ...messageData, sending: false, is_temp: false } : msg
      ));

      // WebSocket notification for other user
      if (sendWsMessage && messageData) {
        sendWsMessage({
          type: 'new_direct_message',
          dm_id: dmId,
          message: messageData
        });
      }

      setError(null); // Clear any previous errors

    } catch (error) {
      console.error('❌ Failed to send message:', error);
      
      // Mark message as failed
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? { ...msg, failed: true, sending: false, error: error.message } : msg
      ));
      
      setError('Failed to send message: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  const handleReply = async (messageId, replyContent) => {
    if (!replyContent.trim()) return;

    const tempId = `temp-reply-${Date.now()}`;
    
    try {
      const repliedMessage = messages.find(msg => msg.id === messageId);
      
      // Optimistically add reply
      const tempReply = {
        id: tempId,
        content: replyContent,
        user: user,
        created_at: new Date().toISOString(),
        message_type: 'text',
        reply_to: repliedMessage,
        reactions: [],
        is_temp: true,
        sending: true
      };

      setMessages(prev => [...prev, tempReply]);

      const replyData = await messageService.replyToMessage(messageId, replyContent);
      
      // Replace temporary reply with real one
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? { ...replyData, sending: false, is_temp: false } : msg
      ));

      // WebSocket notification
      if (sendWsMessage) {
        sendWsMessage({
          type: 'new_direct_message',
          dm_id: dmId,
          message: replyData
        });
      }

    } catch (error) {
      console.error('❌ Failed to send reply:', error);
      
      // Mark reply as failed
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? { ...msg, failed: true, sending: false, error: error.message } : msg
      ));
      
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
      await loadMessages();
      setError(null);
    } catch (error) {
      console.error('❌ Failed to pin/unpin message:', error);
      setError('Failed to pin message: ' + error.message);
    }
  };

  const handleRetryMessage = async (messageId) => {
    const failedMessage = messages.find(msg => msg.id === messageId);
    if (!failedMessage) return;
    
    // Remove the failed message
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
    
    // Retry sending
    await handleSendMessage(failedMessage.content);
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
    } else if (dm.user1 && dm.user2) {
      return dm.user1.id === user?.id ? dm.user2 : dm.user1;
    }
    
    return null;
  };

  const getMessageStatus = (message) => {
    if (message.failed) return '❌ Failed';
    if (message.sending) return '🕐 Sending';
    if (message.read_receipts?.length > 0) return '👁️ Read';
    if (message.delivered) return '✅ Delivered';
    return '✅ Sent';
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
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
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
          <div className="flex-1">
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
            {/* Load More Button */}
            {hasMore && (
              <div className="text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm transition-colors disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Load older messages'}
                </button>
              </div>
            )}

            {/* Typing Indicators */}
            {typingUsers.length > 0 && (
              <div className="px-4 py-2">
                <div className="text-gray-400 text-sm italic">
                  {typingUsers.map(u => u.name).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                  <span className="ml-2 animate-pulse">✍️</span>
                </div>
              </div>
            )}

            {/* Messages */}
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
                  onRetry={handleRetryMessage}
                  messageStatus={getMessageStatus(message)}
                  // REMOVED: currentUser={user} - Message will use useAuthStore()
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
          onTypingStart={() => {
            if (sendWsMessage && isConnected) {
              sendWsMessage({
                type: 'typing_start',
                dm_id: dmId,
                user_id: user?.id,
                user_name: user?.display_name || user?.email
              });
            }
          }}
          onTypingStop={() => {
            if (sendWsMessage && isConnected) {
              sendWsMessage({
                type: 'typing_stop', 
                dm_id: dmId,
                user_id: user?.id
              });
            }
          }}
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
              className="text-red-400 hover:text-red-300 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}