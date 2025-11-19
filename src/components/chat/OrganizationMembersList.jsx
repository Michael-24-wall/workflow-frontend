// components/chat/OrganizationMembersList.jsx
import React, { useState, useEffect } from 'react';
import { workspaceService } from '../../services/chat/api';

const OrganizationMembersList = ({ workspaceId, channelId, onMemberSelect }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadMembers();
  }, [workspaceId, channelId]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      let membersData = [];

      if (workspaceId) {
        // Get workspace members
        membersData = await workspaceService.getWorkspaceMembers(workspaceId);
      } else {
        // Get all organization members
        membersData = await workspaceService.getOrganizationMembers();
      }

      setMembers(membersData);
      setError(null);
    } catch (err) {
      console.error('Failed to load members:', err);
      setError('Failed to load members');
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const searchMembers = async (query) => {
    try {
      if (query.trim()) {
        const results = await workspaceService.searchChatMembers(query);
        setMembers(results);
      } else {
        loadMembers(); // Reset to all members if search is cleared
      }
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  const filteredMembers = members.filter(member =>
    member.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        <p>{error}</p>
        <button
          onClick={loadMembers}
          className="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="organization-members-list">
      {/* Search Bar */}
      <div className="p-4 border-b">
        <input
          type="text"
          placeholder="Search members..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            searchMembers(e.target.value);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Members Count */}
      <div className="p-4 border-b bg-gray-50">
        <p className="text-sm text-gray-600">
          {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''}
          {searchQuery && ` matching "${searchQuery}"`}
        </p>
      </div>

      {/* Members List */}
      <div className="max-h-96 overflow-y-auto">
        {filteredMembers.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No members found
          </div>
        ) : (
          filteredMembers.map((member) => (
            <MemberItem
              key={member.id}
              member={member}
              onSelect={onMemberSelect}
            />
          ))
        )}
      </div>
    </div>
  );
};

const MemberItem = ({ member, onSelect }) => {
  const [chatSettings, setChatSettings] = useState(null);

  useEffect(() => {
    loadChatSettings();
  }, [member.id]);

  const loadChatSettings = async () => {
    try {
      const settings = await workspaceService.getMemberChatSettings(member.id);
      setChatSettings(settings);
    } catch (error) {
      console.error('Failed to load chat settings:', error);
    }
  };

  const handleMemberClick = () => {
    if (onSelect) {
      onSelect(member);
    }
  };

  return (
    <div
      className="p-3 border-b hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={handleMemberClick}
    >
      <div className="flex items-center space-x-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {member.profile_picture_url ? (
            <img
              src={member.profile_picture_url}
              alt={member.display_name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
              {member.display_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          )}
        </div>

        {/* Member Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {member.display_name || 'Unknown User'}
            </h3>
            {chatSettings && (
              <span
                className={`inline-block w-2 h-2 rounded-full ${
                  chatSettings.current_status === 'online' 
                    ? 'bg-green-500' 
                    : 'bg-gray-300'
                }`}
                title={chatSettings.current_status}
              ></span>
            )}
          </div>
          
          <p className="text-sm text-gray-500 truncate">
            {member.email}
          </p>
          
          <div className="flex items-center space-x-2 mt-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
              {member.role || 'member'}
            </span>
            
            {member.is_active === false && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                Inactive
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationMembersList;