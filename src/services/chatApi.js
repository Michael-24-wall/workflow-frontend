const BASE_URL = 'http://localhost:9000/api/chat';

const getToken = () => localStorage.getItem('access_token');

const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();
  const config = {
    headers: {
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
    credentials: 'include',
    ...options,
  };

  // Remove Content-Type for FormData
  if (options.body instanceof FormData) {
    delete config.headers['Content-Type'];
  } else if (!config.headers['Content-Type']) {
    config.headers['Content-Type'] = 'application/json';
  }

  try {
    console.log(`🔍 API Call: ${endpoint}`);
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error ${response.status}:`, errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`✅ API Success: ${endpoint}`, data);
    return data;
    
  } catch (error) {
    console.error(`❌ Network error for ${endpoint}:`, error);
    throw error;
  }
};

export const chatApi = {
  // Rooms
  getRooms: () => apiRequest('/rooms/'),
  createRoom: (data) => apiRequest('/rooms/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  joinRoom: (roomId) => apiRequest(`/rooms/${roomId}/join/`, { method: 'POST' }),
  leaveRoom: (roomId) => apiRequest(`/rooms/${roomId}/leave/`, { method: 'POST' }),

  // Messages
  getMessages: (roomId) => apiRequest(`/messages/?room=${roomId}&ordering=timestamp`),
  sendMessage: (data) => apiRequest('/messages/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  // File Upload
  uploadFile: (file, roomId, description = '') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('room', roomId);
    if (description) formData.append('description', description);
    
    return apiRequest('/messages/upload-file/', {
      method: 'POST',
      body: formData,
    });
  },

  // User Profile
  getUserProfile: () => apiRequest('/user-profile/'),
  updateProfile: (data) => apiRequest('/user-profile/', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // Statistics
  getStatistics: () => apiRequest('/statistics/'),
};