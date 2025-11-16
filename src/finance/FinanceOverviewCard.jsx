import React from 'react';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react'; 

/**
 * A reusable card component to display a key financial metric (Stat).
 * @param {object} props
 * @param {string} props.title - The title of the metric (e.g., "Total Revenue").
 * @param {string} props.value - The main numeric value (e.g., "$1.5M").
 * @param {number} [props.change] - The percentage change (positive for up, negative for down).
 * @param {React.ReactNode} [props.Icon] - An optional icon to display.
 */
const FinanceOverviewCard = ({ 
    title, 
    value, 
    change, 
    Icon = DollarSign 
}) => {
    // Determine color and icon for the change metric
    const isPositive = change > 0;
    const isNegative = change < 0;
    
    const changeColor = isPositive 
        ? 'text-green-600 bg-green-100' 
        : isNegative 
            ? 'text-red-600 bg-red-100' 
            : 'text-gray-600 bg-gray-100';
            
    const ChangeIcon = isPositive 
        ? TrendingUp 
        : isNegative 
            ? TrendingDown 
            : null;

    const changeText = change 
        ? `${Math.abs(change).toFixed(1)}%` 
        : '--';

    return (
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 transition duration-300 hover:shadow-lg">
            
            {/* Title and Main Icon */}
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                    {title}
                </h3>
                <div className="p-2 rounded-full bg-indigo-500 text-white">
                    <Icon className="w-5 h-5" />
                </div>
            </div>

            {/* Main Value */}
            <div className="text-3xl font-bold text-gray-900 mb-2">
                {value}
            </div>

            {/* Change/Trend Indicator */}
            {change !== undefined && (
                <div className="flex items-center space-x-2">
                    <span className={`flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${changeColor}`}>
                        {ChangeIcon && <ChangeIcon className="w-4 h-4 mr-1" />}
                        {changeText}
                    </span>
                    <span className="text-xs text-gray-500">
                        vs. last period
                    </span>
                </div>
            )}
        </div>
    );
};

export default FinanceOverviewCard;