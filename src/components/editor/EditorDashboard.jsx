import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import EditorHeader from './EditorHeader';
import DocumentGrid from './DocumentGrid';
import DocumentList from './DocumentList';
import EditorSidebar from './EditorSidebar';
import CreateDocumentModal from './CreateDocumentModal';
import BulkActionsBar from './BulkActionsBar';
import SearchFilters from './SearchFilters';
import StatsOverview from './StatsOverview';
import RecentDocuments from './RecentDocuments';
import QuickActions from './QuickActions';
import LoadingSpinner from '../LoadingSpinner';
import ErrorMessage from '../ErrorMessage';

const EditorDashboard = () => {
  const {
    user,
    logout,
    // Editor state
    editorDocuments,
    editorTemplates,
    editorLoading,
    editorError,
    editorViewMode,
    editorFilters,
    editorSelectedDocuments,
    editorDocumentStats,
    editorRecentDocuments,
    editorSelectedDocumentsCount,
    // Editor methods
    editorFetchDocuments,
    editorFetchTemplates,
    editorCreateDocument,
    editorDeleteDocument,
    editorDuplicateDocument,
    editorArchiveDocument,
    editorBulkOperations,
    editorSetViewMode,
    editorSetFilters,
    editorSetSelectedDocuments,
    editorClearError,
    editorExportDocument,
    editorClearCurrentDocument,
  } = useAuthStore();

  const navigate = useNavigate();
  const location = useLocation();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Safe document navigation
  const handleDocumentOpen = useCallback((documentId) => {
    if (!documentId || documentId === 'undefined' || documentId === 'null') {
      console.error('Invalid document ID:', documentId);
      return;
    }
    navigate(`/editor/document/${documentId}`);
  }, [navigate]);

  // Safe document operations
  const validateDocumentId = (documentId, operation = 'operation') => {
    if (!documentId || documentId === 'undefined' || documentId === 'null') {
      console.error(`Cannot perform ${operation}: invalid document ID`);
      return false;
    }
    return true;
  };

  // Initialize editor data
  useEffect(() => {
    const initializeEditor = async () => {
      try {
        await Promise.all([
          editorFetchDocuments(),
          editorFetchTemplates()
        ]);
      } catch (error) {
        console.error('Failed to initialize editor:', error);
      }
    };
    
    initializeEditor();
    editorClearCurrentDocument();
  }, []);

  // Debounced search with proper backend parameters
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const params = {
        page: 1,
        page_size: 20,
      };
      
      // Add search term if provided
      if (searchTerm && searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      
      // Add other filters with proper parameter names
      if (editorFilters.documentType) {
        params.document_type = editorFilters.documentType;
      }
      if (editorFilters.status) {
        params.status = editorFilters.status;
      }
      if (editorFilters.isArchived !== undefined) {
        // FIX: Use consistent parameter name - 'archived' instead of 'is_archived'
        params.archived = editorFilters.isArchived.toString();
      }
      
      console.log('Search - Fetching documents with params:', params);
      editorFetchDocuments(params);
    }, 500); // Increased debounce time

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Fetch documents when specific filters change
  useEffect(() => {
    const params = {
      page: 1,
      page_size: 20,
    };
    
    if (editorFilters.documentType) {
      params.document_type = editorFilters.documentType;
    }
    if (editorFilters.status) {
      params.status = editorFilters.status;
    }
    if (editorFilters.isArchived !== undefined) {
      // FIX: Use consistent parameter name - 'archived' instead of 'is_archived'
      params.archived = editorFilters.isArchived.toString();
    }
    
    console.log('Filter change - Fetching documents with params:', params);
    editorFetchDocuments(params);
  }, [editorFilters.documentType, editorFilters.status, editorFilters.isArchived]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCreateDocument = async (documentData) => {
    try {
      const newDoc = await editorCreateDocument(documentData);
      if (newDoc && newDoc.id) {
        handleDocumentOpen(newDoc.id);
      }
    } catch (error) {
      console.error('Failed to create document:', error);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (!validateDocumentId(documentId, 'delete document')) return;
    
    if (window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      try {
        await editorDeleteDocument(documentId);
      } catch (error) {
        console.error('Failed to delete document:', error);
      }
    }
  };

  const handleDuplicateDocument = async (documentId) => {
    if (!validateDocumentId(documentId, 'duplicate document')) return;
    
    try {
      await editorDuplicateDocument(documentId);
    } catch (error) {
      console.error('Failed to duplicate document:', error);
    }
  };

  const handleArchiveDocument = async (documentId) => {
    if (!validateDocumentId(documentId, 'archive document')) return;
    
    try {
      await editorArchiveDocument(documentId);
    } catch (error) {
      console.error('Failed to archive document:', error);
    }
  };

  const handleBulkAction = async (action, documentIds = editorSelectedDocuments) => {
    if (documentIds.length === 0) return;
    
    // Validate all document IDs
    const validDocumentIds = documentIds.filter(id => 
      id && id !== 'undefined' && id !== 'null'
    );
    
    if (validDocumentIds.length === 0) {
      console.error('No valid document IDs for bulk action');
      return;
    }
    
    setBulkActionLoading(true);
    try {
      let confirmMessage = '';
      let operation = '';

      switch (action) {
        case 'archive':
          confirmMessage = `Archive ${validDocumentIds.length} selected document(s)?`;
          operation = 'archive';
          break;
        case 'delete':
          confirmMessage = `Permanently delete ${validDocumentIds.length} selected document(s)? This action cannot be undone.`;
          operation = 'delete';
          break;
        case 'duplicate':
          confirmMessage = `Duplicate ${validDocumentIds.length} selected document(s)?`;
          operation = 'duplicate';
          break;
        default:
          return;
      }

      if (window.confirm(confirmMessage)) {
        await editorBulkOperations(operation, validDocumentIds);
        editorSetSelectedDocuments([]);
      }
    } catch (error) {
      console.error(`Failed to ${action} documents:`, error);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleExportDocument = async (documentId, format = 'json') => {
    if (!validateDocumentId(documentId, 'export document')) return;
    
    try {
      await editorExportDocument(documentId, format);
    } catch (error) {
      console.error('Failed to export document:', error);
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      const allIds = editorDocuments
        .filter(doc => doc && doc.id)
        .map(doc => doc.id);
      editorSetSelectedDocuments(allIds);
    } else {
      editorSetSelectedDocuments([]);
    }
  };

  const handleDocumentSelect = (documentId, selected) => {
    if (!documentId || documentId === 'undefined') return;
    
    if (selected) {
      editorSetSelectedDocuments([...editorSelectedDocuments, documentId]);
    } else {
      editorSetSelectedDocuments(editorSelectedDocuments.filter(id => id !== documentId));
    }
  };

  // Filter out any invalid documents and use the ones from store
  const displayedDocuments = editorDocuments.filter(doc => doc && doc.id);

  const isSelectAllChecked = displayedDocuments.length > 0 && 
    displayedDocuments.every(doc => editorSelectedDocuments.includes(doc.id));

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <EditorSidebar 
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        currentPath={location.pathname}
        documentStats={editorDocumentStats}
      />

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-16'}`}>
        {/* Header */}
        <EditorHeader
          user={user}
          onLogout={handleLogout}
          onCreateDocument={() => setShowCreateModal(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            {/* Error Display */}
            {editorError && (
              <ErrorMessage 
                message={editorError}
                onDismiss={editorClearError}
              />
            )}

            {/* Stats Overview */}
            <StatsOverview stats={editorDocumentStats} />

            {/* Quick Actions */}
            <QuickActions 
              onCreateDocument={() => setShowCreateModal(true)}
              onShowTemplates={() => navigate('/editor/templates')}
            />

            {/* Recent Documents */}
            <RecentDocuments 
              documents={editorRecentDocuments}
              onDocumentOpen={handleDocumentOpen}
            />

            {/* Search and Filters Bar */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                  <h2 className="text-lg font-semibold text-gray-900">My Documents</h2>
                  
                  {/* View Toggle */}
                  <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => editorSetViewMode('grid')}
                      className={`p-2 rounded ${
                        editorViewMode === 'grid' 
                          ? 'bg-white text-blue-600 shadow-sm' 
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                      title="Grid View"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => editorSetViewMode('list')}
                      className={`p-2 rounded ${
                        editorViewMode === 'list' 
                          ? 'bg-white text-blue-600 shadow-sm' 
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                      title="List View"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                <SearchFilters
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  filters={editorFilters}
                  onFiltersChange={editorSetFilters}
                  onRefresh={editorFetchDocuments}
                />
              </div>
            </div>

            {/* Bulk Actions Bar */}
            {editorSelectedDocumentsCount > 0 && (
              <BulkActionsBar
                selectedCount={editorSelectedDocumentsCount}
                onBulkArchive={() => handleBulkAction('archive')}
                onBulkDelete={() => handleBulkAction('delete')}
                onBulkDuplicate={() => handleBulkAction('duplicate')}
                onClearSelection={() => editorSetSelectedDocuments([])}
                loading={bulkActionLoading}
              />
            )}

            {/* Loading State */}
            {editorLoading && <LoadingSpinner message="Loading documents..." />}

            {/* Documents Display */}
            {!editorLoading && (
              <>
                {editorViewMode === 'grid' ? (
                  <DocumentGrid
                    documents={displayedDocuments}
                    selectedDocuments={editorSelectedDocuments}
                    onDocumentSelect={handleDocumentSelect}
                    onDocumentOpen={handleDocumentOpen}
                    onDocumentDuplicate={handleDuplicateDocument}
                    onDocumentArchive={handleArchiveDocument}
                    onDocumentDelete={handleDeleteDocument}
                    onDocumentExport={handleExportDocument}
                    isSelectAllChecked={isSelectAllChecked}
                    onSelectAll={handleSelectAll}
                  />
                ) : (
                  <DocumentList
                    documents={displayedDocuments}
                    selectedDocuments={editorSelectedDocuments}
                    onDocumentSelect={handleDocumentSelect}
                    onDocumentOpen={handleDocumentOpen}
                    onDocumentDuplicate={handleDuplicateDocument}
                    onDocumentArchive={handleArchiveDocument}
                    onDocumentDelete={handleDeleteDocument}
                    onDocumentExport={handleExportDocument}
                    isSelectAllChecked={isSelectAllChecked}
                    onSelectAll={handleSelectAll}
                  />
                )}

                {/* Empty State */}
                {displayedDocuments.length === 0 && (
                  <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                    <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-3xl">📊</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {searchTerm || Object.values(editorFilters).some(v => v) 
                        ? 'No documents found' 
                        : 'No documents yet'
                      }
                    </h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                      {searchTerm || Object.values(editorFilters).some(v => v)
                        ? 'Try adjusting your search or filters to find what you\'re looking for.'
                        : 'Get started by creating your first spreadsheet document to organize and analyze your data.'
                      }
                    </p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create Your First Document
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Create Document Modal */}
      {showCreateModal && (
        <CreateDocumentModal
          templates={editorTemplates}
          onSubmit={handleCreateDocument}
          onClose={() => setShowCreateModal(false)}
          loading={editorLoading}
        />
      )}
    </div>
  );
};

export default EditorDashboard;