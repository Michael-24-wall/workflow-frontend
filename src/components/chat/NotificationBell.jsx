// src/components/chat/NotificationBell.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../../contexts/chat/NotificationContext';

export default function NotificationBell() {
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();

  const handleClick = () => {
    // Simply navigate to ChatDashboard
    navigate('/chat');
  };

  return (
    <button
      onClick={handleClick}
      className="relative p-2 text-gray-400 hover:text-white transition-colors duration-200"
      title={`${unreadCount} unread notifications - Go to Chat`}
    >
      {/* Simple Bell Icon */}
      <svg 
        className="w-6 h-6" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M15 17h5l-5 5v-5zM10.24 8.56a5.97 5.97 0 01-4.66-7.5 1 1 0 00-1.16-1.15 7.97 7.97 0 00-5.14 10.74 1 1 0 001.3.54 5.96 5.96 0 014.66-2.63z" 
        />
      </svg>
      
      {/* Red Dot for Unread Count */}
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse border-2 border-gray-900">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}