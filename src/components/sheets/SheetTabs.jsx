import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, X, MoreHorizontal, Edit3, Trash2 } from 'lucide-react';

const SheetTabs = ({ 
  sheets = [], 
  activeSheet, 
  onSheetChange, 
  onAddSheet, 
  onDeleteSheet, 
  onRenameSheet 
}) => {
  const [editingTab, setEditingTab] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [contextMenu, setContextMenu] = useState(null);
  const [hoveredTab, setHoveredTab] = useState(null);
  
  const inputRef = useRef(null);
  const contextMenuRef = useRef(null);

  // Auto-focus input when editing starts
  useEffect(() => {
    if (editingTab && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingTab]);

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

  // Close context menu on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setContextMenu(null);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleRenameStart = useCallback((sheet, e) => {
    if (e) e.stopPropagation();
    setEditingTab(sheet.id);
    setEditValue(sheet.title);
    setContextMenu(null); // Close context menu if open
  }, []);

  const handleRenameSubmit = useCallback((sheet) => {
    const trimmedValue = editValue.trim();
    
    if (trimmedValue && trimmedValue !== sheet.title) {
      // Validate sheet title
      if (trimmedValue.length > 50) {
        alert('Sheet title must be less than 50 characters');
        return;
      }
      
      if (sheets.some(s => s.id !== sheet.id && s.title === trimmedValue)) {
        alert('A sheet with this name already exists');
        return;
      }
      
      onRenameSheet?.(sheet.id, trimmedValue);
    }
    setEditingTab(null);
    setEditValue('');
  }, [editValue, sheets, onRenameSheet]);

  const handleRenameCancel = useCallback(() => {
    setEditingTab(null);
    setEditValue('');
  }, []);

  const handleKeyDown = useCallback((e, sheet) => {
    if (e.key === 'Enter') {
      handleRenameSubmit(sheet);
    } else if (e.key === 'Escape') {
      handleRenameCancel();
    }
  }, [handleRenameSubmit, handleRenameCancel]);

  const handleDeleteSheet = useCallback((sheetId, e) => {
    if (e) e.stopPropagation();
    
    if (sheets.length <= 1) {
      alert('Cannot delete the last sheet');
      return;
    }

    if (window.confirm('Are you sure you want to delete this sheet? This action cannot be undone.')) {
      onDeleteSheet?.(sheetId);
    }
    setContextMenu(null);
  }, [sheets.length, onDeleteSheet]);

  const handleContextMenu = useCallback((sheet, e) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      sheetId: sheet.id
    });
  }, []);

  const handleTabClick = useCallback((sheet) => {
    setContextMenu(null); // Close context menu when switching tabs
    onSheetChange?.(sheet);
  }, [onSheetChange]);

  const handleAddSheet = useCallback(() => {
    setContextMenu(null); // Close context menu when adding new sheet
    onAddSheet?.();
  }, [onAddSheet]);

  // Generate unique sheet title
  const getNewSheetTitle = useCallback(() => {
    const baseTitle = 'Sheet';
    let counter = sheets.length + 1;
    let newTitle = `${baseTitle}${counter}`;
    
    // Find unique name
    while (sheets.some(sheet => sheet.title === newTitle)) {
      counter++;
      newTitle = `${baseTitle}${counter}`;
    }
    
    return newTitle;
  }, [sheets]);

  // Safe sheet operations
  const safeRenameSheet = useCallback((sheetId, newTitle) => {
    if (!sheetId || !newTitle) {
      console.error('Invalid parameters for rename');
      return;
    }
    onRenameSheet?.(sheetId, newTitle);
  }, [onRenameSheet]);

  const safeDeleteSheet = useCallback((sheetId) => {
    if (!sheetId) {
      console.error('Invalid sheet ID for deletion');
      return;
    }
    onDeleteSheet?.(sheetId);
  }, [onDeleteSheet]);

  if (!sheets || sheets.length === 0) {
    return (
      <div className="bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">No sheets available</span>
          <button
            onClick={handleAddSheet}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            Add Sheet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="flex items-center px-4 min-h-10">
        {/* Sheet Tabs */}
        <div className="flex items-center flex-1 overflow-x-auto scrollbar-hide">
          {sheets.map((sheet) => (
            <div
              key={sheet.id}
              className={`group relative flex items-center border-b-2 transition-colors ${
                activeSheet?.id === sheet.id
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              onMouseEnter={() => setHoveredTab(sheet.id)}
              onMouseLeave={() => setHoveredTab(null)}
            >
              <button
                onClick={() => handleTabClick(sheet)}
                onContextMenu={(e) => handleContextMenu(sheet, e)}
                className="px-4 py-2 text-sm font-medium flex items-center gap-2 min-w-0 max-w-40 transition-colors"
                title={sheet.title}
              >
                {editingTab === sheet.id ? (
                  <input
                    ref={inputRef}
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => handleRenameSubmit(sheet)}
                    onKeyDown={(e) => handleKeyDown(e, sheet)}
                    className="outline-none bg-transparent border-b border-blue-500 w-32 text-gray-900"
                    maxLength={50}
                  />
                ) : (
                  <>
                    <span className="truncate">{sheet.title}</span>
                    
                    {/* Delete button - only show on hover and if not the last sheet */}
                    {sheets.length > 1 && hoveredTab === sheet.id && (
                      <button
                        onClick={(e) => handleDeleteSheet(sheet.id, e)}
                        className="p-0.5 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                        title="Delete sheet"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </>
                )}
              </button>

              {/* Edit button - only show on hover when not editing */}
              {!editingTab && hoveredTab === sheet.id && (
                <button
                  onClick={(e) => handleRenameStart(sheet, e)}
                  className="p-1 hover:bg-gray-200 rounded mr-1 transition-colors flex-shrink-0"
                  title="Rename sheet"
                >
                  <MoreHorizontal size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
        
        {/* Add Sheet Button */}
        <button
          onClick={handleAddSheet}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded ml-2 transition-colors flex-shrink-0"
          title="Add new sheet"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-32"
          style={{ 
            left: Math.min(contextMenu.x, window.innerWidth - 150),
            top: contextMenu.y 
          }}
        >
          <button
            onClick={() => {
              const sheet = sheets.find(s => s.id === contextMenu.sheetId);
              if (sheet) handleRenameStart(sheet);
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 transition-colors"
          >
            <Edit3 size={14} />
            Rename
          </button>
          
          {sheets.length > 1 && (
            <button
              onClick={() => handleDeleteSheet(contextMenu.sheetId)}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-red-600 flex items-center gap-2 transition-colors"
            >
              <Trash2 size={14} />
              Delete
            </button>
          )}
        </div>
      )}

      {/* Empty state overlay for context menu */}
      {contextMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setContextMenu(null)}
        />
      )}
    </div>
  );
};

// Default props for safety
SheetTabs.defaultProps = {
  sheets: [],
  onSheetChange: () => {},
  onAddSheet: () => {},
  onDeleteSheet: () => {},
  onRenameSheet: () => {}
};

export default SheetTabs;