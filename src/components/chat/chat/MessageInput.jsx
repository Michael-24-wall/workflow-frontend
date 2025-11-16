import React, { useState, useRef, useEffect } from 'react';

export default function MessageInput({ onSendMessage, onTyping, placeholder = "Type a message..." }) {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [message]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // If we have files, send them first
    if (files.length > 0) {
      await handleSendFiles();
    }
    
    // If we have text message, send it
    if (message.trim()) {
      await handleSendTextMessage();
    }
  };

  const handleSendTextMessage = async () => {
    if (message.trim()) {
      try {
        await onSendMessage(message.trim(), null);
        setMessage('');
        handleStopTyping();
        
        // Reset textarea height
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

    setIsUploading(true);
    try {
      for (const file of files) {
        await onSendMessage('', file);
      }
      setFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Failed to upload files:', error);
      alert('Failed to upload files: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    
    // Handle typing indicators
    if (!isTyping && e.target.value.trim()) {
      setIsTyping(true);
      onTyping && onTyping(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      onTyping && onTyping(false);
    }, 1000);
  };

  const handleStopTyping = () => {
    setIsTyping(false);
    onTyping && onTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) {
      setFiles(selectedFiles);
      
      // Auto-send files if no text message, otherwise wait for user to send
      if (!message.trim()) {
        handleSendFiles();
      }
    }
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e) => {
    // Send message on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
    
    // Handle Escape to clear typing
    if (e.key === 'Escape') {
      handleStopTyping();
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
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    if (fileType.includes('zip') || fileType.includes('archive')) return '📦';
    return '📎';
  };

  return (
    <div className="border-t border-gray-700 p-4 bg-gray-800">
      {/* File preview */}
      {files.length > 0 && (
        <div className="mb-3 p-3 bg-gray-700 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-300">Attachments ({files.length})</span>
            <button
              type="button"
              onClick={() => setFiles([])}
              className="text-xs text-gray-400 hover:text-white"
            >
              Clear all
            </button>
          </div>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-600 rounded">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getFileIcon(file.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">{file.name}</div>
                    <div className="text-xs text-gray-400">{formatFileSize(file.size)}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-gray-400 hover:text-red-400 p-1"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex space-x-3 items-end">
        <div className="flex-1 relative">
          {/* Text input */}
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            onBlur={handleStopTyping}
            placeholder={placeholder}
            rows="1"
            className="w-full bg-gray-700 text-white placeholder-gray-400 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none max-h-32"
            disabled={isUploading}
          />
          
          {/* Action buttons */}
          <div className="absolute right-2 bottom-2 flex space-x-1">
            {/* Emoji button (placeholder for future feature) */}
            <button
              type="button"
              className="text-gray-400 hover:text-white p-1 transition-colors"
              title="Add emoji"
            >
              😊
            </button>

            {/* File upload button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="text-gray-400 hover:text-white p-1 transition-colors disabled:opacity-50"
              title="Attach files"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
          </div>

          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            multiple
            accept="*/*" // Accept all file types, or specify: "image/*,video/*,audio/*,.pdf,.doc,.docx"
          />
        </div>
        
        {/* Send button */}
        <button
          type="submit"
          disabled={(!message.trim() && files.length === 0) || isUploading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors min-w-20 flex items-center justify-center"
        >
          {isUploading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            'Send'
          )}
        </button>
      </form>

      {/* Helper text */}
      <div className="mt-2 text-xs text-gray-500 flex justify-between">
        <span>Press Enter to send, Shift+Enter for new line</span>
        <span>{message.length}/1000</span>
      </div>

      {/* Upload progress (optional) */}
      {isUploading && (
        <div className="mt-2">
          <div className="w-full bg-gray-600 rounded-full h-1">
            <div className="bg-blue-500 h-1 rounded-full animate-pulse"></div>
          </div>
          <div className="text-xs text-gray-400 text-center mt-1">
            Uploading {files.length} file{files.length !== 1 ? 's' : ''}...
          </div>
        </div>
      )}
    </div>
  );
}