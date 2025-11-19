// services/chat/api.js - COMPLETE INTEGRATED VERSION
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:9000';

class ChatApiService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/api/chat`;
    this.pendingRequests = new Map();
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const requestKey = `${options.method || 'GET'}:${endpoint}:${JSON.stringify(options.body || '')}`;
    
    // Prevent duplicate requests
    if (this.pendingRequests.has(requestKey)) {
      console.log('⏳ Returning pending request for:', requestKey);
      return this.pendingRequests.get(requestKey);
    }
    
    console.log(`🌐 Chat API Request: ${endpoint}`, { 
      method: options.method || 'GET',
      endpoint,
      body: options.body ? JSON.parse(options.body) : null
    });

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const authHeader = await this.getOptimalAuthHeader();
    if (authHeader) {
      config.headers.Authorization = authHeader;
    }

    const requestPromise = (async () => {
      try {
        const response = await fetch(url, config);
        
        console.log(`📡 Chat API Response: ${response.status} ${response.statusText} for ${endpoint}`);

        if (response.status === 401) {
          throw new Error(`Authentication failed for ${endpoint}`);
        }

        if (response.status === 404) {
          console.error(`❌ Endpoint not found: ${endpoint}`);
          throw new Error(`Endpoint not found: ${endpoint}`);
        }

        if (response.status === 204) {
          return null;
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ API Error ${response.status}:`, errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log(`✅ Chat API Success: ${options.method || 'GET'} ${endpoint}`);
        return data;
      } catch (error) {
        console.error('Chat API request failed:', error);
        throw error;
      }
    })();

    this.pendingRequests.set(requestKey, requestPromise);
    
    try {
      const result = await requestPromise;
      return result;
    } finally {
      this.pendingRequests.delete(requestKey);
    }
  }

  async getOptimalAuthHeader() {
    const token = this.getToken();
    if (!token) {
      console.warn('⚠️ No token available for chat request');
      return null;
    }
    return `Bearer ${token}`;
  }

  getToken() {
    const tokens = [
      localStorage.getItem('access_token'),
      sessionStorage.getItem('access_token'),
      localStorage.getItem('chat_token')
    ];
    const token = tokens.find(t => t && t.length > 10);
    return token;
  }

  // =============================================================================
  // ORGANIZATION MEMBERS INTEGRATION FROM ZUSTAND STORE
  // =============================================================================

  /**
   * Get organization members from Zustand store
   * This integrates with your existing auth store members data
   */
  async getOrganizationMembers() {
    try {
      // First try to get from Zustand store if available
      const authStore = this.getAuthStore();
      if (authStore && authStore.members && authStore.members.length > 0) {
        console.log('📦 Using organization members from Zustand store');
        return authStore.members;
      }

      // Fallback to API call if Zustand store not available
      console.log('🔄 Fetching organization members from API');
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`${API_BASE_URL}/api/organizations/members/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch organization members: ${response.status}`);
      }

      const members = await response.json();
      console.log(`✅ Retrieved ${members.length} organization members`);
      return members;
    } catch (error) {
      console.error('❌ Failed to get organization members:', error);
      return [];
    }
  }

  /**
   * Get organization member by ID
   */
  async getOrganizationMember(userId) {
    try {
      const members = await this.getOrganizationMembers();
      const member = members.find(m => m.id === userId || m.user_id === userId);
      
      if (!member) {
        console.warn(`⚠️ Organization member ${userId} not found`);
        return {
          id: userId,
          display_name: 'Unknown User',
          email: 'unknown@example.com',
          role: 'member',
          is_active: false
        };
      }
      
      return member;
    } catch (error) {
      console.error(`❌ Failed to get organization member ${userId}:`, error);
      return {
        id: userId,
        display_name: 'Unknown User',
        email: 'unknown@example.com',
        role: 'member',
        is_active: false
      };
    }
  }

  /**
   * Get current user from organization members
   */
  async getCurrentOrganizationMember() {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      // Get current user info from token or profile endpoint
      const response = await fetch(`${API_BASE_URL}/api/auth/profile/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch current user profile');
      }

      const userProfile = await response.json();
      const members = await this.getOrganizationMembers();
      const currentMember = members.find(m => 
        m.id === userProfile.id || 
        m.user_id === userProfile.id ||
        m.email === userProfile.email
      );

      if (!currentMember) {
        console.warn('⚠️ Current user not found in organization members');
        return {
          id: userProfile.id,
          display_name: userProfile.display_name || userProfile.email,
          email: userProfile.email,
          role: 'member',
          is_active: true,
          profile_picture_url: userProfile.profile_picture_url
        };
      }

      return currentMember;
    } catch (error) {
      console.error('❌ Failed to get current organization member:', error);
      return null;
    }
  }

  /**
   * Helper method to get Zustand auth store
   */
  getAuthStore() {
    // This is a placeholder - you'll need to import your actual Zustand store
    // or access it through a global variable/window object
    if (typeof window !== 'undefined' && window.authStore) {
      return window.authStore;
    }
    
    // Try to import dynamically (adjust path as needed)
    try {
      const authStoreModule = require('../../store/authStore');
      return authStoreModule.useAuthStore?.getState?.();
    } catch (error) {
      console.log('⚠️ Zustand auth store not accessible in this context');
      return null;
    }
  }

  // =============================================================================
  // WORKSPACE METHODS - WITH ORGANIZATION MEMBERS INTEGRATION
  // =============================================================================

  async getWorkspaces() {
    try {
      const data = await this.request('/workspaces/');
      return data;
    } catch (error) {
      console.error('Failed to get workspaces:', error);
      return { results: [] };
    }
  }

  async getWorkspace(workspaceId) {
    try {
      const workspace = await this.request(`/workspaces/${workspaceId}/`);
      return workspace;
    } catch (error) {
      console.error(`Failed to get workspace ${workspaceId}:`, error);
      return { 
        id: workspaceId, 
        name: `Workspace ${workspaceId}`,
        description: 'Team workspace'
      };
    }
  }

  async getWorkspaceChannels(workspaceId) {
    try {
      const channels = await this.request(`/workspaces/${workspaceId}/channels/`);
      return channels;
    } catch (error) {
      console.error(`Failed to get workspace ${workspaceId} channels:`, error);
      return [];
    }
  }

  async getWorkspaceMembers(workspaceId) {
    try {
      // First try workspace-specific members
      const response = await this.request(`/workspaces/${workspaceId}/members/`);
      
      // If no workspace members found, fall back to organization members
      if (!response || response.length === 0) {
        console.log(`🔄 No workspace members found, using organization members for workspace ${workspaceId}`);
        return await this.getOrganizationMembers();
      }
      
      return response;
    } catch (error) {
      console.error(`Failed to get workspace ${workspaceId} members:`, error);
      
      // Fallback to organization members
      console.log(`🔄 Using organization members as fallback for workspace ${workspaceId}`);
      return await this.getOrganizationMembers();
    }
  }

  async inviteToWorkspace(workspaceId, email) {
    try {
      // First check if user exists in organization
      const orgMembers = await this.getOrganizationMembers();
      const existingMember = orgMembers.find(m => m.email === email);
      
      if (existingMember) {
        console.log(`✅ User ${email} already exists in organization, adding to workspace`);
        // User exists in organization, add to workspace
        const response = await this.request(`/workspaces/${workspaceId}/members/`, {
          method: 'POST',
          body: JSON.stringify({ user_id: existingMember.id })
        });
        return response;
      } else {
        // User doesn't exist, send invitation
        console.log(`📧 User ${email} not in organization, sending invitation`);
        const response = await this.request(`/workspaces/${workspaceId}/invite/`, {
          method: 'POST',
          body: JSON.stringify({ email })
        });
        return response;
      }
    } catch (error) {
      console.error(`Failed to invite to workspace ${workspaceId}:`, error);
      throw error;
    }
  }

  async removeMemberFromWorkspace(workspaceId, userId) {
    try {
      const response = await this.request(`/workspaces/${workspaceId}/members/${userId}/`, {
        method: 'DELETE',
      });
      return response;
    } catch (error) {
      console.error(`Failed to remove member from workspace ${workspaceId}:`, error);
      throw error;
    }
  }

  async updateMemberRole(workspaceId, userId, role) {
    try {
      const response = await this.request(`/workspaces/${workspaceId}/members/${userId}/`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });
      return response;
    } catch (error) {
      console.error(`Failed to update member role in workspace ${workspaceId}:`, error);
      throw error;
    }
  }

  // =============================================================================
  // ENHANCED CHANNEL METHODS WITH ORGANIZATION CONTEXT
  // =============================================================================

  async getChannels(workspaceId = null) {
    try {
      let endpoint = '/channels/';
      if (workspaceId) {
        endpoint = `/channels/?workspace=${workspaceId}`;
      }
      const data = await this.request(endpoint);
      return data;
    } catch (error) {
      console.error('Failed to get channels:', error);
      return [];
    }
  }

  async getChannel(channelId) {
    try {
      const channel = await this.request(`/channels/${channelId}/`);
      
      // Enhance channel data with organization context
      if (channel && channel.workspace) {
        const orgMembers = await this.getOrganizationMembers();
        channel.organization_members_count = orgMembers.length;
      }
      
      return channel;
    } catch (error) {
      console.error(`Failed to get channel ${channelId}:`, error);
      return { 
        id: parseInt(channelId), 
        name: `Channel ${channelId}`,
        description: 'Chat channel',
        channel_type: 'public',
        workspace: { id: 1, name: 'Default Workspace' }
      };
    }
  }

  async getChannelMessages(channelId, params = {}) {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const endpoint = queryParams 
        ? `/channels/${channelId}/messages/?${queryParams}`
        : `/channels/${channelId}/messages/`;
      
      console.log('📥 Fetching messages from endpoint:', endpoint);
      
      const response = await this.request(endpoint);
      
      // FIXED: Handle different response structures
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
      
      // Enhance messages with sender organization data
      const enhancedMessages = await Promise.all(
        messagesData.map(async (message) => {
          if (message.sender) {
            try {
              const orgMember = await this.getOrganizationMember(message.sender.id || message.sender);
              return {
                ...message,
                sender_organization_data: orgMember
              };
            } catch (error) {
              return message;
            }
          }
          return message;
        })
      );
      
      console.log(`✅ Retrieved ${enhancedMessages.length} enhanced messages for channel ${channelId}`);
      return enhancedMessages;
      
    } catch (error) {
      console.error(`Failed to get messages for channel ${channelId}:`, error);
      return [];
    }
  }

  // =============================================================================
  // CHANNEL CREATION & MANAGEMENT METHODS - CORRECTED
  // =============================================================================

  async createChannel(channelData) {
    try {
      console.log('🚀 Creating channel:', channelData);
      
      // CORRECTED: Match Django serializer field names exactly
      const payload = {
        name: channelData.name,
        topic: channelData.topic || '',
        purpose: channelData.purpose || '',
        channel_type: channelData.channel_type || 'public',
        workspace: channelData.workspace, // Must match Django field name
        is_private: channelData.is_private || false
      };

      // Validate required fields
      if (!payload.name) {
        throw new Error('Channel name is required');
      }
      if (!payload.workspace) {
        throw new Error('Workspace ID is required for channel creation');
      }

      console.log('📝 Channel creation payload:', payload);
      
      const response = await this.request('/channels/', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      
      console.log('✅ Channel created successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to create channel:', error);
      throw new Error(`Failed to create channel: ${error.message}`);
    }
  }

  async updateChannel(channelId, channelData) {
    try {
      console.log('✏️ Updating channel:', { channelId, channelData });
      
      // CORRECTED: Only include fields that can be updated
      const payload = {
        name: channelData.name,
        topic: channelData.topic,
        purpose: channelData.purpose,
        channel_type: channelData.channel_type,
        is_archived: channelData.is_archived
      };
      
      // Remove undefined fields
      Object.keys(payload).forEach(key => {
        if (payload[key] === undefined) {
          delete payload[key];
        }
      });
      
      const response = await this.request(`/channels/${channelId}/`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      
      console.log('✅ Channel updated successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to update channel:', error);
      throw new Error(`Failed to update channel: ${error.message}`);
    }
  }

  async deleteChannel(channelId) {
    try {
      console.log('🗑️ Deleting channel:', channelId);
      
      const response = await this.request(`/channels/${channelId}/`, {
        method: 'DELETE',
      });
      
      console.log('✅ Channel deleted successfully');
      return response;
    } catch (error) {
      console.error('❌ Failed to delete channel:', error);
      throw new Error(`Failed to delete channel: ${error.message}`);
    }
  }

  async joinChannel(channelId) {
    try {
      console.log('👥 Joining channel:', channelId);
      
      const response = await this.request(`/channels/${channelId}/join/`, {
        method: 'POST',
      });
      
      console.log('✅ Joined channel successfully');
      return response;
    } catch (error) {
      console.error('❌ Failed to join channel:', error);
      throw new Error(`Failed to join channel: ${error.message}`);
    }
  }

  async leaveChannel(channelId) {
    try {
      console.log('👋 Leaving channel:', channelId);
      
      const response = await this.request(`/channels/${channelId}/leave/`, {
        method: 'POST',
      });
      
      console.log('✅ Left channel successfully');
      return response;
    } catch (error) {
      console.error('❌ Failed to leave channel:', error);
      throw new Error(`Failed to leave channel: ${error.message}`);
    }
  }

  async archiveChannel(channelId) {
    try {
      console.log('📦 Archiving channel:', channelId);
      
      const response = await this.request(`/channels/${channelId}/archive/`, {
        method: 'POST',
      });
      
      console.log('✅ Channel archived successfully');
      return response;
    } catch (error) {
      console.error('❌ Failed to archive channel:', error);
      throw new Error(`Failed to archive channel: ${error.message}`);
    }
  }

  async unarchiveChannel(channelId) {
    try {
      console.log('📦 Unarchiving channel:', channelId);
      
      const response = await this.request(`/channels/${channelId}/unarchive/`, {
        method: 'POST',
      });
      
      console.log('✅ Channel unarchived successfully');
      return response;
    } catch (error) {
      console.error('❌ Failed to unarchive channel:', error);
      throw new Error(`Failed to unarchive channel: ${error.message}`);
    }
  }

  async getChannelMembers(channelId) {
    try {
      console.log('👥 Getting channel members:', channelId);
      
      const response = await this.request(`/channels/${channelId}/members/`);
      
      // Enhance member data with organization information
      if (response && Array.isArray(response)) {
        const enhancedMembers = await Promise.all(
          response.map(async (member) => {
            try {
              const orgMember = await this.getOrganizationMember(member.user_id || member.id);
              return {
                ...member,
                organization_data: orgMember
              };
            } catch (error) {
              return member;
            }
          })
        );
        
        console.log('✅ Retrieved enhanced channel members:', enhancedMembers);
        return enhancedMembers;
      }
      
      console.log('✅ Retrieved channel members:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to get channel members:', error);
      return { results: [] };
    }
  }

  async inviteToChannel(channelId, userIds) {
    try {
      console.log('📨 Inviting users to channel:', { channelId, userIds });
      
      // Verify users exist in organization before inviting
      const orgMembers = await this.getOrganizationMembers();
      const validUserIds = userIds.filter(userId => 
        orgMembers.some(member => member.id === userId || member.user_id === userId)
      );
      
      if (validUserIds.length !== userIds.length) {
        console.warn(`⚠️ Some users not found in organization. Inviting only valid users:`, validUserIds);
      }
      
      const response = await this.request(`/channels/${channelId}/invite/`, {
        method: 'POST',
        body: JSON.stringify({ user_ids: validUserIds }),
      });
      
      console.log('✅ Users invited successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to invite users:', error);
      throw new Error(`Failed to invite users: ${error.message}`);
    }
  }

  async getChannelStatistics(channelId) {
    try {
      console.log('📊 Getting channel statistics:', channelId);
      
      const response = await this.request(`/channels/${channelId}/statistics/`);
      
      console.log('✅ Retrieved channel statistics:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to get channel statistics:', error);
      return {
        total_messages: 0,
        total_members: 0,
        active_members: 0,
        messages_today: 0
      };
    }
  }

  async transferChannelOwnership(channelId, newOwnerId) {
    try {
      console.log('👑 Transferring channel ownership:', { channelId, newOwnerId });
      
      const response = await this.request(`/channels/${channelId}/transfer_ownership/`, {
        method: 'POST',
        body: JSON.stringify({ new_owner_id: newOwnerId }),
      });
      
      console.log('✅ Ownership transferred successfully');
      return response;
    } catch (error) {
      console.error('❌ Failed to transfer ownership:', error);
      throw new Error(`Failed to transfer ownership: ${error.message}`);
    }
  }

  async banUserFromChannel(channelId, userId, reason = '', durationDays = 7) {
    try {
      console.log('🚫 Banning user from channel:', { channelId, userId, reason, durationDays });
      
      const response = await this.request(`/channels/${channelId}/ban_user/`, {
        method: 'POST',
        body: JSON.stringify({ 
          user_id: userId, 
          reason, 
          duration_days: durationDays 
        }),
      });
      
      console.log('✅ User banned successfully');
      return response;
    } catch (error) {
      console.error('❌ Failed to ban user:', error);
      throw new Error(`Failed to ban user: ${error.message}`);
    }
  }

  async unbanUserFromChannel(channelId, userId) {
    try {
      console.log('✅ Unbanning user from channel:', { channelId, userId });
      
      const response = await this.request(`/channels/${channelId}/unban_user/`, {
        method: 'POST',
        body: JSON.stringify({ user_id: userId }),
      });
      
      console.log('✅ User unbanned successfully');
      return response;
    } catch (error) {
      console.error('❌ Failed to unban user:', error);
      throw new Error(`Failed to unban user: ${error.message}`);
    }
  }

  async getBannedUsers(channelId) {
    try {
      console.log('📋 Getting banned users for channel:', channelId);
      
      const response = await this.request(`/channels/${channelId}/banned_users/`);
      
      console.log('✅ Retrieved banned users:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to get banned users:', error);
      return { results: [] };
    }
  }

  async updateChannelMemberRole(channelId, userId, role) {
    try {
      console.log('👑 Updating member role:', { channelId, userId, role });
      
      const response = await this.request(`/channels/${channelId}/members/${userId}/`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });
      
      console.log('✅ Member role updated successfully');
      return response;
    } catch (error) {
      console.error('❌ Failed to update member role:', error);
      throw new Error(`Failed to update member role: ${error.message}`);
    }
  }

  async removeMemberFromChannel(channelId, userId) {
    try {
      console.log('👋 Removing member from channel:', { channelId, userId });
      
      const response = await this.request(`/channels/${channelId}/members/${userId}/`, {
        method: 'DELETE',
      });
      
      console.log('✅ Member removed successfully');
      return response;
    } catch (error) {
      console.error('❌ Failed to remove member:', error);
      throw new Error(`Failed to remove member: ${error.message}`);
    }
  }

  // =============================================================================
  // ENHANCED MESSAGE METHODS
  // =============================================================================

  async sendChannelMessage(channelId, content, messageType = 'text', replyTo = null) {
    try {
      console.log('📤 Sending message to channel:', { 
        channelId, 
        content, 
        messageType,
        replyTo 
      });
      
      // Get current user for enhanced message data
      const currentMember = await this.getCurrentOrganizationMember();
      
      const messageData = {
        channel: parseInt(channelId),
        content: content,
        message_type: messageType
      };
      
      if (replyTo) {
        messageData.reply_to = parseInt(replyTo);
      }
      
      // Add sender organization context if available
      if (currentMember) {
        messageData.sender_organization_context = {
          user_id: currentMember.id,
          display_name: currentMember.display_name,
          role: currentMember.role
        };
      }
      
      console.log('📝 Enhanced message data:', messageData);
      
      const response = await this.request('/messages/', {
        method: 'POST',
        body: JSON.stringify(messageData),
      });
      
      console.log('✅ Message sent successfully:', response);
      return response;

    } catch (error) {
      console.error('❌ Failed to send message:', error);
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  async sendMessage(data) {
    try {
      console.log('📤 Sending generic message:', data);
      const response = await this.request('/messages/', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response;
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      throw error;
    }
  }

  async replyToMessage(messageId, content, messageType = 'text') {
    try {
      console.log('↪️ Replying to message:', { messageId, content });
      
      const response = await this.request(`/messages/${messageId}/reply/`, {
        method: 'POST',
        body: JSON.stringify({ 
          content: content,
          message_type: messageType 
        }),
      });
      
      console.log('✅ Reply sent successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to send reply:', error);
      throw new Error(`Failed to send reply: ${error.message}`);
    }
  }

  async editMessage(messageId, content) {
    try {
      console.log('✏️ Editing message:', { messageId, content });
      const response = await this.request(`/messages/${messageId}/`, {
        method: 'PATCH',
        body: JSON.stringify({ content }),
      });
      return response;
    } catch (error) {
      console.error('❌ Failed to edit message:', error);
      throw error;
    }
  }

  async deleteMessage(messageId) {
    try {
      console.log('🗑️ Deleting message:', messageId);
      const response = await this.request(`/messages/${messageId}/`, {
        method: 'DELETE',
      });
      return response;
    } catch (error) {
      console.error('❌ Failed to delete message:', error);
      throw error;
    }
  }

  // =============================================================================
  // REACTION METHODS
  // =============================================================================

  async reactToMessage(messageId, reactionType) {
    try {
      console.log('💖 Reacting to message:', { messageId, reactionType });
      const response = await this.request(`/messages/${messageId}/react/`, {
        method: 'POST',
        body: JSON.stringify({ reaction_type: reactionType }),
      });
      return response;
    } catch (error) {
      console.error('❌ Reaction failed:', error);
      throw error;
    }
  }

  async removeReaction(messageId, reactionType) {
    try {
      console.log('🗑️ Removing reaction:', { messageId, reactionType });
      const response = await this.request(`/messages/${messageId}/react/`, {
        method: 'DELETE',
        body: JSON.stringify({ reaction_type: reactionType }),
      });
      return response;
    } catch (error) {
      console.error('❌ Remove reaction failed:', error);
      throw error;
    }
  }

  async getMessageReactions(messageId) {
    try {
      console.log('📊 Getting reactions for message:', messageId);
      const response = await this.request(`/messages/${messageId}/reactions/`);
      return response;
    } catch (error) {
      console.error('❌ Get reactions failed:', error);
      return { results: [] };
    }
  }

  getReactionTypeFromEmoji(emoji) {
    const reactionMap = {
      '👍': 'like',
      '❤️': 'love',
      '😂': 'laugh', 
      '😮': 'wow',
      '😢': 'sad',
      '😠': 'angry'
    };
    return reactionMap[emoji] || 'like';
  }

  getReactionEmoji(reactionType) {
    const emojiMap = {
      'like': '👍',
      'love': '❤️', 
      'laugh': '😂',
      'wow': '😮',
      'sad': '😢',
      'angry': '😠'
    };
    return emojiMap[reactionType] || reactionType;
  }

  // =============================================================================
  // PIN MESSAGE METHODS
  // =============================================================================

  async pinMessage(messageId) {
    try {
      console.log('📌 Pinning message:', messageId);
      const response = await this.request(`/messages/${messageId}/pin/`, {
        method: 'POST',
      });
      return response;
    } catch (error) {
      console.error('❌ Failed to pin message:', error);
      throw error;
    }
  }

  async unpinMessage(messageId) {
    try {
      console.log('📌 Unpinning message:', messageId);
      const response = await this.request(`/messages/${messageId}/unpin/`, {
        method: 'POST',
      });
      return response;
    } catch (error) {
      console.error('❌ Failed to unpin message:', error);
      throw error;
    }
  }

  async getPinnedMessages(channelId) {
    try {
      console.log('📌 Fetching pinned messages for channel:', channelId);
      const response = await this.request(`/channels/${channelId}/pinned-messages/`);
      return response;
    } catch (error) {
      console.error('❌ Failed to fetch pinned messages:', error);
      return { results: [] };
    }
  }

  // =============================================================================
  // DIRECT MESSAGE METHODS
  // =============================================================================

  async getDirectMessages() {
    try {
      const data = await this.request('/direct-messages/');
      return data || [];
    } catch (error) {
      console.error('Failed to get direct messages:', error);
      return [];
    }
  }

  async startDirectMessage(userId) {
    try {
      const dm = await this.request('/direct-messages/start/', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId }),
      });
      return dm;
    } catch (error) {
      console.error('Failed to start direct message:', error);
      return { 
        id: `dm-${userId}`, 
        other_user: { 
          id: userId, 
          email: 'user@example.com',
          display_name: 'User'
        }
      };
    }
  }

  async getDMMessages(dmId, params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = queryParams 
      ? `/direct-messages/${dmId}/messages/?${queryParams}`
      : `/direct-messages/${dmId}/messages/`;
    
    try {
      const messages = await this.request(endpoint);
      return messages || [];
    } catch (error) {
      console.error(`Failed to get DM messages for ${dmId}:`, error);
      return [];
    }
  }

  async sendDMMessage(dmId, content, messageType = 'text') {
    try {
      const response = await this.request(`/direct-messages/${dmId}/message/`, {
        method: 'POST',
        body: JSON.stringify({ content, message_type: messageType }),
      });
      return response;
    } catch (error) {
      console.error('Failed to send DM message:', error);
      throw error;
    }
  }

  // =============================================================================
  // ROOM METHODS
  // =============================================================================

  async getRooms() {
    try {
      const data = await this.request('/rooms/');
      return data || [];
    } catch (error) {
      console.error('Failed to get rooms:', error);
      return [];
    }
  }

  async getRoomMessages(roomId, params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = queryParams 
      ? `/rooms/${roomId}/messages/?${queryParams}`
      : `/rooms/${roomId}/messages/`;
    
    try {
      const messages = await this.request(endpoint);
      return messages || [];
    } catch (error) {
      console.error(`Failed to get room messages for ${roomId}:`, error);
      return [];
    }
  }

  // =============================================================================
  // FILE UPLOAD METHODS
  // =============================================================================

  async uploadFile(file, channelId = null, description = '') {
    try {
      console.log('📤 Uploading file:', { 
        fileName: file.name, 
        fileType: file.type, 
        fileSize: file.size,
        channelId 
      });

      const formData = new FormData();
      formData.append('file', file);
      
      if (channelId) {
        formData.append('channel_id', channelId);
      }
      
      if (description) {
        formData.append('description', description);
      }

      const url = `${this.baseURL}/upload/`;
      const token = this.getToken();
      
      const config = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      };

      console.log('🚀 File upload request:', {
        url,
        fileName: file.name,
        channelId,
        fileSize: file.size
      });

      const response = await fetch(url, config);
      
      console.log('📡 File upload response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ File upload error response:', errorText);
        throw new Error(`File upload error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ File upload successful:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Chat file upload failed:', error);
      throw new Error(`File upload failed: ${error.message}`);
    }
  }

  // =============================================================================
  // ORGANIZATION-LEVEL CHAT MANAGEMENT
  // =============================================================================

  /**
   * Get all organization members available for chat
   */
  async getAvailableChatMembers() {
    try {
      const orgMembers = await this.getOrganizationMembers();
      
      // Filter active members and enhance with chat availability
      const availableMembers = orgMembers
        .filter(member => member.is_active !== false)
        .map(member => ({
          ...member,
          can_chat: true,
          last_seen: new Date().toISOString(),
          chat_status: 'available'
        }));
      
      console.log(`✅ Found ${availableMembers.length} available chat members`);
      return availableMembers;
    } catch (error) {
      console.error('❌ Failed to get available chat members:', error);
      return [];
    }
  }

  /**
   * Search organization members for chat
   */
  async searchChatMembers(query) {
    try {
      const members = await this.getAvailableChatMembers();
      const searchTerm = query.toLowerCase();
      
      const results = members.filter(member => 
        member.display_name?.toLowerCase().includes(searchTerm) ||
        member.email?.toLowerCase().includes(searchTerm) ||
        member.role?.toLowerCase().includes(searchTerm)
      );
      
      console.log(`🔍 Found ${results.length} members matching "${query}"`);
      return results;
    } catch (error) {
      console.error('❌ Failed to search chat members:', error);
      return [];
    }
  }

  /**
   * Get member chat preferences and settings
   */
  async getMemberChatSettings(userId) {
    try {
      const member = await this.getOrganizationMember(userId);
      
      return {
        user_id: userId,
        display_name: member.display_name,
        email: member.email,
        role: member.role,
        chat_preferences: {
          allow_direct_messages: true,
          notification_enabled: true,
          status_visibility: 'organization',
          typing_indicators: true,
          read_receipts: true
        },
        current_status: 'online',
        last_active: new Date().toISOString()
      };
    } catch (error) {
      console.error(`❌ Failed to get chat settings for member ${userId}:`, error);
      return null;
    }
  }

  // =============================================================================
  // FALLBACK DATA
  // =============================================================================

  getFallbackData(endpoint) {
    const fallbacks = {
      '/workspaces/': {
        count: 0,
        results: []
      },
      '/channels/': [],
      '/rooms/': [],
      '/direct-messages/': [],
      '/health/': { status: 'ok', mode: 'fallback' }
    };
    
    if (endpoint.startsWith('/workspaces/') && endpoint !== '/workspaces/') {
      const workspaceId = endpoint.split('/').filter(Boolean)[1];
      return {
        id: workspaceId,
        name: `Workspace ${workspaceId}`,
        description: 'Team workspace'
      };
    }
    
    return fallbacks[endpoint] || null;
  }

  // =============================================================================
  // DEBUG METHODS
  // =============================================================================

  async debugEndpoints() {
    const testEndpoints = [
      '/workspaces/',
      '/channels/',
      '/messages/',
      '/direct-messages/',
      '/upload/',
      '/health/'
    ];
    
    console.log('🔍 Testing API endpoints...');
    
    for (const endpoint of testEndpoints) {
      try {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
          headers: { 'Authorization': `Bearer ${this.getToken()}` }
        });
        console.log(`🔍 ${endpoint}: ${response.status}`);
      } catch (error) {
        console.error(`🔍 ${endpoint}: ERROR`, error);
      }
    }
  }
}

