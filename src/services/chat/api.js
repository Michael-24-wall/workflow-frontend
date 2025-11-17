// services/chat/api.js - CORRECTED WITH REAL ENDPOINTS
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:9000';

class ChatApiService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/api/chat`;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    console.log(`🌐 Chat API Request: ${endpoint}`, { 
      method: options.method || 'GET',
      endpoint
    });

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const authHeader = await this.getOptimalAuthHeader(endpoint, options.method);
    if (authHeader) {
      config.headers.Authorization = authHeader;
    }

    try {
      const response = await fetch(url, config);
      
      console.log(`📡 Chat API Response: ${response.status} ${response.statusText}`);

      if (response.status === 401) {
        throw new Error(`Authentication failed for ${endpoint}`);
      }

      if (response.status === 404) {
        console.error(`❌ Endpoint not found: ${endpoint}`);
        if (!options.method || options.method === 'GET') {
          return this.getFallbackData(endpoint);
        }
        throw new Error(`Endpoint not found: ${endpoint}`);
      }

      if (response.status === 204) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ Chat API Success: ${options.method || 'GET'} ${endpoint}`);
      return data;
    } catch (error) {
      console.error('Chat API request failed:', error);
      if (!options.method || options.method === 'GET') {
        return this.getFallbackData(endpoint);
      }
      throw error;
    }
  }

  async getOptimalAuthHeader(endpoint, method = 'GET') {
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
  // WORKSPACE METHODS
  // =============================================================================

  async getWorkspaces() {
    try {
      const data = await this.request('/workspaces/');
      return data;
    } catch (error) {
      console.error('Failed to get workspaces:', error);
      return this.getFallbackData('/workspaces/');
    }
  }

  async getWorkspace(workspaceId) {
    try {
      const workspace = await this.request(`/workspaces/${workspaceId}/`);
      return workspace;
    } catch (error) {
      console.error(`Failed to get workspace ${workspaceId}:`, error);
      return this.getFallbackData(`/workspaces/${workspaceId}/`);
    }
  }

  // =============================================================================
  // CHANNEL METHODS - USING REAL ENDPOINTS
  // =============================================================================

  async getChannels() {
    try {
      const data = await this.request('/channels/');
      return data;
    } catch (error) {
      console.error('Failed to get channels:', error);
      return this.getFallbackData('/channels/');
    }
  }

  async getChannel(channelId) {
    try {
      const channel = await this.request(`/channels/${channelId}/`);
      return channel;
    } catch (error) {
      console.error(`Failed to get channel ${channelId}:`, error);
      return { 
        id: channelId, 
        name: `Channel ${channelId}`,
        description: 'Chat channel'
      };
    }
  }

  async getChannelMessages(channelId, params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = queryParams 
      ? `/channels/${channelId}/messages/?${queryParams}`
      : `/channels/${channelId}/messages/`;
    
    try {
      const messages = await this.request(endpoint);
      return messages || [];
    } catch (error) {
      console.error(`Failed to get messages for channel ${channelId}:`, error);
      return [];
    }
  }

  async sendChannelMessage(channelId, content, messageType = 'text', replyTo = null) {
  try {
    console.log('📤 Sending message to channel:', { 
      channelId, 
      content, 
      messageType,
      replyTo 
    });
    
    // CHANGED: Use 'channel' instead of 'room' to match your Django serializer
    const messageData = {
      channel: parseInt(channelId),  // CHANGED: 'channel' instead of 'room'
      content: content,
      message_type: messageType
    };
    
    if (replyTo) {
      messageData.reply_to = parseInt(replyTo);
    }
    
    console.log('📝 Message data:', messageData);
    
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

  // =============================================================================
  // DIRECT MESSAGE METHODS
  // =============================================================================

  async getDirectMessages() {
    try {
      const data = await this.request('/direct-messages/');
      return data || [];
    } catch (error) {
      console.error('Failed to get direct messages:', error);
      return this.getFallbackData('/direct-messages/') || [];
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
      return this.getFallbackData('/rooms/') || [];
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
  // MESSAGE METHODS
  // =============================================================================

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
    
    // FIX: Ensure messageId is properly converted to string in the URL
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
  // FILE UPLOAD
  // =============================================================================

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
        // Don't set Content-Type - let the browser set it with boundary
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
}

// Create singleton instance
const chatApiService = new ChatApiService();

// Export ALL services
export const workspaceService = {
  getWorkspaces: () => chatApiService.getWorkspaces(),
  getWorkspace: (id) => chatApiService.getWorkspace(id)
};

export const channelService = {
  getChannels: () => chatApiService.getChannels(),
  getChannel: (id) => chatApiService.getChannel(id),
  getChannelMessages: (id, params) => chatApiService.getChannelMessages(id, params),
  sendChannelMessage: (channelId, content, messageType, replyTo) => chatApiService.sendChannelMessage(channelId, content, messageType, replyTo)
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

export default chatApiService;