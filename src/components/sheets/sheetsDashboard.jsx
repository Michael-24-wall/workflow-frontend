import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Copy, Download, MoreVertical, FileText, RefreshCw, AlertCircle, Edit3, Trash2, Share2 } from 'lucide-react';
import { spreadsheetApi } from '../../services/sheetsApi';

const SheetsDashboard = () => {
  const [spreadsheets, setSpreadsheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSheetTitle, setNewSheetTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  
  const navigate = useNavigate();
  const contextMenuRef = useRef(null);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
        setContextMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load spreadsheets from API
  const loadSpreadsheets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Loading spreadsheets...');
      const response = await spreadsheetApi.getAll();
      console.log('📦 API Response:', response.data);
      
      // Handle paginated response - spreadsheets are in "results" array
      const spreadsheetsData = response.data.results || [];
      
      console.log('✅ Found spreadsheets:', spreadsheetsData.length);
      setSpreadsheets(spreadsheetsData);
      
    } catch (error) {
      console.error('❌ Error loading spreadsheets:', error);
      setError('Failed to load spreadsheets. Please try again.');
      setSpreadsheets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new spreadsheet
  const createSpreadsheet = async () => {
    if (!newSheetTitle.trim()) {
      setError('Please enter a spreadsheet title');
      return;
    }

    try {
      setCreating(true);
      setError(null);
      
      console.log('🔄 Creating spreadsheet:', newSheetTitle);
      const response = await spreadsheetApi.create({ title: newSheetTitle });
      console.log('✅ Create response:', response);
      
      // The new spreadsheet should be in response.data
      const newSpreadsheet = response.data;
      
      // Add to the list and reload to get fresh data
      setSpreadsheets(prev => [newSpreadsheet, ...prev]);
      setShowCreateModal(false);
      setNewSheetTitle('');
      
    } catch (error) {
      console.error('❌ Error creating spreadsheet:', error);
      setError('Failed to create spreadsheet. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  // Duplicate spreadsheet
  const duplicateSpreadsheet = async (spreadsheetId) => {
    try {
      setActionLoading(spreadsheetId);
      console.log('🔄 Duplicating spreadsheet:', spreadsheetId);
      const response = await spreadsheetApi.duplicate(spreadsheetId);
      const duplicatedSpreadsheet = response.data;
      
      // Add duplicated spreadsheet to list
      setSpreadsheets(prev => [duplicatedSpreadsheet, ...prev]);
      
    } catch (error) {
      console.error('❌ Error duplicating spreadsheet:', error);
      setError('Failed to duplicate spreadsheet');
    } finally {
      setActionLoading(null);
    }
  };

  // Export spreadsheet - FIXED VERSION
  // Export spreadsheet - FIXED VERSION
// Export spreadsheet - UPDATED TO USE DOWNLOAD ENDPOINT
// Export spreadsheet - PDF VERSION
// Export spreadsheet - PDF DOWNLOAD VERSION
const exportSpreadsheet = async (spreadsheet) => {
  try {
    setActionLoading(spreadsheet.id);
    
    console.log('📤 Starting PDF download for:', spreadsheet.title);
    
    // Use the download endpoint which now returns PDF
    const response = await spreadsheetApi.download(spreadsheet.id);
    
    console.log('✅ PDF download response received');
    console.log('📦 Content-Type:', response.headers['content-type']);
    console.log('📝 Content-Disposition:', response.headers['content-disposition']);
    
    // Create blob from response data (PDF)
    const blob = new Blob([response.data], { 
      type: response.headers['content-type'] || 'application/pdf' 
    });
    
    // Extract filename from headers or use default
    const contentDisposition = response.headers['content-disposition'];
    let filename = 'spreadsheet.pdf';
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    } else {
      // Fallback filename with PDF extension
      filename = `${spreadsheet.title.replace(/[^a-zA-Z0-9\s_-]/g, '_')}.pdf`;
    }
    
    console.log('📄 Downloading PDF file:', filename);
    
    // Create download URL
    const url = window.URL.createObjectURL(blob);
    
    // Create and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    window.URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('❌ Error exporting spreadsheet as PDF:', error);
    if (error.response) {
      console.error('❌ Server response:', error.response.status, error.response.data);
      setError(`PDF export failed: ${error.response.status} - ${error.response.data?.error || 'Unknown error'}`);
    } else {
      setError('Failed to export spreadsheet as PDF');
    }
  } finally {
    setActionLoading(null);
  }
};
  // Delete spreadsheet
  const deleteSpreadsheet = async (spreadsheetId) => {
    if (!window.confirm('Are you sure you want to delete this spreadsheet? This action cannot be undone.')) {
      return;
    }

    try {
      setActionLoading(spreadsheetId);
      await spreadsheetApi.delete(spreadsheetId);
      
      // Remove from local state
      setSpreadsheets(prev => prev.filter(s => s.id !== spreadsheetId));
      
    } catch (error) {
      console.error('❌ Error deleting spreadsheet:', error);
      setError('Failed to delete spreadsheet');
    } finally {
      setActionLoading(null);
      setContextMenu(null);
    }
  };

  // Context menu handlers
  const handleContextMenu = (spreadsheet, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      spreadsheetId: spreadsheet.id
    });
  };

  const handleRenameSpreadsheet = (spreadsheetId) => {
    const spreadsheet = spreadsheets.find(s => s.id === spreadsheetId);
    if (spreadsheet) {
      const newTitle = prompt('Enter new spreadsheet name:', spreadsheet.title);
      if (newTitle && newTitle.trim() && newTitle !== spreadsheet.title) {
        // Call rename API here when implemented
        console.log('Rename spreadsheet:', spreadsheetId, newTitle);
      }
    }
    setContextMenu(null);
  };

  // Handle keyboard events
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && showCreateModal) {
      createSpreadsheet();
    } else if (e.key === 'Escape') {
      if (showCreateModal) {
        setShowCreateModal(false);
      }
      setContextMenu(null);
    }
  }, [showCreateModal]);

  // Effects
  useEffect(() => {
    loadSpreadsheets();
  }, [loadSpreadsheets]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  // Loading skeleton
  const renderSkeleton = () => (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-4 h-32">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    </div>
  );

  // Error display
  const renderError = () => (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
      <div className="flex items-start">
        <AlertCircle className="w-6 h-6 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-lg font-medium text-red-800 mb-2">Unable to Load Spreadsheets</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={loadSpreadsheets}
            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 inline mr-2" />
            Try Again
          </button>
        </div>
      </div>
    </div>
  );

  // Spreadsheet card
  const renderSpreadsheetCard = (spreadsheet) => {
    const isLoading = actionLoading === spreadsheet.id;
    
    return (
      <div
        key={spreadsheet.id}
        className="bg-white rounded-lg shadow hover:shadow-md transition-all duration-200 p-4 cursor-pointer border border-gray-100 hover:border-blue-200 group"
        onClick={() => !isLoading && navigate(`/sheets/${spreadsheet.id}`)}
        onContextMenu={(e) => handleContextMenu(spreadsheet, e)}
      >
        <div className="mb-3">
          <div className="flex items-start justify-between mb-2">
            <FileText className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            {isLoading && (
              <RefreshCw className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0" />
            )}
          </div>
          <h3 className="font-semibold text-gray-900 truncate text-sm leading-tight">
            {spreadsheet.title || 'Untitled Spreadsheet'}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {spreadsheet.updated_at 
              ? `Updated ${new Date(spreadsheet.updated_at).toLocaleDateString()}`
              : 'New spreadsheet'
            }
          </p>
        </div>
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Users size={14} />
            <span>{spreadsheet.collaborators?.length || 0}</span>
          </div>
          <span>{spreadsheet.sheets?.length || 1} sheets</span>
        </div>

        <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              !isLoading && duplicateSpreadsheet(spreadsheet.id);
            }}
            className="text-gray-500 hover:text-blue-600 p-1 transition-colors disabled:opacity-50"
            title="Duplicate"
            disabled={isLoading}
          >
            <Copy size={14} />
          </button>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                !isLoading && exportSpreadsheet(spreadsheet);
              }}
              className="text-gray-500 hover:text-green-600 p-1 transition-colors disabled:opacity-50"
              title="Export"
              disabled={isLoading}
            >
              <Download size={14} />
            </button>
            <button 
              onClick={(e) => handleContextMenu(spreadsheet, e)}
              className="text-gray-500 hover:text-gray-700 p-1 transition-colors"
              disabled={isLoading}
            >
              <MoreVertical size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Empty state
  const renderEmptyState = () => (
    <div className="text-center py-12">
      <div className="bg-white rounded-lg shadow-sm p-8 max-w-md mx-auto border border-gray-200">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText size={24} className="text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No spreadsheets yet
        </h3>
        <p className="text-gray-500 mb-4 text-sm">
          Create your first spreadsheet to get started with collaborative editing
        </p>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4 inline mr-2" />
          Create Spreadsheet
        </button>
      </div>
    </div>
  );

  // Context menu
  const renderContextMenu = () => (
    contextMenu && (
      <>
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setContextMenu(null)}
        />
        <div
          ref={contextMenuRef}
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-48"
          style={{ 
            left: Math.min(contextMenu.x, window.innerWidth - 200),
            top: Math.min(contextMenu.y, window.innerHeight - 200)
          }}
        >
          <button
            onClick={() => handleRenameSpreadsheet(contextMenu.spreadsheetId)}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 transition-colors"
          >
            <Edit3 size={14} />
            Rename
          </button>
          <button
            onClick={() => duplicateSpreadsheet(contextMenu.spreadsheetId)}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 transition-colors"
          >
            <Copy size={14} />
            Duplicate
          </button>
          <button
            onClick={() => {
              const spreadsheet = spreadsheets.find(s => s.id === contextMenu.spreadsheetId);
              spreadsheet && exportSpreadsheet(spreadsheet);
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 transition-colors"
          >
            <Download size={14} />
            Export
          </button>
          <button
            onClick={() => {/* Implement share */}}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 transition-colors"
          >
            <Share2 size={14} />
            Share
          </button>
          <div className="border-t border-gray-100 my-1"></div>
          <button
            onClick={() => deleteSpreadsheet(contextMenu.spreadsheetId)}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-red-600 flex items-center gap-2 transition-colors"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </>
    )
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        {renderSkeleton()}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Spreadsheets</h1>
          <p className="text-gray-600 text-sm">Create and manage your spreadsheets</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={16} />
          New Spreadsheet
        </button>
      </div>

      {/* Error Display */}
      {error && renderError()}

      {/* Spreadsheets Grid */}
      {spreadsheets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {spreadsheets.map(renderSpreadsheetCard)}
        </div>
      ) : (
        renderEmptyState()
      )}

      {/* Context Menu */}
      {renderContextMenu()}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Create New Spreadsheet</h3>
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
            
            <input
              type="text"
              value={newSheetTitle}
              onChange={(e) => setNewSheetTitle(e.target.value)}
              placeholder="Enter spreadsheet title"
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
              maxLength={100}
            />
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                disabled={creating}
              >
                Cancel
              </button>
              <button
                onClick={createSpreadsheet}
                disabled={!newSheetTitle.trim() || creating}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                {creating && <RefreshCw className="w-4 h-4 animate-spin" />}
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SheetsDashboard;