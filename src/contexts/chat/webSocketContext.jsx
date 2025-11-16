import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import useAuthStore from '../../stores/authStore'; // Correct path to your Zustand store

const WebSocketContext = createContext();

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
  
  // Use Zustand store from src/stores/
  const { user, isAuthenticated } = useAuthStore();
  
  const socketsRef = useRef({});
  const reconnectTimeoutsRef = useRef({});

  // Auto-reconnect when user authentication changes
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('👤 User authenticated, ready for WebSocket connections');
    } else {
      console.log('👤 User not authenticated, disconnecting WebSockets');
      disconnectAll();
    }
  }, [user, isAuthenticated]);

  const getAuthToken = () => {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      console.error('❌ No authentication token found for WebSocket');
      return null;
    }
    
    console.log('🔐 Using token for WebSocket:', token.substring(0, 20) + '...');
    return token;
  };

  const cleanupSocket = (key) => {
    // Clear reconnect timeout
    if (reconnectTimeoutsRef.current[key]) {
      clearTimeout(reconnectTimeoutsRef.current[key]);
      delete reconnectTimeoutsRef.current[key];
    }

    // Clean up socket references
    const newSockets = { ...socketsRef.current };
    if (newSockets[key]) {
      delete newSockets[key];
      socketsRef.current = newSockets;
      setSockets(newSockets);
    }

    setIsConnected(prev => ({ ...prev, [key]: false }));
  };

  const scheduleReconnect = (key, url) => {
    // Don't schedule multiple reconnects
    if (reconnectTimeoutsRef.current[key]) {
      return;
    }

    console.log(`🔄 Scheduling reconnect for ${key} in 3 seconds...`);
    reconnectTimeoutsRef.current[key] = setTimeout(() => {
      console.log(`🔄 Attempting reconnect for ${key}...`);
      connectWebSocket(url, key);
    }, 3000);
  };

  const connectWebSocket = (url, key) => {
    // Check authentication first using Zustand
    if (!isAuthenticated || !user) {
      console.log('🚫 Cannot connect WebSocket - user not authenticated');
      return null;
    }

    const token = getAuthToken();
    if (!token) {
      console.error('❌ Cannot connect WebSocket - no token available');
      return null;
    }

    // Close existing connection if any
    if (socketsRef.current[key]) {
      console.log(`🔄 Replacing existing WebSocket connection: ${key}`);
      socketsRef.current[key].close(1000, 'Reconnecting');
    }

    try {
      console.log(`🔌 Creating WebSocket connection to: ${url}`);
      const ws = new WebSocket(url);
      
      ws.onopen = () => {
        console.log(`✅ WebSocket connected successfully: ${key}`);
        setIsConnected(prev => ({ ...prev, [key]: true }));
        setConnectionStatus('connected');
        
        // Clear any pending reconnect
        if (reconnectTimeoutsRef.current[key]) {
          clearTimeout(reconnectTimeoutsRef.current[key]);
          delete reconnectTimeoutsRef.current[key];
        }

        // Send authentication immediately after connection
        const authMessage = {
          type: 'authenticate',
          token: token
        };
        console.log('🔐 Sending WebSocket authentication...');
        ws.send(JSON.stringify(authMessage));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 WebSocket message received:', data);
          
          switch (data.type) {
            case 'new_message':
              handleNewMessage(data);
              break;
              
            case 'message_created':
              handleNewMessage(data);
              break;
              
            case 'user_typing':
              setTypingUsers(prev => ({
                ...prev,
                [data.room_id]: data.users || [data.user]
              }));
              break;
              
            case 'typing_indicator':
              setTypingUsers(prev => ({
                ...prev,
                [data.room_id]: data.users || [data.user]
              }));
              break;

            case 'error':
              console.error('WebSocket error:', data.message);
              if (data.message.includes('auth') || data.message.includes('token')) {
                console.error('🔐 Authentication error, closing connection');
                ws.close(1008, 'Authentication failed');
              }
              break;
              
            case 'authentication_result':
              if (data.success) {
                console.log('✅ WebSocket authentication successful');
              } else {
                console.error('❌ WebSocket authentication failed:', data.message);
                ws.close(1008, 'Authentication failed');
              }
              break;

            case 'ping':
              // Respond to ping with pong
              ws.send(JSON.stringify({ type: 'pong' }));
              break;

            case 'user_joined':
              console.log(`👤 User joined: ${data.user} in room ${data.room_id}`);
              break;

            case 'user_left':
              console.log(`👤 User left: ${data.user} from room ${data.room_id}`);
              break;

            default:
              console.log('📨 Unknown message type:', data.type, data);
          }
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error, event.data);
        }
      };

      ws.onclose = (event) => {
        console.log(`🔌 WebSocket disconnected: ${key}`, {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean
        });
        
        setIsConnected(prev => ({ ...prev, [key]: false }));
        
        // Only reconnect for unexpected closures (not manual disconnects)
        if (event.code !== 1000 && event.code !== 1001) {
          console.log(`🔄 Unexpected disconnect, will attempt reconnect for: ${key}`);
          scheduleReconnect(key, url);
        }
        
        cleanupSocket(key);
      };

      ws.onerror = (error) => {
        console.error(`❌ WebSocket error (${key}):`, error);
        setIsConnected(prev => ({ ...prev, [key]: false }));
        setConnectionStatus('error');
      };

      // Store socket
      socketsRef.current = { ...socketsRef.current, [key]: ws };
      setSockets(prev => ({ ...prev, [key]: ws }));

      return ws;

    } catch (error) {
      console.error('❌ Failed to create WebSocket connection:', error);
      scheduleReconnect(key, url);
      return null;
    }
  };

  const handleNewMessage = (data) => {
    const roomId = data.room_id || data.channel_id || data.dm_id;
    const message = data.message || data;
    
    if (!roomId) {
      console.error('❌ No room ID in message:', data);
      return;
    }

    setMessages(prev => ({
      ...prev,
      [roomId]: [...(prev[roomId] || []), message]
    }));
  };

  // Connect to specific workspace
  const connectToWorkspace = (workspaceId) => {
    const key = `workspace_${workspaceId}`;
    const url = `ws://localhost:9000/ws/workspace/${workspaceId}/`;
    return connectWebSocket(url, key);
  };

  // Connect to specific room (channels, DMs, etc.)
  const connectToRoom = (roomId, roomType = 'room') => {
    const key = `${roomType}_${roomId}`;
    const url = `ws://localhost:9000/ws/${roomType}/${roomId}/`;
    return connectWebSocket(url, key);
  };

  // Connect to specific channel
  const connectToChannel = (channelId) => {
    return connectToRoom(channelId, 'channel');
  };

  // Connect to DM
  const connectToDM = (dmId) => {
    return connectToRoom(dmId, 'dm');
  };

  // Connect to notifications
  const connectToNotifications = () => {
    const key = 'notifications';
    const url = 'ws://localhost:9000/ws/notifications/';
    return connectWebSocket(url, key);
  };

  // Send message to specific room
  const sendMessage = (roomId, content, roomType = 'room') => {
    const key = `${roomType}_${roomId}`;
    const socket = socketsRef.current[key];
    
    if (socket && isConnected[key]) {
      const message = {
        type: 'send_message',
        room_id: roomId,
        room_type: roomType,
        content: content,
        timestamp: new Date().toISOString()
      };
      console.log('📤 Sending message:', message);
      socket.send(JSON.stringify(message));
      return true;
    } else {
      console.error(`❌ Cannot send message - WebSocket not connected: ${key}`);
      return false;
    }
  };

  // Send typing indicator
  const sendTyping = (roomId, isTyping, roomType = 'room') => {
    const key = `${roomType}_${roomId}`;
    const socket = socketsRef.current[key];
    
    if (socket && isConnected[key]) {
      const typingMessage = {
        type: 'typing',
        room_id: roomId,
        room_type: roomType,
        is_typing: isTyping,
        user_id: user?.id
      };
      socket.send(JSON.stringify(typingMessage));
    }
  };

  // Get messages for a specific room
  const getMessages = (roomId) => {
    return messages[roomId] || [];
  };

  // Get typing users for a specific room
  const getTypingUsers = (roomId) => {
    return typingUsers[roomId] || [];
  };

  // Check if connected to a specific room
  const isRoomConnected = (roomId, roomType = 'room') => {
    const key = `${roomType}_${roomId}`;
    return !!isConnected[key];
  };

  const disconnect = (key) => {
    if (socketsRef.current[key]) {
      socketsRef.current[key].close(1000, 'Manual disconnect');
      cleanupSocket(key);
    }
  };

  const disconnectAll = () => {
    console.log('🔌 Disconnecting all WebSocket connections');
    Object.keys(socketsRef.current).forEach(key => {
      if (socketsRef.current[key]) {
        socketsRef.current[key].close(1000, 'Manual disconnect');
      }
    });
    
    // Clear all reconnection timeouts
    Object.values(reconnectTimeoutsRef.current).forEach(timeout => {
      clearTimeout(timeout);
    });
    reconnectTimeoutsRef.current = {};
    
    socketsRef.current = {};
    setSockets({});
    setIsConnected({});
    setConnectionStatus('disconnected');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
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
    getMessages,
    getTypingUsers,
    
    // Connection methods
    connectToWorkspace,
    connectToRoom,
    connectToChannel,
    connectToDM,
    connectToNotifications,
    isRoomConnected,
    
    // Messaging methods
    sendMessage,
    sendTyping,
    
    // Disconnection methods
    disconnect,
    disconnectAll
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}