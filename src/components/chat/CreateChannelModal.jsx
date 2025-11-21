// src/components/chat/CreateChannelModal.jsx
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { channelService } from '../../services/chat/api';

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
    
    if (!formData.name.trim()) {
      setError('Channel name is required');
      return;
    }

    if (!workspaceId) {
      setError('Workspace ID is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🚀 Creating channel with workspace ID:', workspaceId);
      
      const newChannel = await channelService.createChannel({
        workspace: workspaceId,
        name: formData.name,
        topic: formData.topic,
        purpose: formData.purpose,
        channel_type: formData.channel_type
      });

      console.log('✅ Channel created successfully:', newChannel);
      
      // Notify parent component
      if (onChannelCreated) {
        onChannelCreated(newChannel);
      }
      
      // Close modal and reset form
      onClose();
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      topic: '',
      purpose: '',
      channel_type: 'public'
    });
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl w-full max-w-md mx-auto border border-slate-700 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-white">Create Channel</h2>
            <p className="text-slate-400 text-sm mt-1">
              Workspace ID: {workspaceId}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded hover:bg-slate-700"
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Channel Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Channel Name *
            </label>
            <div className="flex items-center">
              <span className="text-slate-400 mr-2 bg-slate-700 px-2 py-2 rounded-l border border-r-0 border-slate-600">#</span>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="general, announcements, random"
                className="flex-1 bg-slate-700 border border-slate-600 rounded-r px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={loading}
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
              disabled={loading}
            >
              <option value="public">Public - Anyone in workspace can join</option>
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
              disabled={loading}
            />
            <p className="text-slate-400 text-xs mt-1">
              A short description shown in the channel header
            </p>
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Description (Optional)
            </label>
            <textarea
              name="purpose"
              value={formData.purpose}
              onChange={handleChange}
              placeholder="Describe the purpose of this channel..."
              rows="3"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={loading}
            />
            <p className="text-slate-400 text-xs mt-1">
              A longer description for new members
            </p>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-slate-300 hover:text-white disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating...</span>
                </div>
              ) : (
                'Create Channel'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateChannelModal;