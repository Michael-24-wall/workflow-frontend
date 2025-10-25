import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../stores/authStore';

const Dashboard = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-primary-900 text-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">Paperless System</h1>
            </div>
            <div className="flex items-center space-x-6">
              <nav className="flex space-x-4">
                <Link to="/dashboard" className="text-white hover:text-gray-200 px-3 py-2 rounded-md text-sm font-medium">
                  Dashboard
                </Link>
                <Link to="/organization" className="text-white hover:text-gray-200 px-3 py-2 rounded-md text-sm font-medium">
                  Organization
                </Link>
                <Link to="/profile" className="text-white hover:text-gray-200 px-3 py-2 rounded-md text-sm font-medium">
                  Profile
                </Link>
              </nav>
              <div className="flex items-center space-x-4 border-l border-primary-700 pl-4">
                <span className="text-sm">Welcome, {user?.first_name} {user?.last_name}</span>
                <button
                  onClick={handleLogout}
                  className="bg-white text-primary-900 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-100"
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
          {/* Welcome Section */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.first_name}! 👋
            </h1>
            <p className="text-gray-600">
              Here's what's happening with your paperless workflow today.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-primary-500">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Documents</h3>
              <p className="text-3xl font-bold text-primary-900">0</p>
              <p className="text-sm text-gray-500">Total documents</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Team Members</h3>
              <p className="text-3xl font-bold text-green-600">1</p>
              <p className="text-sm text-gray-500">In your organization</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Pending Tasks</h3>
              <p className="text-3xl font-bold text-blue-600">0</p>
              <p className="text-sm text-gray-500">Awaiting your action</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Information */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium">{user?.email}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Full Name:</span>
                  <span className="font-medium">{user?.first_name} {user?.last_name}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Organization:</span>
                  <span className="font-medium">{user?.organization_name || 'No organization'}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Role:</span>
                  <span className="font-medium capitalize">{user?.organization_role || 'No role assigned'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    user?.is_verified 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {user?.is_verified ? 'Verified' : 'Pending Verification'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-4">
                <Link
                  to="/organization"
                  className="bg-primary-50 border border-primary-200 text-primary-700 p-4 rounded-lg hover:bg-primary-100 transition-colors text-center"
                >
                  <div className="text-primary-600 mb-2">
                    <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <span className="font-medium">Manage Team</span>
                </Link>
                
                <Link
                  to="/profile"
                  className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg hover:bg-green-100 transition-colors text-center"
                >
                  <div className="text-green-600 mb-2">
                    <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <span className="font-medium">Edit Profile</span>
                </Link>
                
                <button className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-lg hover:bg-blue-100 transition-colors text-center">
                  <div className="text-blue-600 mb-2">
                    <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span className="font-medium">Create Document</span>
                </button>
                
                <button className="bg-purple-50 border border-purple-200 text-purple-700 p-4 rounded-lg hover:bg-purple-100 transition-colors text-center">
                  <div className="text-purple-600 mb-2">
                    <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="font-medium">View Calendar</span>
                </button>
              </div>
            </div>
          </div>

          {/* Recent Activity (Placeholder) */}
          <div className="bg-white p-6 rounded-lg shadow-sm mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>No recent activity to display</p>
              <p className="text-sm">Your recent actions will appear here</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;