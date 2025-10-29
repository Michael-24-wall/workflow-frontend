import React, { useState, useEffect } from 'react';
import { chatApi } from '../services/chatApi';

const UserProfile = () => {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    status: '',
    theme: 'light',
    notification_enabled: true
  });

  useEffect(() => {
    loadProfile();
    loadStatistics();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await chatApi.getUserProfile();
      setProfile(data);
      setFormData({
        status: data.status || '',
        theme: data.theme || 'light',
        notification_enabled: data.notification_enabled !== false
      });
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const loadStatistics = async () => {
    try {
      const data = await chatApi.getStatistics();
      setStats(data);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    try {
      await chatApi.updateProfile(formData);
      setIsEditing(false);
      loadProfile();
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">User Profile</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-white">Profile Information</h2>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </button>
              </div>

              {isEditing ? (
                <form onSubmit={updateProfile} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Status
                    </label>
                    <input
                      type="text"
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                      placeholder="What's on your mind?"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Theme
                    </label>
                    <select
                      value={formData.theme}
                      onChange={(e) => setFormData({...formData, theme: e.target.value})}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="auto">Auto</option>
                    </select>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.notification_enabled}
                      onChange={(e) => setFormData({...formData, notification_enabled: e.target.checked})}
                      className="mr-2"
                    />
                    <label className="text-sm text-gray-300">Enable Notifications</label>
                  </div>

                  <button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
                  >
                    Save Changes
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300">Email</label>
                    <p className="text-white text-lg">{profile.user?.email}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300">Status</label>
                    <p className="text-white text-lg">{profile.status || 'No status set'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300">Theme</label>
                    <p className="text-white text-lg capitalize">{profile.theme}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300">Notifications</label>
                    <p className="text-white text-lg">
                      {profile.notification_enabled ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300">Last Seen</label>
                    <p className="text-white text-lg">
                      {new Date(profile.last_seen).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Statistics Card */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-6">Chat Statistics</h2>
              
              {stats ? (
                <div className="space-y-4">
                  <div className="bg-blue-900 rounded-lg p-4">
                    <div className="text-blue-200 text-sm">Total Rooms</div>
                    <div className="text-white text-2xl font-bold">{stats.total_rooms}</div>
                  </div>
                  
                  <div className="bg-green-900 rounded-lg p-4">
                    <div className="text-green-200 text-sm">Messages Sent</div>
                    <div className="text-white text-2xl font-bold">{stats.total_messages}</div>
                  </div>
                  
                  <div className="bg-yellow-900 rounded-lg p-4">
                    <div className="text-yellow-200 text-sm">Unread Messages</div>
                    <div className="text-white text-2xl font-bold">{stats.unread_messages}</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;