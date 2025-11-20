// src/contexts/chat/NotificationContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useWebSocket } from './WebSocketContext';
import { useAuth } from './AuthContext';
import notificationService from '../../services/chat/notificationService';
import { channelService } from '../../services/chat/api';

const NotificationContext = createContext();

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  
  const { lastMessage, connectToNotifications, isConnected } = useWebSocket();
  const { user, isAuthenticated } = useAuth();

  // Load initial notifications and invitations
  useEffect(() => {
    if (isAuthenticated && user) {
      loadNotifications();
      loadPendingInvitations();
      connectToNotifications();
    }
  }, [isAuthenticated, user]);

  // Handle WebSocket notifications
  useEffect(() => {
    if (!lastMessage) return;

    console.log('🔔 Notification WebSocket message:', lastMessage);

    switch (lastMessage.type) {
      case 'notification':
        handleNewNotification(lastMessage);
        break;
      
      case 'dm_notification':
        handleDMNotification(lastMessage);
        break;
      
      case 'mention_notification':
        handleMentionNotification(lastMessage);
        break;

      case 'channel_notification':
        handleChannelNotification(lastMessage);
        break;

      case 'reaction_notification':
        handleReactionNotification(lastMessage);
        break;

      case 'system_notification':
        handleSystemNotification(lastMessage);
        break;

      // ✅ ADD INVITATION NOTIFICATION HANDLER
      case 'channel_invite':
        handleInvitationNotification(lastMessage);
        break;

      default:
        // Check if it's a notification-like message
        if (lastMessage.notification_type || lastMessage.title) {
          handleNewNotification(lastMessage);
        }
    }
  }, [lastMessage]);

  // Load notifications from API
  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Loading notifications from API...');
      const data = await notificationService.getNotifications();
      
      // Handle different response formats
      let notificationsArray = [];
      let unreadCountValue = 0;

      if (Array.isArray(data)) {
        notificationsArray = data;
        unreadCountValue = data.filter(n => !n.is_read).length;
      } else if (data && Array.isArray(data.results)) {
        notificationsArray = data.results;
        unreadCountValue = data.unread_count || data.results.filter(n => !n.is_read).length;
      } else if (data && Array.isArray(data.notifications)) {
        notificationsArray = data.notifications;
        unreadCountValue = data.unread_count || data.notifications.filter(n => !n.is_read).length;
      } else if (data && data.unread_count !== undefined) {
        unreadCountValue = data.unread_count;
      }

      console.log(`✅ Loaded ${notificationsArray.length} notifications, ${unreadCountValue} unread`);
      
      setNotifications(notificationsArray);
      setUnreadCount(unreadCountValue);
      
    } catch (error) {
      console.error('❌ Failed to load notifications:', error);
      setError('Failed to load notifications');
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  // ✅ ADD: Load pending channel invitations
  const loadPendingInvitations = async () => {
    try {
      console.log('🔄 Loading pending invitations...');
      const response = await channelService.getMyInvitations();
      const invitations = response.invitations || [];
      
      console.log(`✅ Loaded ${invitations.length} pending invitations`);
      setPendingInvitations(invitations);
      
      return invitations;
    } catch (error) {
      console.error('❌ Failed to load pending invitations:', error);
      setPendingInvitations([]);
      return [];
    }
  };

  // ✅ ADD: Get pending invitations (synchronous)
  const getPendingInvitations = useCallback(() => {
    return pendingInvitations;
  }, [pendingInvitations]);

  // ✅ ADD: Check if user has pending invitations
  const hasPendingInvitations = pendingInvitations.length > 0;

  // ✅ ADD: Refresh both notifications and invitations
  const refreshAll = async () => {
    await Promise.all([
      loadNotifications(),
      loadPendingInvitations()
    ]);
  };

  // ✅ ADD: Handle invitation WebSocket notifications
  const handleInvitationNotification = useCallback((data) => {
    console.log('📨 Received channel invitation via WebSocket:', data);
    
    // Reload invitations when new one arrives
    loadPendingInvitations();
    
    // Also create a regular notification
    const notification = {
      id: `invite-${data.channel?.id}-${Date.now()}`,
      type: 'channel_invitation',
      title: 'Channel Invitation 🎯',
      message: data.message || `You've been invited to join #${data.channel?.name} by ${data.invited_by?.email}`,
      data: {
        channel_id: data.channel?.id,
        channel_name: data.channel?.name,
        invited_by: data.invited_by,
        workspace_id: data.channel?.workspace,
        timestamp: data.timestamp
      },
      timestamp: data.timestamp || new Date().toISOString(),
      is_read: false,
    };

    console.log('📨 Processing invitation notification:', notification);
    
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
    showBrowserNotification(notification);
  }, []);

  // ✅ ADD: Accept invitation and update state
  const acceptInvitation = async (channelId) => {
    try {
      console.log('✅ Accepting invitation for channel:', channelId);
      
      await channelService.acceptInvitation(channelId);
      
      // Remove from pending invitations
      setPendingInvitations(prev => prev.filter(inv => inv.id !== channelId));
      
      // Mark related notification as read
      const invitationNotification = notifications.find(n => 
        n.type === 'channel_invitation' && n.data?.channel_id === channelId
      );
      
      if (invitationNotification) {
        await markAsRead(invitationNotification.id);
      }
      
      console.log('🎉 Invitation accepted successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to accept invitation:', error);
      throw error;
    }
  };

  // ✅ ADD: Decline invitation and update state
  const declineInvitation = async (channelId) => {
    try {
      console.log('❌ Declining invitation for channel:', channelId);
      
      await channelService.declineInvitation(channelId);
      
      // Remove from pending invitations
      setPendingInvitations(prev => prev.filter(inv => inv.id !== channelId));
      
      // Mark related notification as read
      const invitationNotification = notifications.find(n => 
        n.type === 'channel_invitation' && n.data?.channel_id === channelId
      );
      
      if (invitationNotification) {
        await markAsRead(invitationNotification.id);
      }
      
      console.log('✅ Invitation declined successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to decline invitation:', error);
      throw error;
    }
  };

  // Existing notification handlers (keep these as they are)
  const handleNewNotification = useCallback((notificationData) => {
    const notification = {
      id: notificationData.id || notificationData.notification_id || `notif-${Date.now()}`,
      type: notificationData.type || notificationData.notification_type || 'system',
      title: notificationData.title,
      message: notificationData.message || notificationData.content,
      data: notificationData.data || {},
      timestamp: notificationData.timestamp || notificationData.created_at || new Date().toISOString(),
      is_read: notificationData.is_read || false,
    };

    console.log('📨 Processing new notification:', notification);

    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
    showBrowserNotification(notification);
  }, []);

  const handleDMNotification = useCallback((data) => {
    const notification = {
      id: `dm-${data.dm_id}-${Date.now()}`,
      type: 'dm_message',
      title: 'New Message',
      message: `${data.sender_name || data.sender_display_name || 'Someone'} sent you a message`,
      data: {
        dm_id: data.dm_id,
        sender_id: data.sender_id,
        sender_name: data.sender_name || data.sender_display_name,
        message_preview: data.message_preview || data.content,
      },
      timestamp: data.timestamp || new Date().toISOString(),
      is_read: false,
    };

    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
    showBrowserNotification(notification);
  }, []);

  const handleMentionNotification = useCallback((data) => {
    const notification = {
      id: `mention-${data.message_id}-${Date.now()}`,
      type: 'mention',
      title: 'You were mentioned',
      message: `${data.mentioned_by || data.mentioned_by_name || 'Someone'} mentioned you in a message`,
      data: {
        message_id: data.message_id,
        channel_id: data.channel_id,
        workspace_id: data.workspace_id,
        mentioned_by: data.mentioned_by || data.mentioned_by_name,
        message_preview: data.message_preview || data.content,
      },
      timestamp: data.timestamp || new Date().toISOString(),
      is_read: false,
    };

    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
    showBrowserNotification(notification);
  }, []);

  const handleChannelNotification = useCallback((data) => {
    const notification = {
      id: `channel-${data.channel_id}-${Date.now()}`,
      type: 'channel_message',
      title: 'Channel Activity',
      message: `New message in ${data.channel_name ? `#${data.channel_name}` : 'a channel'}`,
      data: {
        channel_id: data.channel_id,
        channel_name: data.channel_name,
        workspace_id: data.workspace_id,
        message_preview: data.message_preview || data.content,
      },
      timestamp: data.timestamp || new Date().toISOString(),
      is_read: false,
    };

    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
    showBrowserNotification(notification);
  }, []);

  const handleReactionNotification = useCallback((data) => {
    const notification = {
      id: `reaction-${data.message_id}-${Date.now()}`,
      type: 'reaction',
      title: 'New Reaction',
      message: `${data.reacted_by || data.user_name || 'Someone'} reacted to your message`,
      data: {
        message_id: data.message_id,
        reaction_type: data.reaction_type,
        reacted_by: data.reacted_by || data.user_name,
        channel_id: data.channel_id,
        dm_id: data.dm_id,
      },
      timestamp: data.timestamp || new Date().toISOString(),
      is_read: false,
    };

    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
    showBrowserNotification(notification);
  }, []);

  const handleSystemNotification = useCallback((data) => {
    const notification = {
      id: `system-${Date.now()}`,
      type: 'system',
      title: data.title || 'System Notification',
      message: data.message || data.content,
      data: data.data || {},
      timestamp: data.timestamp || new Date().toISOString(),
      is_read: false,
    };

    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
    showBrowserNotification(notification);
  }, []);

  const showBrowserNotification = (notification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          tag: notification.id,
          requireInteraction: true,
        });
      } catch (error) {
        console.warn('⚠️ Browser notification failed:', error);
      }
    }
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      console.log('⚠️ This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      console.log('⚠️ Notification permission denied');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('❌ Error requesting notification permission:', error);
      return false;
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      console.log(`📖 Marking notification as read: ${notificationId}`);
      
      await notificationService.markAsRead(notificationId);
      
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      console.log('✅ Notification marked as read');
    } catch (error) {
      console.error('❌ Failed to mark notification as read:', error);
      // Still update locally for better UX
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    try {
      console.log('📖 Marking all notifications as read');
      
      await notificationService.markAllAsRead();
      
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true }))
      );
      setUnreadCount(0);
      
      console.log('✅ All notifications marked as read');
    } catch (error) {
      console.error('❌ Failed to mark all notifications as read:', error);
      // Still update locally for better UX
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true }))
      );
      setUnreadCount(0);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      console.log(`🗑️ Deleting notification: ${notificationId}`);
      
      const notification = notifications.find(n => n.id === notificationId);
      
      await notificationService.deleteNotification(notificationId);
      
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      console.log('✅ Notification deleted');
    } catch (error) {
      console.error('❌ Failed to delete notification:', error);
      // Still update locally for better UX
      const notification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    }
  };

  const clearAll = async () => {
    try {
      console.log('🗑️ Clearing all notifications');
      
      await notificationService.clearAll();
      
      setNotifications([]);
      setUnreadCount(0);
      
      console.log('✅ All notifications cleared');
    } catch (error) {
      console.error('❌ Failed to clear all notifications:', error);
      // Still update locally for better UX
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  const refreshNotifications = async () => {
    await loadNotifications();
  };

  const getUnreadNotifications = useCallback(() => {
    return notifications.filter(notif => !notif.is_read);
  }, [notifications]);

  // ✅ ADD: Get invitation-specific notifications
  const getInvitationNotifications = useCallback(() => {
    return notifications.filter(notif => notif.type === 'channel_invitation');
  }, [notifications]);

  const value = {
    // State
    notifications,
    unreadCount,
    loading,
    error,
    pendingInvitations,
    
    // Actions
    loadNotifications: refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    refreshNotifications,
    
    // Permissions
    requestNotificationPermission,
    
    // Utilities
    getUnreadNotifications,
    getInvitationNotifications,
    hasUnread: unreadCount > 0,
    
    // ✅ ADDED: Invitation methods
    loadPendingInvitations,
    getPendingInvitations,
    hasPendingInvitations,
    acceptInvitation,
    declineInvitation,
    refreshAll,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}