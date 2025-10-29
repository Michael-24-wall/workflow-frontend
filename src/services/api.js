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

// Authentication endpoints - match your Django URLs
export const authAPI = {
  login: (credentials) => api.post('/auth/login/', credentials),
  register: (userData) => api.post('/auth/register/', userData),
  logout: () => api.post('/auth/logout/'),
  verifyEmail: (token) => api.post('/auth/verify-email/', { token }),
  refreshToken: (refresh) => api.post('/auth/token/refresh/', { refresh }),
  requestPasswordReset: (email) => api.post('/auth/password/reset/', { email }),
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
};



export default api;