import React from 'react';

const StatsOverview = ({ stats }) => {
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const statCards = [
    {
      label: 'Total Documents',
      value: stats?.total || 0,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: 'bg-white border border-gray-200 hover:border-blue-300',
      textColor: 'text-gray-900'
    },
    {
      label: 'Active',
      value: stats?.active || 0,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'bg-white border border-gray-200 hover:border-green-300',
      textColor: 'text-gray-900'
    },
    {
      label: 'Archived',
      value: stats?.archived || 0,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      ),
      color: 'bg-white border border-gray-200 hover:border-orange-300',
      textColor: 'text-gray-900'
    },
    {
      label: 'Templates',
      value: stats?.templates || 0,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      ),
      color: 'bg-white border border-gray-200 hover:border-purple-300',
      textColor: 'text-gray-900'
    },
    {
      label: 'Total Size',
      value: formatFileSize(stats?.totalSize),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      ),
      color: 'bg-white border border-gray-200 hover:border-gray-400',
      textColor: 'text-gray-900'
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      {statCards.map((stat, index) => (
        <div
          key={index}
          className={`${stat.color} rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group`}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className={`text-2xl font-semibold ${stat.textColor} mb-1`}>
                {stat.value}
              </div>
              <div className="text-gray-600 text-sm font-medium">{stat.label}</div>
            </div>
            <div className={`p-2 rounded-lg bg-gray-50 group-hover:bg-gray-100 transition-colors ${stat.textColor}`}>
              {stat.icon}
            </div>
          </div>
          
          {/* Progress bar for active/total ratio (only for active documents) */}
          {stat.label === 'Active' && stats?.total > 0 && (
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${(stats.active / stats.total) * 100}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {Math.round((stats.active / stats.total) * 100)}% of total
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default StatsOverview;