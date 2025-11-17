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
  
  const { user, isAuthenticated } = useAuthStore();
  
  const socketsRef = useRef({});
  const reconnectTimeoutsRef = useRef({});
  const authCheckTimeoutRef = useRef(null);

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

        // Send authentication message after a brief delay
        setTimeout(() => {
          if (ws.readyState === WebSocket.OPEN) {
            const authMessage = {
              type: 'authenticate',
              token: token,
              user_id: currentUser?.id,
              email: currentUser?.email
            };
            console.log('🔐 Sending WebSocket authentication...');
            ws.send(JSON.stringify(authMessage));
          }
        }, 100);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 WebSocket message received:', data.type);
          
          switch (data.type) {
            case 'new_message':
            case 'message_created':
              handleNewMessage(data);
              break;
              
            case 'user_typing':
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

            default:
              console.log('📨 Unknown message type:', data.type);
          }
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
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

  const handleNewMessage = (data) => {
    const roomId = data.room_id || data.channel_id || data.dm_id;
    const message = data.message || data;
    
    if (!roomId) {
      console.error('❌ No room ID in message:', data);
      return;
    }

    setMessages(prev => ({
      ...prev,
      [roomId]: [...(prev[roomId] || []), {
        ...message,
        id: message.id || Date.now().toString(),
        timestamp: message.timestamp || new Date().toISOString()
      }]
    }));
  };

  // =============================================================================
  // WEBSOCKET CONNECTION METHODS
  // =============================================================================

  // Connect to workspace chat - MATCH: ws/workspace/(?P<workspace_id>[0-9a-f-]+)/$
  const connectToWorkspace = (workspaceId) => {
    const key = `workspace_${workspaceId}`;
    const baseUrl = getWebSocketBaseURL();
    const url = `${baseUrl}/ws/workspace/${workspaceId}/`;
    
    console.log(`🔌 Requesting workspace WebSocket: ${url}`);
    return connectWebSocket(url, key);
  };

  // Connect to specific channel - MATCH: ws/channel/(?P<channel_id>[0-9a-f-]+)/$
  const connectToChannel = (channelId) => {
    const key = `channel_${channelId}`;
    const baseUrl = getWebSocketBaseURL();
    const url = `${baseUrl}/ws/channel/${channelId}/`;
    
    console.log(`🔌 Requesting channel WebSocket: ${url}`);
    return connectWebSocket(url, key);
  };

  // Connect to DM - MATCH: ws/dm/(?P<dm_id>[0-9a-f-]+)/$
  const connectToDM = (dmId) => {
    const key = `dm_${dmId}`;
    const baseUrl = getWebSocketBaseURL();
    const url = `${baseUrl}/ws/dm/${dmId}/`;
    
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
    const key = `chat_${roomName}`;
    const baseUrl = getWebSocketBaseURL();
    const url = `${baseUrl}/ws/chat/${roomName}/`;
    
    console.log(`🔌 Requesting chat room WebSocket: ${url}`);
    return connectWebSocket(url, key);
  };

  // Generic connect function
  const connect = (roomId, roomType = 'workspace') => {
    switch (roomType) {
      case 'workspace':
        return connectToWorkspace(roomId);
      case 'channel':
        return connectToChannel(roomId);
      case 'dm':
        return connectToDM(roomId);
      case 'notifications':
        return connectToNotifications();
      case 'chat':
        return connectToChatRoom(roomId);
      default:
        console.error(`❌ Unknown room type: ${roomType}`);
        return null;
    }
  };

  // Send message to specific room
  const sendMessage = (roomId, content, roomType = 'workspace') => {
    const key = `${roomType}_${roomId}`;
    const socket = socketsRef.current[key];
    
    if (socket && isConnected[key]) {
      const currentUser = getCurrentUser();
      const message = {
        type: 'chat_message',
        room_id: roomId,
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
      console.log('🔍 Socket state:', {
        socketExists: !!socket,
        isConnected: isConnected[key],
        allConnections: Object.keys(socketsRef.current)
      });
      return false;
    }
  };

  // Send typing indicator
  const sendTyping = (roomId, isTyping, roomType = 'workspace') => {
    const key = `${roomType}_${roomId}`;
    const socket = socketsRef.current[key];
    
    if (socket && isConnected[key]) {
      const currentUser = getCurrentUser();
      const typingMessage = {
        type: 'typing',
        room_id: roomId,
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
    return messages[roomId] || [];
  };

  // Get typing users for a specific room
  const getTypingUsers = (roomId) => {
    return typingUsers[roomId] || [];
  };

  // Check if connected to a specific room
  const isRoomConnected = (roomId, roomType = 'workspace') => {
    const key = `${roomType}_${roomId}`;
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