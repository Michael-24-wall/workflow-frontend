import React from 'react';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Table,
  Image,
  Link,
  PaintBucket,
  Type,
  Calculator,
  BarChart3,
  Filter as FilterIcon,
  SortAsc
} from 'lucide-react';

const EditorToolbar = () => {
  const toolbarSections = [
    {
      title: 'Text Formatting',
      items: [
        { icon: Bold, label: 'Bold', action: 'bold' },
        { icon: Italic, label: 'Italic', action: 'italic' },
        { icon: Underline, label: 'Underline', action: 'underline' },
        { icon: Type, label: 'Font Size', action: 'fontSize' },
      ]
    },
    {
      title: 'Alignment',
      items: [
        { icon: AlignLeft, label: 'Align Left', action: 'alignLeft' },
        { icon: AlignCenter, label: 'Align Center', action: 'alignCenter' },
        { icon: AlignRight, label: 'Align Right', action: 'alignRight' },
      ]
    },
    {
      title: 'Spreadsheet',
      items: [
        { icon: Calculator, label: 'Insert Formula', action: 'insertFormula' },
        { icon: BarChart3, label: 'Insert Chart', action: 'insertChart' },
        { icon: Table, label: 'Insert Table', action: 'insertTable' },
        { icon: FilterIcon, label: 'Filter Data', action: 'filterData' },
        { icon: SortAsc, label: 'Sort Data', action: 'sortData' },
      ]
    },
    {
      title: 'Cells',
      items: [
        { icon: PaintBucket, label: 'Fill Color', action: 'fillColor' },
        { icon: Link, label: 'Insert Link', action: 'insertLink' },
      ]
    }
  ];

  const handleAction = (action) => {
    console.log('Toolbar action:', action);
    // Implement your spreadsheet action logic here
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2">
      <div className="flex items-center space-x-4">
        {toolbarSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="flex items-center space-x-1">
            {section.items.map((item, itemIndex) => (
              <button
                key={itemIndex}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                title={item.label}
                onClick={() => handleAction(item.action)}
              >
                <item.icon className="w-4 h-4" />
              </button>
            ))}
            {sectionIndex < toolbarSections.length - 1 && (
              <div className="w-px h-6 bg-gray-300 mx-2" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EditorToolbar;