import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import { organizationAPI } from '../services/api';

const Dashboard = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    totalDocuments: 0,
    teamMembers: 0,
    pendingInvitations: 0,
    activeMembers: 0
  });
  const [members, setMembers] = useState([]);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch organization statistics
      const statsResponse = await organizationAPI.getStatistics();
      if (statsResponse.data) {
        setStats({
          totalDocuments: 0,
          teamMembers: statsResponse.data.total_members || 0,
          pendingInvitations: statsResponse.data.pending_invitations || 0,
          activeMembers: statsResponse.data.active_members || 0
        });
      }

      // Fetch organization members
      const membersResponse = await organizationAPI.getMembers();
      if (membersResponse.data) {
        setMembers(membersResponse.data);
      }

      // Fetch pending invitations
      const invitationsResponse = await organizationAPI.getPendingInvitations();
      if (invitationsResponse.data) {
        setPendingInvitations(invitationsResponse.data);
      }

      // Fetch organization details
      const orgResponse = await organizationAPI.getMyOrganization();
      if (orgResponse.data) {
        setOrganization(orgResponse.data);
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      if (err.response?.status === 404) {
        setError('You are not part of any organization yet.');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to view organization data.');
      } else {
        setError('Failed to load dashboard data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Check if invitation is expiring soon (less than 2 days)
  const isExpiringSoon = (expiresAt) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 2;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
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
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Documents</h3>
              <p className="text-3xl font-bold text-blue-800">{stats.totalDocuments}</p>
              <p className="text-sm text-gray-500">Total documents</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Team Members</h3>
              <p className="text-3xl font-bold text-green-800">{stats.teamMembers}</p>
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                {members.length > 0 ? (
                  members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-blue-800 text-sm font-medium">
                            {member.first_name?.[0]}{member.last_name?.[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {member.first_name} {member.last_name}
                          </p>
                          <p className="text-sm text-gray-500">{member.email}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                        member.organization_role === 'owner' 
                          ? 'bg-purple-100 text-purple-800'
                          : member.organization_role === 'manager'
                          ? 'bg-blue-100 text-blue-800'
                          : member.organization_role === 'hr'
                          ? 'bg-pink-100 text-pink-800'
                          : member.organization_role === 'administrator'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {member.organization_role}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p>No team members found</p>
                    {user?.organization_role && ['owner', 'manager', 'hr', 'administrator'].includes(user.organization_role) && (
                      <Link 
                        to="/organization" 
                        className="text-blue-600 hover:text-blue-800 text-sm inline-block mt-2"
                      >
                        Invite your first team member
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Pending Invitations */}
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
                {pendingInvitations.length > 0 ? (
                  pendingInvitations.map((invitation) => (
                    <div key={invitation.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-gray-900">{invitation.email}</p>
                          <p className="text-sm text-gray-500">
                            Invited by: {invitation.invited_by?.first_name} {invitation.invited_by?.last_name}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                          invitation.role === 'owner' 
                            ? 'bg-purple-100 text-purple-800'
                            : invitation.role === 'manager'
                            ? 'bg-blue-100 text-blue-800'
                            : invitation.role === 'hr'
                            ? 'bg-pink-100 text-pink-800'
                            : invitation.role === 'administrator'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {invitation.role}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>Sent: {formatDate(invitation.created_at)}</span>
                        <span className={`${isExpiringSoon(invitation.expires_at) ? 'text-orange-600 font-medium' : ''}`}>
                          Expires: {formatDate(invitation.expires_at)}
                          {isExpiringSoon(invitation.expires_at) && ' ⚠️'}
                        </span>
                      </div>
                      {invitation.message && (
                        <p className="text-sm text-gray-600 mt-2 italic">"{invitation.message}"</p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>No pending invitations</p>
                    {user?.organization_role && ['owner', 'manager', 'hr', 'administrator'].includes(user.organization_role) && (
                      <Link 
                        to="/organization" 
                        className="text-blue-600 hover:text-blue-800 text-sm inline-block mt-2"
                      >
                        Send your first invitation
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
              
              {user?.organization_role && ['owner', 'manager', 'hr', 'administrator'].includes(user.organization_role) ? (
                <Link
                  to="/organization"
                  className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-lg text-center hover:bg-blue-100 transition-colors"
                >
                  <div className="text-blue-600 mb-2">
                    <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <span className="font-medium">Send Invites</span>
                </Link>
              ) : (
                <Link
                  to="/organization/join"
                  className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-lg text-center hover:bg-blue-100 transition-colors"
                >
                  <div className="text-blue-600 mb-2">
                    <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="font-medium">Join Organization</span>
                </Link>
              )}
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