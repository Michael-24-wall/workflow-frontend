import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Save, Share2, Download } from 'lucide-react';
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
  const [saving, setSaving] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [selectedCells, setSelectedCells] = useState([]);
  const [currentFormat, setCurrentFormat] = useState({});
  
  const saveTimeoutRef = useRef(null);

  // Load spreadsheet and cells
  const loadSpreadsheet = useCallback(async () => {
    try {
      const response = await spreadsheetApi.getById(spreadsheetId);
      const spreadsheetData = response.data;
      setSpreadsheet(spreadsheetData);
      
      if (spreadsheetData.sheets && spreadsheetData.sheets.length > 0) {
        const firstSheet = spreadsheetData.sheets[0];
        setActiveSheet(firstSheet);
        await loadSheetCells(firstSheet.id);
      }
    } catch (error) {
      console.error('Error loading spreadsheet:', error);
    }
  }, [spreadsheetId]);

  const loadSheetCells = useCallback(async (sheetId) => {
    try {
      const response = await sheetApi.getById(sheetId);
      const sheetData = response.data;
      
      const cellsMap = {};
      if (sheetData.cells && Array.isArray(sheetData.cells)) {
        sheetData.cells.forEach(cell => {
          const key = `${cell.row}-${cell.column}`;
          cellsMap[key] = {
            id: cell.id,
            row: cell.row,
            column: cell.column,
            value: cell.value || '',
            formula: cell.formula || '',
            style: cell.style || {},
            created_at: cell.created_at,
            updated_at: cell.updated_at
          };
        });
      }
      
      setCells(cellsMap);
    } catch (error) {
      console.error('Error loading sheet cells:', error);
      setCells({});
    }
  }, []);

  // Cell saving function
  const saveCellToBackend = useCallback(async (row, column, value, formula = '', style = {}) => {
    try {
      const cellKey = `${row}-${column}`;

      if (!activeSheet) {
        throw new Error('No active sheet selected');
      }

      const cellData = {
        sheet: activeSheet.id,
        row: parseInt(row),
        column: parseInt(column),
        value: value || '',
        formula: formula || '',
        style: style || {}
      };

      let savedCell;
      const currentCell = cells[cellKey];
      
      if (currentCell?.id) {
        savedCell = await cellApi.update(currentCell.id, { 
          value, 
          formula, 
          style 
        });
      } else {
        savedCell = await cellApi.create(cellData);
        
        setCells(prev => ({
          ...prev,
          [cellKey]: { 
            ...prev[cellKey], 
            id: savedCell.data.id
          }
        }));
      }
      
      return savedCell.data;
      
    } catch (error) {
      console.error('Failed to save cell:', error);
      throw error;
    }
  }, [activeSheet, cells]);

  // Debounced save
  const debouncedSaveCell = useCallback(
    (row, column, value, formula = '', style = {}) => {
      const cellKey = `${row}-${column}`;
      
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(async () => {
        setSaving(true);
        try {
          await saveCellToBackend(row, column, value, formula, style);
        } catch (error) {
          console.error('Failed to save cell:', error);
        } finally {
          setSaving(false);
        }
      }, 1000);
    },
    [saveCellToBackend]
  );

  // Cell update handler
  const handleCellUpdate = useCallback((row, column, value, formula = '', style = {}) => {
    const rowNum = parseInt(row);
    const columnNum = parseInt(column);
    
    if (isNaN(rowNum) || isNaN(columnNum) || rowNum < 0 || columnNum < 0) {
      return;
    }

    const cellKey = `${rowNum}-${columnNum}`;
    const existingCell = cells[cellKey];

    setCells(prev => ({
      ...prev,
      [cellKey]: {
        ...existingCell,
        id: existingCell?.id,
        row: rowNum,
        column: columnNum,
        value: value,
        formula: formula || '',
        style: { ...existingCell?.style, ...style },
        updated_at: new Date().toISOString()
      }
    }));

    if (websocketService.getReadyState && websocketService.getReadyState() === WebSocket.OPEN) {
      websocketService.sendCellUpdate({
        cell_id: cellKey,
        value: value,
        formula: formula
      });
    }

    debouncedSaveCell(rowNum, columnNum, value, formula, style);
  }, [cells, debouncedSaveCell]);

  // Toolbar format handler
  const handleFormatChange = useCallback((format) => {
    setCurrentFormat(format);
    
    if (selectedCells.length > 0) {
      selectedCells.forEach(({ row, col }) => {
        const cellKey = `${row}-${col}`;
        const currentCell = cells[cellKey];
        
        const style = {
          fontFamily: format.fontFamily,
          fontSize: format.fontSize ? parseInt(format.fontSize) : undefined,
          fontWeight: format.bold ? 'bold' : 'normal',
          fontStyle: format.italic ? 'italic' : 'normal',
          textDecoration: format.underline ? 'underline' : 'none',
          color: format.textColor,
          backgroundColor: format.fillColor,
          textAlign: format.align
        };
        
        handleCellUpdate(row, col, currentCell?.value || '', currentCell?.formula || '', style);
      });
    }
  }, [selectedCells, cells, handleCellUpdate]);

  // Save pending changes
  const savePendingChanges = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
  }, []);

  // Manual save
  const handleManualSave = useCallback(() => {
    savePendingChanges();
    setSaving(true);
    setTimeout(() => setSaving(false), 1000);
  }, [savePendingChanges]);

  // Remote cell update
  const handleRemoteCellUpdate = useCallback((cellData) => {
    if (!cellData) return;
    
    let row, column, value, formula;
    
    if (cellData.cell_id) {
      [row, column] = cellData.cell_id.split('-');
      value = cellData.value;
      formula = cellData.formula;
    } else {
      row = cellData.row;
      column = cellData.column;
      value = cellData.value;
      formula = cellData.formula;
    }
    
    const rowNum = parseInt(row);
    const columnNum = parseInt(column);
    
    if (isNaN(rowNum) || isNaN(columnNum)) return;
    
    const key = `${rowNum}-${columnNum}`;
    
    setCells(prev => ({
      ...prev,
      [key]: { 
        ...prev[key], 
        row: rowNum,
        column: columnNum,
        value: value || '',
        formula: formula || '',
        updated_at: new Date().toISOString()
      }
    }));
  }, []);

  // WebSocket setup
  const setupWebSocket = useCallback(() => {
    if (connectionStatus === 'connecting' || connectionStatus === 'connected') {
      return;
    }

    const onMessage = (data) => {
      switch (data.type) {
        case 'cell_updated':
          if (data.cell_id && typeof data.cell_id === 'string') {
            const [row, column] = data.cell_id.split('-').map(Number);
            if (!isNaN(row) && !isNaN(column)) {
              handleRemoteCellUpdate({
                row,
                column, 
                value: data.value,
                formula: data.formula
              });
            }
          }
          break;
        default:
          break;
      }
    };

    const onError = (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('error');
    };

    const onClose = (event) => {
      setConnectionStatus('disconnected');
    };

    setConnectionStatus('connecting');
    websocketService.connect(spreadsheetId, onMessage, onError, onClose);
  }, [spreadsheetId, connectionStatus, handleRemoteCellUpdate]);

  // Sheet management
  const handleSheetChange = useCallback(async (sheet) => {
    savePendingChanges();
    setActiveSheet(sheet);
    await loadSheetCells(sheet.id);
    setSelectedCells([]);
  }, [loadSheetCells, savePendingChanges]);

  const handleAddSheet = useCallback(async () => {
    try {
      const newSheetTitle = `Sheet${spreadsheet.sheets.length + 1}`;
      const response = await spreadsheetApi.addSheet(spreadsheetId, newSheetTitle);
      const newSheet = response.data;
      
      setSpreadsheet(prev => ({
        ...prev,
        sheets: [...prev.sheets, newSheet]
      }));
    } catch (error) {
      console.error('Error adding sheet:', error);
    }
  }, [spreadsheet, spreadsheetId]);

  // Export function
  // Export function - FIXED VERSION
// Export function - FIXED VERSION
// Export function - FIXED VERSION
// Export function - ALTERNATIVE VERSION
// Simple PDF Export function
// Export function - SIMPLE VERSION
// Export function - USING FETCH WITH BACKEND DOWNLOAD
// Export function - USING BACKEND DOWNLOAD ENDPOINT
// Export function - USING FETCH WITH BACKEND DOWNLOAD
// Export function - USING THE DOWNLOAD ENDPOINT
const handleExport = useCallback(async () => {
  try {
    setSaving(true);
    
    // Use the DOWNLOAD endpoint, not the export endpoint
    const downloadUrl = `http://localhost:9000/api/sheets/spreadsheets/${spreadsheetId}/download/`;
    
    console.log('📤 Downloading from:', downloadUrl);
    
    // Method 1: Direct link approach (simplest)
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
  } catch (error) {
    console.error('Error exporting spreadsheet:', error);
  } finally {
    setSaving(false);
  }
}, [spreadsheetId]);
  // Share function
  const handleShare = useCallback(() => {
    const shareUrl = `${window.location.origin}/spreadsheet/${spreadsheetId}`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert('Share link copied to clipboard!');
      });
    } else {
      prompt('Copy this link to share:', shareUrl);
    }
  }, [spreadsheetId]);

  // Selection change
  const handleSelectionChange = useCallback((selectedCells) => {
    setSelectedCells(selectedCells);
  }, []);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleManualSave();
    }
    if (e.key === 'Escape') {
      setSelectedCells([]);
    }
  }, [handleManualSave]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Main effect
  useEffect(() => {
    if (spreadsheetId) {
      loadSpreadsheet();
      setupWebSocket();
    }
  }, [spreadsheetId, loadSpreadsheet, setupWebSocket]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      websocketService.disconnect();
    };
  }, []);

  if (!spreadsheet) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Spreadsheet not found</h2>
          <p className="text-gray-600">The spreadsheet you're looking for doesn't exist.</p>
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
            <button className={`flex items-center gap-1 ${saving ? 'text-orange-500' : 'text-green-500'}`}>
              <Save size={16} />
              {saving ? 'Saving...' : 'All changes saved'}
            </button>
            
            <button 
              onClick={handleManualSave}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              <Save size={12} />
              Save Now
            </button>

            <div className={`flex items-center gap-1 ${
              connectionStatus === 'connected' ? 'text-green-500' : 
              connectionStatus === 'error' ? 'text-red-500' : 'text-yellow-500'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' : 
                connectionStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'
              }`} />
              <span className="text-xs">{connectionStatus}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleShare}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Share2 size={16} />
            Share
          </button>
          
          <button 
            onClick={handleExport}
            disabled={saving}
            className="flex items-center gap-1 px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            <Download size={16} />
            Export
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
      <Toolbar 
        onFormatChange={handleFormatChange} 
        selectedCells={selectedCells}
      />

      {/* Spreadsheet Grid */}
      {activeSheet ? (
        <SpreadsheetGrid
          cells={cells}
          onCellUpdate={handleCellUpdate}
          onSelectionChange={handleSelectionChange}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center text-gray-500">
            <p>No active sheet</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpreadsheetEditor;