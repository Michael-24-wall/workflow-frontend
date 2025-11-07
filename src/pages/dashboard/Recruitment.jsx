// src/pages/dashboard/Recruitment.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';

const Recruitment = () => {
  const { 
    invitations, 
    getInvitationsData,
    // HR Dashboard methods
    getHRRecruitment,
    performHRRecruitmentAction,
    hrDashboard,
    isLoading,
    error,
    hasHRDashboardAccess,
    clearHRCache
  } = useAuthStore();

  const [activeTab, setActiveTab] = useState('overview');
  const [localLoading, setLocalLoading] = useState(true);
  const [recruitmentData, setRecruitmentData] = useState({
    activeJobs: [],
    candidates: [],
    analytics: {},
    jobPostings: []
  });
  const [actionLoading, setActionLoading] = useState(false);

  // Load recruitment data from HR dashboard
  const loadRecruitmentData = async () => {
    if (!hasHRDashboardAccess) {
      console.warn('User does not have HR dashboard access');
      setLocalLoading(false);
      return;
    }

    setLocalLoading(true);
    try {
      // Load invitations data
      await getInvitationsData();
      
      // Load HR recruitment data
      const result = await getHRRecruitment();
      
      if (result.success && result.data) {
        // Map the API data to component state
        const recruitmentData = result.data;
        
        // Set recruitment data based on API response structure
        if (recruitmentData.activeJobs) {
          setRecruitmentData(prev => ({
            ...prev,
            activeJobs: recruitmentData.activeJobs
          }));
        }
        
        if (recruitmentData.candidates) {
          setRecruitmentData(prev => ({
            ...prev,
            candidates: recruitmentData.candidates
          }));
        }
        
        if (recruitmentData.analytics) {
          setRecruitmentData(prev => ({
            ...prev,
            analytics: recruitmentData.analytics
          }));
        }
        
        if (recruitmentData.jobPostings) {
          setRecruitmentData(prev => ({
            ...prev,
            jobPostings: recruitmentData.jobPostings
          }));
        }
      } else {
        // Fallback to mock data if API fails
        console.warn('Using fallback recruitment data');
        loadFallbackData();
      }
    } catch (error) {
      console.error('Error loading recruitment data:', error);
      loadFallbackData();
    } finally {
      setLocalLoading(false);
    }
  };

  // Fallback mock data
  const loadFallbackData = () => {
    const mockActiveJobs = [
      {
        id: 1,
        title: 'Senior React Developer',
        department: 'Engineering',
        location: 'Remote',
        type: 'Full-time',
        applicants: 24,
        status: 'active',
        postedDate: '2024-01-15',
        salary: '$120,000 - $140,000'
      },
      {
        id: 2,
        title: 'Product Manager',
        department: 'Product',
        location: 'San Francisco, CA',
        type: 'Full-time',
        applicants: 18,
        status: 'active',
        postedDate: '2024-01-20',
        salary: '$130,000 - $150,000'
      },
      {
        id: 3,
        title: 'UX Designer',
        department: 'Design',
        location: 'New York, NY',
        type: 'Contract',
        applicants: 12,
        status: 'active',
        postedDate: '2024-01-25',
        salary: '$90,000 - $110,000'
      }
    ];

    const mockCandidates = [
      {
        id: 1,
        name: 'John Smith',
        email: 'john.smith@email.com',
        position: 'Senior React Developer',
        status: 'interview',
        appliedDate: '2024-02-01',
        lastContact: '2024-02-05',
        resume: 'john_smith_resume.pdf'
      },
      {
        id: 2,
        name: 'Sarah Johnson',
        email: 'sarah.j@email.com',
        position: 'Product Manager',
        status: 'screening',
        appliedDate: '2024-02-02',
        lastContact: '2024-02-03',
        resume: 'sarah_johnson_resume.pdf'
      },
      {
        id: 3,
        name: 'Mike Chen',
        email: 'mike.chen@email.com',
        position: 'UX Designer',
        status: 'offer',
        appliedDate: '2024-01-28',
        lastContact: '2024-02-04',
        resume: 'mike_chen_resume.pdf'
      }
    ];

    const mockAnalytics = {
      totalCandidates: 24,
      activeJobs: 3,
      interviewRate: 35,
      timeToHire: 24, // days
      offerAcceptance: 78 // percentage
    };

    setRecruitmentData({
      activeJobs: mockActiveJobs,
      candidates: mockCandidates,
      analytics: mockAnalytics,
      jobPostings: mockActiveJobs // Using same data for demo
    });
  };

  // Handle recruitment actions
  const handleRecruitmentAction = async (actionType, data) => {
    setActionLoading(true);
    try {
      const result = await performHRRecruitmentAction({
        action_type: actionType,
        ...data
      });

      if (result.success) {
        // Refresh recruitment data after successful action
        await loadRecruitmentData();
        return { success: true, message: result.message };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Recruitment action error:', error);
      return { success: false, error: error.message };
    } finally {
      setActionLoading(false);
    }
  };

  // Handle job posting
  const handlePostJob = async (jobData) => {
    return await handleRecruitmentAction('post_job', jobData);
  };

  // Handle candidate status update
  const handleUpdateCandidateStatus = async (candidateId, status) => {
    return await handleRecruitmentAction('update_candidate_status', {
      candidate_id: candidateId,
      new_status: status
    });
  };

  // Handle interview scheduling
  const handleScheduleInterview = async (interviewData) => {
    return await handleRecruitmentAction('schedule_interview', interviewData);
  };

  // Refresh data when tab changes or component mounts
  useEffect(() => {
    loadRecruitmentData();
  }, [activeTab]);

  const getStatusColor = (status) => {
    const colors = {
      'active': 'bg-green-100 text-green-800',
      'screening': 'bg-blue-100 text-blue-800',
      'interview': 'bg-yellow-100 text-yellow-800',
      'offer': 'bg-purple-100 text-purple-800',
      'hired': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'closed': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getJobTypeColor = (type) => {
    const colors = {
      'Full-time': 'bg-blue-100 text-blue-800',
      'Part-time': 'bg-green-100 text-green-800',
      'Contract': 'bg-purple-100 text-purple-800',
      'Remote': 'bg-orange-100 text-orange-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  // Show loading state
  if (localLoading || isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recruitment</h1>
          <p className="text-gray-600">Manage job postings and candidate pipeline</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && recruitmentData.activeJobs.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recruitment</h1>
          <p className="text-gray-600">Manage job postings and candidate pipeline</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">Error Loading Data</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={loadRecruitmentData}
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
          <h1 className="text-2xl font-bold text-gray-900">Recruitment</h1>
          <p className="text-gray-600">Manage job postings and candidate pipeline</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => loadRecruitmentData()}
            disabled={actionLoading}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
          >
            Refresh Data
          </button>
          <Link
            to="/dashboard/hr/recruitment/new"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Post New Job
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {['overview', 'jobs', 'candidates', 'analytics'].map((tab) => (
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
              <div className="grid grid-cols-1 md:grid-rows-2 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Active Jobs</p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        {recruitmentData.analytics.activeJobs || recruitmentData.activeJobs.length}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-xl">💼</span>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">Total Candidates</p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        {recruitmentData.analytics.totalCandidates || recruitmentData.candidates.length}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-xl">👥</span>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">Pending Invitations</p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">{invitations?.length || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <span className="text-xl">📨</span>
                    </div>
                  </div>
                </div>

                {/* Additional Stats */}
                <div className="bg-yellow-50 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-yellow-600">Interview Rate</p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        {recruitmentData.analytics.interviewRate || '35'}%
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <span className="text-xl">📊</span>
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-50 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-indigo-600">Time to Hire</p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        {recruitmentData.analytics.timeToHire || '24'} days
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <span className="text-xl">⏱️</span>
                    </div>
                  </div>
                </div>

                <div className="bg-teal-50 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-teal-600">Offer Acceptance</p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        {recruitmentData.analytics.offerAcceptance || '78'}%
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                      <span className="text-xl">✅</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {invitations?.slice(0, 5).map((invite) => (
                    <div key={invite.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600">📧</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Invitation sent</p>
                          <p className="text-sm text-gray-500">To: {invite.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          {new Date(invite.created_at).toLocaleDateString()}
                        </p>
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {invite.role}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Jobs Quick View */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Job Postings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recruitmentData.activeJobs.slice(0, 3).map((job) => (
                    <div key={job.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-900">{job.title}</h4>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(job.status)}`}>
                          {job.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{job.department} • {job.location}</p>
                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <span>{job.applicants} applicants</span>
                        <span>{job.salary}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'jobs' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Job Postings</h3>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                  Create Job
                </button>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Position
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Applicants
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
                    {recruitmentData.jobPostings.map((job) => (
                      <tr key={job.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{job.title}</div>
                            <div className="text-sm text-gray-500">{job.type}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {job.department}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {job.location}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {job.applicants}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(job.status)}`}>
                            {job.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button className="text-blue-600 hover:text-blue-900">Edit</button>
                            <button className="text-green-600 hover:text-green-900">View</button>
                            <button className="text-red-600 hover:text-red-900">Close</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'candidates' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Candidate Pipeline</h3>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                  Add Candidate
                </button>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Candidate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Position
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Applied
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recruitmentData.candidates.map((candidate) => (
                      <tr key={candidate.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{candidate.name}</div>
                            <div className="text-sm text-gray-500">{candidate.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {candidate.position}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(candidate.appliedDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(candidate.status)}`}>
                            {candidate.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(candidate.lastContact).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button className="text-blue-600 hover:text-blue-900">View</button>
                            <button className="text-green-600 hover:text-green-900">Contact</button>
                            <button className="text-purple-600 hover:text-purple-900">Schedule</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Recruitment Analytics</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Application Funnel</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Applied</span>
                      <span className="text-sm font-medium">24</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Screening</span>
                      <span className="text-sm font-medium">18</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Interview</span>
                      <span className="text-sm font-medium">8</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Offer</span>
                      <span className="text-sm font-medium">3</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Hired</span>
                      <span className="text-sm font-medium">2</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Source of Hire</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">LinkedIn</span>
                      <span className="text-sm font-medium">45%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Company Website</span>
                      <span className="text-sm font-medium">25%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Referrals</span>
                      <span className="text-sm font-medium">20%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Other</span>
                      <span className="text-sm font-medium">10%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Time to Fill Positions</h4>
                <div className="space-y-4">
                  {recruitmentData.activeJobs.map((job) => (
                    <div key={job.id} className="flex items-center justify-between">
                      <span className="text-sm text-gray-900">{job.title}</span>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600">Posted {new Date(job.postedDate).toLocaleDateString()}</span>
                        <span className="text-sm font-medium text-blue-600">24 days open</span>
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

export default Recruitment;