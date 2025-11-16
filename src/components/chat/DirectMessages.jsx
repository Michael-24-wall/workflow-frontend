import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useWebSocket } from "../contexts/WebSocketContext";
import { dmService } from "../../services/api";
import MessageList from "./chat/MessageList";
import MessageInput from "./MessageInput";

export default function DirectMessages() {
  const { dmId } = useParams();
  const navigate = useNavigate();
  const { messages, sendMessage, sendTyping } = useWebSocket();
  const [dm, setDm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (dmId) {
      loadDMData();
    }
  }, [dmId]);

  const loadDMData = async () => {
    try {
      setLoading(true);
      setError("");
      console.log(`🔄 Loading DM data for: ${dmId}`);
      
      // Check authentication
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Authentication required. Please login again.');
      }

      console.log('🔐 Token available, fetching DM messages...');
      const dmData = await dmService.getDMMessages(dmId);
      console.log('✅ DM data loaded:', dmData);
      
      setDm(dmData);
    } catch (error) {
      console.error("❌ Failed to load DM:", error);
      setError(error.message || "Failed to load direct messages");
      
      // Handle authentication errors
      if (error.message.includes('401') || error.message.includes('Authentication')) {
        setError("Session expired. Redirecting to login...");
        setTimeout(() => {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          navigate('/login');
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages[dmId]]);

  const handleSendMessage = async (content, file = null) => {
    try {
      console.log(`💬 Sending message to DM ${dmId}:`, content);
      
      if (file) {
        console.log('📁 Uploading file:', file.name);
        await dmService.uploadFile(file, dmId);
      } else {
        // Send via WebSocket for real-time
        sendMessage(dmId, content);
        // Also send via HTTP for persistence (optional)
        try {
          await dmService.sendDMMessage(dmId, content);
        } catch (httpError) {
          console.warn('⚠️ HTTP message send failed, but WebSocket may have worked:', httpError);
        }
      }
    } catch (error) {
      console.error("❌ Failed to send message:", error);
      setError("Failed to send message. Please try again.");
    }
  };

  const handleRetry = () => {
    loadDMData();
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading direct messages...</p>
          <p className="text-gray-500 text-sm">DM ID: {dmId}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900">
        <div className="text-center max-w-md mx-4">
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-6">
            <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-white text-lg font-semibold mb-2">Unable to Load Messages</h3>
            <p className="text-red-200 mb-4">{error}</p>
            {!error.includes('Redirecting') && (
              <button
                onClick={handleRetry}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
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
              {dm?.other_user?.display_name || dm?.other_user?.email || 'Unknown User'}
            </h1>
            <div className="text-gray-400 text-sm">Direct message</div>
          </div>
          <button
            onClick={handleRetry}
            className="text-gray-400 hover:text-gray-300 text-sm"
            title="Refresh messages"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Debug info - remove in production */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 text-xs text-gray-400">
        <div className="flex justify-between">
          <span>DM ID: {dmId}</span>
          <span>Messages: {(messages[dmId] || []).length}</span>
          <span>Status: {dm ? 'Loaded' : 'Not loaded'}</span>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-hidden">
        <MessageList 
          messages={messages[dmId] || []} 
          roomId={dmId} 
          fallbackMessages={dm?.messages || []}
        />
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="border-t border-gray-700 p-4">
        <MessageInput
          onSendMessage={handleSendMessage}
          onTyping={(isTyping) => sendTyping(dmId, isTyping)}
          disabled={!!error}
        />
      </div>
    </div>
  );
}