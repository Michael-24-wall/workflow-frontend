import React, { useState } from 'react';
import { X, FileText, LayoutTemplate, File, Plus } from 'lucide-react';
import useEditorStore from '../../stores/editorStore';

const CreateDocumentModal = ({ onClose }) => {
  const { createDocument, templates, getTemplates } = useEditorStore();
  const [activeTab, setActiveTab] = useState('blank');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    document_type: 'spreadsheet',
    is_template: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    getTemplates();
  }, [getTemplates]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsSubmitting(true);
    
    // Prepare the data with proper structure
    const documentData = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      document_type: formData.document_type,
      status: 'active',
      is_template: false,
      is_archived: false,
      is_public: false,
      tags: [],
      editor_data: {
        sheets: [
          {
            name: "Sheet1",
            data: []
          }
        ],
        metadata: {
          created: new Date().toISOString(),
          version: "1.0"
        }
      }
    };

    console.log('📦 Creating document with data:', documentData);
    
    const result = await createDocument(documentData);
    setIsSubmitting(false);

    if (result.success) {
      onClose();
    }
  };

  const handleCreateFromTemplate = async (template) => {
    setIsSubmitting(true);
    
    const documentData = {
      title: `Copy of ${template.title}`,
      description: template.description || '',
      document_type: template.document_type || 'spreadsheet',
      status: 'active',
      is_template: false,
      is_archived: false,
      is_public: false,
      tags: template.tags || [],
      editor_data: template.editor_data || {
        sheets: [
          {
            name: "Sheet1",
            data: []
          }
        ],
        metadata: {
          created: new Date().toISOString(),
          version: "1.0"
        }
      }
    };

    console.log('📦 Creating from template:', documentData);
    
    const result = await createDocument(documentData);
    setIsSubmitting(false);

    if (result.success) {
      onClose();
    }
  };

  // Valid document types from your backend
  const documentTypes = [
    { value: 'spreadsheet', label: 'Spreadsheet' },
    { value: 'budget', label: 'Budget' },
    { value: 'inventory', label: 'Inventory' },
    { value: 'report', label: 'Report' },
    { value: 'custom', label: 'Custom' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create New Document</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex px-6">
            <button
              onClick={() => setActiveTab('blank')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'blank'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Blank Document
            </button>
            <button
              onClick={() => setActiveTab('template')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'template'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <LayoutTemplate className="w-4 h-4 inline mr-2" />
              From Template
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'blank' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter document title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter document description (optional)"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Document Type
                </label>
                <select
                  value={formData.document_type}
                  onChange={(e) => setFormData({ ...formData, document_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {documentTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </form>
          )}

          {activeTab === 'template' && (
            <div className="space-y-4">
              <p className="text-gray-600">Choose a template to start with</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.slice(0, 6).map((template) => (
                  <button
                    key={template.uuid || template.id}
                    onClick={() => handleCreateFromTemplate(template)}
                    disabled={isSubmitting}
                    className="text-left p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <File className="w-8 h-8 text-blue-600 mb-2" />
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {template.title}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {template.description || 'No description'}
                    </p>
                    <div className="mt-2">
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                        template.document_type === 'spreadsheet' ? 'bg-green-100 text-green-800' :
                        template.document_type === 'budget' ? 'bg-blue-100 text-blue-800' :
                        template.document_type === 'inventory' ? 'bg-purple-100 text-purple-800' :
                        template.document_type === 'report' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {template.document_type}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {templates.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <LayoutTemplate className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No templates available</p>
                  <p className="text-sm">Create some templates to get started</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={activeTab === 'blank' ? handleSubmit : undefined}
            disabled={isSubmitting || (activeTab === 'blank' && !formData.title.trim())}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Creating...' : 'Create Document'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateDocumentModal;