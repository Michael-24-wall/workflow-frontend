import React from 'react';

const SearchFilters = ({
  searchTerm,
  onSearchChange,
  filters,
  onFiltersChange,
  onRefresh
}) => {
  const documentTypes = [
    { value: '', label: 'All Types' },
    { value: 'spreadsheet', label: 'Spreadsheet' },
    { value: 'budget', label: 'Budget' },
    { value: 'report', label: 'Report' },
    { value: 'inventory', label: 'Inventory' },
    { value: 'schedule', label: 'Schedule' },
  ];

  const statusTypes = [
    { value: '', label: 'All Status' },
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' },
    { value: 'archived', label: 'Archived' },
  ];

  const handleFilterChange = (key, value) => {
    onFiltersChange({ [key]: value });
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search documents..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="block w-full pl-10 pr-4 py-2 border-2 border-blue-100 rounded-xl focus:border-blue-900 focus:ring-0 transition-colors"
        />
      </div>

      {/* Document Type Filter */}
      <select
        value={filters.documentType || ''}
        onChange={(e) => handleFilterChange('documentType', e.target.value)}
        className="px-4 py-2 border-2 border-blue-100 rounded-xl focus:border-blue-900 focus:ring-0 transition-colors"
      >
        {documentTypes.map(type => (
          <option key={type.value} value={type.value}>
            {type.label}
          </option>
        ))}
      </select>

      {/* Status Filter */}
      <select
        value={filters.status || ''}
        onChange={(e) => handleFilterChange('status', e.target.value)}
        className="px-4 py-2 border-2 border-blue-100 rounded-xl focus:border-blue-900 focus:ring-0 transition-colors"
      >
        {statusTypes.map(status => (
          <option key={status.value} value={status.value}>
            {status.label}
          </option>
        ))}
      </select>

      {/* Archived Filter */}
      <label className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-xl border-2 border-blue-100">
        <input
          type="checkbox"
          checked={filters.isArchived || false}
          onChange={(e) => handleFilterChange('isArchived', e.target.checked)}
          className="rounded border-blue-900 text-blue-900 focus:ring-blue-900"
        />
        <span className="text-sm font-medium text-blue-900">Show Archived</span>
      </label>

      {/* Refresh Button */}
      <button
        onClick={onRefresh}
        className="bg-blue-900 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-800 transition-colors flex items-center space-x-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span>Refresh</span>
      </button>
    </div>
  );
};

export default SearchFilters;