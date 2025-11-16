import React, { useState, useCallback, useRef, useEffect } from 'react';

const ROWS = 100;
const COLS = 26; // A-Z

const SpreadsheetGrid = ({ cells, onCellUpdate, onSelectionChange }) => {
  const [selectedCell, setSelectedCell] = useState(null);
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef(null);
  const isSavingRef = useRef(false);

  const getColumnName = (index) => {
    return String.fromCharCode(65 + index);
  };

  // Auto-focus input when editing starts
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  const handleCellClick = useCallback((row, col) => {
    const cellKey = `${row}-${col}`;
    const cell = cells[cellKey];
    setSelectedCell({ row, col });
    setEditingCell({ row, col });
    setEditValue(cell?.value || '');
    
    // Notify parent about selection change
    if (onSelectionChange) {
      onSelectionChange([{ row, col }]);
    }
  }, [cells, onSelectionChange]);

  const handleCellDoubleClick = useCallback((row, col) => {
    // Double click immediately starts editing
    handleCellClick(row, col);
  }, [handleCellClick]);

  const saveCellValue = useCallback(() => {
    if (editingCell && !isSavingRef.current) {
      isSavingRef.current = true;
      
      const cellKey = `${editingCell.row}-${editingCell.column}`;
      const currentValue = cells[cellKey]?.value || '';
      
      if (editValue !== currentValue) {
        onCellUpdate(editingCell.row, editingCell.column, editValue);
      }
      
      setEditingCell(null);
      isSavingRef.current = false;
    }
  }, [editingCell, editValue, cells, onCellUpdate]);

  const handleCellBlur = useCallback(() => {
    // Use setTimeout to ensure this runs after the click event for the new cell
    setTimeout(() => {
      if (document.activeElement !== inputRef.current) {
        saveCellValue();
      }
    }, 10);
  }, [saveCellValue]);

  const handleKeyDown = useCallback((e) => {
    if (!editingCell) return;

    if (e.key === 'Enter') {
      e.preventDefault();
      saveCellValue();
      
      // Move to next row on Enter
      if (selectedCell && selectedCell.row < ROWS - 1) {
        setTimeout(() => {
          handleCellClick(selectedCell.row + 1, selectedCell.column);
        }, 10);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      const cellKey = `${editingCell.row}-${editingCell.column}`;
      const cell = cells[cellKey];
      setEditValue(cell?.value || '');
      setEditingCell(null);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      saveCellValue();
      
      // Move to next column on Tab
      if (selectedCell && selectedCell.column < COLS - 1) {
        setTimeout(() => {
          handleCellClick(selectedCell.row, selectedCell.column + 1);
        }, 10);
      }
    }
  }, [editingCell, selectedCell, cells, saveCellValue, handleCellClick]);

  const getCellValue = useCallback((row, col) => {
    return cells[`${row}-${col}`]?.value || '';
  }, [cells]);

  const getCellStyle = useCallback((cell) => {
    if (!cell?.style) return {};
    
    return {
      backgroundColor: cell.style.backgroundColor,
      fontWeight: cell.style.fontWeight,
      fontStyle: cell.style.fontStyle,
      textDecoration: cell.style.textDecoration,
      color: cell.style.color,
      textAlign: cell.style.textAlign || 'left',
      fontSize: cell.style.fontSize ? `${cell.style.fontSize}px` : undefined,
      fontFamily: cell.style.fontFamily,
    };
  }, []);

  // Handle click outside to stop editing
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (editingCell && inputRef.current && !inputRef.current.contains(e.target)) {
        saveCellValue();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editingCell, saveCellValue]);

  return (
    <div className="flex-1 overflow-auto bg-white">
      <div className="inline-block min-w-full">
        {/* Column Headers */}
        <div className="flex bg-gray-50 border-b border-gray-300 sticky top-0 z-20">
          <div className="w-12 h-8 border-r border-gray-300 flex items-center justify-center bg-gray-50 font-semibold text-gray-600 text-xs"></div>
          {Array.from({ length: COLS }, (_, i) => (
            <div
              key={i}
              className="w-24 h-8 border-r border-gray-300 flex items-center justify-center bg-gray-50 font-semibold text-gray-600 text-xs"
            >
              {getColumnName(i)}
            </div>
          ))}
        </div>

        {/* Rows */}
        {Array.from({ length: ROWS }, (_, row) => (
          <div key={row} className="flex hover:bg-gray-50">
            {/* Row Header */}
            <div className="w-12 h-8 border-r border-b border-gray-300 flex items-center justify-center bg-gray-50 font-semibold text-gray-600 text-xs sticky left-0 z-10">
              {row + 1}
            </div>

            {/* Cells */}
            {Array.from({ length: COLS }, (_, col) => {
              const cellKey = `${row}-${col}`;
              const cell = cells[cellKey];
              const isSelected = selectedCell?.row === row && selectedCell?.col === col;
              const isEditing = editingCell?.row === row && editingCell?.col === col;
              const cellValue = getCellValue(row, col);
              const cellStyle = getCellStyle(cell);

              return (
                <div
                  key={col}
                  className={`w-24 h-8 border-r border-b border-gray-300 relative group ${
                    isSelected ? 'ring-2 ring-blue-500 z-5 bg-blue-50' : 'bg-white'
                  } ${isEditing ? 'ring-2 ring-blue-400' : ''}`}
                  style={cellStyle}
                  onClick={() => handleCellClick(row, col)}
                  onDoubleClick={() => handleCellDoubleClick(row, col)}
                >
                  {isEditing ? (
                    <input
                      ref={inputRef}
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={handleCellBlur}
                      onKeyDown={handleKeyDown}
                      className="w-full h-full px-1 outline-none bg-transparent text-sm"
                    />
                  ) : (
                    <div className="w-full h-full px-1 py-1 overflow-hidden whitespace-nowrap text-ellipsis text-sm">
                      {cellValue}
                    </div>
                  )}
                  
                  {/* Hover effect */}
                  {!isSelected && !isEditing && (
                    <div className="absolute inset-0 group-hover:bg-gray-100 opacity-30 pointer-events-none" />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpreadsheetGrid;