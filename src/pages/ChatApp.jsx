import React, { useState, useEffect, useRef } from 'react';
import { chatApi } from '../services/chatApi';

const ChatApp = () => {
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [showMessageMenu, setShowMessageMenu] = useState(null);
  const [currentUser, setCurrentUser] = useState(null); // NEW: Current user state

  const BASE_URL = 'http://localhost:9000';
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadCurrentUser();
    loadRooms();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // NEW: Load current user
  const loadCurrentUser = async () => {
    try {
      // Try to get user from your auth API
      const userData = await chatApi.getCurrentUser();
      setCurrentUser(userData);
    } catch (error) {
      console.error('Failed to load current user:', error);
      // If no auth endpoint, you can get from localStorage or context
      const userEmail = localStorage.getItem('user_email');
      if (userEmail) {
        setCurrentUser({ email: userEmail });
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadRooms = async () => {
    try {
      setLoading(true);
      const data = await chatApi.getRooms();
      
      if (Array.isArray(data)) {
        setRooms(data);
      } else if (data && Array.isArray(data.results)) {
        setRooms(data.results);
      } else if (data && typeof data === 'object') {
        if (data.data && Array.isArray(data.data)) {
          setRooms(data.data);
        } else {
          setRooms([data]);
        }
      } else {
        setRooms([]);
      }
      setError(null);
    } catch (error) {
      console.error('Failed to load rooms:', error);
      setError('Failed to load rooms');
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async (roomId) => {
    try {
      await chatApi.joinRoom(roomId);
      const room = Array.isArray(rooms) ? rooms.find(r => r.id === roomId) : null;
      setCurrentRoom(room);
      loadMessages(roomId);
      setError(null);
      setReplyingTo(null);
      setEditingMessage(null);
    } catch (error) {
      console.error('Failed to join room:', error);
      setError('Failed to join room');
    }
  };

  const loadMessages = async (roomId) => {
    try {
      const data = await chatApi.getMessages(roomId);
      
      if (Array.isArray(data)) {
        setMessages(data);
      } else if (data && Array.isArray(data.results)) {
        setMessages(data.results);
      } else if (data && Array.isArray(data.messages)) {
        setMessages(data.messages);
      } else if (data && data.data && Array.isArray(data.data)) {
        setMessages(data.data);
      } else if (data && typeof data === 'object') {
        setMessages([data]);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      setMessages([]);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !replyingTo) || !currentRoom) return;

    try {
      const messageData = {
        room: currentRoom.id,
        content: newMessage.trim(),
        message_type: 'text'
      };

      if (replyingTo) {
        messageData.reply_to = replyingTo.id;
      }

      await chatApi.sendMessage(messageData);
      setNewMessage('');
      setReplyingTo(null);
      loadMessages(currentRoom.id);
    } catch (error) {
      console.error('Failed to send message:', error);
      setError('Failed to send message');
    }
  };

  const updateMessage = async () => {
    if (!editContent.trim() || !editingMessage) return;

    try {
      await chatApi.updateMessage(editingMessage.id, {
        content: editContent.trim()
      });
      setEditingMessage(null);
      setEditContent('');
      loadMessages(currentRoom.id);
    } catch (error) {
      console.error('Failed to update message:', error);
      setError('Failed to update message');
    }
  };

  const deleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;

    try {
      await chatApi.deleteMessage(messageId);
      setShowMessageMenu(null);
      loadMessages(currentRoom.id);
    } catch (error) {
      console.error('Failed to delete message:', error);
      setError('Failed to delete message');
    }
  };

  const uploadFile = async (file, description = '') => {
    if (!currentRoom) return;
    
    try {
      setUploading(true);
      await chatApi.uploadFile(file, currentRoom.id, description);
      setShowFileUpload(false);
      loadMessages(currentRoom.id);
      setError(null);
    } catch (error) {
      console.error('Failed to upload file:', error);
      setError('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const isImageFile = (fileName) => {
    if (!fileName) return false;
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
    return imageExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
  };

  const getFileUrl = (fileUrl) => {
    if (!fileUrl) return '';
    
    if (fileUrl.startsWith('http')) {
      return fileUrl;
    }
    
    if (fileUrl.startsWith('/')) {
      return `${BASE_URL}${fileUrl}`;
    }
    
    return `${BASE_URL}/${fileUrl}`;
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setEditContent('');
  };

  const startReply = (message) => {
    setReplyingTo(message);
    setEditingMessage(null);
  };

  const startEdit = (message) => {
    setEditingMessage(message);
    setEditContent(message.content);
    setReplyingTo(null);
    setShowMessageMenu(null);
  };

  // Check if message is from current user
  const isOwnMessage = (message) => {
    if (!currentUser || !message.user) return false;
    return message.user.email === currentUser.email;
  };

  // Get display name for user
  const getDisplayName = (user) => {
    if (!user) return 'Unknown';
    
    // Prefer full name, then username, then email
    if (user.full_name) return user.full_name;
    if (user.username) return user.username;
    if (user.email) return user.email.split('@')[0]; // Just the username part of email
    return 'Unknown';
  };

  // Get user initials for avatar
  const getUserInitials = (user) => {
    if (!user) return 'U';
    
    const displayName = getDisplayName(user);
    return displayName.charAt(0).toUpperCase();
  };

  // File Upload Modal Component
  const FileUploadModal = () => {
    const [file, setFile] = useState(null);
    const [description, setDescription] = useState('');
    const [previewUrl, setPreviewUrl] = useState('');

    const handleFileSelect = (e) => {
      const selectedFile = e.target.files[0];
      if (selectedFile) {
        if (selectedFile.size > 10 * 1024 * 1024) {
          alert('File size must be less than 10MB');
          return;
        }
        setFile(selectedFile);
        
        if (isImageFile(selectedFile.name)) {
          const url = URL.createObjectURL(selectedFile);
          setPreviewUrl(url);
        } else {
          setPreviewUrl('');
        }
      }
    };

    const handleUpload = async () => {
      if (!file) return;
      await uploadFile(file, description);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };

    const handleClose = () => {
      setShowFileUpload(false);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-96 border border-gray-200">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">
              {file && isImageFile(file.name) ? 'Share Image' : 'Upload File'}
            </h3>
          </div>
          
          <div className="p-6 space-y-4">
            {previewUrl && (
              <div className="flex justify-center">
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="max-h-48 max-w-full rounded-lg border border-gray-300 object-contain"
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select {file && isImageFile(file.name) ? 'Image' : 'File'}
              </label>
              <input
                type="file"
                onChange={handleFileSelect}
                accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.txt,.doc,.docx,.xls,.xlsx,.zip"
                className="w-full text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600"
              />
              {file && (
                <p className="mt-2 text-sm text-gray-600">
                  {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows="3"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={file && isImageFile(file.name) ? "Add a caption..." : "Add a description..."}
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 px-6 py-4 bg-gray-50 rounded-b-lg">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? 'Uploading...' : file && isImageFile(file.name) ? 'Share Image' : 'Upload File'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Reply Preview Component
  const ReplyPreview = () => {
    if (!replyingTo) return null;

    return (
      <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mb-3 rounded-r-lg">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="text-sm text-blue-700 font-medium mb-1">
              Replying to {getDisplayName(replyingTo.user)}
            </div>
            <div className="text-sm text-blue-600 truncate">
              {replyingTo.content}
            </div>
          </div>
          <button
            onClick={cancelReply}
            className="text-blue-500 hover:text-blue-700 ml-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  };

  // Message Menu Component
  const MessageMenu = ({ message, onClose }) => {
    const ownMessage = isOwnMessage(message);

    return (
      <div className="absolute right-0 top-6 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-32">
        <div className="py-1">
          <button
            onClick={() => {
              startReply(message);
              onClose();
            }}
            className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            <span>Reply</span>
          </button>
          
          {ownMessage && (
            <>
              <button
                onClick={() => {
                  startEdit(message);
                  onClose();
                }}
                className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Edit</span>
              </button>
              
              <button
                onClick={() => {
                  deleteMessage(message.id);
                  onClose();
                }}
                className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Delete</span>
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  // Message Component
  const Message = ({ message }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);

    const messageType = message?.message_type || 'text';
    const fileName = message?.file_name;
    const fileUrl = getFileUrl(message?.file_url);
    const fileSize = message?.file_size;
    const content = message?.content || '';
    const user = message?.user;
    const timestamp = message?.timestamp;
    const replyTo = message?.reply_to;
    const isEdited = message?.is_edited;
    const ownMessage = isOwnMessage(message);

    const formatTime = (timestamp) => {
      return new Date(timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    };

    return (
      <div className={`flex space-x-3 px-4 py-2 hover:bg-gray-50 group relative ${
        ownMessage ? 'bg-blue-50' : ''
      }`}>
        <div className="flex-shrink-0">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
            ownMessage ? 'bg-green-500' : 'bg-purple-500'
          }`}>
            {getUserInitials(user)}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          {/* Reply Preview */}
          {replyTo && (
            <div className="mb-2 text-sm text-gray-500 border-l-2 border-gray-300 pl-2">
              Replying to <span className="font-medium">{getDisplayName(replyTo.user)}</span>: {replyTo.content}
            </div>
          )}
          
          <div className="flex items-baseline space-x-2">
            <span className="font-semibold text-gray-900 text-sm">
              {getDisplayName(user)}
              {ownMessage && (
                <span className="text-xs text-green-600 ml-1">(You)</span>
              )}
            </span>
            <span className="text-xs text-gray-500">
              {timestamp ? formatTime(timestamp) : ''}
            </span>
            {isEdited && (
              <span className="text-xs text-gray-400">(edited)</span>
            )}
          </div>
          
          {/* Image Message */}
          {messageType === 'file' && isImageFile(fileName) ? (
            <div className="mt-1">
              <div className="rounded-lg border border-gray-200 p-2 max-w-md bg-white">
                {!imageError ? (
                  <>
                    <img 
                      src={fileUrl} 
                      alt={content || 'Shared image'}
                      className="rounded-lg max-w-full max-h-80 object-contain"
                      onLoad={() => setImageLoaded(true)}
                      onError={() => setImageError(true)}
                    />
                    {!imageLoaded && (
                      <div className="flex items-center justify-center h-32 bg-gray-100 rounded-lg">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
                        <span className="ml-2 text-gray-500">Loading image...</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center text-gray-500 p-4">
                    <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Failed to load image
                  </div>
                )}
                <div className="mt-2 flex justify-between items-center">
                  <a 
                    href={fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-600 text-xs font-medium"
                  >
                    Download
                  </a>
                  {fileSize && (
                    <span className="text-xs text-gray-400">
                      {Math.round(fileSize / 1024)} KB
                    </span>
                  )}
                </div>
              </div>
              {content && content !== `Shared file: ${fileName}` && (
                <p className="mt-2 text-gray-800 text-sm">{content}</p>
              )}
            </div>
          ) : 
          
          /* File Message (non-image) */
          messageType === 'file' ? (
            <div className="mt-1 p-3 bg-white rounded-lg border border-gray-200 max-w-md">
              <div className="flex items-center space-x-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="flex-1">
                  <a 
                    href={fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-600 font-medium block text-sm"
                  >
                    {fileName || 'Download file'}
                  </a>
                  {fileSize && (
                    <div className="text-xs text-gray-500 mt-1">
                      {Math.round(fileSize / 1024)} KB
                    </div>
                  )}
                </div>
              </div>
              {content && content !== `Shared file: ${fileName}` && (
                <p className="mt-2 text-gray-800 text-sm">{content}</p>
              )}
            </div>
          ) : 
          
          /* Text Message */
          (
            <div className="mt-1 text-gray-900 text-sm">
              {content}
            </div>
          )}
        </div>

        {/* Message Actions Menu */}
        <div className="absolute right-4 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setShowMessageMenu(showMessageMenu === message.id ? null : message.id)}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
          </button>
          
          {showMessageMenu === message.id && (
            <MessageMenu 
              message={message} 
              onClose={() => setShowMessageMenu(null)}
            />
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error && (!Array.isArray(rooms) || rooms.length === 0)) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-4">Error: {error}</div>
          <button
            onClick={loadRooms}
            className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white text-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-purple-700 text-white">
        <div className="p-4 border-b border-purple-600">
          <h1 className="text-xl font-bold">Chat Rooms</h1>
          {currentUser && (
            <div className="text-sm text-purple-200 mt-1">
              Welcome, {getDisplayName(currentUser)}
            </div>
          )}
        </div>
        <div className="p-2 space-y-1">
          {Array.isArray(rooms) && rooms.map(room => (
            <div
              key={room.id}
              className={`p-3 rounded cursor-pointer transition-colors ${
                currentRoom?.id === room.id
                  ? 'bg-white text-purple-700'
                  : 'text-purple-100 hover:bg-purple-600'
              }`}
              onClick={() => joinRoom(room.id)}
            >
              <div className="font-medium text-sm"># {room.title || 'Untitled Room'}</div>
              <div className="text-xs opacity-80 mt-1">{room.description || 'No description'}</div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs opacity-70">
                  {room.member_count || 0} members
                </span>
                {room.is_private && (
                  <span className="text-xs bg-purple-800 text-purple-200 px-2 py-1 rounded">
                    Private
                  </span>
                )}
              </div>
            </div>
          ))}
          
          {(!Array.isArray(rooms) || rooms.length === 0) && (
            <div className="text-center text-purple-200 py-8 text-sm">
              No rooms available
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentRoom ? (
          <>
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900"># {currentRoom.title || 'Untitled Room'}</h2>
                    <p className="text-sm text-gray-500">{currentRoom.description || 'No description'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                    {currentRoom.member_count || 0} members
                  </span>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto bg-gray-50">
              <div className="py-4">
                {Array.isArray(messages) && messages.map(message => (
                  <Message key={message.id} message={message} />
                ))}
                
                {(!Array.isArray(messages) || messages.length === 0) && (
                  <div className="text-center text-gray-500 py-12">
                    <div className="text-lg font-semibold mb-2">No messages yet</div>
                    <p className="text-sm">Start the conversation!</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Reply Preview */}
            {replyingTo && <ReplyPreview />}

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <form onSubmit={editingMessage ? updateMessage : sendMessage} className="flex space-x-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={editingMessage ? editContent : newMessage}
                    onChange={(e) => editingMessage ? setEditContent(e.target.value) : setNewMessage(e.target.value)}
                    placeholder={
                      editingMessage 
                        ? "Edit your message..." 
                        : replyingTo 
                        ? `Reply to ${getDisplayName(replyingTo.user)}...` 
                        : `Message #${currentRoom.title || 'room'}`
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  {editingMessage && (
                    <div className="absolute -top-8 left-0 bg-blue-50 text-blue-700 px-3 py-1 rounded text-sm">
                      Editing message
                      <button
                        onClick={cancelEdit}
                        className="ml-2 text-blue-500 hover:text-blue-700"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
                
                {editingMessage ? (
                  <>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="px-4 py-3 text-gray-600 hover:text-gray-800 transition-colors border border-gray-300 rounded-lg hover:border-gray-400"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!editContent.trim()}
                      className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      Update
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowFileUpload(true)}
                      className="px-4 py-3 text-gray-400 hover:text-gray-600 transition-colors border border-gray-300 rounded-lg hover:border-gray-400"
                      title="Share files and images"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                    </button>
                    <button
                      type="submit"
                      disabled={!newMessage.trim() && !replyingTo}
                      className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      {replyingTo ? 'Reply' : 'Send'}
                    </button>
                  </>
                )}
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome to Chat</h2>
              <p className="text-gray-500">Select a room to start chatting</p>
              {currentUser && (
                <p className="text-sm text-gray-400 mt-2">Logged in as {getDisplayName(currentUser)}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* File Upload Modal */}
      {showFileUpload && <FileUploadModal />}
    </div>
  );
};

export default ChatApp;