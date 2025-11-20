// components/chat/ChannelChat.jsx
import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useWebSocket } from "../../../contexts/chat/WebSocketContext";
import { messageService, channelService } from "../../../services/chat/api";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import CreateChannelModal from "../../chat/CreateChannelModal";
import ChannelInviteModal from "../../chat/ChannelInviteModal";

export default function ChannelChat({ onShowMembers, onShowInvite }) {
  const { channelId } = useParams();
  const { sendMessage, user } = useWebSocket();
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showInviteMembers, setShowInviteMembers] = useState(false);
  const messagesEndRef = useRef(null);
  const [replyingTo, setReplyingTo] = useState(null);

  useEffect(() => {
    if (channelId) {
      loadChannelData();
      loadMessages();
    }
  }, [channelId]);

  const loadChannelData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Loading channel data for ID:', channelId);
      
      const currentChannel = await channelService.getChannel(channelId);
      
      console.log('✅ Channel loaded successfully:', currentChannel);
      setChannel(currentChannel);
      
    } catch (error) {
      console.error("❌ Failed to load channel:", error);
      setError("Failed to load channel data");
      // Set fallback channel data
      setChannel({ 
        id: parseInt(channelId), 
        name: `Channel ${channelId}`,
        topic: "Team collaboration space",
        purpose: "General discussion channel"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      setError(null);
      console.log('📥 Loading messages for channel:', channelId);
      
      const response = await channelService.getChannelMessages(channelId);
      console.log('📨 Messages response:', response);
      
      // Handle different response structures
      let messagesData = [];
      
      if (Array.isArray(response)) {
        messagesData = response;
      } else if (response && Array.isArray(response.results)) {
        messagesData = response.results;
      } else if (response && Array.isArray(response.data)) {
        messagesData = response.data;
      } else if (response && response.messages && Array.isArray(response.messages)) {
        messagesData = response.messages;
      } else if (response && typeof response === 'object') {
        messagesData = [response];
      }
      
      console.log(`✅ Loaded ${messagesData.length} messages`, messagesData);
      setMessages(messagesData);
      
    } catch (error) {
      console.error("❌ Failed to load messages:", error);
      setError("Failed to load messages");
      setMessages([]);
    }
  };

  // 🆕 ADD THE MISSING handleSendMessage FUNCTION
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
        result = await messageService.sendChannelMessage(channelId, content.trim());
        console.log('✅ Text message response:', result);
      }

      if (result && result.id) {
        setMessages(prev => [...prev, result]);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
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

  const handleCreateChannel = async (channelData) => {
    try {
      console.log('🚀 Creating channel:', channelData);
      
      const newChannel = await channelService.createChannel({
        name: channelData.name,
        topic: channelData.topic || '',
        purpose: channelData.purpose || '',
        channel_type: channelData.channel_type || 'public',
        workspace: channelData.workspaceId,
        is_private: channelData.is_private || false
      });

      console.log('✅ Channel created:', newChannel);
      
      setShowCreateChannel(false);
      alert(`Channel "${newChannel.name}" created successfully!`);
      
      return newChannel;
      
    } catch (error) {
      console.error('❌ Failed to create channel:', error);
      throw error;
    }
  };

  // 🆕 FIXED: Use channelService instead of direct api call
  const handleInviteMembers = async (inviteData) => {
    try {
      console.log('📤 Sending invite request:', inviteData);
      
      // Use the channelService that's already imported
      const response = await channelService.inviteToChannel(channelId, inviteData);
      
      console.log('✅ Invite response:', response);
      
      // Show success message
      if (response.added_users && response.added_users.length > 0) {
        alert(`✅ Successfully invited ${response.added_users.length} user(s) to the channel!`);
      } else if (response.already_members && response.already_members.length > 0) {
        alert(`ℹ️ ${response.already_members.length} user(s) are already channel members`);
      } else {
        alert('⚠️ No users were invited. Please check if the users are workspace members.');
      }
      
      return response;
    } catch (error) {
      console.error('❌ Invite error:', error);
      
      // Show user-friendly error message
      const errorMessage = error.response?.data?.error || error.message || 'Failed to send invitations';
      alert(`❌ Error: ${errorMessage}`);
      
      throw error;
    }
  };

  const handleReplyToMessage = async (messageId, replyContent) => {
    try {
      setError(null);
      console.log('↪️ Replying to message:', { messageId, replyContent });
      
      const result = await messageService.replyToMessage(
        parseInt(messageId), 
        replyContent.trim()
      );
      
      console.log('✅ Reply sent successfully:', result);
      
      setReplyingTo(null);
      
      if (result && result.id) {
        setMessages(prev => [...prev, result]);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
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
          return {
            ...msg,
            reactions: result.reactions || msg.reactions || []
          };
        }
        return msg;
      }));
      
    } catch (error) {
      console.error("❌ Failed to add reaction:", error);
      setError("Failed to add reaction");
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
      setError("Failed to remove reaction");
    }
  };

  const handleEditMessage = async (messageId, newContent) => {
    try {
      setError(null);
      console.log('✏️ Editing message:', { messageId, newContent });
      
      const result = await messageService.editMessage(messageId, newContent.trim());
      
      console.log('✅ Message edited successfully:', result);
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { 
              ...msg, 
              ...result, 
              content: newContent, 
              is_edited: true,
              edited_at: new Date().toISOString()
            }
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
              <h1 className="text-white font-semibold text-lg">
                # {channel?.name || `Channel ${channelId}`}
              </h1>
              <p className="text-slate-400 text-sm">
                {channel?.topic || channel?.purpose || "Team collaboration space"}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Invite Members Button */}
            <button
              onClick={() => setShowInviteMembers(true)}
              className="flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
            >
              <span>👋</span>
              <span>Invite Members</span>
            </button>

            {/* Show Members Button */}
            <button
              onClick={onShowMembers}
              className="flex items-center space-x-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
            >
              <span>👥</span>
              <span>View Members</span>
            </button>
            
            {/* Create Channel Button */}
            <button
              onClick={() => setShowCreateChannel(true)}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
            >
              <span>+</span>
              <span>Create Channel</span>
            </button>
            
            <div className="text-slate-400 text-sm">
              {messages.length} {messages.length === 1 ? 'message' : 'messages'}
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
        {!Array.isArray(messages) || messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="w-24 h-24 bg-blue-900/30 rounded-full flex items-center justify-center mb-6">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">💬</span>
              </div>
            </div>
            <h3 className="text-white text-xl font-semibold mb-3">
              {!Array.isArray(messages) ? 'Error loading messages' : 'No messages yet'}
            </h3>
            <p className="text-slate-400 text-center max-w-md">
              {!Array.isArray(messages) 
                ? 'There was an error loading messages. Please try refreshing.' 
                : `Start the conversation by sending the first message in #${channel?.name || `channel-${channelId}`}`
              }
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
            onReply={(message) => setReplyingTo(message)}
            onPin={handlePinMessage}
            replyingTo={replyingTo}
            currentUser={user}
          />
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-slate-700 p-6">
        <MessageInput 
          onSendMessage={handleSendMessage} 
          disabled={sending}
          placeholder={sending ? "Sending..." : `Message #${channel?.name || channelId}`}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
          onSendReply={handleReplyToMessage}
        />
        
        {sending && (
          <div className="mt-2 text-center">
            <p className="text-blue-400 text-sm">Sending message...</p>
          </div>
        )}
      </div>

      {/* Create Channel Modal */}
      <CreateChannelModal
        isOpen={showCreateChannel}
        onClose={() => setShowCreateChannel(false)}
        workspaceId={channel?.workspace?.id || 13}
        onChannelCreated={handleCreateChannel}
      />

      

      {/* Channel Invite Modal */}
      <ChannelInviteModal
        isOpen={showInviteMembers}
        onClose={() => setShowInviteMembers(false)}
        channelId={channelId}
        channelName={channel?.name}
        onInviteMembers={handleInviteMembers}
      />
    </div>
  );
}