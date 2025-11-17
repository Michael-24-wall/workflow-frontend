import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useWebSocket } from "../contexts/WebSocketContext";
import { messageService } from "../../services/api";
import MessageList from "./chat/MessageList";
import MessageInput from "./MessageInput";

export default function ChannelChat() {
  const { channelId } = useParams();
  const { sendMessage, messages: wsMessages, addMessage } = useWebSocket(); // 🆕 Use WebSocket context
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [localMessages, setLocalMessages] = useState([]); // 🆕 Only use local storage
  const messagesEndRef = useRef(null);
  
  // 🆕 Use ONLY local messages (bypass broken API)
  const allMessages = localMessages;

  // 🆕 Listen for WebSocket messages and add them to local storage
  useEffect(() => {
    if (wsMessages && wsMessages.rooms) {
      const roomMessages = wsMessages.rooms.find(room => room.roomId === channelId);
      if (roomMessages && roomMessages.messages) {
        console.log('🔌 WebSocket messages received:', roomMessages.messages.length);
        
        // Merge WebSocket messages with local messages
        setLocalMessages(prev => {
          const wsMessageIds = new Set(roomMessages.messages.map(m => m.id));
          const existingMessages = prev.filter(msg => !wsMessageIds.has(msg.id));
          const merged = [...existingMessages, ...roomMessages.messages];
          
          // Sort by timestamp
          merged.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
          
          console.log('🔄 Merged messages:', merged.length);
          return merged;
        });
      }
    }
  }, [wsMessages, channelId]);

  useEffect(() => {
    console.log('🚨 CURRENT MESSAGES:', {
      count: allMessages.length,
      messages: allMessages.map(m => ({
        id: m.id,
        type: m.message_type,
        content: m.content?.substring(0, 30),
        file: m.file_name,
        timestamp: m.timestamp
      }))
    });
  }, [allMessages]);

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

  // 🆕 Load initial messages from localStorage only
  const loadInitialMessages = async () => {
    const storageKey = `chat-messages-${channelId}`;
    const savedMessages = localStorage.getItem(storageKey);
    
    if (savedMessages) {
      try {
        const messages = JSON.parse(savedMessages);
        console.log('📂 Loaded messages from localStorage:', messages.length);
        setLocalMessages(messages);
      } catch (error) {
        console.error('❌ Failed to parse saved messages:', error);
        setLocalMessages([]);
      }
    } else {
      console.log('📭 No saved messages found');
      setLocalMessages([]);
    }
    
    // 🆕 Don't even try to load from broken API
    console.log('🚫 Skipping broken API message load');
  };

  const handleSendMessage = async (content, file = null) => {
    try {
      console.log('📤 Sending message:', { 
        channelId, 
        content, 
        hasFile: !!file 
      });
      
      if (file) {
        console.log('📎 Uploading file:', file.name);
        
        try {
          // Upload file
          const uploadResponse = await messageService.uploadFile(file, channelId);
          console.log('✅ File upload response:', uploadResponse);
          
          // 🆕 Create file message from upload response
          const fileMessage = {
            id: uploadResponse.id || `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            content: uploadResponse.content || `📎 ${uploadResponse.file_name}`,
            message_type: uploadResponse.message_type || 'file',
            file_url: uploadResponse.file_url?.startsWith('http') 
              ? uploadResponse.file_url 
              : `http://localhost:9000${uploadResponse.file_url}`,
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
          
          console.log('🎯 File message created:', fileMessage);
          
          // 🆕 Add to local messages immediately
          setLocalMessages(prev => {
            const newMessages = [...prev, fileMessage];
            console.log('📥 Messages after file:', newMessages.length);
            return newMessages;
          });
          
          // 🆕 Try to also send via WebSocket for real-time
          try {
            if (sendMessage) {
              sendMessage({
                type: "chat_message", 
                content: `Uploaded: ${file.name}`,
                channel_id: channelId,
                message_type: "text"
              });
            }
          } catch (wsError) {
            console.log('🔌 WebSocket send failed, continuing...');
          }
          
        } catch (uploadError) {
          console.error('❌ File upload failed:', uploadError);
          
          // 🆕 Create fallback file message even if upload fails
          const fallbackFileMessage = {
            id: `file-fallback-${Date.now()}`,
            content: `📎 ${file.name} (uploading...)`,
            message_type: 'file',
            file_name: file.name,
            file_size: file.size,
            file_type: file.type,
            timestamp: new Date().toISOString(),
            user: {
              id: 1,
              display_name: 'You',
              email: 'user@example.com',
              avatar: null
            },
            is_own_message: true,
            is_uploading: true
          };
          
          setLocalMessages(prev => [...prev, fallbackFileMessage]);
          alert('File upload may have failed, but message was created locally');
        }
        
      } else {
        // Text message
        console.log('📝 Sending text message:', content);
        
        // 🆕 Create optimistic message
        const tempMessage = {
          id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
        
        // 🆕 Add optimistic update immediately
        setLocalMessages(prev => [...prev, tempMessage]);
        
        // 🆕 Try to send via WebSocket (primary) and API (fallback)
        try {
          if (sendMessage) {
            console.log('🔌 Sending via WebSocket...');
            sendMessage({
              type: "chat_message",
              content: content,
              channel_id: channelId,
              message_type: "text"
            });
            console.log('✅ Message sent via WebSocket');
          } else {
            throw new Error('WebSocket not available');
          }
        } catch (wsError) {
          console.log('🔌 WebSocket failed, trying API...', wsError);
          try {
            await messageService.sendChannelMessage(channelId, content);
            console.log('✅ Message sent via API');
          } catch (apiError) {
            console.error('❌ Both WebSocket and API failed:', apiError);
            // Keep the optimistic message anyway
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Send failed:', error);
      alert('Failed to send: ' + error.message);
    }
  };

  // 🆕 Save to localStorage whenever messages change
  useEffect(() => {
    if (allMessages.length > 0) {
      const storageKey = `chat-messages-${channelId}`;
      localStorage.setItem(storageKey, JSON.stringify(allMessages));
      console.log('💾 Saved to localStorage:', allMessages.length, 'messages');
    }
  }, [allMessages, channelId]);

  // 🧪 TEST: Add a visible test file message
  const addTestFileMessage = () => {
    const testFileMessage = {
      id: 'test-file-' + Date.now(),
      content: '📎 TEST FILE - photo1.jpg',
      message_type: 'file',
      file_url: 'http://localhost:9000/media/photo1.jpg',
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
      is_own_message: true
    };
    
    console.log('🧪 Adding TEST file message:', testFileMessage);
    setLocalMessages(prev => [...prev, testFileMessage]);
  };

  // 🧹 Clear all messages
  const clearAllMessages = () => {
    console.log('🧹 Clearing all messages');
    setLocalMessages([]);
    localStorage.removeItem(`chat-messages-${channelId}`);
  };

  // 🔄 Force reload from API (for testing)
  const forceAPILoad = async () => {
    console.log('🔄 Force loading from API...');
    try {
      const messagesData = await messageService.getChannelMessages(channelId, {
        page: 1,
        page_size: 50
      });
      console.log('📡 API Response:', messagesData);
      alert(`API returned: ${JSON.stringify(messagesData).substring(0, 100)}...`);
    } catch (error) {
      console.error('❌ API load failed:', error);
      alert('API load failed: ' + error.message);
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
      {/* Channel header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <div>
              <h1 className="text-white font-semibold"># {channel?.name}</h1>
              <p className="text-gray-400 text-sm">{channel?.topic}</p>
            </div>
            <div className="text-gray-400 text-sm">
              {allMessages.length} messages
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button 
              onClick={addTestFileMessage}
              className="px-3 py-1 bg-blue-600 rounded text-xs hover:bg-blue-500 transition-colors"
            >
              🧪 Test File
            </button>
            <button 
              onClick={forceAPILoad}
              className="px-3 py-1 bg-purple-600 rounded text-xs hover:bg-purple-500 transition-colors"
            >
              🔄 API Test
            </button>
            <button 
              onClick={clearAllMessages}
              className="px-3 py-1 bg-red-600 rounded text-xs hover:bg-red-500 transition-colors"
            >
              🧹 Clear All
            </button>
          </div>
        </div>
      </div>

      {/* Debug info */}
      <div className="bg-yellow-900/20 p-2 border-b border-yellow-700/30">
        <div className="text-xs text-yellow-300 text-center">
          💾 LOCAL STORAGE MODE • {allMessages.length} messages • 
          Files: {allMessages.filter(m => m.message_type === 'file').length} •
          <button 
            onClick={() => console.log('ALL MESSAGES:', allMessages)} 
            className="ml-2 underline"
          >
            Log Messages
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-hidden">
        {allMessages.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-6xl mb-4">💬</div>
              <p>No messages yet</p>
              <p className="text-sm mt-2">Send a message or upload a file to start chatting</p>
              <p className="text-xs text-yellow-500 mt-2">Using local storage (API is broken)</p>
            </div>
          </div>
        )}
        
        <MessageList messages={allMessages} roomId={channelId} />
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="border-t border-gray-700 p-4">
        <MessageInput
          onSendMessage={handleSendMessage}
          onTyping={() => {}}
          placeholder={`Message #${channel?.name || channelId}`}
        />
        
        <div className="mt-2 text-center">
          <p className="text-green-400 text-xs">
            ✅ Local Storage Active • Messages persist through refresh
          </p>
          <p className="text-yellow-400 text-xs mt-1">
            ⚠️ API GET endpoint broken • Using WebSocket + localStorage
          </p>
        </div>
      </div>
    </div>
  );
}