// services/chat/api.js - COMPLETE FULL VERSION WITH BURN USER
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
  // BURN USER FUNCTIONALITY - ADDED METHODS
  // =============================================================================

  // =============================================================================
// BURN USER FUNCTIONALITY - ADDED METHODS
// =============================================================================

async burnUserFromChannel(channelId, userId) {
  try {
    console.log('🔥 Burning user from channel:', { channelId, userId });
    
    const response = await this.request(`/channels/${channelId}/burn_user/`, {
      method: 'POST', // Changed from DELETE to POST to match your Django view
      body: JSON.stringify({ user_id: userId }),
    });
    
    console.log('✅ User burned from channel successfully');
    return response;
  } catch (error) {
    console.error('❌ Failed to burn user from channel:', error);
    throw new Error(`Failed to remove user from channel: ${error.message}`);
  }
}

async burnUserFromWorkspace(workspaceId, userId) {
  try {
    console.log('🔥 Burning user from workspace:', { workspaceId, userId });
    
    const response = await this.request(`/workspaces/${workspaceId}/burn_user/`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    });
    
    console.log('✅ User burned from workspace successfully');
    return response;
  } catch (error) {
    console.error('❌ Failed to burn user from workspace:', error);
    throw new Error(`Failed to remove user from workspace: ${error.message}`);
  }
}

  async burnUserFromWorkspace(workspaceId, userId) {
    try {
      console.log('🔥 Burning user from workspace:', { workspaceId, userId });
      
      const response = await this.request(`/workspaces/${workspaceId}/burn_user/`, {
        method: 'POST',
        body: JSON.stringify({ user_id: userId }),
      });
      
      console.log('✅ User burned from workspace successfully');
      return response;
    } catch (error) {
      console.error('❌ Failed to burn user from workspace:', error);
      throw new Error(`Failed to remove user from workspace: ${error.message}`);
    }
  }

  // =============================================================================
  // ORGANIZATION MEMBERS INTEGRATION FROM ZUSTAND STORE
  // =============================================================================

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

  getAuthStore() {
    if (typeof window !== 'undefined' && window.authStore) {
      return window.authStore;
    }
    
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
      const response = await this.request(`/workspaces/${workspaceId}/members/`);
      
      if (!response || response.length === 0) {
        console.log(`🔄 No workspace members found, using organization members for workspace ${workspaceId}`);
        return await this.getOrganizationMembers();
      }
      
      return response;
    } catch (error) {
      console.error(`Failed to get workspace ${workspaceId} members:`, error);
      console.log(`🔄 Using organization members as fallback for workspace ${workspaceId}`);
      return await this.getOrganizationMembers();
    }
  }

  async inviteToWorkspace(workspaceId, inviteData) {
    try {
      console.log('📧 Inviting to workspace:', { workspaceId, inviteData });
      
      const emailList = Array.isArray(inviteData) ? inviteData : (inviteData.emails || [inviteData]);
      
      // Set default expiration (7 days from now)
      const expiresAt = inviteData.expires_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const response = await this.request(`/workspaces/${workspaceId}/invite/`, {
        method: 'POST',
        body: JSON.stringify({ 
          emails: emailList,
          expires_at: expiresAt
        }),
      });
      
      console.log('✅ Workspace invitation sent:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to invite to workspace:', error);
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

  async getWorkspaceInvitations(workspaceId) {
    try {
      console.log('📥 Getting workspace invitations:', workspaceId);
      
      const response = await this.request(`/workspaces/${workspaceId}/invitations/`);
      
      console.log('✅ Retrieved workspace invitations:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to get workspace invitations:', error);
      return [];
    }
  }

  async cancelWorkspaceInvitation(workspaceId, invitationId) {
    try {
      console.log('❌ Cancelling workspace invitation:', { workspaceId, invitationId });
      
      const response = await this.request(`/workspaces/${workspaceId}/cancel_invitation/`, {
        method: 'POST',
        body: JSON.stringify({ invitation_id: invitationId }),
      });
      
      console.log('✅ Workspace invitation cancelled');
      return response;
    } catch (error) {
      console.error('❌ Failed to cancel workspace invitation:', error);
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

  async createChannel(channelData) {
    try {
      console.log('🚀 Creating channel:', channelData);
      
      const payload = {
        name: channelData.name,
        topic: channelData.topic || '',
        purpose: channelData.purpose || '',
        channel_type: channelData.channel_type || 'public',
        workspace: channelData.workspace
      };

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
      
      const payload = {
        name: channelData.name,
        topic: channelData.topic,
        purpose: channelData.purpose,
        channel_type: channelData.channel_type,
        is_archived: channelData.is_archived
      };
      
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
        body: JSON.stringify({}),
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
        body: JSON.stringify({}),
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

  // In the main ChatApiService class - FIXED VERSION
  async inviteToChannel(channelId, userIds) {
    try {
      console.log('📨 Inviting users to channel:', { channelId, userIds });
      
      // Handle both array and object format
      const userArray = Array.isArray(userIds) ? userIds : (userIds.user_ids || []);
      
      console.log('👥 User IDs to invite:', userArray);
      
      // Get organization members to validate
      const orgMembers = await this.getOrganizationMembers();
      console.log('🏢 Organization members for validation:', orgMembers);
      
      // Check if we need to map user IDs or if they're already valid
      const validUserIds = userArray.filter(userId => {
        // Check if userId exists in organization members by any identifier
        const isValid = orgMembers.some(member => 
          member.id === userId || 
          member.user_id === userId ||
          member.email === userId ||
          (member.user && member.user.id === userId)
        );
        
        if (!isValid) {
          console.warn(`⚠️ User ${userId} not found in organization members`);
        }
        
        return isValid;
      });
      
      console.log('✅ Valid user IDs after filtering:', validUserIds);
      
      if (validUserIds.length === 0) {
        console.warn('⚠️ No valid user IDs found after filtering');
        // Still send the request with original IDs - let the backend handle validation
        console.log('🔄 Sending original user IDs to backend for validation');
      }
      
      const finalUserIds = validUserIds.length > 0 ? validUserIds : userArray;
      
      const response = await this.request(`/channels/${channelId}/invite/`, {
        method: 'POST',
        body: JSON.stringify({ user_ids: finalUserIds }),
      });
      
      console.log('✅ Users invited successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to invite users:', error);
      throw new Error(`Failed to invite users: ${error.message}`);
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

  async getChannelInviteSuggestions(channelId, searchQuery = '') {
    try {
      console.log('🔍 Getting channel invite suggestions:', { channelId, searchQuery });
      
      const endpoint = searchQuery 
        ? `/channels/${channelId}/invite_suggestions/?search=${encodeURIComponent(searchQuery)}`
        : `/channels/${channelId}/invite_suggestions/`;
      
      const response = await this.request(endpoint);
      
      console.log('✅ Retrieved channel invite suggestions:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to get channel invite suggestions:', error);
      return [];
    }
  }

  // =============================================================================
  // ENHANCED MESSAGE METHODS - CORRECTED FOR DJANGO SERIALIZERS
  // =============================================================================

  async sendChannelMessage(channelId, content, messageType = 'text', replyTo = null) {
    try {
      console.log('📤 Sending message to channel:', { 
        channelId, 
        content, 
        messageType,
        replyTo 
      });
      
      const messageData = {
        channel: parseInt(channelId),
        content: content,
        message_type: messageType
      };
      
      if (replyTo) {
        messageData.reply_to = parseInt(replyTo);
      }
      
      console.log('📝 Final message data for Django:', messageData);
      
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
      
      const validatedData = {
        content: data.content,
        message_type: data.message_type || 'text',
        room: data.room || null,
        channel: data.channel || null,
        direct_message: data.direct_message || null,
        reply_to: data.reply_to || null
      };
      
      Object.keys(validatedData).forEach(key => {
        if (validatedData[key] === null) {
          delete validatedData[key];
        }
      });
      
      const response = await this.request('/messages/', {
        method: 'POST',
        body: JSON.stringify(validatedData),
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
      const response = await this.request(`/messages/${messageId}/remove_reaction/`, {
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
  // DIRECT MESSAGE METHODS - CORRECTED FOR DJANGO VIEWS
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

  async startDirectMessage(userId, workspaceId = null) {
    try {
      const payload = { user_id: userId };
      if (workspaceId) {
        payload.workspace = workspaceId;
      }
      
      const dm = await this.request('/direct-messages/start/', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return dm;
    } catch (error) {
      console.error('Failed to start direct message:', error);
      throw error;
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

  // FIXED: Correct DM message sending
  async sendDMMessage(dmId, content, messageType = 'text') {
    try {
      console.log('📤 Sending DM message:', { dmId, content, messageType });
      
      // OPTION 1: Use the general messages endpoint with direct_message context
      const response = await this.request('/messages/', {
        method: 'POST',
        body: JSON.stringify({
          direct_message: parseInt(dmId), // This is the key field
          content: content,
          message_type: messageType
        }),
      });
      
      console.log('✅ DM message sent successfully:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Failed to send DM message:', error);
      
      // OPTION 2: Fallback to DM-specific endpoint with different payload
      try {
        console.log('🔄 Trying DM-specific endpoint as fallback');
        const fallbackResponse = await this.request(`/direct-messages/${dmId}/send_message/`, {
          method: 'POST',
          body: JSON.stringify({ 
            content, 
            message_type: messageType,
            // Try adding direct_message field here too
            direct_message: parseInt(dmId)
          }),
        });
        return fallbackResponse;
      } catch (fallbackError) {
        console.error('❌ Fallback method also failed:', fallbackError);
        throw error; // Throw original error
      }
    }
  }

  async startDirectMessageWithWorkspace(workspaceId, userId) {
    try {
      console.log('🚀 Starting DM with workspace context:', { workspaceId, userId });
      
      const response = await this.request('/direct-messages/start_with_workspace/', {
        method: 'POST',
        body: JSON.stringify({
          workspace: workspaceId,
          user_id: userId
        }),
      });
      
      console.log('✅ DM started with workspace:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to start DM with workspace:', error);
      throw error;
    }
  }

  async getWorkspaceDMs(workspaceId) {
    try {
      console.log('📥 Fetching workspace DMs:', workspaceId);
      
      const response = await this.request(`/direct-messages/workspace_dms/?workspace_id=${workspaceId}`);
      
      console.log(`✅ Retrieved ${response.length} workspace DMs`);
      return response;
    } catch (error) {
      console.error('❌ Failed to get workspace DMs:', error);
      return [];
    }
  }

  async markDMAsRead(dmId) {
    try {
      console.log('📖 Marking DM as read:', dmId);
      
      const response = await this.request(`/direct-messages/${dmId}/mark_read/`, {
        method: 'POST',
      });
      
      console.log('✅ DM marked as read:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to mark DM as read:', error);
      throw error;
    }
  }

  async getDMStatistics(dmId) {
    try {
      console.log('📊 Getting DM statistics:', dmId);
      
      const response = await this.request(`/direct-messages/${dmId}/statistics/`);
      
      console.log('✅ DM statistics:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to get DM statistics:', error);
      return null;
    }
  }

  async searchDMMessages(dmId, query) {
    try {
      console.log('🔍 Searching DM messages:', { dmId, query });
      
      const response = await this.request(`/direct-messages/${dmId}/search/?q=${encodeURIComponent(query)}`);
      
      console.log(`✅ Found ${response.length} search results`);
      return response;
    } catch (error) {
      console.error('❌ Failed to search DM messages:', error);
      return [];
    }
  }

  async uploadDMFile(dmId, file) {
    try {
      console.log('📤 Uploading file to DM:', { dmId, fileName: file.name });
      
      const formData = new FormData();
      formData.append('file', file);
      
      const url = `${this.baseURL}/direct-messages/${dmId}/upload_file/`;
      const token = this.getToken();
      
      const config = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      };
      
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ DM file uploaded successfully:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Failed to upload DM file:', error);
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

  async getAvailableChatMembers() {
    try {
      const orgMembers = await this.getOrganizationMembers();
      
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
  // PUSH NOTIFICATION METHODS
  // =============================================================================

  async registerDevice(deviceData) {
    return this.request('/user-devices/', {
      method: 'POST',
      body: JSON.stringify(deviceData)
    });
  }

  async getUserDevices() {
    return this.request('/user-devices/');
  }

  async deactivateDevice(deviceId) {
    return this.request(`/user-devices/${deviceId}/deactivate/`, {
      method: 'POST'
    });
  }

  async getNotifications() {
    return this.request('/push-notifications/');
  }

  async getNotification(notificationId) {
    return this.request(`/push-notifications/${notificationId}/`);
  }

  async markNotificationRead(notificationId) {
    return this.request(`/push-notifications/${notificationId}/mark_read/`, {
      method: 'POST'
    });
  }

  async markAllNotificationsRead() {
    return this.request('/push-notifications/mark_all_read/', {
      method: 'POST'
    });
  }

  async getUnreadCount() {
    return this.request('/push-notifications/unread_count/');
  }

  async getNotificationPreferences() {
    return this.request('/notification-preferences/');
  }

  async updateNotificationPreference(preferenceData) {
    return this.request('/notification-preferences/', {
      method: 'POST',
      body: JSON.stringify(preferenceData)
    });
  }

  async getMyPreferences() {
    return this.request('/notification-preferences/my_preferences/');
  }

  async getFCMConfig() {
    return this.request('/fcm-config/');
  }

  // =============================================================================
  // SEARCH METHODS
  // =============================================================================

  async searchMessages(query, filters = {}) {
    return this.request('/search/messages/', {
      method: 'POST',
      body: JSON.stringify({ query, ...filters })
    });
  }

  async globalSearch(query) {
    return this.request(`/search/global/?q=${encodeURIComponent(query)}`);
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  async getHealth() {
    return this.request('/health/');
  }

  async getWebSocketToken() {
    return this.request('/websocket/token/');
  }

  async testDMEndpoints() {
    const testEndpoints = [
      '/direct-messages/',
      '/direct-messages/start/',
      '/direct-messages/1/messages/',
      '/direct-messages/1/send_message/',
      '/direct-messages/start_with_workspace/',
      '/direct-messages/workspace_dms/',
      '/messages/'
    ];
    
    console.log('🔍 Testing DM endpoints...');
    
    for (const endpoint of testEndpoints) {
      try {
        const method = endpoint.includes('start') || endpoint.includes('send_message') ? 'POST' : 'GET';
        const options = method === 'POST' ? { 
          method: 'POST', 
          body: JSON.stringify({ user_id: 1, content: 'test' }) 
        } : {};
        
        await this.request(endpoint, options);
        console.log(`✅ ${endpoint}: ACCESSIBLE`);
      } catch (error) {
        console.log(`❌ ${endpoint}: ${error.message}`);
      }
    }
  }

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
}



// Create singleton instance
const chatApiService = new ChatApiService();

// =============================================================================
// COMPREHENSIVE SERVICE EXPORTS - ALL FEATURES WITH BURN USER
// =============================================================================

// Workspace Service - UPDATED WITH BURN USER
// In services/chat/api.js - Add these methods to the workspaceService export

// Workspace Service - UPDATED WITH DELETE/RESTORE METHODS
export const workspaceService = {
  // Basic workspace operations
  getWorkspaces: () => chatApiService.getWorkspaces(),
  getWorkspace: (id) => chatApiService.getWorkspace(id),
  getWorkspaceChannels: (workspaceId) => chatApiService.getWorkspaceChannels(workspaceId),

  createWorkspace: async (workspaceData) => {
    try {
      console.log('🚀 Creating workspace:', workspaceData);
      
      const response = await chatApiService.request('/workspaces/', {
        method: 'POST',
        body: JSON.stringify(workspaceData),
      });
      
      console.log('✅ Workspace created successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to create workspace:', error);
      
      // Provide more specific error messages
      if (error.message.includes('400')) {
        throw new Error('Invalid workspace data. Please check the name and subdomain.');
      } else if (error.message.includes('409')) {
        throw new Error('A workspace with this name or subdomain already exists.');
      } else {
        throw new Error(`Failed to create workspace: ${error.message}`);
      }
    }
  },
  
  // 🆕 ADDED: Delete workspace method
  deleteWorkspace: async (workspaceId) => {
    try {
      console.log('🗑️ Deleting workspace:', workspaceId);
      
      const response = await chatApiService.request(`/workspaces/${workspaceId}/delete_workspace/`, {
        method: 'DELETE',
      });
      
      console.log('✅ Workspace deleted successfully');
      return response;
    } catch (error) {
      console.error('❌ Failed to delete workspace:', error);
      throw new Error(`Failed to delete workspace: ${error.message}`);
    }
  },

  // 🆕 ADDED: Restore workspace method
  restoreWorkspace: async (workspaceId) => {
    try {
      console.log('🔄 Restoring workspace:', workspaceId);
      
      const response = await chatApiService.request(`/workspaces/${workspaceId}/restore_workspace/`, {
        method: 'POST',
      });
      
      console.log('✅ Workspace restored successfully');
      return response;
    } catch (error) {
      console.error('❌ Failed to restore workspace:', error);
      throw new Error(`Failed to restore workspace: ${error.message}`);
    }
  },
  
  // Workspace member management
  getWorkspaceMembers: (workspaceId) => chatApiService.getWorkspaceMembers(workspaceId),
  removeMemberFromWorkspace: (workspaceId, userId) => chatApiService.removeMemberFromWorkspace(workspaceId, userId),
  updateMemberRole: (workspaceId, userId, role) => chatApiService.updateMemberRole(workspaceId, userId, role),
  
  // 🔥 BURN USER FUNCTIONALITY - ADDED
  burnUserFromWorkspace: (workspaceId, userId) => chatApiService.burnUserFromWorkspace(workspaceId, userId),
  
  // Organization members integration
  getOrganizationMembers: () => chatApiService.getOrganizationMembers(),
  getOrganizationMember: (userId) => chatApiService.getOrganizationMember(userId),
  getCurrentOrganizationMember: () => chatApiService.getCurrentOrganizationMember(),
  getAvailableChatMembers: () => chatApiService.getAvailableChatMembers(),
  searchChatMembers: (query) => chatApiService.searchChatMembers(query),
  getMemberChatSettings: (userId) => chatApiService.getMemberChatSettings(userId),
  
  // Invitation methods - FIXED: Use the instance method
  inviteToWorkspace: (workspaceId, emails) => chatApiService.inviteToWorkspace(workspaceId, emails),
  getWorkspaceInvitations: (workspaceId) => chatApiService.getWorkspaceInvitations(workspaceId),
  cancelWorkspaceInvitation: (workspaceId, invitationId) => chatApiService.cancelWorkspaceInvitation(workspaceId, invitationId),
  
  // Remove these problematic methods or fix them:
  getMyWorkspaceInvitations: () => chatApiService.request('/workspaces/my_workspace_invitations/'),
  acceptWorkspaceInvitation: (workspaceId) => chatApiService.request(`/workspaces/${workspaceId}/accept_invitation/`, { method: 'POST' }),
  declineWorkspaceInvitation: (workspaceId) => chatApiService.request(`/workspaces/${workspaceId}/decline_invitation/`, { method: 'POST' }),
  getWorkspaceInvitationSuggestions: (workspaceId) => chatApiService.request(`/workspaces/${workspaceId}/invitation_suggestions/`),
};
// Channel Service - UPDATED WITH BURN USER
export const channelService = {
  // Basic channel operations
  getChannels: (workspaceId) => chatApiService.getChannels(workspaceId),
  getChannel: (id) => chatApiService.getChannel(id),
  getChannelMessages: (id, params) => chatApiService.getChannelMessages(id, params),
  sendChannelMessage: (channelId, content, messageType, replyTo) => chatApiService.sendChannelMessage(channelId, content, messageType, replyTo),
  
  // Channel creation & management
  createChannel: (channelData) => chatApiService.createChannel(channelData),
  updateChannel: (channelId, channelData) => chatApiService.updateChannel(channelId, channelData),
  deleteChannel: (channelId) => chatApiService.deleteChannel(channelId),
  
  // Channel membership
  joinChannel: (channelId) => chatApiService.joinChannel(channelId),
  leaveChannel: (channelId) => chatApiService.leaveChannel(channelId),
  getChannelMembers: (channelId) => chatApiService.getChannelMembers(channelId),
  updateChannelMemberRole: (channelId, userId, role) => chatApiService.updateChannelMemberRole(channelId, userId, role),
  removeMemberFromChannel: (channelId, userId) => chatApiService.removeMemberFromChannel(channelId, userId),
  
  // 🔥 BURN USER FUNCTIONALITY - ADDED
  burnUserFromChannel: (channelId, userId) => chatApiService.burnUserFromChannel(channelId, userId),
  
  // Channel administration
  archiveChannel: (channelId) => chatApiService.archiveChannel(channelId),
  unarchiveChannel: (channelId) => chatApiService.unarchiveChannel(channelId),
  getChannelStatistics: (channelId) => chatApiService.getChannelStatistics(channelId),
  transferChannelOwnership: (channelId, newOwnerId) => chatApiService.transferChannelOwnership(channelId, newOwnerId),
  
  // Channel moderation
  banUserFromChannel: (channelId, userId, reason, durationDays) => chatApiService.banUserFromChannel(channelId, userId, reason, durationDays),
  unbanUserFromChannel: (channelId, userId) => chatApiService.unbanUserFromChannel(channelId, userId),
  getBannedUsers: (channelId) => chatApiService.getBannedUsers(channelId),
  
  // Invitation methods - FIXED: Use the enhanced inviteToChannel
  inviteToChannel: (channelId, data) => {
    console.log('🌐 Sending invite request:', {
      channelId,
      data,
      endpoint: `/channels/${channelId}/invite/`
    });
    
    // Handle different data formats
    let user_ids;
    if (Array.isArray(data)) {
      user_ids = data;
    } else if (data.user_ids) {
      user_ids = data.user_ids;
    } else if (data.selectedUsers) {
      user_ids = data.selectedUsers;
    } else {
      user_ids = [];
    }
    
    console.log('📨 Final user IDs being sent:', user_ids);
    
    const requestData = {
      user_ids: user_ids
    };
    
    return chatApiService.request(`/channels/${channelId}/invite/`, {
      method: 'POST',
      body: JSON.stringify(requestData)
    });
  },
  
  getChannelInviteSuggestions: (channelId, searchQuery) => chatApiService.getChannelInviteSuggestions(channelId, searchQuery),
  getMyInvitations: () => chatApiService.request('/channels/my_invitations/'),
  
  acceptInvitation: (channelId) => 
    chatApiService.request(`/channels/${channelId}/accept_invitation/`, {
      method: 'POST'
    }),
  
  declineInvitation: (channelId) => 
    chatApiService.request(`/channels/${channelId}/decline_invitation/`, {
      method: 'POST'
    }),
  
  getInvitationStatus: (channelId) => 
    chatApiService.request(`/channels/${channelId}/invitation_status/`),
};

// Direct Message Service
export const dmService = {
  // Basic DM operations
  getDirectMessages: () => chatApiService.getDirectMessages(),
  startDirectMessage: (userId, workspaceId) => chatApiService.startDirectMessage(userId, workspaceId),
  getDMMessages: (dmId, params) => chatApiService.getDMMessages(dmId, params),
  sendDMMessage: (dmId, content) => chatApiService.sendDMMessage(dmId, content),
  
  // Enhanced DM methods
  startDirectMessageWithWorkspace: (workspaceId, userId) => chatApiService.startDirectMessageWithWorkspace(workspaceId, userId),
  getWorkspaceDMs: (workspaceId) => chatApiService.getWorkspaceDMs(workspaceId),
  markDMAsRead: (dmId) => chatApiService.markDMAsRead(dmId),
  getDMStatistics: (dmId) => chatApiService.getDMStatistics(dmId),
  searchDMMessages: (dmId, query) => chatApiService.searchDMMessages(dmId, query),
  uploadDMFile: (dmId, file) => chatApiService.uploadDMFile(dmId, file)
};

// Room Service
export const roomService = {
  getRooms: () => chatApiService.getRooms(),
  getRoomMessages: (id, params) => chatApiService.getRoomMessages(id, params)
};

// Message Service
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
};

// File Service
export const fileService = {
  uploadFile: (file, channelId, description) => chatApiService.uploadFile(file, channelId, description)
};

// Push Notification Service
export const pushNotificationService = {
  // User Devices
  registerDevice: (deviceData) => chatApiService.registerDevice(deviceData),
  getUserDevices: () => chatApiService.getUserDevices(),
  deactivateDevice: (deviceId) => chatApiService.deactivateDevice(deviceId),

  // Notifications
  getNotifications: () => chatApiService.getNotifications(),
  getNotification: (notificationId) => chatApiService.getNotification(notificationId),
  markNotificationRead: (notificationId) => chatApiService.markNotificationRead(notificationId),
  markAllNotificationsRead: () => chatApiService.markAllNotificationsRead(),
  getUnreadCount: () => chatApiService.getUnreadCount(),

  // Preferences
  getNotificationPreferences: () => chatApiService.getNotificationPreferences(),
  updateNotificationPreference: (preferenceData) => chatApiService.updateNotificationPreference(preferenceData),
  getMyPreferences: () => chatApiService.getMyPreferences(),

  // Configuration
  getFCMConfig: () => chatApiService.getFCMConfig()
};

// Search Service
export const searchService = {
  searchMessages: (query, filters) => chatApiService.searchMessages(query, filters),
  globalSearch: (query) => chatApiService.globalSearch(query)
};

// Utility Service
export const utilityService = {
  getHealth: () => chatApiService.getHealth(),
  getWebSocketToken: () => chatApiService.getWebSocketToken()
};

// Debug Service
export const debugService = {
  debugEndpoints: () => chatApiService.debugEndpoints(),
  testDMEndpoints: () => chatApiService.testDMEndpoints()
};

// Default export
export default chatApiService;