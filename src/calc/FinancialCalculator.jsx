// components/FinancialCalculator.jsx
import React, { useState, useEffect } from 'react';
import useAuthStore from '../stores/authStore';

const FinancialCalculator = ({ 
  organizationSlug, 
  organizationId, 
  defaultCalculator = 'loan' 
}) => {
  const { 
    calculateLoan, 
    calculateInvestment, 
    calculateROI,
    isLoading, 
    error,
    clearError,
    organization // Get organization from auth store as backup
  } = useAuthStore();
  
  const [activeCalculator, setActiveCalculator] = useState(defaultCalculator);
  const [results, setResults] = useState(null);
  const [calculationError, setCalculationError] = useState(null);
  const [calculationSource, setCalculationSource] = useState('');
  
  // Use provided props or fall back to store data
  const actualOrganizationSlug = organizationSlug || organization?.subdomain;
  const actualOrganizationId = organizationId || organization?.id;

  const [inputs, setInputs] = useState({
    // Loan calculator inputs
    loan_amount: '',
    interest_rate: '',
    loan_term: '',
    payment_frequency: 'monthly',
    
    // Investment calculator inputs
    initial_investment: '',
    monthly_contribution: '',
    annual_return_rate: '',
    investment_period: '',
    
    // ROI calculator inputs
    investment_amount: '',
    return_amount: '',
    time_period: '',
    
    currency: 'USD',
  });

  // Debug organization context on mount
  useEffect(() => {
    console.log('🏢 FinancialCalculator Organization Context:', {
      providedSlug: organizationSlug,
      providedId: organizationId,
      storeSlug: organization?.subdomain,
      storeId: organization?.id,
      actualSlug: actualOrganizationSlug,
      actualId: actualOrganizationId
    });
  }, [organizationSlug, organizationId, organization, actualOrganizationSlug, actualOrganizationId]);

  // Clear errors when switching calculators
  useEffect(() => {
    clearError();
    setCalculationError(null);
    setResults(null);
    setCalculationSource('');
  }, [activeCalculator, clearError]);

  const handleInputChange = (field, value) => {
    setInputs(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateInputs = () => {
    const requiredFields = {
      loan: ['loan_amount', 'interest_rate', 'loan_term'],
      investment: ['initial_investment', 'annual_return_rate', 'investment_period'],
      roi: ['investment_amount', 'return_amount', 'time_period']
    };

    const fields = requiredFields[activeCalculator] || [];
    
    for (const field of fields) {
      const value = inputs[field];
      if (!value || value <= 0) {
        setCalculationError(`Please enter a valid ${field.replace('_', ' ')}`);
        return false;
      }
    }
    
    return true;
  };

  // Client-side calculation functions (fallback)
  const calculateLoanClientSide = (inputs) => {
    const principal = parseFloat(inputs.loan_amount);
    const annualRate = parseFloat(inputs.interest_rate);
    const years = parseFloat(inputs.loan_term);
    const frequency = inputs.payment_frequency;

    // Handle different payment frequencies
    let periods, periodicRate;
    if (frequency === 'monthly') {
      periods = years * 12;
      periodicRate = annualRate / 100 / 12;
    } else if (frequency === 'biweekly') {
      periods = years * 26;
      periodicRate = annualRate / 100 / 26;
    } else if (frequency === 'weekly') {
      periods = years * 52;
      periodicRate = annualRate / 100 / 52;
    } else {
      periods = years * 12;
      periodicRate = annualRate / 100 / 12;
    }

    // Calculate monthly payment
    let monthlyPayment;
    if (periodicRate === 0) {
      monthlyPayment = principal / periods;
    } else {
      monthlyPayment = principal * (periodicRate * Math.pow(1 + periodicRate, periods)) / 
                      (Math.pow(1 + periodicRate, periods) - 1);
    }

    const totalPayment = monthlyPayment * periods;
    const totalInterest = totalPayment - principal;

    // Generate amortization schedule (first year)
    const amortizationSchedule = [];
    let balance = principal;
    
    for (let month = 1; month <= Math.min(12, periods); month++) {
      const interest = balance * periodicRate;
      const principalPayment = monthlyPayment - interest;
      balance -= principalPayment;

      amortizationSchedule.push({
        month,
        payment: Math.round(monthlyPayment * 100) / 100,
        principal: Math.round(principalPayment * 100) / 100,
        interest: Math.round(interest * 100) / 100,
        balance: Math.round(Math.max(0, balance) * 100) / 100
      });
    }

    return {
      monthly_payment: Math.round(monthlyPayment * 100) / 100,
      total_interest: Math.round(totalInterest * 100) / 100,
      total_payment: Math.round(totalPayment * 100) / 100,
      amortization_schedule: amortizationSchedule
    };
  };

  const calculateInvestmentClientSide = (inputs) => {
    const initial = parseFloat(inputs.initial_investment);
    const monthly = parseFloat(inputs.monthly_contribution) || 0;
    const annualRate = parseFloat(inputs.annual_return_rate);
    const years = parseFloat(inputs.investment_period);

    const monthlyRate = annualRate / 100 / 12;
    const periods = years * 12;

    // Calculate future value with compound interest
    let futureValue = initial * Math.pow(1 + monthlyRate, periods);
    
    if (monthly > 0) {
      futureValue += monthly * (Math.pow(1 + monthlyRate, periods) - 1) / monthlyRate;
    }

    const totalContributions = initial + (monthly * periods);
    const totalInterest = futureValue - totalContributions;

    // Generate growth timeline
    const growthTimeline = [];
    let balance = initial;
    
    for (let year = 1; year <= years; year++) {
      for (let month = 1; month <= 12; month++) {
        balance = balance * (1 + monthlyRate) + monthly;
      }
      growthTimeline.push({
        year,
        balance: Math.round(balance * 100) / 100,
        total_contributions: Math.round((initial + (monthly * 12 * year)) * 100) / 100
      });
    }

    return {
      future_value: Math.round(futureValue * 100) / 100,
      total_contributions: Math.round(totalContributions * 100) / 100,
      total_interest: Math.round(totalInterest * 100) / 100,
      growth_timeline: growthTimeline
    };
  };

  const calculateROIClientSide = (inputs) => {
    const investment = parseFloat(inputs.investment_amount);
    const returns = parseFloat(inputs.return_amount);
    const years = parseFloat(inputs.time_period);

    const netProfit = returns - investment;
    const roiPercentage = (netProfit / investment) * 100;
    const annualROI = roiPercentage / years;

    return {
      roi_percentage: Math.round(roiPercentage * 100) / 100,
      annual_roi: Math.round(annualROI * 100) / 100,
      net_profit: Math.round(netProfit * 100) / 100
    };
  };

  const handleCalculate = async () => {
    console.log('🚀 CALCULATE BUTTON CLICKED!');
    console.log('🏢 Organization Context:', {
      slug: actualOrganizationSlug,
      id: actualOrganizationId
    });
    
    clearError();
    setCalculationError(null);
    setResults(null);
    setCalculationSource('');

    // Validate inputs
    if (!validateInputs()) {
      return;
    }

    try {
      // Prepare inputs with organization context
      const calculationInputs = {
        ...inputs,
        type: activeCalculator
      };

      // Only include organization context if available
      if (actualOrganizationSlug) {
        calculationInputs.organization_slug = actualOrganizationSlug;
      }
      if (actualOrganizationId) {
        calculationInputs.organization_id = actualOrganizationId;
      }

      console.log('📤 Sending calculation inputs:', calculationInputs);

      let response;
      
      // Try backend calculation first if we have organization context
      if (actualOrganizationSlug && actualOrganizationSlug !== 'undefined') {
        console.log('🌐 Attempting backend calculation...');
        
        try {
          if (activeCalculator === 'loan') {
            console.log('💰 Calling calculateLoan...');
            response = await calculateLoan(calculationInputs);
          } else if (activeCalculator === 'investment') {
            console.log('📈 Calling calculateInvestment...');
            response = await calculateInvestment(calculationInputs);
          } else if (activeCalculator === 'roi') {
            console.log('📊 Calling calculateROI...');
            response = await calculateROI(calculationInputs);
          }

          console.log('📥 Backend response:', response);

          if (response && response.success) {
            console.log('✅ BACKEND SUCCESS!');
            setResults(response.data || response.results);
            setCalculationSource('backend');
            return;
          } else {
            console.log('❌ Backend calculation failed, falling back to client-side');
          }
        } catch (apiError) {
          console.log('🌐 Backend API error, falling back to client-side:', apiError);
        }
      } else {
        console.log('🏠 No valid organization context, using client-side calculation');
      }

      // Fallback to client-side calculation
      console.log('🔄 Using client-side calculation...');
      setCalculationSource('client');

      let clientResults;
      if (activeCalculator === 'loan') {
        clientResults = calculateLoanClientSide(inputs);
      } else if (activeCalculator === 'investment') {
        clientResults = calculateInvestmentClientSide(inputs);
      } else if (activeCalculator === 'roi') {
        clientResults = calculateROIClientSide(inputs);
      }

      console.log('💻 Client-side results:', clientResults);
      setResults(clientResults);

    } catch (err) {
      console.error('💥 Calculation error:', err);
      setCalculationError(err.message || 'An unexpected error occurred');
      setCalculationSource('error');
    }
  };

  const formatCurrency = (amount, currency = 'USD') => {
    if (typeof amount !== 'number' || isNaN(amount)) return 'Invalid Amount';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatPercentage = (value) => {
    if (typeof value !== 'number' || isNaN(value)) return 'Invalid Percentage';
    return `${value.toFixed(2)}%`;
  };

  const resetCalculator = () => {
    setResults(null);
    setCalculationError(null);
    setCalculationSource('');
    clearError();
    
    // Reset inputs to empty values
    setInputs({
      loan_amount: '',
      interest_rate: '',
      loan_term: '',
      payment_frequency: 'monthly',
      initial_investment: '',
      monthly_contribution: '',
      annual_return_rate: '',
      investment_period: '',
      investment_amount: '',
      return_amount: '',
      time_period: '',
      currency: 'USD',
    });
  };

  // Input field configurations for different calculators
  const inputFields = {
    loan: [
      {
        label: 'Loan Amount',
        field: 'loan_amount',
        type: 'number',
        min: 0,
        step: 1000,
        placeholder: 'Enter loan amount'
      },
      {
        label: 'Annual Interest Rate (%)',
        field: 'interest_rate',
        type: 'number',
        min: 0,
        step: 0.1,
        placeholder: 'Enter interest rate'
      },
      {
        label: 'Loan Term (years)',
        field: 'loan_term',
        type: 'number',
        min: 1,
        step: 1,
        placeholder: 'Enter loan term'
      },
      {
        label: 'Payment Frequency',
        field: 'payment_frequency',
        type: 'select',
        options: [
          { value: 'monthly', label: 'Monthly' },
          { value: 'biweekly', label: 'Bi-weekly' },
          { value: 'weekly', label: 'Weekly' }
        ]
      }
    ],
    investment: [
      {
        label: 'Initial Investment',
        field: 'initial_investment',
        type: 'number',
        min: 0,
        step: 100,
        placeholder: 'Enter initial amount'
      },
      {
        label: 'Monthly Contribution',
        field: 'monthly_contribution',
        type: 'number',
        min: 0,
        step: 50,
        placeholder: 'Enter monthly contribution'
      },
      {
        label: 'Annual Return Rate (%)',
        field: 'annual_return_rate',
        type: 'number',
        min: 0,
        step: 0.1,
        placeholder: 'Enter expected return rate'
      },
      {
        label: 'Investment Period (years)',
        field: 'investment_period',
        type: 'number',
        min: 1,
        step: 1,
        placeholder: 'Enter investment period'
      }
    ],
    roi: [
      {
        label: 'Investment Amount',
        field: 'investment_amount',
        type: 'number',
        min: 0,
        step: 100,
        placeholder: 'Enter investment amount'
      },
      {
        label: 'Return Amount',
        field: 'return_amount',
        type: 'number',
        min: 0,
        step: 100,
        placeholder: 'Enter return amount'
      },
      {
        label: 'Time Period (years)',
        field: 'time_period',
        type: 'number',
        min: 1,
        step: 1,
        placeholder: 'Enter time period'
      }
    ]
  };

  return (
    <div className="financial-calculator">
      <div className="calculator-header">
        <h2>Financial Calculator</h2>
        <p>Perform real-time financial calculations</p>
        
        {/* Calculation Source Indicator */}
        {calculationSource && (
          <div className={`source-indicator ${calculationSource}`}>
            {calculationSource === 'backend' && '🌐 Using Real-time Backend Calculation'}
            {calculationSource === 'client' && '💻 Using Client-side Calculation'}
            {calculationSource === 'error' && '❌ Calculation Error'}
          </div>
        )}

        {/* Organization Context Debug */}
        <div className="organization-context">
          <small>
            Organization: <strong>{actualOrganizationSlug || 'Not available'}</strong>
            {!actualOrganizationSlug && ' - Using client-side calculations'}
          </small>
        </div>
      </div>

      {/* Calculator Type Selector */}
      <div className="calculator-tabs">
        <button
          className={`tab-button ${activeCalculator === 'loan' ? 'active' : ''}`}
          onClick={() => setActiveCalculator('loan')}
        >
          Loan Calculator
        </button>
        <button
          className={`tab-button ${activeCalculator === 'investment' ? 'active' : ''}`}
          onClick={() => setActiveCalculator('investment')}
        >
          Investment Calculator
        </button>
        <button
          className={`tab-button ${activeCalculator === 'roi' ? 'active' : ''}`}
          onClick={() => setActiveCalculator('roi')}
        >
          ROI Calculator
        </button>
      </div>

      {/* Error Display */}
      {(error || calculationError) && (
        <div className="error-message">
          <strong>Error:</strong> {error || calculationError}
        </div>
      )}

      <div className="calculator-content">
        {/* Input Section */}
        <div className="input-section">
          <h3>Input Parameters</h3>
          
          <div className="input-group">
            {inputFields[activeCalculator]?.map((fieldConfig) => (
              <div key={fieldConfig.field} className="input-field">
                <label>{fieldConfig.label}</label>
                {fieldConfig.type === 'select' ? (
                  <select
                    value={inputs[fieldConfig.field]}
                    onChange={(e) => handleInputChange(fieldConfig.field, e.target.value)}
                  >
                    {fieldConfig.options.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={fieldConfig.type}
                    value={inputs[fieldConfig.field]}
                    onChange={(e) => handleInputChange(fieldConfig.field, parseFloat(e.target.value) || '')}
                    min={fieldConfig.min}
                    step={fieldConfig.step}
                    placeholder={fieldConfig.placeholder}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="action-buttons">
            <button 
              className="calculate-button"
              onClick={handleCalculate}
              disabled={isLoading}
            >
              {isLoading ? 'Calculating...' : 'Calculate'}
            </button>
            
            <button 
              className="reset-button"
              onClick={resetCalculator}
            >
              Reset
            </button>
          </div>
        </div>

        {/* Results Section */}
        <div className="results-section">
          <h3>
            {results ? '📊 Calculation Results' : '⏳ Waiting for Calculation...'}
          </h3>
          
          {results ? (
            <div className="results-content">
              {/* Success indicator */}
              <div className="success-indicator">
                <strong>✅ CALCULATION SUCCESSFUL!</strong>
                <br />
                Calculator: {activeCalculator.toUpperCase()} | 
                Source: {calculationSource === 'backend' ? 'Backend API' : 'Client-side'}
              </div>

              {/* Render results based on active calculator */}
              {activeCalculator === 'loan' && results.monthly_payment && (
                <div className="loan-results">
                  <div className="result-cards">
                    <div className="result-card highlight">
                      <h4>Monthly Payment</h4>
                      <div className="result-value main-result">
                        {formatCurrency(results.monthly_payment, inputs.currency)}
                      </div>
                      <small>per month</small>
                    </div>
                    
                    <div className="result-card">
                      <h4>Total Interest</h4>
                      <div className="result-value">
                        {formatCurrency(results.total_interest, inputs.currency)}
                      </div>
                    </div>
                    
                    <div className="result-card">
                      <h4>Total Payment</h4>
                      <div className="result-value">
                        {formatCurrency(results.total_payment, inputs.currency)}
                      </div>
                    </div>
                  </div>

                  {results.amortization_schedule && results.amortization_schedule.length > 0 && (
                    <div className="amortization-schedule">
                      <h4>Amortization Schedule (First Year)</h4>
                      <div className="schedule-table">
                        <table>
                          <thead>
                            <tr>
                              <th>Month</th>
                              <th>Payment</th>
                              <th>Principal</th>
                              <th>Interest</th>
                              <th>Balance</th>
                            </tr>
                          </thead>
                          <tbody>
                            {results.amortization_schedule.map((row) => (
                              <tr key={row.month}>
                                <td>{row.month}</td>
                                <td>{formatCurrency(row.payment, inputs.currency)}</td>
                                <td>{formatCurrency(row.principal, inputs.currency)}</td>
                                <td>{formatCurrency(row.interest, inputs.currency)}</td>
                                <td>{formatCurrency(row.balance, inputs.currency)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeCalculator === 'investment' && results.future_value && (
                <div className="investment-results">
                  <div className="result-cards">
                    <div className="result-card highlight">
                      <h4>Future Value</h4>
                      <div className="result-value main-result">
                        {formatCurrency(results.future_value, inputs.currency)}
                      </div>
                      <small>end value</small>
                    </div>
                    
                    <div className="result-card">
                      <h4>Total Contributions</h4>
                      <div className="result-value">
                        {formatCurrency(results.total_contributions, inputs.currency)}
                      </div>
                    </div>
                    
                    <div className="result-card">
                      <h4>Total Interest Earned</h4>
                      <div className="result-value">
                        {formatCurrency(results.total_interest, inputs.currency)}
                      </div>
                    </div>
                  </div>

                  {results.growth_timeline && results.growth_timeline.length > 0 && (
                    <div className="growth-timeline">
                      <h4>Growth Timeline</h4>
                      <div className="timeline-table">
                        <table>
                          <thead>
                            <tr>
                              <th>Year</th>
                              <th>Balance</th>
                              <th>Total Contributions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {results.growth_timeline.map((item) => (
                              <tr key={item.year}>
                                <td>{item.year}</td>
                                <td>{formatCurrency(item.balance, inputs.currency)}</td>
                                <td>{formatCurrency(item.total_contributions, inputs.currency)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeCalculator === 'roi' && results.roi_percentage && (
                <div className="roi-results">
                  <div className="result-cards">
                    <div className="result-card highlight">
                      <h4>ROI Percentage</h4>
                      <div className="result-value main-result">
                        {formatPercentage(results.roi_percentage)}
                      </div>
                      <small>return on investment</small>
                    </div>
                    
                    <div className="result-card">
                      <h4>Annual ROI</h4>
                      <div className="result-value">
                        {formatPercentage(results.annual_roi)}
                      </div>
                    </div>
                    
                    <div className="result-card">
                      <h4>Net Profit</h4>
                      <div className="result-value">
                        {formatCurrency(results.net_profit, inputs.currency)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="empty-results">
              <div className="empty-icon">🧮</div>
              <p>No results yet. Enter values and click "Calculate" to see your results here.</p>
              <p><strong>Your calculation will appear in this section!</strong></p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .financial-calculator {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .calculator-header {
          text-align: center;
          margin-bottom: 20px;
        }

        .organization-context {
          margin-top: 10px;
          padding: 8px;
          background: #f8f9fa;
          border-radius: 4px;
          border: 1px solid #e9ecef;
        }

        .source-indicator {
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: bold;
          margin-top: 10px;
          display: inline-block;
        }

        .source-indicator.backend {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .source-indicator.client {
          background: #fff3cd;
          color: #856404;
          border: 1px solid #ffeaa7;
        }

        .source-indicator.error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .calculator-tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }

        .tab-button {
          padding: 10px 20px;
          border: none;
          background: #f8f9fa;
          color: #666;
          border-radius: 6px;
          cursor: pointer;
          flex: 1;
          transition: all 0.3s ease;
        }

        .tab-button.active {
          background: #007bff;
          color: white;
        }

        .calculator-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        @media (max-width: 768px) {
          .calculator-content {
            grid-template-columns: 1fr;
          }
          
          .calculator-tabs {
            flex-direction: column;
          }
        }

        .input-section, .results-section {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }

        .input-group {
          display: grid;
          gap: 15px;
        }

        .input-field {
          display: flex;
          flex-direction: column;
        }

        .input-field label {
          font-weight: bold;
          margin-bottom: 5px;
          color: #333;
        }

        .input-field input,
        .input-field select {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .action-buttons {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }

        .calculate-button {
          padding: 10px 20px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          flex: 2;
        }

        .calculate-button:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }

        .reset-button {
          padding: 10px 20px;
          background: #6c757d;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          flex: 1;
        }

        .error-message {
          background: #f8d7da;
          color: #721c24;
          padding: 10px;
          border-radius: 6px;
          margin-bottom: 15px;
        }

        .success-indicator {
          background: #d1edff;
          color: #004085;
          padding: 10px;
          border-radius: 6px;
          margin-bottom: 15px;
          text-align: center;
        }

        .result-cards {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
          margin-bottom: 15px;
        }

        @media (max-width: 768px) {
          .result-cards {
            grid-template-columns: 1fr;
          }
        }

        .result-card {
          background: white;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
          border: 1px solid #ddd;
        }

        .result-card.highlight {
          border: 2px solid #007bff;
          background: #f8f9ff;
        }

        .result-value {
          font-size: 16px;
          font-weight: bold;
          margin: 8px 0;
          color: #333;
        }

        .result-value.main-result {
          font-size: 20px;
          color: #007bff;
        }

        .amortization-schedule,
        .growth-timeline {
          margin-top: 15px;
        }

        .schedule-table,
        .timeline-table {
          overflow-x: auto;
          background: white;
          border-radius: 6px;
          border: 1px solid #ddd;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th, td {
          padding: 8px 10px;
          text-align: left;
          border-bottom: 1px solid #ddd;
          font-size: 12px;
        }

        th {
          background: #f8f9fa;
          font-weight: bold;
        }

        .empty-results {
          text-align: center;
          padding: 30px 20px;
          color: #666;
        }

        .empty-icon {
          font-size: 36px;
          margin-bottom: 10px;
        }
      `}</style>
    </div>
  );
};

export default FinancialCalculator;