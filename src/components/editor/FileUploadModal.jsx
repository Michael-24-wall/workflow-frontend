// src/components/editor/FileUploadModal.jsx
import React, { useState, useRef } from 'react';
import { X, Upload, File, Image, FileText, AlertCircle, CheckCircle2, FolderOpen } from 'lucide-react';
import useEditorStore from '../../stores/editorStore';

const FileUploadModal = ({ isOpen, onClose, onFilesUploaded }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadResults, setUploadResults] = useState([]);
  const fileInputRef = useRef(null);

  const { createDocument } = useEditorStore();

  const supportedFormats = {
    spreadsheet: ['.xlsx', '.xls', '.csv', '.ods'],
    document: ['.doc', '.docx', '.pdf', '.txt', '.rtf', '.md'],
    image: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'],
    presentation: ['.ppt', '.pptx', '.key']
  };

  const allSupportedExtensions = Object.values(supportedFormats).flat();

  const getFileType = (fileName) => {
    const extension = fileName.toLowerCase().split('.').pop();
    
    if (supportedFormats.spreadsheet.includes(`.${extension}`)) return 'spreadsheet';
    if (supportedFormats.document.includes(`.${extension}`)) return 'document';
    if (supportedFormats.image.includes(`.${extension}`)) return 'image';
    if (supportedFormats.presentation.includes(`.${extension}`)) return 'presentation';
    return 'document';
  };

  const getFileIcon = (fileName) => {
    const fileType = getFileType(fileName);
    
    switch (fileType) {
      case 'spreadsheet': return '📊';
      case 'document': return '📄';
      case 'image': return '🖼️';
      case 'presentation': return '📽️';
      default: return '📎';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleFiles = (files) => {
    const validFiles = files.filter(file => {
      const extension = `.${file.name.toLowerCase().split('.').pop()}`;
      const isValid = allSupportedExtensions.includes(extension);
      
      if (!isValid) {
        console.warn(`Unsupported file type: ${file.name}`);
      }
      
      return isValid && file.size <= 50 * 1024 * 1024; // 50MB limit
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const simulateFileUpload = async (file) => {
    return new Promise((resolve) => {
      const totalTime = 2000; // 2 seconds total
      const interval = 100; // Update every 100ms
      let progress = 0;
      
      const progressInterval = setInterval(() => {
        progress += 5;
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: Math.min(progress, 100)
        }));
        
        if (progress >= 100) {
          clearInterval(progressInterval);
          
          // Create a document from the uploaded file
          setTimeout(async () => {
            const documentData = {
              title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
              description: `Uploaded file: ${file.name}`,
              document_type: getFileType(file.name),
              is_template: false,
              editor_data: {
                original_filename: file.name,
                file_size: file.size,
                uploaded_at: new Date().toISOString(),
                content: `This is a placeholder for the uploaded file: ${file.name}. In a real application, this would contain the actual file content.`
              }
            };
            
            const result = await createDocument(documentData);
            resolve(result);
          }, 500);
        }
      }, interval);
    });
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    setUploading(true);
    setUploadResults([]);
    
    const results = [];
    
    for (const file of selectedFiles) {
      try {
        const result = await simulateFileUpload(file);
        results.push({
          file: file,
          success: result.success,
          document: result.data,
          error: result.error
        });
      } catch (error) {
        results.push({
          file: file,
          success: false,
          error: error.message
        });
      }
    }
    
    setUploadResults(results);
    setUploading(false);
    
    // Call the callback with results
    if (onFilesUploaded) {
      onFilesUploaded(results);
    }
  };

  const resetModal = () => {
    setSelectedFiles([]);
    setUploading(false);
    setUploadProgress({});
    setUploadResults([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Upload className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Upload Files</h2>
              <p className="text-sm text-gray-600">Add files to your document library</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={uploading}
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Upload Area */}
          {selectedFiles.length === 0 && uploadResults.length === 0 && (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Drop files here</h3>
              <p className="text-gray-600 mb-4">or click to browse</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Select Files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={allSupportedExtensions.join(',')}
                onChange={handleFileSelect}
                className="hidden"
              />
              <p className="text-xs text-gray-500 mt-4">
                Supported formats: {allSupportedExtensions.join(', ')}
                <br />
                Max file size: 50MB
              </p>
            </div>
          )}

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Selected Files ({selectedFiles.length})</h4>
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3 flex-1">
                    <span className="text-2xl">{getFileIcon(file.name)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(file.size)} • {getFileType(file.name)}
                      </p>
                    </div>
                  </div>
                  
                  {uploading ? (
                    <div className="w-24">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress[file.name] || 0}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {uploadProgress[file.name] || 0}%
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  )}
                </div>
              ))}
              
              {!uploading && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
                >
                  <Upload className="w-5 h-5 inline mr-2" />
                  Add more files
                </button>
              )}
            </div>
          )}

          {/* Upload Results */}
          {uploadResults.length > 0 && (
            <div className="space-y-3 mt-6">
              <h4 className="font-medium text-gray-900">Upload Results</h4>
              {uploadResults.map((result, index) => (
                <div
                  key={index}
                  className={`flex items-center space-x-3 p-3 rounded-lg ${
                    result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}
                >
                  {result.success ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{result.file.name}</p>
                    <p className={`text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                      {result.success ? 'Successfully uploaded' : `Failed: ${result.error}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {selectedFiles.length > 0 && `Ready to upload ${selectedFiles.length} file(s)`}
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={uploading}
            >
              {uploadResults.length > 0 ? 'Close' : 'Cancel'}
            </button>
            
            {selectedFiles.length > 0 && uploadResults.length === 0 && (
              <button
                onClick={handleUpload}
                disabled={uploading || selectedFiles.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Upload Files</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUploadModal;