import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useWebSocket } from "../../../contexts/chat/WebSocketContext";
import { messageService } from "../../../services/chat/api";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

export default function ChannelChat() {
  const { channelId } = useParams();
  const { sendMessage } = useWebSocket();
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [localMessages, setLocalMessages] = useState([]);
  const messagesEndRef = useRef(null);
  
  const allMessages = localMessages;

  const getFixedFileUrl = (fileUrl) => {
    if (!fileUrl) return null;
    
    if (fileUrl.startsWith('http')) {
      return fileUrl;
    }
    
    if (fileUrl.startsWith('/media/')) {
      return `http://localhost:9000${fileUrl}`;
    }
    
    if (fileUrl && !fileUrl.includes('/')) {
      return `http://localhost:9000/media/${fileUrl}`;
    }
    
    return fileUrl;
  };

  useEffect(() => {
    loadChannelData();
    loadInitialMessages();
  }, [channelId]);

  const loadChannelData = async () => {
    try {
      setChannel({ 
        id: channelId, 
        name: `Channel ${channelId}`,
        topic: "Team collaboration space"
      });
      setLoading(false);
    } catch (error) {
      setChannel({ id: channelId, name: `Channel ${channelId}` });
      setLoading(false);
    }
  };

  const loadInitialMessages = async () => {
    const storageKey = `chat-messages-${channelId}`;
    const savedMessages = localStorage.getItem(storageKey);
    
    if (savedMessages) {
      try {
        const messages = JSON.parse(savedMessages);
        
        const fixedMessages = messages.map(msg => {
          if (msg.message_type === 'file' && msg.file_url) {
            return {
              ...msg,
              file_url: getFixedFileUrl(msg.file_url)
            };
          }
          return msg;
        });
        
        setLocalMessages(fixedMessages);
      } catch (error) {
        setLocalMessages([]);
      }
    } else {
      setLocalMessages([]);
    }
  };

  const handleReactToMessage = async (messageId, reactionType) => {
    try {
      const result = await messageService.reactToMessage(messageId, reactionType);
      
      setLocalMessages(prev => prev.map(msg => {
        if (msg.id === messageId) {
          const existingReactions = msg.reactions || [];
          const hasExistingReaction = existingReactions.find(r => 
            r.user?.id === result.reaction?.user?.id && 
            r.reaction_type === reactionType
          );
          
          if (!hasExistingReaction) {
            return {
              ...msg,
              reactions: [...existingReactions, result.reaction]
            };
          }
        }
        return msg;
      }));
      
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  };

  const handleReplyToMessage = async (messageId, replyContent) => {
    try {
      const result = await messageService.replyToMessage(messageId, replyContent);
      
      if (result) {
        setLocalMessages(prev => [...prev, {
          ...result,
          is_own_message: true,
          replied_to: localMessages.find(m => m.id === messageId)
        }]);
      }
      
    } catch (error) {
      console.error('Failed to send reply:', error);
    }
  };

  const handlePinMessage = async (messageId) => {
    try {
      await messageService.pinMessage(messageId);
      
      setLocalMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, is_pinned: true }
          : msg
      ));
      
    } catch (error) {
      console.error('Failed to pin message:', error);
    }
  };

  const handleSendMessage = async (content, file = null) => {
    try {
      if (file) {
        const optimisticFileMessage = {
          id: `file-optimistic-${Date.now()}`,
          content: `📎 ${file.name}`,
          message_type: 'file',
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          file_url: null,
          timestamp: new Date().toISOString(),
          user: {
            id: 1,
            display_name: 'You',
            email: 'user@example.com',
            avatar: null
          },
          is_own_message: true,
          is_optimistic: true
        };
        
        setLocalMessages(prev => [...prev, optimisticFileMessage]);

        try {
          const uploadResponse = await messageService.uploadFile(file, channelId);
          
          const realFileMessage = {
            id: uploadResponse.id || `file-real-${Date.now()}`,
            content: uploadResponse.content || `📎 ${uploadResponse.file_name}`,
            message_type: uploadResponse.message_type || 'file',
            file_url: getFixedFileUrl(uploadResponse.file_url),
            file_name: uploadResponse.file_name,
            file_size: uploadResponse.file_size,
            file_type: uploadResponse.file_type,
            timestamp: uploadResponse.timestamp || new Date().toISOString(),
            user: uploadResponse.user || {
              id: 1,
              display_name: 'You',
              email: 'user@example.com',
              avatar: null
            },
            is_own_message: true
          };
          
          setLocalMessages(prev => 
            prev.map(msg => 
              msg.id === optimisticFileMessage.id ? realFileMessage : msg
            )
          );
          
        } catch (uploadError) {
          setLocalMessages(prev => 
            prev.map(msg => 
              msg.id === optimisticFileMessage.id 
                ? { 
                    ...msg, 
                    content: `❌ ${file.name} (upload failed)`,
                    file_url: null 
                  }
                : msg
            )
          );
        }
        
      } else {
        const tempMessage = {
          id: `text-${Date.now()}`,
          content: content,
          message_type: 'text',
          timestamp: new Date().toISOString(),
          user: { 
            id: 1, 
            display_name: 'You',
            email: 'user@example.com',
            avatar: null
          },
          is_own_message: true,
          is_optimistic: true
        };
        
        setLocalMessages(prev => [...prev, tempMessage]);

        try {
          if (sendMessage) {
            sendMessage({
              type: "chat_message",
              content: content,
              channel_id: channelId,
              message_type: "text"
            });
          } else {
            await messageService.sendChannelMessage(channelId, content);
          }
        } catch (error) {
          // Message remains in local state
        }
      }
      
    } catch (error) {
      console.error('Send failed:', error);
    }
  };

  useEffect(() => {
    if (allMessages.length > 0) {
      const storageKey = `chat-messages-${channelId}`;
      localStorage.setItem(storageKey, JSON.stringify(allMessages));
    }
  }, [allMessages, channelId]);

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
              <p className="text-slate-400 text-sm">{channel?.topic}</p>
            </div>
          </div>
          
          <div className="text-slate-400 text-sm">
            {allMessages.length} messages
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        {allMessages.length === 0 ? (
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
          </div>
        ) : (
          <MessageList 
            messages={allMessages} 
            roomId={channelId}
            onReact={handleReactToMessage}
            onReply={handleReplyToMessage}
            onPin={handlePinMessage}
          />
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-slate-700 p-6">
        <MessageInput 
          onSendMessage={handleSendMessage} 
          onTyping={() => {}} 
          placeholder={`Message #${channel?.name}`}
        />
      </div>
    </div>
  );
}