import React, { useState, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  PaintBucket,
  Type,
  Palette,
  Minus,
  Plus
} from 'lucide-react';

const Toolbar = ({ onFormatChange, selectedCells = [] }) => {
  const [format, setFormat] = useState({
    fontFamily: 'Arial',
    fontSize: '12',
    bold: false,
    italic: false,
    underline: false,
    align: 'left',
    textColor: '#000000',
    fillColor: '#ffffff',
    fontWeight: 'normal',
    fontStyle: 'normal',
    textDecoration: 'none'
  });

  // Memoized format handler for better performance
  const handleFormatChange = useCallback((key, value) => {
    // Handle derived styles
    let derivedUpdates = {};
    if (key === 'bold') {
      derivedUpdates.fontWeight = value ? 'bold' : 'normal';
    }
    if (key === 'italic') {
      derivedUpdates.fontStyle = value ? 'italic' : 'normal';
    }
    if (key === 'underline') {
      derivedUpdates.textDecoration = value ? 'underline' : 'none';
    }

    const newFormat = { 
      ...format, 
      [key]: value,
      ...derivedUpdates
    };
    
    setFormat(newFormat);
    
    // Notify parent component about format changes
    if (onFormatChange) {
      onFormatChange(newFormat);
    }
  }, [format, onFormatChange]);

  const toggleFormat = useCallback((key) => {
    handleFormatChange(key, !format[key]);
  }, [format, handleFormatChange]);

  // Quick font size adjustments
  const adjustFontSize = useCallback((increment) => {
    const currentSize = parseInt(format.fontSize);
    const newSize = Math.max(8, Math.min(72, currentSize + increment));
    handleFormatChange('fontSize', newSize.toString());
  }, [format.fontSize, handleFormatChange]);

  // Common font families
  const fontFamilies = [
    'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 
    'Verdana', 'Courier New', 'Impact', 'Comic Sans MS',
    'Trebuchet MS', 'Arial Black'
  ];

  const fontSizes = ['8', '10', '12', '14', '16', '18', '20', '24', '28', '32', '36', '48', '72'];

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-4 flex-wrap">
      {/* Selection Info */}
      {selectedCells.length > 0 && (
        <div className="text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded">
          {selectedCells.length} cell{selectedCells.length > 1 ? 's' : ''} selected
        </div>
      )}

      {/* Font Family */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-500 font-medium">Font</label>
        <select 
          className="text-sm border border-gray-300 rounded px-2 py-1 min-w-32"
          value={format.fontFamily}
          onChange={(e) => handleFormatChange('fontFamily', e.target.value)}
        >
          {fontFamilies.map(font => (
            <option key={font} value={font} style={{ fontFamily: font }}>
              {font}
            </option>
          ))}
        </select>
      </div>

      {/* Font Size */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-500 font-medium">Size</label>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => adjustFontSize(-1)}
            className="p-1 hover:bg-gray-100 rounded text-gray-600"
            title="Decrease font size"
          >
            <Minus size={14} />
          </button>
          
          <select 
            className="text-sm border border-gray-300 rounded px-2 py-1 w-16"
            value={format.fontSize}
            onChange={(e) => handleFormatChange('fontSize', e.target.value)}
          >
            {fontSizes.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
          
          <button 
            onClick={() => adjustFontSize(1)}
            className="p-1 hover:bg-gray-100 rounded text-gray-600"
            title="Increase font size"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Text Formatting */}
      <div className="flex items-center gap-1 border-r border-gray-200 pr-4">
        <button 
          className={`p-2 hover:bg-gray-100 rounded transition-colors ${
            format.bold ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
          }`}
          title="Bold (Ctrl+B)"
          onClick={() => toggleFormat('bold')}
        >
          <Bold size={18} />
        </button>
        <button 
          className={`p-2 hover:bg-gray-100 rounded transition-colors ${
            format.italic ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
          }`}
          title="Italic (Ctrl+I)"
          onClick={() => toggleFormat('italic')}
        >
          <Italic size={18} />
        </button>
        <button 
          className={`p-2 hover:bg-gray-100 rounded transition-colors ${
            format.underline ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
          }`}
          title="Underline (Ctrl+U)"
          onClick={() => toggleFormat('underline')}
        >
          <Underline size={18} />
        </button>
      </div>

      {/* Alignment */}
      <div className="flex items-center gap-1 border-r border-gray-200 pr-4">
        <button 
          className={`p-2 hover:bg-gray-100 rounded transition-colors ${
            format.align === 'left' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
          }`}
          title="Align Left"
          onClick={() => handleFormatChange('align', 'left')}
        >
          <AlignLeft size={18} />
        </button>
        <button 
          className={`p-2 hover:bg-gray-100 rounded transition-colors ${
            format.align === 'center' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
          }`}
          title="Align Center"
          onClick={() => handleFormatChange('align', 'center')}
        >
          <AlignCenter size={18} />
        </button>
        <button 
          className={`p-2 hover:bg-gray-100 rounded transition-colors ${
            format.align === 'right' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
          }`}
          title="Align Right"
          onClick={() => handleFormatChange('align', 'right')}
        >
          <AlignRight size={18} />
        </button>
      </div>

      {/* Colors */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 font-medium">Text</label>
          <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
            <Type size={16} className="text-gray-500" />
            <input 
              type="color" 
              value={format.textColor}
              onChange={(e) => handleFormatChange('textColor', e.target.value)}
              className="w-6 h-6 cursor-pointer bg-transparent border-0"
              title="Text Color"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 font-medium">Fill</label>
          <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
            <PaintBucket size={16} className="text-gray-500" />
            <input 
              type="color" 
              value={format.fillColor}
              onChange={(e) => handleFormatChange('fillColor', e.target.value)}
              className="w-6 h-6 cursor-pointer bg-transparent border-0"
              title="Fill Color"
            />
          </div>
        </div>
      </div>

      {/* Format Preview */}
      <div className="flex items-center gap-2 text-xs">
        <div 
          className="px-2 py-1 rounded border"
          style={{
            fontFamily: format.fontFamily,
            fontSize: `${format.fontSize}px`,
            fontWeight: format.fontWeight,
            fontStyle: format.fontStyle,
            textDecoration: format.textDecoration,
            color: format.textColor,
            backgroundColor: format.fillColor,
            textAlign: format.align
          }}
        >
          Aa
        </div>
        <span className="text-gray-500">
          {format.fontFamily} {format.fontSize}px
        </span>
      </div>

      {/* Reset Formatting */}
      <button 
        onClick={() => {
          const defaultFormat = {
            fontFamily: 'Arial',
            fontSize: '12',
            bold: false,
            italic: false,
            underline: false,
            align: 'left',
            textColor: '#000000',
            fillColor: '#ffffff',
            fontWeight: 'normal',
            fontStyle: 'normal',
            textDecoration: 'none'
          };
          setFormat(defaultFormat);
          if (onFormatChange) onFormatChange(defaultFormat);
        }}
        className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 border border-gray-300 rounded hover:bg-gray-50"
        title="Reset formatting"
      >
        Reset
      </button>
    </div>
  );
};

export default Toolbar;