// src/finance/CashFlowChart.jsx
import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CashFlowChart = ({ data }) => {
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef(null);

  useEffect(() => {
    setIsLoading(true);
    
    // Simulate data processing
    const processData = () => {
      try {
        if (data && Array.isArray(data) && data.length > 0) {
          const formattedData = data.map((item, index) => ({
            month: item.month || `Month ${index + 1}`,
            income: Number(item.income) || 0,
            expenses: Number(item.expenses) || 0,
            net: (Number(item.income) || 0) - (Number(item.expenses) || 0)
          }));
          setChartData(formattedData);
        } else {
          // Fallback sample data
          setChartData([
            { month: 'Jan', income: 120000, expenses: 85000, net: 35000 },
            { month: 'Feb', income: 135000, expenses: 90000, net: 45000 },
            { month: 'Mar', income: 142000, expenses: 92000, net: 50000 },
            { month: 'Apr', income: 138000, expenses: 88000, net: 50000 },
            { month: 'May', income: 156000, expenses: 95000, net: 61000 },
            { month: 'Jun', income: 168000, expenses: 102000, net: 66000 },
          ]);
        }
      } catch (error) {
        console.error('Error processing chart data:', error);
        // Emergency fallback
        setChartData([
          { month: 'Q1', income: 100000, expenses: 75000, net: 25000 },
          { month: 'Q2', income: 120000, expenses: 80000, net: 40000 },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(processData, 100);
    return () => clearTimeout(timer);
  }, [data]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-xl">
          <p className="font-bold text-gray-900 mb-2">{label}</p>
          <div className="space-y-1">
            {payload.map((entry, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {entry.name}:
                  </span>
                </div>
                <span className="text-sm font-bold text-gray-900 ml-4">
                  {formatCurrency(entry.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="w-full h-80 flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading chart...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-80 min-h-80 bg-white rounded-lg">
      <ResponsiveContainer 
        width="100%" 
        height="100%"
        minWidth={400}
        minHeight={300}
        debounce={1}
      >
        <LineChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 10,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis 
            dataKey="month" 
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis 
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
            tickFormatter={formatCurrency}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="top" 
            height={36}
            iconType="circle"
            iconSize={8}
          />
          <Line 
            type="monotone" 
            dataKey="income" 
            stroke="#10b981" 
            strokeWidth={3}
            dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: '#059669' }}
            name="Income"
          />
          <Line 
            type="monotone" 
            dataKey="expenses" 
            stroke="#ef4444" 
            strokeWidth={3}
            dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: '#dc2626' }}
            name="Expenses"
          />
          <Line 
            type="monotone" 
            dataKey="net" 
            stroke="#3b82f6" 
            strokeWidth={3}
            strokeDasharray="5 5"
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: '#2563eb' }}
            name="Net Profit"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CashFlowChart;