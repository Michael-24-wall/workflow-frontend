// components/ui/StatCard.jsx
import React from 'react';

const StatCard = ({ title, value, suffix = '' }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border-l-4 border-blue-500 p-6 hover:shadow-md transition-shadow">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <div className="flex items-baseline">
        <p className="text-3xl font-bold text-blue-900">{value}</p>
        {suffix && <span className="text-gray-600 ml-1">{suffix}</span>}
      </div>
    </div>
  );
};

export default StatCard;