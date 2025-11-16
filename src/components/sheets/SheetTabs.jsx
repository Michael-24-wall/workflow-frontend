import React, { useState } from 'react';
import { Plus, X, MoreHorizontal } from 'lucide-react';

const SheetTabs = ({ sheets, activeSheet, onSheetChange, onAddSheet, onDeleteSheet, onRenameSheet }) => {
  const [editingTab, setEditingTab] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [contextMenu, setContextMenu] = useState(null);

  const handleRenameStart = (sheet, e) => {
    e.stopPropagation();
    setEditingTab(sheet.id);
    setEditValue(sheet.title);
  };

  const handleRenameSubmit = (sheet) => {
    if (editValue.trim() && editValue !== sheet.title) {
      onRenameSheet(sheet.id, editValue.trim());
    }
    setEditingTab(null);
    setEditValue('');
  };

  const handleRenameCancel = () => {
    setEditingTab(null);
    setEditValue('');
  };

  const handleKeyDown = (e, sheet) => {
    if (e.key === 'Enter') {
      handleRenameSubmit(sheet);
    } else if (e.key === 'Escape') {
      handleRenameCancel();
    }
  };

  const handleDeleteSheet = (sheet, e) => {
    e.stopPropagation();
    if (sheets.length > 1) { // Prevent deleting the last sheet
      onDeleteSheet(sheet.id);
    }
  };

  const handleContextMenu = (sheet, e) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      sheetId: sheet.id
    });
  };

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="flex items-center px-4">
        {sheets.map((sheet) => (
          <div
            key={sheet.id}
            className={`group relative flex items-center border-b-2 ${
              activeSheet?.id === sheet.id
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <button
              onClick={() => onSheetChange(sheet)}
              onContextMenu={(e) => handleContextMenu(sheet, e)}
              className="px-4 py-2 text-sm font-medium flex items-center gap-2 min-w-0 flex-1"
            >
              {editingTab === sheet.id ? (
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => handleRenameSubmit(sheet)}
                  onKeyDown={(e) => handleKeyDown(e, sheet)}
                  className="outline-none bg-transparent border-b border-blue-500 w-32"
                  autoFocus
                />
              ) : (
                <>
                  <span className="truncate max-w-32">{sheet.title}</span>
                  {sheets.length > 1 && (
                    <button
                      onClick={(e) => handleDeleteSheet(sheet, e)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-gray-200 rounded transition-opacity"
                      title="Delete sheet"
                    >
                      <X size={12} />
                    </button>
                  )}
                </>
              )}
            </button>

            {/* More options button */}
            {!editingTab && (
              <button
                onClick={(e) => handleRenameStart(sheet, e)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded mr-1 transition-opacity"
                title="Rename sheet"
              >
                <MoreHorizontal size={12} />
              </button>
            )}
          </div>
        ))}
        
        <button
          onClick={onAddSheet}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded ml-1"
          title="Add new sheet"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Context Menu (optional enhancement) */}
      {contextMenu && (
        <div
          className="fixed bg-white border border-gray-200 rounded shadow-lg py-1 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onMouseLeave={() => setContextMenu(null)}
        >
          <button
            onClick={() => {
              const sheet = sheets.find(s => s.id === contextMenu.sheetId);
              if (sheet) {
                setEditingTab(sheet.id);
                setEditValue(sheet.title);
              }
              setContextMenu(null);
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
          >
            Rename
          </button>
          {sheets.length > 1 && (
            <button
              onClick={() => {
                onDeleteSheet(contextMenu.sheetId);
                setContextMenu(null);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-red-600"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SheetTabs;