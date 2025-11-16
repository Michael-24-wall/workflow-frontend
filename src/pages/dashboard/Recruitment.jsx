// src/pages/dashboard/Recruitment.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';

// Custom hook for recruitment data management
const useRecruitmentData = () => {
  const { 
    getHRRecruitment,
    performHRRecruitmentAction,
    effectiveUserRole,
    organization,
    organizationSlug
  } = useAuthStore();

  const [state, setState] = useState({
    activeJobs: [],
    candidates: [],
    analytics: {},
    jobPostings: [],
    loading: false,
    error: null,
    lastUpdated: null
  });

  const abortControllerRef = useRef(null);
  const initialLoadRef = useRef(false);

  // Check if user has access to recruitment dashboard
  const hasRecruitmentAccess = useCallback(() => {
    const allowedRoles = ['OWNER', 'EXECUTIVE', 'ADMIN', 'HR', 'MANAGER'];
    return allowedRoles.includes(effectiveUserRole);
  }, [effectiveUserRole]);

  const loadRecruitmentData = useCallback(async (forceRefresh = false) => {
    if (!hasRecruitmentAccess()) {
      console.warn('User does not have recruitment dashboard access');
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    if (!organization) {
      console.warn('Organization not loaded yet, waiting...');
      setState(prev => ({ ...prev, loading: true, error: null }));
      return;
    }

    if (!organizationSlug) {
      console.error('❌ No organization slug available');
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Organization not properly loaded. Please refresh the page.' 
      }));
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      console.log('🚀 Fetching recruitment data for organization:', organization.name, 'slug:', organizationSlug);
      const result = await getHRRecruitment();
      
      console.log('🔍 DEBUG: getHRRecruitment result:', result);
      
      if (result.success && result.data) {
        const recruitmentData = result.data;
        
        const normalizedData = {
          activeJobs: normalizeActiveJobs(recruitmentData),
          candidates: normalizeCandidates(recruitmentData),
          analytics: normalizeAnalytics(recruitmentData),
          jobPostings: normalizeJobPostings(recruitmentData)
        };

        console.log('✅ Recruitment data loaded successfully:', normalizedData);
        setState(prev => ({
          ...prev,
          ...normalizedData,
          loading: false,
          lastUpdated: new Date(),
          error: null
        }));
      } else {
        console.warn('❌ HR dashboard failed, using empty data');
        // Use empty data instead of throwing error
        setState(prev => ({
          ...prev,
          activeJobs: [],
          candidates: [],
          analytics: {},
          jobPostings: [],
          loading: false,
          lastUpdated: new Date(),
          error: null
        }));
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('🛑 Recruitment data fetch aborted');
        return;
      }
      
      console.error('❌ Error loading recruitment data:', error);
      // Don't set error state - use empty data instead
      setState(prev => ({
        ...prev,
        activeJobs: [],
        candidates: [],
        analytics: {},
        jobPostings: [],
        loading: false,
        lastUpdated: new Date(),
        error: null
      }));
    }
  }, [getHRRecruitment, hasRecruitmentAccess, organization, organizationSlug]);

  const handleRecruitmentAction = useCallback(async (actionType, data) => {
    if (!hasRecruitmentAccess()) {
      return { success: false, error: 'Access denied' };
    }

    try {
      const result = await performHRRecruitmentAction({
        action_type: actionType,
        ...data
      });

      if (result.success) {
        await loadRecruitmentData(true);
        return { success: true, message: result.message };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Recruitment action error:', error);
      return { success: false, error: error.message };
    }
  }, [performHRRecruitmentAction, loadRecruitmentData, hasRecruitmentAccess]);

  useEffect(() => {
    if (organization && organizationSlug && hasRecruitmentAccess() && !initialLoadRef.current) {
      console.log('🎯 Initial recruitment data load triggered');
      initialLoadRef.current = true;
      loadRecruitmentData();
    }
  }, [organization, organizationSlug, loadRecruitmentData, hasRecruitmentAccess]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    ...state,
    loadRecruitmentData,
    handleRecruitmentAction,
    hasRecruitmentAccess: hasRecruitmentAccess(),
    organizationReady: !!organization && !!organizationSlug
  };
};

