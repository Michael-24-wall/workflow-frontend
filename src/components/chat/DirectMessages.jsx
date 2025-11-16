import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useWebSocket } from "../contexts/WebSocketContext";
import { dmService } from "../../services/api";
import MessageList from "./chat/MessageList";
import MessageInput from "./MessageInput";

export default function DirectMessages() {
  const { dmId } = useParams();
  const { messages, sendMessage, sendTyping } = useWebSocket();
  const [dm, setDm] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadDMData();
  }, [dmId]);

  const loadDMData = async () => {
    try {
      const dmData = await dmService.getDMMessages(dmId);
      setDm(dmData);
      setLoading(false);
    } catch (error) {
      console.error("Failed to load DM:", error);
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
      if (file) {
        await dmService.uploadFile(file, dmId);
      } else {
        sendMessage(dmId, content);
        // Also send via HTTP for persistence
        await dmService.sendDMMessage(dmId, content);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
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
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <h1 className="text-white font-semibold">
            {dm?.other_user?.display_name || dm?.other_user?.email}
          </h1>
          <div className="text-gray-400 text-sm">Direct message</div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-hidden">
        <MessageList messages={messages[dmId] || []} roomId={dmId} />
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="border-t border-gray-700 p-4">
        <MessageInput
          onSendMessage={handleSendMessage}
          onTyping={(isTyping) => sendTyping(dmId, isTyping)}
        />
      </div>
    </div>
  );
}
