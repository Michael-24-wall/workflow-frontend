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
  
  // Dashboard State
  availableDashboards: [],
  quickAccessLinks: [],
  currentDashboard: null,
  dashboardData: {},
  userRole: null,
  
  // ✅ FIXED DASHBOARD METHODS
  
  getAvailableDashboards: async () => {
    set({ isLoading: true, error: null });
    try {
      // Use current user role from state or calculate it
      const currentRole = get().userRole || get().effectiveUserRole || 'MEMBER';
      const availableDashboards = get().calculateAvailableDashboards(currentRole);
      
      set({ 
        availableDashboards,
        isLoading: false 
      });
      
      return { success: true, data: availableDashboards };
    } catch (error) {
      console.log('⚠️ Using fallback dashboards due to error:', error.message);
      // Fallback to basic dashboards
      const fallbackDashboards = ['overview', 'personal'];
      set({ 
        availableDashboards: fallbackDashboards,
        isLoading: false 
      });
      return { success: true, data: fallbackDashboards };
    }
  },

  getQuickAccess: async () => {
    set({ isLoading: true, error: null });
    try {
      const quickLinks = [
        { name: 'Overview', path: '/dashboard/overview', icon: 'dashboard' },
        { name: 'Personal', path: '/dashboard/personal', icon: 'person' },
        { name: 'Tasks', path: '/tasks', icon: 'assignment' },
        { name: 'Projects', path: '/projects', icon: 'folder' }
      ];
      
      set({ 
        quickAccessLinks: quickLinks,
        isLoading: false 
      });
      
      return { success: true, data: quickLinks };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  getDashboard: async (dashboardType) => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('access_token');
      
      // Use only existing endpoints
      let endpoint = '';
      let data = {};
      
      switch(dashboardType) {
        case 'overview':
          // Use organization data for overview
          const orgResponse = await fetch(`${API_BASE_URL}/organizations/my_organization/`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (orgResponse.ok) {
            data = await orgResponse.json();
          }
          break;
          
        case 'personal':
          // Use tasks for personal dashboard
          const tasksResponse = await fetch(`${API_BASE_URL}/tasks/my_tasks/`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (tasksResponse.ok) {
            data = await tasksResponse.json();
          }
          break;
          
        case 'financial':
        case 'hr':
        case 'analytics':
        case 'team':
        case 'cases':
        case 'system':
          // These dashboards don't have specific endpoints yet
          // Use organization data as fallback
          const fallbackResponse = await fetch(`${API_BASE_URL}/organizations/my_organization/`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (fallbackResponse.ok) {
            data = { 
              dashboard_type: dashboardType,
              message: `Dashboard data for ${dashboardType} coming soon`,
              ...(await fallbackResponse.json())
            };
          }
          break;
          
        default:
          throw new Error(`Unknown dashboard type: ${dashboardType}`);
      }
      
      set({ 
        currentDashboard: dashboardType,
        dashboardData: { ...get().dashboardData, [dashboardType]: data },
        isLoading: false 
      });
      
      return { success: true, data };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // Helper method to calculate available dashboards based on role
  calculateAvailableDashboards: (userRole) => {
    const roleDashboards = {
      'OWNER': ['overview', 'financial', 'hr', 'analytics', 'team', 'cases', 'system', 'personal'],
      'EXECUTIVE': ['overview', 'financial', 'hr', 'analytics', 'team', 'personal'],
      'ADMIN': ['overview', 'system', 'analytics', 'personal'],
      'FINANCE': ['overview', 'financial', 'personal'],
      'HR': ['overview', 'hr', 'team', 'personal'],
      'MANAGER': ['overview', 'team', 'cases', 'personal'],
      'SOCIAL_WORKER': ['overview', 'cases', 'personal'],
      'MEMBER': ['overview', 'personal']
    };
    
    return roleDashboards[userRole] || ['overview', 'personal'];
  },

  // Dashboard-specific methods
  getOverviewDashboard: async () => {
    return get().getDashboard('overview');
  },

  getFinancialDashboard: async () => {
    return get().getDashboard('financial');
  },

  getHRDashboard: async () => {
    return get().getDashboard('hr');
  },

  getAnalyticsDashboard: async () => {
    return get().getDashboard('analytics');
  },

  getTeamDashboard: async () => {
    return get().getDashboard('team');
  },

  getCasesDashboard: async () => {
    return get().getDashboard('cases');
  },

  getSystemDashboard: async () => {
    return get().getDashboard('system');
  },

  getPersonalDashboard: async () => {
    return get().getDashboard('personal');
  },

  // ✅ FIXED ROLE-BASED DASHBOARD ROUTING
  
  getDefaultDashboardPath: (userRole) => {
    const roleDashboards = {
      'OWNER': '/dashboard/financial',
      'EXECUTIVE': '/dashboard/financial', 
      'ADMIN': '/dashboard/system',
      'FINANCE': '/dashboard/financial',
      'HR': '/dashboard/hr',
      'MANAGER': '/dashboard/team',
      'SOCIAL_WORKER': '/dashboard/cases',
      'MEMBER': '/dashboard/personal'
    };
    
    return roleDashboards[userRole] || '/dashboard/overview';
  },

  getDashboardAccessLevel: (dashboardType, userRole) => {
    const dashboardAccess = {
      'OVERVIEW': ['OWNER', 'EXECUTIVE', 'ADMIN', 'MANAGER', 'HR', 'FINANCE', 'SOCIAL_WORKER', 'MEMBER'],
      'FINANCIAL': ['OWNER', 'EXECUTIVE', 'ADMIN', 'FINANCE'],
      'HR': ['OWNER', 'EXECUTIVE', 'ADMIN', 'HR', 'MANAGER'],
      'ANALYTICS': ['OWNER', 'EXECUTIVE', 'ADMIN', 'MANAGER'],
      'TEAM': ['OWNER', 'EXECUTIVE', 'ADMIN', 'MANAGER', 'HR'],
      'CASES': ['OWNER', 'EXECUTIVE', 'ADMIN', 'MANAGER', 'SOCIAL_WORKER'],
      'SYSTEM': ['OWNER', 'EXECUTIVE', 'ADMIN'],
      'USER_MANAGEMENT': ['OWNER', 'EXECUTIVE', 'ADMIN', 'HR'],
      'REPORTS': ['OWNER', 'EXECUTIVE', 'ADMIN', 'MANAGER', 'HR', 'FINANCE'],
      'PERSONAL': ['OWNER', 'EXECUTIVE', 'ADMIN', 'MANAGER', 'HR', 'FINANCE', 'SOCIAL_WORKER', 'MEMBER'],
    };
    
    const allowedRoles = dashboardAccess[dashboardType] || [];
    return userRole === 'OWNER' || allowedRoles.includes(userRole);
  },

  // ✅ ENHANCED AUTHENTICATION WITH BETTER ROLE DETECTION
  
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
        
        // Convert relative URL to absolute URL
        if (userData.profile_picture_url && userData.profile_picture_url.startsWith('/')) {
          userData.profile_picture_url = `http://localhost:9000${userData.profile_picture_url}`;
        }
        
        set({ user: userData, isLoading: false });
        
        // Automatically fetch organization and dashboard data if user is authenticated
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

  // ✅ FIXED REGISTRATION WITH AUTO-LOGIN AND ROLE DETECTION
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
      
      // STORE EMAIL IN LOCALSTORAGE FOR VERIFICATION BACKUP
      if (userData.email) {
        localStorage.setItem('user_email', userData.email);
      }
      
      set({ isLoading: false });
      
      // AUTOMATICALLY LOGIN AFTER SUCCESSFUL REGISTRATION
      console.log('🔄 Attempting auto-login after registration...');
      const loginResult = await get().login({
        email: userData.email,
        password: userData.password
      });
      
      if (loginResult.success) {
        console.log('✅ Auto-login successful, redirecting to:', loginResult.redirectTo);
        return { 
          success: true, 
          message: data.message,
          redirectTo: loginResult.redirectTo 
        };
      } else {
        console.log('⚠️ Auto-login failed, redirecting to login page');
        return { 
          success: true, 
          message: data.message,
          redirectTo: '/login'
        };
      }
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // ✅ FIXED LOGIN WITH IMPROVED ROLE DETECTION
  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      console.log('🔐 Attempting login...', credentials);
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
        
        // STORE EMAIL IN LOCALSTORAGE FOR VERIFICATION BACKUP
        if (credentials.email) {
          localStorage.setItem('user_email', credentials.email);
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
          
          // Convert relative URL to absolute URL
          if (userData.profile_picture_url && userData.profile_picture_url.startsWith('/')) {
            userData.profile_picture_url = `http://localhost:9000${userData.profile_picture_url}`;
          }
          
          set({ user: userData, isLoading: false, error: null });
          
          // ENHANCED: Fetch organization data to determine actual role
          console.log('🔄 Fetching organization data for role detection...');
          const orgResult = await get().getOrganizationData();
          
          let redirectTo = '/dashboard/personal'; // default fallback
          let detectedRole = 'MEMBER';
          
          // ✅ IMPROVED ROLE DETECTION
          if (orgResult.success && orgResult.data.organization) {
            const org = orgResult.data.organization;
            console.log('🏢 Organization data for role detection:', org);
            console.log('👥 Members data:', orgResult.data.members);
            console.log('👤 Current user ID:', userData.id);
            
            // METHOD 1: Check if user is in members list with a role
            if (orgResult.data.members && orgResult.data.members.length > 0) {
              const userMember = orgResult.data.members.find(
                member => member.user && member.user.id === userData.id
              );
              
              if (userMember && userMember.role) {
                detectedRole = userMember.role;
                console.log(`👤 Found user role from members: ${detectedRole}`);
              } else {
                console.log('👤 User not found in members list or no role assigned');
              }
            }
            
            // METHOD 2: If no members or user not in members, assume first user is OWNER
            if (detectedRole === 'MEMBER' && (!orgResult.data.members || orgResult.data.members.length === 0)) {
              console.log('🎯 First user in organization, assuming OWNER role');
              detectedRole = 'OWNER';
            }
            
            // METHOD 3: Check if organization has creator field
            if (detectedRole === 'MEMBER' && org.created_by && org.created_by.id === userData.id) {
              console.log('👑 User is organization creator, setting as OWNER');
              detectedRole = 'OWNER';
            }
            
            // METHOD 4: Use organization role from user data as final fallback
            if (detectedRole === 'MEMBER' && userData.organization_role) {
              detectedRole = userData.organization_role;
              console.log(`🎯 Using organization_role from user data: ${detectedRole}`);
            }
            
            redirectTo = get().getDefaultDashboardPath(detectedRole);
          } else {
            // No organization found - assume owner for first organization creation
            console.log('🏢 No organization found, user may need to create one - assuming OWNER role');
            detectedRole = 'OWNER';
            redirectTo = '/dashboard/financial';
          }
          
          // Set the detected role in state
          set({ userRole: detectedRole });
          
          console.log(`🎯 Final role detection: ${detectedRole} -> Redirecting to: ${redirectTo}`);
          
          return { 
            success: true, 
            redirectTo,
            userRole: detectedRole
          };
        }
      }
      
      throw new Error('Login failed - no access token received');
    } catch (error) {
      console.error('❌ Login error:', error);
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_email');
    set({ 
      user: null, 
      organization: null, 
      invitations: [], 
      members: [], 
      statistics: null,
      availableDashboards: [],
      quickAccessLinks: [],
      currentDashboard: null,
      dashboardData: {},
      userRole: null,
      error: null 
    });
  },

  // ✅ EMAIL VERIFICATION METHODS
  verifyEmail: async (token) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify_email_with_token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: token })
      });
      
      if (response.ok) {
        const data = await response.json();
        
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
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  resendVerification: async () => {
    set({ isLoading: true, error: null });
    try {
      const userEmail = localStorage.getItem('user_email');
      
      if (!userEmail) {
        throw new Error('Please register again or contact support to resend verification email.');
      }

      const response = await fetch(`${API_BASE_URL}/auth/resend_verification/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userEmail }),
      });
      
      if (response.ok) {
        const data = await response.json();
        set({ isLoading: false });
        return { success: true, message: data.message || 'Verification email sent' };
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.detail || 'Failed to resend verification email';
        throw new Error(errorMessage);
      }
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // ✅ PROFILE MANAGEMENT
  updateProfile: async (profileData) => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('access_token');
      
      const isFormData = profileData instanceof FormData;
      
      const headers = {
        'Authorization': `Bearer ${token}`,
      };
      
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
      
      if (userData.profile_picture_url && userData.profile_picture_url.startsWith('/')) {
        userData.profile_picture_url = `http://localhost:9000${userData.profile_picture_url}`;
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
      
      const response = await fetch(`${API_BASE_URL}/auth/update_profile/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.detail || 'Profile picture upload failed');
      }
      
      const userData = await response.json();
      
      if (userData.profile_picture_url && userData.profile_picture_url.startsWith('/')) {
        userData.profile_picture_url = `http://localhost:9000${userData.profile_picture_url}`;
      }
      
      set({ user: userData, isLoading: false });
      
      setTimeout(() => {
        set(state => ({ ...state }));
      }, 100);
      
      return { success: true, user: userData };
    } catch (error) {
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
      
      if (userData.profile_picture_url && userData.profile_picture_url.startsWith('/')) {
        userData.profile_picture_url = `http://localhost:9000${userData.profile_picture_url}`;
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
      
      if (data.user?.profile_picture_url && data.user.profile_picture_url.startsWith('/')) {
        data.user.profile_picture_url = `http://localhost:9000${data.user.profile_picture_url}`;
      }
      
      set({ user: data.user, isLoading: false });
      
      // Refresh organization and dashboard data after joining
      await get().getOrganizationData();
      
      return { success: true, message: data.message };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // ✅ FIXED ORGANIZATION DATA FETCHING
  getOrganizationData: async () => {
    console.log('🔄 Starting getOrganizationData...');
    set({ isLoading: true, error: null });
    
    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('No access token found');
      }

      console.log('📡 Making organization API calls...');

      // Use only endpoints that exist
      const apiCalls = [
        fetch(`${API_BASE_URL}/organizations/my_organization/`, {
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
        }),
        fetch(`${API_BASE_URL}/organizations/pending_invitations/`, {
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
        }),
        fetch(`${API_BASE_URL}/organizations/members/`, {
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
        }),
        fetch(`${API_BASE_URL}/organizations/statistics/`, {
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
        })
      ];

      const responses = await Promise.all(apiCalls);
      
      // Process organization response
      let organization = null;
      if (responses[0].ok) {
        const orgData = await responses[0].json();
        organization = orgData.organization || orgData;
        
        console.log('🏢 Organization data:', organization);
      } else {
        console.warn('⚠️ No organization found for user');
      }
      
      const invitations = responses[1].ok ? await responses[1].json() : [];
      const members = responses[2].ok ? await responses[2].json() : [];
      const statistics = responses[3].ok ? await responses[3].json() : null;

      // Update Zustand store
      set({ 
        organization, 
        invitations, 
        members, 
        statistics,
        isLoading: false, 
        error: null 
      });

      console.log('✅ Organization data fetched successfully');

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
      const response = await fetch(`${API_BASE_URL}/organizations/send_invitation/`, {
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
      const response = await fetch(`${API_BASE_URL}/organizations/pending_invitations/`, {
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
      const response = await fetch(`${API_BASE_URL}/organizations/members/`, {
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
      const response = await fetch(`${API_BASE_URL}/organizations/statistics/`, {
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
        
        if (userData.profile_picture_url && userData.profile_picture_url.startsWith('/')) {
          userData.profile_picture_url = `http://localhost:9000${userData.profile_picture_url}`;
        }
        
        console.log('🔄 Refreshed user profile:', userData);
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
    set({ 
      organization: null, 
      invitations: [], 
      members: [], 
      statistics: null,
      availableDashboards: [],
      quickAccessLinks: [],
      currentDashboard: null,
      dashboardData: {} 
    });
  },

  clearError: () => {
    set({ error: null });
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  // ✅ COMPUTED PROPERTIES
  get isAuthenticated() {
    return !!get().user;
  },

  get hasOrganization() {
    return !!get().organization;
  },

  get organizationSlug() {
    return get().organization?.slug || null;
  },

  get effectiveUserRole() {
    return get().userRole || get().user?.organization_role || 'MEMBER';
  },

  get isOrganizationAdmin() {
    const role = get().effectiveUserRole;
    return role === 'ADMIN' || role === 'OWNER' || role === 'EXECUTIVE';
  },

  get pendingInvitationsCount() {
    return get().invitations.length;
  },

  get membersCount() {
    return get().members.length;
  },

  get isEmailVerified() {
    return get().user?.is_verified || false;
  },

  // Dashboard computed properties
  get hasDashboardAccess() {
    return get().availableDashboards.length > 0;
  },

  get primaryDashboard() {
    const role = get().effectiveUserRole;
    return get().getDefaultDashboardPath(role);
  }
}));

export default useAuthStore;