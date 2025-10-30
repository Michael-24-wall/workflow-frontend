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
  const [editingMessage, setEditingMessage] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showMessageMenu, setShowMessageMenu] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Check authentication
  const checkAuth = () => {
    const isAuthenticated = chatApi.isAuthenticated();
    if (!isAuthenticated) {
      setError('Please log in to access the chat.');
    }
    return isAuthenticated;
  };

  // Load rooms from backend
  const loadRooms = async () => {
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
      } else if (response && response.data) {
        roomsArray = response.data;
      } else if (response && response.results) {
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
  };

  // Load messages for current room
  const loadMessages = async (room) => {
    if (!room) return;
    
    try {
      const response = await chatApi.getRoomMessages(room.id);
      
      let messagesArray = [];
      if (Array.isArray(response)) {
        messagesArray = response;
      } else if (response && response.data) {
        messagesArray = response.data;
      } else if (response && response.results) {
        messagesArray = response.results;
      } else if (response) {
        messagesArray = [response];
      }
      
      setMessages(messagesArray);
    } catch (err) {
      console.error('Failed to load messages:', err);
      setError(err.message || 'Failed to load messages');
    }
  };

  // Create new room - FIXED VERSION
  const createNewRoom = async () => {
    const roomName = prompt('Enter room name (URL-friendly, no spaces):');
    if (!roomName) return;
    
    const roomTitle = prompt('Enter room title:');
    if (!roomTitle) return;
    
    try {
      setError(null);
      
      if (!checkAuth()) {
        return;
      }

      const urlFriendlyName = roomName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
      
      // Try different data formats to find what works
      const roomDataAttempts = [
        // Most common format
        {
          name: urlFriendlyName,
          title: roomTitle,
          description: 'New chat room',
          privacy_level: 'public'
        },
        // Minimal format
        {
          name: urlFriendlyName,
          title: roomTitle,
        },
        // Alternative field names
        {
          name: urlFriendlyName,
          title: roomTitle,
          description: '',
          privacy_level: 'public',
          is_active: true
        }
      ];
      
      let lastError = null;
      
      for (let attempt of roomDataAttempts) {
        try {
          await chatApi.createRoom(attempt);
          await loadRooms();
          return; // Success
        } catch (err) {
          lastError = err;
          // Continue to next attempt
        }
      }
      
      throw lastError;
      
    } catch (err) {
      console.error('Failed to create room:', err);
      setError(err.message || 'Failed to create room');
    }
  };

  // Send message
  const sendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !currentRoom || sending) return;
    
    try {
      setSending(true);
      setError(null);
      
      if (editingMessage) {
        await chatApi.editMessage(editingMessage.id, newMessage.trim());
        setEditingMessage(null);
        setNewMessage('');
      } else if (selectedFile) {
        await sendFile();
      } else {
        await chatApi.sendMessage(currentRoom.id, newMessage.trim(), replyingTo?.id);
        setNewMessage('');
        setReplyingTo(null);
      }
      
      setTimeout(() => loadMessages(currentRoom), 1000);
    } catch (err) {
      console.error('Failed to send message:', err);
      setError(err.message || 'Failed to send message');
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
      setError(null);
      
      await chatApi.uploadFile(
        currentRoom.id, 
        selectedFile, 
        (progress) => setUploadProgress(progress),
        replyingTo?.id
      );
      
      setSelectedFile(null);
      setFilePreview(null);
      setUploadProgress(0);
      setReplyingTo(null);
      
      setTimeout(() => loadMessages(currentRoom), 1000);
    } catch (err) {
      console.error('Failed to upload file:', err);
      setError(err.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  // Edit message
  const startEditMessage = (message) => {
    if (message.message_type === 'file') {
      setError('Cannot edit file messages');
      return;
    }
    
    setEditingMessage(message);
    setNewMessage(message.content);
    setReplyingTo(null);
    setShowMessageMenu(null);
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditingMessage(null);
    setNewMessage('');
  };

  // Delete message
  const deleteMessage = async (message) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    
    try {
      await chatApi.deleteMessage(message.id);
      setShowMessageMenu(null);
      setTimeout(() => loadMessages(currentRoom), 500);
    } catch (err) {
      console.error('Failed to delete message:', err);
      setError(err.message || 'Failed to delete message');
    }
  };

  // Start reply
  const startReply = (message) => {
    setReplyingTo(message);
    setEditingMessage(null);
    setShowMessageMenu(null);
  };

  // Cancel reply
  const cancelReply = () => {
    setReplyingTo(null);
  };

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.size > 10 * 1024 * 1024) {
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
  };

  // Remove selected file
  const removeSelectedFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setUploadProgress(0);
  };

  // Handle key press
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

  // Get file icon
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
    if (fileType && fileType.startsWith('image/')) return true;
    if (fileName) {
      const extension = fileName.split('.').pop()?.toLowerCase();
      const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
      return imageTypes.includes(extension);
    }
    return false;
  };

  // Get full file URL
  const getFileUrl = (fileUrl) => {
    if (!fileUrl) return null;
    
    if (fileUrl.startsWith('http')) {
      return fileUrl;
    }
    
    const BASE_URL = 'http://localhost:9000';
    return `${BASE_URL}${fileUrl}`;
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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

  // Close message menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowMessageMenu(null);
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

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

        {/* Auth Status */}
        <div className="p-3 border-b border-gray-700 bg-gray-750">
          {!chatApi.isAuthenticated() ? (
            <div className="text-red-300 text-xs bg-red-900 bg-opacity-30 p-2 rounded">
              <div className="font-semibold">Authentication Required</div>
              <div className="mt-1">You need to log in to access the chat.</div>
            </div>
          ) : error ? (
            <div className="text-red-300 text-xs bg-red-900 bg-opacity-30 p-2 rounded">
              <div className="font-semibold">Error:</div>
              <div className="mt-1">{error}</div>
            </div>
          ) : (
            <div className="text-green-300 text-xs bg-green-900 bg-opacity-30 p-2 rounded">
              <div className="font-semibold">✅ Ready to chat</div>
            </div>
          )}
        </div>

        {/* Rooms Section */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-700 flex justify-between items-center">
            <h3 className="text-gray-300 font-semibold text-sm uppercase tracking-wide">
              Rooms ({rooms.length})
            </h3>
            <button 
              onClick={createNewRoom}
              disabled={!chatApi.isAuthenticated() || !!error}
              className="w-6 h-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-full flex items-center justify-center text-white text-sm font-bold transition-colors"
            >
              +
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {rooms.length === 0 && !loading ? (
              <div className="p-4 text-center text-gray-400">
                <p>No rooms yet</p>
                {chatApi.isAuthenticated() && !error && (
                  <button 
                    onClick={createNewRoom}
                    className="mt-2 text-blue-400 hover:text-blue-300 text-sm underline"
                  >
                    Create first room
                  </button>
                )}
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

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto bg-gray-900 p-4">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <div className="text-6xl mb-4">💬</div>
                    <h3 className="text-xl font-semibold mb-2">No messages yet</h3>
                    <p>Start the conversation in #{currentRoom.title}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map(message => (
                    <div key={message.id} className="flex space-x-3">
                      <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {message.user?.username?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div className="bg-gray-700 rounded-lg p-3 max-w-md">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-semibold text-white text-sm">
                            {message.user?.username || 'User'}
                          </span>
                          <span className="text-gray-400 text-xs">
                            {formatTime(message.timestamp)}
                          </span>
                        </div>
                        <div className="text-white text-sm">
                          {message.content}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="bg-gray-800 border-t border-gray-700 p-4">
              <div className="flex space-x-4">
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
                  accept="image/*,.pdf,.doc,.docx,.txt,.zip"
                />
                
                <div className="flex-1 bg-gray-700 rounded-xl border border-gray-600">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={`Message #${currentRoom.title}... (Enter to send)`}
                    rows="1"
                    className="w-full bg-transparent border-0 resize-none focus:ring-0 text-white placeholder-gray-400 p-3"
                    disabled={sending || uploading}
                  />
                </div>
                <button 
                  onClick={sendMessage}
                  disabled={(!newMessage.trim() && !selectedFile) || sending || uploading}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:text-gray-400 text-white rounded-xl font-semibold transition-colors"
                >
                  {sending ? 'Sending...' : 'Send'}
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
              {rooms.length === 0 && chatApi.isAuthenticated() && (
                <button 
                  onClick={createNewRoom}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors"
                >
                  Create Your First Room
                </button>
              )}
            </div>
          </div>
        )}
      </div>

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