// Data normalization functions - Handle API response structure
const normalizeActiveJobs = (apiData) => {
  if (!apiData) return [];
  
  if (apiData.activeJobs && Array.isArray(apiData.activeJobs)) {
    return apiData.activeJobs.map(job => ({
      id: job.id || job.job_id,
      title: job.title || job.position || 'Untitled Position',
      department: job.department || 'General',
      location: job.location || 'Not specified',
      type: job.type || job.employment_type || 'Full-time',
      applicants: job.applicants || job.applicant_count || 0,
      status: job.status || 'active',
      postedDate: job.postedDate || job.posted_date || job.created_at,
      salary: job.salary || job.salary_range || 'Not specified'
    }));
  }
  
  // If no activeJobs array, check for recruitment data structure
  if (apiData.recruitment_metrics) {
    return []; // Return empty array if we have metrics but no job listings
  }
  
  return [];
};

const normalizeCandidates = (apiData) => {
  if (!apiData) return [];
  
  if (apiData.candidates && Array.isArray(apiData.candidates)) {
    return apiData.candidates.map(candidate => ({
      id: candidate.id || candidate.candidate_id,
      name: candidate.name || candidate.full_name,
      email: candidate.email,
      position: candidate.position || candidate.applied_position,
      status: candidate.status || candidate.current_status || 'screening',
      appliedDate: candidate.appliedDate || candidate.applied_date || candidate.created_at,
      lastContact: candidate.lastContact || candidate.last_contact,
      resume: candidate.resume || candidate.resume_url
    }));
  }
  
  // If no candidates array, check for pipeline data
  if (apiData.pipeline_breakdown) {
    return []; // Return empty array if we have pipeline data but no candidate details
  }
  
  return [];
};

const normalizeAnalytics = (apiData) => {
  if (!apiData) return {};
  
  if (apiData.recruitment_metrics) {
    return {
      totalCandidates: apiData.recruitment_metrics.candidates_in_pipeline || 0,
      activeJobs: apiData.recruitment_metrics.open_positions || 0,
      interviewRate: apiData.recruitment_metrics.interview_rate || 0,
      timeToHire: apiData.recruitment_metrics.time_to_hire || 0,
      offerAcceptance: apiData.recruitment_metrics.offer_acceptance_rate || 0
    };
  }
  
  // Fallback to basic analytics
  return {
    totalCandidates: apiData.totalCandidates || 0,
    activeJobs: apiData.activeJobs || 0,
    interviewRate: apiData.interviewRate || 0,
    timeToHire: apiData.timeToHire || 0,
    offerAcceptance: apiData.offerAcceptance || 0
  };
};

const normalizeJobPostings = (apiData) => {
  if (!apiData) return [];
  
  if (apiData.jobPostings && Array.isArray(apiData.jobPostings)) {
    return apiData.jobPostings;
  }
  
  // Fallback to activeJobs if jobPostings not available
  return normalizeActiveJobs(apiData);
};

// Loading component
const RecruitmentSkeleton = () => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <div>
        <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
      </div>
      <div className="flex space-x-3">
        <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
        <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-rows-2 md:grid-cols-3 gap-6">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Organization loading component
const OrganizationLoading = () => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Recruitment</h1>
        <p className="text-gray-600">Manage job postings and candidate pipeline</p>
      </div>
    </div>
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading organization data...</p>
      <p className="text-sm text-gray-500 mt-2">Please wait while we prepare your recruitment dashboard</p>
    </div>
  </div>
);

// Empty state components
const EmptyJobs = () => (
  <div className="text-center py-12 text-gray-500">
    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <span className="text-2xl">💼</span>
    </div>
    <p className="text-lg font-medium mb-2">No Active Job Postings</p>
    <p className="text-sm mb-4">Get started by creating your first job posting</p>
    <Link
      to="/dashboard/hr/recruitment/new"
      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-block"
    >
      Post New Job
    </Link>
  </div>
);

const EmptyCandidates = () => (
  <div className="text-center py-12 text-gray-500">
    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <span className="text-2xl">👥</span>
    </div>
    <p className="text-lg font-medium mb-2">No Candidates</p>
    <p className="text-sm">Candidates will appear here once they apply to your job postings</p>
  </div>
);

const EmptyAnalytics = () => (
  <div className="text-center py-12 text-gray-500">
    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <span className="text-2xl">📊</span>
    </div>
    <p className="text-lg font-medium mb-2">No Analytics Data</p>
    <p className="text-sm">Analytics will appear here once you have recruitment activity</p>
  </div>
);

