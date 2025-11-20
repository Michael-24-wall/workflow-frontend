// components/chat/ChannelSettingsModal.jsx
import React, { useState } from 'react';
import { channelService } from '../../../services/chat/api';

export default function ChannelSettingsModal({ channel, isOpen, onClose, onChannelUpdate }) {
  const [formData, setFormData] = useState({
    topic: channel.topic || '',
    purpose: channel.purpose || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await channelService.updateChannel(channel.id, formData);
      
      if (onChannelUpdate) {
        onChannelUpdate();
      }
      
      onClose();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArchive = async () => {
    if (!window.confirm(`Are you sure you want to archive #${channel.name}? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    try {
      await channelService.archiveChannel(channel.id);
      if (onChannelUpdate) {
        onChannelUpdate();
      }
      onClose();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">
            Channel Settings - #{channel.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Topic */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Topic
            </label>
            <input
              type="text"
              value={formData.topic}
              onChange={(e) => handleChange('topic', e.target.value)}
              placeholder="What is this channel about?"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={250}
            />
            <p className="text-xs text-gray-400 mt-1">
              {formData.topic.length}/250 characters
            </p>
          </div>

          {/* Purpose */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Purpose
            </label>
            <textarea
              value={formData.purpose}
              onChange={(e) => handleChange('purpose', e.target.value)}
              placeholder="Describe the purpose of this channel..."
              rows="3"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-900 border border-red-700 rounded-md">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          <div className="flex justify-between items-center">
            {/* Archive Button */}
            <button
              type="button"
              onClick={handleArchive}
              disabled={loading}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Archiving...' : 'Archive Channel'}
            </button>

            {/* Save/Cancel Buttons */}
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-300 hover:text-white"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>

        {/* Channel Info */}
        <div className="mt-6 pt-6 border-t border-gray-700">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Channel Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Created:</span>
              <span className="text-white">
                {new Date(channel.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Type:</span>
              <span className="text-white capitalize">{channel.channel_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Members:</span>
              <span className="text-white">{channel.member_count || 0}</span>
            </div>
            {channel.last_activity && (
              <div className="flex justify-between">
                <span className="text-gray-400">Last Activity:</span>
                <span className="text-white">
                  {new Date(channel.last_activity).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}