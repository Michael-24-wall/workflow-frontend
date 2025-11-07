import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const EditorSidebar = ({ isOpen, onToggle, currentPath, documentStats }) => {
  const menuItems = [
    { path: '/editor', label: 'My Documents', icon: '📄', count: documentStats?.total },
    { path: '/editor/templates', label: 'Templates', icon: '📋', count: documentStats?.templates },
    { path: '/editor/archived', label: 'Archived', icon: '📁', count: documentStats?.archived },
    { path: '/editor/shared', label: 'Shared with me', icon: '👥' },
    { path: '/editor/trash', label: 'Trash', icon: '🗑️' },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-30 
        bg-blue-900 text-white 
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
        w-64 flex flex-col
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-blue-700">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <span className="text-blue-900 text-sm font-bold">⚡</span>
            </div>
            <span className="font-bold text-lg">Editor</span>
          </div>
          <button
            onClick={onToggle}
            className="lg:hidden text-white hover:text-blue-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = currentPath === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center justify-between px-3 py-3 rounded-lg
                  transition-colors font-medium
                  ${isActive 
                    ? 'bg-white text-blue-900' 
                    : 'text-white hover:bg-blue-700'
                  }
                `}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.count !== undefined && (
                  <span className={`
                    px-2 py-1 rounded-full text-xs font-bold
                    ${isActive ? 'bg-blue-100 text-blue-900' : 'bg-blue-700 text-white'}
                  `}>
                    {item.count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Stats */}
        <div className="p-4 border-t border-blue-700">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="text-center p-3 bg-blue-700 rounded-lg">
              <div className="text-white font-bold">{documentStats?.active || 0}</div>
              <div className="text-blue-200 text-xs">Active</div>
            </div>
            <div className="text-center p-3 bg-blue-700 rounded-lg">
              <div className="text-white font-bold">{documentStats?.totalSize ? formatFileSize(documentStats.totalSize) : '0'}</div>
              <div className="text-blue-200 text-xs">Total Size</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Helper function
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default EditorSidebar;