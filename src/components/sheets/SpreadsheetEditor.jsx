import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Save, Users, Share2, Download, Menu } from 'lucide-react';
import { spreadsheetApi, sheetApi, cellApi } from '../../services/sheetsApi';
import websocketService from '../../services/websocketService';
import SpreadsheetGrid from './SpreadsheetGrid';
import SheetTabs from './SheetTabs';
import Toolbar from './Toolbar';

const SpreadsheetEditor = () => {
  const { spreadsheetId } = useParams();
  const [spreadsheet, setSpreadsheet] = useState(null);
  const [activeSheet, setActiveSheet] = useState(null);
  const [cells, setCells] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [selectedCells, setSelectedCells] = useState([]);
  const [currentFormat, setCurrentFormat] = useState({});
  const saveTimeoutRef = useRef(null);

  // Define handleKeyDown before using it in useEffect
  const handleKeyDown = useCallback((e) => {
    // Ctrl+S or Cmd+S to manually save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      // Force save all pending changes
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      setSaving(true);
      setTimeout(() => setSaving(false), 1000);
    }
    
    // Escape to clear selection
    if (e.key === 'Escape') {
      setSelectedCells([]);
    }
  }, []);

  const setupKeyboardShortcuts = useCallback(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (spreadsheetId) {
      loadSpreadsheet();
      setupWebSocket();
      const cleanup = setupKeyboardShortcuts();
      
      return () => {
        cleanup();
        websocketService.disconnect();
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
      };
    }
  }, [spreadsheetId, setupKeyboardShortcuts]);

  const loadSpreadsheet = async () => {
    try {
      console.log('📋 Loading spreadsheet:', spreadsheetId);
      const response = await spreadsheetApi.getById(spreadsheetId);
      const spreadsheetData = response.data;
      setSpreadsheet(spreadsheetData);
      
      if (spreadsheetData.sheets && spreadsheetData.sheets.length > 0) {
        setActiveSheet(spreadsheetData.sheets[0]);
        await loadSheetCells(spreadsheetData.sheets[0].id);
      }
    } catch (error) {
      console.error('❌ Error loading spreadsheet:', error);
      if (error.response?.status === 404) {
        // Handle not found case
      } else if (error.response?.status === 403) {
        // Handle permission denied
      }
    } finally {
      setLoading(false);
    }
  };

  const loadSheetCells = async (sheetId) => {
    try {
      console.log('📊 Loading sheet cells:', sheetId);
      const response = await sheetApi.getById(sheetId);
      const sheetData = response.data;
      
      // Convert cells array to grid format
      const cellsMap = {};
      if (sheetData.cells && Array.isArray(sheetData.cells)) {
        sheetData.cells.forEach(cell => {
          const key = `${cell.row}-${cell.column}`;
          cellsMap[key] = {
            ...cell,
            row: parseInt(cell.row),
            column: parseInt(cell.column)
          };
        });
      }
      
      setCells(cellsMap);
      console.log(`✅ Loaded ${Object.keys(cellsMap).length} cells`);
    } catch (error) {
      console.error('❌ Error loading sheet cells:', error);
      if (error.response?.status === 403) {
        console.error('Permission denied for this sheet');
        // Create empty cells map if permission denied
        setCells({});
      }
    }
  };

  const setupWebSocket = () => {
    const onMessage = (data) => {
      console.log('📨 WebSocket message received:', data);
      
      switch (data.type) {
        case 'cell_update':
          handleRemoteCellUpdate(data.data?.cell || data.cell);
          break;
        case 'user_joined':
          console.log(`👤 ${data.username || 'Unknown user'} joined the spreadsheet`);
          if (data.user_id && data.username) {
            setOnlineUsers(prev => [...prev.filter(user => user.id !== data.user_id), { 
              id: data.user_id, 
              username: data.username 
            }]);
          }
          break;
        case 'user_left':
          console.log(`👤 ${data.username || 'Unknown user'} left the spreadsheet`);
          if (data.user_id) {
            setOnlineUsers(prev => prev.filter(user => user.id !== data.user_id));
          }
          break;
        case 'online_users':
          setOnlineUsers(data.users || []);
          break;
        case 'connection_success':
          setConnectionStatus('connected');
          break;
        case 'heartbeat_ack':
          // Ignore heartbeat acknowledgments
          break;
        default:
          console.log('Unknown message type:', data.type);
      }
    };

    const onError = (error) => {
      console.error('❌ WebSocket error:', error);
      setConnectionStatus('error');
    };

    const onClose = (event) => {
      console.log('🔌 WebSocket closed:', event.code, event.reason);
      setConnectionStatus('disconnected');
      
      // Attempt reconnection after delay for unexpected closures
      if (event.code !== 1000 && event.code !== 1001) {
        setTimeout(() => {
          if (spreadsheetId) {
            setupWebSocket();
          }
        }, 3000);
      }
    };

    setConnectionStatus('connecting');
    websocketService.connect(spreadsheetId, onMessage, onError, onClose);
  };

  const handleRemoteCellUpdate = (cellData) => {
    if (!cellData) return;
    
    const key = `${cellData.row}-${cellData.column}`;
    
    setCells(prev => ({
      ...prev,
      [key]: { 
        ...prev[key], 
        ...cellData,
        row: parseInt(cellData.row),
        column: parseInt(cellData.column)
      }
    }));
  };

  const saveCellToBackend = async (row, column, value, formula = '', style = {}) => {
    try {
      const cellKey = `${row}-${column}`;
      const existingCell = cells[cellKey];
      
      // Ensure row and column are numbers
      const rowNum = parseInt(row);
      const columnNum = parseInt(column);
      
      if (isNaN(rowNum) || isNaN(columnNum)) {
        throw new Error('Row and column must be valid numbers');
      }

      const cellData = {
        sheet: activeSheet.id,
        row: rowNum,
        column: columnNum,
        value: value || '',
        formula: formula || '',
        style: style || {}
      };

      console.log('💾 Saving cell:', cellData);

      if (existingCell?.id) {
        // Update existing cell
        await cellApi.update(existingCell.id, { value, formula, style });
        console.log('✅ Cell updated:', { row, column, value, id: existingCell.id });
      } else {
        // Create new cell
        const response = await cellApi.create(cellData);
        const newCell = response.data;
        
        // Update with server ID
        setCells(prev => ({
          ...prev,
          [cellKey]: { 
            ...prev[cellKey], 
            id: newCell.id,
            row: rowNum,
            column: columnNum
          }
        }));
        console.log('✅ Cell created:', { row, column, value, id: newCell.id });
      }
    } catch (error) {
      console.error('❌ Error saving cell:', error);
      console.error('❌ Error details:', error.response?.data);
      
      // Revert optimistic update on error
      const cellKey = `${row}-${column}`;
      const originalCell = cells[cellKey];
      setCells(prev => ({
        ...prev,
        [cellKey]: originalCell
      }));
      
      throw error;
    }
  };

  const debouncedSaveCell = useCallback(
    (() => {
      let timeoutId;
      
      return (row, column, value, formula = '', style = {}) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        
        timeoutId = setTimeout(async () => {
          setSaving(true);
          try {
            await saveCellToBackend(row, column, value, formula, style);
          } catch (error) {
            console.error('Failed to save cell:', error);
          } finally {
            setSaving(false);
          }
        }, 1000); // 1 second debounce
      };
    })(),
    [cells, activeSheet]
  );

  const handleCellUpdate = useCallback((row, column, value, formula = '', style = {}) => {
    const cellKey = `${row}-${column}`;
    const existingCell = cells[cellKey];
    
    // Ensure row and column are numbers
    const rowNum = parseInt(row);
    const columnNum = parseInt(column);
    
    if (isNaN(rowNum) || isNaN(columnNum)) {
      console.error('Invalid row or column:', row, column);
      return;
    }

    // Optimistic update
    setCells(prev => ({
      ...prev,
      [cellKey]: {
        ...existingCell,
        id: existingCell?.id,
        row: rowNum,
        column: columnNum,
        value: value,
        formula: formula,
        style: { ...existingCell?.style, ...style },
        updated_at: new Date().toISOString()
      }
    }));

    // Send real-time update via WebSocket
    if (websocketService.getReadyState && websocketService.getReadyState() === WebSocket.OPEN) {
      websocketService.sendCellUpdate({
        id: existingCell?.id,
        sheet: activeSheet?.id,
        row: rowNum,
        column: columnNum,
        value: value,
        formula: formula,
        style: style
      });
    }

    // Debounce saving to backend
    debouncedSaveCell(rowNum, columnNum, value, formula, style);
  }, [cells, activeSheet, debouncedSaveCell]);

  const handleFormatChange = useCallback((format) => {
    setCurrentFormat(format);
    
    // Apply formatting to selected cells
    if (selectedCells.length > 0) {
      selectedCells.forEach(({ row, col }) => {
        handleCellUpdate(row, col, cells[`${row}-${col}`]?.value || '', '', format);
      });
    }
  }, [selectedCells, cells, handleCellUpdate]);

  const handleSheetChange = async (sheet) => {
    try {
      setActiveSheet(sheet);
      await loadSheetCells(sheet.id);
      setSelectedCells([]); // Clear selection when switching sheets
    } catch (error) {
      console.error('❌ Error switching sheets:', error);
      // Keep the current active sheet if loading fails
    }
  };

  const handleAddSheet = async () => {
    try {
      const newSheetTitle = `Sheet${spreadsheet.sheets.length + 1}`;
      const response = await spreadsheetApi.addSheet(spreadsheetId, newSheetTitle);
      const newSheet = response.data;
      
      setSpreadsheet(prev => ({
        ...prev,
        sheets: [...prev.sheets, newSheet]
      }));
      
      console.log('✅ Sheet added:', newSheetTitle);
    } catch (error) {
      console.error('❌ Error adding sheet:', error);
      if (error.response?.status === 403) {
        alert('You do not have permission to add sheets to this spreadsheet.');
      } else {
        alert('Failed to add new sheet. Please try again.');
      }
    }
  };

  const handleExport = async () => {
    try {
      setSaving(true);
      const response = await spreadsheetApi.export(spreadsheetId, 'json');
      const data = response.data;
      
      // Create and download file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${spreadsheet.title.replace(/[^a-z0-9]/gi, '_')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('✅ Spreadsheet exported');
    } catch (error) {
      console.error('❌ Error exporting spreadsheet:', error);
      alert('Failed to export spreadsheet. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/spreadsheet/${spreadsheetId}`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert('Share link copied to clipboard!');
      }).catch(() => {
        // Fallback for clipboard failure
        prompt('Copy this link to share:', shareUrl);
      });
    } else {
      // Fallback for browsers without clipboard API
      prompt('Copy this link to share:', shareUrl);
    }
  };

  const handleSelectionChange = useCallback((selectedCells) => {
    setSelectedCells(selectedCells);
  }, []);

  const reconnectWebSocket = () => {
    if (spreadsheetId) {
      setupWebSocket();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading spreadsheet...</p>
        </div>
      </div>
    );
  }

  if (!spreadsheet) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Spreadsheet not found</h2>
          <p className="text-gray-600">The spreadsheet you're looking for doesn't exist or you don't have permission to access it.</p>
          <button 
            onClick={() => window.history.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-gray-900 truncate max-w-md">
            {spreadsheet.title}
          </h1>
          
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <button 
              className={`flex items-center gap-1 hover:text-gray-700 ${
                saving ? 'text-orange-500' : 'text-green-500'
              }`}
              disabled
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'All changes saved'}
            </button>
            
            {/* Connection Status */}
            <div 
              className={`flex items-center gap-1 cursor-pointer ${
                connectionStatus === 'connected' ? 'text-green-500' : 
                connectionStatus === 'error' ? 'text-red-500' : 'text-yellow-500'
              }`}
              onClick={reconnectWebSocket}
              title={connectionStatus === 'error' ? 'Click to reconnect' : ''}
            >
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' : 
                connectionStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'
              }`}></div>
              <span className="text-xs">
                {connectionStatus === 'connected' ? 'Connected' : 
                 connectionStatus === 'error' ? 'Reconnect' : 'Connecting...'}
              </span>
            </div>
            
            <button className="flex items-center gap-1 hover:text-gray-700">
              <Users size={16} />
              {onlineUsers.length > 0 ? `${onlineUsers.length} online` : `${spreadsheet.collaborators?.length || 0} collaborators`}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleShare}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            <Share2 size={16} />
            Share
          </button>
          
          <button 
            onClick={handleExport}
            disabled={saving}
            className="flex items-center gap-1 px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={16} />
            Export
          </button>
          
          <button className="p-1 text-gray-500 hover:text-gray-700 transition-colors">
            <Menu size={20} />
          </button>
        </div>
      </div>

      {/* Sheet Tabs */}
      {spreadsheet.sheets && spreadsheet.sheets.length > 0 && (
        <SheetTabs
          sheets={spreadsheet.sheets}
          activeSheet={activeSheet}
          onSheetChange={handleSheetChange}
          onAddSheet={handleAddSheet}
        />
      )}

      {/* Toolbar */}
      <Toolbar onFormatChange={handleFormatChange} />

      {/* Spreadsheet Grid */}
      {activeSheet ? (
        <SpreadsheetGrid
          cells={cells}
          onCellUpdate={handleCellUpdate}
          onSelectionChange={handleSelectionChange}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <p>No sheets available</p>
            <button 
              onClick={handleAddSheet}
              className="mt-2 text-blue-600 hover:text-blue-700"
            >
              Create your first sheet
            </button>
          </div>
        </div>
      )}

      {/* Online Users Indicator */}
      {onlineUsers.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-3 max-w-xs">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Online Users</h3>
          <div className="space-y-1">
            {onlineUsers.map(user => (
              <div key={user.id} className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>{user.username || 'Unknown User'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SpreadsheetEditor;