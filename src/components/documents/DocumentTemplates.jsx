// src/components/documents/DocumentTemplates.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  FileText, 
  Copy, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  BarChart3,
  MoreVertical
} from 'lucide-react';
import { documentService } from '../../services/documentService';

const DocumentTemplates = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await documentService.getTemplates();
      
      // ✅ FIX: Handle different response structures safely
      let templatesData = [];
      
      if (Array.isArray(response.data)) {
        templatesData = response.data;
      } else if (response.data && typeof response.data === 'object') {
        // Handle different possible response structures
        if (response.data.results && Array.isArray(response.data.results)) {
          templatesData = response.data.results; // Django pagination format
        } else if (response.data.data && Array.isArray(response.data.data)) {
          templatesData = response.data.data; // Some APIs nest data
        } else if (response.data.templates && Array.isArray(response.data.templates)) {
          templatesData = response.data.templates;
        } else {
          // If it's an object but not the expected structure, log it
          console.warn('Unexpected templates response structure:', response.data);
          templatesData = [];
        }
      }
      
      console.log('📊 Loaded templates:', templatesData);
      setTemplates(Array.isArray(templatesData) ? templatesData : []);
      
    } catch (error) {
      console.error('Failed to load templates:', error);
      setTemplates([]); // Always set to empty array on error
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIX: Safe filtering with array check
  const filteredTemplates = Array.isArray(templates) 
    ? templates.filter(template => {
        if (!template || typeof template !== 'object') return false;
        
        const matchesSearch = (
          (template.name && template.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        
        const matchesFilter = activeFilter === 'all' || 
          (activeFilter === 'active' && template.is_active !== false) ||
          (activeFilter === 'inactive' && template.is_active === false);
        
        return matchesSearch && matchesFilter;
      })
    : [];

  const handleDuplicate = async (templateId) => {
    try {
      await documentService.duplicateTemplate(templateId);
      loadTemplates();
    } catch (error) {
      console.error('Failed to duplicate template:', error);
      alert('Failed to duplicate template. Please try again.');
    }
  };

  const handleDelete = async (templateId) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await documentService.deleteTemplate(templateId);
        loadTemplates();
      } catch (error) {
        console.error('Failed to delete template:', error);
        alert('Failed to delete template. Please try again.');
      }
    }
  };

  const handleCreateTemplate = async (formData) => {
    try {
      await documentService.createTemplate(formData);
      setShowCreateModal(false);
      loadTemplates();
    } catch (error) {
      console.error('Failed to create template:', error);
      alert('Failed to create template. Please try again.');
    }
  };

  const handleUpdateTemplate = async (templateId, formData) => {
    try {
      await documentService.updateTemplate(templateId, formData);
      setEditingTemplate(null);
      loadTemplates();
    } catch (error) {
      console.error('Failed to update template:', error);
      alert('Failed to update template. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Document Templates
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Create and manage document templates for your organization
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Template
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Templates</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <TemplateCard 
            key={template.id} 
            template={template} 
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
            onEdit={setEditingTemplate}
          />
        ))}
      </div>

      {filteredTemplates.length === 0 && templates.length > 0 && (
        <div className="text-center py-12">
          <Search className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No templates match your search
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Try adjusting your search terms or filters.
          </p>
        </div>
      )}

      {templates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No templates found
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Get started by creating your first template.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </button>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingTemplate) && (
        <TemplateModal
          template={editingTemplate}
          onClose={() => {
            setShowCreateModal(false);
            setEditingTemplate(null);
          }}
          onSave={editingTemplate ? 
            (formData) => handleUpdateTemplate(editingTemplate.id, formData) : 
            handleCreateTemplate
          }
        />
      )}
    </div>
  );
};

