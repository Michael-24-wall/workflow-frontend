import React, { useState, useEffect } from 'react';
import { chatApi } from '../services/chatApi';

const RoomManagement = () => {
  const [rooms, setRooms] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    description: '',
    is_private: false,
    max_members: 100
  });

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      const data = await chatApi.getRooms();
      setRooms(data);
    } catch (error) {
      console.error('Failed to load rooms:', error);
    }
  };

  const createRoom = async (e) => {
    e.preventDefault();
    try {
      await chatApi.createRoom(formData);
      setShowCreateForm(false);
      setFormData({ name: '', title: '', description: '', is_private: false, max_members: 100 });
      loadRooms();
    } catch (error) {
      console.error('Failed to create room:', error);
    }
  };

  const leaveRoom = async (roomId) => {
    try {
      await chatApi.leaveRoom(roomId);
      loadRooms();
    } catch (error) {
      console.error('Failed to leave room:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Room Management</h1>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Create Room
          </button>
        </div>

        {/* Create Room Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-96">
              <h3 className="text-xl font-bold mb-4">Create New Room</h3>
              <form onSubmit={createRoom} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Room Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    rows="3"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_private}
                    onChange={(e) => setFormData({...formData, is_private: e.target.checked})}
                    className="mr-2"
                  />
                  <label className="text-sm text-gray-300">Private Room</label>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 text-gray-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Rooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map(room => (
            <div key={room.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-white">{room.title}</h3>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  room.is_private 
                    ? 'bg-yellow-900 text-yellow-200' 
                    : 'bg-green-900 text-green-200'
                }`}>
                  {room.is_private ? 'Private' : 'Public'}
                </span>
              </div>
              
              <p className="text-gray-300 mb-4">{room.description}</p>
              
              <div className="flex justify-between items-center text-sm text-gray-400">
                <span>{room.member_count} members</span>
                <span>Max: {room.max_members}</span>
              </div>
              
              <div className="flex justify-between items-center mt-4">
                <span className="text-xs text-gray-500">
                  Created by {room.created_by?.email}
                </span>
                <button
                  onClick={() => leaveRoom(room.id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                >
                  Leave
                </button>
              </div>
            </div>
          ))}
        </div>

        {rooms.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No rooms yet. Create your first room!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomManagement;