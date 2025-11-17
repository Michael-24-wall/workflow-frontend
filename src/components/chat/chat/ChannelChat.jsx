import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useWebSocket } from "../../../contexts/chat/WebSocketContext";
import { messageService } from "../../../services/chat/api";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

export default function ChannelChat() {
  const { channelId } = useParams();
  const { sendMessage } = useWebSocket();
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [localMessages, setLocalMessages] = useState([]);
  const messagesEndRef = useRef(null);
  
  const allMessages = localMessages;

  // 🆕 Function to fix file URLs and handle 404 errors
  const getFixedFileUrl = (fileUrl) => {
    if (!fileUrl) return null;
    
    // If it's already a full URL, return as is
    if (fileUrl.startsWith('http')) {
      return fileUrl;
    }
    
    // If it starts with /media/, make it absolute
    if (fileUrl.startsWith('/media/')) {
      return `http://localhost:9000${fileUrl}`;
    }
    
    // If it's just a filename, construct the URL
    if (fileUrl && !fileUrl.includes('/')) {
      return `http://localhost:9000/media/${fileUrl}`;
    }
    
    return fileUrl;
  };

  // 🚨 DEBUG: Log everything
  useEffect(() => {
    console.log('🔍 DEBUG - ChannelChat State:', {
      channelId,
      loading,
      localMessagesCount: localMessages.length,
      allMessagesCount: allMessages.length,
      localStorage: localStorage.getItem(`chat-messages-${channelId}`)?.length || 0,
      messages: allMessages.map((m, i) => ({
        index: i,
        id: m.id,
        type: m.message_type,
        content: m.content,
        file_name: m.file_name,
        file_url: m.file_url,
        fixed_file_url: getFixedFileUrl(m.file_url), // 🆕 Show fixed URL
        hasUser: !!m.user,
        userDisplayName: m.user?.display_name
      }))
    });
  }, [allMessages, channelId, loading]);

  useEffect(() => {
    loadChannelData();
    loadInitialMessages();
  }, [channelId]);

  const loadChannelData = async () => {
    try {
      setChannel({ 
        id: channelId, 
        name: `channel-${channelId}`,
        topic: "General discussions"
      });
      setLoading(false);
    } catch (error) {
      console.error("Failed to load channel:", error);
      setChannel({ id: channelId, name: `channel-${channelId}` });
      setLoading(false);
    }
  };

  const loadInitialMessages = async () => {
    const storageKey = `chat-messages-${channelId}`;
    const savedMessages = localStorage.getItem(storageKey);
    
    console.log('📂 Loading from localStorage:', {
      storageKey,
      hasData: !!savedMessages,
      dataLength: savedMessages?.length
    });
    
    if (savedMessages) {
      try {
        const messages = JSON.parse(savedMessages);
        console.log('✅ Parsed messages:', messages);
        
        // 🆕 Fix file URLs in loaded messages
        const fixedMessages = messages.map(msg => {
          if (msg.message_type === 'file' && msg.file_url) {
            return {
              ...msg,
              file_url: getFixedFileUrl(msg.file_url)
            };
          }
          return msg;
        });
        
        setLocalMessages(fixedMessages);
      } catch (error) {
        console.error('❌ Failed to parse saved messages:', error);
        console.error('❌ Raw data that failed:', savedMessages);
        setLocalMessages([]);
      }
    } else {
      console.log('📭 No saved messages found');
      setLocalMessages([]);
    }
  };

  // 🆕 Handle reaction to message
  const handleReactToMessage = async (messageId, reactionType) => {
    try {
      console.log('🎯 Adding reaction:', { messageId, reactionType });
      
      const result = await messageService.reactToMessage(messageId, reactionType);
      console.log('✅ Reaction added:', result);
      
      // Update the message with the new reaction
      setLocalMessages(prev => prev.map(msg => {
        if (msg.id === messageId) {
          const existingReactions = msg.reactions || [];
          const hasExistingReaction = existingReactions.find(r => 
            r.user?.id === result.reaction?.user?.id && 
            r.reaction_type === reactionType
          );
          
          if (!hasExistingReaction) {
            return {
              ...msg,
              reactions: [...existingReactions, result.reaction]
            };
          }
        }
        return msg;
      }));
      
    } catch (error) {
      console.error('❌ Failed to add reaction:', error);
    }
  };

  // 🆕 Handle reply to message
  const handleReplyToMessage = async (messageId, replyContent) => {
    try {
      console.log('🎯 Replying to message:', { messageId, replyContent });
      
      const result = await messageService.replyToMessage(messageId, replyContent);
      console.log('✅ Reply sent:', result);
      
      // Add the reply to messages
      if (result) {
        setLocalMessages(prev => [...prev, {
          ...result,
          is_own_message: true,
          replied_to: localMessages.find(m => m.id === messageId)
        }]);
      }
      
    } catch (error) {
      console.error('❌ Failed to send reply:', error);
    }
  };

  // 🆕 Handle pin message
  const handlePinMessage = async (messageId) => {
    try {
      console.log('🎯 Pinning message:', messageId);
      
      const result = await messageService.pinMessage(messageId);
      console.log('✅ Message pinned:', result);
      
      // Update message pinned status
      setLocalMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, is_pinned: true }
          : msg
      ));
      
    } catch (error) {
      console.error('❌ Failed to pin message:', error);
    }
  };

  const handleSendMessage = async (content, file = null) => {
    try {
      console.log('🎯 STARTING SEND MESSAGE:', { content, hasFile: !!file });
      
      if (file) {
        console.log('📎 Starting file upload...');
        
        // Create IMMEDIATE optimistic file message
        const optimisticFileMessage = {
          id: `file-optimistic-${Date.now()}`,
          content: `📎 ${file.name} (uploading...)`,
          message_type: 'file',
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          file_url: null, // 🆕 No URL until upload completes
          timestamp: new Date().toISOString(),
          user: {
            id: 1,
            display_name: 'You',
            email: 'user@example.com',
            avatar: null
          },
          is_own_message: true,
          is_optimistic: true
        };
        
        console.log('➕ Adding optimistic file message:', optimisticFileMessage);
        setLocalMessages(prev => {
          const newMessages = [...prev, optimisticFileMessage];
          console.log('📥 Local messages after optimistic:', newMessages.length);
          return newMessages;
        });

        try {
          // Upload file
          const uploadResponse = await messageService.uploadFile(file, channelId);
          console.log('✅ File upload response:', uploadResponse);
          
          // 🆕 Replace optimistic message with real one (with fixed URL)
          const realFileMessage = {
            id: uploadResponse.id || `file-real-${Date.now()}`,
            content: uploadResponse.content || `📎 ${uploadResponse.file_name}`,
            message_type: uploadResponse.message_type || 'file',
            file_url: getFixedFileUrl(uploadResponse.file_url), // 🆕 Use fixed URL
            file_name: uploadResponse.file_name,
            file_size: uploadResponse.file_size,
            file_type: uploadResponse.file_type,
            timestamp: uploadResponse.timestamp || new Date().toISOString(),
            user: uploadResponse.user || {
              id: 1,
              display_name: 'You',
              email: 'user@example.com',
              avatar: null
            },
            is_own_message: true
          };
          
          console.log('🔄 Replacing with real file message:', realFileMessage);
          setLocalMessages(prev => 
            prev.map(msg => 
              msg.id === optimisticFileMessage.id ? realFileMessage : msg
            )
          );
          
        } catch (uploadError) {
          console.error('❌ File upload failed:', uploadError);
          // Keep the optimistic message but mark as failed
          setLocalMessages(prev => 
            prev.map(msg => 
              msg.id === optimisticFileMessage.id 
                ? { 
                    ...msg, 
                    content: `❌ ${file.name} (upload failed)`,
                    file_url: null 
                  }
                : msg
            )
          );
        }
        
      } else {
        // Text message - create IMMEDIATE optimistic message
        const tempMessage = {
          id: `text-${Date.now()}`,
          content: content,
          message_type: 'text',
          timestamp: new Date().toISOString(),
          user: { 
            id: 1, 
            display_name: 'You',
            email: 'user@example.com',
            avatar: null
          },
          is_own_message: true,
          is_optimistic: true
        };
        
        console.log('➕ Adding optimistic text message:', tempMessage);
        setLocalMessages(prev => {
          const newMessages = [...prev, tempMessage];
          console.log('📥 Local messages after text:', newMessages.length);
          return newMessages;
        });

        // Try to send via API/WebSocket in background
        try {
          if (sendMessage) {
            sendMessage({
              type: "chat_message",
              content: content,
              channel_id: channelId,
              message_type: "text"
            });
          } else {
            await messageService.sendChannelMessage(channelId, content);
          }
          console.log('✅ Message sent to server');
        } catch (error) {
          console.log('⚠️ Background send failed, but message is local');
        }
      }
      
    } catch (error) {
      console.error('❌ Send failed completely:', error);
    }
  };

  // Save to localStorage
  useEffect(() => {
    if (allMessages.length > 0) {
      const storageKey = `chat-messages-${channelId}`;
      const data = JSON.stringify(allMessages);
      localStorage.setItem(storageKey, data);
      console.log('💾 Saved to localStorage:', {
        key: storageKey,
        messageCount: allMessages.length,
        dataSize: data.length
      });
    }
  }, [allMessages, channelId]);

  // 🧪 TEST: Add a SIMPLE test message
  const addSimpleTestMessage = () => {
    const testMessage = {
      id: 'simple-test-' + Date.now(),
      content: '🧪 SIMPLE TEST MESSAGE - Can you see this?',
      message_type: 'text',
      timestamp: new Date().toISOString(),
      user: {
        id: 1,
        display_name: 'Test User',
        email: 'test@example.com',
        avatar: null
      },
      is_own_message: true
    };
    
    console.log('🧪 Adding SIMPLE test message:', testMessage);
    setLocalMessages(prev => [...prev, testMessage]);
  };

  // 🧪 TEST: Add a SIMPLE file message (with proper URL handling)
  const addSimpleFileMessage = () => {
    const testFileMessage = {
      id: 'simple-file-' + Date.now(),
      content: '📎 SIMPLE FILE TEST - photo1.jpg',
      message_type: 'file',
      file_url: getFixedFileUrl('/media/photo1.jpg'), // 🆕 Use fixed URL
      file_name: 'photo1.jpg',
      file_size: 164157,
      file_type: 'image/jpeg',
      timestamp: new Date().toISOString(),
      user: {
        id: 1,
        display_name: 'Test User',
        email: 'test@example.com',
        avatar: null
      },
      is_own_message: true,
      is_test: true // 🆕 Mark as test file
    };
    
    console.log('🧪 Adding SIMPLE file message:', testFileMessage);
    setLocalMessages(prev => [...prev, testFileMessage]);
  };

  // 🧪 TEST: Add a message with reactions
  const addMessageWithReactions = () => {
    const testMessage = {
      id: 'reaction-test-' + Date.now(),
      content: '🧪 TEST MESSAGE WITH REACTIONS - Try reacting to this!',
      message_type: 'text',
      timestamp: new Date().toISOString(),
      user: {
        id: 2,
        display_name: 'Other User',
        email: 'other@example.com',
        avatar: null
      },
      is_own_message: false,
      reactions: [
        {
          id: 1,
          user: {
            id: 1,
            display_name: 'You',
            email: 'user@example.com'
          },
          reaction_type: 'laugh',
          reaction_emoji: '😂',
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          user: {
            id: 3,
            display_name: 'Another User',
            email: 'another@example.com'
          },
          reaction_type: 'thumbs_up',
          reaction_emoji: '👍',
          created_at: new Date().toISOString()
        }
      ]
    };
    
    console.log('🧪 Adding message with reactions:', testMessage);
    setLocalMessages(prev => [...prev, testMessage]);
  };

  // 🧹 Clear all
  const clearAll = () => {
    console.log('🧹 Clearing all messages');
    setLocalMessages([]);
    localStorage.removeItem(`chat-messages-${channelId}`);
  };

  // 📊 Debug current state
  const debugState = () => {
    console.log('📊 CURRENT STATE:', {
      channelId,
      localMessages: localMessages,
      localStorage: localStorage.getItem(`chat-messages-${channelId}`),
      allMessages: allMessages
    });
  };

  // 🆕 Check Django media configuration
  const checkMediaConfig = () => {
    console.log('🔧 Media Configuration Check:');
    console.log('- Expected media URL: http://localhost:9000/media/');
    console.log('- Make sure Django has MEDIA_URL = "/media/"');
    console.log('- Make sure Django has MEDIA_ROOT set correctly');
    console.log('- Make sure urlpatterns include static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT) in development');
    alert('Check browser console for Django media configuration requirements');
  };

  if (loading) {
    return <div className="flex-1 flex items-center justify-center bg-gray-900">Loading...</div>;
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-900">
      {/* Channel header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <h1 className="text-white font-semibold"># {channel?.name}</h1>
            <div className="text-gray-400 text-sm">{allMessages.length} messages</div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button onClick={addSimpleTestMessage} className="px-3 py-1 bg-green-600 rounded text-xs">
              🧪 Test Text
            </button>
            <button onClick={addSimpleFileMessage} className="px-3 py-1 bg-blue-600 rounded text-xs">
              🧪 Test File
            </button>
            <button onClick={addMessageWithReactions} className="px-3 py-1 bg-purple-600 rounded text-xs">
              🧪 Test Reactions
            </button>
            <button onClick={checkMediaConfig} className="px-3 py-1 bg-purple-600 rounded text-xs">
              🔧 Media Config
            </button>
            <button onClick={debugState} className="px-3 py-1 bg-yellow-600 rounded text-xs">
              📊 Debug
            </button>
            <button onClick={clearAll} className="px-3 py-1 bg-red-600 rounded text-xs">
              🧹 Clear
            </button>
          </div>
        </div>
      </div>

      {/* Debug banner */}
      <div className="bg-red-900/20 p-2 border-b border-red-700/30">
        <div className="text-xs text-red-300 text-center">
          🐛 DEBUG MODE • Messages: {allMessages.length} • 
          Files: {allMessages.filter(m => m.message_type === 'file').length} •
          <button onClick={() => console.log('MessageList props:', { messages: allMessages, roomId: channelId })} className="ml-2 underline">
            Log Props
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-hidden">
        {allMessages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-6xl mb-4">💬</div>
              <p>No messages yet</p>
              <p className="text-sm mt-2">Click "Test Text" or "Test File" above</p>
            </div>
          </div>
        ) : (
          <>
            <div className="p-4 bg-green-900/20">
              <div className="text-green-300 text-center text-sm">
                ✅ {allMessages.length} messages in state • 
                Files may show 404 errors (Django media issue)
              </div>
            </div>
            <MessageList 
              messages={allMessages} 
              roomId={channelId}
              onReact={handleReactToMessage}
              onReply={handleReplyToMessage}
              onPin={handlePinMessage}
            />
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="border-t border-gray-700 p-4">
        <MessageInput onSendMessage={handleSendMessage} onTyping={() => {}} />
        
        <div className="mt-2 text-center">
          <p className="text-green-400 text-xs">
            ✅ Messages are displaying! Files may have 404 errors.
          </p>
          <p className="text-yellow-400 text-xs mt-1">
            ⚠️ Django media serving issue - Click "🔧 Media Config" for help
          </p>
        </div>
      </div>
    </div>
  );
}