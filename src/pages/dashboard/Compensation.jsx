// src/pages/dashboard/Compensation.jsx
import React, { useState, useEffect } from 'react';
import useAuthStore from '../../stores/authStore';

const Compensation = () => {
  const { 
    // HR Dashboard methods
    getHRCompensation,
    performHREmployeeAction,
    hrDashboard,
    isLoading,
    error,
    hasHRDashboardAccess,
    clearHRCache,
    members,
    getMembersData
  } = useAuthStore();

  const [activeTab, setActiveTab] = useState('overview');
  const [localLoading, setLocalLoading] = useState(true);
  const [compensationData, setCompensationData] = useState({
    salaries: [],
    benefits: [],
    bonuses: [],
    payroll: [],
    structures: [],
    analytics: {}
  });
  const [actionLoading, setActionLoading] = useState(false);

  // Load compensation data from HR dashboard
  const loadCompensationData = async () => {
    if (!hasHRDashboardAccess) {
      console.warn('User does not have HR dashboard access');
      setLocalLoading(false);
      return;
    }

    setLocalLoading(true);
    try {
      // Load members data
      await getMembersData();
      
      // Load HR compensation data
      const result = await getHRCompensation();
      
      if (result.success && result.data) {
        // Map the API data to component state
        const compensationData = result.data;
        
        // Set compensation data based on API response structure
        if (compensationData.salaries) {
          setCompensationData(prev => ({
            ...prev,
            salaries: compensationData.salaries
          }));
        }
        
        if (compensationData.benefits) {
          setCompensationData(prev => ({
            ...prev,
            benefits: compensationData.benefits
          }));
        }
        
        if (compensationData.bonuses) {
          setCompensationData(prev => ({
            ...prev,
            bonuses: compensationData.bonuses
          }));
        }
        
        if (compensationData.payroll) {
          setCompensationData(prev => ({
            ...prev,
            payroll: compensationData.payroll
          }));
        }
        
        if (compensationData.structures) {
          setCompensationData(prev => ({
            ...prev,
            structures: compensationData.structures
          }));
        }
        
        if (compensationData.analytics) {
          setCompensationData(prev => ({
            ...prev,
            analytics: compensationData.analytics
          }));
        }
      } else {
        // Fallback to mock data if API fails
        console.warn('Using fallback compensation data');
        loadFallbackData();
      }
    } catch (error) {
      console.error('Error loading compensation data:', error);
      loadFallbackData();
    } finally {
      setLocalLoading(false);
    }
  };

  // Fallback mock data
  const loadFallbackData = () => {
    const mockSalaries = [
      {
        id: 1,
        employeeId: 101,
        employeeName: 'John Smith',
        position: 'Senior Developer',
        department: 'Engineering',
        baseSalary: 120000,
        currency: 'USD',
        payFrequency: 'Monthly',
        lastReview: '2024-01-15',
        nextReview: '2024-07-15',
        status: 'active'
      },
      {
        id: 2,
        employeeId: 102,
        employeeName: 'Emily Davis',
        position: 'Product Manager',
        department: 'Product',
        baseSalary: 130000,
        currency: 'USD',
        payFrequency: 'Monthly',
        lastReview: '2024-02-01',
        nextReview: '2024-08-01',
        status: 'active'
      },
      {
        id: 3,
        employeeId: 103,
        employeeName: 'Mike Chen',
        position: 'UX Designer',
        department: 'Design',
        baseSalary: 95000,
        currency: 'USD',
        payFrequency: 'Monthly',
        lastReview: '2023-12-10',
        nextReview: '2024-06-10',
        status: 'active'
      }
    ];

    const mockBenefits = [
      {
        id: 1,
        name: 'Health Insurance',
        provider: 'Blue Cross',
        coverage: 'Family',
        employeeCost: 200,
        employerCost: 800,
        status: 'active'
      },
      {
        id: 2,
        name: 'Dental Insurance',
        provider: 'Delta Dental',
        coverage: 'Individual',
        employeeCost: 50,
        employerCost: 150,
        status: 'active'
      },
      {
        id: 3,
        name: '401(k) Plan',
        provider: 'Fidelity',
        matchPercentage: 4,
        vestingPeriod: '3 years',
        status: 'active'
      }
    ];

    const mockBonuses = [
      {
        id: 1,
        employeeId: 101,
        employeeName: 'John Smith',
        type: 'Performance Bonus',
        amount: 15000,
        period: 'Q4 2023',
        status: 'paid',
        paymentDate: '2024-01-15'
      },
      {
        id: 2,
        employeeId: 102,
        employeeName: 'Emily Davis',
        type: 'Annual Bonus',
        amount: 20000,
        period: '2023',
        status: 'approved',
        paymentDate: '2024-02-28'
      }
    ];

    const mockPayroll = [
      {
        id: 1,
        period: '2024-02',
        totalEmployees: 45,
        totalPayroll: 450000,
        status: 'processed',
        processedDate: '2024-02-28'
      },
      {
        id: 2,
        period: '2024-01',
        totalEmployees: 44,
        totalPayroll: 435000,
        status: 'processed',
        processedDate: '2024-01-31'
      }
    ];

    const mockStructures = [
      {
        id: 1,
        level: 'L1',
        title: 'Junior Developer',
        minSalary: 70000,
        maxSalary: 90000,
        targetSalary: 80000
      },
      {
        id: 2,
        level: 'L2',
        title: 'Developer',
        minSalary: 90000,
        maxSalary: 110000,
        targetSalary: 100000
      },
      {
        id: 3,
        level: 'L3',
        title: 'Senior Developer',
        minSalary: 110000,
        maxSalary: 140000,
        targetSalary: 125000
      }
    ];

    const mockAnalytics = {
      totalPayroll: 450000,
      averageSalary: 100000,
      salaryIncreaseRate: 4.2,
      benefitsCost: 120000,
      bonusPool: 75000
    };

    setCompensationData({
      salaries: mockSalaries,
      benefits: mockBenefits,
      bonuses: mockBonuses,
      payroll: mockPayroll,
      structures: mockStructures,
      analytics: mockAnalytics
    });
  };

  // Handle compensation actions
  const handleCompensationAction = async (actionType, data) => {
    setActionLoading(true);
    try {
      const result = await performHREmployeeAction({
        action_type: actionType,
        ...data
      });

      if (result.success) {
        // Refresh compensation data after successful action
        await loadCompensationData();
        return { success: true, message: result.message };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Compensation action error:', error);
      return { success: false, error: error.message };
    } finally {
      setActionLoading(false);
    }
  };

  // Update salary
  const handleUpdateSalary = async (employeeId, salaryData) => {
    return await handleCompensationAction('update_salary', {
      employee_id: employeeId,
      ...salaryData
    });
  };

  // Process bonus
  const handleProcessBonus = async (bonusData) => {
    return await handleCompensationAction('process_bonus', bonusData);
  };

  // Update benefit plan
  const handleUpdateBenefit = async (benefitId, benefitData) => {
    return await handleCompensationAction('update_benefit', {
      benefit_id: benefitId,
      ...benefitData
    });
  };

  // Run payroll
  const handleRunPayroll = async (payrollData) => {
    return await handleCompensationAction('run_payroll', payrollData);
  };

  // Refresh data when tab changes or component mounts
  useEffect(() => {
    loadCompensationData();
  }, [activeTab]);

  const getStatusColor = (status) => {
    const colors = {
      'active': 'bg-green-100 text-green-800',
      'inactive': 'bg-gray-100 text-gray-800',
      'paid': 'bg-green-100 text-green-800',
      'approved': 'bg-blue-100 text-blue-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'processed': 'bg-green-100 text-green-800',
      'processing': 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const calculateCompensationStats = () => {
    const totalPayroll = compensationData.salaries.reduce((sum, salary) => sum + salary.baseSalary, 0) / 12;
    const averageSalary = compensationData.salaries.length > 0 
      ? Math.round(compensationData.salaries.reduce((sum, salary) => sum + salary.baseSalary, 0) / compensationData.salaries.length)
      : 0;
    const benefitsCost = compensationData.benefits.reduce((sum, benefit) => sum + benefit.employerCost, 0) * 12;
    const bonusPool = compensationData.bonuses.filter(bonus => bonus.status === 'approved' || bonus.status === 'paid')
      .reduce((sum, bonus) => sum + bonus.amount, 0);

    return {
      totalPayroll,
      averageSalary,
      salaryIncreaseRate: 4.2, // This would typically come from analytics
      benefitsCost,
      bonusPool
    };
  };

  // Show loading state
  if (localLoading || isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compensation Management</h1>
          <p className="text-gray-600">Manage salaries, benefits, and compensation packages</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading compensation data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && compensationData.salaries.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compensation Management</h1>
          <p className="text-gray-600">Manage salaries, benefits, and compensation packages</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">Error Loading Data</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={loadCompensationData}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const stats = compensationData.analytics.totalPayroll ? compensationData.analytics : calculateCompensationStats();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compensation Management</h1>
          <p className="text-gray-600">Manage salaries, benefits, and compensation packages</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => loadCompensationData()}
            disabled={actionLoading}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
          >
            Refresh Data
          </button>
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
            Run Payroll
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Payroll</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatCurrency(stats.totalPayroll).replace('.00', '')}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">💰</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Salary</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatCurrency(stats.averageSalary).replace('.00', '')}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">📊</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Salary Increase</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.salaryIncreaseRate}%</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">📈</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Benefits Cost</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatCurrency(stats.benefitsCost / 12).replace('.00', '')}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">🏥</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Bonus Pool</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatCurrency(stats.bonusPool).replace('.00', '')}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">🎯</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {['overview', 'salaries', 'benefits', 'bonuses', 'payroll', 'structures'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Salary Distribution */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Salary Distribution</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {compensationData.structures.slice(0, 4).map((structure) => (
                    <div key={structure.id} className="border border-gray-200 rounded-lg p-4 text-center">
                      <h4 className="font-semibold text-gray-900">{structure.title}</h4>
                      <p className="text-2xl font-bold text-blue-600 mt-2">
                        {formatCurrency(structure.targetSalary).replace('.00', '')}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatCurrency(structure.minSalary).replace('.00', '')} - {formatCurrency(structure.maxSalary).replace('.00', '')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Salary Changes */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Salary Reviews</h3>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Employee
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Position
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Review
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Next Review
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Salary
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {compensationData.salaries.slice(0, 5).map((salary) => (
                        <tr key={salary.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{salary.employeeName}</div>
                            <div className="text-sm text-gray-500">{salary.department}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {salary.position}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(salary.lastReview).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(salary.nextReview).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCurrency(salary.baseSalary).replace('.00', '')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Benefits Summary */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Benefits Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {compensationData.benefits.map((benefit) => (
                    <div key={benefit.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-900">{benefit.name}</h4>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(benefit.status)}`}>
                          {benefit.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{benefit.provider} • {benefit.coverage}</p>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Employee Cost:</span>
                        <span className="text-gray-900">{formatCurrency(benefit.employeeCost)}/mo</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Employer Cost:</span>
                        <span className="text-gray-900">{formatCurrency(benefit.employerCost)}/mo</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'salaries' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Salary Management</h3>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                  Add Salary
                </button>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Position
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Base Salary
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pay Frequency
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Next Review
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {compensationData.salaries.map((salary) => (
                      <tr key={salary.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{salary.employeeName}</div>
                          <div className="text-sm text-gray-500">ID: {salary.employeeId}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {salary.position}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {salary.department}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(salary.baseSalary)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {salary.payFrequency}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(salary.nextReview).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button className="text-blue-600 hover:text-blue-900">Adjust</button>
                            <button className="text-green-600 hover:text-green-900">Review</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'benefits' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Benefits Administration</h3>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                  Add Benefit
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {compensationData.benefits.map((benefit) => (
                  <div key={benefit.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-semibold text-gray-900">{benefit.name}</h4>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(benefit.status)}`}>
                        {benefit.status}
                      </span>
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Provider</p>
                        <p className="text-sm font-medium text-gray-900">{benefit.provider}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Coverage</p>
                        <p className="text-sm font-medium text-gray-900">{benefit.coverage}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Employee Cost</p>
                          <p className="text-sm font-medium text-gray-900">{formatCurrency(benefit.employeeCost)}/mo</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Employer Cost</p>
                          <p className="text-sm font-medium text-gray-900">{formatCurrency(benefit.employerCost)}/mo</p>
                        </div>
                      </div>
                      {benefit.matchPercentage && (
                        <div>
                          <p className="text-sm text-gray-600">401(k) Match</p>
                          <p className="text-sm font-medium text-gray-900">{benefit.matchPercentage}%</p>
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        Edit
                      </button>
                      <button className="text-green-600 hover:text-green-800 text-sm font-medium">
                        Enroll
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'bonuses' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Bonus Management</h3>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                  Award Bonus
                </button>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bonus Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Period
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {compensationData.bonuses.map((bonus) => (
                      <tr key={bonus.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{bonus.employeeName}</div>
                          <div className="text-sm text-gray-500">ID: {bonus.employeeId}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {bonus.type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {bonus.period}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(bonus.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(bonus.status)}`}>
                            {bonus.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {bonus.paymentDate ? new Date(bonus.paymentDate).toLocaleDateString() : 'Pending'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {bonus.status === 'approved' && (
                            <button className="text-green-600 hover:text-green-900">Process</button>
                          )}
                          {bonus.status === 'pending' && (
                            <div className="flex space-x-2">
                              <button className="text-green-600 hover:text-green-900">Approve</button>
                              <button className="text-red-600 hover:text-red-900">Reject</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'payroll' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Payroll History</h3>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                  Run Payroll
                </button>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Period
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employees
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Payroll
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Processed Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {compensationData.payroll.map((payroll) => (
                      <tr key={payroll.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {payroll.period}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {payroll.totalEmployees}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(payroll.totalPayroll)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(payroll.status)}`}>
                            {payroll.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(payroll.processedDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button className="text-blue-600 hover:text-blue-900">View</button>
                            <button className="text-green-600 hover:text-green-900">Export</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'structures' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Salary Structures</h3>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                  Add Structure
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {compensationData.structures.map((structure) => (
                  <div key={structure.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="text-center mb-4">
                      <div className="text-2xl font-bold text-blue-600">{structure.level}</div>
                      <h4 className="font-semibold text-gray-900 mt-1">{structure.title}</h4>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600">Target Salary</p>
                        <p className="text-lg font-bold text-gray-900">
                          {formatCurrency(structure.targetSalary).replace('.00', '')}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Min</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatCurrency(structure.minSalary).replace('.00', '')}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Max</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatCurrency(structure.maxSalary).replace('.00', '')}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        Edit
                      </button>
                      <button className="text-green-600 hover:text-green-800 text-sm font-medium">
                        Apply
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Compensation;