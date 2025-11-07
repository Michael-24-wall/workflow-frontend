// src/pages/dashboard/LeaveManagement.jsx
import React, { useState, useEffect } from 'react';
import useAuthStore from '../../stores/authStore';

const LeaveManagement = () => {
  const { 
    // HR Dashboard methods
    getHRLeave,
    performHREmployeeAction,
    hrDashboard,
    isLoading,
    error,
    hasHRDashboardAccess,
    clearHRCache,
    members,
    getMembersData
  } = useAuthStore();

  const [activeTab, setActiveTab] = useState('requests');
  const [localLoading, setLocalLoading] = useState(true);
  const [leaveData, setLeaveData] = useState({
    requests: [],
    calendar: [],
    balances: [],
    policies: [],
    stats: {}
  });
  const [actionLoading, setActionLoading] = useState(false);

  // Load leave data from HR dashboard
  const loadLeaveData = async () => {
    if (!hasHRDashboardAccess) {
      console.warn('User does not have HR dashboard access');
      setLocalLoading(false);
      return;
    }

    setLocalLoading(true);
    try {
      // Load members data
      await getMembersData();
      
      // Load HR leave data
      const result = await getHRLeave();
      
      if (result.success && result.data) {
        // Map the API data to component state
        const leaveData = result.data;
        
        // Set leave data based on API response structure
        if (leaveData.requests) {
          setLeaveData(prev => ({
            ...prev,
            requests: leaveData.requests
          }));
        }
        
        if (leaveData.calendar) {
          setLeaveData(prev => ({
            ...prev,
            calendar: leaveData.calendar
          }));
        }
        
        if (leaveData.balances) {
          setLeaveData(prev => ({
            ...prev,
            balances: leaveData.balances
          }));
        }
        
        if (leaveData.policies) {
          setLeaveData(prev => ({
            ...prev,
            policies: leaveData.policies
          }));
        }
        
        if (leaveData.stats) {
          setLeaveData(prev => ({
            ...prev,
            stats: leaveData.stats
          }));
        }
      } else {
        // Fallback to mock data if API fails
        console.warn('Using fallback leave data');
        loadFallbackData();
      }
    } catch (error) {
      console.error('Error loading leave data:', error);
      loadFallbackData();
    } finally {
      setLocalLoading(false);
    }
  };

  // Fallback mock data
  const loadFallbackData = () => {
    const mockRequests = [
      {
        id: 1,
        employeeId: 101,
        employeeName: 'John Smith',
        leaveType: 'Vacation',
        startDate: '2024-03-15',
        endDate: '2024-03-22',
        duration: 6,
        status: 'pending',
        reason: 'Family vacation',
        submittedDate: '2024-02-20',
        approver: 'Sarah Johnson'
      },
      {
        id: 2,
        employeeId: 102,
        employeeName: 'Emily Davis',
        leaveType: 'Sick Leave',
        startDate: '2024-03-10',
        endDate: '2024-03-12',
        duration: 3,
        status: 'approved',
        reason: 'Medical appointment',
        submittedDate: '2024-02-18',
        approvedDate: '2024-02-19',
        approver: 'Mike Chen'
      },
      {
        id: 3,
        employeeId: 103,
        employeeName: 'Alex Rodriguez',
        leaveType: 'Personal',
        startDate: '2024-03-05',
        endDate: '2024-03-05',
        duration: 1,
        status: 'pending',
        reason: 'Personal matters',
        submittedDate: '2024-02-25',
        approver: 'Sarah Johnson'
      }
    ];

    const mockCalendar = [
      {
        id: 1,
        employeeId: 102,
        employeeName: 'Emily Davis',
        leaveType: 'Sick Leave',
        startDate: '2024-03-10',
        endDate: '2024-03-12',
        status: 'approved'
      },
      {
        id: 2,
        employeeId: 104,
        employeeName: 'Sarah Wilson',
        leaveType: 'Vacation',
        startDate: '2024-03-18',
        endDate: '2024-03-25',
        status: 'approved'
      }
    ];

    const mockBalances = [
      {
        employeeId: 101,
        employeeName: 'John Smith',
        vacation: 18,
        sick: 12,
        personal: 5,
        totalUsed: 7
      },
      {
        employeeId: 102,
        employeeName: 'Emily Davis',
        vacation: 20,
        sick: 10,
        personal: 3,
        totalUsed: 5
      },
      {
        employeeId: 103,
        employeeName: 'Alex Rodriguez',
        vacation: 15,
        sick: 8,
        personal: 2,
        totalUsed: 12
      }
    ];

    const mockPolicies = [
      {
        id: 1,
        name: 'Vacation Policy',
        description: 'Annual vacation leave entitlement and rules',
        accrualRate: 1.5,
        maxAccrual: 30,
        carryOver: 10
      },
      {
        id: 2,
        name: 'Sick Leave Policy',
        description: 'Sick leave and medical absence guidelines',
        accrualRate: 1.0,
        maxAccrual: 15,
        carryOver: 5
      }
    ];

    const mockStats = {
      pendingRequests: 3,
      approvedThisMonth: 12,
      onLeaveToday: 2,
      averageBalance: 18
    };

    setLeaveData({
      requests: mockRequests,
      calendar: mockCalendar,
      balances: mockBalances,
      policies: mockPolicies,
      stats: mockStats
    });
  };

  // Handle leave actions
  const handleLeaveAction = async (actionType, data) => {
    setActionLoading(true);
    try {
      const result = await performHREmployeeAction({
        action_type: actionType,
        ...data
      });

      if (result.success) {
        // Refresh leave data after successful action
        await loadLeaveData();
        return { success: true, message: result.message };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Leave action error:', error);
      return { success: false, error: error.message };
    } finally {
      setActionLoading(false);
    }
  };

  // Approve leave request
  const handleApproveLeave = async (requestId) => {
    return await handleLeaveAction('approve_leave', {
      request_id: requestId
    });
  };

  // Reject leave request
  const handleRejectLeave = async (requestId, reason) => {
    return await handleLeaveAction('reject_leave', {
      request_id: requestId,
      reason: reason
    });
  };

  // Create leave policy
  const handleCreatePolicy = async (policyData) => {
    return await handleLeaveAction('create_policy', policyData);
  };

  // Update leave balance
  const handleUpdateBalance = async (employeeId, balanceData) => {
    return await handleLeaveAction('update_balance', {
      employee_id: employeeId,
      ...balanceData
    });
  };

  // Refresh data when tab changes or component mounts
  useEffect(() => {
    loadLeaveData();
  }, [activeTab]);

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'cancelled': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getLeaveTypeColor = (type) => {
    const colors = {
      'Vacation': 'bg-blue-100 text-blue-800',
      'Sick Leave': 'bg-green-100 text-green-800',
      'Personal': 'bg-purple-100 text-purple-800',
      'Maternity': 'bg-pink-100 text-pink-800',
      'Paternity': 'bg-teal-100 text-teal-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const calculateLeaveStats = () => {
    const pendingRequests = leaveData.requests.filter(req => req.status === 'pending').length;
    const approvedThisMonth = leaveData.requests.filter(req => 
      req.status === 'approved' && 
      new Date(req.approvedDate).getMonth() === new Date().getMonth()
    ).length;
    const onLeaveToday = leaveData.calendar.filter(leave => {
      const today = new Date();
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      return today >= start && today <= end;
    }).length;
    const averageBalance = leaveData.balances.length > 0 
      ? Math.round(leaveData.balances.reduce((sum, balance) => sum + balance.vacation, 0) / leaveData.balances.length)
      : 0;

    return {
      pendingRequests,
      approvedThisMonth,
      onLeaveToday,
      averageBalance
    };
  };

  // Show loading state
  if (localLoading || isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
          <p className="text-gray-600">Manage employee time off and leave balances</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading leave data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && leaveData.requests.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
          <p className="text-gray-600">Manage employee time off and leave balances</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">Error Loading Data</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={loadLeaveData}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const stats = leaveData.stats.pendingRequests ? leaveData.stats : calculateLeaveStats();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
          <p className="text-gray-600">Manage employee time off and leave balances</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => loadLeaveData()}
            disabled={actionLoading}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Requests</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pendingRequests}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⏳</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved This Month</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.approvedThisMonth}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">On Leave Today</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.onLeaveToday}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🏖️</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Leave Balance Avg</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.averageBalance}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {['requests', 'calendar', 'balances', 'policies'].map((tab) => (
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
          {activeTab === 'requests' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Leave Requests</h3>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                  New Request
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
                        Leave Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dates
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {leaveData.requests.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{request.employeeName}</div>
                          <div className="text-sm text-gray-500">ID: {request.employeeId}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getLeaveTypeColor(request.leaveType)}`}>
                            {request.leaveType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {request.duration} days
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(request.status)}`}>
                            {request.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {request.status === 'pending' && (
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => handleApproveLeave(request.id)}
                                className="text-green-600 hover:text-green-900"
                              >
                                Approve
                              </button>
                              <button 
                                onClick={() => handleRejectLeave(request.id, 'Not approved')}
                                className="text-red-600 hover:text-red-900"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                          {request.status !== 'pending' && (
                            <span className="text-gray-500">No actions</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Leave Calendar</h3>
              
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="grid grid-cols-7 gap-4 mb-6">
                  {/* Calendar header */}
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center font-medium text-gray-500 text-sm">
                      {day}
                    </div>
                  ))}
                  
                  {/* Calendar days - simplified version */}
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
                    const dayLeaves = leaveData.calendar.filter(leave => {
                      const leaveStart = new Date(leave.startDate).getDate();
                      const leaveEnd = new Date(leave.endDate).getDate();
                      return day >= leaveStart && day <= leaveEnd;
                    });
                    
                    return (
                      <div key={day} className="border border-gray-200 rounded-lg p-2 min-h-20">
                        <div className="text-sm font-medium text-gray-900 mb-1">{day}</div>
                        {dayLeaves.map(leave => (
                          <div key={leave.id} className="text-xs bg-blue-100 text-blue-800 rounded px-1 mb-1 truncate">
                            {leave.employeeName}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-3">Employees on Leave</h4>
                  <div className="space-y-2">
                    {leaveData.calendar.map(leave => (
                      <div key={leave.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div>
                          <span className="font-medium text-gray-900">{leave.employeeName}</span>
                          <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${getLeaveTypeColor(leave.leaveType)}`}>
                            {leave.leaveType}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'balances' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Leave Balances</h3>
              
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vacation
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sick Leave
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Personal
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Used
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {leaveData.balances.map((balance) => (
                      <tr key={balance.employeeId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{balance.employeeName}</div>
                          <div className="text-sm text-gray-500">ID: {balance.employeeId}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{balance.vacation} days</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{balance.sick} days</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{balance.personal} days</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{balance.totalUsed} days</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-blue-600 hover:text-blue-900">Adjust</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'policies' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Leave Policies</h3>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                  Create Policy
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {leaveData.policies.map((policy) => (
                  <div key={policy.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <h4 className="font-semibold text-gray-900 mb-2">{policy.name}</h4>
                    <p className="text-sm text-gray-600 mb-4">{policy.description}</p>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Accrual Rate:</span>
                        <span className="text-gray-900">{policy.accrualRate} days/month</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Max Accrual:</span>
                        <span className="text-gray-900">{policy.maxAccrual} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Carry Over:</span>
                        <span className="text-gray-900">{policy.carryOver} days</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        Edit
                      </button>
                      <button className="text-red-600 hover:text-red-800 text-sm font-medium">
                        Delete
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

export default LeaveManagement;