import React, { useState } from 'react';

const CreateDocumentModal = ({ templates, onSubmit, onClose, loading }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    document_type: 'spreadsheet',
    template_id: '',
  });

  const documentTypes = [
    { value: 'spreadsheet', label: '📊 Spreadsheet', description: 'General purpose spreadsheet' },
    { value: 'budget', label: '💰 Budget', description: 'Financial planning and budgeting' },
    { value: 'report', label: '📈 Report', description: 'Data analysis and reporting' },
    { value: 'inventory', label: '📦 Inventory', description: 'Stock and inventory management' },
    { value: 'schedule', label: '📅 Schedule', description: 'Timeline and scheduling' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    
    const submitData = {
      ...formData,
      template_id: formData.template_id || null,
    };
    
    onSubmit(submitData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-blue-900 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <span className="text-blue-900 text-lg">📊</span>
              </div>
              <div>
                <h2 className="text-xl font-bold">Create New Document</h2>
                <p className="text-blue-200 text-sm">Start with a blank sheet or template</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Document Title */}
          <div>
            <label className="block text-sm font-bold text-blue-900 mb-2">
              Document Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Enter document title..."
              className="w-full px-4 py-3 border-2 border-blue-100 rounded-xl focus:border-blue-900 focus:ring-0 transition-colors"
            />
          </div>

          {/* Document Description */}
          <div>
            <label className="block text-sm font-bold text-blue-900 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows="3"
              placeholder="Enter document description..."
              className="w-full px-4 py-3 border-2 border-blue-100 rounded-xl focus:border-blue-900 focus:ring-0 transition-colors resize-none"
            />
          </div>

          {/* Document Type */}
          <div>
            <label className="block text-sm font-bold text-blue-900 mb-3">
              Document Type
            </label>
            <div className="space-y-2">
              {documentTypes.map((type) => (
                <label
                  key={type.value}
                  className={`
                    flex items-center space-x-3 p-3 border-2 rounded-xl cursor-pointer transition-all
                    ${formData.document_type === type.value
                      ? 'border-blue-900 bg-blue-50'
                      : 'border-blue-100 hover:border-blue-300'
                    }
                  `}
                >
                  <input
                    type="radio"
                    name="document_type"
                    value={type.value}
                    checked={formData.document_type === type.value}
                    onChange={(e) => handleChange('document_type', e.target.value)}
                    className="text-blue-900 focus:ring-blue-900"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-blue-900">{type.label}</div>
                    <div className="text-sm text-gray-600">{type.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Template Selection */}
          {templates && templates.length > 0 && (
            <div>
              <label className="block text-sm font-bold text-blue-900 mb-2">
                Start from Template
              </label>
              <select
                value={formData.template_id}
                onChange={(e) => handleChange('template_id', e.target.value)}
                className="w-full px-4 py-3 border-2 border-blue-100 rounded-xl focus:border-blue-900 focus:ring-0 transition-colors"
              >
                <option value="">Start from scratch</option>
                {templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-blue-900 text-blue-900 rounded-xl font-bold hover:bg-blue-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formData.title.trim() || loading}
              className="flex-1 px-6 py-3 bg-blue-900 text-white rounded-xl font-bold hover:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating...' : 'Create Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateDocumentModal;