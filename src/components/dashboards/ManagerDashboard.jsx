// src/components/dashboards/ManagerDashboard.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useParams, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { 
  Box, 
  Grid, 
  Typography, 
  Paper,
  Alert,
  Button,
  Chip,
  Snackbar,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Avatar,
  CircularProgress
} from '@mui/material';
import {
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  Notifications as NotificationsIcon,
  Refresh as RefreshIcon,
  Groups as GroupsIcon,
  Approval as ApprovalIcon,
  School as SchoolIcon,
  Analytics as AnalyticsIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  CameraAlt as CameraIcon
} from '@mui/icons-material';
import useAuthStore from '../../stores/authStore';
import TeamManagement from '../../manager/TeamManagement';
import PerformanceMetrics from '../../manager/PerformanceMetrics';
import QuickActions from '../../manager/QuickActions';
import LoadingSpinner from '../ui/LoadingSpinner';

// Navigation item component
const NavItem = ({ item, isActive, onNavigate }) => (
  <Link
    to={item.path}
    onClick={onNavigate}
    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'bg-white/20 text-white shadow-lg'
        : 'text-blue-100 hover:bg-white/10 hover:text-white'
    }`}
  >
    <span className="mr-2">{item.icon}</span>
    {item.label}
  </Link>
);

// Stats card component
const StatCard = ({ stat }) => (
  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
        <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
        <p className="text-sm text-gray-500 mt-1">{stat.subtitle}</p>
      </div>
      <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl flex items-center justify-center">
        <span className="text-2xl text-blue-600">{stat.icon}</span>
      </div>
    </div>
  </div>
);

// Quick action component
const QuickAction = ({ action }) => (
  <div 
    className={`p-5 rounded-xl text-white ${action.color} transition-all duration-200 hover:scale-105 hover:shadow-lg cursor-pointer`}
    onClick={action.onClick}
  >
    <div className="flex items-center space-x-4">
      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
        <span className="text-2xl">{action.icon}</span>
      </div>
      <div>
        <p className="font-bold text-lg">{action.label}</p>
        <p className="text-sm opacity-90 mt-1">{action.description}</p>
      </div>
    </div>
  </div>
);

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

    // Basic validation
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

const ManagerDashboard = () => {
  const { organizationSlug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    user,
    organization,
    currentDashboard,
    dashboardData,
    isLoading,
    error,
    getManagerDashboard,
    clearError,
    forceRefreshManagerDashboard,
    userRole,
    dashboard_role,
    logout,
    updateProfile,
    uploadProfilePicture
  } = useAuthStore();

  const [activeTab, setActiveTab] = useState('overview');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const profileDropdownRef = useRef(null);
  const fileInputRef = useRef(null);

  // Map URL paths to tab values
  const tabMap = {
    '/dashboard/manager/overview': 'overview',
    '/dashboard/manager/team': 'team',
    '/dashboard/manager/performance': 'performance',
    '/dashboard/manager/approvals': 'approvals',
    '/dashboard/manager/training': 'training',
    '/dashboard/manager/analytics': 'analytics'
  };

  // Set active tab based on current route
  useEffect(() => {
    const currentPath = location.pathname;
    const matchedTab = Object.keys(tabMap).find(path => currentPath.includes(path));
    if (matchedTab) {
      setActiveTab(tabMap[matchedTab]);
    }
  }, [location.pathname]);

  // Fetch dashboard data on component mount
  useEffect(() => {
    const initializeDashboard = async () => {
      if (organizationSlug) {
        await loadManagerData();
      }
    };

    initializeDashboard();
  }, [organizationSlug]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadManagerData = async () => {
    const result = await getManagerDashboard();
    if (result.success) {
      setLastUpdated(new Date().toLocaleTimeString());
      showSnackbar('Manager dashboard data loaded successfully', 'success');
    } else {
      showSnackbar(result.error || 'Failed to load dashboard data', 'error');
    }
  };

  const handleRefresh = async () => {
    const result = await forceRefreshManagerDashboard();
    if (result.success) {
      await loadManagerData();
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    clearError();
    
    // Navigate to the corresponding route
    const routeMap = {
      overview: '/dashboard/manager/overview',
      team: '/dashboard/manager/team',
      performance: '/dashboard/manager/performance',
      approvals: '/dashboard/manager/approvals',
      training: '/dashboard/manager/training',
      analytics: '/dashboard/manager/analytics'
    };
    
    if (routeMap[newValue]) {
      navigate(routeMap[newValue]);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  const handleMobileNavClick = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

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

    // Validate file
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
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Get real manager data from backend response
  const managerData = dashboardData.manager?.data || dashboardData.manager || {};
  const accessInfo = dashboardData.manager?.access_info || {};
  
  console.log('🔍 Manager Dashboard Data:', managerData);
  console.log('🔍 Access Info:', accessInfo);

  // Extract real data from backend response
  const overview = managerData.manager_overview || {};
  const teamManagement = managerData.team_management || {};
  const teamMembers = managerData.team_members || [];

  // Memoized navigation items
  const navItems = useMemo(() => {
    const baseItems = [
      { path: '/dashboard/manager/overview', label: 'Overview', icon: '📊', exact: true },
      { path: '/dashboard/manager/team', label: 'Team Management', icon: '👥' },
      { path: '/dashboard/manager/performance', label: 'Performance', icon: '⭐' },
      { path: '/dashboard/manager/approvals', label: 'Approvals', icon: '✅' },
      { path: '/dashboard/manager/training', label: 'Training', icon: '🎓' },
      { path: '/dashboard/manager/analytics', label: 'Analytics', icon: '📈' },
    ];

    return baseItems;
  }, []);

  // Memoized quick actions
  const quickActions = useMemo(() => [
    { 
      label: 'Approve Requests', 
      icon: '✅', 
      color: 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800',
      description: 'Review pending approvals',
      onClick: () => navigate('/dashboard/manager/approvals')
    },
    { 
      label: 'Schedule Review', 
      icon: '⭐', 
      color: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800',
      description: 'Schedule performance reviews',
      onClick: () => navigate('/dashboard/manager/performance')
    },
    { 
      label: 'Assign Training', 
      icon: '🎓', 
      color: 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800',
      description: 'Manage team training',
      onClick: () => navigate('/dashboard/manager/training')
    },
    { 
      label: 'Team Analytics', 
      icon: '📊', 
      color: 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800',
      description: 'View team metrics',
      onClick: () => navigate('/dashboard/manager/analytics')
    },
  ], [navigate]);

  // Memoized stats display
  const displayStats = useMemo(() => [
    {
      label: 'Team Size',
      value: overview.team_size || teamMembers.length || 0,
      icon: '👥',
      subtitle: 'Total Members'
    },
    {
      label: 'Direct Reports',
      value: overview.direct_reports || 0,
      icon: '👤',
      subtitle: 'Team Members'
    },
    {
      label: 'Team Performance',
      value: `${overview.team_performance || 0}%`,
      icon: '📈',
      subtitle: 'Overall Score'
    },
    {
      label: 'Pending Approvals',
      value: teamManagement.pending_approvals || 0,
      icon: '⏳',
      subtitle: 'Require Action'
    }
  ], [overview, teamManagement, teamMembers]);

  if (isLoading && !managerData) {
    return <LoadingSpinner message="Loading Manager Dashboard..." />;
  }

  // Tab content components
  const tabContent = {
    overview: (
      <div className="space-y-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
            <span className="text-sm text-gray-500">{quickActions.length} available</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickActions.map((action) => (
              <QuickAction key={action.label} action={action} />
            ))}
          </div>
        </div>

        {/* Team Overview Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Team Overview</h3>
            {isLoading ? (
              <div className="text-center py-8">Loading overview data...</div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{teamManagement.pending_approvals || 0}</div>
                  <div className="text-sm text-gray-600 mt-1">Pending Approvals</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{teamManagement.performance_reviews || 0}</div>
                  <div className="text-sm text-gray-600 mt-1">Performance Reviews</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{teamManagement.training_requirements || 0}</div>
                  <div className="text-sm text-gray-600 mt-1">Training Requirements</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{overview.active_projects || overview.team_size || 0}</div>
                  <div className="text-sm text-gray-600 mt-1">Active Projects</div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Stats</h3>
            {isLoading ? (
              <div className="text-center py-8">Loading stats...</div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Team Capacity:</span>
                  <span className="font-bold">{overview.team_capacity || 0}%</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Department:</span>
                  <span className="font-bold">{overview.department || 'Operations'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Shift Coverage:</span>
                  <span className="font-bold">{overview.shift_coverage || '0%'}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Operational Efficiency:</span>
                  <span className="font-bold">{overview.operational_efficiency || 0}%</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    ),
    
    team: (
      <TeamManagement 
        teamMembers={teamMembers}
        teamManagement={teamManagement}
        isLoading={isLoading}
      />
    ),
    
    performance: (
      <PerformanceMetrics 
        overview={overview}
        teamManagement={teamManagement}
        isLoading={isLoading}
      />
    ),
    
    approvals: (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Pending Approvals</h2>
        <QuickActions 
          teamManagement={teamManagement}
          onActionComplete={loadManagerData}
          isLoading={isLoading}
        />
      </div>
    ),
    
    training: (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Training Management</h2>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-blue-600">🎓</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Manage Team Training</h3>
          <p className="text-gray-600 mb-4">
            Assign and track training requirements for your team members.
          </p>
          {teamManagement.training_requirements > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 inline-block">
              <p className="text-orange-800 font-medium">
                {teamManagement.training_requirements} training requirements pending
              </p>
            </div>
          )}
        </div>
      </div>
    ),
    
    analytics: (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Team Analytics</h2>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-indigo-600">📈</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Team Performance Analytics</h3>
          <p className="text-gray-600">
            View detailed analytics and performance metrics for your team.
          </p>
        </div>
      </div>
    )
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-900 to-blue-800 shadow-2xl border-b border-blue-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-4">
              <Link 
                to="/dashboard" 
                className="flex items-center space-x-3"
              >
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <span className="text-white text-lg font-bold">👨‍💼</span>
                </div>
                <div>
                  <h1 className="text-white text-xl font-bold">Manager Dashboard</h1>
                  <p className="text-blue-200 text-sm">{organization?.name || 'Organization'}</p>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navItems.map((item) => {
                const isActive = item.exact 
                  ? location.pathname === item.path
                  : location.pathname.startsWith(item.path);
                
                return (
                  <NavItem
                    key={item.path}
                    item={item}
                    isActive={isActive}
                    onNavigate={undefined}
                  />
                );
              })}
            </nav>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {/* Organization Indicator */}
              {organization && (
                <div className="hidden sm:flex items-center space-x-2 px-3 py-1 bg-white/10 rounded-lg">
                  <span className="text-blue-100 text-sm">🏢</span>
                  <span className="text-blue-100 text-sm font-medium">
                    {organization.name}
                  </span>
                </div>
              )}

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="p-2 text-blue-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Refresh data"
              >
                <span className="text-lg">🔄</span>
              </button>

              {/* Team Members Count */}
              <div className="hidden sm:flex items-center space-x-2 px-3 py-1 bg-white/10 rounded-lg">
                <span className="text-blue-100 text-sm">👥</span>
                <span className="text-blue-100 text-sm font-medium">
                  {teamMembers.length} Team Members
                </span>
              </div>

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
                          <p className="text-xs text-blue-600 mt-1">{userRole || 'Manager'}</p>
                        </div>
                      </div>
                      {organization && (
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <span>🏢</span>
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
                      <span>⚙️</span>
                      Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 border-t border-gray-100 gap-2"
                    >
                      <span>🚪</span>
                      Sign out
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 text-blue-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <span className="text-lg">☰</span>
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="lg:hidden border-t border-blue-700 py-4">
              <nav className="grid grid-cols-2 gap-2">
                {navItems.map((item) => {
                  const isActive = item.exact 
                    ? location.pathname === item.path
                    : location.pathname.startsWith(item.path);
                  
                  return (
                    <NavItem
                      key={item.path}
                      item={item}
                      isActive={isActive}
                      onNavigate={handleMobileNavClick}
                    />
                  );
                })}
              </nav>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Last Updated Indicator */}
        {lastUpdated && (
          <div className="flex items-center justify-between mb-6">
            <div className="text-sm text-gray-500">
              Last updated: {lastUpdated}
            </div>
            {isLoading && (
              <div className="flex items-center space-x-2 text-sm text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                <span>Updating...</span>
              </div>
            )}
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <Alert 
            severity="error" 
            onClose={clearError}
            sx={{ mb: 3 }}
            action={
              <Button color="inherit" size="small" onClick={handleRefresh}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {displayStats.map((stat, index) => (
            <StatCard key={stat.label} stat={stat} />
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-400">
          {tabContent[activeTab] || (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Welcome to Manager Dashboard</h2>
              <p className="text-gray-600">
                Select a tab to manage your team and view performance metrics.
              </p>
            </div>
          )}
          
          {/* Nested Routes Content */}
          <Outlet />
        </div>
      </main>

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
  );
};

export default ManagerDashboard;