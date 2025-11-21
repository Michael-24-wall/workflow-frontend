// src/components/documents/DocumentShare.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Share2, 
  Copy, 
  Send, 
  Users, 
  Clock,
  Eye,
  MessageSquare,
  Edit,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { documentService } from '../../services/documentService';

const DocumentShare = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [shareData, setShareData] = useState({
    share_with: [],
    permission_level: 'view',
    expires_at: ''
  });
  const [activeUsers, setActiveUsers] = useState([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadDocument();
    generateShareLink();
    // In a real app, you'd fetch active users from your API
    setActiveUsers([
      { id: 1, name: 'John Doe', email: 'john@example.com', avatar: '' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', avatar: '' },
      { id: 3, name: 'Mike Johnson', email: 'mike@example.com', avatar: '' }
    ]);
  }, [documentId]);

  const loadDocument = async () => {
    try {
      const response = await documentService.getDocument(documentId);
      setDocument(response.data);
    } catch (error) {
      console.error('Failed to load document:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateShareLink = () => {
    // In a real app, this would come from your backend
    const baseUrl = window.location.origin;
    const token = `doc_${documentId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setShareLink(`${baseUrl}/shared/${token}`);
  };

  const handleShare = async () => {
    if (shareData.share_with.length === 0) {
      alert('Please select at least one user to share with');
      return;
    }

    setSharing(true);
    try {
      await documentService.shareDocument(documentId, shareData);
      alert('Document shared successfully!');
      navigate(`/documents/${documentId}`);
    } catch (error) {
      console.error('Failed to share document:', error);
      alert('Failed to share document. Please try again.');
    } finally {
      setSharing(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleUserSelect = (userId) => {
    setShareData(prev => {
      const isSelected = prev.share_with.includes(userId);
      return {
        ...prev,
        share_with: isSelected 
          ? prev.share_with.filter(id => id !== userId)
          : [...prev.share_with, userId]
      };
    });
  };

  const getPermissionIcon = (level) => {
    switch (level) {
      case 'view': return Eye;
      case 'comment': return MessageSquare;
      case 'edit': return Edit;
      case 'sign': return CheckCircle;
      default: return Eye;
    }
  };

  const getPermissionDescription = (level) => {
    switch (level) {
      case 'view': return 'Can view the document only';
      case 'comment': return 'Can view and add comments';
      case 'edit': return 'Can view, comment, and edit content';
      case 'sign': return 'Can view, comment, edit, and sign the document';
      default: return '';
    }
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(`/documents/${documentId}`)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Share Document
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {document?.title}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <Share2 className="h-5 w-5" />
              <span>Share Settings</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Share Form */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Share with People
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  Select team members to share this document with
                </p>
              </div>

              <div className="p-6 space-y-6">
                {/* User Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Select Team Members *
                  </label>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {activeUsers.map((user) => {
                      const isSelected = shareData.share_with.includes(user.id);
                      const Icon = isSelected ? CheckCircle : Users;
                      
                      return (
                        <div
                          key={user.id}
                          onClick={() => handleUserSelect(user.id)}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                              : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                          }`}
                        >
                          <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                            isSelected 
                              ? 'bg-blue-100 dark:bg-blue-800' 
                              : 'bg-gray-200 dark:bg-gray-600'
                          }`}>
                            <Icon className={`h-4 w-4 ${
                              isSelected 
                                ? 'text-blue-600 dark:text-blue-400' 
                                : 'text-gray-500 dark:text-gray-400'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {user.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {user.email}
                            </p>
                          </div>
                          {isSelected && (
                            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                              Selected
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Permission Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Permission Level
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {['view', 'comment', 'edit', 'sign'].map((level) => {
                      const Icon = getPermissionIcon(level);
                      const isSelected = shareData.permission_level === level;
                      
                      return (
                        <div
                          key={level}
                          onClick={() => setShareData(prev => ({ ...prev, permission_level: level }))}
                          className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                              : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                              isSelected 
                                ? 'bg-blue-100 dark:bg-blue-800' 
                                : 'bg-gray-200 dark:bg-gray-600'
                            }`}>
                              <Icon className={`h-4 w-4 ${
                                isSelected 
                                  ? 'text-blue-600 dark:text-blue-400' 
                                  : 'text-gray-500 dark:text-gray-400'
                              }`} />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                                {level}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {getPermissionDescription(level)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Expiration Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Expiration Date (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={shareData.expires_at}
                    onChange={(e) => setShareData(prev => ({ ...prev, expires_at: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Leave empty for no expiration
                  </p>
                </div>

                {/* Share Button */}
                <button
                  onClick={handleShare}
                  disabled={sharing || shareData.share_with.length === 0}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-semibold"
                >
                  {sharing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Sharing...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      Share Document
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Share Link Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mt-6">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Shareable Link
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  Copy this link to share with anyone
                </p>
              </div>

              <div className="p-6">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={shareLink}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <ExternalLink className="h-4 w-4" />
                  <span>Anyone with the link can view this document</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Document Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Document Information
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Title:</span>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {document?.title}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Status:</span>
                  <p className="text-gray-900 dark:text-white capitalize">
                    {document?.status?.replace(/_/g, ' ')}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Created:</span>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(document?.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Sharing Tips */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                Sharing Tips
              </h4>
              <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                <li>• Choose appropriate permission levels for each user</li>
                <li>• Set expiration dates for temporary access</li>
                <li>• Use shareable links for external collaborators</li>
                <li>• Review shared documents regularly</li>
              </ul>
            </div>

            {/* Current Shares */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Currently Shared With
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                      <Eye className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      You
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Owner • Full access
                    </p>
                  </div>
                </div>
                
                {/* In a real app, you'd map through actual shared users */}
                <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
                  No other users have access yet
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentShare;