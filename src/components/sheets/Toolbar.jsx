import React, { useState } from 'react';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  PaintBucket,
  Type
} from 'lucide-react';

const Toolbar = ({ onFormatChange }) => {
  const [format, setFormat] = useState({
    fontFamily: 'Arial',
    fontSize: '12',
    bold: false,
    italic: false,
    underline: false,
    align: 'left',
    textColor: '#000000',
    fillColor: '#ffffff'
  });

  const handleFormatChange = (key, value) => {
    const newFormat = { ...format, [key]: value };
    setFormat(newFormat);
    
    // Notify parent component about format changes
    if (onFormatChange) {
      onFormatChange(newFormat);
    }
  };

  const toggleFormat = (key) => {
    handleFormatChange(key, !format[key]);
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-4">
      {/* Font Family */}
      <select 
        className="text-sm border border-gray-300 rounded px-2 py-1"
        value={format.fontFamily}
        onChange={(e) => handleFormatChange('fontFamily', e.target.value)}
      >
        <option value="Arial">Arial</option>
        <option value="Times New Roman">Times New Roman</option>
        <option value="Courier New">Courier New</option>
        <option value="Georgia">Georgia</option>
        <option value="Verdana">Verdana</option>
      </select>

      {/* Font Size */}
      <select 
        className="text-sm border border-gray-300 rounded px-2 py-1"
        value={format.fontSize}
        onChange={(e) => handleFormatChange('fontSize', e.target.value)}
      >
        <option value="10">10</option>
        <option value="12">12</option>
        <option value="14">14</option>
        <option value="16">16</option>
        <option value="18">18</option>
        <option value="24">24</option>
        <option value="32">32</option>
      </select>

      {/* Text Formatting */}
      <div className="flex items-center gap-1 border-r border-gray-200 pr-4">
        <button 
          className={`p-1 hover:bg-gray-100 rounded ${format.bold ? 'bg-gray-200' : ''}`}
          title="Bold"
          onClick={() => toggleFormat('bold')}
        >
          <Bold size={16} />
        </button>
        <button 
          className={`p-1 hover:bg-gray-100 rounded ${format.italic ? 'bg-gray-200' : ''}`}
          title="Italic"
          onClick={() => toggleFormat('italic')}
        >
          <Italic size={16} />
        </button>
        <button 
          className={`p-1 hover:bg-gray-100 rounded ${format.underline ? 'bg-gray-200' : ''}`}
          title="Underline"
          onClick={() => toggleFormat('underline')}
        >
          <Underline size={16} />
        </button>
      </div>

      {/* Alignment */}
      <div className="flex items-center gap-1 border-r border-gray-200 pr-4">
        <button 
          className={`p-1 hover:bg-gray-100 rounded ${format.align === 'left' ? 'bg-gray-200' : ''}`}
          title="Align Left"
          onClick={() => handleFormatChange('align', 'left')}
        >
          <AlignLeft size={16} />
        </button>
        <button 
          className={`p-1 hover:bg-gray-100 rounded ${format.align === 'center' ? 'bg-gray-200' : ''}`}
          title="Align Center"
          onClick={() => handleFormatChange('align', 'center')}
        >
          <AlignCenter size={16} />
        </button>
        <button 
          className={`p-1 hover:bg-gray-100 rounded ${format.align === 'right' ? 'bg-gray-200' : ''}`}
          title="Align Right"
          onClick={() => handleFormatChange('align', 'right')}
        >
          <AlignRight size={16} />
        </button>
      </div>

      {/* Colors */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <button className="p-1 hover:bg-gray-100 rounded" title="Text Color">
            <Type size={16} />
          </button>
          <input 
            type="color" 
            value={format.textColor}
            onChange={(e) => handleFormatChange('textColor', e.target.value)}
            className="w-6 h-6 cursor-pointer"
          />
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1 hover:bg-gray-100 rounded" title="Fill Color">
            <PaintBucket size={16} />
          </button>
          <input 
            type="color" 
            value={format.fillColor}
            onChange={(e) => handleFormatChange('fillColor', e.target.value)}
            className="w-6 h-6 cursor-pointer"
          />
        </div>
      </div>

      {/* Format Display (for debugging) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-500 ml-4">
          {format.bold && 'B '}
          {format.italic && 'I '}
          {format.underline && 'U '}
          {format.fontFamily} {format.fontSize}px
        </div>
      )}
    </div>
  );
};

export default Toolbar;