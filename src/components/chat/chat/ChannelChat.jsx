import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useWebSocket } from "../../../contexts/chat/WebSocketContext";
import { messageService, channelService } from "../../../services/chat/api";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

export default function ChannelChat() {
  const { channelId } = useParams();
  const { sendMessage } = useWebSocket();
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const [replyingTo, setReplyingTo] = useState(null);

  useEffect(() => {
    loadChannelData();
    loadMessages();
  }, [channelId]);

  const loadChannelData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const channelsResponse = await channelService.getChannels();
      console.log('📋 Channels response:', channelsResponse);
      
      let currentChannel;
      
      if (channelsResponse.results && Array.isArray(channelsResponse.results)) {
        currentChannel = channelsResponse.results.find(ch => ch.id === parseInt(channelId));
      } else if (Array.isArray(channelsResponse)) {
        currentChannel = channelsResponse.find(ch => ch.id === parseInt(channelId));
      }
      
      if (currentChannel) {
        console.log('✅ Found channel:', currentChannel);
        setChannel(currentChannel);
      } else {
        console.log('⚠️ Channel not found, using fallback');
        setChannel({ 
          id: channelId, 
          name: `Channel ${channelId}`,
          topic: "General discussions"
        });
      }
    } catch (error) {
      console.error("Failed to load channel:", error);
      setError("Failed to load channel data");
      setChannel({ 
        id: channelId, 
        name: `Channel ${channelId}`,
        topic: "Team collaboration space"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      setError(null);
      console.log('📥 Loading messages for channel:', channelId);
      
      let response;
      
      if (channelService.getChannelMessages) {
        response = await channelService.getChannelMessages(channelId);
      } else if (channelService.getMessages) {
        response = await channelService.getMessages(channelId);
      } else if (messageService.getMessages) {
        response = await messageService.getMessages(channelId);
      } else {
        response = await fetch(`http://localhost:9000/api/chat/channels/${channelId}/messages/`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json',
          },
        }).then(res => res.json());
      }
      
      console.log('📨 Messages response:', response);
      
      let messagesData = [];
      
      if (Array.isArray(response)) {
        messagesData = response;
      } else if (response && response.results) {
        messagesData = response.results;
      } else if (response && response.data) {
        messagesData = response.data;
      }
      
      console.log(`✅ Loaded ${messagesData.length} messages`);
      setMessages(messagesData);
      
    } catch (error) {
      console.error("Failed to load messages:", error);
      setError("Failed to load messages");
      setMessages([]);
    }
  };

  const handleSendMessage = async (content, file = null) => {
    if ((!content || !content.trim()) && !file) return;

    setSending(true);
    setError(null);
    
    try {
      console.log('📤 Sending message or file:', { content, hasFile: !!file, channelId });

      let result;

      if (file) {
        console.log('📎 Uploading file:', file.name, file.type, file.size);
        result = await messageService.uploadFile(file, channelId, content || '');
        console.log('✅ File upload response:', result);
      } else {
        console.log('💬 Sending text message');
        result = await messageService.sendChannelMessage(channelId, content);
        console.log('✅ Text message response:', result);
      }

      if (result && result.id) {
        setMessages(prev => [...prev, result]);
      } else {
        await loadMessages();
      }

    } catch (error) {
      console.error("❌ Failed to send message/file:", error);
      setError(`Failed to send: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  const handleReplyToMessage = async (messageId, replyContent) => {
    try {
      setError(null);
      console.log('↪️ Replying to message:', { messageId, replyContent });
      console.log('🔍 DEBUG - messageId type:', typeof messageId, 'value:', messageId);
      
      const result = await messageService.replyToMessage(messageId, replyContent);
      
      console.log('✅ Reply sent successfully:', result);
      
      setReplyingTo(null);
      
      if (result && result.id) {
        setMessages(prev => [...prev, result]);
      } else {
        await loadMessages();
      }
      
    } catch (error) {
      console.error("❌ Failed to send reply:", error);
      setError(`Failed to send reply: ${error.message}`);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      setError(null);
      console.log('🗑️ Deleting message:', messageId);
      
      await messageService.deleteMessage(messageId);
      
      console.log('✅ Message deleted successfully');
      
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      
    } catch (error) {
      console.error("❌ Failed to delete message:", error);
      setError("Failed to delete message");
      await loadMessages();
    }
  };

  const handleReactToMessage = async (messageId, reactionType) => {
    try {
      console.log('💖 Reacting to message:', { messageId, reactionType });
      
      const result = await messageService.reactToMessage(messageId, reactionType);
      
      console.log('✅ Reaction added successfully:', result);
      
      setMessages(prev => prev.map(msg => {
        if (msg.id === messageId) {
          const updatedReactions = result.reactions || msg.reactions || [];
          return {
            ...msg,
            reactions: updatedReactions
          };
        }
        return msg;
      }));
      
    } catch (error) {
      console.error("❌ Failed to add reaction:", error);
    }
  };

  const handleRemoveReaction = async (messageId, reactionType) => {
    try {
      console.log('🗑️ Removing reaction:', { messageId, reactionType });
      
      await messageService.removeReaction(messageId, reactionType);
      
      console.log('✅ Reaction removed successfully');
      
      setMessages(prev => prev.map(msg => {
        if (msg.id === messageId) {
          const updatedReactions = (msg.reactions || []).filter(
            reaction => !(reaction.user?.id === user?.id && reaction.reaction_type === reactionType)
          );
          return {
            ...msg,
            reactions: updatedReactions
          };
        }
        return msg;
      }));
      
    } catch (error) {
      console.error("❌ Failed to remove reaction:", error);
    }
  };

  const handleEditMessage = async (messageId, newContent) => {
    try {
      setError(null);
      console.log('✏️ Editing message:', { messageId, newContent });
      
      const result = await messageService.editMessage(messageId, newContent);
      
      console.log('✅ Message edited successfully:', result);
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, ...result, content: newContent, is_edited: true }
          : msg
      ));
      
    } catch (error) {
      console.error("❌ Failed to edit message:", error);
      setError("Failed to edit message");
      await loadMessages();
    }
  };

  const handlePinMessage = async (messageId, pin) => {
    try {
      console.log('📌 Toggling pin status:', { messageId, pin });
      
      if (pin) {
        await messageService.pinMessage(messageId);
      } else {
        await messageService.unpinMessage(messageId);
      }
      
      console.log('✅ Pin status updated successfully');
      
      await loadMessages();
      
    } catch (error) {
      console.error("❌ Failed to update pin status:", error);
      setError("Failed to update pin status");
    }
  };

  const handleRetry = () => {
    setError(null);
    loadChannelData();
    loadMessages();
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading channel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-900">
      {/* Channel Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
            <div>
              <h1 className="text-white font-semibold text-lg"># {channel?.name}</h1>
              <p className="text-slate-400 text-sm">{channel?.topic || channel?.purpose || "Team collaboration space"}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-slate-400 text-sm">
              {messages.length} messages
            </div>
            
            <button
              onClick={handleRetry}
              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-sm transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-900/50 border-b border-red-700 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-red-400">⚠️</span>
              <span className="text-red-200 text-sm">{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-300"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="w-24 h-24 bg-blue-900/30 rounded-full flex items-center justify-center mb-6">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">💬</span>
              </div>
            </div>
            <h3 className="text-white text-xl font-semibold mb-3">No messages yet</h3>
            <p className="text-slate-400 text-center max-w-md">
              Start the conversation by sending the first message in #{channel?.name}
            </p>
            {error && (
              <button
                onClick={handleRetry}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Retry Loading Messages
              </button>
            )}
          </div>
        ) : (
          <MessageList 
            messages={messages} 
            onDelete={handleDeleteMessage}
            onEdit={handleEditMessage}
            onReact={handleReactToMessage}
            onRemoveReaction={handleRemoveReaction}
            onReply={handleReplyToMessage}
            onPin={handlePinMessage}
            replyingTo={replyingTo}
          />
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-slate-700 p-6">
        <MessageInput 
          onSendMessage={handleSendMessage} 
          disabled={sending}
          placeholder={sending ? "Sending..." : `Message #${channel?.name}`}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
        />
        
        {sending && (
          <div className="mt-2 text-center">
            <p className="text-blue-400 text-sm">Sending message...</p>
          </div>
        )}
      </div>
    </div>
  );
}