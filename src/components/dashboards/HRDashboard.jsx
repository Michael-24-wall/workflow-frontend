// src/pages/dashboard/HRDashboard.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';

// Error boundary component
class HRDashboardErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('HR Dashboard Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-4">
              We're having trouble loading the HR Dashboard. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Reload Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Custom hook for HR dashboard data management
const useHRDashboardData = () => {
  const { 
    user, 
    getMembersData, 
    getInvitationsData, 
    getStatisticsData,
    hrDashboard,
    getHRDashboard,
    forceRefreshHRData
  } = useAuthStore();

  const [state, setState] = useState({
    loading: false, // Start with false to prevent immediate fetch
    error: null,
    stats: null,
    recentActivity: [],
    lastUpdated: null
  });

  const dataFetchedRef = useRef(false);
  const abortControllerRef = useRef(null);

  // FIXED: fetchData with proper dependency management
  const fetchData = useCallback(async (forceRefresh = false) => {
    // Prevent multiple simultaneous fetches
    if (state.loading && !forceRefresh) {
      console.log('⏳ Fetch already in progress, skipping...');
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Use HR dashboard data if available and not forcing refresh
      if (hrDashboard.overview && !forceRefresh && dataFetchedRef.current) {
        console.log('📦 Using cached HR dashboard data');
        const overview = hrDashboard.overview;
        
        setState(prev => ({
          ...prev,
          loading: false,
          stats: overview.stats || prev.stats,
          recentActivity: overview.recentActivity || prev.recentActivity,
          lastUpdated: new Date()
        }));
        return;
      }

      console.log('🚀 Fetching fresh HR dashboard data...');
      
      // Fetch HR dashboard data first (most comprehensive)
      const hrResult = await getHRDashboard();
      
      if (hrResult.success && hrResult.data) {
        console.log('✅ HR dashboard data fetched successfully');
        const hrData = hrResult.data;
        
        setState(prev => ({
          ...prev,
          loading: false,
          stats: hrData.stats || prev.stats,
          recentActivity: hrData.recentActivity || prev.recentActivity,
          lastUpdated: new Date()
        }));
        dataFetchedRef.current = true;
        return;
      }

      // If HR dashboard fails, log the error but don't fallback to prevent loops
      console.log('❌ HR dashboard failed, using empty data');
      setState(prev => ({
        ...prev,
        loading: false,
        stats: prev.stats || {
          totalEmployees: 0,
          activeEmployees: 0,
          departments: 0,
          pendingRequests: 0,
          newHires: 0,
          openPositions: 0,
          onLeave: 0,
          turnoverRate: '0%'
        },
        lastUpdated: new Date()
      }));
      dataFetchedRef.current = true;

    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('🛑 Data fetch aborted');
        return;
      }
      
      console.error('❌ HR Dashboard data fetch error:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to load dashboard data'
      }));
      dataFetchedRef.current = true; // Still mark as fetched to prevent retries
    }
  }, [getHRDashboard, hrDashboard.overview, state.loading]);

  const refreshData = useCallback(() => {
    dataFetchedRef.current = false;
    fetchData(true);
  }, [fetchData]);

  // FIXED: Simplified useEffect - only fetch once on mount
  useEffect(() => {
    if (!user || dataFetchedRef.current) {
      return;
    }

    console.log('🎯 Initial HR dashboard data fetch');
    fetchData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [user]); // Only depend on user

  return {
    ...state,
    refreshData,
    fetchData
  };
};

// Skeleton loader component
const DashboardSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-4">
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions & Recent Activity Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-6 animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="p-5 rounded-xl bg-gray-200 animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-300 rounded-xl"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-6 animate-pulse"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start space-x-4 p-4 rounded-xl border border-gray-100 animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Error state component
const DashboardErrorState = ({ error, onRetry }) => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 max-w-md w-full text-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-2xl">⚠️</span>
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Dashboard</h2>
      <p className="text-gray-600 mb-2">{error}</p>
      <p className="text-sm text-gray-500 mb-6">
        Please check your connection and try again.
      </p>
      <div className="space-y-3">
        <button
          onClick={onRetry}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Try Again
        </button>
        <button
          onClick={() => window.location.reload()}
          className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
        >
          Reload Page
        </button>
      </div>
    </div>
  </div>
);

