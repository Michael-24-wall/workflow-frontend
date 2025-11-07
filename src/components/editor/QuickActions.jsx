import React from 'react';

const QuickActions = ({ onCreateDocument, onShowTemplates }) => {
  const actions = [
    {
      label: 'New Spreadsheet',
      description: 'Create a blank spreadsheet',
      icon: '📊',
      color: 'bg-blue-900 hover:bg-blue-800',
      onClick: onCreateDocument,
    },
    {
      label: 'Use Template',
      description: 'Start from a template',
      icon: '📋',
      color: 'bg-white text-blue-900 border-2 border-blue-900 hover:bg-blue-50',
      onClick: onShowTemplates,
    },
    {
      label: 'Import Data',
      description: 'Import from CSV or Excel',
      icon: '📤',
      color: 'bg-white text-blue-900 border-2 border-blue-900 hover:bg-blue-50',
      onClick: () => console.log('Import data'),
    },
    {
      label: 'Quick Formulas',
      description: 'Common formulas & functions',
      icon: '🧮',
      color: 'bg-white text-blue-900 border-2 border-blue-900 hover:bg-blue-50',
      onClick: () => console.log('Quick formulas'),
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-blue-100 p-6 mb-6">
      <h3 className="text-lg font-bold text-blue-900 mb-4">Quick Actions</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className={`p-4 rounded-xl text-left transition-all duration-200 ${action.color}`}
          >
            <div className="text-2xl mb-3">{action.icon}</div>
            <div className="font-bold text-current mb-1">{action.label}</div>
            <div className={`text-sm ${action.color.includes('bg-white') ? 'text-gray-600' : 'text-blue-100'}`}>
              {action.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;