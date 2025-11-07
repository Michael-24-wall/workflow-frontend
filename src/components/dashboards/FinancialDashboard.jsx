import React from 'react';

// Sample data structure
const financialData = {
  assets: [
    { name: 'Checking Account', value: 5500 },
    { name: 'Savings Account', value: 15000 },
    { name: 'Investment Portfolio', value: 125000 },
    { name: 'Home Equity', value: 80000 },
  ],
  liabilities: [
    { name: 'Mortgage Balance', value: 95000 },
    { name: 'Student Loan', value: 5000 },
    { name: 'Credit Card (Total)', value: 1500 },
  ],
};

// Helper function to calculate total
const calculateTotal = (items) => {
  return items.reduce((sum, item) => sum + item.value, 0);
};

// Main Dashboard Component
const FinancialDashboard = () => {
  const totalAssets = calculateTotal(financialData.assets);
  const totalLiabilities = calculateTotal(financialData.liabilities);
  const netWorth = totalAssets - totalLiabilities;
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 border-b pb-2">
        💰 Financial Dashboard
      </h1>

      {/* Net Worth Snapshot Card */}
      <div className="bg-white shadow-xl rounded-lg p-6 mb-8 border-t-4 border-indigo-600">
        <h2 className="text-2xl font-semibold text-indigo-700 mb-4">
          Net Worth Snapshot
        </h2>
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <StatCard title="Total Assets" value={formatter.format(totalAssets)} color="text-green-600" />
          <StatCard title="Total Liabilities" value={formatter.format(totalLiabilities)} color="text-red-600" />
          <StatCard title="Net Worth" value={formatter.format(netWorth)} color="text-indigo-600" isNetWorth={true} />
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid md:grid-cols-2 gap-8">
        <BreakdownCard title="Assets Breakdown" items={financialData.assets} formatter={formatter} isAsset={true} />
        <BreakdownCard title="Liabilities Breakdown" items={financialData.liabilities} formatter={formatter} isAsset={false} />
      </div>
    </div>
  );
};

// Reusable Stat Card Component
const StatCard = ({ title, value, color, isNetWorth = false }) => (
  <div className={`p-4 rounded-lg border ${isNetWorth ? 'bg-indigo-50 border-indigo-300 scale-105 transition-transform' : 'bg-gray-100 border-gray-200'}`}>
    <p className="text-sm font-medium text-gray-500">{title}</p>
    <p className={`mt-1 text-3xl font-extrabold ${color}`}>
      {value}
    </p>
  </div>
);

// Reusable Breakdown Card Component
const BreakdownCard = ({ title, items, formatter, isAsset }) => (
    <div className="bg-white shadow-lg rounded-lg p-6">
        <h3 className={`text-xl font-semibold mb-4 ${isAsset ? 'text-green-700' : 'text-red-700'}`}>
            {title}
        </h3>
        <ul>
            {items.map((item, index) => (
                <li key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                    <span className="font-medium text-gray-700">{item.name}</span>
                    <span className={`font-semibold ${isAsset ? 'text-green-600' : 'text-red-600'}`}>
                        {formatter.format(item.value)}
                    </span>
                </li>
            ))}
        </ul>
    </div>
);

export default FinancialDashboard;