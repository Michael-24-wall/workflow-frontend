import axios from 'axios';

const API_BASE_URL = 'http://localhost:9000/api'; // Your Django backend

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    }
    
    // Handle network errors
    if (error.code === 'ECONNABORTED') {
      error.response = {
        data: { detail: 'Request timeout. Please check your connection.' }
      };
    }
    
    if (!error.response) {
      error.response = {
        data: { detail: 'Network error. Please check your connection.' }
      };
    }
    
    return Promise.reject(error);
  }
);

// Authentication endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/login/', credentials),
  register: (userData) => api.post('/auth/register/', userData),
  logout: () => api.post('/auth/logout/'),
  verifyEmail: (token) => api.post('/auth/verify-email/', { token }),
  refreshToken: (refresh) => api.post('/auth/token/refresh/', { refresh }),
  requestPasswordReset: (email) => api.post('/auth/password/reset/', { email }),
  verifyEmailWithToken: (token) => api.post('/auth/verify_email_with_token/', { token }),
  resendVerification: (email) => api.post('/auth/resend_verification/', { email }),
  validateInvitationToken: (token) => api.get(`/auth/validate_invitation_token/?token=${token}`),
  changePassword: (data) => api.post('/auth/change_password/', data),
  forgotPassword: (email) => api.post('/auth/forgot_password/', { email }),
  passwordResetConfirm: (data) => api.post('/auth/password_reset_confirm/', data),
  joinOrganization: (data) => api.post('/auth/join_organization/', data),
  getProfile: () => api.get('/auth/profile/'),
  updateProfile: (data) => api.patch('/auth/update_profile/', data),
};

// User endpoints
export const userAPI = {
  getProfile: () => api.get('/users/'),
  updateProfile: (data) => api.patch('/users/me/', data),
};

// Organization endpoints
export const organizationAPI = {
  getMyOrganizations: () => api.get('/organizations/'),
  getOrganization: (id) => api.get(`/organizations/${id}/`),
  createOrganization: (data) => api.post('/organizations/', data),
  updateOrganization: (id, data) => api.patch(`/organizations/${id}/`, data),
  getMyOrganization: () => api.get('/organizations/my_organization/'),
  sendInvitation: (data) => api.post('/organizations/send_invitation/', data),
  getPendingInvitations: () => api.get('/organizations/pending_invitations/'),
  getMembers: () => api.get('/organizations/members/'),
  getStatistics: () => api.get('/organizations/statistics/'),
  debugUserStatus: () => api.get('/organizations/debug_user_status/'),
  testInvitationEmail: (data) => api.post('/organizations/test_invitation_email/', data),
  debugInvitationTemplate: () => api.get('/organizations/debug_invitation_template/'),
};

// Documents endpoints
export const documentsAPI = {
  getDocuments: () => api.get('/documents/'),
  createDocument: (data) => api.post('/documents/', data),
  getDocument: (id) => api.get(`/documents/${id}/`),
  updateDocument: (id, data) => api.patch(`/documents/${id}/`, data),
  deleteDocument: (id) => api.delete(`/documents/${id}/`),
};

// Chat endpoints
export const chatAPI = {
  getRooms: () => api.get('/chat/rooms/'),
  createRoom: (data) => api.post('/chat/rooms/', data),
  getRoom: (id) => api.get(`/chat/rooms/${id}/`),
  getMessages: (roomId) => api.get(`/chat/rooms/${roomId}/messages/`),
  sendMessage: (roomId, data) => api.post(`/chat/rooms/${roomId}/messages/`, data),
};

export default api;