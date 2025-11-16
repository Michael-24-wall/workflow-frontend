// components/finance/InvestmentCalculator.jsx
import React, { useState, useEffect } from 'react';
import useAuthStore from '../stores/authStore';

const InvestmentCalculator = ({ organization }) => {
  const { 
    calculateInvestment, 
    isLoading, 
    error,
    clearError 
  } = useAuthStore();
  
  const [results, setResults] = useState(null);
  const [calculationError, setCalculationError] = useState(null);
  const [inputs, setInputs] = useState({
    initial_investment: 10000,
    monthly_contribution: 500,
    annual_return_rate: 7.0,
    investment_period: 20,
    currency: 'USD',
  });

  // Clear errors when component mounts or organization changes
  useEffect(() => {
    clearError();
    setCalculationError(null);
  }, [organization, clearError]);

  const handleInputChange = (field, value) => {
    setInputs(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCalculate = async () => {
    clearError();
    setCalculationError(null);
    setResults(null);

    try {
      const calculationInputs = {
        ...inputs,
        organization_slug: organization?.subdomain,
        organization_id: organization?.id
      };

      const response = await calculateInvestment(calculationInputs);

      if (response && response.success) {
        setResults(response.data || response.results);
      } else {
        setCalculationError(response?.error || 'Calculation failed');
      }
    } catch (err) {
      setCalculationError(err.message || 'An unexpected error occurred');
    }
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const resetCalculator = () => {
    setResults(null);
    setCalculationError(null);
    clearError();
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Investment Calculator</h3>
        <p className="text-sm text-gray-600">Calculate investment growth and returns</p>
      </div>

      {/* Error Display */}
      {(error || calculationError) && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-red-400">⚠️</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error || calculationError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Input Section */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Initial Investment
          </label>
          <input
            type="number"
            value={inputs.initial_investment}
            onChange={(e) => handleInputChange('initial_investment', parseFloat(e.target.value) || 0)}
            min="0"
            step="100"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter initial investment"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Monthly Contribution
          </label>
          <input
            type="number"
            value={inputs.monthly_contribution}
            onChange={(e) => handleInputChange('monthly_contribution', parseFloat(e.target.value) || 0)}
            min="0"
            step="50"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter monthly contribution"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Annual Return (%)
            </label>
            <input
              type="number"
              value={inputs.annual_return_rate}
              onChange={(e) => handleInputChange('annual_return_rate', parseFloat(e.target.value) || 0)}
              min="0"
              step="0.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="7.0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Period (years)
            </label>
            <input
              type="number"
              value={inputs.investment_period}
              onChange={(e) => handleInputChange('investment_period', parseFloat(e.target.value) || 0)}
              min="1"
              step="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="20"
            />
          </div>
        </div>

        <button 
          onClick={handleCalculate}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Calculating...
            </div>
          ) : (
            'Calculate Growth'
          )}
        </button>
      </div>

      {/* Results Section */}
      {results && (
        <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-purple-900">Investment Results</h4>
            <button
              onClick={resetCalculator}
              className="text-purple-600 hover:text-purple-800 text-sm font-medium"
            >
              Calculate Again
            </button>
          </div>

          {/* Key Results */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-white rounded-lg border border-purple-100">
              <div className="text-sm text-purple-600 font-medium">Future Value</div>
              <div className="text-xl font-bold text-purple-900 mt-1">
                {formatCurrency(results.future_value, inputs.currency)}
              </div>
            </div>
            
            <div className="text-center p-3 bg-white rounded-lg border border-purple-100">
              <div className="text-sm text-purple-600 font-medium">Total Contributions</div>
              <div className="text-lg font-semibold text-purple-900 mt-1">
                {formatCurrency(results.total_contributions, inputs.currency)}
              </div>
            </div>
            
            <div className="text-center p-3 bg-white rounded-lg border border-purple-100">
              <div className="text-sm text-purple-600 font-medium">Interest Earned</div>
              <div className="text-lg font-semibold text-purple-900 mt-1">
                {formatCurrency(results.total_interest, inputs.currency)}
              </div>
            </div>
          </div>

          {/* Growth Timeline */}
          {results.growth_timeline && results.growth_timeline.length > 0 && (
            <div className="mt-4">
              <h5 className="text-sm font-medium text-purple-800 mb-2">Growth Timeline</h5>
              <div className="overflow-x-auto">
                <table className="w-full text-sm bg-white rounded-lg overflow-hidden">
                  <thead className="bg-purple-100">
                    <tr>
                      <th className="px-3 py-2 text-left text-purple-800 font-medium">Year</th>
                      <th className="px-3 py-2 text-left text-purple-800 font-medium">Balance</th>
                      <th className="px-3 py-2 text-left text-purple-800 font-medium">Contributions</th>
                      <th className="px-3 py-2 text-left text-purple-800 font-medium">Growth</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-50">
                    {results.growth_timeline.map((year) => (
                      <tr key={year.year} className="hover:bg-purple-50">
                        <td className="px-3 py-2 text-gray-700">{year.year}</td>
                        <td className="px-3 py-2 font-medium text-purple-900">
                          {formatCurrency(year.balance, inputs.currency)}
                        </td>
                        <td className="px-3 py-2 text-gray-600">
                          {formatCurrency(year.total_contributions, inputs.currency)}
                        </td>
                        <td className="px-3 py-2 text-green-600 font-medium">
                          {formatCurrency(year.balance - year.total_contributions, inputs.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!results && !isLoading && (
        <div className="mt-6 text-center py-8 text-gray-500">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-xl">📈</span>
          </div>
          <p className="text-sm">Enter investment details to calculate growth</p>
        </div>
      )}
    </div>
  );
};

export default InvestmentCalculator;