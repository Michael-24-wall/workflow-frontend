import React, { useEffect, useRef } from 'react';
import Message from './Message';

export default function MessageList({ messages = [], onDelete, onEdit, onReact, onReply, onPin }) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
          {messages.map((message, index) => {
            const showAvatar = index === 0 || 
              messages[index - 1]?.user?.id !== message.user?.id;
            
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