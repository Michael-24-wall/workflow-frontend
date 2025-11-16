import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useWebSocket } from '../../../contexts/chat/WebSocketContext';
import { messageService, dmService } from '../../../services/chat/api';

export default function DirectMessages() {
  const { dmId } = useParams();
  const { messages, sendMessage, sendTyping } = useWebSocket();
  const [dm, setDm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dmMessages, setDmMessages] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (dmId) {
      loadDMData();
      loadMessages();
    }
  }, [dmId]);

  const loadDMData = async () => {
    try {
      // Try to get DM data from your backend
      const dmData = await dmService.getDirectMessages();
      const currentDm = dmData.find(dm => dm.id === parseInt(dmId)) || 
                       dmData.find(dm => dm.id === dmId);
      
      if (currentDm) {
        setDm(currentDm);
      } else {
        // Fallback to mock data if DM not found
        const mockDm = {
          id: dmId,
          other_user: {
            id: '2',
            email: 'user@example.com',
            display_name: 'Direct Message User'
          }
        };
        setDm(mockDm);
      }
    } catch (error) {
      console.error('Failed to load DM data:', error);
      // Fallback to basic DM data
      const mockDm = {
        id: dmId,
        other_user: {
          id: '2',
          email: 'user@example.com',
          display_name: 'Direct Message User'
        }
      };
      setDm(mockDm);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      const messagesData = await dmService.getDMMessages(dmId, {
        page: 1,
        page_size: 50
      });
      setDmMessages(messagesData.results || messagesData || []);
    } catch (error) {
      console.error('Failed to load DM messages:', error);
      setDmMessages([]);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [dmMessages]);

  // Combine WebSocket messages with API messages
  const allMessages = [...dmMessages, ...(messages[dmId] || [])];

  const handleSendMessage = async (content, file = null) => {
    try {
      if (file) {
        // For DMs, you might need a different approach for file upload
        // Since your backend might not support room_id for DMs, use message service
        await messageService.uploadFile(file, null, content);
        // Alternative: Send as regular message with file description
        // await dmService.sendDMMessage(dmId, content, 'file');
      } else {
        // Send text message to DM
        await dmService.sendDMMessage(dmId, content, 'text');
      }
      // Reload messages to ensure consistency
      loadMessages();
    } catch (error) {
      console.error('Failed to send DM message:', error);
      alert('Failed to send message: ' + error.message);
    }
  };

  const handleReplyToMessage = async (messageId, replyContent) => {
    try {
      await messageService.replyToMessage(messageId, replyContent);
      loadMessages(); // Reload to show the reply
    } catch (error) {
      console.error('Failed to send reply:', error);
      alert('Failed to send reply: ' + error.message);
    }
  };

  const handleReactToMessage = async (messageId, reactionType) => {
    try {
      await messageService.reactToMessage(messageId, reactionType);
      loadMessages(); // Reload to show the reaction
    } catch (error) {
      console.error('Failed to react to message:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-900">
      {/* DM header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <h1 className="text-white font-semibold">
              {dm?.other_user?.display_name || dm?.other_user?.email || 'Direct Message'}
            </h1>
            <div className="text-gray-400 text-sm">
              Direct message • {allMessages.length} messages
            </div>
          </div>
          <button 
            onClick={loadMessages}
            className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {allMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-2">
            <div className="text-lg">No messages yet</div>
            <div className="text-sm">Start a conversation with {dm?.other_user?.display_name || 'this user'}</div>
          </div>
        ) : (
          allMessages.map((message) => (
            <DMMessageItem 
              key={message.id} 
              message={message}
              onReply={handleReplyToMessage}
              onReact={handleReactToMessage}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="border-t border-gray-700 p-4">
        <MessageInput 
          onSendMessage={handleSendMessage}
          onTyping={(isTyping) => sendTyping && sendTyping(dmId, isTyping)}
          placeholder={`Message ${dm?.other_user?.display_name || dm?.other_user?.email || 'user'}`}
        />
      </div>
    </div>
  );
}

// DM-specific MessageItem component
function DMMessageItem({ message, onReply, onReact }) {
  const [showActions, setShowActions] = useState(false);
  const [replying, setReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const handleReplySubmit = () => {
    if (replyContent.trim() && onReply) {
      onReply(message.id, replyContent);
      setReplyContent('');
      setReplying(false);
    }
  };

  const isCurrentUser = message.user?.id === localStorage.getItem('current_user_id');

  return (
    <div 
      className={`rounded-lg p-4 transition-colors ${
        isCurrentUser ? 'bg-blue-900 bg-opacity-30 ml-8' : 'bg-gray-800 mr-8'
      } hover:bg-opacity-50`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start space-x-3">
        {!isCurrentUser && (
          <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
            {message.user?.email?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        )}
        <div className="flex-1">
          {!isCurrentUser && (
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-white font-medium">
                {message.user?.email || 'Unknown User'}
              </span>
              <span className="text-gray-400 text-sm">
                {new Date(message.timestamp || message.created_at).toLocaleTimeString()}
              </span>
            </div>
          )}
          
          <p className={`whitespace-pre-wrap ${
            isCurrentUser ? 'text-blue-100' : 'text-gray-200'
          }`}>
            {message.content}
          </p>

          {/* File attachment */}
          {message.file && (
            <div className="mt-2 p-2 bg-gray-700 bg-opacity-50 rounded">
              <a 
                href={message.file_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 flex items-center space-x-2"
              >
                <span>📎</span>
                <span>{message.file_name}</span>
                <span className="text-gray-400 text-sm">
                  ({Math.round(message.file_size / 1024)} KB)
                </span>
              </a>
            </div>
          )}

          {/* Replies */}
          {message.replies && message.replies.length > 0 && (
            <div className="mt-2 ml-4 border-l-2 border-gray-600 pl-4">
              {message.replies.map((reply) => (
                <div key={reply.id} className="py-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="text-blue-400">{reply.user?.email}</span>
                    <span className="text-gray-400">
                      {new Date(reply.timestamp || reply.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm">{reply.content}</p>
                </div>
              ))}
            </div>
          )}

          {/* Reply input */}
          {replying && (
            <div className="mt-2">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                className="w-full bg-gray-700 text-white rounded p-2 text-sm resize-none"
                rows="2"
              />
              <div className="flex space-x-2 mt-1">
                <button
                  onClick={handleReplySubmit}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                >
                  Send Reply
                </button>
                <button
                  onClick={() => setReplying(false)}
                  className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Message actions */}
          {showActions && (
            <div className="flex space-x-2 mt-2">
              <button
                onClick={() => setReplying(true)}
                className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded"
              >
                Reply
              </button>
              <button
                onClick={() => onReact && onReact(message.id, 'like')}
                className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded"
              >
                👍
              </button>
              <button
                onClick={() => onReact && onReact(message.id, 'heart')}
                className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded"
              >
                ❤️
              </button>
            </div>
          )}
        </div>
        {isCurrentUser && (
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
            {message.user?.email?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        )}
      </div>
    </div>
  );
}

// MessageInput component for DMs
function MessageInput({ onSendMessage, onTyping, placeholder = "Type a message..." }) {
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  const fileInputRef = useRef();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() || file) {
      onSendMessage(message, file);
      setMessage('');
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onTyping && onTyping(false);
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Auto-send file when selected
      onSendMessage('', selectedFile);
      setFile(null);
      e.target.value = '';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex space-x-2">
      <div className="flex-1 flex space-x-2">
        <input
          type="text"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            onTyping && onTyping(true);
          }}
          onBlur={() => onTyping && onTyping(false)}
          placeholder={placeholder}
          className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          id="dm-file-upload"
        />
        <label
          htmlFor="dm-file-upload"
          className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg cursor-pointer flex items-center"
        >
          📎
        </label>
        <button
          type="submit"
          disabled={!message.trim() && !file}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium"
        >
          Send
        </button>
      </div>
    </form>
  );
}