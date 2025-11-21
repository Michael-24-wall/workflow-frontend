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
  Send
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

  if (loading) {
    return <div>Loading...</div>;
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
          {/* Editor */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={20}
                  className="w-full h-full min-h-[500px] p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Start writing your document content..."
                />
              </div>
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
                    {document.signatures?.length || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                Actions
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
                  disabled={!document.can_sign}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                >
                  <Send className="h-4 w-4" />
                  Sign Document
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