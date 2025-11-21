// src/services/documentService.js (CORRECTED)
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:9000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const documentService = {
  // ✅ CORRECT: These match your Django URLs
  getTemplates: () => api.get('/documents/templates/'),
  getTemplate: (id) => api.get(`/documents/templates/${id}/`),
  createTemplate: (data) => api.post('/documents/templates/', data),
  updateTemplate: (id, data) => api.put(`/documents/templates/${id}/`, data),
  deleteTemplate: (id) => api.delete(`/documents/templates/${id}/`),
  duplicateTemplate: (id) => api.post(`/documents/templates/${id}/duplicate/`),

  // ✅ CORRECTED: Use /documents/ NOT /documents/instances/
  getDocuments: (params = {}) => api.get('/documents/', { params }),
  getDocument: (id) => api.get(`/documents/${id}/`),
  createDocument: (data) => api.post('/documents/', data),
  updateDocument: (id, data) => api.patch(`/documents/${id}/`, data),
  deleteDocument: (id) => api.delete(`/documents/${id}/`),

  // ✅ CORRECTED: Statistics endpoint
  getStatistics: () => api.get('/documents/statistics/'),

  // ✅ CORRECTED: Custom actions
  generatePDF: (id) => api.post(`/documents/${id}/generate-pdf/`),
  signDocument: (id, data) => api.post(`/documents/${id}/sign/`, data),
  
  uploadAttachment: (id, file, description = '') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('description', description);
    return api.post(`/documents/${id}/upload-attachment/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  downloadDocument: (id) => api.get(`/documents/${id}/download/`, {
    responseType: 'blob'
  }),

  // ✅ CORRECTED: Bulk update
  bulkUpdateStatus: (data) => api.post('/documents/bulk-update-status/', data),

  // ✅ CORRECTED: Comments & sharing
  addComment: (documentId, data) => api.post(`/documents/${documentId}/add-comment/`, data),
  shareDocument: (documentId, data) => api.post(`/documents/${documentId}/share/`, data),
  getVersionHistory: (documentId) => api.get(`/documents/${documentId}/version-history/`)
};