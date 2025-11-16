import React, { useEffect, useState, useCallback } from 'react';
import { Save, Users, History, Share2, Download, MoreVertical } from 'lucide-react';
import useEditorStore from '../../stores/editorStore';
import EditorHeader from './EditorHeader';
import EditorToolbar from './EditorToolbar';
import CollaborationPanel from './CollaborationPanel';
import VersionHistory from './VersionHistory';

const DocumentEditor = ({ documentId }) => {
  const {
    currentDocument,
    documentData,
    isSaving,
    hasUnsavedChanges,
    getDocument,
    updateDocumentContent,
    setDocumentData,
    setHasUnsavedChanges
  } = useEditorStore();

  const [activePanel, setActivePanel] = useState(null);
  const [localData, setLocalData] = useState('');

  useEffect(() => {
    if (documentId) {
      getDocument(documentId);
    }
  }, [documentId]);

  useEffect(() => {
    if (currentDocument?.editor_data) {
      setLocalData(currentDocument.editor_data);
    }
  }, [currentDocument]);

  // Auto-save functionality
  const autoSave = useCallback(async () => {
    if (hasUnsavedChanges && currentDocument) {
      await updateDocumentContent(currentDocument.id, localData);
    }
  }, [hasUnsavedChanges, currentDocument, localData]);

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(autoSave, 30000);
    return () => clearInterval(interval);
  }, [autoSave]);

  const handleDataChange = (newData) => {
    setLocalData(newData);
    setDocumentData(newData);
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    if (currentDocument) {
      await updateDocumentContent(currentDocument.id, localData);
    }
  };

  if (!currentDocument) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <EditorHeader
        document={currentDocument}
        isSaving={isSaving}
        hasUnsavedChanges={hasUnsavedChanges}
        onSave={handleSave}
        onPanelToggle={setActivePanel}
        activePanel={activePanel}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <EditorToolbar />
          
          {/* Spreadsheet Area */}
          <div className="flex-1 overflow-auto bg-white">
            <div className="p-6">
              {/* This is where your actual spreadsheet component would go */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Spreadsheet Editor
                </h3>
                <p className="text-gray-600 mb-4">
                  This is where your spreadsheet component will be integrated
                </p>
                <textarea
                  value={localData}
                  onChange={(e) => handleDataChange(e.target.value)}
                  placeholder="Enter spreadsheet data or JSON..."
                  className="w-full h-64 p-4 border border-gray-300 rounded-lg font-mono text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Side Panels */}
        {activePanel === 'collaboration' && (
          <CollaborationPanel
            documentId={currentDocument.id}
            onClose={() => setActivePanel(null)}
          />
        )}

        {activePanel === 'history' && (
          <VersionHistory
            documentId={currentDocument.id}
            onClose={() => setActivePanel(null)}
          />
        )}
      </div>
    </div>
  );
};

export default DocumentEditor;