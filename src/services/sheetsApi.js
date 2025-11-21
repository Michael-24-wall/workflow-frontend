import axios from 'axios';

const API_BASE_URL = 'http://localhost:9000/api/sheets';

// Create axios instance with auth
const sheetsApi = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
sheetsApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle token refresh
sheetsApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, try to refresh
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post('http://localhost:9000/api/auth/token/refresh/', {
            refresh: refreshToken
          });
          const newToken = response.data.access;
          localStorage.setItem('access_token', newToken);
          
          // Retry original request with new token
          error.config.headers.Authorization = `Bearer ${newToken}`;
          return sheetsApi.request(error.config);
        } catch (refreshError) {
          // Refresh failed, redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Spreadsheet API
// Spreadsheet API
export const spreadsheetApi = {
  // Get all spreadsheets
  getAll: () => sheetsApi.get('/spreadsheets/'),
  
  // Get single spreadsheet
  getById: (id) => sheetsApi.get(`/spreadsheets/${id}/`),
  
  // Create spreadsheet
  create: (data) => sheetsApi.post('/spreadsheets/', data),
  
  // Update spreadsheet
  update: (id, data) => sheetsApi.put(`/spreadsheets/${id}/`, data),
  
  // Delete spreadsheet
  delete: (id) => sheetsApi.delete(`/spreadsheets/${id}/`),
  
  // Add sheet to spreadsheet
  addSheet: (spreadsheetId, title) => 
    sheetsApi.post(`/spreadsheets/${spreadsheetId}/add_sheet/`, { title }),
  
  // Add collaborator
  addCollaborator: (spreadsheetId, email, role) => 
    sheetsApi.post(`/spreadsheets/${spreadsheetId}/add_collaborator/`, { email, role }),
  
  // Duplicate spreadsheet
  duplicate: (spreadsheetId) => 
    sheetsApi.post(`/spreadsheets/${spreadsheetId}/duplicate/`),
  
  // Export spreadsheet
  export: (spreadsheetId, format = 'json') => 
    sheetsApi.get(`/spreadsheets/${spreadsheetId}/export/?format=${format}`),
  
  // NEW: Download spreadsheet - ADD THIS
  download: (spreadsheetId) => 
    sheetsApi.get(`/spreadsheets/${spreadsheetId}/download/`, {
      responseType: 'blob' // Important for file downloads
    }),
  
  // Get WebSocket connection info
  getConnectionInfo: (spreadsheetId) => 
    sheetsApi.get(`/spreadsheets/${spreadsheetId}/connect/`),
};
// Sheets API
export const sheetApi = {
  // Get all sheets
  getAll: () => sheetsApi.get('/sheets/'),
  
  // Get single sheet
  getById: (id) => sheetsApi.get(`/sheets/${id}/`),
  
  // Create sheet
  create: (data) => sheetsApi.post('/sheets/', data),
  
  // Update sheet
  update: (id, data) => sheetsApi.put(`/sheets/${id}/`, data),
  
  // Delete sheet
  delete: (id) => sheetsApi.delete(`/sheets/${id}/`),
  
  // Batch update cells
  batchUpdateCells: (sheetId, updates) => 
    sheetsApi.post(`/sheets/${sheetId}/cells/batch/`, { updates }),
  
  // Row operations
  rowOperations: (sheetId, action, rowIndex) => 
    sheetsApi.post(`/sheets/${sheetId}/rows/`, { action, row_index: rowIndex }),
  
  // Column operations
  columnOperations: (sheetId, action, columnIndex) => 
    sheetsApi.post(`/sheets/${sheetId}/columns/`, { action, column_index: columnIndex }),
};

// Cells API
export const cellApi = {
  // Get all cells
  getAll: () => sheetsApi.get('/cells/'),
  
  // Get single cell
  getById: (id) => sheetsApi.get(`/cells/${id}/`),
  
  // Create cell
  create: async (data) => {
    try {
      console.log('📡 Creating cell:', data);
      // Make sure all required fields are present
      const payload = {
        sheet: data.sheet,
        row: parseInt(data.row),
        column: parseInt(data.column),
        value: data.value || '',
        formula: data.formula || '',
        style: data.style || {}
      };
      console.log('📤 Cell payload:', payload);
      const response = await sheetsApi.post('/cells/', payload);
      console.log('✅ Cell created:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Error creating cell:', error);
      console.error('❌ Error response:', error.response?.data);
      throw error;
    }
  },
  
  // Update cell
  update: async (id, data) => {
    try {
      console.log('📡 Updating cell:', id, data);
      const response = await sheetsApi.patch(`/cells/${id}/`, data);
      console.log('✅ Cell updated:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Error updating cell:', error);
      console.error('❌ Error response:', error.response?.data);
      throw error;
    }
  },
  
  // Delete cell
  delete: (id) => sheetsApi.delete(`/cells/${id}/`),
  
  // Batch update cells
  batchUpdate: (updates) => 
    sheetsApi.post('/cells/batch_update/', { updates }),
  
  // Get cell history
  getHistory: (cellId) => 
    sheetsApi.get(`/cells/${cellId}/history/`),
};

// Collaborations API
export const collaborationApi = {
  // Get all collaborations
  getAll: () => sheetsApi.get('/collaborations/'),
  
  // Get single collaboration
  getById: (id) => sheetsApi.get(`/collaborations/${id}/`),
  
  // Create collaboration
  create: (data) => sheetsApi.post('/collaborations/', data),
  
  // Update collaboration
  update: (id, data) => sheetsApi.put(`/collaborations/${id}/`, data),
  
  // Delete collaboration
  delete: (id) => sheetsApi.delete(`/collaborations/${id}/`),
};

export default sheetsApi;