// Role-based action permissions
const useActionPermissions = (userRole) => {
  return useCallback((actionType) => {
    const permissions = {
      post_job: ['OWNER', 'EXECUTIVE', 'ADMIN', 'HR'],
      update_job: ['OWNER', 'EXECUTIVE', 'ADMIN', 'HR'],
      delete_job: ['OWNER', 'EXECUTIVE', 'ADMIN', 'HR'],
      update_candidate_status: ['OWNER', 'EXECUTIVE', 'ADMIN', 'HR', 'MANAGER'],
      schedule_interview: ['OWNER', 'EXECUTIVE', 'ADMIN', 'HR', 'MANAGER'],
      view_analytics: ['OWNER', 'EXECUTIVE', 'ADMIN', 'HR', 'MANAGER']
    };

    return permissions[actionType]?.includes(userRole) || false;
  }, [userRole]);
};

// Status badge component
const StatusBadge = ({ status }) => {
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

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(status)}`}>
      {status?.charAt(0).toUpperCase() + status?.slice(1).replace('-', ' ') || 'Unknown'}
    </span>
  );
};

// Job Type badge component
const JobTypeBadge = ({ type }) => {
  const getTypeColor = (type) => {
    const colors = {
      'Full-time': 'bg-blue-100 text-blue-800',
      'Part-time': 'bg-green-100 text-green-800',
      'Contract': 'bg-purple-100 text-purple-800',
      'Remote': 'bg-orange-100 text-orange-800',
      'Internship': 'bg-pink-100 text-pink-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(type)}`}>
      {type}
    </span>
  );
};