// TemplateCard Component
const TemplateCard = ({ template, onDuplicate, onDelete, onEdit }) => {
  const [showMenu, setShowMenu] = useState(false);

  // ✅ FIX: Safe data access with fallbacks
  const templateName = template?.name || 'Untitled Template';
  const templateDescription = template?.description || 'No description available';
  const isActive = template?.is_active !== false; // Default to true if undefined
  const documentsCount = template?.documents_count || template?.usage_count || 0;
  const createdAt = template?.created_at || new Date().toISOString();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {templateName}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
              {templateDescription}
            </p>
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <MoreVertical className="h-4 w-4 text-gray-400" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                <button
                  onClick={() => {
                    onEdit(template);
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Edit className="h-4 w-4" />
                  Edit Template
                </button>
                <button
                  onClick={() => {
                    onDuplicate(template.id);
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Copy className="h-4 w-4" />
                  Duplicate
                </button>
                <button
                  onClick={() => {
                    onDelete(template.id);
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-4">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              isActive 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
            }`}>
              {isActive ? 'Active' : 'Inactive'}
            </span>
            <span className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4" />
              {documentsCount} documents
            </span>
          </div>
          
          <span className="text-xs">
            {new Date(createdAt).toLocaleDateString()}
          </span>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => onDuplicate(template.id)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          >
            <Copy className="h-4 w-4" />
            Use Template
          </button>
        </div>
      </div>
    </div>
  );
};

// TemplateModal Component
const TemplateModal = ({ template, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    description: template?.description || '',
    content: template?.content || '',
    is_active: template?.is_active !== false // Default to true if undefined
  });

  // Signature placeholders that users can insert
  const signaturePlaceholders = [
    { key: 'signature.manager', label: 'Manager Signature', description: 'For manager approval' },
    { key: 'signature.employee', label: 'Employee Signature', description: 'For employee acceptance' },
    { key: 'signature.witness', label: 'Witness Signature', description: 'For witness confirmation' },
    { key: 'signature.client', label: 'Client Signature', description: 'For client agreement' },
    { key: 'signature.ceo', label: 'CEO Signature', description: 'For executive approval' },
    { key: 'signature.hr', label: 'HR Signature', description: 'For HR department' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Template name is required');
      return;
    }
    if (!formData.content.trim()) {
      alert('Template content is required');
      return;
    }
    onSave(formData);
  };

  // Function to insert signature placeholder into content
  const insertSignaturePlaceholder = (placeholderKey) => {
    const signatureBlock = `\n\n--- SIGNATURE: ${placeholderKey.toUpperCase()} ---\n[Place for ${placeholderKey.split('.')[1]} signature]\n__________________________________________________\nName: \nDate: \n--- END SIGNATURE ---\n`;
    
    setFormData(prev => ({
      ...prev,
      content: prev.content + signatureBlock
    }));
  };

  // Function to insert simple placeholder
  const insertSimplePlaceholder = (placeholderKey) => {
    const simplePlaceholder = `\n[${placeholderKey}]`;
    setFormData(prev => ({
      ...prev,
      content: prev.content + simplePlaceholder
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {template ? 'Edit Template' : 'Create New Template'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Template Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Employment Contract"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe what this template is used for..."
            />
          </div>

          {/* SIGNATURE FIELDS SECTION */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Signature Fields
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              Add signature fields to your document template. These will become required signing points when the document is created.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {signaturePlaceholders.map((placeholder) => (
                <div key={placeholder.key} className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => insertSignaturePlaceholder(placeholder.key)}
                    className="flex-1 px-3 py-2 text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-800 dark:text-blue-200 rounded border border-blue-300 dark:border-blue-700 transition-colors text-left"
                  >
                    <div className="font-medium">{placeholder.label}</div>
                    <div className="text-blue-600 dark:text-blue-400">{placeholder.description}</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertSimplePlaceholder(placeholder.key)}
                    className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded"
                    title="Insert simple placeholder"
                  >
                    Simple
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* REGULAR PLACEHOLDERS SECTION */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Dynamic Fields
            </h3>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'user.first_name', label: 'First Name' },
                { key: 'user.last_name', label: 'Last Name' },
                { key: 'user.email', label: 'Email' },
                { key: 'user.position', label: 'Position' },
                { key: 'company.name', label: 'Company Name' },
                { key: 'company.address', label: 'Company Address' },
                { key: 'date.today', label: "Today's Date" },
                { key: 'date.signature', label: 'Signature Date' }
              ].map((field) => (
                <button
                  key={field.key}
                  type="button"
                  onClick={() => {
                    const newContent = formData.content + ` {{${field.key}}}`;
                    setFormData({ ...formData, content: newContent });
                  }}
                  className="px-3 py-1 text-xs bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 text-green-800 dark:text-green-200 rounded border border-green-300 dark:border-green-700 transition-colors"
                >
                  {field.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Template Content *
            </label>
            <textarea
              required
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={12}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder="Enter your template content..."
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Use the buttons above to insert signature fields and dynamic placeholders
            </p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Template is active and available for use
            </label>
          </div>
        </form>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            {template ? 'Update Template' : 'Create Template'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ✅ Make sure this default export is present
export default DocumentTemplates;