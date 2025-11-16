import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Copy, Download, MoreVertical } from 'lucide-react';
import { spreadsheetApi } from '../../services/sheetsApi';
  




const SheetsDashboard = () => {
  const [spreadsheets, setSpreadsheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSheetTitle, setNewSheetTitle] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadSpreadsheets();
  }, []);

  const loadSpreadsheets = async () => {
    try {
      console.log('Loading spreadsheets...');
      const response = await spreadsheetApi.getAll();
      console.log('API Response:', response);
      console.log('Response data:', response.data);
      
      // Handle different possible response structures
      let spreadsheetsData = [];
      
      if (Array.isArray(response.data)) {
        // If response.data is already an array
        spreadsheetsData = response.data;
      } else if (response.data && Array.isArray(response.data.results)) {
        // If response has pagination with results array
        spreadsheetsData = response.data.results;
      } else if (response.data && Array.isArray(response.data.spreadsheets)) {
        // If response has spreadsheets array
        spreadsheetsData = response.data.spreadsheets;
      } else if (response.data && typeof response.data === 'object') {
        // If response.data is a single object, wrap it in array
        spreadsheetsData = [response.data];
      }
      
      console.log('Processed spreadsheets data:', spreadsheetsData);
      setSpreadsheets(spreadsheetsData);
      setError(null);
    } catch (error) {
      console.error('Error loading spreadsheets:', error);
      setError('Failed to load spreadsheets. Please try again.');
      setSpreadsheets([]); // Ensure it's always an array
    } finally {
      setLoading(false);
    }
  };

  const createSpreadsheet = async () => {
    if (!newSheetTitle.trim()) return;

    try {
      console.log('Creating spreadsheet:', newSheetTitle);
      const response = await spreadsheetApi.create({ title: newSheetTitle });
      console.log('Create response:', response);
      
      // Add the new spreadsheet to the list
      const newSpreadsheet = response.data;
      setSpreadsheets(prev => [newSpreadsheet, ...prev]);
      setShowCreateModal(false);
      setNewSheetTitle('');
    } catch (error) {
      console.error('Error creating spreadsheet:', error);
      setError('Failed to create spreadsheet. Please try again.');
    }
  };

  // Debug: Log current state
  console.log('Current spreadsheets state:', spreadsheets);
  console.log('Is array?', Array.isArray(spreadsheets));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6 h-32">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <div className="flex items-center">
            <div className="text-red-600 mr-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-medium text-red-800">Error</h3>
              <p className="text-red-700">{error}</p>
              <button
                onClick={loadSpreadsheets}
                className="mt-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Ensure spreadsheets is always an array before mapping
  const displaySpreadsheets = Array.isArray(spreadsheets) ? spreadsheets : [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sheets</h1>
          <p className="text-gray-600">Create and manage your spreadsheets</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={20} />
          New Spreadsheet
        </button>
      </div>

      {/* Debug Info - Remove in production */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <div className="text-yellow-600 mr-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="text-sm">
            <span className="font-medium">Debug Info:</span> Showing {displaySpreadsheets.length} spreadsheets
          </div>
        </div>
      </div>

      {/* Spreadsheets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {displaySpreadsheets.map((spreadsheet) => (
          <div
            key={spreadsheet.id}
            className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4 cursor-pointer"
            onClick={() => navigate(`/sheets/${spreadsheet.id}`)}
          >
            <div className="mb-3">
              <h3 className="font-semibold text-gray-900 truncate">
                {spreadsheet.title || 'Untitled Spreadsheet'}
              </h3>
              <p className="text-sm text-gray-500">
                {spreadsheet.updated_at 
                  ? new Date(spreadsheet.updated_at).toLocaleDateString()
                  : 'No date'
                }
              </p>
            </div>
            
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Users size={16} />
                <span>{spreadsheet.collaborators?.length || 0}</span>
              </div>
              <span>{spreadsheet.sheets?.length || 1} sheets</span>
            </div>

            <div className="flex justify-between items-center mt-3 pt-3 border-t">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('Duplicate clicked for:', spreadsheet.id);
                }}
                className="text-gray-500 hover:text-gray-700 p-1"
                title="Duplicate"
              >
                <Copy size={16} />
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Export clicked for:', spreadsheet.id);
                  }}
                  className="text-gray-500 hover:text-gray-700 p-1"
                  title="Export"
                >
                  <Download size={16} />
                </button>
                <button 
                  onClick={(e) => e.stopPropagation()}
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {displaySpreadsheets.length === 0 && (
        <div className="text-center py-12">
          <div className="bg-white rounded-lg shadow-sm p-8 max-w-md mx-auto">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus size={24} className="text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No spreadsheets yet
            </h3>
            <p className="text-gray-500 mb-4">
              Create your first spreadsheet to get started
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              Create Spreadsheet
            </button>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create New Spreadsheet</h3>
            <input
              type="text"
              value={newSheetTitle}
              onChange={(e) => setNewSheetTitle(e.target.value)}
              placeholder="Enter spreadsheet title"
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
              onKeyPress={(e) => e.key === 'Enter' && createSpreadsheet()}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={createSpreadsheet}
                disabled={!newSheetTitle.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SheetsDashboard;