// Create singleton instance
const chatApiService = new ChatApiService();

// Export ALL services with enhanced organization integration
export const workspaceService = {
  // Basic workspace operations
  getWorkspaces: () => chatApiService.getWorkspaces(),
  getWorkspace: (id) => chatApiService.getWorkspace(id),
  getWorkspaceChannels: (workspaceId) => chatApiService.getWorkspaceChannels(workspaceId),
  
  // Workspace member management with organization integration
  getWorkspaceMembers: (workspaceId) => chatApiService.getWorkspaceMembers(workspaceId),
  inviteToWorkspace: (workspaceId, email) => chatApiService.inviteToWorkspace(workspaceId, email),
  removeMemberFromWorkspace: (workspaceId, userId) => chatApiService.removeMemberFromWorkspace(workspaceId, userId),
  updateMemberRole: (workspaceId, userId, role) => chatApiService.updateMemberRole(workspaceId, userId, role),
  
  // Organization members integration
  getOrganizationMembers: () => chatApiService.getOrganizationMembers(),
  getOrganizationMember: (userId) => chatApiService.getOrganizationMember(userId),
  getCurrentOrganizationMember: () => chatApiService.getCurrentOrganizationMember(),
  getAvailableChatMembers: () => chatApiService.getAvailableChatMembers(),
  searchChatMembers: (query) => chatApiService.searchChatMembers(query),
  getMemberChatSettings: (userId) => chatApiService.getMemberChatSettings(userId)
};

export const channelService = {
  // Basic channel operations
  getChannels: (workspaceId) => chatApiService.getChannels(workspaceId),
  getChannel: (id) => chatApiService.getChannel(id),
  getChannelMessages: (id, params) => chatApiService.getChannelMessages(id, params),
  sendChannelMessage: (channelId, content, messageType, replyTo) => chatApiService.sendChannelMessage(channelId, content, messageType, replyTo),
  
  // Channel creation & management - CORRECTED
  createChannel: (channelData) => chatApiService.createChannel(channelData),
  updateChannel: (channelId, channelData) => chatApiService.updateChannel(channelId, channelData),
  deleteChannel: (channelId) => chatApiService.deleteChannel(channelId),
  
  // Channel membership
  joinChannel: (channelId) => chatApiService.joinChannel(channelId),
  leaveChannel: (channelId) => chatApiService.leaveChannel(channelId),
  getChannelMembers: (channelId) => chatApiService.getChannelMembers(channelId),
  inviteToChannel: (channelId, userIds) => chatApiService.inviteToChannel(channelId, userIds),
  updateChannelMemberRole: (channelId, userId, role) => chatApiService.updateChannelMemberRole(channelId, userId, role),
  removeMemberFromChannel: (channelId, userId) => chatApiService.removeMemberFromChannel(channelId, userId),
  
  // Channel administration
  archiveChannel: (channelId) => chatApiService.archiveChannel(channelId),
  unarchiveChannel: (channelId) => chatApiService.unarchiveChannel(channelId),
  getChannelStatistics: (channelId) => chatApiService.getChannelStatistics(channelId),
  transferChannelOwnership: (channelId, newOwnerId) => chatApiService.transferChannelOwnership(channelId, newOwnerId),
  
  // Channel moderation
  banUserFromChannel: (channelId, userId, reason, durationDays) => chatApiService.banUserFromChannel(channelId, userId, reason, durationDays),
  unbanUserFromChannel: (channelId, userId) => chatApiService.unbanUserFromChannel(channelId, userId),
  getBannedUsers: (channelId) => chatApiService.getBannedUsers(channelId)
};

export const roomService = {
  getRooms: () => chatApiService.getRooms(),
  getRoomMessages: (id, params) => chatApiService.getRoomMessages(id, params)
};

export const dmService = {
  getDirectMessages: () => chatApiService.getDirectMessages(),
  startDirectMessage: (userId) => chatApiService.startDirectMessage(userId),
  getDMMessages: (dmId, params) => chatApiService.getDMMessages(dmId, params),
  sendDMMessage: (dmId, content) => chatApiService.sendDMMessage(dmId, content)
};

export const messageService = {
  // Core message methods
  sendMessage: (data) => chatApiService.sendMessage(data),
  sendChannelMessage: (channelId, content, messageType, replyTo) => chatApiService.sendChannelMessage(channelId, content, messageType, replyTo),
  replyToMessage: (messageId, content) => chatApiService.replyToMessage(messageId, content),
  editMessage: (messageId, content) => chatApiService.editMessage(messageId, content),
  deleteMessage: (messageId) => chatApiService.deleteMessage(messageId),
  
  // Reaction methods
  reactToMessage: (messageId, reactionType) => chatApiService.reactToMessage(messageId, reactionType),
  removeReaction: (messageId, reactionType) => chatApiService.removeReaction(messageId, reactionType),
  getMessageReactions: (messageId) => chatApiService.getMessageReactions(messageId),
  getReactionTypeFromEmoji: (emoji) => chatApiService.getReactionTypeFromEmoji(emoji),
  getReactionEmoji: (reactionType) => chatApiService.getReactionEmoji(reactionType),
  
  // Pin methods
  pinMessage: (messageId) => chatApiService.pinMessage(messageId),
  unpinMessage: (messageId) => chatApiService.unpinMessage(messageId),
  getPinnedMessages: (channelId) => chatApiService.getPinnedMessages(channelId),
  
  // File methods
  uploadFile: (file, channelId, description) => chatApiService.uploadFile(file, channelId, description)
};

export const fileService = {
  uploadFile: (file, channelId, description) => chatApiService.uploadFile(file, channelId, description)
};

// Export debug methods
export const debugService = {
  debugEndpoints: () => chatApiService.debugEndpoints()
};

export default chatApiService;