// Main HR Dashboard Component
const HRDashboard = () => {
  const { 
    user, 
    logout, 
    effectiveUserRole,
    organization,
    forceRefreshHRData
  } = useAuthStore();
  
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  const {
    loading,
    error,
    stats,
    recentActivity,
    refreshData,
    lastUpdated
  } = useHRDashboardData();

  // Navigation items with role-based access
  const navItems = useMemo(() => {
    const baseItems = [
      { path: '/dashboard/hr', label: 'Overview', icon: '📊', exact: true, roles: ['OWNER', 'EXECUTIVE', 'ADMIN', 'HR', 'MANAGER'] },
      { path: '/dashboard/hr/employees', label: 'Employees', icon: '👥', roles: ['OWNER', 'EXECUTIVE', 'ADMIN', 'HR', 'MANAGER'] },
      { path: '/dashboard/hr/recruitment', label: 'Recruitment', icon: '💼', roles: ['OWNER', 'EXECUTIVE', 'ADMIN', 'HR'] },
      { path: '/dashboard/hr/performance', label: 'Performance', icon: '⭐', roles: ['OWNER', 'EXECUTIVE', 'ADMIN', 'HR', 'MANAGER'] },
      { path: '/dashboard/hr/leave', label: 'Leave', icon: '🏖️', roles: ['OWNER', 'EXECUTIVE', 'ADMIN', 'HR', 'MANAGER'] },
      { path: '/dashboard/hr/training', label: 'Training', icon: '🎓', roles: ['OWNER', 'EXECUTIVE', 'ADMIN', 'HR'] },
      { path: '/dashboard/hr/compensation', label: 'Compensation', icon: '💰', roles: ['OWNER', 'EXECUTIVE', 'ADMIN', 'HR'] },
      { path: '/dashboard/hr/analytics', label: 'Analytics', icon: '📈', roles: ['OWNER', 'EXECUTIVE', 'ADMIN', 'HR'] },
    ];

    return baseItems.filter(item => item.roles.includes(effectiveUserRole));
  }, [effectiveUserRole]);

  // Quick actions with role-based access
  const quickActions = useMemo(() => {
    const actions = [
      { 
        label: 'Add Employee', 
        icon: '👤', 
        path: '/dashboard/hr/employees/new', 
        color: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800',
        description: 'Add new team member',
        roles: ['OWNER', 'EXECUTIVE', 'ADMIN', 'HR']
      },
      { 
        label: 'Post Job', 
        icon: '💼', 
        path: '/dashboard/hr/recruitment/new', 
        color: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800',
        description: 'Create new job posting',
        roles: ['OWNER', 'EXECUTIVE', 'ADMIN', 'HR']
      },
      { 
        label: 'Schedule Review', 
        icon: '⭐', 
        path: '/dashboard/hr/performance/new', 
        color: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800',
        description: 'Schedule performance review',
        roles: ['OWNER', 'EXECUTIVE', 'ADMIN', 'HR', 'MANAGER']
      },
      { 
        label: 'Generate Report', 
        icon: '📊', 
        path: '/dashboard/hr/analytics', 
        color: 'bg-gradient-to-r from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950',
        description: 'Create HR analytics report',
        roles: ['OWNER', 'EXECUTIVE', 'ADMIN', 'HR']
      },
    ];

    return actions.filter(action => action.roles.includes(effectiveUserRole));
  }, [effectiveUserRole]);

  const formatDate = useCallback((date) => {
    if (!date) return 'Unknown';
    
    try {
      const now = new Date();
      const diffTime = Math.abs(now - new Date(date));
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      return new Date(date).toLocaleDateString();
    } catch (error) {
      console.warn('Error formatting date:', error);
      return 'Invalid date';
    }
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  const handleRefresh = useCallback(async () => {
    setLastRefresh(new Date());
    await refreshData();
    await forceRefreshHRData();
  }, [refreshData, forceRefreshHRData]);

  const handleRetry = useCallback(() => {
    refreshData();
  }, [refreshData]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isProfileOpen && !event.target.closest('.profile-dropdown')) {
        setIsProfileOpen(false);
      }
      if (isNotificationsOpen && !event.target.closest('.notifications-dropdown')) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileOpen, isNotificationsOpen]);

  // Show loading state
  if (loading && !stats) {
    return <DashboardSkeleton />;
  }

  // Show error state
  if (error && !stats) {
    return <DashboardErrorState error={error} onRetry={handleRetry} />;
  }

  return (
    <HRDashboardErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
        {/* Header */}
        <header className="bg-gradient-to-r from-blue-900 to-blue-800 shadow-2xl border-b border-blue-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo and Brand */}
              <div className="flex items-center space-x-4">
                <Link to="/dashboard" className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <span className="text-white text-lg font-bold">HR</span>
                  </div>
                  <div>
                    <h1 className="text-white text-xl font-bold">HR Dashboard</h1>
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
                    <Link
                      key={item.path}
                      to={item.path}
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
                })}
              </nav>

              {/* User Menu */}
              <div className="flex items-center space-x-4">
                {/* Refresh Button */}
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="p-2 text-blue-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  title="Refresh data"
                >
                  <span className="text-lg">🔄</span>
                </button>

                {/* Notifications */}
                <div className="relative notifications-dropdown">
                  <button
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    className="p-2 text-blue-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors relative"
                  >
                    <span className="text-lg">🔔</span>
                  </button>
                </div>

                {/* Profile Dropdown */}
                <div className="relative profile-dropdown">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-3 p-2 text-blue-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {user?.first_name?.[0] || user?.email?.[0] || 'U'}
                      </span>
                    </div>
                    <span className="hidden sm:block text-sm font-medium">
                      {user?.first_name || user?.email}
                    </span>
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{user?.first_name} {user?.last_name}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                        <p className="text-xs text-blue-600 mt-1">{effectiveUserRole}</p>
                      </div>
                      <Link
                        to="/dashboard/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Your Profile
                      </Link>
                      <Link
                        to="/dashboard/settings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 border-t border-gray-100"
                      >
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
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? 'bg-white/20 text-white shadow-lg'
                            : 'text-blue-100 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <span className="mr-2">{item.icon}</span>
                        {item.label}
                      </Link>
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
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
              {loading && (
                <div className="flex items-center space-x-2 text-sm text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                  <span>Updating...</span>
                </div>
              )}
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats && [
              {
                label: 'Total Employees',
                value: stats.totalEmployees || 0,
                icon: '👥',
                change: `${stats.newHires || 0} new this month`,
                changeColor: 'text-green-600'
              },
              {
                label: 'Active Employees',
                value: stats.activeEmployees || 0,
                icon: '✅',
                change: `${stats.totalEmployees > 0 ? ((stats.activeEmployees / stats.totalEmployees) * 100).toFixed(1) : 0}% active rate`,
                changeColor: 'text-gray-600'
              },
              {
                label: 'Departments',
                value: stats.departments || 0,
                icon: '🏢',
                change: 'Across organization',
                changeColor: 'text-gray-600'
              },
              {
                label: 'Pending Requests',
                value: stats.pendingRequests || 0,
                icon: '⏳',
                change: 'Requiring attention',
                changeColor: 'text-blue-600'
              }
            ].map((stat, index) => (
              <div key={stat.label} className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl flex items-center justify-center">
                    <span className="text-2xl text-blue-600">{stat.icon}</span>
                  </div>
                </div>
                <div className="mt-4">
                  <span className={`text-sm ${stat.changeColor}`}>{stat.change}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
                  <span className="text-sm text-gray-500">{quickActions.length} available</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quickActions.map((action) => (
                    <Link 
                      key={action.label} 
                      to={action.path}
                      className={`p-5 rounded-xl text-white ${action.color} transition-all duration-200 hover:scale-105 hover:shadow-lg`}
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
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
                <span className="text-sm text-gray-500">{recentActivity.length} items</span>
              </div>
              <div className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity) => (
                    <div 
                      key={activity.id} 
                      className="flex items-start space-x-4 p-4 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors"
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        activity.type === 'join' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        <span className="text-xl">{activity.type === 'join' ? '👤' : '📨'}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{formatDate(activity.timestamp)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">📝</span>
                    </div>
                    <p>No recent activity</p>
                    <p className="text-sm mt-1">Activity will appear here as it happens</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Outlet for nested routes */}
          <div className="mt-8">
            <Outlet />
          </div>
        </main>
      </div>
    </HRDashboardErrorBoundary>
  );
};

export default HRDashboard;