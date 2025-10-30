// src/components/ChatApp.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { chatApi } from '../services/chatApi';

// Utility functions
const getCurrentUser = () => {
  try {
    const token = localStorage.getItem('access_token');
    if (token) {
      const payload = jwtDecode(token);
      return {
        id: String(payload.user_id), // Ensure ID is always string
        email: payload.email || 'user@example.com',
        username: payload.username || 'You'
      };
    }
  } catch (error) {
    console.error('Error decoding JWT token:', error);
  }
  return null;
};

const getFileUrl = (fileUrl) => {
  if (!fileUrl) return null;
  if (fileUrl.startsWith('http')) return fileUrl;
  const BASE_URL = 'http://localhost:9000';
  return `${BASE_URL}${fileUrl}`;
};

const formatFileSize = (bytes) => {
  if (!bytes) return 'Unknown size';
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const isImageFile = (fileName, fileType) => {
  if (fileType && fileType.startsWith('image/')) return true;
  if (fileName) {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
    return imageTypes.includes(extension);
  }
  return false;
};

const getFileIcon = (fileName) => {
  if (!fileName) return '📄';
  const extension = fileName.split('.').pop()?.toLowerCase();
  if (!extension) return '📄';
  
  const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
  const documentTypes = ['pdf', 'doc', 'docx', 'txt', 'rtf'];
  const spreadsheetTypes = ['xls', 'xlsx', 'csv'];
  const archiveTypes = ['zip', 'rar', '7z', 'tar', 'gz'];
  
  if (imageTypes.includes(extension)) return '🖼️';
  if (documentTypes.includes(extension)) return '📄';
  if (spreadsheetTypes.includes(extension)) return '📊';
  if (archiveTypes.includes(extension)) return '📦';
  return '📄';
};

const getAvatarColor = (userId) => {
  const colors = [
    'bg-gradient-to-br from-blue-500 to-blue-600',
    'bg-gradient-to-br from-green-500 to-green-600',
    'bg-gradient-to-br from-purple-500 to-purple-600',
    'bg-gradient-to-br from-pink-500 to-pink-600',
    'bg-gradient-to-br from-orange-500 to-orange-600',
    'bg-gradient-to-br from-teal-500 to-teal-600',
  ];
  const index = (userId || 0) % colors.length;
  return colors[index];
};

const formatTime = (timestamp) => {
  try {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } catch {
    return 'Just now';
  }
};

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-3 bg-red-100 border border-red-400 rounded-lg m-2">
          <div className="text-red-700 text-sm">Message not available</div>
        </div>
      );
    }
    return this.props.children;
  }
}

