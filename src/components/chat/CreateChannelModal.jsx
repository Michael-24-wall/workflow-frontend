// src/components/chat/CreateChannelModal.jsx
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { channelService } from '../../services/chat/api'; // Import your API service

const CreateChannelModal = ({ isOpen, onClose, workspaceId, onChannelCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    topic: '',
    purpose: '',
    channel_type: 'public'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // ✅ FIXED: Use channelService instead of raw fetch
      const newChannel = await channelService.createChannel({
        workspace: workspaceId,
        name: formData.name,
        topic: formData.topic,
        purpose: formData.purpose,
        channel_type: formData.channel_type
      });

      console.log('✅ Channel created successfully:', newChannel);
      onChannelCreated(newChannel);
      onClose();
      
      // Reset form
      setFormData({
        name: '',
        topic: '',
        purpose: '',
        channel_type: 'public'
      });
    } catch (err) {
      console.error('❌ Failed to create channel:', err);
      setError(err.message || 'Failed to create channel');
    } finally {
      setLoading(false);
    }
  };

  // Alternative fix if you prefer to keep using fetch directly:
  const handleSubmitWithFetch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      
      // ✅ FIXED: Use correct backend URL with port 9000
      const response = await fetch('http://localhost:9000/api/chat/channels/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          workspace: workspaceId,
          name: formData.name,
          topic: formData.topic,
          purpose: formData.purpose,
          channel_type: formData.channel_type
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create channel');
      }

      const channel = await response.json();
      onChannelCreated(channel);
      onClose();
      
      // Reset form
      setFormData({
        name: '',
        topic: '',
        purpose: '',
        channel_type: 'public'
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">Create Channel</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500 bg-opacity-20 border border-red-500 rounded-lg p-3">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Channel Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Channel Name *
            </label>
            <div className="flex items-center">
              <span className="text-slate-400 mr-2">#</span>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. general, random, projects"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <p className="text-slate-400 text-xs mt-1">
              Channel names should be lowercase, without spaces or periods.
            </p>
          </div>

          {/* Channel Type */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Channel Type
            </label>
            <select
              name="channel_type"
              value={formData.channel_type}
              onChange={handleChange}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="public">Public - Anyone in the workspace can join</option>
              <option value="private">Private - Only invited members can access</option>
            </select>
          </div>

          {/* Topic */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Topic (Optional)
            </label>
            <input
              type="text"
              name="topic"
              value={formData.topic}
              onChange={handleChange}
              placeholder="What is this channel about?"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Purpose (Optional)
            </label>
            <textarea
              name="purpose"
              value={formData.purpose}
              onChange={handleChange}
              placeholder="Describe the purpose of this channel..."
              rows="3"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {loading ? 'Creating...' : 'Create Channel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateChannelModal;