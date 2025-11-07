import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';

const DocumentEditor = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();
  
  const {
    editorCurrentDocument,
    editorLoading,
    editorError,
    editorUpdateDocumentData,
    editorFetchDocument,
    editorClearError,
    editorClearCurrentDocument,
  } = useAuthStore();

  // State for spreadsheet data
  const [spreadsheetData, setSpreadsheetData] = useState({
    sheets: [
      {
        id: 'sheet-1',
        name: 'Sheet 1',
        data: [
          ['', '', '', '', ''],
          ['', '', '', '', ''],
          ['', '', '', '', ''],
          ['', '', '', '', ''],
          ['', '', '', '', '']
        ],
        activeCell: { row: 0, col: 0 },
        selection: { start: { row: 0, col: 0 }, end: { row: 0, col: 0 } }
      }
    ],
    activeSheet: 'sheet-1'
  });

  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [activeTool, setActiveTool] = useState('select');
  const gridRef = useRef(null);
  const timeoutRef = useRef(null);

  // Load document data
  useEffect(() => {
    if (documentId) {
      loadDocument();
    }

    return () => {
      editorClearCurrentDocument();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [documentId]);

  const loadDocument = async () => {
    try {
      const document = await editorFetchDocument(documentId);
      if (document?.editor_data) {
        setSpreadsheetData(document.editor_data);
      }
    } catch (error) {
      console.error('Failed to load document:', error);
    }
  };

  // Auto-save functionality
  useEffect(() => {
    if (hasUnsavedChanges && documentId) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(async () => {
        try {
          await editorUpdateDocumentData(documentId, spreadsheetData);
          setHasUnsavedChanges(false);
          setLastSaved(new Date());
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      }, 2000);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [spreadsheetData, hasUnsavedChanges, documentId]);

  const handleManualSave = async () => {
    if (!documentId) return;
    
    try {
      await editorUpdateDocumentData(documentId, spreadsheetData);
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save document:', error);
    }
  };

  const handleCellClick = (rowIndex, colIndex) => {
    const currentSheet = spreadsheetData.sheets.find(s => s.id === spreadsheetData.activeSheet);
    if (!currentSheet) return;

    setSpreadsheetData(prev => ({
      ...prev,
      sheets: prev.sheets.map(sheet =>
        sheet.id === prev.activeSheet
          ? {
              ...sheet,
              activeCell: { row: rowIndex, col: colIndex },
              selection: { 
                start: { row: rowIndex, col: colIndex }, 
                end: { row: rowIndex, col: colIndex } 
              }
            }
          : sheet
      )
    }));
  };

  const handleCellDoubleClick = (rowIndex, colIndex) => {
    const currentSheet = spreadsheetData.sheets.find(s => s.id === spreadsheetData.activeSheet);
    if (!currentSheet) return;

    setEditingCell({ row: rowIndex, col: colIndex });
    setEditValue(currentSheet.data[rowIndex]?.[colIndex] || '');
  };

  const handleCellChange = (rowIndex, colIndex, value) => {
    setSpreadsheetData(prev => ({
      ...prev,
      sheets: prev.sheets.map(sheet =>
        sheet.id === prev.activeSheet
          ? {
              ...sheet,
              data: sheet.data.map((row, rIdx) =>
                rIdx === rowIndex
                  ? row.map((cell, cIdx) => (cIdx === colIndex ? value : cell))
                  : row
              )
            }
          : sheet
      )
    }));
    setHasUnsavedChanges(true);
  };

  const finishEditing = () => {
    if (editingCell) {
      handleCellChange(editingCell.row, editingCell.col, editValue);
    }
    setEditingCell(null);
    setEditValue('');
  };

  const cancelEditing = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleKeyDown = (e) => {
    if (editingCell) {
      if (e.key === 'Enter') {
        finishEditing();
      } else if (e.key === 'Escape') {
        cancelEditing();
      }
      return;
    }

    const currentSheet = spreadsheetData.sheets.find(s => s.id === spreadsheetData.activeSheet);
    if (!currentSheet) return;

    // Navigation keys
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setEditingCell(currentSheet.activeCell);
      setEditValue(currentSheet.data[currentSheet.activeCell.row]?.[currentSheet.activeCell.col] || '');
    } else if (e.key === 'ArrowUp' && currentSheet.activeCell.row > 0) {
      e.preventDefault();
      handleCellClick(currentSheet.activeCell.row - 1, currentSheet.activeCell.col);
    } else if (e.key === 'ArrowDown' && currentSheet.activeCell.row < currentSheet.data.length - 1) {
      e.preventDefault();
      handleCellClick(currentSheet.activeCell.row + 1, currentSheet.activeCell.col);
    } else if (e.key === 'ArrowLeft' && currentSheet.activeCell.col > 0) {
      e.preventDefault();
      handleCellClick(currentSheet.activeCell.row, currentSheet.activeCell.col - 1);
    } else if (e.key === 'ArrowRight' && currentSheet.activeCell.col < currentSheet.data[0].length - 1) {
      e.preventDefault();
      handleCellClick(currentSheet.activeCell.row, currentSheet.activeCell.col + 1);
    }
  };

  const handleAddRow = (position = 'bottom') => {
    setSpreadsheetData(prev => ({
      ...prev,
      sheets: prev.sheets.map(sheet =>
        sheet.id === prev.activeSheet
          ? {
              ...sheet,
              data: position === 'top' 
                ? [Array(sheet.data[0]?.length || 5).fill(''), ...sheet.data]
                : [...sheet.data, Array(sheet.data[0]?.length || 5).fill('')]
            }
          : sheet
      )
    }));
    setHasUnsavedChanges(true);
  };

  const handleAddColumn = (position = 'right') => {
    setSpreadsheetData(prev => ({
      ...prev,
      sheets: prev.sheets.map(sheet =>
        sheet.id === prev.activeSheet
          ? {
              ...sheet,
              data: sheet.data.map(row =>
                position === 'left' 
                  ? ['', ...row]
                  : [...row, '']
              )
            }
          : sheet
      )
    }));
    setHasUnsavedChanges(true);
  };

  const handleDeleteRow = (rowIndex) => {
    if (window.confirm('Are you sure you want to delete this row?')) {
      setSpreadsheetData(prev => ({
        ...prev,
        sheets: prev.sheets.map(sheet =>
          sheet.id === prev.activeSheet
            ? {
                ...sheet,
                data: sheet.data.filter((_, rIdx) => rIdx !== rowIndex)
              }
            : sheet
        )
      }));
      setHasUnsavedChanges(true);
    }
  };

  const handleDeleteColumn = (colIndex) => {
    if (window.confirm('Are you sure you want to delete this column?')) {
      setSpreadsheetData(prev => ({
        ...prev,
        sheets: prev.sheets.map(sheet =>
          sheet.id === prev.activeSheet
            ? {
                ...sheet,
                data: sheet.data.map(row => row.filter((_, cIdx) => cIdx !== colIndex))
              }
            : sheet
        )
      }));
      setHasUnsavedChanges(true);
    }
  };

  const handleAddSheet = () => {
    const newSheetId = `sheet-${Date.now()}`;
    setSpreadsheetData(prev => ({
      ...prev,
      sheets: [
        ...prev.sheets,
        {
          id: newSheetId,
          name: `Sheet ${prev.sheets.length + 1}`,
          data: [
            ['', '', '', '', ''],
            ['', '', '', '', ''],
            ['', '', '', '', '']
          ],
          activeCell: { row: 0, col: 0 },
          selection: { start: { row: 0, col: 0 }, end: { row: 0, col: 0 } }
        }
      ],
      activeSheet: newSheetId
    }));
    setHasUnsavedChanges(true);
  };

  const handleRenameSheet = (sheetId, newName) => {
    if (!newName.trim()) return;
    
    setSpreadsheetData(prev => ({
      ...prev,
      sheets: prev.sheets.map(sheet =>
        sheet.id === sheetId ? { ...sheet, name: newName } : sheet
      )
    }));
    setHasUnsavedChanges(true);
  };

  const handleDeleteSheet = (sheetId) => {
    if (spreadsheetData.sheets.length <= 1) {
      alert('You cannot delete the last sheet.');
      return;
    }

    if (window.confirm('Are you sure you want to delete this sheet?')) {
      setSpreadsheetData(prev => ({
        ...prev,
        sheets: prev.sheets.filter(sheet => sheet.id !== sheetId),
        activeSheet: prev.sheets.find(sheet => sheet.id !== sheetId)?.id || ''
      }));
      setHasUnsavedChanges(true);
    }
  };

  const handleSetActiveSheet = (sheetId) => {
    setSpreadsheetData(prev => ({ ...prev, activeSheet: sheetId }));
  };

  const currentSheet = spreadsheetData.sheets.find(sheet => sheet.id === spreadsheetData.activeSheet);

  if (editorLoading && !editorCurrentDocument) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
          <p className="mt-4 text-blue-900 font-bold">Loading document...</p>
        </div>
      </div>
    );
  }

  if (!editorCurrentDocument) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-blue-900 mb-2">Document not found</h2>
          <button
            onClick={() => navigate('/editor')}
            className="bg-blue-900 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-800 transition-colors"
          >
            Back to Editor
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="bg-blue-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/editor')}
                className="text-white hover:text-blue-200 flex items-center transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Editor
              </button>
              
              <div>
                <h1 className="text-lg font-bold">{editorCurrentDocument.title}</h1>
                <p className="text-blue-200 text-sm">
                  {hasUnsavedChanges ? '● Unsaved changes' : 'All changes saved'}
                </p>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              <button
                onClick={handleManualSave}
                disabled={!hasUnsavedChanges}
                className="bg-white text-blue-900 px-4 py-2 rounded-lg font-bold hover:bg-blue-50 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Save
              </button>
              
              <div className="flex items-center space-x-2 border-l border-blue-700 pl-4">
                <div className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {useAuthStore.getState().user?.first_name?.[0]}{useAuthStore.getState().user?.last_name?.[0]}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center space-x-4">
          <div className="flex items-center space-x-1 bg-white rounded-lg p-1 border border-blue-200">
            <button
              onClick={() => setActiveTool('select')}
              className={`p-2 rounded ${
                activeTool === 'select' ? 'bg-blue-900 text-white' : 'text-blue-900 hover:bg-blue-100'
              } transition-colors`}
              title="Select"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleAddRow('top')}
              className="bg-white text-blue-900 px-3 py-2 rounded-lg border border-blue-200 font-bold hover:bg-blue-100 transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Row</span>
            </button>

            <button
              onClick={() => handleAddColumn('right')}
              className="bg-white text-blue-900 px-3 py-2 rounded-lg border border-blue-200 font-bold hover:bg-blue-100 transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Column</span>
            </button>

            <button
              onClick={handleAddSheet}
              className="bg-blue-900 text-white px-3 py-2 rounded-lg font-bold hover:bg-blue-800 transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              <span>Add Sheet</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sheet Tabs */}
      <div className="bg-white border-b border-blue-200 px-4">
        <div className="max-w-7xl mx-auto flex items-center space-x-1 overflow-x-auto">
          {spreadsheetData.sheets.map((sheet) => (
            <div
              key={sheet.id}
              className={`
                flex items-center space-x-2 px-4 py-2 border-b-2 transition-colors min-w-0
                ${spreadsheetData.activeSheet === sheet.id
                  ? 'border-blue-900 bg-blue-50 text-blue-900'
                  : 'border-transparent text-gray-600 hover:text-blue-900 hover:bg-blue-25'
                }
              `}
            >
              <button
                onClick={() => handleSetActiveSheet(sheet.id)}
                className="flex items-center space-x-2 min-w-0 flex-1"
              >
                <span className="truncate font-medium">{sheet.name}</span>
              </button>
              
              {spreadsheetData.sheets.length > 1 && (
                <button
                  onClick={() => handleDeleteSheet(sheet.id)}
                  className="text-gray-400 hover:text-red-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
          
          <button
            onClick={handleAddSheet}
            className="px-3 py-2 text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Error Display */}
      {editorError && (
        <div className="bg-red-50 border border-red-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 text-sm">⚠️</span>
              </div>
              <span className="text-red-800 font-medium">{editorError}</span>
            </div>
            <button
              onClick={editorClearError}
              className="text-red-600 hover:text-red-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Formula Bar */}
      <div className="bg-white border-b border-blue-200 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center space-x-4">
          <div className="w-20 text-sm font-bold text-blue-900">
            {currentSheet && 
              `${String.fromCharCode(65 + currentSheet.activeCell.col)}${currentSheet.activeCell.row + 1}`
            }
          </div>
          <div className="flex-1">
            <input
              type="text"
              value={editingCell ? editValue : (currentSheet?.data[currentSheet.activeCell.row]?.[currentSheet.activeCell.col] || '')}
              onChange={(e) => {
                if (editingCell) {
                  setEditValue(e.target.value);
                } else {
                  handleCellChange(currentSheet.activeCell.row, currentSheet.activeCell.col, e.target.value);
                }
              }}
              onFocus={() => {
                if (!editingCell) {
                  setEditingCell(currentSheet.activeCell);
                  setEditValue(currentSheet.data[currentSheet.activeCell.row]?.[currentSheet.activeCell.col] || '');
                }
              }}
              onBlur={finishEditing}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:border-blue-900 focus:ring-0 transition-colors"
              placeholder="Enter value or formula..."
            />
          </div>
        </div>
      </div>

      {/* Spreadsheet Grid */}
      <div 
        ref={gridRef}
        className="flex-1 overflow-auto bg-white"
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        {currentSheet && (
          <div className="p-4">
            <div className="inline-block border border-blue-200 rounded-lg overflow-hidden shadow-sm">
              <table className="border-collapse">
                <thead>
                  <tr>
                    <th className="w-12 bg-blue-50 border border-blue-200 p-2"></th>
                    {currentSheet.data[0]?.map((_, colIndex) => (
                      <th 
                        key={colIndex}
                        className="bg-blue-50 border border-blue-200 p-2 min-w-32 text-sm font-bold text-blue-900 relative group"
                      >
                        {String.fromCharCode(65 + colIndex)}
                        <button
                          onClick={() => handleDeleteColumn(colIndex)}
                          className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs transition-opacity"
                          title="Delete column"
                        >
                          ×
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentSheet.data.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      <td className="bg-blue-50 border border-blue-200 p-2 text-center font-bold text-blue-900 text-sm relative group">
                        {rowIndex + 1}
                        <button
                          onClick={() => handleDeleteRow(rowIndex)}
                          className="absolute -left-1 -top-1 opacity-0 group-hover:opacity-100 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs transition-opacity"
                          title="Delete row"
                        >
                          ×
                        </button>
                      </td>
                      {row.map((cell, colIndex) => {
                        const isActive = currentSheet.activeCell.row === rowIndex && 
                                        currentSheet.activeCell.col === colIndex;
                        const isEditing = editingCell?.row === rowIndex && 
                                        editingCell?.col === colIndex;
                        
                        return (
                          <td 
                            key={colIndex}
                            className={`
                              border border-blue-200 p-0 relative min-w-32
                              ${isActive ? 'ring-2 ring-blue-900' : ''}
                              transition-all
                            `}
                            onClick={() => handleCellClick(rowIndex, colIndex)}
                            onDoubleClick={() => handleCellDoubleClick(rowIndex, colIndex)}
                          >
                            {isEditing ? (
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={finishEditing}
                                onKeyDown={handleKeyDown}
                                className="w-full h-10 px-3 border-0 focus:outline-none focus:ring-0"
                                autoFocus
                              />
                            ) : (
                              <div className="h-10 px-3 flex items-center text-blue-900">
                                {cell}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="bg-blue-900 text-white px-4 py-2 border-t border-blue-700">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-sm">
          <div>
            {hasUnsavedChanges ? (
              <span className="text-orange-300">● Unsaved changes</span>
            ) : (
              <span className="text-blue-200">All changes saved</span>
            )}
          </div>
          <div className="text-blue-200">
            {lastSaved && `Last saved: ${lastSaved.toLocaleTimeString()}`}
          </div>
          <div className="text-blue-200">
            {currentSheet && 
              `${currentSheet.data.length} rows × ${currentSheet.data[0]?.length || 0} columns`
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentEditor;