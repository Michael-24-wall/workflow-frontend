import React, { useState } from 'react';
import EditorSidebar from './EditorSidebar';
import DocumentList from './DocumentList';
import TemplateBrowser from './TemplateBrowser';
import DocumentEditor from './DocumentEditor';

const EditorDashboard = () => {
  const [currentView, setCurrentView] = useState('home');
  const [currentDocument, setCurrentDocument] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleNewDocument = () => {
    // Logic to create new document
    console.log('Create new document');
    setCurrentView('new-document');
  };

  const handleUploadFile = () => {
    // Logic to upload file
    console.log('Upload file');
  };

  const handleDocumentSelect = (document) => {
    setCurrentDocument(document);
    setCurrentView('editor');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'home':
      case 'recent':
      case 'shared':
      case 'archived':
        return <DocumentList />;
      
      case 'templates':
        return (
          <TemplateBrowser 
            onTemplateSelect={handleDocumentSelect}
            onCreateTemplate={() => setCurrentView('new-template')}
          />
        );
      
      case 'editor':
        return currentDocument ? (
          <DocumentEditor documentId={currentDocument.id} />
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No document selected</p>
              <button 
                onClick={() => setCurrentView('home')}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse Documents
              </button>
            </div>
          </div>
        );
      
      case 'new-document':
        // This would open a create document modal
        return <DocumentList />;
      
      default:
        return <DocumentList />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <EditorSidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        currentDocument={currentDocument}
        onDocumentSelect={handleDocumentSelect}
        onNewDocument={handleNewDocument}
        onUploadFile={handleUploadFile}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default EditorDashboard;