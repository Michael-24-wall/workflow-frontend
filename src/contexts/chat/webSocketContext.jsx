// src/contexts/chat/WebSocketContext.jsx
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import useAuthStore from '../../stores/authStore';

const WebSocketContext = createContext();

// Global connection tracking to prevent duplicates across component instances
const globalConnectionState = {
  activeConnections: new Set(),
  pendingConnections: new Set(),
  connectionAttempts: {}
};

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}

export function WebSocketProvider({ children }) {
  const [sockets, setSockets] = useState({});
  const [isConnected, setIsConnected] = useState({});
  const [messages, setMessages] = useState({});
  const [typingUsers, setTypingUsers] = useState({});
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [lastMessage, setLastMessage] = useState(null); // Track last message for components
  
  const { user, isAuthenticated } = useAuthStore();
  
  const socketsRef = useRef({});
  const reconnectTimeoutsRef = useRef({});
  const authCheckTimeoutRef = useRef(null);

  // Debug effect for messages
  useEffect(() => {
    console.log('🔍 WebSocketContext Messages State:', {
      totalRooms: Object.keys(messages).length,
      rooms: Object.keys(messages).map(roomId => ({
        roomId,
        messageCount: messages[roomId]?.length || 0,
        messages: messages[roomId]?.map(m => ({
          id: m.id,
          content: m.content?.substring(0, 30)
        }))
      }))
    });
  }, [messages]);

  // FIXED: Single authentication check with proper cleanup
  useEffect(() => {
    let mounted = true;

    const checkAuthAndSetup = async () => {
      if (!mounted) return;

      // Wait for Zustand store to stabilize
      await new Promise(resolve => setTimeout(resolve, 300));

      const token = localStorage.getItem('access_token');
      const userEmail = localStorage.getItem('user_email');
      
      console.log('🔐 WebSocket Auth Check:', {
        isAuthenticated,
        hasUser: !!user,
        userFromStore: user?.email,
        userFromStorage: userEmail,
        hasToken: !!token
      });

      if (token && (user || userEmail)) {
        console.log('✅ WebSocket: User authenticated');
        if (mounted) {
          setConnectionStatus('ready');
        }
      } else {
        console.log('🚫 WebSocket: User not authenticated');
        if (mounted) {
          disconnectAll();
          setConnectionStatus('disconnected');
        }
      }
    };

    // Clear any existing timeout
    if (authCheckTimeoutRef.current) {
      clearTimeout(authCheckTimeoutRef.current);
    }

    authCheckTimeoutRef.current = setTimeout(checkAuthAndSetup, 100);

    return () => {
      mounted = false;
      if (authCheckTimeoutRef.current) {
        clearTimeout(authCheckTimeoutRef.current);
      }
    };
  }, [user, isAuthenticated]);

  const getAuthToken = () => {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      console.error('❌ No authentication token found for WebSocket');
      return null;
    }
    
    console.log('🔐 WebSocket Token available');
    return token;
  };

  const getCurrentUser = () => {
    if (user) return user;
    
    const userEmail = localStorage.getItem('user_email');
    if (userEmail) {
      return {
        email: userEmail,
        id: localStorage.getItem('user_id') || 'unknown',
        display_name: localStorage.getItem('user_display_name') || userEmail
      };
    }
    
    return null;
  };

  const isUserAuthenticated = () => {
    const token = getAuthToken();
    const currentUser = getCurrentUser();
    return !!(token && currentUser);
  };

  const getWebSocketBaseURL = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:9000';
    return apiUrl.replace(/^http/, 'ws');
  };

  // 🆕 ADD: Helper to extract clean ID from objects or values
  const getCleanId = (idValue) => {
    if (!idValue) return null;
    
    if (typeof idValue === 'object') {
      console.warn('⚠️ ID is an object, extracting ID:', idValue);
      return idValue.id || idValue.workspace_id || idValue.channel_id || idValue.room_id || idValue.dm_id;
    }
    
    return idValue;
  };

  // FIXED: Enhanced connection debouncing
  const canConnect = (key) => {
    const now = Date.now();
    const lastAttempt = globalConnectionState.connectionAttempts[key];
    
    // If there's a recent attempt, debounce (2 second cooldown)
    if (lastAttempt && (now - lastAttempt) < 2000) {
      console.log(`⏳ Debouncing connection to ${key} - too soon`);
      return false;
    }
    
    // If connection is already active or pending, don't create another
    if (globalConnectionState.activeConnections.has(key) || 
        globalConnectionState.pendingConnections.has(key)) {
      console.log(`⏳ Connection to ${key} already active or pending`);
      return false;
    }
    
    globalConnectionState.connectionAttempts[key] = now;
    globalConnectionState.pendingConnections.add(key);
    return true;
  };

  const cleanupSocket = (key) => {
    // Clear reconnect timeout
    if (reconnectTimeoutsRef.current[key]) {
      clearTimeout(reconnectTimeoutsRef.current[key]);
      delete reconnectTimeoutsRef.current[key];
    }

    // Remove from connection tracking
    globalConnectionState.activeConnections.delete(key);
    globalConnectionState.pendingConnections.delete(key);

    // Remove socket reference
    const newSockets = { ...socketsRef.current };
    if (newSockets[key]) {
      delete newSockets[key];
      socketsRef.current = newSockets;
      setSockets(newSockets);
    }

    setIsConnected(prev => ({ ...prev, [key]: false }));
  };

  const scheduleReconnect = (key, url) => {
    if (reconnectTimeoutsRef.current[key]) {
      return;
    }

    console.log(`🔄 Scheduling reconnect for ${key} in 5 seconds...`);
    reconnectTimeoutsRef.current[key] = setTimeout(() => {
      console.log(`🔄 Attempting reconnect for ${key}...`);
      delete reconnectTimeoutsRef.current[key];
      connectWebSocket(url, key);
    }, 5000); // Increased to 5 seconds
  };

  // FIXED: Enhanced message parsing to handle multiple JSON objects
  const parseWebSocketMessage = (rawData) => {
    console.log('📨 RAW WebSocket message received:', rawData);
    
    // Handle multiple JSON objects in one message
    const messages = [];
    
    try {
      // First try to parse as single JSON object
      const singleData = JSON.parse(rawData);
      messages.push(singleData);
      console.log('✅ Parsed as single JSON object');
    } catch (singleError) {
      console.log('⚠️ Single JSON parse failed, trying to handle multiple objects...');
      
      // Try to handle malformed JSON with multiple objects
      try {
        // Look for JSON-like structures
        const jsonMatches = rawData.match(/\{.*?\}/g);
        if (jsonMatches) {
          jsonMatches.forEach(match => {
            try {
              const parsed = JSON.parse(match);
              messages.push(parsed);
            } catch (matchError) {
              console.warn('⚠️ Failed to parse JSON match:', match);
            }
          });
          console.log(`✅ Found ${messages.length} JSON objects in message`);
        } else {
          console.error('❌ No JSON objects found in message');
        }
      } catch (multiError) {
        console.error('❌ Failed to parse WebSocket message:', multiError);
      }
    }
    
    return messages;
  };

  // =============================================================================
  // REAL-TIME REACTION HANDLING
  // =============================================================================

  const handleReactionAdded = (data) => {
    console.log('💖 REACTION ADDED WebSocket message:', data);
    
    const { message_id, reaction_type, user_id, user, dm_id, channel_id } = data;
    
    if (!message_id) {
      console.error('❌ No message_id in reaction data:', data);
      return;
    }

    // Find which room this message belongs to
    const roomId = dm_id || channel_id;
    if (!roomId) {
      console.error('❌ No room ID in reaction data:', data);
      return;
    }

    console.log(`🔄 Updating reaction for message ${message_id} in room ${roomId}`);

    setMessages(prev => {
      const roomMessages = prev[roomId] || [];
      const messageIndex = roomMessages.findIndex(msg => msg.id === message_id);
      
      if (messageIndex === -1) {
        console.warn(`⚠️ Message ${message_id} not found in room ${roomId}`);
        return prev;
      }

      const updatedMessages = [...roomMessages];
      const message = { ...updatedMessages[messageIndex] };
      
      // Initialize reactions array if it doesn't exist
      if (!message.reactions) {
        message.reactions = [];
      }

      // Check if user already has this reaction (avoid duplicates)
      const existingReactionIndex = message.reactions.findIndex(
        r => r.user_id === user_id && r.reaction_type === reaction_type
      );

      if (existingReactionIndex === -1) {
        // Add new reaction
        const newReaction = {
          id: data.reaction_id || `reaction-${Date.now()}`,
          user_id: user_id,
          reaction_type: reaction_type,
          user: user || { id: user_id, email: 'user@example.com' },
          created_at: data.timestamp || new Date().toISOString()
        };
        
        message.reactions.push(newReaction);
        console.log(`➕ Added reaction: ${reaction_type} by user ${user_id}`);
      } else {
        console.log(`⚠️ Reaction already exists: ${reaction_type} by user ${user_id}`);
      }

      updatedMessages[messageIndex] = message;
      
      return {
        ...prev,
        [roomId]: updatedMessages
      };
    });

    // Notify components about the reaction update
    setLastMessage({
      type: 'reaction_added',
      message_id,
      reaction_type,
      user_id,
      dm_id,
      channel_id,
      timestamp: new Date().toISOString()
    });
  };

  const handleReactionRemoved = (data) => {
    console.log('🗑️ REACTION REMOVED WebSocket message:', data);
    
    const { message_id, reaction_type, user_id, dm_id, channel_id } = data;
    
    if (!message_id) {
      console.error('❌ No message_id in reaction removal data:', data);
      return;
    }

    const roomId = dm_id || channel_id;
    if (!roomId) {
      console.error('❌ No room ID in reaction removal data:', data);
      return;
    }

    console.log(`🔄 Removing reaction from message ${message_id} in room ${roomId}`);

    setMessages(prev => {
      const roomMessages = prev[roomId] || [];
      const messageIndex = roomMessages.findIndex(msg => msg.id === message_id);
      
      if (messageIndex === -1) {
        console.warn(`⚠️ Message ${message_id} not found in room ${roomId}`);
        return prev;
      }

      const updatedMessages = [...roomMessages];
      const message = { ...updatedMessages[messageIndex] };
      
      if (!message.reactions) {
        console.warn(`⚠️ No reactions found for message ${message_id}`);
        return prev;
      }

      // Remove the specific reaction
      message.reactions = message.reactions.filter(
        r => !(r.user_id === user_id && r.reaction_type === reaction_type)
      );

      console.log(`➖ Removed reaction: ${reaction_type} by user ${user_id}`);

      updatedMessages[messageIndex] = message;
      
      return {
        ...prev,
        [roomId]: updatedMessages
      };
    });

    // Notify components about the reaction removal
    setLastMessage({
      type: 'reaction_removed',
      message_id,
      reaction_type,
      user_id,
      dm_id,
      channel_id,
      timestamp: new Date().toISOString()
    });
  };

  // =============================================================================
  // WEBSOCKET CONNECTION
  // =============================================================================

  // FIXED: Enhanced WebSocket connection with better resource management
  const connectWebSocket = (url, key) => {
    // Enhanced authentication check
    if (!isUserAuthenticated()) {
      console.error('❌ Cannot connect WebSocket - user not authenticated');
      globalConnectionState.pendingConnections.delete(key);
      return null;
    }

    // Connection debouncing check
    if (!canConnect(key)) {
      return null;
    }

    const token = getAuthToken();
    const currentUser = getCurrentUser();

    // Close existing connection if any
    if (socketsRef.current[key]) {
      console.log(`🔄 Replacing existing WebSocket connection: ${key}`);
      try {
        socketsRef.current[key].close(1000, 'Reconnecting');
      } catch (error) {
        console.warn('Error closing existing socket:', error);
      }
    }

    try {
      console.log(`🔌 Creating WebSocket connection to: ${url}`);
      
      // Add token to URL for Django Channels authentication
      const wsUrl = `${url}?token=${encodeURIComponent(token)}`;
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log(`✅ WebSocket connected successfully: ${key}`);
        
        // Update connection tracking
        globalConnectionState.pendingConnections.delete(key);
        globalConnectionState.activeConnections.add(key);
        
        setIsConnected(prev => ({ ...prev, [key]: true }));
        setConnectionStatus('connected');
        
        // Clear any pending reconnect
        if (reconnectTimeoutsRef.current[key]) {
          clearTimeout(reconnectTimeoutsRef.current[key]);
          delete reconnectTimeoutsRef.current[key];
        }

        // 🚨 REMOVED: Authentication message sending - server authenticates via URL token
        console.log('🔐 Authentication handled via URL token, no need for authenticate message');
      };

      ws.onmessage = (event) => {
        try {
          console.log('🚨 INCOMING WEBSOCKET MESSAGE:', {
            rawData: event.data,
            length: event.data.length,
            type: typeof event.data
          });
          
          // Use enhanced message parsing
          const messageDataArray = parseWebSocketMessage(event.data);
          
          console.log(`🔄 Processing ${messageDataArray.length} parsed messages`);
          
          // Process each parsed message
          messageDataArray.forEach((data, index) => {
            if (!data || typeof data !== 'object') {
              console.log(`❌ [${index}] Invalid message data:`, data);
              return;
            }
            
            console.log(`📦 [${index}] Processing parsed message:`, {
              type: data.type,
              hasContent: !!data.content,
              content: data.content,
              hasMessage: !!data.message,
              roomId: data.room_id || data.channel_id || data.room,
              fullData: data
            });
            
            // FIXED: Handle different message types including chat messages
            switch (data.type) {
              case 'new_message':
              case 'message_created':
              case 'chat_message':
                console.log('💬 🚨 CHAT MESSAGE RECEIVED - STORING:', data);
                // FIXED: Handle both wrapped and direct message formats
                if (data.message) {
                  // Django sends: {'type': 'chat_message', 'message': {message_data}}
                  handleNewMessage(data.message);
                } else {
                  // Direct message format
                  handleNewMessage(data);
                }
                break;
                
              // =============================================================================
              // REAL-TIME REACTION HANDLING
              // =============================================================================
              case 'reaction_added':
              case 'message_reacted':
                console.log('💖 REACTION WebSocket message received');
                handleReactionAdded(data);
                break;

              case 'reaction_removed':
              case 'message_unreacted':
                console.log('🗑️ REACTION REMOVAL WebSocket message received');
                handleReactionRemoved(data);
                break;

              case 'user_typing':
              case 'typing_indicator':
                console.log('⌨️ Handling typing indicator:', data);
                setTypingUsers(prev => ({
                  ...prev,
                  [data.room_id]: data.users || [data.user]
                }));
                break;

              case 'error':
                console.error('❌ WebSocket error:', data.message);
                // 🚨 REMOVED: Specific authentication error handling since we're not sending auth messages
                break;

              case 'ping':
                console.log('🏓 Ping received, sending pong');
                ws.send(JSON.stringify({ type: 'pong' }));
                break;

              case 'user_joined':
                console.log(`👤 User joined: ${data.user_id}`);
                break;

              case 'user_left':
                console.log(`👤 User left: ${data.user_id}`);
                break;

              case 'welcome':
                console.log('👋 WebSocket welcome message');
                break;

              case 'user_presence':
                console.log('👤 User presence update:', data);
                break;

              case 'connection_established':
                console.log('✅ WebSocket connection confirmed:', data);
                break;

              case 'message_sent':
                console.log('✅ Message delivery confirmed:', data);
                break;

              default:
                console.log('📨 Unknown message type:', data.type);
                // FIXED: Try to handle it as a message anyway if it has content
                if (data.content || data.message) {
                  console.log('💬 Treating as chat message (no type):', data);
                  handleNewMessage(data);
                }
            }
          });
        } catch (error) {
          console.error('❌ Error processing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log(`🔌 WebSocket disconnected: ${key}`, {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean
        });
        
        // Update connection tracking
        globalConnectionState.activeConnections.delete(key);
        globalConnectionState.pendingConnections.delete(key);
        
        setIsConnected(prev => ({ ...prev, [key]: false }));
        setConnectionStatus('disconnected');
        
        // Only attempt reconnect for unexpected disconnects
        if (event.code !== 1000 && event.code !== 1001 && event.code !== 1008) {
          console.log(`🔄 Unexpected disconnect, will attempt reconnect for: ${key}`);
          scheduleReconnect(key, url);
        }
        
        cleanupSocket(key);
      };

      ws.onerror = (error) => {
        console.error(`❌ WebSocket error (${key}):`, error);
        
        // Update connection tracking
        globalConnectionState.pendingConnections.delete(key);
        
        setIsConnected(prev => ({ ...prev, [key]: false }));
        setConnectionStatus('error');
      };

      // Store socket
      socketsRef.current = { ...socketsRef.current, [key]: ws };
      setSockets(prev => ({ ...prev, [key]: ws }));

      return ws;

    } catch (error) {
      console.error('❌ Failed to create WebSocket connection:', error);
      
      // Update connection tracking
      globalConnectionState.pendingConnections.delete(key);
      
      scheduleReconnect(key, url);
      return null;
    }
  };

  // FIXED: Enhanced message handling to properly store messages
  const handleNewMessage = (data) => {
    console.log('💬 Processing new message for storage:', data);
    
    // Extract room ID from different possible fields
    const roomId = data.room_id || data.channel_id || data.channel || data.room;
    
    if (!roomId) {
      console.error('❌ No room ID in message:', data);
      return;
    }

    // Extract message data from different possible structures
    const messageData = data.message || data;
    
    // Create proper message object
    const message = {
      id: messageData.id || `ws-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: messageData.content || data.content,
      user_id: messageData.user_id || data.user_id,
      user_email: messageData.user_email || data.user_email,
      user: messageData.user || {
        id: messageData.user_id || data.user_id,
        email: messageData.user_email || data.user_email,
        display_name: messageData.display_name || data.display_name || messageData.username || 'User'
      },
      timestamp: messageData.timestamp || data.timestamp || new Date().toISOString(),
      message_type: messageData.message_type || 'text',
      is_edited: messageData.is_edited || false,
      reactions: messageData.reactions || [],
      reply_to: messageData.reply_to || null
    };

    console.log('💾 Storing message for room:', roomId, message);

    // Store the message
    setMessages(prev => {
      const existingMessages = prev[roomId] || [];
      
      // Check if message already exists (avoid duplicates)
      const messageExists = existingMessages.some(msg => 
        msg.id === message.id || 
        (msg.content === message.content && msg.timestamp === message.timestamp)
      );
      
      if (messageExists) {
        console.log('⚠️ Message already exists, skipping:', message.id);
        return prev;
      }

      const updatedMessages = {
        ...prev,
        [roomId]: [...existingMessages, message]
      };
      
      console.log(`📊 Messages for room ${roomId}:`, updatedMessages[roomId].length);
      return updatedMessages;
    });

    // Notify components about the new message
    setLastMessage({
      type: 'new_message',
      message,
      roomId,
      timestamp: new Date().toISOString()
    });
  };

  // =============================================================================
  // WEBSOCKET CONNECTION METHODS
  // =============================================================================

  // Connect to workspace chat - MATCH: ws/workspace/(?P<workspace_id>[0-9a-f-]+)/$
  const connectToWorkspace = (workspaceId) => {
    const cleanWorkspaceId = getCleanId(workspaceId);
    if (!cleanWorkspaceId) {
      console.error('❌ Invalid workspace ID:', workspaceId);
      return null;
    }
    
    const key = `workspace_${cleanWorkspaceId}`;
    const baseUrl = getWebSocketBaseURL();
    const url = `${baseUrl}/ws/workspace/${cleanWorkspaceId}/`;
    
    console.log(`🔌 Requesting workspace WebSocket: ${url}`);
    return connectWebSocket(url, key);
  };

  // Connect to specific channel - MATCH: ws/channel/(?P<channel_id>[0-9a-f-]+)/$
  const connectToChannel = (channelId) => {
    const cleanChannelId = getCleanId(channelId);
    if (!cleanChannelId) {
      console.error('❌ Invalid channel ID:', channelId);
      return null;
    }
    
    const key = `channel_${cleanChannelId}`;
    const baseUrl = getWebSocketBaseURL();
    const url = `${baseUrl}/ws/channel/${cleanChannelId}/`;
    
    console.log(`🔌 Requesting channel WebSocket: ${url}`);
    return connectWebSocket(url, key);
  };

  // Connect to DM - MATCH: ws/dm/(?P<dm_id>[0-9a-f-]+)/$
  const connectToDM = (dmId) => {
    const cleanDmId = getCleanId(dmId);
    if (!cleanDmId) {
      console.error('❌ Invalid DM ID:', dmId);
      return null;
    }
    
    const key = `dm_${cleanDmId}`;
    const baseUrl = getWebSocketBaseURL();
    const url = `${baseUrl}/ws/dm/${cleanDmId}/`;
    
    console.log(`🔌 Requesting DM WebSocket: ${url}`);
    return connectWebSocket(url, key);
  };

  // Connect to notifications - MATCH: ws/notifications/$
  const connectToNotifications = () => {
    const key = 'notifications';
    const baseUrl = getWebSocketBaseURL();
    const url = `${baseUrl}/ws/notifications/`;
    
    console.log(`🔌 Requesting notifications WebSocket: ${url}`);
    return connectWebSocket(url, key);
  };

  // Connect to legacy chat rooms - MATCH: ws/chat/(?P<room_name>\w+)/$
  const connectToChatRoom = (roomName) => {
    const cleanRoomName = getCleanId(roomName);
    if (!cleanRoomName) {
      console.error('❌ Invalid room name:', roomName);
      return null;
    }
    
    const key = `chat_${cleanRoomName}`;
    const baseUrl = getWebSocketBaseURL();
    const url = `${baseUrl}/ws/chat/${cleanRoomName}/`;
    
    console.log(`🔌 Requesting chat room WebSocket: ${url}`);
    return connectWebSocket(url, key);
  };

  // Generic connect function
  const connect = (roomId, roomType = 'workspace') => {
    const cleanRoomId = getCleanId(roomId);
    if (!cleanRoomId) {
      console.error('❌ Invalid room ID:', roomId);
      return null;
    }
    
    switch (roomType) {
      case 'workspace':
        return connectToWorkspace(cleanRoomId);
      case 'channel':
        return connectToChannel(cleanRoomId);
      case 'dm':
        return connectToDM(cleanRoomId);
      case 'notifications':
        return connectToNotifications();
      case 'chat':
        return connectToChatRoom(cleanRoomId);
      default:
        console.error(`❌ Unknown room type: ${roomType}`);
        return null;
    }
  };

  // 🔧 FIXED: Send message to specific room with proper ID handling
  const sendMessage = (roomId, content, roomType = 'workspace') => {
    // 🆕 FIX: Use the helper to get clean ID
    const cleanRoomId = getCleanId(roomId);
    
    if (!cleanRoomId) {
      console.error('❌ Invalid room ID for sending message:', roomId);
      return false;
    }
    
    const key = `${roomType}_${cleanRoomId}`;
    const socket = socketsRef.current[key];
    
    console.log('🔍 sendMessage debug:', {
      originalRoomId: roomId,
      cleanRoomId: cleanRoomId,
      roomType: roomType,
      key: key,
      socketExists: !!socket,
      isConnected: isConnected[key]
    });
    
    if (socket && isConnected[key]) {
      const currentUser = getCurrentUser();
      const message = {
        type: 'chat_message',
        room_id: cleanRoomId,
        room_type: roomType,
        content: content,
        timestamp: new Date().toISOString(),
        user_id: currentUser?.id,
        user_email: currentUser?.email
      };
      console.log('📤 Sending message:', message);
      socket.send(JSON.stringify(message));
      return true;
    } else {
      console.error(`❌ Cannot send message - WebSocket not connected: ${key}`);
      return false;
    }
  };

  // Send reaction to specific message
  const sendReaction = (roomId, messageId, reactionType, roomType = 'workspace') => {
    const cleanRoomId = getCleanId(roomId);
    if (!cleanRoomId) {
      console.error('❌ Invalid room ID for reaction:', roomId);
      return false;
    }
    
    const key = `${roomType}_${cleanRoomId}`;
    const socket = socketsRef.current[key];
    
    if (socket && isConnected[key]) {
      const currentUser = getCurrentUser();
      const reactionMessage = {
        type: 'add_reaction',
        room_id: cleanRoomId,
        room_type: roomType,
        message_id: messageId,
        reaction_type: reactionType,
        user_id: currentUser?.id,
        user_email: currentUser?.email,
        timestamp: new Date().toISOString()
      };
      console.log('💖 Sending reaction via WebSocket:', reactionMessage);
      socket.send(JSON.stringify(reactionMessage));
      return true;
    } else {
      console.error(`❌ Cannot send reaction - WebSocket not connected: ${key}`);
      return false;
    }
  };

  // Remove reaction from specific message
  const removeReaction = (roomId, messageId, reactionType, roomType = 'workspace') => {
    const cleanRoomId = getCleanId(roomId);
    if (!cleanRoomId) {
      console.error('❌ Invalid room ID for reaction removal:', roomId);
      return false;
    }
    
    const key = `${roomType}_${cleanRoomId}`;
    const socket = socketsRef.current[key];
    
    if (socket && isConnected[key]) {
      const currentUser = getCurrentUser();
      const reactionMessage = {
        type: 'remove_reaction',
        room_id: cleanRoomId,
        room_type: roomType,
        message_id: messageId,
        reaction_type: reactionType,
        user_id: currentUser?.id,
        user_email: currentUser?.email,
        timestamp: new Date().toISOString()
      };
      console.log('🗑️ Removing reaction via WebSocket:', reactionMessage);
      socket.send(JSON.stringify(reactionMessage));
      return true;
    } else {
      console.error(`❌ Cannot remove reaction - WebSocket not connected: ${key}`);
      return false;
    }
  };

  // Send typing indicator
  const sendTyping = (roomId, isTyping, roomType = 'workspace') => {
    const cleanRoomId = getCleanId(roomId);
    if (!cleanRoomId) {
      console.error('❌ Invalid room ID for typing:', roomId);
      return;
    }
    
    const key = `${roomType}_${cleanRoomId}`;
    const socket = socketsRef.current[key];
    
    if (socket && isConnected[key]) {
      const currentUser = getCurrentUser();
      const typingMessage = {
        type: 'typing',
        room_id: cleanRoomId,
        room_type: roomType,
        is_typing: isTyping,
        user_id: currentUser?.id,
        user_email: currentUser?.email
      };
      console.log('⌨️ Sending typing indicator:', typingMessage);
      socket.send(JSON.stringify(typingMessage));
    } else {
      console.warn(`⚠️ Cannot send typing - WebSocket not connected: ${key}`);
    }
  };

  // Get messages for a specific room
  const getMessages = (roomId) => {
    const roomMessages = messages[roomId] || [];
    console.log(`📨 Getting ${roomMessages.length} messages for room ${roomId}`);
    return roomMessages;
  };

  // Get typing users for a specific room
  const getTypingUsers = (roomId) => {
    return typingUsers[roomId] || [];
  };

  // Check if connected to a specific room
  const isRoomConnected = (roomId, roomType = 'workspace') => {
    const cleanRoomId = getCleanId(roomId);
    if (!cleanRoomId) return false;
    
    const key = `${roomType}_${cleanRoomId}`;
    return !!isConnected[key];
  };

  const disconnect = (key) => {
    if (socketsRef.current[key]) {
      console.log(`🔌 Manually disconnecting WebSocket: ${key}`);
      socketsRef.current[key].close(1000, 'Manual disconnect');
      cleanupSocket(key);
    }
  };

  const disconnectAll = () => {
    console.log('🔌 Disconnecting all WebSocket connections');
    
    // Close all active WebSocket connections
    Object.keys(socketsRef.current).forEach(key => {
      if (socketsRef.current[key]) {
        try {
          socketsRef.current[key].close(1000, 'Manual disconnect');
        } catch (error) {
          console.warn(`Error closing socket ${key}:`, error);
        }
      }
    });
    
    // Clear all reconnection timeouts
    Object.values(reconnectTimeoutsRef.current).forEach(timeout => {
      clearTimeout(timeout);
    });
    reconnectTimeoutsRef.current = {};
    
    // Reset all state
    globalConnectionState.activeConnections.clear();
    globalConnectionState.pendingConnections.clear();
    globalConnectionState.connectionAttempts = {};
    
    socketsRef.current = {};
    setSockets({});
    setIsConnected({});
    setConnectionStatus('disconnected');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 WebSocketProvider unmounting, cleaning up...');
      if (authCheckTimeoutRef.current) {
        clearTimeout(authCheckTimeoutRef.current);
      }
      disconnectAll();
    };
  }, []);

  const value = {
    // Connection management
    sockets,
    isConnected,
    connectionStatus,
    
    // Data
    messages,
    typingUsers,
    lastMessage, // Add lastMessage to context
    getMessages,
    getTypingUsers,
    
    // Connection methods
    connect,
    connectToWorkspace,
    connectToChannel,
    connectToDM,
    connectToNotifications,
    connectToChatRoom,
    isRoomConnected,
    
    // Messaging methods
    sendMessage,
    sendTyping,
    
    // Reaction methods
    sendReaction,
    removeReaction,
    
    // Disconnection methods
    disconnect,
    disconnectAll,
    
    // Utility methods
    isUserAuthenticated,
    getCurrentUser
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}