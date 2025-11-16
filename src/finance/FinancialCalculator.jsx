// components/FinancialCalculator.jsx
import React, { useState, useEffect } from 'react';

const FinancialCalculator = ({ organizationSlug }) => {
  const [activeCalculator, setActiveCalculator] = useState('loan');
  const [results, setResults] = useState(null);
  const [calculationError, setCalculationError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [inputs, setInputs] = useState({
    // Loan calculator inputs
    loan_amount: 100000,
    interest_rate: 5.0,
    loan_term: 30,
    payment_frequency: 'monthly',
    
    // Investment calculator inputs
    initial_investment: 10000,
    monthly_contribution: 500,
    annual_return_rate: 7.0,
    investment_period: 20,
    
    // ROI calculator inputs
    investment_amount: 50000,
    return_amount: 75000,
    time_period: 5
  });

  // Clear errors when switching calculators
  useEffect(() => {
    setCalculationError(null);
    setResults(null);
  }, [activeCalculator]);

  const handleInputChange = (field, value) => {
    setInputs(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCalculate = async () => {
    console.log('🚀 Starting calculation...');
    setCalculationError(null);
    setResults(null);
    setIsLoading(true);

    try {
      // Prepare request data
      const requestData = {
        type: activeCalculator,
        inputs: {}
      };

      // Set inputs based on calculator type
      if (activeCalculator === 'loan') {
        requestData.inputs = {
          loan_amount: parseFloat(inputs.loan_amount),
          interest_rate: parseFloat(inputs.interest_rate),
          loan_term: parseFloat(inputs.loan_term),
          payment_frequency: inputs.payment_frequency
        };
      } else if (activeCalculator === 'investment') {
        requestData.inputs = {
          initial_investment: parseFloat(inputs.initial_investment),
          monthly_contribution: parseFloat(inputs.monthly_contribution),
          annual_return_rate: parseFloat(inputs.annual_return_rate),
          investment_period: parseFloat(inputs.investment_period)
        };
      } else if (activeCalculator === 'roi') {
        // Handle ROI client-side
        const roiResults = calculateROI(inputs);
        setResults(roiResults);
        setIsLoading(false);
        return;
      }

      console.log('📤 Sending request:', requestData);
      console.log('🔗 Organization slug:', organizationSlug);

      const token = localStorage.getItem('access_token');
      console.log('🔑 Token present:', !!token);

      const response = await fetch(
        `/api/v1/organizations/${organizationSlug}/dashboard/financial_calculator/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(requestData)
        }
      );

      console.log('📥 Response status:', response.status);
      
      const data = await response.json();
      console.log('📦 Full response data:', data);

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      if (data.success) {
        console.log('✅ Setting results:', data.results);
        setResults(data.results);
      } else {
        throw new Error(data.error || 'Calculation failed');
      }

    } catch (err) {
      console.error('❌ Calculation error:', err);
      setCalculationError(err.message);
      
      // Fallback to client-side calculation
      console.log('🔄 Using client-side fallback calculation');
      const fallbackResults = calculateClientSide(activeCalculator, inputs);
      setResults(fallbackResults);
    } finally {
      setIsLoading(false);
    }
  };

  // Client-side ROI calculation
  const calculateROI = (inputs) => {
    const { investment_amount, return_amount, time_period } = inputs;
    
    const netProfit = return_amount - investment_amount;
    const roiPercentage = (netProfit / investment_amount) * 100;
    const annualROI = roiPercentage / time_period;

    return {
      roi_percentage: Math.round(roiPercentage * 100) / 100,
      annual_roi: Math.round(annualROI * 100) / 100,
      net_profit: Math.round(netProfit * 100) / 100
    };
  };

  // Client-side fallback calculations
  const calculateClientSide = (calculatorType, inputs) => {
    console.log('🔄 Performing client-side calculation for:', calculatorType);
    
    switch (calculatorType) {
      case 'loan':
        return calculateLoanClientSide(inputs);
      case 'investment':
        return calculateInvestmentClientSide(inputs);
      case 'roi':
        return calculateROI(inputs);
      default:
        return null;
    }
  };

  const calculateLoanClientSide = (inputs) => {
    const { loan_amount, interest_rate, loan_term, payment_frequency } = inputs;
    
    let periods, periodicRate;
    
    switch (payment_frequency) {
      case 'monthly':
        periods = loan_term * 12;
        periodicRate = interest_rate / 100 / 12;
        break;
      case 'biweekly':
        periods = loan_term * 26;
        periodicRate = interest_rate / 100 / 26;
        break;
      case 'weekly':
        periods = loan_term * 52;
        periodicRate = interest_rate / 100 / 52;
        break;
      default:
        periods = loan_term * 12;
        periodicRate = interest_rate / 100 / 12;
    }

    // Handle zero interest rate
    let monthlyPayment;
    if (periodicRate === 0) {
      monthlyPayment = loan_amount / periods;
    } else {
      monthlyPayment = loan_amount * 
        (periodicRate * Math.pow(1 + periodicRate, periods)) / 
        (Math.pow(1 + periodicRate, periods) - 1);
    }

    const totalPayment = monthlyPayment * periods;
    const totalInterest = totalPayment - loan_amount;

    // Generate simplified amortization schedule (first year)
    const schedule = [];
    let balance = loan_amount;
    
    for (let i = 1; i <= Math.min(12, periods); i++) {
      let interest, principal;
      
      if (periodicRate === 0) {
        interest = 0;
        principal = monthlyPayment;
      } else {
        interest = balance * periodicRate;
        principal = monthlyPayment - interest;
      }
      
      balance -= principal;
      
      schedule.push({
        month: i,
        payment: Math.round(monthlyPayment * 100) / 100,
        principal: Math.round(principal * 100) / 100,
        interest: Math.round(interest * 100) / 100,
        balance: Math.round(Math.max(0, balance) * 100) / 100
      });
      
      if (balance <= 0) break;
    }

    return {
      monthly_payment: Math.round(monthlyPayment * 100) / 100,
      total_interest: Math.round(totalInterest * 100) / 100,
      total_payment: Math.round(totalPayment * 100) / 100,
      amortization_schedule: schedule
    };
  };

  const calculateInvestmentClientSide = (inputs) => {
    const { initial_investment, monthly_contribution, annual_return_rate, investment_period } = inputs;
    
    const monthlyRate = annual_return_rate / 100 / 12;
    const periods = investment_period * 12;
    
    // Future value of initial investment
    let futureValue = initial_investment * Math.pow(1 + monthlyRate, periods);
    
    // Future value of monthly contributions
    if (monthly_contribution > 0) {
      futureValue += monthly_contribution * 
        ((Math.pow(1 + monthlyRate, periods) - 1) / monthlyRate);
    }
    
    const totalContributions = initial_investment + (monthly_contribution * periods);
    const totalInterest = futureValue - totalContributions;
    
    // Generate growth timeline
    const timeline = [];
    let balance = initial_investment;
    
    for (let year = 1; year <= investment_period; year++) {
      for (let month = 1; month <= 12; month++) {
        balance = balance * (1 + monthlyRate) + monthly_contribution;
      }
      
      timeline.push({
        year: year,
        balance: Math.round(balance * 100) / 100,
        total_contributions: initial_investment + (monthly_contribution * 12 * year)
      });
    }

    return {
      future_value: Math.round(futureValue * 100) / 100,
      total_contributions: Math.round(totalContributions * 100) / 100,
      total_interest: Math.round(totalInterest * 100) / 100,
      growth_timeline: timeline
    };
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatPercentage = (value) => {
    return `${Math.round(value * 100) / 100}%`;
  };

  // Test function to verify results display
  const testResultsDisplay = () => {
    console.log('🧪 Testing results display...');
    const testData = {
      monthly_payment: 653169984158.9,
      total_interest: 4745754605034.0,
      total_payment: 39190199049534.0,
      amortization_schedule: [
        {
          month: 1,
          payment: 653169984158.9,
          principal: 503910724899.4,
          interest: 149259259259.5,
          balance: 33940533719600.6
        },
        {
          month: 2,
          payment: 653169984158.9,
          principal: 506094338040.63,
          interest: 147075646118.27,
          balance: 33434439381559.97
        }
      ]
    };
    setResults(testData);
    console.log('✅ Test results set:', testData);
  };

  return (
    <div className="financial-calculator">
      <div className="calculator-header">
        <h2>Financial Calculator</h2>
        <p>Perform various financial calculations with real-time results</p>
        
        {/* Debug button - remove in production */}
        <button 
          onClick={testResultsDisplay}
          style={{
            marginTop: '10px', 
            background: '#28a745',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Test Results Display
        </button>
      </div>

      {/* Calculator Type Selector */}
      <div className="calculator-tabs">
        {['loan', 'investment', 'roi'].map(calcType => (
          <button
            key={calcType}
            className={`tab-button ${activeCalculator === calcType ? 'active' : ''}`}
            onClick={() => setActiveCalculator(calcType)}
          >
            {calcType === 'loan' && 'Loan Calculator'}
            {calcType === 'investment' && 'Investment Calculator'}
            {calcType === 'roi' && 'ROI Calculator'}
          </button>
        ))}
      </div>

      {/* Error Display */}
      {calculationError && (
        <div className="error-message">
          <strong>Error:</strong> {calculationError}
          {calculationError.includes('fallback') && (
            <div className="fallback-notice">
              Using client-side calculation as fallback
            </div>
          )}
        </div>
      )}

      <div className="calculator-content">
        {/* Input Section */}
        <div className="input-section">
          <h3>Input Parameters</h3>
          
          {activeCalculator === 'loan' && (
            <div className="input-group">
              <div className="input-field">
                <label>Loan Amount ($)</label>
                <input
                  type="number"
                  value={inputs.loan_amount}
                  onChange={(e) => handleInputChange('loan_amount', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="1000"
                />
              </div>
              
              <div className="input-field">
                <label>Annual Interest Rate (%)</label>
                <input
                  type="number"
                  value={inputs.interest_rate}
                  onChange={(e) => handleInputChange('interest_rate', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.1"
                />
              </div>
              
              <div className="input-field">
                <label>Loan Term (years)</label>
                <input
                  type="number"
                  value={inputs.loan_term}
                  onChange={(e) => handleInputChange('loan_term', parseFloat(e.target.value) || 0)}
                  min="1"
                  step="1"
                />
              </div>
              
              <div className="input-field">
                <label>Payment Frequency</label>
                <select
                  value={inputs.payment_frequency}
                  onChange={(e) => handleInputChange('payment_frequency', e.target.value)}
                >
                  <option value="monthly">Monthly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
            </div>
          )}

          {activeCalculator === 'investment' && (
            <div className="input-group">
              <div className="input-field">
                <label>Initial Investment ($)</label>
                <input
                  type="number"
                  value={inputs.initial_investment}
                  onChange={(e) => handleInputChange('initial_investment', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="100"
                />
              </div>
              
              <div className="input-field">
                <label>Monthly Contribution ($)</label>
                <input
                  type="number"
                  value={inputs.monthly_contribution}
                  onChange={(e) => handleInputChange('monthly_contribution', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="50"
                />
              </div>
              
              <div className="input-field">
                <label>Annual Return Rate (%)</label>
                <input
                  type="number"
                  value={inputs.annual_return_rate}
                  onChange={(e) => handleInputChange('annual_return_rate', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.1"
                />
              </div>
              
              <div className="input-field">
                <label>Investment Period (years)</label>
                <input
                  type="number"
                  value={inputs.investment_period}
                  onChange={(e) => handleInputChange('investment_period', parseFloat(e.target.value) || 0)}
                  min="1"
                  step="1"
                />
              </div>
            </div>
          )}

          {activeCalculator === 'roi' && (
            <div className="input-group">
              <div className="input-field">
                <label>Investment Amount ($)</label>
                <input
                  type="number"
                  value={inputs.investment_amount}
                  onChange={(e) => handleInputChange('investment_amount', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="1000"
                />
              </div>
              
              <div className="input-field">
                <label>Return Amount ($)</label>
                <input
                  type="number"
                  value={inputs.return_amount}
                  onChange={(e) => handleInputChange('return_amount', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="1000"
                />
              </div>
              
              <div className="input-field">
                <label>Time Period (years)</label>
                <input
                  type="number"
                  value={inputs.time_period}
                  onChange={(e) => handleInputChange('time_period', parseFloat(e.target.value) || 0)}
                  min="1"
                  step="1"
                />
              </div>
            </div>
          )}

          <button 
            className="calculate-button"
            onClick={handleCalculate}
            disabled={isLoading}
          >
            {isLoading ? '🔄 Calculating...' : '🧮 Calculate'}
          </button>
        </div>

        {/* Results Section - THIS IS WHAT YOU'LL SEE AFTER CALCULATION */}
        {results && (
          <div className="results-section">
            <h3>🎯 Calculation Results</h3>
            <div className="success-message">
              ✅ Calculation completed successfully!
            </div>
            
            {activeCalculator === 'loan' && results.monthly_payment && (
              <div className="loan-results">
                <div className="result-cards">
                  <div className="result-card">
                    <h4>Monthly Payment</h4>
                    <div className="result-value">
                      {formatCurrency(results.monthly_payment)}
                    </div>
                    <div className="result-description">
                      Your monthly payment amount
                    </div>
                  </div>
                  
                  <div className="result-card">
                    <h4>Total Interest</h4>
                    <div className="result-value">
                      {formatCurrency(results.total_interest)}
                    </div>
                    <div className="result-description">
                      Total interest paid over loan term
                    </div>
                  </div>
                  
                  <div className="result-card">
                    <h4>Total Payment</h4>
                    <div className="result-value">
                      {formatCurrency(results.total_payment)}
                    </div>
                    <div className="result-description">
                      Principal + Interest over loan term
                    </div>
                  </div>
                </div>

                {results.amortization_schedule && results.amortization_schedule.length > 0 && (
                  <div className="amortization-schedule">
                    <h4>📅 Amortization Schedule (First Year)</h4>
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
                              <td>{formatCurrency(row.payment)}</td>
                              <td>{formatCurrency(row.principal)}</td>
                              <td>{formatCurrency(row.interest)}</td>
                              <td>{formatCurrency(row.balance)}</td>
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
                  <div className="result-card">
                    <h4>Future Value</h4>
                    <div className="result-value">
                      {formatCurrency(results.future_value)}
                    </div>
                    <div className="result-description">
                      Total value at end of investment period
                    </div>
                  </div>
                  
                  <div className="result-card">
                    <h4>Total Contributions</h4>
                    <div className="result-value">
                      {formatCurrency(results.total_contributions)}
                    </div>
                    <div className="result-description">
                      Total amount you invested
                    </div>
                  </div>
                  
                  <div className="result-card">
                    <h4>Total Interest Earned</h4>
                    <div className="result-value">
                      {formatCurrency(results.total_interest)}
                    </div>
                    <div className="result-description">
                      Investment growth from returns
                    </div>
                  </div>
                </div>

                {results.growth_timeline && results.growth_timeline.length > 0 && (
                  <div className="growth-timeline">
                    <h4>📈 Growth Timeline</h4>
                    <div className="timeline-table">
                      <table>
                        <thead>
                          <tr>
                            <th>Year</th>
                            <th>Balance</th>
                            <th>Total Contributions</th>
                            <th>Growth</th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.growth_timeline.map((year) => (
                            <tr key={year.year}>
                              <td>{year.year}</td>
                              <td>{formatCurrency(year.balance)}</td>
                              <td>{formatCurrency(year.total_contributions)}</td>
                              <td>{formatCurrency(year.balance - year.total_contributions)}</td>
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
                  <div className="result-card">
                    <h4>ROI Percentage</h4>
                    <div className="result-value">
                      {formatPercentage(results.roi_percentage)}
                    </div>
                    <div className="result-description">
                      Total return on investment
                    </div>
                  </div>
                  
                  <div className="result-card">
                    <h4>Annual ROI</h4>
                    <div className="result-value">
                      {formatPercentage(results.annual_roi)}
                    </div>
                    <div className="result-description">
                      Average annual return
                    </div>
                  </div>
                  
                  <div className="result-card">
                    <h4>Net Profit</h4>
                    <div className="result-value">
                      {formatCurrency(results.net_profit)}
                    </div>
                    <div className="result-description">
                      Total profit after investment
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Debug info - remove in production */}
            <div className="debug-info" style={{marginTop: '20px', padding: '10px', background: '#f8f9fa', borderRadius: '4px'}}>
              <small>🔍 Debug: Results object loaded successfully</small>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .financial-calculator {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .calculator-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .calculator-header h2 {
          color: #2c3e50;
          margin-bottom: 8px;
        }

        .calculator-header p {
          color: #7f8c8d;
          font-size: 16px;
        }

        .calculator-tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 30px;
          border-bottom: 2px solid #e9ecef;
          padding-bottom: 10px;
        }

        .tab-button {
          padding: 12px 24px;
          border: none;
          background: #e9ecef;
          color: #6c757d;
          border-radius: 8px 8px 0 0;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 500;
        }

        .tab-button.active {
          background: #007bff;
          color: white;
        }

        .tab-button:hover:not(.active) {
          background: #dee2e6;
        }

        .calculator-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
        }

        @media (max-width: 768px) {
          .calculator-content {
            grid-template-columns: 1fr;
          }
        }

        .input-section, .results-section {
          background: white;
          padding: 24px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .input-section h3, .results-section h3 {
          color: #2c3e50;
          margin-bottom: 20px;
          border-bottom: 2px solid #007bff;
          padding-bottom: 8px;
        }

        .input-group {
          display: grid;
          gap: 16px;
        }

        .input-field {
          display: flex;
          flex-direction: column;
        }

        .input-field label {
          font-weight: 600;
          margin-bottom: 6px;
          color: #495057;
        }

        .input-field input,
        .input-field select {
          padding: 10px 12px;
          border: 2px solid #e9ecef;
          border-radius: 6px;
          font-size: 16px;
          transition: border-color 0.3s ease;
        }

        .input-field input:focus,
        .input-field select:focus {
          outline: none;
          border-color: #007bff;
        }

        .calculate-button {
          padding: 12px 24px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.3s ease;
          margin-top: 10px;
        }

        .calculate-button:hover:not(:disabled) {
          background: #0056b3;
        }

        .calculate-button:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }

        .error-message {
          background: #f8d7da;
          color: #721c24;
          padding: 12px 16px;
          border-radius: 6px;
          margin-bottom: 20px;
          border: 1px solid #f5c6cb;
        }

        .success-message {
          background: #d1edff;
          color: #0c5460;
          padding: 12px 16px;
          border-radius: 6px;
          margin-bottom: 20px;
          border: 1px solid #bee5eb;
          font-weight: 600;
        }

        .fallback-notice {
          font-size: 14px;
          color: #856404;
          margin-top: 8px;
          padding: 8px;
          background: #fff3cd;
          border-radius: 4px;
        }

        .result-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .result-card {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
          border-left: 4px solid #007bff;
        }

        .result-card h4 {
          margin: 0 0 8px 0;
          color: #6c757d;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .result-value {
          font-size: 24px;
          font-weight: 700;
          color: #2c3e50;
          margin-bottom: 8px;
        }

        .result-description {
          font-size: 12px;
          color: #6c757d;
          font-style: italic;
        }

        .amortization-schedule,
        .growth-timeline {
          margin-top: 24px;
        }

        .amortization-schedule h4,
        .growth-timeline h4 {
          color: #2c3e50;
          margin-bottom: 16px;
        }

        .schedule-table,
        .timeline-table {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        th, td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e9ecef;
        }

        th {
          background: #f8f9fa;
          font-weight: 600;
          color: #495057;
        }

        tr:hover {
          background: #f8f9fa;
        }
      `}</style>
    </div>
  );
};

export default FinancialCalculator;