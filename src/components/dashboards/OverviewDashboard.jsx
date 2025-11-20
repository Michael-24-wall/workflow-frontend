import React from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import InvitationsPanel from '../../components/dashboards/InvitationsPanel'; 
import WorkspaceInvitationsPanel from '../../components/dashboards/WorkspaceInvitationsPanel';
const OverviewDashboard = () => {
  const { user, logout, organization, effectiveUserRole } = useAuthStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      {/* Enhanced Header */}
      <header className="bg-gradient-to-r from-blue-900 to-blue-800 shadow-2xl border-b border-blue-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-2xl ring-4 ring-blue-300/20">
                <span className="text-blue-900 font-bold text-xl">OD</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Overview Dashboard</h1>
                <p className="text-blue-200 text-sm">Executive Summary & Quick Access</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="text-right hidden lg:block">
                <p className="text-sm font-medium text-white">Welcome, {user?.first_name}</p>
                <p className="text-xs text-blue-300">Ready to get started</p>
              </div>
              
              <div className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-2xl border border-white/30">
                <span className="text-sm font-medium capitalize">{effectiveUserRole?.toLowerCase()}</span>
              </div>
              
              <button
                onClick={logout}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-300 border border-white/20 hover:border-white/30"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Organization Info Card */}
          {organization && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Organization Overview</h2>
                <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                  organization.is_active 
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : 'bg-red-100 text-red-800 border border-red-200'
                }`}>
                  {organization.is_active ? 'Active' : 'Inactive'}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <p className="text-sm font-medium text-blue-600 mb-1">Organization Name</p>
                  <p className="text-lg font-semibold text-gray-900">{organization.name}</p>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <p className="text-sm font-medium text-blue-600 mb-1">Subdomain</p>
                  <p className="text-lg font-semibold text-gray-900">{organization.subdomain}</p>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <p className="text-sm font-medium text-blue-600 mb-1">Created Date</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(organization.created_at).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <p className="text-sm font-medium text-blue-600 mb-1">Members</p>
                  <p className="text-lg font-semibold text-gray-900">Active</p>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-8 rounded-2xl shadow-xl transform transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Your Role</h3>
                  <p className="text-3xl font-bold capitalize mb-2">{effectiveUserRole?.toLowerCase()}</p>
                  <p className="text-blue-100 text-sm">Organization access level</p>
                </div>
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                  <span className="text-2xl">🎯</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-8 rounded-2xl shadow-xl transform transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Welcome Back</h3>
                  <p className="text-3xl font-bold mb-2">{user?.first_name}!</p>
                  <p className="text-blue-100 text-sm">Ready to get started</p>
                </div>
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                  <span className="text-2xl">👋</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-700 to-blue-800 text-white p-8 rounded-2xl shadow-xl transform transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">System Status</h3>
                  <p className="text-3xl font-bold mb-2">Active</p>
                  <p className="text-blue-100 text-sm">All systems operational</p>
                </div>
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                  <span className="text-2xl">✅</span>
                </div>
              </div>
            </div>
          </div>

          {/* Invitations Panel - Add this section */}
          <InvitationsPanel />
          <WorkspaceInvitationsPanel />


          {/* Enhanced Quick Links */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Quick Access</h2>
              <p className="text-gray-500 text-sm">Frequently used dashboards</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Link 
                to="/dashboard" 
                className="group bg-gradient-to-br from-blue-600 to-blue-700 text-white p-6 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl">📊</span>
                  </div>
                  <div className="font-bold text-lg mb-2">Main Dashboard</div>
                  <p className="text-blue-100 text-sm">Overview and analytics</p>
                </div>
              </Link>
              
              <Link 
                to="/organization" 
                className="group bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl">🏢</span>
                  </div>
                  <div className="font-bold text-lg mb-2">Organization</div>
                  <p className="text-blue-100 text-sm">Company settings</p>
                </div>
              </Link>
              
              <Link 
                to="/profile" 
                className="group bg-gradient-to-br from-blue-400 to-blue-500 text-white p-6 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl">👤</span>
                  </div>
                  <div className="font-bold text-lg mb-2">Profile</div>
                  <p className="text-blue-100 text-sm">Personal information</p>
                </div>
              </Link>
              
              <Link 
                to="/dashboard/personal" 
                className="group bg-gradient-to-br from-blue-300 to-blue-400 text-white p-6 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <div className="font-bold text-lg mb-2">Personal</div>
                  <p className="text-blue-100 text-sm">Your workspace</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Enhanced Role-based Features */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Available Features</h2>
              <p className="text-gray-500 text-sm">Based on your role permissions</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Admin/Executive Features */}
              {(effectiveUserRole === 'OWNER' || effectiveUserRole === 'EXECUTIVE' || effectiveUserRole === 'ADMIN') && (
                <>
                  <div className="flex items-center p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl border border-blue-200 group hover:shadow-lg transition-all duration-300">
                    <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                      <span className="text-2xl text-white">💰</span>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Financial Dashboard</p>
                      <p className="text-sm text-gray-600 mt-1">Revenue and financial reports</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl border border-blue-200 group hover:shadow-lg transition-all duration-300">
                    <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                      <span className="text-2xl text-white">⚙️</span>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">System Administration</p>
                      <p className="text-sm text-gray-600 mt-1">System settings and metrics</p>
                    </div>
                  </div>
                </>
              )}
              
              {/* HR/Management Features */}
              {(effectiveUserRole === 'OWNER' || effectiveUserRole === 'EXECUTIVE' || effectiveUserRole === 'HR' || effectiveUserRole === 'MANAGER') && (
                <div className="flex items-center p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl border border-blue-200 group hover:shadow-lg transition-all duration-300">
                  <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl text-white">👥</span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">HR Management</p>
                    <p className="text-sm text-gray-600 mt-1">Employee and team management</p>
                  </div>
                </div>
              )}
              
              {/* Universal Features */}
              <div className="flex items-center p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl border border-blue-200 group hover:shadow-lg transition-all duration-300">
                <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl text-white">🎯</span>
                </div>
                <div>
                  <p className="font-bold text-gray-900">Personal Dashboard</p>
                  <p className="text-sm text-gray-600 mt-1">Your personal workspace</p>
                </div>
              </div>
              
              <div className="flex items-center p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl border border-blue-200 group hover:shadow-lg transition-all duration-300">
                <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl text-white">📋</span>
                </div>
                <div>
                  <p className="font-bold text-gray-900">Profile Settings</p>
                  <p className="text-sm text-gray-600 mt-1">Update your personal information</p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Getting Started</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-xl">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">1</span>
                  </div>
                  <p className="text-sm text-gray-700">Complete your profile setup</p>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-xl">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">2</span>
                  </div>
                  <p className="text-sm text-gray-700">Explore available dashboards</p>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-xl">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">3</span>
                  </div>
                  <p className="text-sm text-gray-700">Set up your preferences</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Support</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm text-gray-700">Need help?</span>
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Contact Support
                  </button>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm text-gray-700">Documentation</span>
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    View Guides
                  </button>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm text-gray-700">Training</span>
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Learn More
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewDashboard;