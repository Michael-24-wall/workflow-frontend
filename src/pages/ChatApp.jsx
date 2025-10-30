// src/components/ChatApp.jsx
import React, { useState, useEffect, useRef } from 'react';
import { chatApi } from '../services/chatApi';

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
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load rooms from backend
  const loadRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Loading rooms from backend...');
      
      const roomsData = await chatApi.getRooms();
      console.log('✅ Rooms loaded:', roomsData);
      
      // Handle both array and object responses
      const roomsArray = Array.isArray(roomsData) ? roomsData : (roomsData.results || []);
      setRooms(roomsArray);
      
      // Auto-select first room if none selected
      if (roomsArray.length > 0 && !currentRoom) {
        setCurrentRoom(roomsArray[0]);
      }
    } catch (err) {
      console.error('❌ Failed to load rooms:', err);
      setError(err.message);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  // Load messages for current room
  const loadMessages = async (room) => {
    if (!room) return;
    
    try {
      console.log('🔄 Loading messages for room:', room.id);
      const messagesData = await chatApi.getRoomMessages(room.id);
      console.log('📨 Messages loaded:', messagesData);
      
      // Handle both array and paginated responses
      const messagesArray = Array.isArray(messagesData) ? messagesData : (messagesData.results || []);
      
      // Debug: Check for file messages
      messagesArray.forEach(msg => {
        if (msg.message_type === 'file') {
          console.log('📁 File message found:', {
            id: msg.id,
            file_url: msg.file_url,
            file_name: msg.file_name,
            file_type: msg.file_type,
            is_image: isImageFile(msg.file_name, msg.file_type)
          });
        }
      });
      
      setMessages(messagesArray);
    } catch (err) {
      console.error('❌ Failed to load messages:', err);
      setError(err.message);
    }
  };

  // Send message
  const sendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !currentRoom || sending) return;
    
    try {
      setSending(true);
      
      if (selectedFile) {
        // Send file
        await sendFile();
      } else {
        // Send text message
        console.log('🔄 Sending message...');
        await chatApi.sendMessage(currentRoom.id, newMessage.trim());
        setNewMessage('');
      }
      
      // Reload messages to see the new one
      setTimeout(() => loadMessages(currentRoom), 1000);
    } catch (err) {
      console.error('❌ Failed to send message:', err);
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  // Send file
  const sendFile = async () => {
    if (!selectedFile || !currentRoom) return;
    
    try {
      setUploading(true);
      setUploadProgress(0);
      
      console.log('🔄 Uploading file:', selectedFile.name, selectedFile.type);
      
      const result = await chatApi.uploadFile(
        currentRoom.id, 
        selectedFile, 
        (progress) => {
          setUploadProgress(progress);
        }
      );
      
      console.log('✅ File upload result:', result);
      
      // Clear file selection
      setSelectedFile(null);
      setFilePreview(null);
      setUploadProgress(0);
      
    } catch (err) {
      console.error('❌ Failed to upload file:', err);
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit');
      return;
    }
    
    setSelectedFile(file);
    
    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
    
    // Clear the input
    event.target.value = '';
  };

  // Remove selected file
  const removeSelectedFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setUploadProgress(0);
  };

  // Handle key press (Enter to send)
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file icon based on type
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

  // Check if file is an image
  const isImageFile = (fileName, fileType) => {
    // First check file type
    if (fileType && fileType.startsWith('image/')) {
      return true;
    }
    
    // Then check file extension
    if (fileName) {
      const extension = fileName.split('.').pop()?.toLowerCase();
      const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
      return imageTypes.includes(extension);
    }
    
    return false;
  };

  // Get full file URL - FIXED VERSION
  const getFileUrl = (fileUrl) => {
    if (!fileUrl) return null;
    
    console.log('🔗 Original file URL:', fileUrl);
    
    // If it's already a full URL, return as is
    if (fileUrl.startsWith('http')) {
      return fileUrl;
    }
    
    // For all relative URLs, use localhost:9000 directly (no /api for media files)
    const BASE_URL = 'http://localhost:9000';
    const finalUrl = `${BASE_URL}${fileUrl}`;
    console.log('✅ Final URL:', finalUrl);
    return finalUrl;
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Create new room
  const createNewRoom = async () => {
    const roomName = prompt('Enter room name (URL-friendly, no spaces):');
    const roomTitle = prompt('Enter room title:');
    
    if (roomName && roomTitle) {
      try {
        // Convert to URL-friendly name
        const urlFriendlyName = roomName
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '');
        
        await chatApi.createRoom({
          name: urlFriendlyName,
          title: roomTitle,
          description: 'New chat room',
          privacy_level: 'public'
        });
        loadRooms(); // Reload rooms list
      } catch (err) {
        console.error('❌ Failed to create room:', err);
        setError(err.response?.data?.detail || err.message || 'Failed to create room');
      }
    }
  };

  // Join room automatically when selected
  const joinRoom = async (room) => {
    try {
      console.log('🔄 Joining room:', room.id);
      await chatApi.joinRoom(room.id);
      setCurrentRoom(room);
      await loadMessages(room); // Load messages immediately after joining
    } catch (err) {
      console.error('❌ Failed to join room:', err);
      // If join fails, still set the room but show error
      setCurrentRoom(room);
      setError(err.response?.data?.detail || err.message || 'Failed to join room');
    }
  };

  // Format time
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

  // Image modal state
  const [selectedImage, setSelectedImage] = useState(null);

  // Open image in modal
  const openImageModal = (imageUrl, fileName) => {
    setSelectedImage({ url: imageUrl, name: fileName });
  };

  // Close image modal
  const closeImageModal = () => {
    setSelectedImage(null);
  };

  // Initial load
  useEffect(() => {
    loadRooms();
  }, []);

  // Load messages when room changes
  useEffect(() => {
    if (currentRoom) {
      loadMessages(currentRoom);
    }
  }, [currentRoom]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-set online status
  useEffect(() => {
    const setOnline = async () => {
      try {
        await chatApi.setOnlineStatus(true);
      } catch (err) {
        // Ignore errors for online status
        console.log('💡 Online status endpoint not available');
      }
    };
    setOnline();
  }, []);

  if (loading && rooms.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg">Loading real chat...</p>
          <p className="text-gray-400 text-sm">Connecting to backend server</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">💬 Real Chat</h2>
          <button 
            onClick={loadRooms}
            disabled={loading}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh rooms"
          >
            {loading ? '⏳' : '🔄'}
          </button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-700 flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-semibold">
            👤
          </div>
          <div className="flex-1">
            <div className="font-semibold text-white">You</div>
            <div className="text-green-400 text-sm flex items-center">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
              Online
            </div>
          </div>
        </div>

        {/* Rooms Section */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-700 flex justify-between items-center">
            <h3 className="text-gray-300 font-semibold text-sm uppercase tracking-wide">
              Rooms ({rooms.length})
            </h3>
            <button 
              onClick={createNewRoom}
              className="w-6 h-6 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center text-white text-sm font-bold transition-colors"
              title="Create new room"
            >
              +
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {rooms.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                <p>No rooms yet</p>
                <button 
                  onClick={createNewRoom}
                  className="mt-2 text-blue-400 hover:text-blue-300 text-sm underline"
                >
                  Create first room
                </button>
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
                  onClick={() => joinRoom(room)}
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold">
                    #
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white truncate">{room.title}</div>
                    <div className="text-gray-400 text-sm flex items-center space-x-2 mt-1">
                      <span>{room.member_count || 1} members</span>
                      {room.unread_count > 0 && (
                        <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                          {room.unread_count} new
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Connection Status */}
        <div className="p-4 border-t border-gray-700">
          <div className="text-xs text-gray-400">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${error ? 'bg-red-500' : 'bg-green-500'}`}></div>
              <span>{error ? 'Connection issues' : 'Connected to backend'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentRoom ? (
          <>
            {/* Chat Header */}
            <div className="bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                  #
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{currentRoom.title}</h2>
                  <p className="text-gray-400 text-sm">{currentRoom.description || 'Chat room'}</p>
                </div>
              </div>
              <div className="text-gray-400 text-sm">
                <span className="text-green-400">●</span> {currentRoom.online_count || 1} online
              </div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto bg-gray-900">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <div className="text-6xl mb-4">💬</div>
                    <h3 className="text-xl font-semibold mb-2 text-gray-300">Start the conversation</h3>
                    <p className="text-gray-400">Send the first message in #{currentRoom.title}</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  {messages.map(message => {
                    const fullFileUrl = getFileUrl(message.file_url);
                    const isImage = isImageFile(message.file_name, message.file_type);
                    
                    return (
                      <div 
                        key={message.id} 
                        className={`flex space-x-3 ${
                          message.is_own_message ? 'flex-row-reverse space-x-reverse' : ''
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-sm ${
                          message.is_own_message 
                            ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                            : 'bg-gradient-to-br from-gray-600 to-gray-700'
                        }`}>
                          {message.user?.display_name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className={`max-w-xs lg:max-w-md rounded-2xl p-4 ${
                          message.is_own_message 
                            ? 'bg-gradient-to-br from-blue-600 to-blue-700 rounded-br-none' 
                            : 'bg-gray-700 rounded-bl-none'
                        }`}>
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-semibold text-sm text-white">
                              {message.is_own_message ? 'You' : (message.user?.display_name || 'User')}
                            </span>
                            <span className="text-gray-300 text-xs">
                              {formatTime(message.timestamp)}
                            </span>
                          </div>
                          
                          {/* Image Message - Display directly */}
                          {message.message_type === 'file' && fullFileUrl && isImage && (
                            <div className="mb-3">
                              <div 
                                className="cursor-pointer rounded-lg overflow-hidden border border-gray-600 hover:border-gray-400 transition-colors bg-black bg-opacity-20"
                                onClick={() => openImageModal(fullFileUrl, message.file_name)}
                              >
                                <img 
                                  src={fullFileUrl} 
                                  alt={message.file_name || 'Shared image'}
                                  className="max-w-full max-h-64 object-contain"
                                  onError={(e) => {
                                    console.error('❌ Image failed to load:', fullFileUrl);
                                    // Show fallback file card
                                    e.target.style.display = 'none';
                                  }}
                                  onLoad={() => console.log('✅ Image loaded successfully:', fullFileUrl)}
                                />
                              </div>
                              <div className="text-gray-400 text-xs mt-1 flex justify-between">
                                <span>{message.file_name || 'Image'}</span>
                                {message.file_size && (
                                  <span>{formatFileSize(message.file_size)}</span>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Non-Image File Message */}
                          {message.message_type === 'file' && fullFileUrl && !isImage && (
                            <div className="mb-2 p-3 bg-black bg-opacity-30 rounded-lg border border-gray-600">
                              <div className="flex items-center space-x-3">
                                <div className="text-2xl">
                                  {getFileIcon(message.file_name)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-white font-medium truncate">
                                    {message.file_name || 'File'}
                                  </div>
                                  {message.file_size && (
                                    <div className="text-gray-400 text-sm">
                                      {formatFileSize(message.file_size)}
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
                          
                          {/* Text Content - Only show if it's not the default file message */}
                          {message.content && message.content !== `Shared file: ${message.file_name}` && (
                            <div className="text-white text-sm leading-relaxed">{message.content}</div>
                          )}
                          
                          {message.is_edited && (
                            <div className="text-gray-400 text-xs mt-2">(edited)</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
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
                  >
                    ✕
                  </button>
                </div>
                
                {/* Upload Progress */}
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
                
                {/* Image Preview */}
                {filePreview && (
                  <div className="mt-3">
                    <img 
                      src={filePreview} 
                      alt="Preview" 
                      className="max-w-48 max-h-48 rounded-lg border border-gray-600 object-contain"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Message Input */}
            <div className="bg-gray-800 border-t border-gray-700 p-4">
              <div className="flex space-x-4 items-end">
                {/* File Upload Button */}
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || sending}
                  className="p-3 text-gray-400 hover:text-white hover:bg-gray-700 rounded-xl transition-colors disabled:opacity-50"
                  title="Attach file"
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
                    placeholder={`Message #${currentRoom.title}... (Press Enter to send)`}
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
              <h1 className="text-4xl font-bold mb-4 text-white">Welcome to Real Chat</h1>
              <p className="text-gray-400 mb-8 text-lg">Select a room from the sidebar to start chatting</p>
              {rooms.length === 0 && (
                <button 
                  onClick={createNewRoom}
                  className="bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all shadow-lg"
                >
                  Create Your First Room
                </button>
              )}
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
        <div className="fixed top-4 right-4 bg-red-600 text-white p-4 rounded-lg shadow-xl flex items-center space-x-4 max-w-sm z-50 border border-red-700 animate-in slide-in-from-right">
          <div className="flex-1">
            <div className="font-semibold">Error</div>
            <div className="text-sm mt-1">{error}</div>
          </div>
          <button 
            onClick={() => setError(null)}
            className="hover:bg-red-700 rounded-full w-6 h-6 flex items-center justify-center transition-colors flex-shrink-0"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatApp;