// src/pages/dashboard/Analytics.jsx
import React, { useState, useEffect } from 'react';
import useAuthStore from '../../stores/authStore';

const Analytics = () => {
  const { 
    // HR Dashboard methods
    getHRAnalytics,
    generateHRReport,
    hrDashboard,
    isLoading,
    error,
    hasHRDashboardAccess,
    clearHRCache,
    members,
    getMembersData,
    statistics,
    getStatisticsData
  } = useAuthStore();

  const [activeTab, setActiveTab] = useState('overview');
  const [localLoading, setLocalLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState({
    overview: {},
    workforce: {},
    turnover: {},
    recruitment: {},
    performance: {},
    compensation: {}
  });
  const [reportLoading, setReportLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('30d'); // 30d, 90d, 1y

  // Load analytics data from HR dashboard
  const loadAnalyticsData = async () => {
    if (!hasHRDashboardAccess) {
      console.warn('User does not have HR dashboard access');
      setLocalLoading(false);
      return;
    }

    setLocalLoading(true);
    try {
      // Load members and statistics data
      await getMembersData();
      await getStatisticsData();
      
      // Load HR analytics data
      const result = await getHRAnalytics();
      
      if (result.success && result.data) {
        // Map the API data to component state
        const analyticsData = result.data;
        setAnalyticsData(analyticsData);
      } else {
        // Fallback to mock data if API fails
        console.warn('Using fallback analytics data');
        loadFallbackData();
      }
    } catch (error) {
      console.error('Error loading analytics data:', error);
      loadFallbackData();
    } finally {
      setLocalLoading(false);
    }
  };

  // Generate HR report
  const handleGenerateReport = async (reportType) => {
    setReportLoading(true);
    try {
      const result = await generateHRReport({
        report_type: reportType,
        time_range: timeRange,
        format: 'pdf'
      });

      if (result.success) {
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Report generation error:', error);
      return { success: false, error: error.message };
    } finally {
      setReportLoading(false);
    }
  };

  // Fallback mock data
  const loadFallbackData = () => {
    const mockOverview = {
      totalEmployees: 45,
      headcountGrowth: 12.5,
      turnoverRate: 8.2,
      engagementScore: 78,
      diversityIndex: 64,
      avgTenure: 2.8
    };

    const mockWorkforce = {
      byDepartment: [
        { department: 'Engineering', count: 18, growth: 15.4 },
        { department: 'Product', count: 8, growth: 14.3 },
        { department: 'Design', count: 6, growth: 20.0 },
        { department: 'Marketing', count: 7, growth: 16.7 },
        { department: 'Sales', count: 6, growth: 9.1 }
      ],
      byLocation: [
        { location: 'San Francisco', count: 22 },
        { location: 'New York', count: 12 },
        { location: 'Remote', count: 11 }
      ],
      byGender: [
        { gender: 'Male', count: 26, percentage: 57.8 },
        { gender: 'Female', count: 17, percentage: 37.8 },
        { gender: 'Other', count: 2, percentage: 4.4 }
      ],
      byAge: [
        { range: '20-29', count: 18, percentage: 40.0 },
        { range: '30-39', count: 20, percentage: 44.4 },
        { range: '40-49', count: 6, percentage: 13.3 },
        { range: '50+', count: 1, percentage: 2.2 }
      ]
    };

    const mockTurnover = {
      voluntary: 6.1,
      involuntary: 2.1,
      total: 8.2,
      topReasons: [
        { reason: 'Career Growth', percentage: 35 },
        { reason: 'Compensation', percentage: 28 },
        { reason: 'Work-life Balance', percentage: 18 },
        { reason: 'Management', percentage: 12 },
        { reason: 'Other', percentage: 7 }
      ],
      byDepartment: [
        { department: 'Engineering', rate: 5.6 },
        { department: 'Product', rate: 7.1 },
        { department: 'Sales', rate: 12.5 },
        { department: 'Marketing', rate: 8.3 }
      ],
      trend: [9.2, 8.7, 7.9, 8.2, 7.5, 8.2] // Last 6 months
    };

    const mockRecruitment = {
      timeToFill: 24, // days
      costPerHire: 8500,
      offerAcceptance: 78,
      sourceQuality: [
        { source: 'LinkedIn', applicants: 45, hires: 8, rate: 17.8 },
        { source: 'Referrals', applicants: 22, hires: 6, rate: 27.3 },
        { source: 'Company Website', applicants: 38, hires: 5, rate: 13.2 },
        { source: 'Job Boards', applicants: 67, hires: 4, rate: 6.0 }
      ]
    };

    const mockPerformance = {
      ratingDistribution: [
        { rating: '5 - Excellent', count: 8, percentage: 17.8 },
        { rating: '4 - Exceeds', count: 15, percentage: 33.3 },
        { rating: '3 - Meets', count: 18, percentage: 40.0 },
        { rating: '2 - Below', count: 3, percentage: 6.7 },
        { rating: '1 - Poor', count: 1, percentage: 2.2 }
      ],
      byDepartment: [
        { department: 'Engineering', avgRating: 4.2 },
        { department: 'Product', avgRating: 4.4 },
        { department: 'Design', avgRating: 4.1 },
        { department: 'Marketing', avgRating: 3.9 },
        { department: 'Sales', avgRating: 4.0 }
      ]
    };

    const mockCompensation = {
      avgSalary: 98500,
      salaryRange: {
        min: 65000,
        max: 185000,
        median: 95000
      },
      byDepartment: [
        { department: 'Engineering', avgSalary: 125000 },
        { department: 'Product', avgSalary: 115000 },
        { department: 'Design', avgSalary: 95000 },
        { department: 'Marketing', avgSalary: 85000 },
        { department: 'Sales', avgSalary: 89000 }
      ],
      equityDistribution: [
        { range: '0-0.01%', count: 32 },
        { range: '0.01-0.05%', count: 8 },
        { range: '0.05-0.1%', count: 3 },
        { range: '0.1%+', count: 2 }
      ]
    };

    setAnalyticsData({
      overview: mockOverview,
      workforce: mockWorkforce,
      turnover: mockTurnover,
      recruitment: mockRecruitment,
      performance: mockPerformance,
      compensation: mockCompensation
    });
  };

  // Refresh data when tab changes or component mounts
  useEffect(() => {
    loadAnalyticsData();
  }, [activeTab, timeRange]);

  const getTrendColor = (value, isPositive = true) => {
    if (isPositive) {
      return value >= 0 ? 'text-green-600' : 'text-red-600';
    }
    return value <= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getTrendIcon = (value, isPositive = true) => {
    if (isPositive) {
      return value >= 0 ? '↗' : '↘';
    }
    return value <= 0 ? '↗' : '↘';
  };

  const formatPercentage = (value) => {
    return `${value}%`;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Show loading state
  if (localLoading || isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">HR Analytics</h1>
          <p className="text-gray-600">Comprehensive HR metrics and reporting</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && !analyticsData.overview.totalEmployees) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">HR Analytics</h1>
          <p className="text-gray-600">Comprehensive HR metrics and reporting</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">Error Loading Data</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={loadAnalyticsData}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">HR Analytics</h1>
          <p className="text-gray-600">Comprehensive HR metrics and reporting</p>
        </div>
        <div className="flex space-x-3">
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>
          <button 
            onClick={() => loadAnalyticsData()}
            disabled={reportLoading}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
          >
            Refresh Data
          </button>
          <button 
            onClick={() => handleGenerateReport('comprehensive')}
            disabled={reportLoading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
          >
            {reportLoading ? 'Generating...' : 'Export Report'}
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm font-medium text-gray-600">Total Employees</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{analyticsData.overview.totalEmployees}</p>
          <div className={`text-xs mt-1 ${getTrendColor(analyticsData.overview.headcountGrowth)}`}>
            {getTrendIcon(analyticsData.overview.headcountGrowth)} {analyticsData.overview.headcountGrowth}%
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm font-medium text-gray-600">Turnover Rate</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{analyticsData.overview.turnoverRate}%</p>
          <div className={`text-xs mt-1 ${getTrendColor(analyticsData.overview.turnoverRate, false)}`}>
            {getTrendIcon(analyticsData.overview.turnoverRate, false)} YoY
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm font-medium text-gray-600">Engagement</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{analyticsData.overview.engagementScore}%</p>
          <div className={`text-xs mt-1 ${getTrendColor(analyticsData.overview.engagementScore - 75)}`}>
            {getTrendIcon(analyticsData.overview.engagementScore - 75)} vs target
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm font-medium text-gray-600">Diversity Index</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{analyticsData.overview.diversityIndex}</p>
          <div className="text-xs text-gray-500 mt-1">Industry avg: 58</div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm font-medium text-gray-600">Avg Tenure</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{analyticsData.overview.avgTenure}y</p>
          <div className="text-xs text-gray-500 mt-1">+0.3y from last year</div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm font-medium text-gray-600">Open Roles</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">8</p>
          <div className="text-xs text-gray-500 mt-1">12% of workforce</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {['overview', 'workforce', 'turnover', 'recruitment', 'performance', 'compensation'].map((tab) => (
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Department Distribution */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Distribution</h3>
                  <div className="space-y-3">
                    {analyticsData.workforce.byDepartment?.map((dept) => (
                      <div key={dept.department} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{dept.department}</span>
                        <div className="flex items-center space-x-3">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ 
                                width: `${(dept.count / analyticsData.overview.totalEmployees) * 100}%` 
                              }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900 w-8">{dept.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Key HR Metrics</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Time to Fill</span>
                      <span className="text-sm font-medium text-gray-900">
                        {analyticsData.recruitment.timeToFill} days
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Cost per Hire</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(analyticsData.recruitment.costPerHire)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Offer Acceptance Rate</span>
                      <span className="text-sm font-medium text-gray-900">
                        {analyticsData.recruitment.offerAcceptance}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Avg Performance Rating</span>
                      <span className="text-sm font-medium text-gray-900">
                        {analyticsData.performance.byDepartment?.[0]?.avgRating || 4.1}/5
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Turnover Reasons */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Turnover Reasons</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {analyticsData.turnover.topReasons?.map((reason, index) => (
                    <div key={index} className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{reason.percentage}%</div>
                      <div className="text-sm text-gray-600 mt-1">{reason.reason}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'workforce' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gender Distribution */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Gender Distribution</h3>
                  <div className="space-y-3">
                    {analyticsData.workforce.byGender?.map((gender) => (
                      <div key={gender.gender} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{gender.gender}</span>
                        <div className="flex items-center space-x-3">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${gender.percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900 w-12">
                            {gender.percentage}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Age Distribution */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Age Distribution</h3>
                  <div className="space-y-3">
                    {analyticsData.workforce.byAge?.map((age) => (
                      <div key={age.range} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{age.range}</span>
                        <div className="flex items-center space-x-3">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-purple-600 h-2 rounded-full"
                              style={{ width: `${age.percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900 w-12">
                            {age.percentage}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Location Distribution */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Distribution</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {analyticsData.workforce.byLocation?.map((location) => (
                    <div key={location.location} className="text-center p-4 border border-gray-200 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">{location.count}</div>
                      <div className="text-sm text-gray-600 mt-1">{location.location}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'turnover' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border border-gray-200 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {analyticsData.turnover.voluntary}%
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Voluntary Turnover</div>
                </div>
                <div className="border border-gray-200 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-orange-600">
                    {analyticsData.turnover.involuntary}%
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Involuntary Turnover</div>
                </div>
                <div className="border border-gray-200 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-red-600">
                    {analyticsData.turnover.total}%
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Total Turnover</div>
                </div>
              </div>

              {/* Turnover by Department */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Turnover by Department</h3>
                <div className="space-y-4">
                  {analyticsData.turnover.byDepartment?.map((dept) => (
                    <div key={dept.department} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{dept.department}</span>
                      <div className="flex items-center space-x-3">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-red-600 h-2 rounded-full"
                            style={{ width: `${dept.rate * 10}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-12">
                          {dept.rate}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'recruitment' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border border-gray-200 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {analyticsData.recruitment.timeToFill}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Days to Fill</div>
                </div>
                <div className="border border-gray-200 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {formatCurrency(analyticsData.recruitment.costPerHire)}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Cost per Hire</div>
                </div>
                <div className="border border-gray-200 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {analyticsData.recruitment.offerAcceptance}%
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Offer Acceptance</div>
                </div>
              </div>

              {/* Source Quality */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recruitment Source Quality</h3>
                <div className="space-y-4">
                  {analyticsData.recruitment.sourceQuality?.map((source) => (
                    <div key={source.source} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{source.source}</span>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-500">{source.applicants} applicants</span>
                        <span className="text-sm text-gray-500">{source.hires} hires</span>
                        <span className="text-sm font-medium text-gray-900">{source.rate}% rate</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="space-y-6">
              {/* Rating Distribution */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Rating Distribution</h3>
                <div className="space-y-3">
                  {analyticsData.performance.ratingDistribution?.map((rating) => (
                    <div key={rating.rating} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{rating.rating}</span>
                      <div className="flex items-center space-x-3">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${rating.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-12">
                          {rating.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance by Department */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Average Rating by Department</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {analyticsData.performance.byDepartment?.map((dept) => (
                    <div key={dept.department} className="text-center p-4 border border-gray-200 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{dept.avgRating}/5</div>
                      <div className="text-sm text-gray-600 mt-1">{dept.department}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'compensation' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border border-gray-200 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {formatCurrency(analyticsData.compensation.avgSalary)}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Average Salary</div>
                </div>
                <div className="border border-gray-200 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {formatCurrency(analyticsData.compensation.salaryRange?.median)}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Median Salary</div>
                </div>
                <div className="border border-gray-200 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {formatCurrency(analyticsData.compensation.salaryRange?.max)}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Maximum Salary</div>
                </div>
              </div>

              {/* Salary by Department */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Average Salary by Department</h3>
                <div className="space-y-4">
                  {analyticsData.compensation.byDepartment?.map((dept) => (
                    <div key={dept.department} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{dept.department}</span>
                      <div className="flex items-center space-x-3">
                        <div className="w-48 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ 
                              width: `${(dept.avgSalary / analyticsData.compensation.salaryRange?.max) * 100}%` 
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(dept.avgSalary)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;