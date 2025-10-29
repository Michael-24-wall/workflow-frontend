import { create } from 'zustand';

const API_BASE_URL = 'http://localhost:9000/api';

const useAuthStore = create((set, get) => ({
  user: null,
  organization: null,
  invitations: [],
  members: [],
  isLoading: false,
  error: null,
  
  // ✅ EXISTING METHODS (Working)
  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        set({ user: null, isLoading: false });
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/auth/profile/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const userData = await response.json();
        set({ user: userData, isLoading: false });
      } else {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({ user: null, isLoading: false });
      }
    } catch (error) {
      set({ user: null, isLoading: false });
    }
  },
  
  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || JSON.stringify(errorData) || 'Registration failed');
      }
      
      const data = await response.json();
      set({ isLoading: false });
      return { success: true, message: data.message };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed');
      }
      
      const data = await response.json();
      
      if (data.access) {
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        
        const userResponse = await fetch(`${API_BASE_URL}/auth/profile/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${data.access}`,
          },
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          set({ user: userData, isLoading: false, error: null });
          return { success: true };
        }
      }
      
      throw new Error('Login failed - no access token received');
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({ user: null, organization: null, invitations: [], members: [], error: null });
  },

  // 🆕 PROFILE MANAGEMENT
  updateProfile: async (profileData) => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/auth/update_profile/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });
      
      if (!response.ok) throw new Error('Profile update failed');
      
      const userData = await response.json();
      set({ user: userData, isLoading: false });
      return { success: true };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  changePassword: async (passwordData) => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/auth/change_password/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(passwordData),
      });
      
      if (!response.ok) throw new Error('Password change failed');
      
      set({ isLoading: false });
      return { success: true, message: 'Password changed successfully' };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // 🆕 EMAIL VERIFICATION
  resendVerification: async (email) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/auth/resend_verification/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      if (!response.ok) throw new Error('Failed to resend verification');
      
      set({ isLoading: false });
      return { success: true, message: 'Verification email sent' };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // 🆕 PASSWORD RESET
  forgotPassword: async (email) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot_password/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      if (!response.ok) throw new Error('Failed to send reset email');
      
      set({ isLoading: false });
      return { success: true, message: 'Password reset email sent' };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  resetPassword: async (resetData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/auth/password_reset_confirm/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resetData),
      });
      
      if (!response.ok) throw new Error('Password reset failed');
      
      set({ isLoading: false });
      return { success: true, message: 'Password reset successful' };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // 🆕 ORGANIZATION MANAGEMENT
  joinOrganization: async (inviteToken) => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/auth/join_organization/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ invite_token: inviteToken }),
      });
      
      if (!response.ok) throw new Error('Failed to join organization');
      
      const data = await response.json();
      set({ user: data.user, isLoading: false });
      return { success: true, message: data.message };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // ✅ ULTIMATE FIX: COMBINED ORGANIZATION DATA CALL
  getOrganizationData: async () => {
    console.log('🔄 Starting getOrganizationData...');
    set({ isLoading: true, error: null });
    
    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('No access token found');
      }

      console.log('📡 Making organization API calls...');

      // Make all organization API calls
      const apiCalls = [
        fetch(`${API_BASE_URL}/organization/my_organization/`, {
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
        }),
        fetch(`${API_BASE_URL}/organization/pending_invitations/`, {
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
        }),
        fetch(`${API_BASE_URL}/organization/members/`, {
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
        }),
        fetch(`${API_BASE_URL}/organization/statistics/`, {
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
        })
      ];

      const responses = await Promise.all(apiCalls);
      
      // Process each response
      const organization = responses[0].ok ? await responses[0].json() : null;
      const invitations = responses[1].ok ? await responses[1].json() : [];
      const members = responses[2].ok ? await responses[2].json() : [];
      const statistics = responses[3].ok ? await responses[3].json() : null;

      console.log('✅ API Responses:', {
        organization: organization ? 'EXISTS' : 'NULL',
        invitations: invitations.length,
        members: members.length,
        statistics: statistics ? 'EXISTS' : 'NULL'
      });

      // ✅ CRITICAL FIX: Update Zustand store with individual set calls
      set({ organization });
      set({ invitations });
      set({ members });
      set({ isLoading: false, error: null });

      console.log('🎯 Zustand store updated successfully');
      console.log('📊 Current store state:', get());

      return { 
        success: true,
        data: { organization, invitations, members, statistics }
      };

    } catch (error) {
      console.error('❌ getOrganizationData error:', error);
      set({ isLoading: false, error: error.message });
      return { success: false, error: error.message };
    }
  },

  // ✅ FIXED: SEND INVITATION
  sendInvitation: async (invitationData) => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/organization/send_invitation/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(invitationData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.role || 'Failed to send invitation');
      }
      
      const data = await response.json();
      
      // Refresh organization data
      await get().getOrganizationData();
      
      return { 
        success: true, 
        message: data.message,
        invitation: data.invitation 
      };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  getPendingInvitations: async () => {
    set({ isLoading: true });
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/organization/pending_invitations/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const invitations = await response.json();
        set({ invitations, isLoading: false });
        return { success: true, data: invitations };
      } else {
        set({ isLoading: false });
        return { success: false, error: 'Failed to fetch invitations' };
      }
    } catch (error) {
      set({ isLoading: false, error: error.message });
      return { success: false, error: error.message };
    }
  },

  getMembers: async () => {
    set({ isLoading: true });
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/organization/members/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const members = await response.json();
        set({ members, isLoading: false });
        return { success: true, data: members };
      } else {
        set({ isLoading: false });
        return { success: false, error: 'Failed to fetch members' };
      }
    } catch (error) {
      set({ isLoading: false, error: error.message });
      return { success: false, error: error.message };
    }
  },

  getStatistics: async () => {
    set({ isLoading: true });
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/organization/statistics/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const statistics = await response.json();
        set({ isLoading: false });
        return { success: true, data: statistics };
      } else {
        set({ isLoading: false });
        return { success: false, error: 'Failed to fetch statistics' };
      }
    } catch (error) {
      set({ isLoading: false, error: error.message });
      return { success: false, error: error.message };
    }
  },

  // 🆕 TOKEN MANAGEMENT
  refreshToken: async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      const response = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('access_token', data.access);
        return { success: true, access: data.access };
      } else {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({ user: null, organization: null, invitations: [], members: [] });
        return { success: false };
      }
    } catch (error) {
      return { success: false };
    }
  },

  // 🆕 Clear organization data
  clearOrganizationData: () => {
    set({ organization: null, invitations: [], members: [] });
  }
}));

export default useAuthStore;