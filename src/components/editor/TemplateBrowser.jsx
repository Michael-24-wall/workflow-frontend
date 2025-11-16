import React, { useEffect, useState } from 'react';
import { Search, Grid, List, Plus, FileText, Download, Star, Filter } from 'lucide-react';
import useEditorStore from '../../stores/editorStore';

const TemplateBrowser = ({ onTemplateSelect, onCreateTemplate }) => {
  const {
    templates,
    isLoadingTemplates,
    getTemplates,
    createDocument
  } = useEditorStore();

  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [filteredTemplates, setFilteredTemplates] = useState([]);

  useEffect(() => {
    getTemplates();
  }, [getTemplates]);

  useEffect(() => {
    let results = templates;
    
    // Apply search filter
    if (searchQuery) {
      results = results.filter(template =>
        template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply category filter
    if (categoryFilter !== 'all') {
      results = results.filter(template => 
        template.document_type === categoryFilter
      );
    }
    
    setFilteredTemplates(results);
  }, [templates, searchQuery, categoryFilter]);

  const handleUseTemplate = async (template) => {
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

    const result = await createDocument(documentData);
    
    if (result.success && onTemplateSelect) {
      onTemplateSelect(result.data);
    }
  };

  // Valid categories from your backend
  const categories = [
    { value: 'all', label: 'All Templates' },
    { value: 'spreadsheet', label: 'Spreadsheets' },
    { value: 'budget', label: 'Budgets' },
    { value: 'inventory', label: 'Inventory' },
    { value: 'report', label: 'Reports' },
    { value: 'custom', label: 'Custom' }
  ];

  if (isLoadingTemplates) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading templates...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
          <p className="text-gray-600">Start with a professionally designed template</p>
        </div>
        <button
          onClick={onCreateTemplate}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Template
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          {/* View Controls */}
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 transition-colors ${
                viewMode === 'list' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Templates Grid/List */}
      <div>
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <FileText className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery || categoryFilter !== 'all' ? 'No templates found' : 'No templates available'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || categoryFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Create your first template to get started'
              }
            </p>
            {(searchQuery || categoryFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('all');
                }}
                className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Category Tabs */}
            <div className="flex space-x-1 mb-6 overflow-x-auto">
              {categories.map(category => (
                <button
                  key={category.value}
                  onClick={() => setCategoryFilter(category.value)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                    categoryFilter === category.value
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>

            {/* Templates Grid */}
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
            }>
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.uuid || template.id}
                  template={template}
                  viewMode={viewMode}
                  onUseTemplate={handleUseTemplate}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Template Card Component
const TemplateCard = ({ template, viewMode, onUseTemplate }) => {
  const [isHovered, setIsHovered] = useState(false);

  const getTypeColor = (type) => {
    switch (type) {
      case 'spreadsheet': return 'bg-green-100 text-green-800';
      case 'budget': return 'bg-blue-100 text-blue-800';
      case 'inventory': return 'bg-purple-100 text-purple-800';
      case 'report': return 'bg-orange-100 text-orange-800';
      case 'custom': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (viewMode === 'list') {
    return (
      <div 
        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => onUseTemplate(template)}
      >
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <FileText className="w-10 h-10 text-blue-600" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {template.title}
              </h3>
              {template.is_featured && (
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
              )}
            </div>
            
            <p className="text-gray-600 text-sm mb-2 line-clamp-2">
              {template.description || 'No description available'}
            </p>
            
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span className={`px-2 py-1 rounded-full text-xs capitalize ${getTypeColor(template.document_type)}`}>
                {template.document_type}
              </span>
              <span>Used {template.usage_count || 0} times</span>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onUseTemplate(template);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Use Template
          </button>
        </div>
      </div>
    );
  }

  // Grid View
  return (
    <div 
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onUseTemplate(template)}
    >
      <div className="relative mb-4">
        <div className="aspect-video bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center">
          <FileText className="w-12 h-12 text-blue-600" />
        </div>
        
        {template.is_featured && (
          <div className="absolute top-2 right-2">
            <Star className="w-5 h-5 text-yellow-500 fill-current" />
          </div>
        )}
        
        {/* Hover Overlay */}
        {isHovered && (
          <div className="absolute inset-0 bg-black bg-opacity-20 rounded-lg flex items-center justify-center">
            <button className="px-4 py-2 bg-white text-gray-900 rounded-lg shadow-lg font-medium">
              Use Template
            </button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 line-clamp-1">
            {template.title}
          </h3>
        </div>
        
        <p className="text-gray-600 text-sm line-clamp-2">
          {template.description || 'No description available'}
        </p>
        
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span className={`px-2 py-1 rounded-full text-xs capitalize ${getTypeColor(template.document_type)}`}>
            {template.document_type}
          </span>
          
          <div className="flex items-center space-x-1">
            <Download className="w-3 h-3" />
            <span>{template.usage_count || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateBrowser;