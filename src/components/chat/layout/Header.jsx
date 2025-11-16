import React from 'react';
import { useParams } from 'react-router-dom';

export default function Header({ onMenuClick }) {
  const { workspaceId } = useParams();

  return (
    <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-white font-semibold text-xl">Chat</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-gray-400 text-sm">
            Workspace: {workspaceId}
          </div>
        </div>
      </div>
    </header>
  );
}