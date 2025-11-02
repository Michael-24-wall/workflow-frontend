import { create } from 'zustand';

const API_BASE_URL = 'http://localhost:9000/api';

const useAuthStore = create((set, get) => ({
  // State
  user: null,
  organization: null,
  invitations: [],
  members: [],
  statistics: null,
  isLoading: false,
  error: null,
  
  // ✅ AUTHENTICATION METHODS
  
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
        
        // ✅ FIX: Convert relative URL to absolute URL
        if (userData.profile_picture_url && userData.profile_picture_url.startsWith('/')) {
          userData.profile_picture_url = `http://localhost:9000${userData.profile_picture_url}`;
          console.log('🔗 Converted to absolute URL in checkAuth:', userData.profile_picture_url);
        }
        
        set({ user: userData, isLoading: false });
        
        // Automatically fetch organization data if user is authenticated
        if (userData) {
          await get().getOrganizationData();
        }
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
      
      // ✅ STORE EMAIL IN LOCALSTORAGE FOR VERIFICATION BACKUP
      if (userData.email) {
        localStorage.setItem('user_email', userData.email);
        console.log('📧 Email stored in localStorage:', userData.email);
      }
      
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
        
        // ✅ STORE EMAIL IN LOCALSTORAGE FOR VERIFICATION BACKUP
        if (credentials.email) {
          localStorage.setItem('user_email', credentials.email);
          console.log('📧 Email stored in localStorage:', credentials.email);
        }
        
        const userResponse = await fetch(`${API_BASE_URL}/auth/profile/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${data.access}`,
          },
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          
          // ✅ FIX: Convert relative URL to absolute URL
          if (userData.profile_picture_url && userData.profile_picture_url.startsWith('/')) {
            userData.profile_picture_url = `http://localhost:9000${userData.profile_picture_url}`;
            console.log('🔗 Converted to absolute URL in login:', userData.profile_picture_url);
          }
          
          set({ user: userData, isLoading: false, error: null });
          
          // Fetch organization data after successful login
          await get().getOrganizationData();
          
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
    localStorage.removeItem('user_email'); // ✅ CLEAR STORED EMAIL
    set({ 
      user: null, 
      organization: null, 
      invitations: [], 
      members: [], 
      statistics: null,
      error: null 
    });
  },

  // ✅ EMAIL VERIFICATION METHODS - FIXED

  verifyEmail: async (token) => {
    set({ isLoading: true, error: null });
    try {
      console.log('🔐 Attempting email verification with token:', token);
      
      // Use the new backend endpoint for manual token entry
      const response = await fetch(`${API_BASE_URL}/auth/verify_email_with_token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: token })
      });
      
      console.log('📡 Verification response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Email verification successful:', data);
        
        // Update user verification status in store if user exists
        const { user } = get();
        if (user) {
          set({ user: { ...user, is_verified: true } });
        }
        
        set({ isLoading: false });
        return { success: true, message: data.message || 'Email verified successfully' };
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.detail || 'Verification failed';
        throw new Error(errorMessage);
      }

    } catch (error) {
      console.error('❌ Email verification error:', error);
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  resendVerification: async () => {
    set({ isLoading: true, error: null });
    try {
      // Get email from localStorage (set during registration)
      const userEmail = localStorage.getItem('user_email');
      
      if (!userEmail) {
        throw new Error('Please register again or contact support to resend verification email.');
      }

      console.log('🔄 Resending verification email to:', userEmail);
      
      const response = await fetch(`${API_BASE_URL}/auth/resend_verification/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userEmail }),
      });
      
      console.log('📡 Resend verification response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Resend verification success:', data);
        
        set({ isLoading: false });
        return { success: true, message: data.message || 'Verification email sent' };
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.detail || 'Failed to resend verification email';
        throw new Error(errorMessage);
      }

    } catch (error) {
      console.error('❌ Resend verification catch error:', error);
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // ✅ PROFILE MANAGEMENT WITH FILE UPLOAD SUPPORT

  updateProfile: async (profileData) => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('access_token');
      
      // Check if we're dealing with FormData (file upload) or regular JSON
      const isFormData = profileData instanceof FormData;
      
      const headers = {
        'Authorization': `Bearer ${token}`,
      };
      
      // Only set Content-Type for JSON, not for FormData
      if (!isFormData) {
        headers['Content-Type'] = 'application/json';
      }
      
      const response = await fetch(`${API_BASE_URL}/auth/update_profile/`, {
        method: 'PATCH',
        headers: headers,
        body: isFormData ? profileData : JSON.stringify(profileData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.detail || 'Profile update failed');
      }
      
      const userData = await response.json();
      
      // ✅ FIX: Convert relative URL to absolute URL
      if (userData.profile_picture_url && userData.profile_picture_url.startsWith('/')) {
        userData.profile_picture_url = `http://localhost:9000${userData.profile_picture_url}`;
        console.log('🔗 Converted to absolute URL in updateProfile:', userData.profile_picture_url);
      }
      
      set({ user: userData, isLoading: false });
      return { success: true, user: userData };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  uploadProfilePicture: async (file) => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('access_token');
      const formData = new FormData();
      formData.append('profile_picture', file);
      
      console.log('🖼️ Uploading profile picture...', file.name);
      
      const response = await fetch(`${API_BASE_URL}/auth/update_profile/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      console.log('📡 Upload response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Upload error:', errorData);
        throw new Error(errorData.error || errorData.detail || 'Profile picture upload failed');
      }
      
      const userData = await response.json();
      console.log('✅ Upload success - Full response:', userData);
      
      // ✅ FIX: Convert relative URL to absolute URL
      if (userData.profile_picture_url && userData.profile_picture_url.startsWith('/')) {
        userData.profile_picture_url = `http://localhost:9000${userData.profile_picture_url}`;
        console.log('🔗 Converted to absolute URL in uploadProfilePicture:', userData.profile_picture_url);
      }
      
      // ✅ IMPORTANT: Force update the store with detailed logging
      console.log('🔍 Setting user in store with profile_picture_url:', userData.profile_picture_url);
      set({ user: userData, isLoading: false });
      
      // ✅ Force a state update to trigger re-render
      setTimeout(() => {
        set(state => ({ ...state }));
        console.log('🔄 Forced state update');
      }, 100);
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('❌ Upload catch error:', error);
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  removeProfilePicture: async () => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/auth/remove_profile_picture/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.detail || 'Failed to remove profile picture');
      }
      
      const userData = await response.json();
      
      // ✅ FIX: Convert relative URL to absolute URL (even if it's null after removal)
      if (userData.profile_picture_url && userData.profile_picture_url.startsWith('/')) {
        userData.profile_picture_url = `http://localhost:9000${userData.profile_picture_url}`;
        console.log('🔗 Converted to absolute URL in removeProfilePicture:', userData.profile_picture_url);
      }
      
      set({ user: userData, isLoading: false });
      return { success: true, user: userData };
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
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.detail || 'Password change failed');
      }
      
      set({ isLoading: false });
      return { success: true, message: 'Password changed successfully' };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // ✅ PASSWORD RESET

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
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send reset email');
      }
      
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
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Password reset failed');
      }
      
      set({ isLoading: false });
      return { success: true, message: 'Password reset successful' };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // ✅ ORGANIZATION MANAGEMENT

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
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to join organization');
      }
      
      const data = await response.json();
      
      // ✅ FIX: Convert relative URL to absolute URL
      if (data.user?.profile_picture_url && data.user.profile_picture_url.startsWith('/')) {
        data.user.profile_picture_url = `http://localhost:9000${data.user.profile_picture_url}`;
        console.log('🔗 Converted to absolute URL in joinOrganization:', data.user.profile_picture_url);
      }
      
      set({ user: data.user, isLoading: false });
      
      // Refresh organization data after joining
      await get().getOrganizationData();
      
      return { success: true, message: data.message };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

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

      // Update Zustand store
      set({ 
        organization, 
        invitations, 
        members, 
        statistics,
        isLoading: false, 
        error: null 
      });

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
        set({ statistics, isLoading: false });
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

  // ✅ TOKEN MANAGEMENT

  refreshToken: async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        return { success: false };
      }
      
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

  // ✅ UTILITY METHODS

  refreshUserProfile: async () => {
    set({ isLoading: true });
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        set({ isLoading: false });
        return { success: false, error: 'No token found' };
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
        
        // ✅ FIX: Convert relative URL to absolute URL
        if (userData.profile_picture_url && userData.profile_picture_url.startsWith('/')) {
          userData.profile_picture_url = `http://localhost:9000${userData.profile_picture_url}`;
          console.log('🔗 Converted to absolute URL in refreshUserProfile:', userData.profile_picture_url);
        }
        
        console.log('🔄 Refreshed user profile:', userData);
        console.log('🔍 Profile picture URL after refresh:', userData.profile_picture_url);
        set({ user: userData, isLoading: false });
        return { success: true, user: userData };
      } else {
        set({ isLoading: false });
        return { success: false, error: 'Failed to refresh profile' };
      }
    } catch (error) {
      console.error('❌ Refresh profile error:', error);
      set({ isLoading: false, error: error.message });
      return { success: false, error: error.message };
    }
  },

  clearOrganizationData: () => {
    set({ organization: null, invitations: [], members: [], statistics: null });
  },

  clearError: () => {
    set({ error: null });
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  
  get isAuthenticated() {
    return !!get().user;
  },

  get hasOrganization() {
    return !!get().organization;
  },

  // FIXED: Use organization_role instead of role
  get userRole() {
    return get().user?.organization_role || null;
  },

  // FIXED: Use organization_role instead of role
  get isOrganizationAdmin() {
    const role = get().user?.organization_role;
    return role === 'admin' || role === 'owner';
  },

  get pendingInvitationsCount() {
    return get().invitations.length;
  },

  get membersCount() {
    return get().members.length;
  },

  // NEW: Email verification status
  get isEmailVerified() {
    return get().user?.is_verified || false;
  }
}));

export default useAuthStore;