// MessageBubble Component
const MessageBubble = React.memo(({ 
  message, 
  isMine, 
  currentUser,
  onImageClick 
}) => {
  const safeMessage = message || {};
  const safeUser = safeMessage.user || {};
  
  try {
    const fullFileUrl = getFileUrl(safeMessage.file_url);
    const isImage = isImageFile(safeMessage.file_name, safeMessage.file_type);
    const avatarColor = getAvatarColor(safeUser.id);
    
    const handleImageClick = () => {
      if (onImageClick && fullFileUrl) {
        onImageClick(fullFileUrl, safeMessage.file_name || 'Shared image');
      }
    };

    const handleImageError = (e) => {
      console.error('Image failed to load:', fullFileUrl);
      e.target.style.display = 'none';
    };

    return (
      <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`flex ${isMine ? 'flex-row-reverse' : 'flex-row'} max-w-xs lg:max-w-md items-end`}>
          {/* Avatar */}
          <div 
            className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 ${avatarColor} ${isMine ? 'ml-2' : 'mr-2'}`}
          >
            {isMine ? 'Y' : (safeUser.username?.charAt(0)?.toUpperCase() || safeUser.display_name?.charAt(0)?.toUpperCase() || 'U')}
          </div>
          
          {/* Message Content */}
          <div className="flex flex-col">
            {/* Sender Name - Only for others */}
            {!isMine && (
              <div className="text-xs text-gray-400 mb-1 ml-1">
                {safeUser.display_name || safeUser.username || 'User'}
              </div>
            )}
            
            {/* Message Bubble */}
            <div 
              className={`rounded-2xl p-3 ${
                isMine 
                  ? 'bg-gradient-to-br from-blue-600 to-blue-700' 
                  : 'bg-gray-700'
              } ${isMine ? 'rounded-br-none' : 'rounded-bl-none'}`}
            >
              {/* Image Message */}
              {safeMessage.message_type === 'file' && fullFileUrl && isImage && (
                <div className="mb-2">
                  <div 
                    className="cursor-pointer rounded-lg overflow-hidden border border-gray-600 hover:border-gray-400 transition-colors"
                    onClick={handleImageClick}
                    role="button"
                    tabIndex={0}
                  >
                    <img 
                      src={fullFileUrl} 
                      alt={safeMessage.file_name || 'Shared image'}
                      className="max-w-full max-h-64 object-cover w-full"
                      onError={handleImageError}
                      loading="lazy"
                    />
                  </div>
                  <div className="text-gray-300 text-xs mt-1 flex justify-between">
                    <span>{safeMessage.file_name || 'Image'}</span>
                    {safeMessage.file_size && (
                      <span>{formatFileSize(safeMessage.file_size)}</span>
                    )}
                  </div>
                </div>
              )}
              
              {/* File Message (Non-Image) */}
              {safeMessage.message_type === 'file' && fullFileUrl && !isImage && (
                <div className="mb-2 p-3 bg-black bg-opacity-30 rounded-lg border border-gray-600">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">
                      {getFileIcon(safeMessage.file_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium truncate">
                        {safeMessage.file_name || 'File'}
                      </div>
                      {safeMessage.file_size && (
                        <div className="text-gray-300 text-sm">
                          {formatFileSize(safeMessage.file_size)}
                        </div>
                      )}
                    </div>
                    <a 
                      href={fullFileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm transition-colors"
                    >
                      Download
                    </a>
                  </div>
                </div>
              )}
              
              {/* Text Content */}
              {safeMessage.content && safeMessage.content !== `Shared file: ${safeMessage.file_name}` && (
                <div className="text-white text-sm leading-relaxed">
                  {safeMessage.content}
                </div>
              )}
              
              {/* Time */}
              <div className={`text-gray-400 text-xs mt-1 ${isMine ? 'text-right' : 'text-left'}`}>
                {formatTime(safeMessage.timestamp)}
                {safeMessage.is_edited && ' • edited'}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error rendering MessageBubble:', error);
    return (
      <div className="p-3 bg-red-100 border border-red-300 rounded m-2">
        <div className="text-red-700 text-sm">Error displaying message</div>
      </div>
    );
  }
});

MessageBubble.displayName = 'MessageBubble';

// Main ChatApp Component
const ChatApp = () => {
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Check authentication and get current user
  const checkAuth = useCallback(() => {
    const isAuthenticated = chatApi.isAuthenticated();
    if (!isAuthenticated) {
      setError('Please log in to access the chat.');
      return false;
    } else {
      const user = getCurrentUser();
      setCurrentUser(user);
      return true;
    }
  }, []);

  // Load rooms from backend
  const loadRooms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!checkAuth()) {
        setLoading(false);
        return;
      }

      const response = await chatApi.getRooms();
      
      let roomsArray = [];
      if (Array.isArray(response)) {
        roomsArray = response;
      } else if (response?.data) {
        roomsArray = response.data;
      } else if (response?.results) {
        roomsArray = response.results;
      } else if (response) {
        roomsArray = [response];
      }
      
      setRooms(roomsArray);
      
      if (roomsArray.length > 0 && !currentRoom) {
        setCurrentRoom(roomsArray[0]);
      }
    } catch (err) {
      console.error('Failed to load rooms:', err);
      if (err.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else {
        setError(err.message || 'Failed to load rooms');
      }
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, [checkAuth, currentRoom]);

  // Load messages for current room - FIXED: Sort messages by timestamp
  const loadMessages = useCallback(async (room) => {
    if (!room) return;
    
    try {
      const response = await chatApi.getRoomMessages(room.id);
      
      let messagesArray = [];
      if (Array.isArray(response)) {
        messagesArray = response;
      } else if (response?.data) {
        messagesArray = response.data;
      } else if (response?.results) {
        messagesArray = response.results;
      } else if (response) {
        messagesArray = [response];
      }
      
      // Sort messages by timestamp in ascending order (oldest first)
      messagesArray.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      setMessages(messagesArray);
    } catch (err) {
      console.error('Failed to load messages:', err);
      setError(err.message || 'Failed to load messages');
    }
  }, []);

  // Check if message is from current user
  const isMyMessage = useCallback((message) => {
    if (!currentUser || !message) return false;
    
    // Check different possible user ID fields
    const messageUserId = message.user?.id || message.sender_id || message.user_id;
    const currentUserId = currentUser.id;
    
    // Convert both to string for comparison to avoid type issues
    return String(messageUserId) === String(currentUserId);
  }, [currentUser]);

  // Send file with progress tracking
  const sendFile = useCallback(async () => {
    if (!selectedFile || !currentRoom) return;
    
    try {
      setUploading(true);
      setUploadProgress(0);
      setError(null);
      
      await chatApi.uploadFile(
        currentRoom.id, 
        selectedFile, 
        (progress) => setUploadProgress(progress)
      );
      
      setSelectedFile(null);
      setFilePreview(null);
      setUploadProgress(0);
      
      // Reload messages immediately
      await loadMessages(currentRoom);
    } catch (err) {
      console.error('Failed to upload file:', err);
      setError(err.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  }, [selectedFile, currentRoom, loadMessages]);

  // Send message
  const sendMessage = useCallback(async () => {
    if ((!newMessage.trim() && !selectedFile) || !currentRoom || sending) return;
    
    try {
      setSending(true);
      setError(null);
      
      if (selectedFile) {
        await sendFile();
      } else {
        await chatApi.sendMessage(currentRoom.id, newMessage.trim());
        setNewMessage('');
        // Reload messages immediately
        await loadMessages(currentRoom);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  }, [newMessage, selectedFile, currentRoom, sending, sendFile, loadMessages]);

  // Handle file selection
  const handleFileSelect = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      setError('File size exceeds 10MB limit');
      return;
    }
    
    setSelectedFile(file);
    
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
    
    event.target.value = '';
  }, []);

  // Remove selected file
  const removeSelectedFile = useCallback(() => {
    setSelectedFile(null);
    setFilePreview(null);
    setUploadProgress(0);
  }, []);

  // Open image in modal
  const openImageModal = useCallback((imageUrl, fileName) => {
    setSelectedImage({ url: imageUrl, name: fileName });
  }, []);

  // Close image modal
  const closeImageModal = useCallback(() => {
    setSelectedImage(null);
  }, []);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Handle key press
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  // Initial load
  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  // Load messages when room changes
  useEffect(() => {
    if (currentRoom) {
      loadMessages(currentRoom);
    }
  }, [currentRoom, loadMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  if (loading && rooms.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">💬 Chat</h2>
          <div className="text-xs text-gray-400 mt-1">
            {chatApi.isAuthenticated() ? '✅ Authenticated' : '❌ Not authenticated'}
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-gray-300 font-semibold text-sm uppercase tracking-wide">
              Rooms ({rooms.length})
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {rooms.length === 0 && !loading ? (
              <div className="p-4 text-center text-gray-400">
                <p>No rooms yet</p>
              </div>
            ) : (
              rooms.map(room => (
                <div
                  key={room.id}
                  className={`p-3 flex items-center space-x-3 cursor-pointer border-l-4 transition-all ${
                    currentRoom?.id === room.id 
                      ? 'bg-gray-700 border-blue-500' 
                      : 'border-transparent hover:bg-gray-700'
                  }`}
                  onClick={() => setCurrentRoom(room)}
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold">
                    #
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white truncate">{room.title}</div>
                    <div className="text-gray-400 text-sm">
                      {room.member_count || 0} members
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentRoom ? (
          <>
            {/* Chat Header */}
            <div className="bg-gray-800 border-b border-gray-700 p-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                  #
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{currentRoom.title}</h2>
                  <p className="text-gray-400 text-sm">{currentRoom.description || 'Chat room'}</p>
                </div>
              </div>
            </div>

            {/* Messages Area - FIXED: Normal chronological order */}
            <div className="flex-1 overflow-y-auto bg-gray-900">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <div className="text-6xl mb-4">💬</div>
                    <h3 className="text-xl font-semibold mb-2">No messages yet</h3>
                    <p>Start the conversation in #{currentRoom.title}</p>
                  </div>
                </div>
              ) : (
                // SIMPLE FIX: Remove the complex flex layout and use normal flow
                <div className="p-4">
                  {messages.map(message => (
                    <ErrorBoundary key={message.id}>
                      <MessageBubble
                        message={message}
                        isMine={isMyMessage(message)}
                        currentUser={currentUser}
                        onImageClick={openImageModal}
                      />
                    </ErrorBoundary>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* File Preview */}
            {selectedFile && (
              <div className="bg-gray-800 border-t border-gray-700 p-4">
                <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">
                      {getFileIcon(selectedFile.name)}
                    </div>
                    <div>
                      <div className="text-white font-medium">{selectedFile.name}</div>
                      <div className="text-gray-400 text-sm">
                        {formatFileSize(selectedFile.size)}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={removeSelectedFile}
                    className="text-gray-400 hover:text-white transition-colors"
                    disabled={uploading}
                  >
                    ✕
                  </button>
                </div>
                
                {uploading && (
                  <div className="mt-2">
                    <div className="flex justify-between text-sm text-gray-400 mb-1">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                
                {filePreview && (
                  <div className="mt-3">
                    <img 
                      src={filePreview} 
                      alt="Preview" 
                      className="max-w-48 max-h-48 rounded-lg border border-gray-600 object-cover"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Message Input */}
            <div className="bg-gray-800 border-t border-gray-700 p-4">
              <div className="flex space-x-4 items-end">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || sending}
                  className="p-3 text-gray-400 hover:text-white hover:bg-gray-700 rounded-xl transition-colors disabled:opacity-50"
                >
                  📎
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.txt,.zip,.xls,.xlsx,.csv"
                />
                
                <div className="flex-1 bg-gray-700 rounded-xl border border-gray-600 focus-within:border-blue-500 transition-colors">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={`Message #${currentRoom.title}... (Enter to send)`}
                    rows="1"
                    className="w-full bg-transparent border-0 resize-none focus:ring-0 text-white placeholder-gray-400 p-3 max-h-32"
                    style={{ minHeight: '44px' }}
                    disabled={sending || uploading}
                  />
                </div>
                <button 
                  onClick={sendMessage}
                  disabled={(!newMessage.trim() && !selectedFile) || sending || uploading}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all min-w-20 ${
                    (newMessage.trim() || selectedFile) && !sending && !uploading
                      ? 'bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg' 
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {uploading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>{uploadProgress}%</span>
                    </div>
                  ) : sending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
                  ) : (
                    'Send'
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-900">
            <div className="text-center">
              <div className="text-8xl mb-6">💬</div>
              <h1 className="text-4xl font-bold mb-4 text-white">Welcome to Chat</h1>
              <p className="text-gray-400 mb-8 text-lg">Select a room from the sidebar to start chatting</p>
            </div>
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button 
              onClick={closeImageModal}
              className="absolute -top-12 right-0 text-white text-2xl hover:text-gray-300 transition-colors"
            >
              ✕
            </button>
            <img 
              src={selectedImage.url} 
              alt={selectedImage.name}
              className="max-w-full max-h-screen object-contain rounded-lg"
            />
            <div className="absolute bottom-4 left-4 text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded">
              {selectedImage.name}
            </div>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-600 text-white p-4 rounded-lg shadow-xl max-w-sm z-50">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="font-semibold">Error</div>
              <div className="text-sm mt-1">{error}</div>
            </div>
            <button 
              onClick={() => setError(null)}
              className="hover:bg-red-700 rounded-full w-6 h-6 flex items-center justify-center transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatApp;