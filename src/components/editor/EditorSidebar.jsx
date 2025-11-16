import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Folder,
  Users,
  History,
  Settings,
  Download,
  Share2,
  Star,
  Trash2,
  Plus,
  Search,
  Home,
  Clock,
  Archive,
  HardDrive,
  Upload,
  BookOpen,
  LayoutGrid
} from 'lucide-react';
import useEditorStore from '../../stores/editorStore';
import FileUploadModal from './FileUploadModal';

const EditorSidebar = ({ 
  currentView = 'home', 
  onViewChange,
  currentDocument,
  onDocumentSelect,
  onNewDocument,
  onUploadFile,
  collapsed = false,
  onToggleCollapse
}) => {
  const [expandedSections, setExpandedSections] = useState({
    recent: true,
    folders: true,
    templates: false,
    quickAccess: true
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);

  const {
    documents,
    recentDocuments,
    templates,
    archivedDocuments,
    sharedWithMe,
    getDocuments,
    getTemplates
  } = useEditorStore();

  useEffect(() => {
    // Load initial data
    getDocuments();
    getTemplates();
  }, []);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Main navigation items
  const mainNavigation = [
    { 
      id: 'home', 
      label: 'Home', 
      icon: Home, 
      action: () => onViewChange('home'),
      description: 'Your document dashboard'
    },
    { 
      id: 'recent', 
      label: 'Recent', 
      icon: Clock, 
      action: () => onViewChange('recent'),
      description: 'Recently opened documents',
      badge: recentDocuments?.length || 0
    },
    { 
      id: 'templates', 
      label: 'Templates', 
      icon: BookOpen, 
      action: () => onViewChange('templates'),
      description: 'Start with a template'
    },
    { 
      id: 'shared', 
      label: 'Shared with me', 
      icon: Users, 
      action: () => onViewChange('shared'),
      description: 'Documents shared by others',
      badge: sharedWithMe?.length || 0
    },
    { 
      id: 'archived', 
      label: 'Archived', 
      icon: Archive, 
      action: () => onViewChange('archived'),
      description: 'Archived documents',
      badge: archivedDocuments?.length || 0
    },
  ];

  // Quick actions
  const quickActions = [
    { 
      id: 'new-doc', 
      label: 'New Document', 
      icon: Plus, 
      action: onNewDocument,
      variant: 'primary'
    },
    { 
      id: 'upload', 
      label: 'Upload File', 
      icon: Upload, 
      action: () => setShowUploadModal(true)
    },
    { 
      id: 'quick-templates', 
      label: 'Quick Templates', 
      icon: Star, 
      action: () => onViewChange('quick-templates')
    },
  ];

  // Document actions (shown when a document is selected)
  const documentActions = [
    { id: 'version', label: 'Version History', icon: History, action: () => {} },
    { id: 'share', label: 'Share & Collaborate', icon: Share2, action: () => {} },
    { id: 'settings', label: 'Document Settings', icon: Settings, action: () => {} },
    { id: 'export', label: 'Export', icon: Download, action: () => {} },
  ];

  // Folders structure
  const folders = [
    { id: 'my-docs', name: 'My Documents', icon: Folder, documentCount: documents?.length || 0 },
    { id: 'shared', name: 'Shared Documents', icon: Users, documentCount: sharedWithMe?.length || 0 },
    { id: 'templates-folder', name: 'Templates', icon: BookOpen, documentCount: templates?.length || 0 },
    { id: 'work', name: 'Work Projects', icon: Folder, documentCount: 8 },
    { id: 'personal', name: 'Personal', icon: Folder, documentCount: 12 },
  ];

  // Filter documents based on search
  const filteredDocuments = documents?.filter(doc =>
    doc.title?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Handle file upload completion
  const handleFilesUploaded = (results) => {
    console.log('Files uploaded successfully:', results);
    // Refresh documents list
    getDocuments();
    // Close modal
    setShowUploadModal(false);
  };

  // Collapsed sidebar view
  if (collapsed) {
    return (
      <>
        <div className="w-16 bg-gray-900 text-white flex flex-col h-full border-r border-gray-700">
          {/* Header */}
          <div className="p-3 border-b border-gray-700 flex justify-center">
            <button
              onClick={onToggleCollapse}
              className="w-10 h-10 flex items-center justify-center hover:bg-gray-800 rounded-lg transition-colors"
              title="Expand sidebar"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Main Navigation */}
          <div className="flex-1 py-4 space-y-2">
            {mainNavigation.map((item) => (
              <button
                key={item.id}
                onClick={item.action}
                className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors group relative ${
                  currentView === item.id
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-800 text-gray-300'
                }`}
                title={item.label}
              >
                <item.icon className="w-5 h-5" />
                
                {/* Badge */}
                {item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
                
                {/* Tooltip */}
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                  {item.label}
                  {item.description && (
                    <div className="text-xs text-gray-300 mt-1">{item.description}</div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="p-3 border-t border-gray-700 space-y-2">
            <button
              onClick={onNewDocument}
              className="w-10 h-10 flex items-center justify-center bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors group relative"
              title="New Document"
            >
              <Plus className="w-5 h-5" />
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                New Document
              </div>
            </button>

            <button
              onClick={() => setShowUploadModal(true)}
              className="w-10 h-10 flex items-center justify-center bg-green-600 hover:bg-green-700 rounded-lg transition-colors group relative"
              title="Upload File"
            >
              <Upload className="w-5 h-5" />
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                Upload File
              </div>
            </button>
          </div>

          {/* Storage */}
          <div className="p-3 border-t border-gray-700">
            <div className="flex justify-center">
              <HardDrive className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        </div>

        {/* File Upload Modal */}
        <FileUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onFilesUploaded={handleFilesUploaded}
        />
      </>
    );
  }

  // Expanded sidebar view
  return (
    <>
      <div className="w-80 bg-gray-900 text-white flex flex-col h-full border-r border-gray-700">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">Document Editor</h1>
                <p className="text-sm text-gray-400">All your files in one place</p>
              </div>
            </div>
            <button
              onClick={onToggleCollapse}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              title="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search documents..."
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((item) => (
              <button
                key={item.id}
                onClick={item.action}
                className={`flex items-center justify-center px-3 py-2 text-sm rounded-lg transition-colors ${
                  item.variant === 'primary'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : item.id === 'upload'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                }`}
              >
                <item.icon className="w-4 h-4 mr-2" />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-6">
            {/* Main Navigation */}
            <div className="space-y-1">
              {mainNavigation.map((item) => (
                <button
                  key={item.id}
                  onClick={item.action}
                  className={`flex items-center w-full px-3 py-3 text-sm rounded-lg transition-colors text-left group ${
                    currentView === item.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge > 0 && (
                    <span className="px-2 py-1 bg-gray-700 text-xs rounded-full min-w-6 text-center">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Quick Access Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-400">Quick Access</h3>
                <button
                  onClick={() => toggleSection('quickAccess')}
                  className="p-1 hover:bg-gray-800 rounded"
                >
                  <ChevronRight 
                    className={`w-4 h-4 transition-transform ${
                      expandedSections.quickAccess ? 'rotate-90' : ''
                    }`} 
                  />
                </button>
              </div>
              
              {expandedSections.quickAccess && (
                <div className="space-y-1">
                  {recentDocuments?.slice(0, 3).map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => onDocumentSelect(doc)}
                      className={`flex items-center w-full px-3 py-2 text-sm rounded-lg transition-colors text-left ${
                        currentDocument?.id === doc.id
                          ? 'bg-gray-800 text-white'
                          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      <FileText className="w-4 h-4 mr-3 flex-shrink-0" />
                      <span className="truncate flex-1">{doc.title}</span>
                    </button>
                  ))}
                  
                  {(!recentDocuments || recentDocuments.length === 0) && (
                    <div className="px-3 py-2 text-sm text-gray-500 text-center">
                      No recent documents
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Folders Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-400">Folders</h3>
                <button
                  onClick={() => toggleSection('folders')}
                  className="p-1 hover:bg-gray-800 rounded"
                >
                  <ChevronRight 
                    className={`w-4 h-4 transition-transform ${
                      expandedSections.folders ? 'rotate-90' : ''
                    }`} 
                  />
                </button>
              </div>
              
              {expandedSections.folders && (
                <div className="space-y-1">
                  {folders.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => onViewChange(`folder-${folder.id}`)}
                      className="flex items-center w-full px-3 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
                    >
                      <folder.icon className="w-4 h-4 mr-3" />
                      <span className="flex-1 truncate">{folder.name}</span>
                      <span className="px-2 py-1 bg-gray-800 text-xs rounded-full">
                        {folder.documentCount}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Documents Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-400">Recent Documents</h3>
                <button
                  onClick={() => toggleSection('recent')}
                  className="p-1 hover:bg-gray-800 rounded"
                >
                  <ChevronRight 
                    className={`w-4 h-4 transition-transform ${
                      expandedSections.recent ? 'rotate-90' : ''
                    }`} 
                  />
                </button>
              </div>
              
              {expandedSections.recent && (
                <div className="space-y-1">
                  {recentDocuments?.slice(0, 5).map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => onDocumentSelect(doc)}
                      className={`flex items-center w-full px-3 py-2 text-sm rounded-lg transition-colors text-left ${
                        currentDocument?.id === doc.id
                          ? 'bg-gray-800 text-white'
                          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      <FileText className="w-4 h-4 mr-3 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="truncate">{doc.title}</div>
                        <div className="text-xs text-gray-500">
                          {doc.updated_at ? new Date(doc.updated_at).toLocaleDateString() : 'Unknown date'}
                        </div>
                      </div>
                    </button>
                  ))}
                  
                  {(!recentDocuments || recentDocuments.length === 0) && (
                    <div className="px-3 py-2 text-sm text-gray-500 text-center">
                      No recent documents
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Templates Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-400">Quick Templates</h3>
                <button
                  onClick={() => toggleSection('templates')}
                  className="p-1 hover:bg-gray-800 rounded"
                >
                  <ChevronRight 
                    className={`w-4 h-4 transition-transform ${
                      expandedSections.templates ? 'rotate-90' : ''
                    }`} 
                  />
                </button>
              </div>
              
              {expandedSections.templates && (
                <div className="space-y-1">
                  {templates?.slice(0, 3).map((template) => (
                    <button
                      key={template.id}
                      onClick={() => onViewChange('template-detail')}
                      className="flex items-center w-full px-3 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition-colors text-left"
                    >
                      <FileText className="w-4 h-4 mr-3" />
                      <div className="flex-1 min-w-0">
                        <div className="truncate">{template.title}</div>
                        <div className="text-xs text-gray-500 capitalize">
                          {template.document_type}
                        </div>
                      </div>
                      {template.is_featured && (
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      )}
                    </button>
                  ))}
                  
                  {(!templates || templates.length === 0) && (
                    <div className="px-3 py-2 text-sm text-gray-500 text-center">
                      No templates available
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Current Document Actions */}
        {currentDocument && (
          <div className="p-4 border-t border-gray-700">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Document Actions</h3>
            <div className="space-y-1">
              {documentActions.map((item) => (
                <button
                  key={item.id}
                  onClick={item.action}
                  className="flex items-center w-full px-3 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition-colors text-left"
                >
                  <item.icon className="w-4 h-4 mr-3" />
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Storage Footer */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
            <div className="flex items-center">
              <HardDrive className="w-4 h-4 mr-2" />
              <span>Storage</span>
            </div>
            <span>1.2GB / 5GB</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
              style={{ width: '24%' }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>24% used</span>
            <span>3.8GB free</span>
          </div>
        </div>
      </div>

      {/* File Upload Modal */}
      <FileUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onFilesUploaded={handleFilesUploaded}
      />
    </>
  );
};

export default EditorSidebar;