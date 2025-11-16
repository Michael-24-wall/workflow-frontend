import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useWebSocket } from "../contexts/WebSocketContext";
import { messageService } from "../../services/api";
import MessageList from "./chat/MessageList";
import MessageInput from "./MessageInput";

export default function ChannelChat() {
  const { channelId } = useParams();
  const { messages, sendMessage, sendTyping } = useWebSocket();
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadChannelData();
  }, [channelId]);

  const loadChannelData = async () => {
    try {
      // In a real app, you'd fetch channel details
      setChannel({ id: channelId, name: "general" });
      setLoading(false);
    } catch (error) {
      console.error("Failed to load channel:", error);
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages[channelId]]);

  const handleSendMessage = async (content, file = null) => {
    try {
      if (file) {
        await messageService.uploadFile(file, channelId);
      } else {
        sendMessage(channelId, content);
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
      {/* Channel header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-3">
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <h1 className="text-white font-semibold"># {channel?.name}</h1>
          <div className="text-gray-400 text-sm">
            {messages[channelId]?.length || 0} messages
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-hidden">
        <MessageList messages={messages[channelId] || []} roomId={channelId} />
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="border-t border-gray-700 p-4">
        <MessageInput
          onSendMessage={handleSendMessage}
          onTyping={(isTyping) => sendTyping(channelId, isTyping)}
        />
      </div>
    </div>
  );
}
