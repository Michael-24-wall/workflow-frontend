// src/components/documents/DocumentSign.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  CheckCircle, 
  FileText, 
  Users, 
  Clock,
  AlertCircle,
  PenSquare,
  User,
  Building,
  Eye
} from 'lucide-react';
import { documentService } from '../../services/documentService';
import useAuthStore from '../../stores/authStore';

const DocumentSign = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [signatureData, setSignatureData] = useState('');
  const [signingReason, setSigningReason] = useState('');
  const [selectedSignatureType, setSelectedSignatureType] = useState('');
  const [documentContent, setDocumentContent] = useState('');

  useEffect(() => {
    loadDocument();
  }, [documentId]);

  const loadDocument = async () => {
    try {
      const response = await documentService.getDocument(documentId);
      
      // Handle different response structures safely
      let documentData = response.data;
      
      if (response.data && typeof response.data === 'object' && response.data.data) {
        documentData = response.data.data;
      }
      
      console.log('📄 Loaded document for signing:', documentData);
      setDocument(documentData);
      setDocumentContent(documentData.final_content || '');
      
      // Auto-select first available signature type for the user
      const availableTypes = getAvailableSignatureTypes(documentData.final_content || '');
      if (availableTypes.length > 0) {
        setSelectedSignatureType(availableTypes[0].type);
      }
    } catch (error) {
      console.error('Failed to load document:', error);
    } finally {
      setLoading(false);
    }
  };

  // Extract available signature types from document content
  const getAvailableSignatureTypes = (content) => {
    if (!content) return [];
    
    const signatureRegex = /--- SIGNATURE: (SIGNATURE\.\w+) ---/g;
    const signatures = [];
    let match;
    
    while ((match = signatureRegex.exec(content)) !== null) {
      const type = match[1];
      const role = type.replace('SIGNATURE.', '').toLowerCase();
      
      signatures.push({
        type: type,
        role: role,
        displayName: getSignatureDisplayName(role),
        icon: getSignatureIcon(role),
        description: getSignatureDescription(role)
      });
    }
    
    return signatures;
  };

  const getSignatureDisplayName = (role) => {
    const names = {
      manager: 'Manager',
      employee: 'Employee', 
      client: 'Client',
      witness: 'Witness',
      ceo: 'CEO',
      hr: 'HR Manager'
    };
    return names[role] || role.charAt(0).toUpperCase() + role.slice(1);
  };

  const getSignatureIcon = (role) => {
    const icons = {
      manager: User,
      employee: User,
      client: User,
      witness: User,
      ceo: Building,
      hr: Users
    };
    return icons[role] || User;
  };

  const getSignatureDescription = (role) => {
    const descriptions = {
      manager: 'Manager approval signature',
      employee: 'Employee acceptance signature',
      client: 'Client agreement signature', 
      witness: 'Witness confirmation signature',
      ceo: 'Executive approval signature',
      hr: 'HR department signature'
    };
    return descriptions[role] || 'Digital signature';
  };

  const handleSignDocument = async () => {
    if (!signatureData.trim()) {
      alert('Please provide your signature data');
      return;
    }

    if (!selectedSignatureType) {
      alert('Please select a signature type');
      return;
    }

    setSigning(true);
    try {
      await documentService.signDocument(documentId, {
        signature_data: signatureData,
        signing_reason: signingReason,
        signature_type: selectedSignatureType,
        role: selectedSignatureType.replace('SIGNATURE.', '').toLowerCase()
      });
      
      // Redirect to document view after successful signing
      navigate(`/documents/${documentId}`);
    } catch (error) {
      console.error('Failed to sign document:', error);
      alert('Failed to sign document. Please try again.');
    } finally {
      setSigning(false);
    }
  };

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

  // Safe data access with fallbacks
  const documentTitle = document?.title || 'Untitled Document';
  const documentStatus = document?.status || 'draft';
  const documentCreatedAt = document?.created_at || new Date().toISOString();
  const templateName = document?.template?.name || document?.template_name || 'None';
  
  // Safe signatures access
  const signatures = document?.signatures || document?.documents_signatures || [];
  const hasSigned = signatures.some(sig => sig.signer?.id === user?.id || sig.signer_id === user?.id);
  
  // Get signature types and check which ones user has signed
  const availableSignatureTypes = getAvailableSignatureTypes(documentContent);
  const userSignedTypes = signatures
    .filter(sig => sig.signer?.id === user?.id || sig.signer_id === user?.id)
    .map(sig => sig.signature_type || sig.role);
  
  // Safe can_sign logic - now based on available signature types
  const canSign = document?.status && 
    ['pending_review', 'pending_approval', 'pending_final_signature', 'draft'].includes(document.status) && 
    availableSignatureTypes.length > 0 &&
    availableSignatureTypes.some(type => !userSignedTypes.includes(type.type));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            Document not found
          </h3>
          <button
            onClick={() => navigate('/documents')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Documents
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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
                  Sign Document
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {documentTitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(documentStatus)}`}>
                {documentStatus.replace(/_/g, ' ')}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {availableSignatureTypes.length} signature{availableSignatureTypes.length !== 1 ? 's' : ''} required
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Signing Form & Document Preview */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Signing Form */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <PenSquare className="h-5 w-5" />
                    Digital Signature
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                    Provide your digital signature to approve this document
                  </p>
                </div>

                <div className="p-6 space-y-6">
                  {hasSigned && userSignedTypes.length > 0 ? (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <div>
                          <h3 className="text-green-800 dark:text-green-300 font-medium">
                            Already Signed
                          </h3>
                          <p className="text-green-700 dark:text-green-400 text-sm">
                            You have signed this document as: {userSignedTypes.map(type => 
                              getSignatureDisplayName(type.replace('SIGNATURE.', ''))
                            ).join(', ')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : !canSign ? (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                        <div>
                          <h3 className="text-yellow-800 dark:text-yellow-300 font-medium">
                            Cannot Sign Document
                          </h3>
                          <p className="text-yellow-700 dark:text-yellow-400 text-sm">
                            {documentStatus === 'signed' 
                              ? 'This document has already been fully signed.' 
                              : documentStatus === 'draft'
                              ? 'This document is still in draft status and cannot be signed yet.'
                              : availableSignatureTypes.length === 0
                              ? 'This document has no signature requirements.'
                              : 'This document is not in a signable status or you don\'t have permission to sign it.'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Signature Type Selection */}
                      {availableSignatureTypes.length > 1 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Select Signature Role *
                          </label>
                          <div className="grid grid-cols-1 gap-2">
                            {availableSignatureTypes.map((sigType) => {
                              const Icon = sigType.icon;
                              const isSelected = selectedSignatureType === sigType.type;
                              const isSigned = userSignedTypes.includes(sigType.type);
                              
                              return (
                                <div
                                  key={sigType.type}
                                  onClick={() => !isSigned && setSelectedSignatureType(sigType.type)}
                                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                                    isSigned
                                      ? 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 opacity-50'
                                      : isSelected
                                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                                      : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                                      isSigned 
                                        ? 'bg-gray-200 dark:bg-gray-600' 
                                        : isSelected 
                                        ? 'bg-blue-100 dark:bg-blue-800' 
                                        : 'bg-gray-200 dark:bg-gray-600'
                                    }`}>
                                      <Icon className={`h-4 w-4 ${
                                        isSigned 
                                          ? 'text-gray-500 dark:text-gray-400' 
                                          : isSelected 
                                          ? 'text-blue-600 dark:text-blue-400' 
                                          : 'text-gray-500 dark:text-gray-400'
                                      }`} />
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {sigType.displayName}
                                        {isSigned && <span className="ml-2 text-green-600">✓ Signed</span>}
                                      </p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {sigType.description}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Signature Input */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Digital Signature *
                        </label>
                        <textarea
                          value={signatureData}
                          onChange={(e) => setSignatureData(e.target.value)}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                          placeholder="Enter your signature data, draw your signature, or provide authentication token..."
                          required
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          This could be a drawn signature, cryptographic hash, or authentication token
                        </p>
                      </div>

                      {/* Signing Reason */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Reason for Signing (Optional)
                        </label>
                        <input
                          type="text"
                          value={signingReason}
                          onChange={(e) => setSigningReason(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., Approved for processing, Verified accuracy..."
                        />
                      </div>

                      {/* Terms and Conditions */}
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                          Important Notice
                        </h4>
                        <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                          <li>• Your signature will be cryptographically linked to this document</li>
                          <li>• The signing action will be recorded with timestamp and IP address</li>
                          <li>• Once signed, the document status may change based on workflow rules</li>
                          <li>• This action cannot be undone</li>
                        </ul>
                      </div>

                      {/* Sign Button */}
                      <button
                        onClick={handleSignDocument}
                        disabled={signing || !signatureData.trim() || !selectedSignatureType}
                        className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-semibold"
                      >
                        {signing ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Signing Document...
                          </>
                        ) : (
                          <>
                            <PenSquare className="h-5 w-5" />
                            Sign as {selectedSignatureType ? getSignatureDisplayName(selectedSignatureType.replace('SIGNATURE.', '')) : '...'}
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Document Preview */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                  <Eye className="h-4 w-4 text-gray-500" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Document Preview
                  </h3>
                </div>
                <div className="p-4">
                  <div 
                    className="h-96 overflow-y-auto prose dark:prose-invert max-w-none text-sm"
                    dangerouslySetInnerHTML={{ 
                      __html: documentContent.replace(
                        /--- SIGNATURE: (SIGNATURE\.\w+) ---[\s\S]*?--- END SIGNATURE ---/g,
                        (match, type) => {
                          const isSigned = signatures.some(sig => 
                            sig.signature_type === type || sig.role === type.replace('SIGNATURE.', '')
                          );
                          const isCurrent = selectedSignatureType === type;
                          
                          return `<div class="p-3 my-2 rounded-lg border-2 ${
                            isSigned 
                              ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700' 
                              : isCurrent
                              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                              : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-600'
                          } signature-block">
                            <div class="flex items-center gap-2 mb-1">
                              <span class="text-xs font-medium ${
                                isSigned ? 'text-green-700 dark:text-green-300' : 'text-yellow-700 dark:text-yellow-300'
                              }">
                                ${getSignatureDisplayName(type.replace('SIGNATURE.', ''))} Signature
                                ${isSigned ? ' ✓' : ''}
                                ${isCurrent ? ' (Current)' : ''}
                              </span>
                            </div>
                            ${match}
                          </div>`;
                        }
                      )
                    }} 
                  />
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
                    {documentTitle}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Created:</span>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(documentCreatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Template:</span>
                  <p className="text-gray-900 dark:text-white">
                    {templateName}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Required Signatures:</span>
                  <p className="text-gray-900 dark:text-white">
                    {signatures.filter(s => s.signed_at).length} of {availableSignatureTypes.length} completed
                  </p>
                </div>
              </div>
            </div>

            {/* Signature Progress */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Signature Progress
              </h3>
              
              <div className="space-y-3">
                {availableSignatureTypes.map((sigType) => {
                  const signature = signatures.find(sig => 
                    sig.signature_type === sigType.type || sig.role === sigType.role
                  );
                  const isSigned = !!signature;
                  const Icon = sigType.icon;
                  
                  return (
                    <div key={sigType.type} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          isSigned ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-200 dark:bg-gray-600'
                        }`}>
                          <Icon className={`h-4 w-4 ${
                            isSigned ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
                          }`} />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {sigType.displayName}
                          {isSigned && <span className="ml-2 text-green-600 text-xs">✓ Signed</span>}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {isSigned 
                            ? `Signed by ${signature.signer_name || signature.signer?.email || 'Unknown'} on ${new Date(signature.signed_at).toLocaleDateString()}`
                            : 'Pending signature'
                          }
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            {!hasSigned && canSign && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  <span className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                    Ready to Sign
                  </span>
                </div>
                <p className="text-xs text-yellow-700 dark:text-yellow-400">
                  You are about to digitally sign this document. Ensure you have reviewed the content thoroughly.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentSign;