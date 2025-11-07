import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useState, useEffect, useRef, useCallback } from 'react';

export const useAutoSave = ({ data, onSave, debounceMs = 1000 }) => {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const timeoutRef = useRef(null);
  const previousDataRef = useRef();

  const save = useCallback(async () => {
    try {
      await onSave(data);
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, [data, onSave]);

  useEffect(() => {
    if (previousDataRef.current && JSON.stringify(previousDataRef.current) !== JSON.stringify(data)) {
      setHasUnsavedChanges(true);
      
      // Debounce auto-save
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(save, debounceMs);
    }
    
    previousDataRef.current = data;
  }, [data, save, debounceMs]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { hasUnsavedChanges, lastSaved };
};

// Use environment variables with fallbacks
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:9000';
const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:9000';
const MAX_FILE_SIZE = import.meta.env.VITE_MAX_FILE_SIZE || 10485760;

// Helper function to build API URLs
const buildApiUrl = (endpoint) => {
  return `${API_BASE_URL}/api${endpoint}`;
};

const useAuthStore = create(
  persist(
    (set, get) => ({
      // =============================================================================
      // AUTH STATE
      // =============================================================================
      user: null,
      organization: null,
      invitations: [],
      members: [],
      statistics: null,
      isLoading: false,
      error: null,
      
      // Dashboard State
      availableDashboards: [],
      quickAccessLinks: [],
      currentDashboard: null,
      dashboardData: {},
      userRole: null,
      effectiveUserRole: 'MEMBER',
      
      // HR Dashboard Specific State
      hrDashboard: {
        overview: null,
        employees: null,
        recruitment: null,
        leave: null,
        compensation: null,
        training: null,
        analytics: null,
        performance: null
      },
      hrCache: {
        lastFetched: null,
        cacheDuration: 300000, // 5 minutes for HR data
      },
      
      // Cache state to prevent unnecessary API calls
      lastApiCall: null,
      cacheDuration: 30000, // 30 seconds cache

      // =============================================================================
      // EDITOR STATE
      // =============================================================================
      
      // Documents
      editorDocuments: [],
      editorCurrentDocument: null,
      editorSelectedDocuments: [],
      
      // Templates
      editorTemplates: [],
      
      // Collaboration
      editorCollaborators: [],
      editorComments: [],
      editorActiveUsers: [],
      
      // Version Control
      editorVersions: [],
      editorCurrentVersion: null,
      
      // UI State
      editorLoading: false,
      editorError: null,
      editorSidebarOpen: true,
      editorViewMode: 'grid', // 'grid' or 'list'
      editorSortBy: '-updated_at',
      editorFilters: {
        documentType: '',
        status: '',
        isArchived: false,
        collaborator: '',
        tags: [],
      },

      // =============================================================================
      // COMPUTED PROPERTIES
      // =============================================================================

      get isAuthenticated() {
        return !!get().user;
      },

      get hasOrganization() {
        return !!get().organization;
      },

      get organizationSlug() {
          return get().organization?.subdomain || null;
      },

      get isOrganizationAdmin() {
        const role = get().effectiveUserRole;
        return role === 'ADMIN' || role === 'OWNER' || role === 'EXECUTIVE';
      },

      get pendingInvitationsCount() {
        return get().invitations.length;
      },

      get membersCount() {
        return get().members.length;
      },

      get isEmailVerified() {
        return get().user?.is_verified || false;
      },

      // Dashboard computed properties
      get hasDashboardAccess() {
        return get().availableDashboards.length > 0;
      },

      get primaryDashboard() {
        const role = get().effectiveUserRole;
        return get().getDefaultDashboardPath(role);
      },

      // HR Dashboard computed properties
      get hasHRDashboardAccess() {
        const role = get().effectiveUserRole;
        return role === 'OWNER' || role === 'EXECUTIVE' || role === 'ADMIN' || role === 'HR' || role === 'MANAGER';
      },

      get isHRDataLoaded() {
        return get().hrDashboard.overview !== null;
      },

      // Editor computed properties
      get editorSelectedDocumentsCount() {
        return get().editorSelectedDocuments.length;
      },

      get editorRecentDocuments() {
        return get().editorDocuments
          .filter(doc => !doc.is_archived)
          .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
          .slice(0, 5);
      },

      get editorDocumentStats() {
        const docs = get().editorDocuments;
        return {
          total: docs.length,
          active: docs.filter(doc => !doc.is_archived).length,
          archived: docs.filter(doc => doc.is_archived).length,
          templates: docs.filter(doc => doc.is_template).length,
          totalSize: docs.reduce((acc, doc) => acc + (doc.size || 0), 0),
        };
      },

      // =============================================================================
      // EDITOR METHODS - UPDATED TO USE ENV VARIABLES
      // =============================================================================

      // Get all documents with filters
      editorFetchDocuments: async (params = {}) => {
        set({ editorLoading: true, editorError: null });
        try {
          const token = localStorage.getItem('access_token');
          const queryParams = new URLSearchParams({
            page: params.page || 1,
            page_size: params.pageSize || 20,
            ...get().editorFilters,
            ...params,
          }).toString();

          const response = await fetch(`${buildApiUrl('/editor/documents/')}?${queryParams}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) throw new Error('Failed to fetch documents');

          const data = await response.json();
          set({ 
            editorDocuments: data.results || data,
            editorLoading: false,
          });
          return data;
        } catch (error) {
          set({ editorError: error.message, editorLoading: false });
          throw error;
        }
      },

      // Get single document
      editorFetchDocument: async (documentId) => {
        set({ editorLoading: true, editorError: null });
        try {
          const token = localStorage.getItem('access_token');
          const response = await fetch(buildApiUrl(`/editor/documents/${documentId}/`), {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) throw new Error('Failed to fetch document');

          const document = await response.json();
          set({ 
            editorCurrentDocument: document,
            editorLoading: false 
          });
          return document;
        } catch (error) {
          set({ editorError: error.message, editorLoading: false });
          throw error;
        }
      },

      // Create document
      editorCreateDocument: async (documentData, templateId = null) => {
        set({ editorLoading: true, editorError: null });
        try {
          const token = localStorage.getItem('access_token');
          const payload = {
            ...documentData,
            ...(templateId && { template_id: templateId }),
          };

          const response = await fetch(buildApiUrl('/editor/documents/'), {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create document');
          }

          const document = await response.json();
          set(state => ({
            editorDocuments: [document, ...state.editorDocuments],
            editorCurrentDocument: document,
            editorLoading: false,
          }));
          return document;
        } catch (error) {
          set({ editorError: error.message, editorLoading: false });
          throw error;
        }
      },

      // Update document
      editorUpdateDocument: async (documentId, updates) => {
        set({ editorLoading: true, editorError: null });
        try {
          const token = localStorage.getItem('access_token');
          const response = await fetch(buildApiUrl(`/editor/documents/${documentId}/`), {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updates),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update document');
          }

          const updatedDocument = await response.json();
          set(state => ({
            editorDocuments: state.editorDocuments.map(doc => 
              doc.id === documentId ? updatedDocument : doc
            ),
            editorCurrentDocument: state.editorCurrentDocument?.id === documentId ? updatedDocument : state.editorCurrentDocument,
            editorLoading: false,
          }));
          return updatedDocument;
        } catch (error) {
          set({ editorError: error.message, editorLoading: false });
          throw error;
        }
      },

      // Update document data (spreadsheet content)
      editorUpdateDocumentData: async (documentId, data) => {
        set({ editorLoading: true, editorError: null });
        try {
          const token = localStorage.getItem('access_token');
          const response = await fetch(buildApiUrl(`/editor/documents/${documentId}/data/`), {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ editor_data: data }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update document data');
          }

          const result = await response.json();
          set(state => ({
            editorCurrentDocument: state.editorCurrentDocument ? {
              ...state.editorCurrentDocument,
              editor_data: data,
              size: result.size,
              updated_at: result.updated_at,
            } : state.editorCurrentDocument,
            editorLoading: false,
          }));
          return result;
        } catch (error) {
          set({ editorError: error.message, editorLoading: false });
          throw error;
        }
      },

      // Delete document
      editorDeleteDocument: async (documentId) => {
        set({ editorLoading: true, editorError: null });
        try {
          const token = localStorage.getItem('access_token');
          const response = await fetch(buildApiUrl(`/editor/documents/${documentId}/`), {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (!response.ok) throw new Error('Failed to delete document');

          set(state => ({
            editorDocuments: state.editorDocuments.filter(doc => doc.id !== documentId),
            editorCurrentDocument: state.editorCurrentDocument?.id === documentId ? null : state.editorCurrentDocument,
            editorLoading: false,
          }));
        } catch (error) {
          set({ editorError: error.message, editorLoading: false });
          throw error;
        }
      },

      // Duplicate document
      editorDuplicateDocument: async (documentId) => {
        set({ editorLoading: true, editorError: null });
        try {
          const token = localStorage.getItem('access_token');
          const response = await fetch(buildApiUrl(`/editor/documents/${documentId}/duplicate/`), {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) throw new Error('Failed to duplicate document');

          const duplicatedDoc = await response.json();
          set(state => ({
            editorDocuments: [duplicatedDoc, ...state.editorDocuments],
            editorLoading: false,
          }));
          return duplicatedDoc;
        } catch (error) {
          set({ editorError: error.message, editorLoading: false });
          throw error;
        }
      },

      // Archive document
      editorArchiveDocument: async (documentId) => {
        set({ editorLoading: true, editorError: null });
        try {
          const token = localStorage.getItem('access_token');
          const response = await fetch(buildApiUrl(`/editor/documents/${documentId}/archive/`), {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) throw new Error('Failed to archive document');

          const result = await response.json();
          set(state => ({
            editorDocuments: state.editorDocuments.map(doc => 
              doc.id === documentId ? { ...doc, is_archived: result.is_archived } : doc
            ),
            editorCurrentDocument: state.editorCurrentDocument?.id === documentId ? 
              { ...state.editorCurrentDocument, is_archived: result.is_archived } : state.editorCurrentDocument,
            editorLoading: false,
          }));
          return result;
        } catch (error) {
          set({ editorError: error.message, editorLoading: false });
          throw error;
        }
      },

      // Get templates
      editorFetchTemplates: async () => {
        set({ editorLoading: true, editorError: null });
        try {
          const token = localStorage.getItem('access_token');
          const response = await fetch(buildApiUrl('/editor/documents/templates/'), {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (!response.ok) throw new Error('Failed to fetch templates');

          const templates = await response.json();
          set({ editorTemplates: templates, editorLoading: false });
          return templates;
        } catch (error) {
          set({ editorError: error.message, editorLoading: false });
          throw error;
        }
      },

      // Create document from template
      editorCreateFromTemplate: async (templateId, documentData = {}) => {
        set({ editorLoading: true, editorError: null });
        try {
          const token = localStorage.getItem('access_token');
          const response = await fetch(buildApiUrl(`/editor/documents/templates/${templateId}/create-document/`), {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(documentData),
          });

          if (!response.ok) throw new Error('Failed to create document from template');

          const document = await response.json();
          set(state => ({
            editorDocuments: [document, ...state.editorDocuments],
            editorLoading: false,
          }));
          return document;
        } catch (error) {
          set({ editorError: error.message, editorLoading: false });
          throw error;
        }
      },

      // Get document versions
      editorFetchVersions: async (documentId) => {
        set({ editorLoading: true, editorError: null });
        try {
          const token = localStorage.getItem('access_token');
          const response = await fetch(buildApiUrl(`/editor/documents/${documentId}/versions/`), {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (!response.ok) throw new Error('Failed to fetch versions');

          const versions = await response.json();
          set({ editorVersions: versions, editorLoading: false });
          return versions;
        } catch (error) {
          set({ editorError: error.message, editorLoading: false });
          throw error;
        }
      },

      // Restore version
      editorRestoreVersion: async (documentId, versionId) => {
        set({ editorLoading: true, editorError: null });
        try {
          const token = localStorage.getItem('access_token');
          const response = await fetch(buildApiUrl(`/editor/documents/${documentId}/restore_version/`), {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ version_id: versionId }),
          });

          if (!response.ok) throw new Error('Failed to restore version');

          const result = await response.json();
          set(state => ({
            editorCurrentDocument: state.editorCurrentDocument ? {
              ...state.editorCurrentDocument,
              editor_data: result.data,
            } : state.editorCurrentDocument,
            editorLoading: false,
          }));
          return result;
        } catch (error) {
          set({ editorError: error.message, editorLoading: false });
          throw error;
        }
      },

      // Share document
      editorShareDocument: async (documentId, collaboratorIds, permissionLevel = 'view') => {
        set({ editorLoading: true, editorError: null });
        try {
          const token = localStorage.getItem('access_token');
          const response = await fetch(buildApiUrl(`/editor/documents/${documentId}/share/`), {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              collaborators: collaboratorIds,
              permission_level: permissionLevel,
            }),
          });

          if (!response.ok) throw new Error('Failed to share document');

          const result = await response.json();
          set({ editorLoading: false });
          return result;
        } catch (error) {
          set({ editorError: error.message, editorLoading: false });
          throw error;
        }
      },

      // Get collaborators
      editorFetchCollaborators: async (documentId) => {
        set({ editorLoading: true, editorError: null });
        try {
          const token = localStorage.getItem('access_token');
          const response = await fetch(buildApiUrl(`/editor/documents/${documentId}/collaborators/`), {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (!response.ok) throw new Error('Failed to fetch collaborators');

          const collaborators = await response.json();
          set({ editorCollaborators: collaborators, editorLoading: false });
          return collaborators;
        } catch (error) {
          set({ editorError: error.message, editorLoading: false });
          throw error;
        }
      },

      // Get comments
      editorFetchComments: async (documentId) => {
        set({ editorLoading: true, editorError: null });
        try {
          const token = localStorage.getItem('access_token');
          const response = await fetch(buildApiUrl(`/editor/documents/${documentId}/comments/`), {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (!response.ok) throw new Error('Failed to fetch comments');

          const comments = await response.json();
          set({ editorComments: comments, editorLoading: false });
          return comments;
        } catch (error) {
          set({ editorError: error.message, editorLoading: false });
          throw error;
        }
      },

      // Add comment
      editorAddComment: async (documentId, commentData) => {
        set({ editorLoading: true, editorError: null });
        try {
          const token = localStorage.getItem('access_token');
          const response = await fetch(buildApiUrl(`/editor/documents/${documentId}/comments/`), {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(commentData),
          });

          if (!response.ok) throw new Error('Failed to add comment');

          const comment = await response.json();
          set(state => ({
            editorComments: [comment, ...state.editorComments],
            editorLoading: false,
          }));
          return comment;
        } catch (error) {
          set({ editorError: error.message, editorLoading: false });
          throw error;
        }
      },

      // Export document
      editorExportDocument: async (documentId, format = 'json') => {
        set({ editorLoading: true, editorError: null });
        try {
          const token = localStorage.getItem('access_token');
          const response = await fetch(
            `${buildApiUrl(`/editor/documents/${documentId}/export/`)}?format=${format}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            }
          );

          if (!response.ok) throw new Error('Failed to export document');

          if (format === 'json') {
            const data = await response.json();
            return data;
          } else {
            // Handle file downloads
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `document.${format}`;
            a.click();
            window.URL.revokeObjectURL(url);
          }

          set({ editorLoading: false });
        } catch (error) {
          set({ editorError: error.message, editorLoading: false });
          throw error;
        }
      },

      // Bulk operations
      editorBulkOperations: async (operation, documentIds, additionalData = {}) => {
        set({ editorLoading: true, editorError: null });
        try {
          const token = localStorage.getItem('access_token');
          const response = await fetch(buildApiUrl('/editor/bulk/operations/'), {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              operation,
              document_ids: documentIds,
              ...additionalData,
            }),
          });

          if (!response.ok) throw new Error('Failed to perform bulk operation');

          const result = await response.json();
          
          // Refresh documents after bulk operation
          await get().editorFetchDocuments();
          
          set({ editorLoading: false, editorSelectedDocuments: [] });
          return result;
        } catch (error) {
          set({ editorError: error.message, editorLoading: false });
          throw error;
        }
      },

      // Search documents
      editorSearchDocuments: async (query, filters = {}) => {
        set({ editorLoading: true, editorError: null });
        try {
          const token = localStorage.getItem('access_token');
          const queryParams = new URLSearchParams({
            q: query,
            ...filters,
          }).toString();

          const response = await fetch(`${buildApiUrl('/editor/search/')}?${queryParams}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (!response.ok) throw new Error('Failed to search documents');

          const data = await response.json();
          set({ editorLoading: false });
          return data.results || data;
        } catch (error) {
          set({ editorError: error.message, editorLoading: false });
          throw error;
        }
      },

      // Get tags
      editorFetchTags: async () => {
        set({ editorLoading: true, editorError: null });
        try {
          const token = localStorage.getItem('access_token');
          const response = await fetch(buildApiUrl('/editor/tags/'), {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (!response.ok) throw new Error('Failed to fetch tags');

          const tags = await response.json();
          set({ editorLoading: false });
          return tags;
        } catch (error) {
          set({ editorError: error.message, editorLoading: false });
          throw error;
        }
      },

      // Editor UI Methods
      editorToggleSidebar: () => {
        set(state => ({ editorSidebarOpen: !state.editorSidebarOpen }));
      },

      editorSetViewMode: (mode) => {
        set({ editorViewMode: mode });
      },

      editorSetSortBy: (sortBy) => {
        set({ editorSortBy: sortBy });
      },

      editorSetFilters: (filters) => {
        set(state => ({ 
          editorFilters: { ...state.editorFilters, ...filters } 
        }));
      },

      editorSetSelectedDocuments: (documentIds) => {
        set({ editorSelectedDocuments: documentIds });
      },

      editorClearCurrentDocument: () => {
        set({ 
          editorCurrentDocument: null,
          editorVersions: [],
          editorCollaborators: [],
          editorComments: [],
        });
      },

      editorClearError: () => {
        set({ editorError: null });
      },

      // Initialize editor data
      editorInitialize: async () => {
        try {
          await Promise.all([
            get().editorFetchDocuments(),
            get().editorFetchTemplates(),
          ]);
        } catch (error) {
          console.error('Failed to initialize editor:', error);
        }
      },

      // =============================================================================
      // HR DASHBOARD METHODS - UPDATED TO USE ENV VARIABLES
      // =============================================================================

      getHRDashboard: async (section = null) => {
        const organizationSlug = get().organizationSlug;
        if (!organizationSlug) {
          return { success: false, error: 'No organization selected' };
        }

        // Check cache first
        const cachedData = get().hrDashboard[section] || get().hrDashboard.overview;
        const isCacheValid = get().isHRCacheValid();
        
        if (cachedData && isCacheValid && !section) {
          console.log('📦 Using cached HR dashboard data');
          return { success: true, data: get().hrDashboard };
        }

        set({ isLoading: true, error: null });
        try {
          const token = localStorage.getItem('access_token');
          let url = buildApiUrl(`/organizations/${organizationSlug}/dashboard/hr/`);
          
          // If specific section is requested, use the section endpoint
          if (section) {
            url = buildApiUrl(`/organizations/${organizationSlug}/dashboard/hr/${section}/`);
          }

          const response = await fetch(url, {
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}` 
            },
          });

          if (response.ok) {
            const data = await response.json();
            
            // Update state based on whether it's a section or full dashboard
            if (section) {
              set(state => ({
                hrDashboard: {
                  ...state.hrDashboard,
                  [section]: data
                },
                isLoading: false,
                hrCache: {
                  ...state.hrCache,
                  lastFetched: Date.now()
                }
              }));
            } else {
              set({ 
                hrDashboard: data,
                isLoading: false,
                hrCache: {
                  lastFetched: Date.now()
                }
              });
            }
            
            return { success: true, data };
          } else {
            throw new Error(`Failed to fetch HR dashboard: ${response.status}`);
          }
        } catch (error) {
          console.error('❌ HR dashboard error:', error);
          set({ error: error.message, isLoading: false });
          return { success: false, error: error.message };
        }
      },

      // HR Cache validation helper
      isHRCacheValid: () => {
        const lastFetched = get().hrCache.lastFetched;
        if (!lastFetched) return false;
        return (Date.now() - lastFetched) < get().hrCache.cacheDuration;
      },

      // Get specific HR sections
      getHREmployees: async () => {
        return get().getHRDashboard('employees');
      },

      getHRRecruitment: async () => {
        return get().getHRDashboard('recruitment');
      },

      getHRLeave: async () => {
        return get().getHRDashboard('leave');
      },

      getHRCompensation: async () => {
        return get().getHRDashboard('compensation');
      },

      getHRTraining: async () => {
        return get().getHRDashboard('training');
      },

      getHRAnalytics: async () => {
        return get().getHRDashboard('analytics');
      },

      getHRPerformance: async () => {
        return get().getHRDashboard('performance');
      },

      // HR Employee Management Actions
      performHREmployeeAction: async (actionData) => {
        const organizationSlug = get().organizationSlug;
        if (!organizationSlug) {
          return { success: false, error: 'No organization selected' };
        }

        set({ isLoading: true, error: null });
        try {
          const token = localStorage.getItem('access_token');
          const response = await fetch(buildApiUrl(`/organizations/${organizationSlug}/dashboard/hr/employee-actions/`), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(actionData),
          });

          if (response.ok) {
            const data = await response.json();
            
            // Invalidate HR cache to force refresh
            set(state => ({
              hrCache: {
                ...state.hrCache,
                lastFetched: null // Force refresh on next call
              },
              isLoading: false
            }));
            
            return { success: true, data };
          } else {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to perform employee action');
          }
        } catch (error) {
          set({ error: error.message, isLoading: false });
          return { success: false, error: error.message };
        }
      },

      // HR Recruitment Actions
      performHRRecruitmentAction: async (actionData) => {
        // This would integrate with your recruitment system
        // For now, we'll simulate the action
        set({ isLoading: true, error: null });
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Invalidate recruitment cache
          set(state => ({
            hrDashboard: {
              ...state.hrDashboard,
              recruitment: null // Force refresh
            },
            isLoading: false
          }));
          
          return { 
            success: true, 
            message: 'Recruitment action completed successfully' 
          };
        } catch (error) {
          set({ error: error.message, isLoading: false });
          return { success: false, error: error.message };
        }
      },

      // HR Training Actions
      performHRTrainingAction: async (actionData) => {
        set({ isLoading: true, error: null });
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Invalidate training cache
          set(state => ({
            hrDashboard: {
              ...state.hrDashboard,
              training: null // Force refresh
            },
            isLoading: false
          }));
          
          return { 
            success: true, 
            message: 'Training action completed successfully' 
          };
        } catch (error) {
          set({ error: error.message, isLoading: false });
          return { success: false, error: error.message };
        }
      },

      // HR Reports Generation
      generateHRReport: async (reportData) => {
        const organizationSlug = get().organizationSlug;
        if (!organizationSlug) {
          return { success: false, error: 'No organization selected' };
        }

        set({ isLoading: true, error: null });
        try {
          const token = localStorage.getItem('access_token');
          const response = await fetch(buildApiUrl(`/organizations/${organizationSlug}/dashboard/hr/reports/`), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(reportData),
          });

          if (response.ok) {
            const data = await response.json();
            set({ isLoading: false });
            return { success: true, data };
          } else {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to generate HR report');
          }
        } catch (error) {
          set({ error: error.message, isLoading: false });
          return { success: false, error: error.message };
        }
      },

      // Clear HR cache
      clearHRCache: () => {
        set({ 
          hrDashboard: {
            overview: null,
            employees: null,
            recruitment: null,
            leave: null,
            compensation: null,
            training: null,
            analytics: null,
            performance: null
          },
          hrCache: {
            lastFetched: null
          }
        });
      },

      // Force refresh HR data
      forceRefreshHRData: async () => {
        set(state => ({
          hrCache: {
            ...state.hrCache,
            lastFetched: null
          }
        }));
        return await get().getHRDashboard();
      },

      // =============================================================================
      // DASHBOARD METHODS - UPDATED TO USE ENV VARIABLES
      // =============================================================================

      getAvailableDashboards: async () => {
        // Return cached data if available and recent
        const currentDashboards = get().availableDashboards;
        if (currentDashboards.length > 0 && get().isCacheValid()) {
          return { success: true, data: currentDashboards };
        }

        set({ isLoading: true, error: null });
        try {
          const currentRole = get().userRole || get().effectiveUserRole || 'MEMBER';
          const availableDashboards = get().calculateAvailableDashboards(currentRole);
          
          set({ 
            availableDashboards,
            isLoading: false,
            lastApiCall: Date.now()
          });
          
          return { success: true, data: availableDashboards };
        } catch (error) {
          console.log('⚠️ Using fallback dashboards due to error:', error.message);
          const fallbackDashboards = ['/dashboard', '/dashboard/overview', '/dashboard/personal'];
          set({ 
            availableDashboards: fallbackDashboards,
            isLoading: false 
          });
          return { success: true, data: fallbackDashboards };
        }
      },

      // Cache validation helper
      isCacheValid: () => {
        const lastCall = get().lastApiCall;
        if (!lastCall) return false;
        return (Date.now() - lastCall) < get().cacheDuration;
      },

      getDashboard: async (dashboardType) => {
        // Special handling for HR dashboard
        if (dashboardType === 'hr') {
          return get().getHRDashboard();
        }

        // Check cache first for other dashboards
        const cachedData = get().dashboardData[dashboardType];
        if (cachedData && get().isCacheValid()) {
          set({ currentDashboard: dashboardType });
          return { success: true, data: cachedData };
        }

        set({ isLoading: true, error: null });
        try {
          const token = localStorage.getItem('access_token');
          let data = {};
          
          // Only make API calls for dashboards that need real data
          if (dashboardType === 'overview' || dashboardType === 'personal') {
            const response = await fetch(buildApiUrl('/organizations/my_organization/'), {
              headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
              data = await response.json();
            }
          }
          
          // For other dashboards, use mock data to avoid API calls
          if (!data || Object.keys(data).length === 0) {
            data = { 
              dashboard_type: dashboardType,
              message: `Dashboard data for ${dashboardType}`,
              timestamp: new Date().toISOString()
            };
          }
          
          set({ 
            currentDashboard: dashboardType,
            dashboardData: { ...get().dashboardData, [dashboardType]: data },
            isLoading: false,
            lastApiCall: Date.now()
          });
          
          return { success: true, data };
        } catch (error) {
          set({ error: error.message, isLoading: false });
          return { success: false, error: error.message };
        }
      },

      // Helper method to calculate available dashboards based on role
      calculateAvailableDashboards: (userRole) => {
        const dashboards = {
          'OWNER': ['/dashboard', '/dashboard/overview', '/dashboard/financial', '/dashboard/system', '/dashboard/hr', '/dashboard/team', '/dashboard/cases', '/dashboard/analytics', '/dashboard/personal'],
          'EXECUTIVE': ['/dashboard', '/dashboard/overview', '/dashboard/financial', '/dashboard/hr', '/dashboard/team', '/dashboard/cases', '/dashboard/analytics', '/dashboard/personal'],
          'ADMIN': ['/dashboard', '/dashboard/overview', '/dashboard/system', '/dashboard/analytics', '/dashboard/personal'],
          'FINANCE': ['/dashboard', '/dashboard/overview', '/dashboard/financial', '/dashboard/analytics', '/dashboard/personal'],
          'HR': ['/dashboard', '/dashboard/overview', '/dashboard/hr', '/dashboard/team', '/dashboard/personal'],
          'MANAGER': ['/dashboard', '/dashboard/overview', '/dashboard/team', '/dashboard/cases', '/dashboard/analytics', '/dashboard/personal'],
          'SOCIAL_WORKER': ['/dashboard', '/dashboard/overview', '/dashboard/cases', '/dashboard/personal'],
          'MEMBER': ['/dashboard', '/dashboard/overview', '/dashboard/personal']
        };
        
        return dashboards[userRole] || ['/dashboard', '/dashboard/personal'];
      },

      // Dashboard-specific methods - OPTIMIZED: Minimal API calls
      getOverviewDashboard: async () => {
        return get().getDashboard('overview');
      },

      getFinancialDashboard: async () => {
        return get().getDashboard('financial');
      },

      getAnalyticsDashboard: async () => {
        return get().getDashboard('analytics');
      },

      getTeamDashboard: async () => {
        return get().getDashboard('team');
      },

      getCasesDashboard: async () => {
        return get().getDashboard('cases');
      },

      getSystemDashboard: async () => {
        return get().getDashboard('system');
      },

      getPersonalDashboard: async () => {
        return get().getDashboard('personal');
      },

      // Role-based dashboard routing
      getDefaultDashboardPath: (userRole) => {
        const roleDashboards = {
          'OWNER': '/dashboard',
          'EXECUTIVE': '/dashboard',
          'ADMIN': '/dashboard/system',
          'FINANCE': '/dashboard/financial',
          'HR': '/dashboard/hr',
          'MANAGER': '/dashboard/team',
          'SOCIAL_WORKER': '/dashboard/cases',
          'MEMBER': '/dashboard'
        };
        
        return roleDashboards[userRole] || '/dashboard';
      },

      getDashboardAccessLevel: (dashboardType, userRole) => {
        const dashboardAccess = {
          'OVERVIEW': ['OWNER', 'EXECUTIVE', 'ADMIN', 'MANAGER', 'HR', 'FINANCE', 'SOCIAL_WORKER', 'MEMBER'],
          'FINANCIAL': ['OWNER', 'EXECUTIVE', 'ADMIN', 'FINANCE'],
          'HR': ['OWNER', 'EXECUTIVE', 'ADMIN', 'HR', 'MANAGER'],
          'ANALYTICS': ['OWNER', 'EXECUTIVE', 'ADMIN', 'MANAGER'],
          'TEAM': ['OWNER', 'EXECUTIVE', 'ADMIN', 'MANAGER', 'HR'],
          'CASES': ['OWNER', 'EXECUTIVE', 'ADMIN', 'MANAGER', 'SOCIAL_WORKER'],
          'SYSTEM': ['OWNER', 'EXECUTIVE', 'ADMIN'],
          'USER_MANAGEMENT': ['OWNER', 'EXECUTIVE', 'ADMIN', 'HR'],
          'REPORTS': ['OWNER', 'EXECUTIVE', 'ADMIN', 'MANAGER', 'HR', 'FINANCE'],
          'PERSONAL': ['OWNER', 'EXECUTIVE', 'ADMIN', 'MANAGER', 'HR', 'FINANCE', 'SOCIAL_WORKER', 'MEMBER'],
        };
        
        const allowedRoles = dashboardAccess[dashboardType] || [];
        return userRole === 'OWNER' || allowedRoles.includes(userRole);
      },

      // =============================================================================
      // AUTHENTICATION METHODS - UPDATED TO USE ENV VARIABLES
      // =============================================================================

      checkAuth: async () => {
        // Don't check auth if we already have a user and cache is valid
        if (get().user && get().isCacheValid()) {
          return;
        }

        set({ isLoading: true });
        try {
          const token = localStorage.getItem('access_token');
          if (!token) {
            set({ user: null, isLoading: false });
            return;
          }
          
          const response = await fetch(buildApiUrl('/auth/profile/'), {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (response.ok) {
            const userData = await response.json();
            
            // Convert relative URL to absolute URL
            if (userData.profile_picture_url && userData.profile_picture_url.startsWith('/')) {
              userData.profile_picture_url = `${API_BASE_URL}${userData.profile_picture_url}`;
            }
            
            set({ 
              user: userData, 
              isLoading: false,
              lastApiCall: Date.now()
            });
            
            // Only fetch organization data if we don't have it
            if (!get().organization) {
              await get().getOrganizationData();
            }
          } else {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            set({ user: null, isLoading: false });
          }
        } catch (error) {
          set({ user: null, isLoading: false });
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(buildApiUrl('/auth/register/'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || JSON.stringify(errorData) || 'Registration failed');
          }
          
          const data = await response.json();
          
          // STORE EMAIL IN LOCALSTORAGE FOR VERIFICATION BACKUP
          if (userData.email) {
            localStorage.setItem('user_email', userData.email);
          }
          
          set({ isLoading: false });
          
          // Auto-login after registration
          console.log('🔄 Attempting auto-login after registration...');
          const loginResult = await get().login({
            email: userData.email,
            password: userData.password
          });
          
          if (loginResult.success) {
            console.log('✅ Auto-login successful, redirecting to:', loginResult.redirectTo);
            return { 
              success: true, 
              message: data.message,
              redirectTo: loginResult.redirectTo 
            };
          } else {
            console.log('⚠️ Auto-login failed, redirecting to login page');
            return { 
              success: true, 
              message: data.message,
              redirectTo: '/login'
            };
          }
        } catch (error) {
          set({ error: error.message, isLoading: false });
          return { success: false, error: error.message };
        }
      },

      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          console.log('🔐 Attempting login...', credentials);
          const response = await fetch(buildApiUrl('/auth/login/'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Login failed');
          }
          
          const data = await response.json();
          
          if (data.access) {
            localStorage.setItem('access_token', data.access);
            localStorage.setItem('refresh_token', data.refresh);
            
            // STORE EMAIL IN LOCALSTORAGE FOR VERIFICATION BACKUP
            if (credentials.email) {
              localStorage.setItem('user_email', credentials.email);
            }
            
            const userResponse = await fetch(buildApiUrl('/auth/profile/'), {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${data.access}`,
              },
            });
            
            if (userResponse.ok) {
              const userData = await userResponse.json();
              
              // Convert relative URL to absolute URL
              if (userData.profile_picture_url && userData.profile_picture_url.startsWith('/')) {
                userData.profile_picture_url = `${API_BASE_URL}${userData.profile_picture_url}`;
              }
              
              set({ user: userData, isLoading: false, error: null });
              
              let detectedRole = 'MEMBER';
              let redirectTo = '/dashboard';
              
              // ✅ SIMPLIFIED ROLE DETECTION - Use user profile only (no extra API calls)
              if (userData.primary_role) {
                detectedRole = userData.primary_role.toUpperCase();
                console.log(`🎯 Using primary_role from user data: ${detectedRole}`);
              } else if (userData.organization_role) {
                detectedRole = userData.organization_role.toUpperCase();
                console.log(`🎯 Using organization_role from user data: ${detectedRole}`);
              }
              
              redirectTo = get().getDefaultDashboardPath(detectedRole);
              
              // Set the detected role in state
              set({ 
                userRole: detectedRole,
                effectiveUserRole: detectedRole,
                lastApiCall: Date.now()
              });
              
              console.log(`🎯 Final role detection: ${detectedRole} -> Redirecting to: ${redirectTo}`);
              
              return { 
                success: true, 
                redirectTo,
                userRole: detectedRole
              };
            }
          }
          
          throw new Error('Login failed - no access token received');
        } catch (error) {
          console.error('❌ Login error:', error);
          set({ error: error.message, isLoading: false });
          return { success: false, error: error.message };
        }
      },

      logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_email');
        set({ 
          user: null, 
          organization: null, 
          invitations: [], 
          members: [], 
          statistics: null,
          availableDashboards: [],
          quickAccessLinks: [],
          currentDashboard: null,
          dashboardData: {},
          userRole: null,
          effectiveUserRole: 'MEMBER',
          hrDashboard: {
            overview: null,
            employees: null,
            recruitment: null,
            leave: null,
            compensation: null,
            training: null,
            analytics: null,
            performance: null
          },
          hrCache: {
            lastFetched: null
          },
          // Clear editor state on logout
          editorDocuments: [],
          editorCurrentDocument: null,
          editorSelectedDocuments: [],
          editorTemplates: [],
          editorCollaborators: [],
          editorComments: [],
          editorVersions: [],
          editorCurrentVersion: null,
          editorError: null,
          // End clear editor state
          error: null,
          lastApiCall: null // Clear cache on logout
        });
      },

      // =============================================================================
      // EMAIL VERIFICATION METHODS - UPDATED TO USE ENV VARIABLES
      // =============================================================================

      verifyEmail: async (token) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(buildApiUrl('/auth/verify_email_with_token/'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: token })
          });
          
          if (response.ok) {
            const data = await response.json();
            
            // Update user verification status in store if user exists
            const { user } = get();
            if (user) {
              set({ user: { ...user, is_verified: true } });
            }
            
            set({ isLoading: false });
            return { success: true, message: data.message || 'Email verified successfully' };
          } else {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error || errorData.detail || 'Verification failed';
            throw new Error(errorMessage);
          }
        } catch (error) {
          set({ error: error.message, isLoading: false });
          return { success: false, error: error.message };
        }
      },

      resendVerification: async () => {
        set({ isLoading: true, error: null });
        try {
          const userEmail = localStorage.getItem('user_email');
          
          if (!userEmail) {
            throw new Error('Please register again or contact support to resend verification email.');
          }

          const response = await fetch(buildApiUrl('/auth/resend_verification/'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: userEmail }),
          });
          
          if (response.ok) {
            const data = await response.json();
            set({ isLoading: false });
            return { success: true, message: data.message || 'Verification email sent' };
          } else {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error || errorData.detail || 'Failed to resend verification email';
            throw new Error(errorMessage);
          }
        } catch (error) {
          set({ error: error.message, isLoading: false });
          return { success: false, error: error.message };
        }
      },

      // =============================================================================
      // PROFILE MANAGEMENT - UPDATED TO USE ENV VARIABLES
      // =============================================================================

      updateProfile: async (profileData) => {
        set({ isLoading: true, error: null });
        try {
          const token = localStorage.getItem('access_token');
          
          const isFormData = profileData instanceof FormData;
          
          const headers = {
            'Authorization': `Bearer ${token}`,
          };
          
          if (!isFormData) {
            headers['Content-Type'] = 'application/json';
          }
          
          const response = await fetch(buildApiUrl('/auth/update_profile/'), {
            method: 'PATCH',
            headers: headers,
            body: isFormData ? profileData : JSON.stringify(profileData),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || errorData.detail || 'Profile update failed');
          }
          
          const userData = await response.json();
          
          if (userData.profile_picture_url && userData.profile_picture_url.startsWith('/')) {
            userData.profile_picture_url = `${API_BASE_URL}${userData.profile_picture_url}`;
          }
          
          set({ user: userData, isLoading: false });
          return { success: true, user: userData };
        } catch (error) {
          set({ error: error.message, isLoading: false });
          return { success: false, error: error.message };
        }
      },

      uploadProfilePicture: async (file) => {
        set({ isLoading: true, error: null });
        try {
          const token = localStorage.getItem('access_token');
          const formData = new FormData();
          formData.append('profile_picture', file);
          
          const response = await fetch(buildApiUrl('/auth/update_profile/'), {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: formData,
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || errorData.detail || 'Profile picture upload failed');
          }
          
          const userData = await response.json();
          
          if (userData.profile_picture_url && userData.profile_picture_url.startsWith('/')) {
            userData.profile_picture_url = `${API_BASE_URL}${userData.profile_picture_url}`;
          }
          
          set({ user: userData, isLoading: false });
          
          setTimeout(() => {
            set(state => ({ ...state }));
          }, 100);
          
          return { success: true, user: userData };
        } catch (error) {
          set({ error: error.message, isLoading: false });
          return { success: false, error: error.message };
        }
      },

      removeProfilePicture: async () => {
        set({ isLoading: true, error: null });
        try {
          const token = localStorage.getItem('access_token');
          const response = await fetch(buildApiUrl('/auth/remove_profile_picture/'), {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || errorData.detail || 'Failed to remove profile picture');
          }
          
          const userData = await response.json();
          
          if (userData.profile_picture_url && userData.profile_picture_url.startsWith('/')) {
            userData.profile_picture_url = `${API_BASE_URL}${userData.profile_picture_url}`;
          }
          
          set({ user: userData, isLoading: false });
          return { success: true, user: userData };
        } catch (error) {
          set({ error: error.message, isLoading: false });
          return { success: false, error: error.message };
        }
      },

      changePassword: async (passwordData) => {
        set({ isLoading: true, error: null });
        try {
          const token = localStorage.getItem('access_token');
          const response = await fetch(buildApiUrl('/auth/change_password/'), {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(passwordData),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || errorData.detail || 'Password change failed');
          }
          
          set({ isLoading: false });
          return { success: true, message: 'Password changed successfully' };
        } catch (error) {
          set({ error: error.message, isLoading: false });
          return { success: false, error: error.message };
        }
      },

      // =============================================================================
      // PASSWORD RESET - UPDATED TO USE ENV VARIABLES
      // =============================================================================

      forgotPassword: async (email) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(buildApiUrl('/auth/forgot_password/'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to send reset email');
          }
          
          set({ isLoading: false });
          return { success: true, message: 'Password reset email sent' };
        } catch (error) {
          set({ error: error.message, isLoading: false });
          return { success: false, error: error.message };
        }
      },

      resetPassword: async (resetData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(buildApiUrl('/auth/password_reset_confirm/'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(resetData),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Password reset failed');
          }
          
          set({ isLoading: false });
          return { success: true, message: 'Password reset successful' };
        } catch (error) {
          set({ error: error.message, isLoading: false });
          return { success: false, error: error.message };
        }
      },

      // =============================================================================
      // ORGANIZATION MANAGEMENT - UPDATED TO USE ENV VARIABLES
      // =============================================================================

      joinOrganization: async (inviteToken) => {
        set({ isLoading: true, error: null });
        try {
          const token = localStorage.getItem('access_token');
          const response = await fetch(buildApiUrl('/auth/join_organization/'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ invite_token: inviteToken }),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to join organization');
          }
          
          const data = await response.json();
          
          if (data.user?.profile_picture_url && data.user.profile_picture_url.startsWith('/')) {
            data.user.profile_picture_url = `${API_BASE_URL}${data.user.profile_picture_url}`;
          }
          
          set({ user: data.user, isLoading: false });
          
          // Refresh organization and dashboard data after joining
          await get().getOrganizationData();
          
          return { success: true, message: data.message };
        } catch (error) {
          set({ error: error.message, isLoading: false });
          return { success: false, error: error.message };
        }
      },

      getOrganizationData: async () => {
        // Return cached data if available and recent
        if (get().organization && get().isCacheValid()) {
          console.log('📦 Using cached organization data');
          return { 
            success: true,
            data: get().organization
          };
        }

        console.log('🔄 Fetching organization data...');
        set({ isLoading: true, error: null });
        
        try {
          const token = localStorage.getItem('access_token');
          
          if (!token) {
            throw new Error('No access token found');
          }

          // SINGLE API CALL - Only get organization data
          const response = await fetch(buildApiUrl('/organizations/my_organization/'), {
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}` 
            },
          });

          if (response.ok) {
            const organization = await response.json();
            
            console.log('🏢 Organization data loaded:', organization);
            
            // Update Zustand store
            set({ 
              organization, 
              isLoading: false, 
              error: null,
              lastApiCall: Date.now() // Set cache timestamp
            });

            console.log('✅ Organization data fetched successfully');

            return { 
              success: true,
              data: organization
            };
          } else if (response.status === 404) {
            console.warn('⚠️ No organization found for user');
            set({ 
              organization: null,
              isLoading: false,
              lastApiCall: Date.now()
            });
            return { success: false, error: 'No organization found' };
          } else {
            throw new Error(`Organization API error: ${response.status}`);
          }

        } catch (error) {
          console.error('❌ getOrganizationData error:', error);
          set({ isLoading: false, error: error.message });
          return { success: false, error: error.message };
        }
      },

      getMembersData: async () => {
        // Return cached data if available and recent
        if (get().members.length > 0 && get().isCacheValid()) {
          return { success: true, data: get().members };
        }

        set({ isLoading: true, error: null });
        try {
          const token = localStorage.getItem('access_token');
          const response = await fetch(buildApiUrl('/organizations/members/'), {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (response.ok) {
            const members = await response.json();
            set({ 
              members, 
              isLoading: false,
              lastApiCall: Date.now()
            });
            return { success: true, data: members };
          } else {
            set({ isLoading: false });
            return { success: false, error: 'Failed to fetch members' };
          }
        } catch (error) {
          set({ isLoading: false, error: error.message });
          return { success: false, error: error.message };
        }
      },

      getInvitationsData: async () => {
        // Return cached data if available and recent
        if (get().invitations.length > 0 && get().isCacheValid()) {
          return { success: true, data: get().invitations };
        }

        set({ isLoading: true });
        try {
          const token = localStorage.getItem('access_token');
          const response = await fetch(buildApiUrl('/organizations/pending_invitations/'), {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (response.ok) {
            const invitations = await response.json();
            set({ 
              invitations, 
              isLoading: false,
              lastApiCall: Date.now()
            });
            return { success: true, data: invitations };
          } else {
            set({ isLoading: false });
            return { success: false, error: 'Failed to fetch invitations' };
          }
        } catch (error) {
          set({ isLoading: false, error: error.message });
          return { success: false, error: error.message };
        }
      },

      getStatisticsData: async () => {
        // Return cached data if available and recent
        if (get().statistics && get().isCacheValid()) {
          return { success: true, data: get().statistics };
        }

        set({ isLoading: true });
        try {
          const token = localStorage.getItem('access_token');
          const response = await fetch(buildApiUrl('/organizations/statistics/'), {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (response.ok) {
            const statistics = await response.json();
            set({ 
              statistics, 
              isLoading: false,
              lastApiCall: Date.now()
            });
            return { success: true, data: statistics };
          } else {
            set({ isLoading: false });
            return { success: false, error: 'Failed to fetch statistics' };
          }
        } catch (error) {
          set({ isLoading: false, error: error.message });
          return { success: false, error: error.message };
        }
      },

      getAllOrganizationData: async () => {
        console.log('🔄 Fetching ALL organization data...');
        
        // Use cached data if available
        if (get().organization && get().members.length > 0 && get().isCacheValid()) {
          console.log('📦 Using cached organization data');
          return { 
            success: true,
            data: {
              organization: get().organization,
              members: get().members,
              invitations: get().invitations,
              statistics: get().statistics
            }
          };
        }

        set({ isLoading: true, error: null });
        try {
          // Fetch organization data first (most important)
          await get().getOrganizationData();
          
          // Then fetch other data in sequence (not parallel)
          await get().getMembersData();
          await get().getInvitationsData();
          await get().getStatisticsData();
          
          set({ isLoading: false });
          
          return { 
            success: true,
            data: {
              organization: get().organization,
              members: get().members,
              invitations: get().invitations,
              statistics: get().statistics
            }
          };
        } catch (error) {
          set({ isLoading: false, error: error.message });
          return { success: false, error: error.message };
        }
      },

      sendInvitation: async (invitationData) => {
        set({ isLoading: true, error: null });
        try {
          const token = localStorage.getItem('access_token');
          const response = await fetch(buildApiUrl('/organizations/send_invitation/'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(invitationData),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || errorData.role || 'Failed to send invitation');
          }
          
          const data = await response.json();
          
          // Refresh invitations data only (not all organization data)
          await get().getInvitationsData();
          
          return { 
            success: true, 
            message: data.message,
            invitation: data.invitation 
          };
        } catch (error) {
          set({ error: error.message, isLoading: false });
          return { success: false, error: error.message };
        }
      },

      // =============================================================================
      // TOKEN MANAGEMENT - UPDATED TO USE ENV VARIABLES
      // =============================================================================

      refreshToken: async () => {
        try {
          const refreshToken = localStorage.getItem('refresh_token');
          if (!refreshToken) {
            return { success: false };
          }
          
          const response = await fetch(buildApiUrl('/auth/token/refresh/'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh: refreshToken }),
          });
          
          if (response.ok) {
            const data = await response.json();
            localStorage.setItem('access_token', data.access);
            return { success: true, access: data.access };
          } else {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            set({ user: null, organization: null, invitations: [], members: [] });
            return { success: false };
          }
        } catch (error) {
          return { success: false };
        }
      },

      // =============================================================================
      // UTILITY METHODS
      // =============================================================================

      refreshUserProfile: async () => {
        set({ isLoading: true });
        try {
          const token = localStorage.getItem('access_token');
          if (!token) {
            set({ isLoading: false });
            return { success: false, error: 'No token found' };
          }

          const response = await fetch(buildApiUrl('/auth/profile/'), {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (response.ok) {
            const userData = await response.json();
            
            if (userData.profile_picture_url && userData.profile_picture_url.startsWith('/')) {
              userData.profile_picture_url = `${API_BASE_URL}${userData.profile_picture_url}`;
            }
            
            console.log('🔄 Refreshed user profile:', userData);
            set({ user: userData, isLoading: false });
            return { success: true, user: userData };
          } else {
            set({ isLoading: false });
            return { success: false, error: 'Failed to refresh profile' };
          }
        } catch (error) {
          console.error('❌ Refresh profile error:', error);
          set({ isLoading: false, error: error.message });
          return { success: false, error: error.message };
        }
      },

      clearOrganizationData: () => {
        set({ 
          organization: null, 
          invitations: [], 
          members: [], 
          statistics: null,
          availableDashboards: [],
          quickAccessLinks: [],
          currentDashboard: null,
          dashboardData: {} 
        });
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      // Clear cache manually if needed
      clearCache: () => {
        set({ lastApiCall: null });
      },

      // Force refresh data (bypass cache)
      forceRefresh: async () => {
        set({ lastApiCall: null });
        return await get().getAllOrganizationData();
      },
   
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user,
        organization: state.organization,
        userRole: state.userRole,
        effectiveUserRole: state.effectiveUserRole,
        lastApiCall: state.lastApiCall,
        members: state.members,
        invitations: state.invitations,
        statistics: state.statistics,
        hrDashboard: state.hrDashboard,
        hrCache: state.hrCache,
        // Add editor UI state to persistence
        editorSidebarOpen: state.editorSidebarOpen,
        editorViewMode: state.editorViewMode,
        editorSortBy: state.editorSortBy,
        editorFilters: state.editorFilters,
      })
    }
  )
);

export default useAuthStore;