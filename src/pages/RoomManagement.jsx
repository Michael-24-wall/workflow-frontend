import React, { useState, useEffect } from 'react';
import useAuthStore from '../stores/authStore';
import { chatApi } from '../services/chatApi';

const RoomManagement = () => {
  const { user } = useAuthStore();
  const [rooms, setRooms] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoom, setNewRoom] = useState({
    name: '',
    title: '',
    description: '',
    privacy_level: 'public'
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
      await chatApi.createRoom(newRoom);
      setShowCreateModal(false);
      setNewRoom({ name: '', title: '', description: '', privacy_level: 'public' });
      loadRooms();
    } catch (error) {
      console.error('Failed to create room:', error);
    }
  };

  const joinRoom = async (roomId) => {
    try {
      await chatApi.joinRoom(roomId);
      loadRooms();
    } catch (error) {
      console.error('Failed to join room:', error);
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

  if (!user) {
    return <div>Please log in to manage rooms</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Chat Rooms</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Create Room
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map(room => (
          <div key={room.id} className="bg-white border rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-lg mb-2">{room.title}</h3>
            <p className="text-gray-600 text-sm mb-3">{room.description}</p>
            
            <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
              <span>{room.member_count} members</span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                room.privacy_level === 'public' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {room.privacy_level}
              </span>
            </div>

            <div className="flex space-x-2">
              {room.is_member ? (
                <button
                  onClick={() => leaveRoom(room.id)}
                  className="flex-1 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                >
                  Leave
                </button>
              ) : (
                <button
                  onClick={() => joinRoom(room.id)}
                  className="flex-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                >
                  Join
                </button>
              )}
              <button
                onClick={() => window.location.href = `/chat?room=${room.id}`}
                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                Enter
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Room</h2>
            <form onSubmit={createRoom}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Room Name</label>
                  <input
                    type="text"
                    value={newRoom.name}
                    onChange={(e) => setNewRoom({...newRoom, name: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                    placeholder="room-name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input
                    type="text"
                    value={newRoom.title}
                    onChange={(e) => setNewRoom({...newRoom, title: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                    placeholder="Room Title"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={newRoom.description}
                    onChange={(e) => setNewRoom({...newRoom, description: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                    rows="3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Privacy</label>
                  <select
                    value={newRoom.privacy_level}
                    onChange={(e) => setNewRoom({...newRoom, privacy_level: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </div>
              <div className="flex space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomManagement;