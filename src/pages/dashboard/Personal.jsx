// src/pages/dashboard/Personal.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';

const Personal = () => {
  const { 
    user, 
    organization,
    effectiveUserRole,
    updateProfile,
    uploadProfilePicture,
    removeProfilePicture,
    changePassword,
    isLoading,
    refreshUserProfile
  } = useAuthStore();

  const [activeTab, setActiveTab] = useState('overview');
  const [localLoading, setLocalLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    position: '',
    department: ''
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  // Initialize profile data when user data loads
  useEffect(() => {
    if (user) {
      setProfileData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        position: user.position || '',
        department: user.department || ''
      });
    }
  }, [user]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLocalLoading(true);
    try {
      const result = await updateProfile(profileData);
      if (result.success) {
        setEditMode(false);
        // Refresh user profile to get updated data
        await refreshUserProfile();
      }
    } catch (error) {
      console.error('Profile update error:', error);
    } finally {
      setLocalLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      alert('New passwords do not match');
      return;
    }
    
    setLocalLoading(true);
    try {
      const result = await changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });
      
      if (result.success) {
        setPasswordData({
          current_password: '',
          new_password: '',
          confirm_password: ''
        });
        alert('Password updated successfully');
      }
    } catch (error) {
      console.error('Password change error:', error);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setLocalLoading(true);
      try {
        await uploadProfilePicture(file);
        await refreshUserProfile();
      } catch (error) {
        console.error('Image upload error:', error);
      } finally {
        setLocalLoading(false);
      }
    }
  };

  const handleRemoveImage = async () => {
    setLocalLoading(true);
    try {
      await removeProfilePicture();
      await refreshUserProfile();
    } catch (error) {
      console.error('Image removal error:', error);
    } finally {
      setLocalLoading(false);
    }
  };

  // Mock data for personal stats and activities
  const personalStats = {
    tasksCompleted: 12,
    pendingReviews: 3,
    trainingHours: 24,
    upcomingDeadlines: 2
  };

  const recentActivities = [
    {
      id: 1,
      type: 'task',
      message: 'Completed quarterly report',
      timestamp: new Date('2024-02-20'),
      status: 'completed'
    },
    {
      id: 2,
      type: 'training',
      message: 'Completed React Advanced course',
      timestamp: new Date('2024-02-18'),
      status: 'completed'
    },
    {
      id: 3,
      type: 'review',
      message: 'Performance review scheduled',
      timestamp: new Date('2024-02-15'),
      status: 'upcoming'
    }
  ];

  const upcomingTasks = [
    {
      id: 1,
      title: 'Submit timesheet',
      dueDate: '2024-02-25',
      priority: 'high'
    },
    {
      id: 2,
      title: 'Team meeting preparation',
      dueDate: '2024-02-26',
      priority: 'medium'
    },
    {
      id: 3,
      title: 'Training: Leadership Skills',
      dueDate: '2024-03-01',
      priority: 'low'
    }
  ];

  if (isLoading && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Loading Personal Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Personal Dashboard</h1>
            <p className="text-gray-600 mt-2">Your personal workspace and profile management</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">Logged in as</p>
              <p className="font-semibold text-gray-900">{user?.email}</p>
            </div>
            <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-2xl border border-blue-200">
              <span className="text-sm font-medium capitalize">{effectiveUserRole?.toLowerCase()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Profile & Quick Stats */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="text-center">
              <div className="relative inline-block">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-lg">
                  {user?.profile_picture_url ? (
                    <img 
                      src={user.profile_picture_url} 
                      alt="Profile" 
                      className="w-full h-full rounded-2xl object-cover"
                    />
                  ) : (
                    <span className="text-2xl text-white font-bold">
                      {user?.first_name?.[0]}{user?.last_name?.[0]}
                    </span>
                  )}
                </div>
                <div className="absolute bottom-2 right-2">
                  <label className="cursor-pointer">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </label>
                </div>
              </div>
              
              <h2 className="text-xl font-bold text-gray-900">
                {user?.first_name} {user?.last_name}
              </h2>
              <p className="text-gray-600 mb-2">{user?.position || 'Employee'}</p>
              <p className="text-sm text-gray-500">{user?.department || 'No department assigned'}</p>
              
              <div className="mt-4 flex space-x-2 justify-center">
                <button 
                  onClick={() => setEditMode(!editMode)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  {editMode ? 'Cancel Edit' : 'Edit Profile'}
                </button>
                {user?.profile_picture_url && (
                  <button 
                    onClick={handleRemoveImage}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-300 transition-colors"
                  >
                    Remove Photo
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-200">
                <div>
                  <p className="text-sm text-blue-600">Tasks Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{personalStats.tasksCompleted}</p>
                </div>
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-lg">✅</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-200">
                <div>
                  <p className="text-sm text-green-600">Training Hours</p>
                  <p className="text-2xl font-bold text-gray-900">{personalStats.trainingHours}</p>
                </div>
                <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-lg">🎓</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl border border-orange-200">
                <div>
                  <p className="text-sm text-orange-600">Pending Reviews</p>
                  <p className="text-2xl font-bold text-gray-900">{personalStats.pendingReviews}</p>
                </div>
                <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-lg">⭐</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs Navigation */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                {['overview', 'profile', 'security', 'preferences'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-4 px-6 border-b-2 font-medium text-sm capitalize transition-colors ${
                      activeTab === tab
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab === 'overview' && 'Overview'}
                    {tab === 'profile' && 'Profile Settings'}
                    {tab === 'security' && 'Security'}
                    {tab === 'preferences' && 'Preferences'}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Welcome Message */}
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-2xl">
                    <h3 className="text-xl font-bold mb-2">Welcome to Your Personal Dashboard</h3>
                    <p className="text-blue-100">
                      This is your personal workspace where you can manage your profile, track your progress, and access your resources.
                    </p>
                  </div>

                  {/* Recent Activity */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h4>
                    <div className="space-y-3">
                      {recentActivities.map((activity) => (
                        <div key={activity.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-xl hover:bg-blue-50 transition-colors">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            activity.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                          }`}>
                            {activity.type === 'task' && '📝'}
                            {activity.type === 'training' && '🎓'}
                            {activity.type === 'review' && '⭐'}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{activity.message}</p>
                            <p className="text-sm text-gray-500">
                              {activity.timestamp.toLocaleDateString()} • {activity.status}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Upcoming Tasks */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Tasks</h4>
                    <div className="space-y-3">
                      {upcomingTasks.map((task) => (
                        <div key={task.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                          <div className="flex items-center space-x-4">
                            <div className={`w-3 h-3 rounded-full ${
                              task.priority === 'high' ? 'bg-red-500' :
                              task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                            }`}></div>
                            <div>
                              <p className="font-medium text-gray-900">{task.title}</p>
                              <p className="text-sm text-gray-500">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                            View Details
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Profile Settings Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-900">Profile Information</h3>
                  
                  {editMode ? (
                    <form onSubmit={handleProfileUpdate} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                          <input
                            type="text"
                            value={profileData.first_name}
                            onChange={(e) => setProfileData({...profileData, first_name: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                          <input
                            type="text"
                            value={profileData.last_name}
                            onChange={(e) => setProfileData({...profileData, last_name: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                          <input
                            type="email"
                            value={profileData.email}
                            onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                          <input
                            type="tel"
                            value={profileData.phone}
                            onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                          <input
                            type="text"
                            value={profileData.position}
                            onChange={(e) => setProfileData({...profileData, position: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                          <input
                            type="text"
                            value={profileData.department}
                            onChange={(e) => setProfileData({...profileData, department: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                      
                      <div className="flex space-x-4">
                        <button
                          type="submit"
                          disabled={localLoading}
                          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          {localLoading ? 'Updating...' : 'Save Changes'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditMode(false)}
                          className="bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-300 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <p className="text-sm text-blue-600 mb-1">First Name</p>
                        <p className="font-medium text-gray-900">{user?.first_name || 'Not set'}</p>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <p className="text-sm text-blue-600 mb-1">Last Name</p>
                        <p className="font-medium text-gray-900">{user?.last_name || 'Not set'}</p>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <p className="text-sm text-blue-600 mb-1">Email</p>
                        <p className="font-medium text-gray-900">{user?.email}</p>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <p className="text-sm text-blue-600 mb-1">Phone</p>
                        <p className="font-medium text-gray-900">{user?.phone || 'Not set'}</p>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <p className="text-sm text-blue-600 mb-1">Position</p>
                        <p className="font-medium text-gray-900">{user?.position || 'Not set'}</p>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <p className="text-sm text-blue-600 mb-1">Department</p>
                        <p className="font-medium text-gray-900">{user?.department || 'Not set'}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-900">Security Settings</h3>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
                    <h4 className="text-lg font-semibold text-yellow-800 mb-2">Change Password</h4>
                    <p className="text-yellow-700 mb-4">Update your password to keep your account secure.</p>
                    
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                        <input
                          type="password"
                          value={passwordData.current_password}
                          onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                        <input
                          type="password"
                          value={passwordData.new_password}
                          onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                        <input
                          type="password"
                          value={passwordData.confirm_password}
                          onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={localLoading}
                        className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {localLoading ? 'Updating...' : 'Update Password'}
                      </button>
                    </form>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                    <h4 className="text-lg font-semibold text-blue-800 mb-2">Account Security</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                          <p className="text-sm text-gray-600">Add an extra layer of security</p>
                        </div>
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
                          Enable
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Login Sessions</p>
                          <p className="text-sm text-gray-600">Manage active sessions</p>
                        </div>
                        <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-300 transition-colors">
                          View Sessions
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Preferences Tab */}
              {activeTab === 'preferences' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-900">Preferences</h3>
                  
                  <div className="bg-white border border-gray-200 rounded-2xl p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Notification Settings</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Email Notifications</p>
                          <p className="text-sm text-gray-600">Receive updates via email</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Push Notifications</p>
                          <p className="text-sm text-gray-600">Browser notifications</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Weekly Digest</p>
                          <p className="text-sm text-gray-600">Weekly summary report</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-2xl p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Display Preferences</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                        <select className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                          <option>Light</option>
                          <option>Dark</option>
                          <option>System</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                        <select className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                          <option>English</option>
                          <option>Spanish</option>
                          <option>French</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Personal;