import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Environment configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:9000';
const MAX_FILE_SIZE = import.meta.env.VITE_MAX_FILE_SIZE || 10485760;

// Helper function to build API URLs
const buildApiUrl = (endpoint) => {
  return `${API_BASE_URL}/api${endpoint}`;
};

// Request management
const createRequestManager = () => {
  let pendingRequests = new Map();
  let abortControllers = new Map();

  return {
    addRequest: (requestId, abortController) => {
      pendingRequests.set(requestId, true);
      abortControllers.set(requestId, abortController);
    },
    
    removeRequest: (requestId) => {
      pendingRequests.delete(requestId);
      abortControllers.delete(requestId);
    },
    
    cancelRequest: (requestId) => {
      const controller = abortControllers.get(requestId);
      if (controller) {
        controller.abort();
        abortControllers.delete(requestId);
        pendingRequests.delete(requestId);
      }
    },
    
    cancelAllRequests: () => {
      abortControllers.forEach(controller => controller.abort());
      pendingRequests.clear();
      abortControllers.clear();
    },
    
    isRequestPending: (requestId) => {
      return pendingRequests.has(requestId);
    }
  };
};

const useEditorStore = create(
  persist(
    (set, get) => {
      const requestManager = createRequestManager();
      
      return {
        // =============================================================================
        // EDITOR STATE
        // =============================================================================
        documents: [],
        templates: [],
        currentDocument: null,
        currentTemplate: null,
        documentData: {},
        documentHistory: [],
        currentVersion: null,
        collaborators: [],
        comments: [],
        activeUsers: [],
        
        // UI state
        isEditing: false,
        isSaving: false,
        hasUnsavedChanges: false,
        lastSaved: null,
        
        // Search and filters
        searchQuery: '',
        filters: {
          documentType: '',
          status: '',
          tags: [],
          isArchived: false,
          collaborator: ''
        },
        
        // Pagination
        pagination: {
          count: 0,
          next: null,
          previous: null,
          page: 1,
          pageSize: 20
        },
        
        // Loading states
        isLoading: false,
        isLoadingTemplates: false,
        isLoadingDocument: false,
        
        // Error states
        error: null,
        templateError: null,
        documentError: null,

        // Request management
        pendingRequests: new Set(),
        abortControllers: new Map(),

        // =============================================================================
        // COMPUTED PROPERTIES
        // =============================================================================

        get recentDocuments() {
          return get().documents
            .filter(doc => !doc.is_template)
            .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
            .slice(0, 5);
        },

        get myTemplates() {
          return get().templates.filter(template => template.is_template);
        },

        get sharedWithMe() {
          return get().documents.filter(doc => 
            doc.collaborators?.some(collab => collab.user?.id === get().user?.id)
          );
        },

        get archivedDocuments() {
          return get().documents.filter(doc => doc.is_archived);
        },

        // =============================================================================
        // UTILITY METHODS
        // =============================================================================

        // Request cancellation
        cancelRequest: (requestId) => {
          requestManager.cancelRequest(requestId);
        },

        cancelAllRequests: () => {
          requestManager.cancelAllRequests();
        },

        // Request helper with timeout and retry
        fetchWithRetry: async (url, options, retries = 3) => {
          const controller = new AbortController();
          const requestId = `${url}-${Date.now()}`;
          
          requestManager.addRequest(requestId, controller);
          
          try {
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Request timeout')), 15000)
            );

            const fetchPromise = fetch(url, {
              ...options,
              signal: controller.signal
            });

            const response = await Promise.race([fetchPromise, timeoutPromise]);
            requestManager.removeRequest(requestId);
            return response;
          } catch (error) {
            requestManager.removeRequest(requestId);
            
            if (retries > 0 && error.name !== 'AbortError' && !error.message.includes('4')) {
              const delay = Math.pow(2, 3 - retries) * 1000;
              await new Promise(resolve => setTimeout(resolve, delay));
              return get().fetchWithRetry(url, options, retries - 1);
            }
            throw error;
          }
        },

        // Data transformation helpers
        transformDocumentForAPI: (documentData) => {
          const transformed = {
            title: documentData.title || '',
            description: documentData.description || '',
            document_type: documentData.document_type || 'spreadsheet',
            status: documentData.status || 'active',
            is_template: Boolean(documentData.is_template),
            is_archived: Boolean(documentData.is_archived),
            is_public: Boolean(documentData.is_public),
            tags: Array.isArray(documentData.tags) ? documentData.tags : [],
            metadata: documentData.metadata ? 
              (typeof documentData.metadata === 'string' ? 
                documentData.metadata : 
                JSON.stringify(documentData.metadata)
              ) : null,
            editor_data: documentData.editor_data ? 
              (typeof documentData.editor_data === 'string' ? 
                documentData.editor_data : 
                JSON.stringify(documentData.editor_data)
              ) : null
          };

          // Remove null/undefined values
          Object.keys(transformed).forEach(key => {
            if (transformed[key] === undefined || transformed[key] === null) {
              delete transformed[key];
            }
          });

          return transformed;
        },

        // =============================================================================
        // DOCUMENT METHODS
        // =============================================================================

        // Get all documents with filtering and pagination
        getDocuments: async (filters = {}, page = 1) => {
          const requestId = `get-documents-${page}-${JSON.stringify(filters)}`;
          
          if (requestManager.isRequestPending(requestId)) {
            return { success: false, error: 'Documents already loading' };
          }

          set({ isLoading: true, error: null });

          try {
            const token = localStorage.getItem('access_token');
            const queryParams = new URLSearchParams();
            
            // Add filters
            Object.entries(filters).forEach(([key, value]) => {
              if (value !== undefined && value !== null && value !== '') {
                if (Array.isArray(value)) {
                  value.forEach(v => queryParams.append(key, v));
                } else {
                  queryParams.append(key, value);
                }
              }
            });
            
            // Add pagination
            queryParams.append('page', page);
            queryParams.append('page_size', get().pagination.pageSize);
            
            const url = buildApiUrl(`/editor/documents/?${queryParams}`);
            
            const response = await get().fetchWithRetry(url, {
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
              },
            });

            if (response.ok) {
              const data = await response.json();
              
              set({
                documents: data.results || data,
                pagination: {
                  count: data.count || data.length || 0,
                  next: data.next,
                  previous: data.previous,
                  page: page,
                  pageSize: get().pagination.pageSize
                },
                isLoading: false,
                error: null
              });
              
              return { success: true, data };
            } else {
              throw new Error(`Failed to fetch documents: ${response.status}`);
            }
          } catch (error) {
            if (error.name !== 'AbortError') {
              set({ isLoading: false, error: error.message });
            }
            return { success: false, error: error.message };
          }
        },

        // Get document by ID
        getDocument: async (documentId) => {
          const requestId = `get-document-${documentId}`;
          
          if (requestManager.isRequestPending(requestId)) {
            return { success: false, error: 'Document already loading' };
          }

          set({ isLoadingDocument: true, documentError: null });

          try {
            const token = localStorage.getItem('access_token');
            const url = buildApiUrl(`/editor/documents/${documentId}/`);
            
            const response = await get().fetchWithRetry(url, {
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
              },
            });

            if (response.ok) {
              const document = await response.json();
              
              set({
                currentDocument: document,
                documentData: document.editor_data || {},
                isLoadingDocument: false,
                documentError: null
              });
              
              return { success: true, data: document };
            } else {
              throw new Error(`Failed to fetch document: ${response.status}`);
            }
          } catch (error) {
            if (error.name !== 'AbortError') {
              set({ isLoadingDocument: false, documentError: error.message });
            }
            return { success: false, error: error.message };
          }
        },

        // Create new document
        createDocument: async (documentData) => {
          const requestId = `create-document-${Date.now()}`;
          
          if (requestManager.isRequestPending(requestId)) {
            return { success: false, error: 'Document creation in progress' };
          }

          set({ isSaving: true, error: null });

          try {
            const token = localStorage.getItem('access_token');
            const url = buildApiUrl('/editor/documents/');
            
            const apiData = get().transformDocumentForAPI(documentData);
            
            const response = await get().fetchWithRetry(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify(apiData),
            });

            if (response.ok) {
              const newDocument = await response.json();
              
              // Optimistically add to documents list
              set(state => ({
                documents: [newDocument, ...state.documents],
                currentDocument: newDocument,
                documentData: newDocument.editor_data || {},
                isSaving: false,
                error: null,
                hasUnsavedChanges: false,
                lastSaved: new Date().toISOString()
              }));
              
              return { success: true, data: newDocument };
            } else {
              const errorData = await response.json();
              throw new Error(errorData.detail || errorData.message || `Failed to create document: ${response.status}`);
            }
          } catch (error) {
            if (error.name !== 'AbortError') {
              set({ isSaving: false, error: error.message });
            }
            return { success: false, error: error.message };
          }
        },

        // Update document
        updateDocument: async (documentId, updateData) => {
          const requestId = `update-document-${documentId}`;
          
          if (requestManager.isRequestPending(requestId)) {
            return { success: false, error: 'Document update in progress' };
          }

          set({ isSaving: true, error: null });

          try {
            const token = localStorage.getItem('access_token');
            const url = buildApiUrl(`/editor/documents/${documentId}/`);
            
            const apiData = get().transformDocumentForAPI(updateData);
            
            const response = await get().fetchWithRetry(url, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify(apiData),
            });

            if (response.ok) {
              const updatedDocument = await response.json();
              
              // Update in documents list
              set(state => ({
                documents: state.documents.map(doc => 
                  doc.id === documentId ? updatedDocument : doc
                ),
                currentDocument: state.currentDocument?.id === documentId ? updatedDocument : state.currentDocument,
                documentData: updatedDocument.editor_data || state.documentData,
                isSaving: false,
                error: null,
                hasUnsavedChanges: false,
                lastSaved: new Date().toISOString()
              }));
              
              return { success: true, data: updatedDocument };
            } else {
              const errorData = await response.json();
              throw new Error(errorData.detail || errorData.message || `Failed to update document: ${response.status}`);
            }
          } catch (error) {
            if (error.name !== 'AbortError') {
              set({ isSaving: false, error: error.message });
            }
            return { success: false, error: error.message };
          }
        },

        // Update document content only (for real-time editing)
        updateDocumentContent: async (documentId, editorData) => {
          const requestId = `update-content-${documentId}`;
          
          if (requestManager.isRequestPending(requestId)) {
            return { success: false, error: 'Content update in progress' };
          }

          set({ isSaving: true, error: null });

          try {
            const token = localStorage.getItem('access_token');
            const url = buildApiUrl(`/editor/documents/${documentId}/`);
            
            const response = await get().fetchWithRetry(url, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({ 
                editor_data: typeof editorData === 'string' ? editorData : JSON.stringify(editorData)
              }),
            });

            if (response.ok) {
              const updatedDocument = await response.json();
              
              set(state => ({
                currentDocument: updatedDocument,
                documentData: editorData,
                isSaving: false,
                error: null,
                lastSaved: new Date().toISOString()
              }));
              
              return { success: true, data: updatedDocument };
            } else {
              const errorData = await response.json();
              throw new Error(errorData.detail || errorData.message || `Failed to save document: ${response.status}`);
            }
          } catch (error) {
            if (error.name !== 'AbortError') {
              set({ isSaving: false, error: error.message });
            }
            return { success: false, error: error.message };
          }
        },

        // Duplicate document
        duplicateDocument: async (documentId) => {
          const requestId = `duplicate-document-${documentId}`;
          
          if (requestManager.isRequestPending(requestId)) {
            return { success: false, error: 'Duplication in progress' };
          }

          set({ isSaving: true, error: null });

          try {
            const token = localStorage.getItem('access_token');
            const url = buildApiUrl(`/editor/documents/${documentId}/duplicate/`);
            
            const response = await get().fetchWithRetry(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
            });

            if (response.ok) {
              const duplicatedDocument = await response.json();
              
              set(state => ({
                documents: [duplicatedDocument, ...state.documents],
                isSaving: false,
                error: null
              }));
              
              return { success: true, data: duplicatedDocument };
            } else {
              const errorData = await response.json();
              throw new Error(errorData.detail || errorData.message || `Failed to duplicate document: ${response.status}`);
            }
          } catch (error) {
            if (error.name !== 'AbortError') {
              set({ isSaving: false, error: error.message });
            }
            return { success: false, error: error.message };
          }
        },

        // Archive document
        archiveDocument: async (documentId) => {
          const requestId = `archive-document-${documentId}`;
          
          if (requestManager.isRequestPending(requestId)) {
            return { success: false, error: 'Archive in progress' };
          }

          set({ isLoading: true, error: null });

          try {
            const token = localStorage.getItem('access_token');
            const url = buildApiUrl(`/editor/documents/${documentId}/archive/`);
            
            const response = await get().fetchWithRetry(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
            });

            if (response.ok) {
              const result = await response.json();
              
              set(state => ({
                documents: state.documents.map(doc => 
                  doc.id === documentId ? { ...doc, is_archived: true } : doc
                ),
                currentDocument: state.currentDocument?.id === documentId 
                  ? { ...state.currentDocument, is_archived: true }
                  : state.currentDocument,
                isLoading: false,
                error: null
              }));
              
              return { success: true, data: result };
            } else {
              const errorData = await response.json();
              throw new Error(errorData.detail || errorData.message || `Failed to archive document: ${response.status}`);
            }
          } catch (error) {
            if (error.name !== 'AbortError') {
              set({ isLoading: false, error: error.message });
            }
            return { success: false, error: error.message };
          }
        },

        // Restore archived document
        restoreDocument: async (documentId) => {
          const requestId = `restore-document-${documentId}`;
          
          if (requestManager.isRequestPending(requestId)) {
            return { success: false, error: 'Restore in progress' };
          }

          set({ isLoading: true, error: null });

          try {
            const token = localStorage.getItem('access_token');
            const url = buildApiUrl(`/editor/documents/${documentId}/restore/`);
            
            const response = await get().fetchWithRetry(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
            });

            if (response.ok) {
              const result = await response.json();
              
              set(state => ({
                documents: state.documents.map(doc => 
                  doc.id === documentId ? { ...doc, is_archived: false } : doc
                ),
                currentDocument: state.currentDocument?.id === documentId 
                  ? { ...state.currentDocument, is_archived: false }
                  : state.currentDocument,
                isLoading: false,
                error: null
              }));
              
              return { success: true, data: result };
            } else {
              const errorData = await response.json();
              throw new Error(errorData.detail || errorData.message || `Failed to restore document: ${response.status}`);
            }
          } catch (error) {
            if (error.name !== 'AbortError') {
              set({ isLoading: false, error: error.message });
            }
            return { success: false, error: error.message };
          }
        },

        // Delete document
        deleteDocument: async (documentId) => {
          const requestId = `delete-document-${documentId}`;
          
          if (requestManager.isRequestPending(requestId)) {
            return { success: false, error: 'Deletion in progress' };
          }

          set({ isLoading: true, error: null });

          try {
            const token = localStorage.getItem('access_token');
            const url = buildApiUrl(`/editor/documents/${documentId}/`);
            
            const response = await get().fetchWithRetry(url, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
            });

            if (response.ok) {
              set(state => ({
                documents: state.documents.filter(doc => doc.id !== documentId),
                currentDocument: state.currentDocument?.id === documentId ? null : state.currentDocument,
                isLoading: false,
                error: null
              }));
              
              return { success: true };
            } else {
              const errorData = await response.json();
              throw new Error(errorData.detail || errorData.message || `Failed to delete document: ${response.status}`);
            }
          } catch (error) {
            if (error.name !== 'AbortError') {
              set({ isLoading: false, error: error.message });
            }
            return { success: false, error: error.message };
          }
        },

        // =============================================================================
        // TEMPLATE METHODS
        // =============================================================================

        // Get all templates
        getTemplates: async () => {
          const requestId = 'get-templates';
          
          if (requestManager.isRequestPending(requestId)) {
            return { success: false, error: 'Templates already loading' };
          }

          set({ isLoadingTemplates: true, templateError: null });

          try {
            const token = localStorage.getItem('access_token');
            const url = buildApiUrl('/editor/templates/');
            
            const response = await get().fetchWithRetry(url, {
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
              },
            });

            if (response.ok) {
              const templates = await response.json();
              
              set({
                templates: templates.results || templates,
                isLoadingTemplates: false,
                templateError: null
              });
              
              return { success: true, data: templates };
            } else {
              throw new Error(`Failed to fetch templates: ${response.status}`);
            }
          } catch (error) {
            if (error.name !== 'AbortError') {
              set({ isLoadingTemplates: false, templateError: error.message });
            }
            return { success: false, error: error.message };
          }
        },

        // Get template by ID
        getTemplate: async (templateId) => {
          const requestId = `get-template-${templateId}`;
          
          if (requestManager.isRequestPending(requestId)) {
            return { success: false, error: 'Template already loading' };
          }

          set({ isLoading: true, error: null });

          try {
            const token = localStorage.getItem('access_token');
            const url = buildApiUrl(`/editor/templates/${templateId}/`);
            
            const response = await get().fetchWithRetry(url, {
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
              },
            });

            if (response.ok) {
              const template = await response.json();
              
              set({
                currentTemplate: template,
                isLoading: false,
                error: null
              });
              
              return { success: true, data: template };
            } else {
              throw new Error(`Failed to fetch template: ${response.status}`);
            }
          } catch (error) {
            if (error.name !== 'AbortError') {
              set({ isLoading: false, error: error.message });
            }
            return { success: false, error: error.message };
          }
        },

        // Create document from template
        createDocumentFromTemplate: async (templateId, documentData = {}) => {
          const requestId = `create-from-template-${templateId}`;
          
          if (requestManager.isRequestPending(requestId)) {
            return { success: false, error: 'Document creation in progress' };
          }

          set({ isSaving: true, error: null });

          try {
            const token = localStorage.getItem('access_token');
            const url = buildApiUrl(`/editor/templates/${templateId}/create-document/`);
            
            const apiData = get().transformDocumentForAPI(documentData);
            
            const response = await get().fetchWithRetry(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify(apiData),
            });

            if (response.ok) {
              const newDocument = await response.json();
              
              set(state => ({
                documents: [newDocument, ...state.documents],
                currentDocument: newDocument,
                documentData: newDocument.editor_data || {},
                isSaving: false,
                error: null
              }));
              
              return { success: true, data: newDocument };
            } else {
              const errorData = await response.json();
              throw new Error(errorData.detail || errorData.message || `Failed to create document from template: ${response.status}`);
            }
          } catch (error) {
            if (error.name !== 'AbortError') {
              set({ isSaving: false, error: error.message });
            }
            return { success: false, error: error.message };
          }
        },

        // =============================================================================
        // COLLABORATION METHODS
        // =============================================================================

        // Get document collaborators
        getDocumentCollaborators: async (documentId) => {
          const requestId = `get-collaborators-${documentId}`;
          
          if (requestManager.isRequestPending(requestId)) {
            return { success: false, error: 'Collaborators already loading' };
          }

          set({ isLoading: true, error: null });

          try {
            const token = localStorage.getItem('access_token');
            const url = buildApiUrl(`/editor/documents/${documentId}/collaborators/`);
            
            const response = await get().fetchWithRetry(url, {
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
              },
            });

            if (response.ok) {
              const collaborators = await response.json();
              
              set({
                collaborators: collaborators.results || collaborators,
                isLoading: false,
                error: null
              });
              
              return { success: true, data: collaborators };
            } else {
              throw new Error(`Failed to fetch collaborators: ${response.status}`);
            }
          } catch (error) {
            if (error.name !== 'AbortError') {
              set({ isLoading: false, error: error.message });
            }
            return { success: false, error: error.message };
          }
        },

        // Share document with collaborators
        shareDocument: async (documentId, collaboratorIds, permissionLevel = 'view') => {
          const requestId = `share-document-${documentId}`;
          
          if (requestManager.isRequestPending(requestId)) {
            return { success: false, error: 'Sharing in progress' };
          }

          set({ isLoading: true, error: null });

          try {
            const token = localStorage.getItem('access_token');
            const url = buildApiUrl(`/editor/documents/${documentId}/share/`);
            
            const response = await get().fetchWithRetry(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({
                collaborators: collaboratorIds,
                permission_level: permissionLevel
              }),
            });

            if (response.ok) {
              const result = await response.json();
              
              // Refresh collaborators list
              await get().getDocumentCollaborators(documentId);
              
              set({ isLoading: false, error: null });
              return { success: true, data: result };
            } else {
              const errorData = await response.json();
              throw new Error(errorData.detail || errorData.message || `Failed to share document: ${response.status}`);
            }
          } catch (error) {
            if (error.name !== 'AbortError') {
              set({ isLoading: false, error: error.message });
            }
            return { success: false, error: error.message };
          }
        },

        // =============================================================================
        // VERSION CONTROL METHODS
        // =============================================================================

        // Get document versions
        getDocumentVersions: async (documentId) => {
          const requestId = `get-versions-${documentId}`;
          
          if (requestManager.isRequestPending(requestId)) {
            return { success: false, error: 'Versions already loading' };
          }

          set({ isLoading: true, error: null });

          try {
            const token = localStorage.getItem('access_token');
            const url = buildApiUrl(`/editor/documents/${documentId}/versions/`);
            
            const response = await get().fetchWithRetry(url, {
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
              },
            });

            if (response.ok) {
              const versions = await response.json();
              
              set({
                documentHistory: versions.results || versions,
                isLoading: false,
                error: null
              });
              
              return { success: true, data: versions };
            } else {
              throw new Error(`Failed to fetch document versions: ${response.status}`);
            }
          } catch (error) {
            if (error.name !== 'AbortError') {
              set({ isLoading: false, error: error.message });
            }
            return { success: false, error: error.message };
          }
        },

        // Restore document version
        restoreDocumentVersion: async (documentId, versionId) => {
          const requestId = `restore-version-${documentId}-${versionId}`;
          
          if (requestManager.isRequestPending(requestId)) {
            return { success: false, error: 'Version restore in progress' };
          }

          set({ isSaving: true, error: null });

          try {
            const token = localStorage.getItem('access_token');
            const url = buildApiUrl(`/editor/documents/${documentId}/restore_version/`);
            
            const response = await get().fetchWithRetry(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({ version_id: versionId }),
            });

            if (response.ok) {
              const result = await response.json();
              
              // Refresh document data
              await get().getDocument(documentId);
              
              set({ isSaving: false, error: null });
              return { success: true, data: result };
            } else {
              const errorData = await response.json();
              throw new Error(errorData.detail || errorData.message || `Failed to restore document version: ${response.status}`);
            }
          } catch (error) {
            if (error.name !== 'AbortError') {
              set({ isSaving: false, error: error.message });
            }
            return { success: false, error: error.message };
          }
        },

        // =============================================================================
        // SEARCH AND FILTER METHODS
        // =============================================================================

        // Search documents
        searchDocuments: async (query, filters = {}) => {
          const requestId = `search-${query}-${JSON.stringify(filters)}`;
          
          if (requestManager.isRequestPending(requestId)) {
            return { success: false, error: 'Search already in progress' };
          }

          set({ isLoading: true, error: null, searchQuery: query });

          try {
            const token = localStorage.getItem('access_token');
            const queryParams = new URLSearchParams();
            
            queryParams.append('q', query);
            
            // Add filters
            Object.entries(filters).forEach(([key, value]) => {
              if (value !== undefined && value !== null && value !== '') {
                if (Array.isArray(value)) {
                  value.forEach(v => queryParams.append(key, v));
                } else {
                  queryParams.append(key, value);
                }
              }
            });
            
            const url = buildApiUrl(`/editor/search/?${queryParams}`);
            
            const response = await get().fetchWithRetry(url, {
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
              },
            });

            if (response.ok) {
              const searchResults = await response.json();
              
              set({
                documents: searchResults.results || searchResults,
                pagination: {
                  count: searchResults.count || searchResults.length || 0,
                  next: searchResults.next,
                  previous: searchResults.previous,
                  page: 1,
                  pageSize: get().pagination.pageSize
                },
                isLoading: false,
                error: null
              });
              
              return { success: true, data: searchResults };
            } else {
              throw new Error(`Failed to search documents: ${response.status}`);
            }
          } catch (error) {
            if (error.name !== 'AbortError') {
              set({ isLoading: false, error: error.message });
            }
            return { success: false, error: error.message };
          }
        },

        // =============================================================================
        // UI STATE METHODS
        // =============================================================================

        // Set current document
        setCurrentDocument: (document) => {
          set({
            currentDocument: document,
            documentData: document?.editor_data || {},
            hasUnsavedChanges: false
          });
        },

        // Set current template
        setCurrentTemplate: (template) => {
          set({ currentTemplate: template });
        },

        // Set document data (for real-time editing)
        setDocumentData: (data) => {
          set({
            documentData: data,
            hasUnsavedChanges: true
          });
        },

        // Set editing mode
        setEditingMode: (isEditing) => {
          set({ isEditing });
        },

        // Set has unsaved changes
        setHasUnsavedChanges: (hasChanges) => {
          set({ hasUnsavedChanges: hasChanges });
        },

        // Clear current document
        clearCurrentDocument: () => {
          set({
            currentDocument: null,
            documentData: {},
            hasUnsavedChanges: false
          });
        },

        // Clear current template
        clearCurrentTemplate: () => {
          set({ currentTemplate: null });
        },

        // Clear editor search and filters
        clearEditorFilters: () => {
          set({
            searchQuery: '',
            filters: {
              documentType: '',
              status: '',
              tags: [],
              isArchived: false,
              collaborator: ''
            }
          });
        },

        // Clear editor errors
        clearEditorErrors: () => {
          set({
            error: null,
            templateError: null,
            documentError: null
          });
        },

        // Reset editor state
        resetEditorState: () => {
          requestManager.cancelAllRequests();
          
          set({
            documents: [],
            templates: [],
            currentDocument: null,
            currentTemplate: null,
            documentData: {},
            documentHistory: [],
            currentVersion: null,
            collaborators: [],
            comments: [],
            activeUsers: [],
            isEditing: false,
            isSaving: false,
            hasUnsavedChanges: false,
            lastSaved: null,
            searchQuery: '',
            filters: {
              documentType: '',
              status: '',
              tags: [],
              isArchived: false,
              collaborator: ''
            },
            pagination: {
              count: 0,
              next: null,
              previous: null,
              page: 1,
              pageSize: 20
            },
            isLoading: false,
            isLoadingTemplates: false,
            isLoadingDocument: false,
            error: null,
            templateError: null,
            documentError: null
          });
        }
      };
    },
    {
      name: 'editor-storage',
      partialize: (state) => ({ 
        documents: state.documents,
        templates: state.templates,
        currentDocument: state.currentDocument,
        currentTemplate: state.currentTemplate,
        documentData: state.documentData,
        filters: state.filters,
        pagination: state.pagination
      })
    }
  )
);

export default useEditorStore;