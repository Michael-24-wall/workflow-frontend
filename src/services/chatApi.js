// src/services/chatApi.js
import axios from 'axios';

const API_BASE = 'http://localhost:9000/api/chat';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Get JWT token from localStorage
const getToken = () => {
  return localStorage.getItem('access_token') || localStorage.getItem('token');
};

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add CSRF token if available
    const csrfToken = getCookie('csrftoken');
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 400) {
      // Show validation errors clearly
      const validationErrors = error.response.data;
      let errorMessage = 'Validation error: ';
      
      if (typeof validationErrors === 'object') {
        Object.keys(validationErrors).forEach(key => {
          errorMessage += `${key}: ${validationErrors[key]}. `;
        });
      } else {
        errorMessage = validationErrors;
      }
      
      const validationError = new Error(errorMessage);
      validationError.status = 400;
      validationError.data = validationErrors;
      return Promise.reject(validationError);
    }
    
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('token');
      const authError = new Error('Authentication failed. Please log in again.');
      authError.status = 401;
      return Promise.reject(authError);
    }
    
    if (error.response) {
      const serverError = new Error(
        error.response.data?.error || 
        error.response.data?.detail || 
        `Server error: ${error.response.status}`
      );
      serverError.status = error.response.status;
      return Promise.reject(serverError);
    }
    
    if (error.request) {
      return Promise.reject(new Error('No response from server. Check if backend is running.'));
    }
    
    return Promise.reject(new Error(error.message || 'Unknown error occurred'));
  }
);

// Helper function to get CSRF token
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

// Authentication functions
export const authApi = {
  isAuthenticated: () => {
    return !!localStorage.getItem('access_token');
  },
  getToken: () => {
    return localStorage.getItem('access_token');
  }
};

export const chatApi = {
  // Authentication
  ...authApi,

  // Room endpoints
  getRooms: () => api.get('/rooms/'),
  
  createRoom: (roomData) => api.post('/rooms/', roomData),
  
  joinRoom: (roomId) => api.post(`/rooms/${roomId}/join/`),
  
  // Message endpoints
  getRoomMessages: (roomId) => api.get(`/rooms/${roomId}/messages/`),
  
  sendMessage: (roomId, content, replyToId = null) => 
    api.post('/messages/', {
      room: roomId,
      content: content,
      reply_to: replyToId
    }),
  
  editMessage: (messageId, newContent) => 
    api.post(`/messages/${messageId}/edit/`, {
      content: newContent
    }),
  
  deleteMessage: (messageId) => api.delete(`/messages/${messageId}/`),
  
  // File upload
  uploadFile: (roomId, file, onProgress = null, replyToId = null) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('room_id', roomId);
    if (replyToId) formData.append('reply_to', replyToId);
    
    return api.post('/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      }
    });
  },
  
  // User presence
  setOnlineStatus: (online) => 
    api.post('/presence/', { online }),
};

export default chatApi;