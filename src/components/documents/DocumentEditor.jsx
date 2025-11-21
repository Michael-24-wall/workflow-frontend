// src/components/documents/DocumentEditor.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Save, 
  Download, 
  Share2, 
  Users, 
  FileText, 
  ArrowLeft,
  Send,
  PenSquare,
  Eye
} from 'lucide-react';
import { documentService } from '../../services/documentService';

const DocumentEditor = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [viewMode, setViewMode] = useState('edit'); // 'edit' or 'preview'

  useEffect(() => {
    loadDocument();
  }, [documentId]);

  const loadDocument = async () => {
    try {
      const response = await documentService.getDocument(documentId);
      setDocument(response.data);
      setTitle(response.data.title);
      setContent(response.data.final_content || '');
    } catch (error) {
      console.error('Failed to load document:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await documentService.updateDocument(documentId, {
        title,
        final_content: content
      });
      // Show success message
    } catch (error) {
      console.error('Failed to save document:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleGeneratePDF = async () => {
    try {
      await documentService.generatePDF(documentId);
      loadDocument(); // Reload to get updated file attachment
      // Show success message
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    }
  };

  // Extract signature requirements from content
  const getSignatureRequirements = () => {
    if (!content) return [];
    
    const signatureRegex = /--- SIGNATURE: (SIGNATURE\.\w+) ---/g;
    const signatures = [];
    let match;
    
    while ((match = signatureRegex.exec(content)) !== null) {
      signatures.push({
        type: match[1],
        position: match.index
      });
    }
    
    return signatures;
  };

  const signatureRequirements = getSignatureRequirements();

  // Render content with signature placeholders highlighted
  const renderPreviewContent = () => {
    if (!content) return content;
    
    let renderedContent = content;
    
    // Highlight signature blocks
    renderedContent = renderedContent.replace(
      /--- SIGNATURE: (SIGNATURE\.\w+) ---[\s\S]*?--- END SIGNATURE ---/g,
      (match) => {
        return `<div class="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-600 p-4 my-4 rounded-lg signature-block">${match}</div>`;
      }
    );
    
    // Highlight simple signature placeholders
    renderedContent = renderedContent.replace(
      /\[(signature\.\w+)\]/g,
      '<span class="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-2 py-1 rounded border border-red-300 dark:border-red-700 font-mono text-sm">[$1]</span>'
    );
    
    return renderedContent;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/documents')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
              
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-2xl font-bold bg-transparent border-none focus:outline-none focus:ring-0 text-gray-900 dark:text-white"
              />
              
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                document.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                document.status === 'signed' ? 'bg-green-100 text-green-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {document.status.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('edit')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'edit'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <PenSquare className="h-4 w-4 inline mr-1" />
                  Edit
                </button>
                <button
                  onClick={() => setViewMode('preview')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'preview'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Eye className="h-4 w-4 inline mr-1" />
                  Preview
                </button>
              </div>

              <button
                onClick={handleGeneratePDF}
                disabled={document.status !== 'draft'}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                <FileText className="h-4 w-4" />
                Generate PDF
              </button>
              
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Editor/Preview */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              {viewMode === 'edit' ? (
                <div className="p-6">
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={20}
                    className="w-full h-full min-h-[500px] p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    placeholder="Start writing your document content..."
                  />
                </div>
              ) : (
                <div className="p-6">
                  <div 
                    className="min-h-[500px] p-4 prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: renderPreviewContent() }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Document Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                Document Info
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Template:</span>
                  <p className="text-gray-900 dark:text-white">
                    {document.template?.name || 'None'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Created:</span>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(document.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Signatures:</span>
                  <p className="text-gray-900 dark:text-white">
                    {document.signatures?.length || 0} / {signatureRequirements.length}
                  </p>
                </div>
              </div>
            </div>

            {/* Signature Requirements */}
            {signatureRequirements.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <PenSquare className="h-4 w-4" />
                  Signature Requirements
                </h3>
                <div className="space-y-2">
                  {signatureRequirements.map((req, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                      <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm text-yellow-800 dark:text-yellow-300 capitalize">
                        {req.type.replace('SIGNATURE.', '').toLowerCase()} signature
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  These signatures will be required before the document can be completed.
                </p>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    const signatureBlock = `\n\n--- SIGNATURE: SIGNATURE.CLIENT ---\n[Place for client signature]\n__________________________________________________\nName: \nDate: \n--- END SIGNATURE ---\n`;
                    setContent(prev => prev + signatureBlock);
                    setViewMode('edit');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors border border-dashed border-gray-300 dark:border-gray-600"
                >
                  <PenSquare className="h-4 w-4" />
                  Add Signature Block
                </button>
                
                <button
                  onClick={() => {
                    const today = new Date().toLocaleDateString();
                    setContent(prev => prev + ` {{date.today}}`);
                    setViewMode('edit');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors border border-dashed border-gray-300 dark:border-gray-600"
                >
                  <FileText className="h-4 w-4" />
                  Insert Today's Date
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                Document Actions
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => navigate(`/documents/${documentId}/share`)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Share2 className="h-4 w-4" />
                  Share Document
                </button>
                
                {document.file_attachment && (
                  <button
                    onClick={() => documentService.downloadDocument(documentId)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Download PDF
                  </button>
                )}
                
                <button
                  onClick={() => navigate(`/documents/${documentId}/sign`)}
                  disabled={!document.can_sign || signatureRequirements.length === 0}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                >
                  <Send className="h-4 w-4" />
                  {signatureRequirements.length > 0 ? `Sign (${signatureRequirements.length})` : 'Sign Document'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentEditor;