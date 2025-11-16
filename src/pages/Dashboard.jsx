import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Avatar,
  CircularProgress,
  Snackbar,
  Alert,
  Button,
  Badge
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  CameraAlt as CameraIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
  TableChart as SheetsIcon,
  Assessment as AnalyticsIcon,
  Work as WorkIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  Chat as ChatIcon,
  Forum as ForumIcon
} from '@mui/icons-material';
import useAuthStore from '../stores/authStore';
import useEditorStore from '../stores/editorStore';

// Chat Components - Add these imports
import { AuthProvider as ChatAuthProvider } from '../contexts/chat/AuthContext';
import { WebSocketProvider as ChatWebSocketProvider } from '../contexts/chat/WebSocketContext';
import ChatSidebar from '../components/chat/layout/Sidebar';

// Profile Update Dialog Component
const ProfileUpdateDialog = ({ open, onClose, user, onUpdate, isLoading }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    position: '',
    department: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        position: user.position || '',
        department: user.department || ''
      });
      setError('');
    }
  }, [open, user]);

  const handleChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      setError('First name and last name are required');
      return;
    }

    const result = await onUpdate(formData);
    if (result.success) {
      onClose();
    } else {
      setError(result.error || 'Failed to update profile');
    }
  };

  const handleClose = () => {
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle className="flex items-center gap-2">
        <EditIcon />
        Update Profile
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <TextField
                label="First Name"
                value={formData.first_name}
                onChange={handleChange('first_name')}
                fullWidth
                required
                disabled={isLoading}
              />
              <TextField
                label="Last Name"
                value={formData.last_name}
                onChange={handleChange('last_name')}
                fullWidth
                required
                disabled={isLoading}
              />
            </div>
            
            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleChange('email')}
              fullWidth
              disabled
              helperText="Email cannot be changed"
            />
            
            <TextField
              label="Phone"
              value={formData.phone}
              onChange={handleChange('phone')}
              fullWidth
              disabled={isLoading}
            />
            
            <TextField
              label="Position"
              value={formData.position}
              onChange={handleChange('position')}
              fullWidth
              disabled={isLoading}
            />
            
            <TextField
              label="Department"
              value={formData.department}
              onChange={handleChange('department')}
              fullWidth
              disabled={isLoading}
            />
          </div>
        </DialogContent>
        <DialogActions className="p-4 gap-2">
          <Button 
            onClick={handleClose} 
            disabled={isLoading}
            startIcon={<CancelIcon />}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            {isLoading ? 'Updating...' : 'Update Profile'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

// Chat Toggle Button Component
const ChatToggleButton = ({ isChatOpen, onToggle, unreadCount }) => (
  <button
    onClick={onToggle}
    className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 z-50"
    title="Team Chat"
  >
    <Badge 
      badgeContent={unreadCount} 
      color="error" 
      overlap="circular"
      sx={{
        '& .MuiBadge-badge': {
          fontSize: '0.7rem',
          height: '18px',
          minWidth: '18px',
        }
      }}
    >
      <ChatIcon />
    </Badge>
  </button>
);

const Dashboard = () => {
  const { 
    user, 
    logout, 
    organization, 
    invitations, 
    members, 
    statistics,
    getOrganizationData,
    getInvitationsData,
    getMembersData,
    getManagerDashboard,
    getSocialWorkerDashboard,
    managerDashboard,
    socialWorkerStats,
    updateProfile,
    uploadProfilePicture,
    isLoading: authLoading 
  } = useAuthStore();

  const {
    documents,
    getDocuments,
    isLoading: editorLoading
  } = useEditorStore();

  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    totalDocuments: 0,
    teamMembers: 0,
    pendingInvitations: 0,
    activeMembers: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const profileDropdownRef = useRef(null);
  const fileInputRef = useRef(null);

  const effectiveUserRole = useAuthStore(state => state.effectiveUserRole);
  const hasAccess = effectiveUserRole && ['OWNER', 'EXECUTIVE', 'ADMIN', 'MANAGER', 'HR', 'FINANCE', 'SOCIAL_WORKER'].includes(effectiveUserRole);
  const isManager = effectiveUserRole === 'MANAGER';
  const isSocialWorker = effectiveUserRole === 'SOCIAL_WORKER';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleProfileUpdate = async (profileData) => {
    setIsUpdatingProfile(true);
    try {
      const result = await updateProfile(profileData);
      if (result.success) {
        showSnackbar('Profile updated successfully!', 'success');
        return { success: true };
      } else {
        showSnackbar(result.error || 'Failed to update profile', 'error');
        return { success: false, error: result.error };
      }
    } catch (error) {
      showSnackbar('Error updating profile', 'error');
      return { success: false, error: error.message };
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleProfilePictureUpdate = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showSnackbar('Please select an image file', 'error');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showSnackbar('Image size should be less than 2MB', 'error');
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const result = await uploadProfilePicture(file);
      if (result.success) {
        showSnackbar('Profile picture updated successfully!', 'success');
      } else {
        showSnackbar(result.error || 'Failed to update profile picture', 'error');
      }
    } catch (error) {
      showSnackbar('Error updating profile picture', 'error');
    } finally {
      setIsUpdatingProfile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Chat Functions
  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
    if (!isChatOpen) {
      setUnreadMessages(0); // Reset unread count when opening chat
    }
  };

  const handleNewMessage = () => {
    if (!isChatOpen) {
      setUnreadMessages(prev => prev + 1);
    }
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [orgResult, invitationsResult, membersResult, documentsResult] = await Promise.all([
        getOrganizationData(),
        getInvitationsData(),
        getMembersData(),
        getDocuments()
      ]);
      
      if (isManager) {
        await getManagerDashboard();
      }
      
      if (isSocialWorker) {
        await getSocialWorkerDashboard();
      }
      
      if (orgResult?.success) {
        setStats({
          totalDocuments: documents?.length || 0,
          teamMembers: members?.length || 0,
          pendingInvitations: invitations?.length || 0,
          activeMembers: members?.filter(m => m.status === 'active' || !m.status).length || 0
        });
      } else {
        throw new Error(orgResult?.error || 'Failed to fetch organization data');
      }

    } catch (err) {
      if (err.message?.includes('404') || err.message?.includes('not found')) {
        setError('You are not part of any organization yet.');
      } else if (err.message?.includes('403') || err.message?.includes('permission')) {
        setError('You do not have permission to view organization data.');
      } else {
        setError('Failed to load dashboard data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [
    getOrganizationData, 
    getInvitationsData, 
    getMembersData, 
    getManagerDashboard, 
    getSocialWorkerDashboard,
    getDocuments,
    isManager, 
    isSocialWorker, 
    documents, 
    members, 
    invitations
  ]);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (!hasAccess || !isMounted) return;
      
      try {
        await fetchDashboardData();
      } catch (err) {
        if (isMounted) {
          // Error is already handled in fetchDashboardData
        }
      }
    };

    if (hasAccess && !organization && !loading) {
      loadData();
    } else if (hasAccess && organization) {
      setStats({
        totalDocuments: documents?.length || 0,
        teamMembers: members?.length || 0,
        pendingInvitations: invitations?.length || 0,
        activeMembers: members?.filter(m => m.status === 'active' || !m.status).length || 0
      });
      setLoading(false);
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [
    hasAccess, 
    organization, 
    fetchDashboardData, 
    loading, 
    documents, 
    members, 
    invitations
  ]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isExpiringSoon = (expiresAt) => {
    if (!expiresAt) return false;
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 2;
  };

  // Manager Dashboard Stats Component
  const ManagerDashboardStats = () => {
    if (!isManager || !managerDashboard?.overview) return null;

    const overview = managerDashboard.overview || {};
    const teamManagement = managerDashboard.pendingActions || {};
    
    const managerStats = [
      {
        title: 'Team Size',
        value: overview.team_size || 0,
        color: 'from-blue-500 to-blue-600',
        icon: <GroupIcon className="text-white text-2xl" />
      },
      {
        title: 'Direct Reports',
        value: overview.direct_reports || 0,
        color: 'from-green-500 to-green-600',
        icon: <AnalyticsIcon className="text-white text-2xl" />
      },
      {
        title: 'Team Performance',
        value: `${overview.team_performance || 0}%`,
        color: 'from-purple-500 to-purple-600',
        icon: <AssessmentIcon className="text-white text-2xl" />
      },
      {
        title: 'Pending Approvals',
        value: teamManagement.pending_approvals || 0,
        color: 'from-orange-500 to-orange-600',
        icon: <ScheduleIcon className="text-white text-2xl" />
      }
    ];

    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg shadow-sm mb-6 border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Manager Dashboard</h3>
          <Link 
            to="/dashboard/manager" 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            View Full Dashboard
            <DashboardIcon fontSize="small" />
          </Link>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {managerStats.map((stat, index) => (
            <div 
              key={index}
              className={`bg-gradient-to-r ${stat.color} text-white p-4 rounded-lg text-center transform transition-all duration-300 hover:scale-105`}
            >
              <div className="flex justify-center mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-blue-100 text-sm">{stat.title}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/dashboard/manager?tab=approvals"
            className="bg-white p-4 rounded-lg border border-blue-200 hover:border-blue-400 transition-colors text-center"
          >
            <div className="text-blue-600 mb-2">
              <CheckCircleIcon fontSize="large" />
            </div>
            <div className="font-medium text-gray-900">Approve Requests</div>
            <div className="text-sm text-gray-600">{teamManagement.pending_approvals || 0} pending</div>
          </Link>
          
          <Link
            to="/dashboard/manager?tab=reviews"
            className="bg-white p-4 rounded-lg border border-blue-200 hover:border-blue-400 transition-colors text-center"
          >
            <div className="text-green-600 mb-2">
              <EditIcon fontSize="large" />
            </div>
            <div className="font-medium text-gray-900">Schedule Reviews</div>
            <div className="text-sm text-gray-600">{teamManagement.performance_reviews || 0} due</div>
          </Link>
          
          <Link
            to="/dashboard/manager?tab=training"
            className="bg-white p-4 rounded-lg border border-blue-200 hover:border-blue-400 transition-colors text-center"
          >
            <div className="text-purple-600 mb-2">
              <WorkIcon fontSize="large" />
            </div>
            <div className="font-medium text-gray-900">Assign Training</div>
            <div className="text-sm text-gray-600">{teamManagement.training_requirements || 0} needed</div>
          </Link>
        </div>
      </div>
    );
  };

  // Social Worker Dashboard Stats Component
  const SocialWorkerDashboardStats = () => {
    if (!isSocialWorker || !socialWorkerStats) return null;

    const statsData = [
      {
        title: 'Total Cases',
        value: socialWorkerStats.totalCases || 0,
        color: 'from-blue-500 to-blue-600',
        icon: <AssessmentIcon className="text-white text-2xl" />
      },
      {
        title: 'Active Cases',
        value: socialWorkerStats.activeCases || 0,
        color: 'from-green-500 to-green-600',
        icon: <AnalyticsIcon className="text-white text-2xl" />
      },
      {
        title: 'Urgent Cases',
        value: socialWorkerStats.urgentCases || 0,
        color: 'from-red-500 to-red-600',
        icon: <WarningIcon className="text-white text-2xl" />
      },
      {
        title: 'Satisfaction',
        value: `${socialWorkerStats.satisfactionScore || 0}%`,
        color: 'from-purple-500 to-purple-600',
        icon: <CheckCircleIcon className="text-white text-2xl" />
      }
    ];

    return (
      <div className="bg-gradient-to-r from-green-50 to-teal-50 p-6 rounded-lg shadow-sm mb-6 border border-green-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Social Worker Dashboard</h3>
          <Link 
            to="/dashboard/social-worker" 
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            View Full Dashboard
            <DashboardIcon fontSize="small" />
          </Link>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {statsData.map((stat, index) => (
            <div 
              key={index}
              className={`bg-gradient-to-r ${stat.color} text-white p-4 rounded-lg text-center transform transition-all duration-300 hover:scale-105`}
            >
              <div className="flex justify-center mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-green-100 text-sm">{stat.title}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/dashboard/social-worker?tab=cases"
            className="bg-white p-4 rounded-lg border border-green-200 hover:border-green-400 transition-colors text-center"
          >
            <div className="text-green-600 mb-2">
              <AssessmentIcon fontSize="large" />
            </div>
            <div className="font-medium text-gray-900">Manage Cases</div>
            <div className="text-sm text-gray-600">{socialWorkerStats.activeCases || 0} active</div>
          </Link>
          
          <Link
            to="/dashboard/social-worker?tab=visits"
            className="bg-white p-4 rounded-lg border border-green-200 hover:border-green-400 transition-colors text-center"
          >
            <div className="text-blue-600 mb-2">
              <ScheduleIcon fontSize="large" />
            </div>
            <div className="font-medium text-gray-900">Schedule Visits</div>
            <div className="text-sm text-gray-600">Plan client visits</div>
          </Link>
          
          <Link
            to="/dashboard/social-worker?tab=reports"
            className="bg-white p-4 rounded-lg border border-green-200 hover:border-green-400 transition-colors text-center"
          >
            <div className="text-purple-600 mb-2">
              <AnalyticsIcon fontSize="large" />
            </div>
            <div className="font-medium text-gray-900">View Reports</div>
            <div className="text-sm text-gray-600">Case progress & analytics</div>
          </Link>
        </div>
      </div>
    );
  };

  const getDashboardCards = () => {
    const allCards = [
      {
        title: 'Sheets',
        description: 'Create and manage spreadsheets with real-time collaboration',
        icon: <SheetsIcon className="text-white text-2xl" />,
        path: '/sheets',
        color: 'from-green-500 to-green-600',
        roles: ['OWNER', 'EXECUTIVE', 'ADMIN', 'MANAGER', 'HR', 'FINANCE', 'SOCIAL_WORKER', 'MEMBER']
      },
      {
        title: 'Team Chat',
        description: 'Real-time messaging with your team members',
        icon: <ChatIcon className="text-white text-2xl" />,
        path: '/chat',
        color: 'from-blue-500 to-blue-600',
        roles: ['OWNER', 'EXECUTIVE', 'ADMIN', 'MANAGER', 'HR', 'FINANCE', 'SOCIAL_WORKER', 'MEMBER']
      },
      {
        title: 'Overview',
        description: 'Organization overview and analytics',
        icon: <DashboardIcon className="text-white text-2xl" />,
        path: '/dashboard/overview',
        color: 'from-blue-500 to-blue-600',
        roles: ['OWNER', 'EXECUTIVE', 'ADMIN', 'MANAGER', 'HR', 'FINANCE', 'SOCIAL_WORKER', 'MEMBER']
      },
      {
        title: 'Manager Dashboard',
        description: 'Team management and performance tracking',
        icon: <GroupIcon className="text-white text-2xl" />,
        path: '/dashboard/manager',
        color: 'from-indigo-500 to-indigo-600',
        roles: ['OWNER', 'EXECUTIVE', 'ADMIN', 'MANAGER']
      },
      {
        title: 'Social Worker Dashboard',
        description: 'Case management and client tracking',
        icon: <PersonIcon className="text-white text-2xl" />,
        path: '/dashboard/social-worker',
        color: 'from-teal-500 to-teal-600',
        roles: ['OWNER', 'EXECUTIVE', 'ADMIN', 'SOCIAL_WORKER']
      },
      {
        title: 'Financial',
        description: 'Financial reports and revenue tracking',
        icon: <AnalyticsIcon className="text-white text-2xl" />,
        path: '/dashboard/financial',
        color: 'from-emerald-500 to-emerald-600',
        roles: ['OWNER', 'EXECUTIVE', 'ADMIN', 'FINANCE']
      },
      {
        title: 'HR Dashboard',
        description: 'Human resources and employee management',
        icon: <WorkIcon className="text-white text-2xl" />,
        color: 'from-purple-500 to-purple-600',
        path: '/dashboard/hr',
        roles: ['OWNER', 'EXECUTIVE', 'ADMIN', 'HR', 'MANAGER']
      },
      {
        title: 'Organization',
        description: 'Manage organization settings and team',
        icon: <BusinessIcon className="text-white text-2xl" />,
        path: '/organization',
        color: 'from-indigo-500 to-indigo-600',
        roles: ['OWNER', 'EXECUTIVE', 'ADMIN', 'MANAGER', 'HR']
      },
      {
        title: 'Profile',
        description: 'Your personal profile and settings',
        icon: <PersonIcon className="text-white text-2xl" />,
        path: '/profile',
        color: 'from-cyan-500 to-cyan-600',
        roles: ['OWNER', 'EXECUTIVE', 'ADMIN', 'MANAGER', 'HR', 'FINANCE', 'SOCIAL_WORKER', 'MEMBER']
      }
    ];

    return allCards.filter(card => card.roles.includes(effectiveUserRole));
  };

  const dashboardCards = getDashboardCards();

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-blue-800 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-bold transition-all duration-300 hover:scale-105">
                  Paperless System
                </h1>
              </div>
              <div className="flex items-center space-x-6">
                <nav className="flex space-x-4">
                  <Link 
                    to="/sheets" 
                    className="text-white hover:text-blue-200 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:bg-blue-700 hover:-translate-y-0.5"
                  >
                    Sheets
                  </Link>
                  <Link 
                    to="/profile" 
                    className="text-white hover:text-blue-200 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:bg-blue-700 hover:-translate-y-0.5"
                  >
                    Profile
                  </Link>
                </nav>
                <div className="flex items-center space-x-4 border-l border-blue-600 pl-4">
                  <span className="text-sm transition-all duration-300 hover:text-blue-200">
                    Welcome, {user?.first_name} {user?.last_name}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:bg-blue-500 hover:scale-105 active:scale-95"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white rounded-lg shadow-sm p-8 text-center border border-blue-100">
              <div className="w-24 h-24 mx-auto mb-6 bg-yellow-100 rounded-full flex items-center justify-center">
                <WarningIcon className="text-yellow-600 text-4xl" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Access Restricted
              </h1>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                This dashboard is only available to organization owners and executives. 
                Please contact your administrator if you believe this is a mistake.
              </p>
              <div className="flex justify-center space-x-4">
                <Link
                  to="/sheets"
                  className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <SheetsIcon />
                  Go to Sheets
                </Link>
                <Link
                  to="/profile"
                  className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors flex items-center gap-2"
                >
                  <PersonIcon />
                  View Profile
                </Link>
              </div>
              <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">Your Current Role</h3>
                <p className="text-blue-700 capitalize">{effectiveUserRole?.toLowerCase() || 'No role assigned'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ChatAuthProvider>
      <ChatWebSocketProvider>
        <div className="min-h-screen bg-gray-50">
          {/* Animated Navbar */}
          <div className="bg-blue-800 text-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                  <h1 className="text-xl font-bold transition-all duration-300 hover:scale-105">
                    Paperless System
                  </h1>
                </div>
                <div className="flex items-center space-x-6">
                  <nav className="flex space-x-4">
                    <Link 
                      to="/sheets" 
                      className="text-white hover:text-blue-200 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:bg-blue-700 hover:-translate-y-0.5 flex items-center gap-1"
                    >
                      <SheetsIcon fontSize="small" />
                      Sheets
                    </Link>
                    <Link 
                      to="/chat" 
                      className="text-white hover:text-blue-200 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:bg-blue-700 hover:-translate-y-0.5 flex items-center gap-1"
                    >
                      <ChatIcon fontSize="small" />
                      Chat
                    </Link>
                    <Link 
                      to="/dashboard" 
                      className="text-white hover:text-blue-200 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:bg-blue-700 hover:-translate-y-0.5 flex items-center gap-1"
                    >
                      <DashboardIcon fontSize="small" />
                      Dashboard
                    </Link>
                    {isManager && (
                      <Link 
                        to="/dashboard/manager" 
                        className="text-white hover:text-blue-200 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:bg-blue-700 hover:-translate-y-0.5 flex items-center gap-1"
                      >
                        <GroupIcon fontSize="small" />
                        Manager Dashboard
                      </Link>
                    )}
                    {isSocialWorker && (
                      <Link 
                        to="/dashboard/social-worker" 
                        className="text-white hover:text-blue-200 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:bg-blue-700 hover:-translate-y-0.5 flex items-center gap-1"
                      >
                        <PersonIcon fontSize="small" />
                        Social Worker Dashboard
                      </Link>
                    )}
                    <Link 
                      to="/organization" 
                      className="text-white hover:text-blue-200 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:bg-blue-700 hover:-translate-y-0.5 flex items-center gap-1"
                    >
                      <BusinessIcon fontSize="small" />
                      Organization
                    </Link>
                    <Link 
                      to="/profile" 
                      className="text-white hover:text-blue-200 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:bg-blue-700 hover:-translate-y-0.5 flex items-center gap-1"
                    >
                      <PersonIcon fontSize="small" />
                      Profile
                    </Link>
                  </nav>
                  <div className="flex items-center space-x-4 border-l border-blue-600 pl-4">
                    {/* Profile Dropdown */}
                    <div className="relative" ref={profileDropdownRef}>
                      <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center space-x-3 p-2 text-blue-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center relative">
                          {user?.profile_picture_url ? (
                            <img 
                              src={user.profile_picture_url} 
                              alt="Profile" 
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-medium">
                              {user?.first_name?.[0] || user?.email?.[0] || 'U'}
                            </span>
                          )}
                          {isUpdatingProfile && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                              <CircularProgress size={16} style={{ color: 'white' }} />
                            </div>
                          )}
                        </div>
                        <span className="hidden sm:block text-sm font-medium">
                          {user?.first_name || user?.email}
                        </span>
                      </button>

                      {isProfileOpen && (
                        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                          <div className="px-4 py-3 border-b border-gray-100">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className="relative">
                                {user?.profile_picture_url ? (
                                  <img 
                                    src={user.profile_picture_url} 
                                    alt="Profile" 
                                    className="w-12 h-12 rounded-full object-cover"
                                  />
                                ) : (
                                  <Avatar className="w-12 h-12 bg-blue-500">
                                    {user?.first_name?.[0] || user?.email?.[0] || 'U'}
                                  </Avatar>
                                )}
                                <input
                                  type="file"
                                  ref={fileInputRef}
                                  onChange={handleProfilePictureUpdate}
                                  accept="image/*"
                                  className="hidden"
                                />
                                <button
                                  onClick={triggerFileInput}
                                  disabled={isUpdatingProfile}
                                  className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs hover:bg-blue-700 transition-colors"
                                  title="Change photo"
                                >
                                  <CameraIcon fontSize="small" />
                                </button>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {user?.first_name} {user?.last_name}
                                </p>
                                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                <p className="text-xs text-blue-600 mt-1">{effectiveUserRole || 'Manager'}</p>
                              </div>
                            </div>
                            {organization && (
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <BusinessIcon fontSize="small" />
                                <span className="truncate">{organization.name}</span>
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              setIsProfileDialogOpen(true);
                              setIsProfileOpen(false);
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 gap-2"
                          >
                            <EditIcon fontSize="small" />
                            Edit Profile
                          </button>
                          <Link
                            to="/dashboard/settings"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 gap-2"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            <SettingsIcon fontSize="small" />
                            Settings
                          </Link>
                          <button
                            onClick={handleLogout}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 border-t border-gray-100 gap-2"
                          >
                            <LogoutIcon fontSize="small" />
                            Sign out
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                  <div className="flex">
                    <WarningIcon className="w-5 h-5 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm">{error}</p>
                      <button 
                        onClick={fetchDashboardData}
                        className="text-red-600 hover:text-red-800 text-sm font-medium mt-1"
                      >
                        Try again
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Manager Dashboard Section */}
              {isManager && <ManagerDashboardStats />}

              {/* Social Worker Dashboard Section */}
              {isSocialWorker && <SocialWorkerDashboardStats />}

              {/* Welcome Section */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-blue-100">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Welcome back, {user?.first_name}!
                </h1>
                <p className="text-gray-600">
                  {organization 
                    ? `Here's what's happening with ${organization.name} today.`
                    : 'Get started by creating or joining an organization.'
                  }
                </p>
                <div className="mt-2 flex items-center space-x-3">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {effectiveUserRole} ACCESS
                  </span>
                  <Link
                    to="/sheets"
                    className="bg-green-600 text-white px-4 py-1 rounded-full text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-1"
                  >
                    <SheetsIcon fontSize="small" />
                    Launch Sheets
                  </Link>
                  <button
                    onClick={toggleChat}
                    className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-1"
                  >
                    <ChatIcon fontSize="small" />
                    Team Chat
                  </button>
                  {isManager && (
                    <Link
                      to="/dashboard/manager"
                      className="bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-1"
                    >
                      <GroupIcon fontSize="small" />
                      Manager Dashboard
                    </Link>
                  )}
                  {isSocialWorker && (
                    <Link
                      to="/dashboard/social-worker"
                      className="bg-teal-600 text-white px-4 py-1 rounded-full text-sm font-medium hover:bg-teal-700 transition-colors flex items-center gap-1"
                    >
                      <PersonIcon fontSize="small" />
                      Social Worker Dashboard
                    </Link>
                  )}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
                  <div className="flex items-center gap-2 mb-2">
                    <SheetsIcon className="text-green-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Sheets</h3>
                  </div>
                  <p className="text-3xl font-bold text-green-800">{stats.totalDocuments}</p>
                  <p className="text-sm text-gray-500">Total spreadsheets</p>
                  <Link 
                    to="/sheets" 
                    className="text-green-600 hover:text-green-800 text-sm font-medium mt-2 inline-block flex items-center gap-1"
                  >
                    Create New
                    <SheetsIcon fontSize="small" />
                  </Link>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
                  <div className="flex items-center gap-2 mb-2">
                    <ChatIcon className="text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Team Chat</h3>
                  </div>
                  <p className="text-3xl font-bold text-blue-800">{stats.teamMembers}</p>
                  <p className="text-sm text-gray-500">Active team members</p>
                  <button
                    onClick={toggleChat}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-2 inline-block flex items-center gap-1"
                  >
                    Start Chatting
                    <ChatIcon fontSize="small" />
                  </button>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-orange-500">
                  <div className="flex items-center gap-2 mb-2">
                    <PersonIcon className="text-orange-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Active Members</h3>
                  </div>
                  <p className="text-3xl font-bold text-orange-800">{stats.activeMembers}</p>
                  <p className="text-sm text-gray-500">Currently active</p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-purple-500">
                  <div className="flex items-center gap-2 mb-2">
                    <EmailIcon className="text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Pending Invites</h3>
                  </div>
                  <p className="text-3xl font-bold text-purple-800">{stats.pendingInvitations}</p>
                  <p className="text-sm text-gray-500">Awaiting response</p>
                </div>
              </div>

              {/* Available Dashboards Grid */}
              <div className="bg-white p-6 rounded-lg shadow-sm mb-6 border border-blue-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Dashboards</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dashboardCards.map((dashboard, index) => (
                    <Link
                      key={index}
                      to={dashboard.path}
                      className={`block p-4 rounded-lg bg-gradient-to-r ${dashboard.color} text-white transform transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                        dashboard.title === 'Sheets' ? 'ring-2 ring-green-300 ring-opacity-50' : ''
                      } ${
                        dashboard.title === 'Team Chat' ? 'ring-2 ring-blue-300 ring-opacity-50' : ''
                      } ${
                        dashboard.title === 'Manager Dashboard' ? 'ring-2 ring-indigo-300 ring-opacity-50' : ''
                      } ${
                        dashboard.title === 'Social Worker Dashboard' ? 'ring-2 ring-teal-300 ring-opacity-50' : ''
                      }`}
                    >
                      <div className="flex items-center mb-2">
                        <div className="mr-3">
                          {dashboard.icon}
                        </div>
                        <h4 className="text-lg font-semibold">{dashboard.title}</h4>
                      </div>
                      <p className="text-blue-100 text-sm">{dashboard.description}</p>
                      <div className="mt-3 flex justify-between items-center">
                        <span className="text-blue-200 text-sm">View →</span>
                        {dashboard.title === 'Sheets' && (
                          <span className="bg-green-400 text-green-900 text-xs px-2 py-1 rounded-full font-medium">
                            NEW
                          </span>
                        )}
                        {dashboard.title === 'Team Chat' && (
                          <span className="bg-blue-400 text-blue-900 text-xs px-2 py-1 rounded-full font-medium">
                            CHAT
                          </span>
                        )}
                        {dashboard.title === 'Manager Dashboard' && (
                          <span className="bg-indigo-400 text-indigo-900 text-xs px-2 py-1 rounded-full font-medium">
                            MANAGER
                          </span>
                        )}
                        {dashboard.title === 'Social Worker Dashboard' && (
                          <span className="bg-teal-400 text-teal-900 text-xs px-2 py-1 rounded-full font-medium">
                            SOCIAL WORKER
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Two Column Layout for Members and Invitations */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Team Members Preview */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-blue-100">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <PeopleIcon />
                      Team Members
                    </h3>
                    <Link 
                      to="/organization" 
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View all
                    </Link>
                  </div>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {members && members.length > 0 ? (
                      members.slice(0, 6).map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                              <span className="text-blue-800 text-sm font-medium">
                                {member.user?.first_name?.[0]}{member.user?.last_name?.[0] || member.email?.[0].toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {member.user?.first_name} {member.user?.last_name || member.email}
                              </p>
                              <p className="text-sm text-gray-500">{member.user?.email || member.email}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                            member.role === 'OWNER' 
                              ? 'bg-purple-100 text-purple-800'
                              : member.role === 'MANAGER'
                              ? 'bg-blue-100 text-blue-800'
                              : member.role === 'HR'
                              ? 'bg-pink-100 text-pink-800'
                              : member.role === 'ADMIN'
                              ? 'bg-indigo-100 text-indigo-800'
                              : member.role === 'SOCIAL_WORKER'
                              ? 'bg-teal-100 text-teal-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {member.role?.toLowerCase()}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <PeopleIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p>No team members found</p>
                        {effectiveUserRole && ['OWNER', 'MANAGER', 'HR', 'ADMIN'].includes(effectiveUserRole) && (
                          <Link 
                            to="/organization" 
                            className="text-blue-600 hover:text-blue-800 text-sm inline-block mt-2"
                          >
                            Invite your first team member
                          </Link>
                        )}
                      </div>
                    )}
                    {members && members.length > 6 && (
                      <div className="text-center pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                          +{members.length - 6} more team members
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pending Invitations */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-blue-100">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <EmailIcon />
                      Pending Invitations
                    </h3>
                    <Link 
                      to="/organization" 
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View all
                    </Link>
                  </div>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {invitations && invitations.length > 0 ? (
                      invitations.map((invitation) => (
                        <div key={invitation.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium text-gray-900">{invitation.email}</p>
                              <p className="text-sm text-gray-500">
                                Role: {invitation.role}
                              </p>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                              invitation.role === 'OWNER' 
                                ? 'bg-purple-100 text-purple-800'
                                : invitation.role === 'MANAGER'
                                ? 'bg-blue-100 text-blue-800'
                                : invitation.role === 'HR'
                                ? 'bg-pink-100 text-pink-800'
                                : invitation.role === 'ADMIN'
                                ? 'bg-indigo-100 text-indigo-800'
                                : invitation.role === 'SOCIAL_WORKER'
                                ? 'bg-teal-100 text-teal-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {invitation.role?.toLowerCase()}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-xs text-gray-500">
                            <span>Sent: {formatDate(invitation.created_at)}</span>
                            {invitation.expires_at && (
                              <span className={`${isExpiringSoon(invitation.expires_at) ? 'text-orange-600 font-medium' : ''}`}>
                                Expires: {formatDate(invitation.expires_at)}
                                {isExpiringSoon(invitation.expires_at) && <WarningIcon fontSize="small" />}
                              </span>
                            )}
                          </div>
                          {invitation.message && (
                            <p className="text-sm text-gray-600 mt-2 italic">"{invitation.message}"</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <EmailIcon className="w-8 h-8 text-blue-300" />
                        </div>
                        <p className="text-gray-600 mb-4">No pending invitations</p>
                        {effectiveUserRole && ['OWNER', 'MANAGER', 'HR', 'ADMIN'].includes(effectiveUserRole) && (
                          <Link 
                            to="/organization" 
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            <EmailIcon className="w-4 h-4 mr-2" />
                            Send Invitation
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white p-6 rounded-lg shadow-sm mt-6 border border-blue-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Link
                    to="/sheets"
                    className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg text-center hover:bg-green-100 transition-colors group"
                  >
                    <div className="text-green-600 mb-2 group-hover:scale-110 transition-transform">
                      <SheetsIcon fontSize="large" />
                    </div>
                    <span className="font-medium">Sheets</span>
                  </Link>
                  
                  <button
                    onClick={toggleChat}
                    className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-lg text-center hover:bg-blue-100 transition-colors group"
                  >
                    <div className="text-blue-600 mb-2 group-hover:scale-110 transition-transform">
                      <ChatIcon fontSize="large" />
                    </div>
                    <span className="font-medium">Team Chat</span>
                  </button>

                  {isManager && (
                    <Link
                      to="/dashboard/manager"
                      className="bg-indigo-50 border border-indigo-200 text-indigo-700 p-4 rounded-lg text-center hover:bg-indigo-100 transition-colors group"
                    >
                      <div className="text-indigo-600 mb-2 group-hover:scale-110 transition-transform">
                        <GroupIcon fontSize="large" />
                      </div>
                      <span className="font-medium">Manager Dashboard</span>
                    </Link>
                  )}

                  {isSocialWorker && (
                    <Link
                      to="/dashboard/social-worker"
                      className="bg-teal-50 border border-teal-200 text-teal-700 p-4 rounded-lg text-center hover:bg-teal-100 transition-colors group"
                    >
                      <div className="text-teal-600 mb-2 group-hover:scale-110 transition-transform">
                        <PersonIcon fontSize="large" />
                      </div>
                      <span className="font-medium">Social Worker Dashboard</span>
                    </Link>
                  )}
                  
                  <Link
                    to="/organization"
                    className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-lg text-center hover:bg-blue-100 transition-colors"
                  >
                    <div className="text-blue-600 mb-2">
                      <BusinessIcon fontSize="large" />
                    </div>
                    <span className="font-medium">Manage Team</span>
                  </Link>
                  
                  <Link
                    to="/profile"
                    className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-lg text-center hover:bg-blue-100 transition-colors"
                  >
                    <div className="text-blue-600 mb-2">
                      <PersonIcon fontSize="large" />
                    </div>
                    <span className="font-medium">Edit Profile</span>
                  </Link>
                </div>
              </div>

              {/* Organization Details */}
              {organization && (
                <div className="bg-white p-6 rounded-lg shadow-sm mt-6 border border-blue-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <BusinessIcon />
                    Organization Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Organization Name</p>
                      <p className="font-medium text-blue-800">{organization.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Subdomain</p>
                      <p className="font-medium text-blue-800">{organization.subdomain}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        organization.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {organization.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Chat Sidebar */}
          {isChatOpen && (
            <ChatSidebar 
              onClose={() => setIsChatOpen(false)}
              onNewMessage={handleNewMessage}
            />
          )}

          {/* Chat Toggle Button */}
          <ChatToggleButton 
            isChatOpen={isChatOpen}
            onToggle={toggleChat}
            unreadCount={unreadMessages}
          />

          {/* Profile Update Dialog */}
          <ProfileUpdateDialog
            open={isProfileDialogOpen}
            onClose={() => setIsProfileDialogOpen(false)}
            user={user}
            onUpdate={handleProfileUpdate}
            isLoading={isUpdatingProfile}
          />

          {/* Snackbar for notifications */}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={handleCloseSnackbar}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
              {snackbar.message}
            </Alert>
          </Snackbar>
        </div>
      </ChatWebSocketProvider>
    </ChatAuthProvider>
  );
};

export default Dashboard;