// Main Recruitment Component
const Recruitment = () => {
  const { 
    invitations, 
    getInvitationsData,
    effectiveUserRole,
    organization,
    organizationSlug,
    forceRefresh
  } = useAuthStore();

  const [activeTab, setActiveTab] = useState('overview');
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [showDebug, setShowDebug] = useState(false);
  
  const {
    activeJobs,
    candidates,
    analytics,
    jobPostings,
    loading: dataLoading,
    error,
    loadRecruitmentData,
    handleRecruitmentAction,
    lastUpdated,
    hasRecruitmentAccess,
    organizationReady
  } = useRecruitmentData();

  // Action permissions based on role
  const canPerformAction = useActionPermissions(effectiveUserRole);

  // Load invitations data
  useEffect(() => {
    if (organizationReady) {
      getInvitationsData();
    }
  }, [organizationReady, getInvitationsData]);

  // Load recruitment data when tab changes (only if organization is ready)
  useEffect(() => {
    if (organizationReady) {
      loadRecruitmentData();
    }
  }, [activeTab, loadRecruitmentData, organizationReady]);

  // Enhanced action handlers with role-based permissions
  const handlePostJob = useCallback(async (jobData) => {
    if (!canPerformAction('post_job')) {
      return { success: false, error: 'You do not have permission to post jobs' };
    }

    setActionLoading(true);
    try {
      const result = await handleRecruitmentAction('post_job', jobData);
      return result;
    } finally {
      setActionLoading(false);
    }
  }, [handleRecruitmentAction, canPerformAction]);

  const handleUpdateCandidateStatus = useCallback(async (candidateId, status) => {
    if (!canPerformAction('update_candidate_status')) {
      return { success: false, error: 'You do not have permission to update candidate status' };
    }

    setActionLoading(true);
    try {
      const result = await handleRecruitmentAction('update_candidate_status', {
        candidate_id: candidateId,
        new_status: status
      });
      return result;
    } finally {
      setActionLoading(false);
    }
  }, [handleRecruitmentAction, canPerformAction]);

  // Filter jobs based on search and department
  const filteredJobs = useCallback(() => {
    return activeJobs.filter(job => {
      const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           job.department.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDepartment = selectedDepartment === 'All Departments' || job.department === selectedDepartment;
      return matchesSearch && matchesDepartment;
    });
  }, [activeJobs, searchTerm, selectedDepartment]);

  // Get unique departments for filter
  const departments = useCallback(() => {
    const uniqueDepartments = [...new Set(activeJobs.map(job => job.department))];
    return ['All Departments', ...uniqueDepartments];
  }, [activeJobs]);

  // Calculate pipeline stages
  const pipelineStages = useCallback(() => {
    const stages = {
      applied: candidates.length,
      screening: candidates.filter(c => c.status === 'screening').length,
      interview: candidates.filter(c => c.status === 'interview').length,
      offer: candidates.filter(c => c.status === 'offer').length,
      hired: candidates.filter(c => c.status === 'hired').length
    };
    return stages;
  }, [candidates]);

  // Handle manual organization reload
  const handleReloadOrganization = async () => {
    console.log('🔄 Manually reloading organization data...');
    await forceRefresh();
    await loadRecruitmentData(true);
  };

  // Show organization loading state
  if (!organization) {
    return <OrganizationLoading />;
  }

  // Show loading state
  if (dataLoading && activeJobs.length === 0 && candidates.length === 0) {
    return <RecruitmentSkeleton />;
  }

  // Check access permissions
  if (!hasRecruitmentAccess) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recruitment</h1>
          <p className="text-gray-600">Manage job postings and candidate pipeline</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="text-orange-600 text-lg font-semibold mb-2">Access Denied</div>
          <p className="text-gray-600 mb-4">
            You don't have permission to access the Recruitment dashboard. 
            This section is available for HR, Managers, and Administrators only.
          </p>
          <div className="text-sm text-gray-500 mb-4">
            Your current role: <span className="font-medium">{effectiveUserRole}</span>
          </div>
          <Link
            to="/dashboard"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Debug toggle */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
        >
          {showDebug ? 'Hide Debug' : 'Show Debug'}
        </button>
      </div>

      {showDebug && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-yellow-800 font-semibold mb-2">Debug Information</h3>
          <div className="text-sm text-yellow-700 space-y-1">
            <p><strong>Organization:</strong> {organization?.name || 'null'}</p>
            <p><strong>Organization Slug:</strong> {organizationSlug || 'null'}</p>
            <p><strong>User Role:</strong> {effectiveUserRole}</p>
            <p><strong>Active Jobs:</strong> {activeJobs.length}</p>
            <p><strong>Candidates:</strong> {candidates.length}</p>
            <p><strong>Last Updated:</strong> {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}</p>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recruitment</h1>
          <p className="text-gray-600">Manage job postings and candidate pipeline</p>
          {lastUpdated && (
            <p className="text-sm text-gray-500 mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()} • Role: {effectiveUserRole}
              {organizationSlug && ` • Organization: ${organization.name}`}
            </p>
          )}
          {!organizationSlug && (
            <p className="text-sm text-red-500 mt-1">
              ⚠️ Organization slug missing - some features may not work
            </p>
          )}
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={handleReloadOrganization}
            disabled={dataLoading || actionLoading}
            className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reload Org
          </button>
          <button 
            onClick={() => loadRecruitmentData(true)}
            disabled={dataLoading || actionLoading}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {dataLoading ? 'Refreshing...' : 'Refresh Data'}
          </button>
          
          {canPerformAction('post_job') && (
            <Link
              to="/dashboard/hr/recruitment/new"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Post New Job
            </Link>
          )}
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
                className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm capitalize transition-colors ${
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
                        {analytics.activeJobs || activeJobs.length}
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
                        {analytics.totalCandidates || candidates.length}
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
                        {analytics.interviewRate || 0}%
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
                        {analytics.timeToHire || 0} days
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
                        {analytics.offerAcceptance || 0}%
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                      <span className="text-xl">✅</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              {invitations && invitations.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    {invitations.slice(0, 5).map((invite) => (
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
              )}

              {/* Active Jobs Quick View */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Job Postings</h3>
                {activeJobs.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeJobs.slice(0, 3).map((job) => (
                      <div key={job.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-gray-900">{job.title}</h4>
                          <StatusBadge status={job.status} />
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{job.department} • {job.location}</p>
                        <div className="flex justify-between items-center text-sm text-gray-500">
                          <span>{job.applicants} applicants</span>
                          <span>{job.salary}</span>
                        </div>
                        <div className="mt-3 flex justify-between items-center">
                          <JobTypeBadge type={job.type} />
                          <span className="text-xs text-gray-500">
                            Posted {job.postedDate ? new Date(job.postedDate).toLocaleDateString() : 'Recently'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyJobs />
                )}
              </div>

              {/* Candidate Pipeline */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Candidate Pipeline</h3>
                {candidates.length > 0 ? (
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="grid grid-cols-5 gap-4 text-center">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{pipelineStages().applied}</div>
                        <div className="text-sm text-gray-600">Applied</div>
                      </div>
                      <div className="p-3 bg-yellow-50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">{pipelineStages().screening}</div>
                        <div className="text-sm text-gray-600">Screening</div>
                      </div>
                      <div className="p-3 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">{pipelineStages().interview}</div>
                        <div className="text-sm text-gray-600">Interview</div>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{pipelineStages().offer}</div>
                        <div className="text-sm text-gray-600">Offer</div>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{pipelineStages().hired}</div>
                        <div className="text-sm text-gray-600">Hired</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <EmptyCandidates />
                )}
              </div>
            </div>
          )}

          {activeTab === 'jobs' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Job Postings</h3>
                <div className="flex space-x-3">
                  <select 
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {departments().map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Search jobs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {canPerformAction('post_job') && (
                    <Link
                      to="/dashboard/hr/recruitment/new"
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Create Job
                    </Link>
                  )}
                </div>
              </div>

              {jobPostings.length > 0 ? (
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
                      {filteredJobs().map((job) => (
                        <tr key={job.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{job.title}</div>
                              <div className="text-sm text-gray-500">
                                <JobTypeBadge type={job.type} />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {job.department}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {job.location}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center">
                              <span className="font-medium">{job.applicants}</span>
                              {job.applicants > 0 && (
                                <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                  New
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={job.status} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button className="text-blue-600 hover:text-blue-900">View</button>
                              {canPerformAction('update_job') && (
                                <button className="text-green-600 hover:text-green-900">Edit</button>
                              )}
                              {canPerformAction('delete_job') && (
                                <button className="text-red-600 hover:text-red-900">Close</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyJobs />
              )}
              {jobPostings.length > 0 && filteredJobs().length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🔍</span>
                  </div>
                  <p>No jobs found</p>
                  <p className="text-sm mt-1">Try adjusting your search or filters</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'candidates' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Candidate Pipeline</h3>
                {canPerformAction('update_candidate_status') && (
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                    Add Candidate
                  </button>
                )}
              </div>

              {candidates.length > 0 ? (
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
                      {candidates.map((candidate) => (
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
                            {candidate.appliedDate ? new Date(candidate.appliedDate).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={candidate.status} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {candidate.lastContact ? new Date(candidate.lastContact).toLocaleDateString() : 'Never'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button className="text-blue-600 hover:text-blue-900">View</button>
                              {canPerformAction('update_candidate_status') && (
                                <button className="text-green-600 hover:text-green-900">Contact</button>
                              )}
                              {canPerformAction('schedule_interview') && (
                                <button className="text-purple-600 hover:text-purple-900">Schedule</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyCandidates />
              )}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Recruitment Analytics</h3>
              
              {Object.keys(analytics).length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h4 className="font-semibold text-gray-900 mb-4">Application Funnel</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Applied</span>
                          <span className="text-sm font-medium">{analytics.totalCandidates || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Interview Rate</span>
                          <span className="text-sm font-medium">{analytics.interviewRate || 0}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Offer Acceptance</span>
                          <span className="text-sm font-medium">{analytics.offerAcceptance || 0}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h4 className="font-semibold text-gray-900 mb-4">Performance Metrics</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Active Jobs</span>
                          <span className="text-sm font-medium">{analytics.activeJobs || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Time to Hire</span>
                          <span className="text-sm font-medium">{analytics.timeToHire || 0} days</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Cost per Hire</span>
                          <span className="text-sm font-medium">${analytics.costPerHire || '0'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {activeJobs.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h4 className="font-semibold text-gray-900 mb-4">Active Job Postings</h4>
                      <div className="space-y-4">
                        {activeJobs.map((job) => (
                          <div key={job.id} className="flex items-center justify-between">
                            <span className="text-sm text-gray-900">{job.title}</span>
                            <div className="flex items-center space-x-4">
                              <span className="text-sm text-gray-600">
                                Posted {job.postedDate ? new Date(job.postedDate).toLocaleDateString() : 'N/A'}
                              </span>
                              <span className="text-sm font-medium text-blue-600">
                                {job.applicants} applicants
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <EmptyAnalytics />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(Recruitment);