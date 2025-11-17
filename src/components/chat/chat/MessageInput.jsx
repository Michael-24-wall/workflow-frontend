import React, { useState, useRef, useEffect } from 'react';

export default function MessageInput({ onSendMessage, disabled = false, placeholder = "Type a message...", channelId }) {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [message]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (files.length > 0) {
      await handleSendFiles();
    }
    
    if (message.trim()) {
      await handleSendTextMessage();
    }
  };

  const handleSendTextMessage = async () => {
    if (message.trim()) {
      try {
        await onSendMessage(message.trim(), null);
        setMessage('');
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    }
  };

  const handleSendFiles = async () => {
    if (files.length === 0) return;

    setUploading(true);
    try {
      for (const file of files) {
        console.log('📤 Uploading file from MessageInput:', file.name);
        await onSendMessage(message.trim() || `File: ${file.name}`, file);
      }
      setFiles([]);
      setMessage('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Failed to upload files:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e) => {
    setMessage(e.target.value);
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) {
      setFiles(selectedFiles);
      
      // Auto-send if no text message
      if (!message.trim()) {
        handleSendFiles();
      }
    }
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Add drag and drop functionality
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      setFiles(droppedFiles);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.startsWith('video/')) return '🎥';
    if (fileType.startsWith('audio/')) return '🎵';
    if (fileType.includes('pdf')) return '📕';
    if (fileType.includes('word')) return '📄';
    if (fileType.includes('excel') || fileType.includes('sheet')) return '📊';
    if (fileType.includes('zip') || fileType.includes('archive')) return '📦';
    return '📎';
  };

  const isSendDisabled = (!message.trim() && files.length === 0) || disabled || uploading;

  return (
    <div 
      className={`bg-slate-800 rounded-xl p-4 border transition-colors ${
        isDragging ? 'border-blue-400 bg-blue-900/20' : 'border-slate-700'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {files.length > 0 && (
        <div className="mb-4 p-3 bg-slate-700 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-300">
              {uploading ? 'Uploading...' : `Attachments (${files.length})`}
            </span>
            {!uploading && (
              <button
                type="button"
                onClick={() => setFiles([])}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-slate-600 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{getFileIcon(file.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">{file.name}</div>
                    <div className="text-xs text-slate-400">{formatFileSize(file.size)}</div>
                  </div>
                </div>
                {!uploading && (
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-slate-400 hover:text-red-400 p-1 transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex space-x-3 items-end">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            placeholder={isDragging ? "Drop files here..." : placeholder}
            rows="1"
            className="w-full bg-slate-700 text-white placeholder-slate-400 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none max-h-32 border border-slate-600 disabled:opacity-50"
            disabled={disabled || uploading}
          />
          
          <div className="absolute right-2 bottom-2 flex space-x-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || uploading}
              className="text-slate-400 hover:text-white p-1 transition-colors disabled:opacity-50"
              title="Attach files"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            multiple
            accept="*/*"
            disabled={disabled || uploading}
          />
        </div>
        
        <button
          type="submit"
          disabled={isSendDisabled}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors min-w-20 flex items-center justify-center shadow-lg"
        >
          {uploading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            'Send'
          )}
        </button>
      </form>

      <div className="mt-2 text-xs text-slate-500 flex justify-between">
        <span>{isDragging ? "Drop files to upload" : "Press Enter to send, Shift+Enter for new line"}</span>
        <span>{message.length}/1000</span>
      </div>
    </div>
  );
}