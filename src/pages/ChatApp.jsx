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
  const messagesEndRef = useRef(null);

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
      
      // Handle both array and paginated responses
      const messagesArray = Array.isArray(messagesData) ? messagesData : (messagesData.results || []);
      setMessages(messagesArray);
    } catch (err) {
      console.error('❌ Failed to load messages:', err);
      setError(err.message);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !currentRoom || sending) return;
    
    try {
      setSending(true);
      console.log('🔄 Sending message...');
      await chatApi.sendMessage(currentRoom.id, newMessage.trim());
      setNewMessage('');
      // Reload messages to see the new one
      await loadMessages(currentRoom);
    } catch (err) {
      console.error('❌ Failed to send message:', err);
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  // Handle key press (Enter to send)
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
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
                  {messages.map(message => (
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
                        <div className="text-white text-sm leading-relaxed">{message.content}</div>
                        {message.is_edited && (
                          <div className="text-gray-400 text-xs mt-2">(edited)</div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="bg-gray-800 border-t border-gray-700 p-4">
              <div className="flex space-x-4 items-end">
                <div className="flex-1 bg-gray-700 rounded-xl border border-gray-600 focus-within:border-blue-500 transition-colors">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={`Message #${currentRoom.title}... (Press Enter to send)`}
                    rows="1"
                    className="w-full bg-transparent border-0 resize-none focus:ring-0 text-white placeholder-gray-400 p-3 max-h-32"
                    style={{ minHeight: '44px' }}
                    disabled={sending}
                  />
                </div>
                <button 
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all min-w-20 ${
                    newMessage.trim() && !sending
                      ? 'bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg' 
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {sending ? (
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