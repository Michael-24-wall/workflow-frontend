import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../stores/authStore';

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
    isLoading: authLoading 
  } = useAuthStore();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    totalDocuments: 0,
    teamMembers: 0,
    pendingInvitations: 0,
    activeMembers: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const effectiveUserRole = useAuthStore(state => state.effectiveUserRole);
  const hasAccess = effectiveUserRole && ['OWNER', 'EXECUTIVE', 'ADMIN', 'MANAGER', 'HR', 'FINANCE'].includes(effectiveUserRole);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [orgResult, invitationsResult, membersResult] = await Promise.all([
        getOrganizationData(),
        getInvitationsData(),
        getMembersData()
      ]);
      
      if (orgResult?.success) {
        // Update stats from all data sources
        setStats({
          totalDocuments: statistics?.total_documents || 0,
          teamMembers: members?.length || 0,
          pendingInvitations: invitations?.length || 0,
          activeMembers: members?.filter(m => m.status === 'active' || !m.status).length || 0
        });
      } else {
        throw new Error(orgResult?.error || 'Failed to fetch organization data');
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
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
  }, [getOrganizationData, getInvitationsData, getMembersData, statistics, members, invitations]);

  // Fixed useEffect with proper dependencies and loading state management
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (!hasAccess || !isMounted) return;
      
      try {
        await fetchDashboardData();
      } catch (err) {
        if (isMounted) {
          console.error('Dashboard data fetch error:', err);
        }
      }
    };

    // Only load data if we don't have organization data
    if (hasAccess && !organization && !loading) {
      loadData();
    } else if (hasAccess && organization) {
      // If we already have organization data, just update stats
      setStats({
        totalDocuments: statistics?.total_documents || 0,
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
  }, [hasAccess, organization, fetchDashboardData, loading, statistics, members, invitations]);

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

  const getDashboardCards = () => {
    const allCards = [
      {
        title: 'Spreadsheet Editor',
        description: 'Create and manage spreadsheets with advanced features',
        icon: '📊',
        path: '/editor',
        color: 'from-green-500 to-green-600',
        roles: ['OWNER', 'EXECUTIVE', 'ADMIN', 'MANAGER', 'HR', 'FINANCE', 'SOCIAL_WORKER', 'MEMBER']
      },
      {
        title: 'Overview',
        description: 'Organization overview and analytics',
        icon: '🏠',
        path: '/dashboard/overview',
        color: 'from-blue-500 to-blue-600',
        roles: ['OWNER', 'EXECUTIVE', 'ADMIN', 'MANAGER', 'HR', 'FINANCE', 'SOCIAL_WORKER', 'MEMBER']
      },
      {
        title: 'Financial',
        description: 'Financial reports and revenue tracking',
        icon: '💰',
        path: '/dashboard/financial',
        color: 'from-emerald-500 to-emerald-600',
        roles: ['OWNER', 'EXECUTIVE', 'ADMIN', 'FINANCE']
      },
      {
        title: 'HR Dashboard',
        description: 'Human resources and employee management',
        icon: '👨‍💼',
        color: 'from-purple-500 to-purple-600',
        path: '/dashboard/hr',
        roles: ['OWNER', 'EXECUTIVE', 'ADMIN', 'HR', 'MANAGER']
      },
      {
        title: 'Team',
        description: 'Manage team members and collaboration',
        icon: '👥',
        path: '/dashboard/team',
        color: 'from-indigo-500 to-indigo-600',
        roles: ['OWNER', 'EXECUTIVE', 'ADMIN', 'MANAGER', 'HR']
      },
      {
        title: 'Cases',
        description: 'Case management and tracking',
        icon: '📋',
        path: '/dashboard/cases',
        color: 'from-orange-500 to-orange-600',
        roles: ['OWNER', 'EXECUTIVE', 'ADMIN', 'MANAGER', 'SOCIAL_WORKER']
      },
      {
        title: 'System',
        description: 'System metrics and health monitoring',
        icon: '⚙️',
        path: '/dashboard/system',
        color: 'from-gray-500 to-gray-600',
        roles: ['OWNER', 'EXECUTIVE', 'ADMIN']
      },
      {
        title: 'Analytics',
        description: 'View performance metrics and insights',
        icon: '📈',
        path: '/dashboard/analytics',
        color: 'from-pink-500 to-pink-600',
        roles: ['OWNER', 'EXECUTIVE', 'ADMIN', 'MANAGER']
      },
      {
        title: 'Personal',
        description: 'Your personal dashboard and settings',
        icon: '🎯',
        path: '/dashboard/personal',
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
                  {/* ADD EDITOR LINK TO NAVBAR FOR ALL USERS */}
                  <Link 
                    to="/editor" 
                    className="text-white hover:text-blue-200 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:bg-blue-700 hover:-translate-y-0.5"
                  >
                    Spreadsheet Editor
                  </Link>
                  <Link 
                    to="/dashboard/personal" 
                    className="text-white hover:text-blue-200 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:bg-blue-700 hover:-translate-y-0.5"
                  >
                    Personal Dashboard
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
                <span className="text-4xl">🚫</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Access Restricted
              </h1>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                This dashboard is only available to organization owners and executives. 
                Please contact your administrator if you believe this is a mistake.
              </p>
              <div className="flex justify-center space-x-4">
                {/* ADD EDITOR BUTTON FOR RESTRICTED USERS */}
                <Link
                  to="/editor"
                  className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  Go to Spreadsheet Editor
                </Link>
                <Link
                  to="/dashboard/personal"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Go to Personal Dashboard
                </Link>
                <Link
                  to="/profile"
                  className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
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
                {/* ADD EDITOR LINK TO MAIN NAVBAR */}
                <Link 
                  to="/editor" 
                  className="text-white hover:text-blue-200 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:bg-blue-700 hover:-translate-y-0.5"
                >
                  Spreadsheet Editor
                </Link>
                <Link 
                  to="/dashboard" 
                  className="text-white hover:text-blue-200 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:bg-blue-700 hover:-translate-y-0.5"
                >
                  Dashboard
                </Link>
                <Link 
                  to="/organization" 
                  className="text-white hover:text-blue-200 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:bg-blue-700 hover:-translate-y-0.5"
                >
                  Organization
                </Link>
                <Link 
                  to="/profile" 
                  className="text-white hover:text-blue-200 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:bg-blue-700 hover:-translate-y-0.5"
                >
                  Profile
                </Link>
                <Link 
                  to="/chat" 
                  className="text-white hover:text-blue-200 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:bg-blue-700 hover:-translate-y-0.5"
                >
                  Chat
                </Link>
              </nav>
              <div className="flex items-center space-x-4 border-l border-blue-600 pl-4">
                <span className="text-sm transition-all duration-300 hover:text-blue-200">
                  Welcome, {user?.first_name} {user?.last_name}
                </span>
                <div className="bg-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                  {effectiveUserRole}
                </div>
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              <div className="flex">
                <svg className="w-5 h-5 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
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

          {/* Welcome Section */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-blue-100">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.first_name}! 👋
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
              {/* Quick Access to Editor */}
              <Link
                to="/editor"
                className="bg-green-600 text-white px-4 py-1 rounded-full text-sm font-medium hover:bg-green-700 transition-colors"
              >
                🚀 Launch Spreadsheet Editor
              </Link>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Spreadsheets</h3>
              <p className="text-3xl font-bold text-green-800">{stats.totalDocuments}</p>
              <p className="text-sm text-gray-500">Total documents</p>
              <Link 
                to="/editor" 
                className="text-green-600 hover:text-green-800 text-sm font-medium mt-2 inline-block"
              >
                Create New →
              </Link>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Team Members</h3>
              <p className="text-3xl font-bold text-blue-800">{stats.teamMembers}</p>
              <p className="text-sm text-gray-500">In your organization</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-orange-500">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Active Members</h3>
              <p className="text-3xl font-bold text-orange-800">{stats.activeMembers}</p>
              <p className="text-sm text-gray-500">Currently active</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-purple-500">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Pending Invites</h3>
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
                    dashboard.title === 'Spreadsheet Editor' ? 'ring-2 ring-green-300 ring-opacity-50' : ''
                  }`}
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">{dashboard.icon}</span>
                    <h4 className="text-lg font-semibold">{dashboard.title}</h4>
                  </div>
                  <p className="text-blue-100 text-sm">{dashboard.description}</p>
                  <div className="mt-3 flex justify-between items-center">
                    <span className="text-blue-200 text-sm">View →</span>
                    {dashboard.title === 'Spreadsheet Editor' && (
                      <span className="bg-green-400 text-green-900 text-xs px-2 py-1 rounded-full font-medium">
                        NEW
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
                <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
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
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {member.role?.toLowerCase()}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
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

            {/* Pending Invitations - ALWAYS SHOW THIS SECTION */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-blue-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Pending Invitations</h3>
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
                            {isExpiringSoon(invitation.expires_at) && ' ⚠️'}
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
                      <svg className="w-8 h-8 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-600 mb-4">No pending invitations</p>
                    {effectiveUserRole && ['OWNER', 'MANAGER', 'HR', 'ADMIN'].includes(effectiveUserRole) && (
                      <Link 
                        to="/organization" 
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
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
              {/* ADD SPREADSHEET EDITOR TO QUICK ACTIONS */}
              <Link
                to="/editor"
                className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg text-center hover:bg-green-100 transition-colors group"
              >
                <div className="text-green-600 mb-2 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="font-medium">Spreadsheet Editor</span>
              </Link>
              
              <Link
                to="/organization"
                className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-lg text-center hover:bg-blue-100 transition-colors"
              >
                <div className="text-blue-600 mb-2">
                  <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <span className="font-medium">Manage Team</span>
              </Link>
              
              <Link
                to="/profile"
                className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-lg text-center hover:bg-blue-100 transition-colors"
              >
                <div className="text-blue-600 mb-2">
                  <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <span className="font-medium">Edit Profile</span>
              </Link>
              
              <Link
                to="/chat"
                className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-lg text-center hover:bg-blue-100 transition-colors"
              >
                <div className="text-blue-600 mb-2">
                  <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <span className="font-medium">Start Chat</span>
              </Link>
            </div>
          </div>

          {/* Organization Details */}
          {organization && (
            <div className="bg-white p-6 rounded-lg shadow-sm mt-6 border border-blue-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Organization Details</h3>
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
    </div>
  );
};

export default Dashboard;