// src/components/documents/DocumentDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  FileText, 
  Search, 
  Download, 
  Share2, 
  MoreVertical,
  Users,
  BarChart3,
  PenSquare // Added for sign icon
} from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import { documentService } from '../../services/documentService';

const DocumentDashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    pending: 0,
    signed: 0,
    archived: 0
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadDocuments(),
        loadTemplates(),
        loadStats()
      ]);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async () => {
    try {
      const response = await documentService.getDocuments();
      
      // ✅ FIX: Handle different response structures safely
      let documentsData = [];
      
      if (Array.isArray(response.data)) {
        documentsData = response.data;
      } else if (response.data && typeof response.data === 'object') {
        // Handle different possible response structures
        if (response.data.results && Array.isArray(response.data.results)) {
          documentsData = response.data.results; // Django pagination format
        } else if (response.data.data && Array.isArray(response.data.data)) {
          documentsData = response.data.data; // Some APIs nest data
        } else if (response.data.documents && Array.isArray(response.data.documents)) {
          documentsData = response.data.documents;
        } else {
          // If it's an object but not the expected structure, log it
          console.warn('Unexpected documents response structure:', response.data);
          documentsData = [];
        }
      }
      
      console.log('📊 Loaded documents:', documentsData);
      setDocuments(Array.isArray(documentsData) ? documentsData : []);
      
    } catch (error) {
      console.error('Failed to load documents:', error);
      setDocuments([]); // Always set to empty array on error
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await documentService.getTemplates();
      
      // ✅ FIX: Handle different response structures for templates
      let templatesData = [];
      
      if (Array.isArray(response.data)) {
        templatesData = response.data;
      } else if (response.data && typeof response.data === 'object') {
        if (response.data.results && Array.isArray(response.data.results)) {
          templatesData = response.data.results;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          templatesData = response.data.data;
        } else {
          templatesData = [];
        }
      }
      
      console.log('📊 Loaded templates:', templatesData);
      setTemplates(Array.isArray(templatesData) ? templatesData : []);
      
    } catch (error) {
      console.error('Failed to load templates:', error);
      setTemplates([]);
    }
  };

  const loadStats = async () => {
    try {
      const response = await documentService.getStatistics();
      
      // ✅ FIX: Handle stats response safely
      let statsData = {};
      
      if (response.data && typeof response.data === 'object') {
        statsData = {
          total: response.data.total_documents || 0,
          draft: response.data.by_status?.draft || 0,
          pending: (response.data.by_status?.pending_review || 0) + 
                   (response.data.by_status?.pending_approval || 0) +
                   (response.data.by_status?.pending_final_signature || 0),
          signed: response.data.by_status?.signed || 0,
          archived: response.data.by_status?.archived || 0
        };
      }
      
      console.log('📊 Loaded stats:', statsData);
      setStats(statsData);
      
    } catch (error) {
      console.error('Failed to load stats:', error);
      // Set default stats on error
      setStats({
        total: 0,
        draft: 0,
        pending: 0,
        signed: 0,
        archived: 0
      });
    }
  };

  // ✅ FIX: Safe filtering with array check
  const filteredDocuments = Array.isArray(documents) 
    ? documents.filter(doc => {
        if (!doc || typeof doc !== 'object') return false;
        
        const matchesSearch = (
          (doc.title && doc.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (doc.status && doc.status.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (doc.template_name && doc.template_name.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        
        const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
    : [];

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      pending_review: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      pending_approval: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      pending_final_signature: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      signed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      archived: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  const formatStatus = (status) => {
    if (!status) return 'Unknown';
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // ✅ NEW: Check if document can be signed
  const canSignDocument = (document) => {
    if (!document || !user) return false;
    
    const signableStatuses = ['pending_review', 'pending_approval', 'pending_final_signature'];
    const isSignableStatus = signableStatuses.includes(document.status);
    
    // Check if user has already signed
    const hasSigned = document.signatures?.some(sig => 
      sig.signer?.id === user.id || sig.signer_id === user.id
    ) || document.documents_signatures?.some(sig => 
      sig.signer?.id === user.id || sig.signer_id === user.id
    );
    
    return isSignableStatus && !hasSigned;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Document Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Create, manage, and track your documents
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Documents
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.total}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                In Progress
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.draft + stats.pending}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <BarChart3 className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Signed
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.signed}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Templates
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {templates.length}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-full sm:w-64 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="pending_review">Pending Review</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="pending_final_signature">Pending Final Signature</option>
              <option value="signed">Signed</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <Link
              to="/documents/templates"
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Templates
            </Link>
            
            <Link
              to="/documents/create"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Document
            </Link>
          </div>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocuments.map((document) => (
          <DocumentCard 
            key={document.id} 
            document={document} 
            onUpdate={loadDocuments}
            getStatusColor={getStatusColor}
            formatStatus={formatStatus}
            canSign={canSignDocument(document)}
          />
        ))}
      </div>

      {filteredDocuments.length === 0 && documents.length > 0 && (
        <div className="text-center py-12">
          <Search className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No documents match your search
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Try adjusting your search terms or filters.
          </p>
        </div>
      )}

      {documents.length === 0 && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No documents found
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Get started by creating a new document.
          </p>
          <div className="mt-6">
            <Link
              to="/documents/create"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Document
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

const DocumentCard = ({ document, onUpdate, getStatusColor, formatStatus, canSign }) => {
  const navigate = useNavigate();

  const handleAction = async (action, documentId) => {
    try {
      switch (action) {
        case 'download':
          await documentService.downloadDocument(documentId);
          break;
        case 'share':
          navigate(`/documents/${documentId}/share`);
          break;
        case 'archive':
          await documentService.updateDocument(documentId, { status: 'archived' });
          onUpdate();
          break;
        case 'sign':
          navigate(`/documents/${documentId}/sign`);
          break;
      }
    } catch (error) {
      console.error('Action failed:', error);
    }
  };

  // ✅ FIX: Safe data access with fallbacks
  const documentTitle = document?.title || 'Untitled Document';
  const documentStatus = document?.status || 'draft';
  const templateName = document?.template_name || document?.template?.name || 'No template';
  const createdByName = document?.created_by_name || document?.created_by?.name || 'Unknown';
  const updatedAt = document?.updated_at || document?.created_at || new Date().toISOString();
  const signatureCount = document?.signature_count || document?.documents_signatures?.length || 0;
  const hasFileAttachment = document?.file_attachment;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
              {documentTitle}
            </h3>
            <div className="flex items-center gap-2 mb-3">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(documentStatus)}`}>
                {formatStatus(documentStatus)}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {templateName}
              </span>
            </div>
          </div>
          
          <div className="relative">
            <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              <MoreVertical className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex justify-between">
            <span>Created by:</span>
            <span className="text-gray-900 dark:text-white">
              {createdByName}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Last updated:</span>
            <span className="text-gray-900 dark:text-white">
              {new Date(updatedAt).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Signatures:</span>
            <span className="text-gray-900 dark:text-white">
              {signatureCount}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            {hasFileAttachment && (
              <button
                onClick={() => handleAction('download', document.id)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title="Download"
              >
                <Download className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => handleAction('share', document.id)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Share"
            >
              <Share2 className="h-4 w-4" />
            </button>
            {/* ✅ NEW: Sign Button */}
            {canSign && (
              <button
                onClick={() => handleAction('sign', document.id)}
                className="p-2 text-green-400 hover:text-green-600 dark:hover:text-green-300 transition-colors"
                title="Sign Document"
              >
                <PenSquare className="h-4 w-4" />
              </button>
            )}
          </div>
          
          <div className="flex gap-2">
            {/* ✅ NEW: Sign Button for signable documents */}
            {canSign && (
              <button
                onClick={() => handleAction('sign', document.id)}
                className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded transition-colors flex items-center gap-1"
              >
                <PenSquare className="h-3 w-3" />
                Sign
              </button>
            )}
            <button
              onClick={() => navigate(`/documents/${document.id}`)}
              className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            >
              View
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentDashboard;