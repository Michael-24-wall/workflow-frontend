// src/services/chatApi.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:9000/api';

// Create axios instance with proper authentication
const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Add request interceptor to include the token
apiClient.interceptors.request.use(
  (config) => {
    // Get the token from access_token (matching your auth store)
    const token = localStorage.getItem('access_token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Adding access_token to request:', token.substring(0, 10) + '...');
    } else {
      console.warn('⚠️ No access_token found for chat API request');
      // Also check if there's any token in other locations for debugging
      const authStorage = localStorage.getItem('auth-storage');
      const authToken = localStorage.getItem('auth_token');
      console.log('🔍 Token search debug:', {
        access_token: localStorage.getItem('access_token') ? 'Exists' : 'Missing',
        auth_token: authToken ? 'Exists' : 'Missing',
        auth_storage: authStorage ? 'Exists' : 'Missing'
      });
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      console.error('🔐 Authentication failed - clearing tokens');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      // Redirect to login after a short delay
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    }
    return Promise.reject(error);
  }
);

const chatApi = {
  getRooms: async () => {
    try {
      console.log('🔄 Fetching rooms from:', `${API_BASE_URL}/chat/rooms/`);
      const token = localStorage.getItem('access_token');
      console.log('🔑 Using access_token:', token ? `Yes (${token.length} chars)` : 'No');
      
      const response = await apiClient.get('/chat/rooms/');
      console.log('✅ Rooms API response:', response.data);
      
      // Handle different response formats
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && response.data.results) {
        return response.data.results; // Django REST framework pagination
      } else {
        return response.data || [];
      }
    } catch (error) {
      console.error('❌ Error fetching rooms:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      if (error.response?.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      if (error.response?.status === 404) {
        throw new Error('Chat rooms endpoint not found.');
      }
      
      throw error;
    }
  },

  getRoomMessages: async (roomId) => {
    try {
      console.log('🔄 Fetching messages for room:', roomId);
      const token = localStorage.getItem('access_token');
      console.log('🔑 Token for messages:', token ? `Yes (${token.length} chars)` : 'No');
      
      const response = await apiClient.get(`/chat/rooms/${roomId}/messages/`);
      
      // Handle different response formats
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && response.data.results) {
        return response.data.results;
      } else {
        return response.data || [];
      }
    } catch (error) {
      console.error('❌ Error fetching room messages:', {
        status: error.response?.status,
        roomId: roomId,
        message: error.message
      });
      
      if (error.response?.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      if (error.response?.status === 404) {
        throw new Error('Messages endpoint not found for this room.');
      }
      
      throw error;
    }
  },

  sendMessage: async (roomId, content) => {
    try {
      console.log('🔄 Sending message to room:', roomId);
      const token = localStorage.getItem('access_token');
      console.log('🔑 Token for sending:', token ? `Yes (${token.length} chars)` : 'No');
      
      const response = await apiClient.post(`/chat/rooms/${roomId}/messages/`, {
        content,
        message_type: 'text'
      });
      console.log('✅ Message sent successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error sending message:', {
        status: error.response?.status,
        roomId: roomId,
        message: error.message
      });
      
      if (error.response?.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      throw error;
    }
  },

  createRoom: async (roomData) => {
    try {
      console.log('🔄 Creating new room:', roomData);
      const response = await apiClient.post('/chat/rooms/', roomData);
      console.log('✅ Room created successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error creating room:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  },

  setOnlineStatus: async (online) => {
    try {
      console.log('🔄 Setting online status:', online);
      const response = await apiClient.post('/chat/presence/', {
        online
      });
      console.log('✅ Online status updated:', online);
      return response.data;
    } catch (error) {
      // Don't throw error for presence endpoint - it might not exist
      console.log('💡 Presence endpoint not available');
      return { success: true };
    }
  },

  uploadFile: async (roomId, file) => {
    try {
      console.log('🔄 Uploading file to room:', roomId, file.name);
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiClient.post(`/chat/rooms/${roomId}/files/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('✅ File uploaded successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error uploading file:', error);
      throw error;
    }
  },

  // Test connection method
  testConnection: async () => {
    try {
      console.log('🧪 Testing API connection...');
      const token = localStorage.getItem('access_token');
      console.log('🔑 Test token:', token ? `Yes (${token.length} chars)` : 'No');
      
      const response = await apiClient.get('/auth/profile/');
      console.log('✅ API connection test successful');
      return { success: true, user: response.data };
    } catch (error) {
      console.error('❌ API connection test failed:', error.response?.status);
      return { success: false, error: error.message };
    }
  },

  // Join a room
  joinRoom: async (roomId) => {
    try {
      console.log('🔄 Joining room:', roomId);
      const response = await apiClient.post(`/chat/rooms/${roomId}/join/`);
      console.log('✅ Joined room successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error joining room:', error);
      throw error;
    }
  },

  // Leave a room
  leaveRoom: async (roomId) => {
    try {
      console.log('🔄 Leaving room:', roomId);
      const response = await apiClient.post(`/chat/rooms/${roomId}/leave/`);
      console.log('✅ Left room successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error leaving room:', error);
      throw error;
    }
  }
};

export { chatApi };