// src/pages/dashboard/Performance.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';

const Performance = () => {
  const { 
    // HR Dashboard methods
    getHRPerformance,
    performHREmployeeAction,
    hrDashboard,
    isLoading,
    error,
    hasHRDashboardAccess,
    clearHRCache,
    members,
    getMembersData
  } = useAuthStore();

  const [activeTab, setActiveTab] = useState('reviews');
  const [localLoading, setLocalLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState({
    reviews: [],
    goals: [],
    feedback: [],
    metrics: {},
    upcomingReviews: [],
    completedReviews: []
  });
  const [actionLoading, setActionLoading] = useState(false);

  // Load performance data from HR dashboard
  const loadPerformanceData = async () => {
    if (!hasHRDashboardAccess) {
      console.warn('User does not have HR dashboard access');
      setLocalLoading(false);
      return;
    }

    setLocalLoading(true);
    try {
      // Load members data
      await getMembersData();
      
      // Load HR performance data
      const result = await getHRPerformance();
      
      if (result.success && result.data) {
        // Map the API data to component state
        const performanceData = result.data;
        
        // Set performance data based on API response structure
        if (performanceData.reviews) {
          setPerformanceData(prev => ({
            ...prev,
            reviews: performanceData.reviews,
            upcomingReviews: performanceData.reviews.filter(review => 
              new Date(review.dueDate) > new Date() && review.status !== 'completed'
            ),
            completedReviews: performanceData.reviews.filter(review => 
              review.status === 'completed'
            )
          }));
        }
        
        if (performanceData.goals) {
          setPerformanceData(prev => ({
            ...prev,
            goals: performanceData.goals
          }));
        }
        
        if (performanceData.feedback) {
          setPerformanceData(prev => ({
            ...prev,
            feedback: performanceData.feedback
          }));
        }
        
        if (performanceData.metrics) {
          setPerformanceData(prev => ({
            ...prev,
            metrics: performanceData.metrics
          }));
        }
      } else {
        // Fallback to mock data if API fails
        console.warn('Using fallback performance data');
        loadFallbackData();
      }
    } catch (error) {
      console.error('Error loading performance data:', error);
      loadFallbackData();
    } finally {
      setLocalLoading(false);
    }
  };

  // Fallback mock data
  const loadFallbackData = () => {
    const mockReviews = [
      {
        id: 1,
        employeeId: 101,
        employeeName: 'John Smith',
        reviewType: 'Quarterly',
        dueDate: '2024-03-15',
        status: 'upcoming',
        reviewer: 'Sarah Johnson',
        rating: null,
        strengths: [],
        areasForImprovement: []
      },
      {
        id: 2,
        employeeId: 102,
        employeeName: 'Emily Davis',
        reviewType: 'Annual',
        dueDate: '2024-02-28',
        status: 'completed',
        reviewer: 'Mike Chen',
        rating: 4.5,
        strengths: ['Leadership', 'Communication'],
        areasForImprovement: ['Time Management'],
        completedDate: '2024-02-25'
      },
      {
        id: 3,
        employeeId: 103,
        employeeName: 'Alex Rodriguez',
        reviewType: 'Quarterly',
        dueDate: '2024-03-20',
        status: 'in-progress',
        reviewer: 'Sarah Johnson',
        rating: null,
        strengths: [],
        areasForImprovement: []
      }
    ];

    const mockGoals = [
      {
        id: 1,
        employeeId: 101,
        employeeName: 'John Smith',
        title: 'Complete Advanced React Course',
        description: 'Finish the advanced React development course with certification',
        dueDate: '2024-04-30',
        status: 'in-progress',
        progress: 65,
        category: 'Skill Development'
      },
      {
        id: 2,
        employeeId: 102,
        employeeName: 'Emily Davis',
        title: 'Lead Project Alpha',
        description: 'Successfully lead the Project Alpha team to completion',
        dueDate: '2024-03-31',
        status: 'on-track',
        progress: 80,
        category: 'Project Management'
      }
    ];

    const mockFeedback = [
      {
        id: 1,
        employeeId: 101,
        employeeName: 'John Smith',
        feedbackType: 'Peer Review',
        provider: 'Mike Chen',
        rating: 4.2,
        comments: 'Great team player and always willing to help colleagues.',
        date: '2024-02-20',
        category: 'Teamwork'
      },
      {
        id: 2,
        employeeId: 102,
        employeeName: 'Emily Davis',
        feedbackType: 'Manager Review',
        provider: 'Sarah Johnson',
        rating: 4.8,
        comments: 'Exceptional leadership skills and project management.',
        date: '2024-02-18',
        category: 'Leadership'
      }
    ];

    const mockMetrics = {
      averageRating: 4.2,
      completedReviews: 12,
      upcomingReviews: 5,
      goalsCompletionRate: 75,
      feedbackCount: 24
    };

    setPerformanceData({
      reviews: mockReviews,
      goals: mockGoals,
      feedback: mockFeedback,
      metrics: mockMetrics,
      upcomingReviews: mockReviews.filter(review => review.status === 'upcoming'),
      completedReviews: mockReviews.filter(review => review.status === 'completed')
    });
  };

  // Handle performance actions
  const handlePerformanceAction = async (actionType, data) => {
    setActionLoading(true);
    try {
      const result = await performHREmployeeAction({
        action_type: actionType,
        ...data
      });

      if (result.success) {
        // Refresh performance data after successful action
        await loadPerformanceData();
        return { success: true, message: result.message };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Performance action error:', error);
      return { success: false, error: error.message };
    } finally {
      setActionLoading(false);
    }
  };

  // Schedule performance review
  const handleScheduleReview = async (reviewData) => {
    return await handlePerformanceAction('schedule_review', reviewData);
  };

  // Update goal progress
  const handleUpdateGoalProgress = async (goalId, progress) => {
    return await handlePerformanceAction('update_goal_progress', {
      goal_id: goalId,
      progress: progress
    });
  };

  // Submit feedback
  const handleSubmitFeedback = async (feedbackData) => {
    return await handlePerformanceAction('submit_feedback', feedbackData);
  };

  // Complete performance review
  const handleCompleteReview = async (reviewId, reviewData) => {
    return await handlePerformanceAction('complete_review', {
      review_id: reviewId,
      ...reviewData
    });
  };

  // Refresh data when tab changes or component mounts
  useEffect(() => {
    loadPerformanceData();
  }, [activeTab]);

  const getStatusColor = (status) => {
    const colors = {
      'upcoming': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'in-progress': 'bg-yellow-100 text-yellow-800',
      'on-track': 'bg-green-100 text-green-800',
      'at-risk': 'bg-red-100 text-red-800',
      'behind': 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 4.0) return 'text-blue-600';
    if (rating >= 3.0) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressColor = (progress) => {
    if (progress >= 90) return 'bg-green-600';
    if (progress >= 70) return 'bg-blue-600';
    if (progress >= 50) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  // Calculate average rating from completed reviews
  const calculateAverageRating = () => {
    const completedReviews = performanceData.reviews.filter(review => review.rating);
    if (completedReviews.length === 0) return 0;
    
    const totalRating = completedReviews.reduce((sum, review) => sum + review.rating, 0);
    return (totalRating / completedReviews.length).toFixed(1);
  };

  // Calculate goals completion rate
  const calculateGoalsCompletionRate = () => {
    const completedGoals = performanceData.goals.filter(goal => goal.progress === 100);
    return performanceData.goals.length > 0 
      ? Math.round((completedGoals.length / performanceData.goals.length) * 100)
      : 0;
  };

  // Show loading state
  if (localLoading || isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Management</h1>
          <p className="text-gray-600">Track and manage employee performance</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading performance data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && performanceData.reviews.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Management</h1>
          <p className="text-gray-600">Track and manage employee performance</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">Error Loading Data</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={loadPerformanceData}
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
          <h1 className="text-2xl font-bold text-gray-900">Performance Management</h1>
          <p className="text-gray-600">Track and manage employee performance</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => loadPerformanceData()}
            disabled={actionLoading}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
          >
            Refresh Data
          </button>
          <Link
            to="/dashboard/hr/performance/new"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Schedule Review
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {['reviews', 'goals', 'feedback', 'metrics'].map((tab) => (
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
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Upcoming Reviews</p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        {performanceData.metrics.upcomingReviews || performanceData.upcomingReviews.length}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-xl">📅</span>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">Completed This Quarter</p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        {performanceData.metrics.completedReviews || performanceData.completedReviews.length}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-xl">✅</span>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">Average Rating</p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        {performanceData.metrics.averageRating || calculateAverageRating()}/5
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <span className="text-xl">⭐</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upcoming Reviews */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Performance Reviews</h3>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Employee
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Review Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Due Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Reviewer
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
                      {performanceData.upcomingReviews.map((review) => (
                        <tr key={review.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{review.employeeName}</div>
                            <div className="text-sm text-gray-500">ID: {review.employeeId}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {review.reviewType}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(review.dueDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {review.reviewer}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(review.status)}`}>
                              {review.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button className="text-blue-600 hover:text-blue-900">Start</button>
                              <button className="text-gray-600 hover:text-gray-900">Reschedule</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Completed Reviews */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Completed Reviews</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {performanceData.completedReviews.slice(0, 3).map((review) => (
                    <div key={review.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-900">{review.employeeName}</h4>
                        <span className={`text-lg font-bold ${getRatingColor(review.rating)}`}>
                          {review.rating}/5
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{review.reviewType} Review</p>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div>Completed: {new Date(review.completedDate).toLocaleDateString()}</div>
                        <div>Reviewer: {review.reviewer}</div>
                      </div>
                      {review.strengths.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-gray-500">Strengths</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {review.strengths.slice(0, 2).map((strength, index) => (
                              <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                                {strength}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'goals' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Employee Goals</h3>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                  Set New Goal
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
                        Goal
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Progress
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
                    {performanceData.goals.map((goal) => (
                      <tr key={goal.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{goal.employeeName}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{goal.title}</div>
                            <div className="text-sm text-gray-500">{goal.description}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {goal.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(goal.dueDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className={`h-2 rounded-full ${getProgressColor(goal.progress)}`}
                                style={{ width: `${goal.progress}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600">{goal.progress}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(goal.status)}`}>
                            {goal.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button className="text-blue-600 hover:text-blue-900">Update</button>
                            <button className="text-green-600 hover:text-green-900">View</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'feedback' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">360° Feedback</h3>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                  Give Feedback
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {performanceData.feedback.map((feedback) => (
                  <div key={feedback.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-semibold text-gray-900">{feedback.employeeName}</h4>
                        <p className="text-sm text-gray-600">{feedback.feedbackType}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-lg font-bold ${getRatingColor(feedback.rating)}`}>
                          {feedback.rating}/5
                        </span>
                        <p className="text-sm text-gray-500">{feedback.category}</p>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 mb-4">{feedback.comments}</p>
                    
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>From: {feedback.provider}</span>
                      <span>{new Date(feedback.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'metrics' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Performance Metrics</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-2">
                    {performanceData.metrics.averageRating || calculateAverageRating()}
                  </div>
                  <p className="text-sm text-gray-600">Average Rating</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                  <div className="text-2xl font-bold text-green-600 mb-2">
                    {performanceData.metrics.goalsCompletionRate || calculateGoalsCompletionRate()}%
                  </div>
                  <p className="text-sm text-gray-600">Goals Completion Rate</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-2">
                    {performanceData.metrics.feedbackCount || performanceData.feedback.length}
                  </div>
                  <p className="text-sm text-gray-600">Total Feedback</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                  <div className="text-2xl font-bold text-orange-600 mb-2">
                    {performanceData.reviews.length}
                  </div>
                  <p className="text-sm text-gray-600">Total Reviews</p>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Performance Distribution</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Exceptional (4.5-5.0)</span>
                    <span className="text-sm font-medium">3 employees</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Exceeds Expectations (4.0-4.4)</span>
                    <span className="text-sm font-medium">5 employees</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Meets Expectations (3.0-3.9)</span>
                    <span className="text-sm font-medium">8 employees</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Needs Improvement (Below 3.0)</span>
                    <span className="text-sm font-medium">2 employees</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Performance;