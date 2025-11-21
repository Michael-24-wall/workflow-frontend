import React, { useEffect, useRef } from 'react';
import Message from './Message';
import useAuthStore from '../../../stores/authStore';

export default function MessageList({ messages = [], onDelete, onEdit, onReact, onReply, onPin }) {
  const messagesEndRef = useRef(null);
  const { user } = useAuthStore();

  // ADD THIS DEBUG EFFECT
  useEffect(() => {
    console.log('🔍 MESSAGELIST DEBUG:', {
      totalMessages: messages.length,
      currentUserId: user?.id,
      messages: messages.map(msg => ({
        id: msg.id,
        content: msg.content?.substring(0, 20),
        userId: msg.user?.id,
        userName: msg.user?.display_name || msg.user?.email || 'Unknown',
        userValid: msg.user && msg.user.id > 0,
        isOwn: msg.user?.id === user?.id
      }))
    });

    // Also log individual problematic messages
    messages.forEach(msg => {
      if (msg.user?.id === -4) {
        console.log('🚨 PROBLEMATIC MESSAGE:', {
          id: msg.id,
          content: msg.content,
          user: msg.user,
          fullMessage: msg
        });
      }
    });
  }, [messages, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sortedMessages = [...messages].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    
    const timeA = new Date(a.timestamp || a.created_at);
    const timeB = new Date(b.timestamp || b.created_at);
    return timeA - timeB; 
  });

  if (!messages || messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-900 p-8">
        <div className="text-center">
          <div className="text-slate-400 text-lg mb-2">No messages yet</div>
          <div className="text-slate-500 text-sm">
            Start a conversation by sending the first message
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-900">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-4">
          {sortedMessages.map((message, index) => {
            const showAvatar = index === 0 || 
              sortedMessages[index - 1]?.user?.id !== message.user?.id;
            
            return (
              <Message 
                key={message.id} 
                message={message} 
                showAvatar={showAvatar}
                onDelete={onDelete}
                onEdit={onEdit}
                onReact={onReact}
                onReply={onReply}
                onPin={onPin}
              />
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
}