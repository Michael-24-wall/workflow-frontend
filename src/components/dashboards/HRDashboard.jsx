// src/pages/dashboard/HRDashboard.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useLocation, Outlet, useNavigate, Routes, Route } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';

// Error boundary component
class HRDashboardErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('HR Dashboard Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-4">
              We're having trouble loading the HR Dashboard. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Reload Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// =============================================================================
// DATA STORAGE UTILITIES
// =============================================================================

const HR_DATA_KEY = 'hr_dashboard_data';

const getStoredHRData = () => {
  try {
    const stored = localStorage.getItem(HR_DATA_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error reading HR data from localStorage:', error);
    return null;
  }
};

const saveHRData = (data) => {
  try {
    localStorage.setItem(HR_DATA_KEY, JSON.stringify(data));
    console.log('💾 Data saved to localStorage:', data);
  } catch (error) {
    console.error('Error saving HR data to localStorage:', error);
  }
};

const initializeHRData = () => {
  const existing = getStoredHRData();
  if (existing) {
    console.log('📁 Loading existing HR data from localStorage');
    return existing;
  }

  console.log('🆕 Initializing empty HR data structure');
  const initialData = {
    employees: [],
    jobPostings: [],
    performanceReviews: [],
    leaveRequests: [],
    trainingPrograms: [],
    compensationRecords: []
  };

  saveHRData(initialData);
  return initialData;
};

// =============================================================================
// CUSTOM HOOKS
// =============================================================================

const useHRData = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = () => {
      setLoading(true);
      setTimeout(() => {
        const hrData = initializeHRData();
        setData(hrData);
        setLoading(false);
      }, 500);
    };

    loadData();
  }, []);

  const updateData = useCallback((updates) => {
    setData(prev => {
      const newData = { ...prev, ...updates };
      saveHRData(newData);
      return newData;
    });
  }, []);

  // Employee Actions
  const addEmployee = useCallback((employee) => {
    const newEmployee = {
      ...employee,
      id: Date.now(),
      startDate: employee.startDate || new Date().toISOString().split('T')[0],
      status: 'active'
    };
    
    updateData(prev => ({
      ...prev,
      employees: [...prev.employees, newEmployee]
    }));
    
    return newEmployee;
  }, [updateData]);

  const updateEmployee = useCallback((id, updates) => {
    updateData(prev => ({
      ...prev,
      employees: prev.employees.map(emp => 
        emp.id === id ? { ...emp, ...updates } : emp
      )
    }));
  }, [updateData]);

  const deleteEmployee = useCallback((id) => {
    updateData(prev => ({
      ...prev,
      employees: prev.employees.filter(emp => emp.id !== id)
    }));
  }, [updateData]);

  // Job Posting Actions
  const addJobPosting = useCallback((job) => {
    const newJob = {
      ...job,
      id: Date.now(),
      postedDate: new Date().toISOString().split('T')[0],
      applicants: 0
    };
    
    updateData(prev => ({
      ...prev,
      jobPostings: [...prev.jobPostings, newJob]
    }));
    
    return newJob;
  }, [updateData]);

  const updateJobPosting = useCallback((id, updates) => {
    updateData(prev => ({
      ...prev,
      jobPostings: prev.jobPostings.map(job => 
        job.id === id ? { ...job, ...updates } : job
      )
    }));
  }, [updateData]);

  // Performance Review Actions
  const addPerformanceReview = useCallback((review) => {
    const newReview = {
      ...review,
      id: Date.now(),
      reviewDate: new Date().toISOString().split('T')[0]
    };
    
    updateData(prev => ({
      ...prev,
      performanceReviews: [...prev.performanceReviews, newReview]
    }));
    
    return newReview;
  }, [updateData]);

  // Leave Request Actions
  const addLeaveRequest = useCallback((request) => {
    const newRequest = {
      ...request,
      id: Date.now(),
      requestedDate: new Date().toISOString().split('T')[0]
    };
    
    updateData(prev => ({
      ...prev,
      leaveRequests: [...prev.leaveRequests, newRequest]
    }));
    
    return newRequest;
  }, [updateData]);

  const updateLeaveRequest = useCallback((id, status) => {
    updateData(prev => ({
      ...prev,
      leaveRequests: prev.leaveRequests.map(req =>
        req.id === id ? { ...req, status } : req
      )
    }));
  }, [updateData]);

  // Training Program Actions
  const addTrainingProgram = useCallback((program) => {
    const newProgram = {
      ...program,
      id: Date.now(),
      participants: []
    };
    
    updateData(prev => ({
      ...prev,
      trainingPrograms: [...prev.trainingPrograms, newProgram]
    }));
    
    return newProgram;
  }, [updateData]);

  // Compensation Actions
  const addCompensationRecord = useCallback((record) => {
    const newRecord = {
      ...record,
      id: Date.now(),
      effectiveDate: new Date().toISOString().split('T')[0]
    };
    
    updateData(prev => ({
      ...prev,
      compensationRecords: [...prev.compensationRecords, newRecord]
    }));
    
    return newRecord;
  }, [updateData]);

  return {
    data,
    loading,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    addJobPosting,
    updateJobPosting,
    addPerformanceReview,
    addLeaveRequest,
    updateLeaveRequest,
    addTrainingProgram,
    addCompensationRecord
  };
};

const useHRDashboardData = () => {
  const { user } = useAuthStore();
  const { data: hrData, loading } = useHRData();

  const stats = useMemo(() => {
    if (!hrData) return null;

    return {
      totalEmployees: hrData.employees.length,
      activeEmployees: hrData.employees.filter(emp => emp.status === 'active').length,
      departments: [...new Set(hrData.employees.map(emp => emp.department))].length,
      pendingRequests: hrData.leaveRequests.filter(req => req.status === 'pending').length,
      newHires: hrData.employees.filter(emp => {
        const startDate = new Date(emp.startDate);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return startDate > thirtyDaysAgo;
      }).length,
      openPositions: hrData.jobPostings.filter(job => job.status === 'open').length,
      onLeave: hrData.leaveRequests.filter(req => 
        req.status === 'approved' && 
        new Date(req.startDate) <= new Date() && 
        new Date(req.endDate) >= new Date()
      ).length,
      turnoverRate: '0%' // Will calculate based on your data
    };
  }, [hrData]);

  const recentActivity = useMemo(() => {
    if (!hrData) return [];

    const activities = [
      ...hrData.employees.slice(-5).map(emp => ({
        id: `emp-${emp.id}`,
        type: 'join',
        message: `${emp.firstName} ${emp.lastName} joined as ${emp.position}`,
        timestamp: emp.startDate
      })),
      ...hrData.performanceReviews.slice(-3).map(review => ({
        id: `review-${review.id}`,
        type: 'review',
        message: `Performance review completed for ${review.employeeName}`,
        timestamp: review.reviewDate
      })),
      ...hrData.leaveRequests.slice(-3).map(request => ({
        id: `leave-${request.id}`,
        type: 'leave',
        message: `${request.employeeName} requested ${request.type} leave`,
        timestamp: request.requestedDate
      }))
    ];

    return activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [hrData]);

  return {
    loading,
    error: null,
    stats,
    recentActivity,
    hrData,
    lastUpdated: new Date()
  };
};

// =============================================================================
// FORM COMPONENTS
// =============================================================================

// Employee Form Component
const EmployeeForm = ({ onSubmit, initialData = {}, onCancel }) => {
  const [formData, setFormData] = useState({
    firstName: initialData.firstName || '',
    lastName: initialData.lastName || '',
    email: initialData.email || '',
    phone: initialData.phone || '',
    position: initialData.position || '',
    department: initialData.department || '',
    salary: initialData.salary || '',
    startDate: initialData.startDate || '',
    status: initialData.status || 'active',
    address: initialData.address || '',
    emergencyContact: initialData.emergencyContact || ''
  });

  const departments = ['Engineering', 'Product', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations', 'Design'];
  const positions = [
    'Software Engineer', 'Senior Software Engineer', 'Product Manager', 'Product Designer',
    'Marketing Specialist', 'Sales Representative', 'HR Manager', 'Financial Analyst',
    'Operations Manager', 'UX Designer', 'Data Scientist', 'DevOps Engineer'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {initialData.id ? 'Edit Employee' : 'Add New Employee'}
          </h2>
          <p className="text-gray-600 mt-1">
            {initialData.id ? 'Update employee information' : 'Add a new team member to your organization'}
          </p>
        </div>
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-lg hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Personal Information Section */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter first name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter last name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="employee@company.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>
        </div>

        {/* Employment Details Section */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Employment Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department *
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Position *
              </label>
              <select
                name="position"
                value={formData.position}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">Select Position</option>
                {positions.map(pos => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Salary ($) *
              </label>
              <input
                type="number"
                name="salary"
                value={formData.salary}
                onChange={handleChange}
                required
                min="0"
                step="1000"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="50000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="on_leave">On Leave</option>
              </select>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter full address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Emergency Contact
              </label>
              <input
                type="text"
                name="emergencyContact"
                value={formData.emergencyContact}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Name and phone number"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-8 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-lg hover:shadow-xl"
          >
            {initialData.id ? 'Update Employee' : 'Add Employee'}
          </button>
        </div>
      </form>
    </div>
  );
};

// Job Posting Form Component
const JobPostingForm = ({ onSubmit, initialData = {}, onCancel }) => {
  const [formData, setFormData] = useState({
    title: initialData.title || '',
    department: initialData.department || '',
    type: initialData.type || 'Full-time',
    location: initialData.location || '',
    salary: initialData.salary || '',
    description: initialData.description || '',
    requirements: initialData.requirements || [],
    status: initialData.status || 'open'
  });

  const [requirement, setRequirement] = useState('');

  const departments = ['Engineering', 'Product', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations'];
  const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote'];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addRequirement = () => {
    if (requirement.trim()) {
      setFormData(prev => ({
        ...prev,
        requirements: [...prev.requirements, requirement.trim()]
      }));
      setRequirement('');
    }
  };

  const removeRequirement = (index) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }));
  };

  const handleRequirementKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addRequirement();
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {initialData.id ? 'Edit Job Posting' : 'Create Job Posting'}
          </h2>
          <p className="text-gray-600 mt-1">
            {initialData.id ? 'Update job posting details' : 'Create a new job opening'}
          </p>
        </div>
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-lg hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="e.g., Senior Frontend Developer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department *
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Type *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                {jobTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="e.g., New York, NY or Remote"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Salary Range *
              </label>
              <input
                type="text"
                name="salary"
                value={formData.salary}
                onChange={handleChange}
                required
                placeholder="$80,000 - $100,000"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="open">Open</option>
                <option value="closed">Closed</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>
        </div>

        {/* Job Description */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Description</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Describe the role, responsibilities, and what you're looking for in a candidate..."
            />
          </div>
        </div>

        {/* Requirements */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Requirements & Qualifications</h3>
          <div className="space-y-4">
            <div className="flex space-x-3">
              <input
                type="text"
                value={requirement}
                onChange={(e) => setRequirement(e.target.value)}
                onKeyPress={handleRequirementKeyPress}
                placeholder="Add a requirement (e.g., 3+ years of experience)"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              <button
                type="button"
                onClick={addRequirement}
                className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
              >
                Add
              </button>
            </div>
            
            <div className="space-y-2">
              {formData.requirements.map((req, index) => (
                <div key={index} className="flex items-center justify-between bg-white px-4 py-3 rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-700">{req}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeRequirement(index)}
                    className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
                  >
                    <span className="text-lg">×</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-8 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-lg hover:shadow-xl"
          >
            {initialData.id ? 'Update Job Posting' : 'Create Job Posting'}
          </button>
        </div>
      </form>
    </div>
  );
};

// Performance Review Form Component
const PerformanceReviewForm = ({ onSubmit, initialData = {}, onCancel, employees }) => {
  const [formData, setFormData] = useState({
    employeeId: initialData.employeeId || '',
    reviewer: initialData.reviewer || '',
    rating: initialData.rating || 5,
    strengths: initialData.strengths || [],
    areasForImprovement: initialData.areasForImprovement || [],
    goals: initialData.goals || [],
    status: initialData.status || 'draft'
  });

  const [strength, setStrength] = useState('');
  const [improvement, setImprovement] = useState('');
  const [goal, setGoal] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const employee = employees.find(emp => emp.id === parseInt(formData.employeeId));
    onSubmit({
      ...formData,
      employeeName: employee ? `${employee.firstName} ${employee.lastName}` : ''
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addItem = (type, value, setValue) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [type]: [...prev[type], value.trim()]
      }));
      setValue('');
    }
  };

  const removeItem = (type, index) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const handleKeyPress = (e, type, value, setValue) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addItem(type, value, setValue);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {initialData.id ? 'Edit Performance Review' : 'Schedule Performance Review'}
          </h2>
          <p className="text-gray-600 mt-1">
            {initialData.id ? 'Update performance review details' : 'Create a new performance review'}
          </p>
        </div>
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-lg hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee *
              </label>
              <select
                name="employeeId"
                value={formData.employeeId}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">Select Employee</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} - {emp.position}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reviewer *
              </label>
              <input
                type="text"
                name="reviewer"
                value={formData.reviewer}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter reviewer's name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating (1-5) *
              </label>
              <select
                name="rating"
                value={formData.rating}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                {[1, 2, 3, 4, 5].map(num => (
                  <option key={num} value={num}>
                    {num} - {num === 1 ? 'Needs Improvement' : num === 2 ? 'Developing' : num === 3 ? 'Meets Expectations' : num === 4 ? 'Exceeds Expectations' : 'Outstanding'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Strengths */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Strengths & Achievements</h3>
          <div className="space-y-4">
            <div className="flex space-x-3">
              <input
                type="text"
                value={strength}
                onChange={(e) => setStrength(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, 'strengths', strength, setStrength)}
                placeholder="Add a strength or achievement"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => addItem('strengths', strength, setStrength)}
                className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
              >
                Add
              </button>
            </div>
            
            <div className="space-y-2">
              {formData.strengths.map((item, index) => (
                <div key={index} className="flex items-center justify-between bg-white px-4 py-3 rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-700">{item}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem('strengths', index)}
                    className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
                  >
                    <span className="text-lg">×</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Areas for Improvement */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Areas for Improvement</h3>
          <div className="space-y-4">
            <div className="flex space-x-3">
              <input
                type="text"
                value={improvement}
                onChange={(e) => setImprovement(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, 'areasForImprovement', improvement, setImprovement)}
                placeholder="Add an area for improvement"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => addItem('areasForImprovement', improvement, setImprovement)}
                className="px-6 py-3 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 transition-colors font-medium"
              >
                Add
              </button>
            </div>
            
            <div className="space-y-2">
              {formData.areasForImprovement.map((item, index) => (
                <div key={index} className="flex items-center justify-between bg-white px-4 py-3 rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-gray-700">{item}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem('areasForImprovement', index)}
                    className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
                  >
                    <span className="text-lg">×</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Goals */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Future Goals & Objectives</h3>
          <div className="space-y-4">
            <div className="flex space-x-3">
              <input
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, 'goals', goal, setGoal)}
                placeholder="Add a goal or objective"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => addItem('goals', goal, setGoal)}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
              >
                Add
              </button>
            </div>
            
            <div className="space-y-2">
              {formData.goals.map((item, index) => (
                <div key={index} className="flex items-center justify-between bg-white px-4 py-3 rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-700">{item}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem('goals', index)}
                    className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
                  >
                    <span className="text-lg">×</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-8 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-lg hover:shadow-xl"
          >
            {initialData.id ? 'Update Review' : 'Schedule Review'}
          </button>
        </div>
      </form>
    </div>
  );
};

// Leave Request Form Component
const LeaveRequestForm = ({ onSubmit, initialData = {}, onCancel, employees }) => {
  const [formData, setFormData] = useState({
    employeeId: initialData.employeeId || '',
    type: initialData.type || 'vacation',
    startDate: initialData.startDate || '',
    endDate: initialData.endDate || '',
    reason: initialData.reason || '',
    status: initialData.status || 'pending'
  });

  const leaveTypes = [
    'vacation', 'sick', 'personal', 'maternity', 
    'paternity', 'bereavement', 'jury_duty', 'other'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    const employee = employees.find(emp => emp.id === parseInt(formData.employeeId));
    onSubmit({
      ...formData,
      employeeName: employee ? `${employee.firstName} ${employee.lastName}` : ''
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getLeaveTypeLabel = (type) => {
    const labels = {
      vacation: 'Vacation',
      sick: 'Sick Leave',
      personal: 'Personal Leave',
      maternity: 'Maternity Leave',
      paternity: 'Paternity Leave',
      bereavement: 'Bereavement Leave',
      jury_duty: 'Jury Duty',
      other: 'Other'
    };
    return labels[type] || type;
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {initialData.id ? 'Edit Leave Request' : 'New Leave Request'}
          </h2>
          <p className="text-gray-600 mt-1">
            {initialData.id ? 'Update leave request details' : 'Submit a new leave request'}
          </p>
        </div>
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-lg hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Employee Selection */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Employee Information</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Employee *
            </label>
            <select
              name="employeeId"
              value={formData.employeeId}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">Select Employee</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName} - {emp.department}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Leave Details */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Leave Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Leave Type *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                {leaveTypes.map(type => (
                  <option key={type} value={type}>
                    {getLeaveTypeLabel(type)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date *
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Leave *
            </label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              required
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Please provide details about your leave request..."
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-8 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-lg hover:shadow-xl"
          >
            {initialData.id ? 'Update Request' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  );
};

// Training Program Form Component
const TrainingProgramForm = ({ onSubmit, initialData = {}, onCancel }) => {
  const [formData, setFormData] = useState({
    title: initialData.title || '',
    instructor: initialData.instructor || '',
    date: initialData.date || '',
    duration: initialData.duration || '',
    cost: initialData.cost || '',
    description: initialData.description || '',
    status: initialData.status || 'scheduled'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {initialData.id ? 'Edit Training Program' : 'New Training Program'}
          </h2>
          <p className="text-gray-600 mt-1">
            {initialData.id ? 'Update training program details' : 'Create a new training program'}
          </p>
        </div>
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-lg hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Program Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Program Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="e.g., Leadership Training"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instructor *
              </label>
              <input
                type="text"
                name="instructor"
                value={formData.instructor}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Instructor name or organization"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration *
              </label>
              <input
                type="text"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="e.g., 2 days, 3 hours"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cost ($)
              </label>
              <input
                type="number"
                name="cost"
                value={formData.cost}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="postponed">Postponed</option>
              </select>
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Describe the training program content and objectives..."
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-8 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-lg hover:shadow-xl"
          >
            {initialData.id ? 'Update Program' : 'Create Program'}
          </button>
        </div>
      </form>
    </div>
  );
};

// Compensation Form Component
const CompensationForm = ({ onSubmit, initialData = {}, onCancel, employees }) => {
  const [formData, setFormData] = useState({
    employeeId: initialData.employeeId || '',
    type: initialData.type || 'salary',
    amount: initialData.amount || '',
    effectiveDate: initialData.effectiveDate || '',
    notes: initialData.notes || ''
  });

  const compensationTypes = ['salary', 'bonus', 'commission', 'raise', 'adjustment', 'other'];

  const handleSubmit = (e) => {
    e.preventDefault();
    const employee = employees.find(emp => emp.id === parseInt(formData.employeeId));
    onSubmit({
      ...formData,
      employeeName: employee ? `${employee.firstName} ${employee.lastName}` : '',
      amount: parseFloat(formData.amount)
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {initialData.id ? 'Edit Compensation' : 'New Compensation Record'}
          </h2>
          <p className="text-gray-600 mt-1">
            {initialData.id ? 'Update compensation details' : 'Add a new compensation record'}
          </p>
        </div>
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-lg hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Compensation Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee *
              </label>
              <select
                name="employeeId"
                value={formData.employeeId}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">Select Employee</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} - {emp.position}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                {compensationTypes.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount ($) *
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Effective Date *
              </label>
              <input
                type="date"
                name="effectiveDate"
                value={formData.effectiveDate}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Additional notes about this compensation record..."
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-8 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-lg hover:shadow-xl"
          >
            {initialData.id ? 'Update Record' : 'Add Record'}
          </button>
        </div>
      </form>
    </div>
  );
};

// =============================================================================
// PAGE COMPONENTS
// =============================================================================

const EmployeesPage = () => {
  const { hrData, addEmployee, updateEmployee, deleteEmployee } = useHRData();
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  const handleAddEmployee = (employeeData) => {
    addEmployee(employeeData);
    setShowForm(false);
  };

  const handleEditEmployee = (employeeData) => {
    updateEmployee(editingEmployee.id, employeeData);
    setEditingEmployee(null);
  };

  const handleDeleteEmployee = (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      deleteEmployee(id);
    }
  };

  if (showForm) {
    return (
      <EmployeeForm
        onSubmit={handleAddEmployee}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  if (editingEmployee) {
    return (
      <EmployeeForm
        initialData={editingEmployee}
        onSubmit={handleEditEmployee}
        onCancel={() => setEditingEmployee(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Employees</h2>
          <p className="text-gray-600">Manage your organization's employees</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-lg hover:shadow-xl"
        >
          Add Employee
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {hrData?.employees.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">👥</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No employees yet</h3>
            <p className="text-gray-500 mb-6">Get started by adding your first employee</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add First Employee
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salary</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {hrData?.employees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {employee.firstName} {employee.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{employee.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{employee.position}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{employee.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${employee.salary?.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        employee.status === 'active' 
                          ? 'bg-green-100 text-green-800'
                          : employee.status === 'on_leave'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {employee.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => setEditingEmployee(employee)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteEmployee(employee.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const RecruitmentPage = () => {
  const { hrData, addJobPosting, updateJobPosting } = useHRData();
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);

  const handleAddJob = (jobData) => {
    addJobPosting(jobData);
    setShowForm(false);
  };

  const handleEditJob = (jobData) => {
    updateJobPosting(editingJob.id, jobData);
    setEditingJob(null);
  };

  if (showForm) {
    return (
      <JobPostingForm
        onSubmit={handleAddJob}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  if (editingJob) {
    return (
      <JobPostingForm
        initialData={editingJob}
        onSubmit={handleEditJob}
        onCancel={() => setEditingJob(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Recruitment</h2>
          <p className="text-gray-600">Manage job postings and applicants</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-lg hover:shadow-xl"
        >
          Post New Job
        </button>
      </div>

      {hrData?.jobPostings.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">💼</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No job postings yet</h3>
          <p className="text-gray-500 mb-6">Create your first job posting to start recruiting</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create First Job Posting
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hrData?.jobPostings.map((job) => (
            <div key={job.id} className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  job.status === 'open' 
                    ? 'bg-green-100 text-green-800'
                    : job.status === 'closed'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {job.status}
                </span>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Department:</span>
                  <span className="font-medium">{job.department}</span>
                </div>
                <div className="flex justify-between">
                  <span>Type:</span>
                  <span className="font-medium">{job.type}</span>
                </div>
                <div className="flex justify-between">
                  <span>Location:</span>
                  <span className="font-medium">{job.location}</span>
                </div>
                <div className="flex justify-between">
                  <span>Salary:</span>
                  <span className="font-medium">{job.salary}</span>
                </div>
                <div className="flex justify-between">
                  <span>Applicants:</span>
                  <span className="font-medium">{job.applicants}</span>
                </div>
              </div>
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => setEditingJob(job)}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Edit
                </button>
                <button className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const PerformancePage = () => {
  const { hrData, addPerformanceReview } = useHRData();
  const [showForm, setShowForm] = useState(false);

  const handleAddReview = (reviewData) => {
    addPerformanceReview(reviewData);
    setShowForm(false);
  };

  if (showForm) {
    return (
      <PerformanceReviewForm
        employees={hrData?.employees || []}
        onSubmit={handleAddReview}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Performance</h2>
          <p className="text-gray-600">Manage employee performance reviews</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-lg hover:shadow-xl"
        >
          Schedule Review
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {hrData?.performanceReviews.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⭐</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No performance reviews yet</h3>
            <p className="text-gray-500 mb-6">Schedule your first performance review</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Schedule First Review
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reviewer</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {hrData?.performanceReviews.map((review) => (
                  <tr key={review.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {review.employeeName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{review.reviewer}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900 mr-2">{review.rating}/5</span>
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-yellow-500 h-2 rounded-full" 
                            style={{ width: `${(review.rating / 5) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{review.reviewDate}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        review.status === 'completed' 
                          ? 'bg-green-100 text-green-800'
                          : review.status === 'scheduled'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {review.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const LeavePage = () => {
  const { hrData, addLeaveRequest, updateLeaveRequest } = useHRData();
  const [showForm, setShowForm] = useState(false);

  const handleAddRequest = (requestData) => {
    addLeaveRequest(requestData);
    setShowForm(false);
  };

  const handleStatusUpdate = (id, status) => {
    updateLeaveRequest(id, status);
  };

  if (showForm) {
    return (
      <LeaveRequestForm
        employees={hrData?.employees || []}
        onSubmit={handleAddRequest}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Leave Management</h2>
          <p className="text-gray-600">Manage employee leave requests</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-lg hover:shadow-xl"
        >
          New Request
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {hrData?.leaveRequests.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🏖️</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No leave requests yet</h3>
            <p className="text-gray-500 mb-6">Submit your first leave request</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Submit First Request
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {hrData?.leaveRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {request.employeeName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{request.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.startDate} to {request.endDate}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{request.reason}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        request.status === 'approved' 
                          ? 'bg-green-100 text-green-800'
                          : request.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {request.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(request.id, 'approved')}
                            className="text-green-600 hover:text-green-900"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(request.id, 'rejected')}
                            className="text-red-600 hover:text-red-900"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const TrainingPage = () => {
  const { hrData, addTrainingProgram } = useHRData();
  const [showForm, setShowForm] = useState(false);

  const handleAddProgram = (programData) => {
    addTrainingProgram(programData);
    setShowForm(false);
  };

  if (showForm) {
    return (
      <TrainingProgramForm
        onSubmit={handleAddProgram}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Training Programs</h2>
          <p className="text-gray-600">Manage employee training and development</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-lg hover:shadow-xl"
        >
          New Program
        </button>
      </div>

      {hrData?.trainingPrograms.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🎓</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No training programs yet</h3>
          <p className="text-gray-500 mb-6">Create your first training program</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create First Program
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hrData?.trainingPrograms.map((program) => (
            <div key={program.id} className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{program.title}</h3>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  program.status === 'scheduled' 
                    ? 'bg-blue-100 text-blue-800'
                    : program.status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : program.status === 'cancelled'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {program.status}
                </span>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Instructor:</span>
                  <span className="font-medium">{program.instructor}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span className="font-medium">{program.date}</span>
                </div>
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span className="font-medium">{program.duration}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cost:</span>
                  <span className="font-medium">${program.cost?.toLocaleString()}</span>
                </div>
              </div>
              {program.description && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 line-clamp-2">{program.description}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const CompensationPage = () => {
  const { hrData, addCompensationRecord } = useHRData();
  const [showForm, setShowForm] = useState(false);

  const handleAddRecord = (recordData) => {
    addCompensationRecord(recordData);
    setShowForm(false);
  };

  if (showForm) {
    return (
      <CompensationForm
        employees={hrData?.employees || []}
        onSubmit={handleAddRecord}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Compensation</h2>
          <p className="text-gray-600">Manage employee compensation records</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-lg hover:shadow-xl"
        >
          Add Record
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {hrData?.compensationRecords.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💰</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No compensation records yet</h3>
            <p className="text-gray-500 mb-6">Add your first compensation record</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add First Record
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Effective Date</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {hrData?.compensationRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {record.employeeName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{record.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${record.amount?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.effectiveDate}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{record.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const AnalyticsPage = () => {
  const { hrData } = useHRData();

  const departmentStats = hrData?.employees.reduce((acc, employee) => {
    acc[employee.department] = (acc[employee.department] || 0) + 1;
    return acc;
  }, {});

  const statusStats = hrData?.employees.reduce((acc, employee) => {
    acc[employee.status] = (acc[employee.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
        <p className="text-gray-600">HR analytics and insights</p>
      </div>

      {hrData?.employees.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📊</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No data available yet</h3>
          <p className="text-gray-500">Add some employees to see analytics</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Department Distribution */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Distribution</h3>
            <div className="space-y-3">
              {departmentStats && Object.entries(departmentStats).map(([dept, count]) => (
                <div key={dept} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{dept}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ 
                          width: `${(count / hrData.employees.length) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-8">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Employee Status */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Employee Status</h3>
            <div className="space-y-3">
              {statusStats && Object.entries(statusStats).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 capitalize">{status.replace('_', ' ')}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          status === 'active' ? 'bg-green-500' :
                          status === 'on_leave' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ 
                          width: `${(count / hrData.employees.length) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-8">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Leave Statistics */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Leave Statistics</h3>
            <div className="space-y-4">
              {hrData?.leaveRequests.length > 0 ? (
                Object.entries(hrData.leaveRequests.reduce((acc, request) => {
                  acc[request.status] = (acc[request.status] || 0) + 1;
                  return acc;
                }, {})).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 capitalize">{status}</span>
                    <span className="text-sm text-gray-600">{count} requests</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No leave requests yet</p>
              )}
            </div>
          </div>

          {/* Performance Overview */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h3>
            <div className="space-y-4">
              {hrData?.performanceReviews.length > 0 ? (
                hrData.performanceReviews.slice(0, 5).map((review) => (
                  <div key={review.id} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{review.employeeName}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-yellow-500 h-2 rounded-full" 
                          style={{ width: `${(review.rating / 5) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-8">{review.rating}/5</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No performance reviews yet</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// =============================================================================
// MAIN HR DASHBOARD COMPONENT
// =============================================================================

// Skeleton loader component
const DashboardSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-4">
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions & Recent Activity Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-6 animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="p-5 rounded-xl bg-gray-200 animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-300 rounded-xl"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-6 animate-pulse"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start space-x-4 p-4 rounded-xl border border-gray-100 animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Error state component
const DashboardErrorState = ({ error, onRetry }) => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 max-w-md w-full text-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-2xl">⚠️</span>
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Dashboard</h2>
      <p className="text-gray-600 mb-2">{error}</p>
      <p className="text-sm text-gray-500 mb-6">
        Please check your connection and try again.
      </p>
      <div className="space-y-3">
        <button
          onClick={onRetry}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Try Again
        </button>
        <button
          onClick={() => window.location.reload()}
          className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
        >
          Reload Page
        </button>
      </div>
    </div>
  </div>
);

// Main HR Dashboard Component
const HRDashboard = () => {
  const { 
    user, 
    logout, 
    effectiveUserRole,
    organization
  } = useAuthStore();
  
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const {
    loading,
    error,
    stats,
    recentActivity,
    lastUpdated
  } = useHRDashboardData();

  // Navigation items with role-based access
  const navItems = useMemo(() => {
    const baseItems = [
      { path: '/dashboard/hr', label: 'Overview', icon: '📊', exact: true, roles: ['OWNER', 'EXECUTIVE', 'ADMIN', 'HR', 'MANAGER'] },
      { path: '/dashboard/hr/employees', label: 'Employees', icon: '👥', roles: ['OWNER', 'EXECUTIVE', 'ADMIN', 'HR', 'MANAGER'] },
      { path: '/dashboard/hr/recruitment', label: 'Recruitment', icon: '💼', roles: ['OWNER', 'EXECUTIVE', 'ADMIN', 'HR'] },
      { path: '/dashboard/hr/performance', label: 'Performance', icon: '⭐', roles: ['OWNER', 'EXECUTIVE', 'ADMIN', 'HR', 'MANAGER'] },
      { path: '/dashboard/hr/leave', label: 'Leave', icon: '🏖️', roles: ['OWNER', 'EXECUTIVE', 'ADMIN', 'HR', 'MANAGER'] },
      { path: '/dashboard/hr/training', label: 'Training', icon: '🎓', roles: ['OWNER', 'EXECUTIVE', 'ADMIN', 'HR'] },
      { path: '/dashboard/hr/compensation', label: 'Compensation', icon: '💰', roles: ['OWNER', 'EXECUTIVE', 'ADMIN', 'HR'] },
      { path: '/dashboard/hr/analytics', label: 'Analytics', icon: '📈', roles: ['OWNER', 'EXECUTIVE', 'ADMIN', 'HR'] },
    ];

    return baseItems.filter(item => item.roles.includes(effectiveUserRole));
  }, [effectiveUserRole]);

  // Quick actions with role-based access
  const quickActions = useMemo(() => {
    const actions = [
      { 
        label: 'Add Employee', 
        icon: '👤', 
        path: '/dashboard/hr/employees', 
        color: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800',
        description: 'Add new team member',
        roles: ['OWNER', 'EXECUTIVE', 'ADMIN', 'HR']
      },
      { 
        label: 'Post Job', 
        icon: '💼', 
        path: '/dashboard/hr/recruitment', 
        color: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800',
        description: 'Create new job posting',
        roles: ['OWNER', 'EXECUTIVE', 'ADMIN', 'HR']
      },
      { 
        label: 'Schedule Review', 
        icon: '⭐', 
        path: '/dashboard/hr/performance', 
        color: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800',
        description: 'Schedule performance review',
        roles: ['OWNER', 'EXECUTIVE', 'ADMIN', 'HR', 'MANAGER']
      },
      { 
        label: 'Request Leave', 
        icon: '🏖️', 
        path: '/dashboard/hr/leave', 
        color: 'bg-gradient-to-r from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950',
        description: 'Submit leave request',
        roles: ['OWNER', 'EXECUTIVE', 'ADMIN', 'HR', 'MANAGER']
      },
    ];

    return actions.filter(action => action.roles.includes(effectiveUserRole));
  }, [effectiveUserRole]);

  const formatDate = useCallback((date) => {
    if (!date) return 'Unknown';
    
    try {
      const now = new Date();
      const diffTime = Math.abs(now - new Date(date));
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      return new Date(date).toLocaleDateString();
    } catch (error) {
      console.warn('Error formatting date:', error);
      return 'Invalid date';
    }
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  const handleRetry = useCallback(() => {
    window.location.reload();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isProfileOpen && !event.target.closest('.profile-dropdown')) {
        setIsProfileOpen(false);
      }
      if (isNotificationsOpen && !event.target.closest('.notifications-dropdown')) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileOpen, isNotificationsOpen]);

  // Show loading state
  if (loading && !stats) {
    return <DashboardSkeleton />;
  }

  // Show error state
  if (error && !stats) {
    return <DashboardErrorState error={error} onRetry={handleRetry} />;
  }

  return (
    <HRDashboardErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
        {/* Header */}
        <header className="bg-gradient-to-r from-blue-900 to-blue-800 shadow-2xl border-b border-blue-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo and Brand */}
              <div className="flex items-center space-x-4">
                <Link to="/dashboard" className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <span className="text-white text-lg font-bold">HR</span>
                  </div>
                  <div>
                    <h1 className="text-white text-xl font-bold">HR Dashboard</h1>
                    <p className="text-blue-200 text-sm">{organization?.name || 'Organization'}</p>
                  </div>
                </Link>
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center space-x-1">
                {navItems.map((item) => {
                  const isActive = item.exact 
                    ? location.pathname === item.path
                    : location.pathname.startsWith(item.path);
                  
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-white/20 text-white shadow-lg'
                          : 'text-blue-100 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span className="mr-2">{item.icon}</span>
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              {/* User Menu */}
              <div className="flex items-center space-x-4">
                {/* Notifications */}
                <div className="relative notifications-dropdown">
                  <button
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    className="p-2 text-blue-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors relative"
                  >
                    <span className="text-lg">🔔</span>
                  </button>
                </div>

                {/* Profile Dropdown */}
                <div className="relative profile-dropdown">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-3 p-2 text-blue-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {user?.first_name?.[0] || user?.email?.[0] || 'U'}
                      </span>
                    </div>
                    <span className="hidden sm:block text-sm font-medium">
                      {user?.first_name || user?.email}
                    </span>
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{user?.first_name} {user?.last_name}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                        <p className="text-xs text-blue-600 mt-1">{effectiveUserRole}</p>
                      </div>
                      <Link
                        to="/dashboard/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Your Profile
                      </Link>
                      <Link
                        to="/dashboard/settings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 border-t border-gray-100"
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </div>

                {/* Mobile menu button */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="lg:hidden p-2 text-blue-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <span className="text-lg">☰</span>
                </button>
              </div>
            </div>

            {/* Mobile Navigation */}
            {isMobileMenuOpen && (
              <div className="lg:hidden border-t border-blue-700 py-4">
                <nav className="grid grid-cols-2 gap-2">
                  {navItems.map((item) => {
                    const isActive = item.exact 
                      ? location.pathname === item.path
                      : location.pathname.startsWith(item.path);
                    
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? 'bg-white/20 text-white shadow-lg'
                            : 'text-blue-100 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <span className="mr-2">{item.icon}</span>
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            )}
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Last Updated Indicator */}
          {lastUpdated && (
            <div className="flex items-center justify-between mb-6">
              <div className="text-sm text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
              {loading && (
                <div className="flex items-center space-x-2 text-sm text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                  <span>Updating...</span>
                </div>
              )}
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats && [
              {
                label: 'Total Employees',
                value: stats.totalEmployees || 0,
                icon: '👥',
                change: `${stats.newHires || 0} new this month`,
                changeColor: 'text-green-600'
              },
              {
                label: 'Active Employees',
                value: stats.activeEmployees || 0,
                icon: '✅',
                change: `${stats.totalEmployees > 0 ? ((stats.activeEmployees / stats.totalEmployees) * 100).toFixed(1) : 0}% active rate`,
                changeColor: 'text-gray-600'
              },
              {
                label: 'Departments',
                value: stats.departments || 0,
                icon: '🏢',
                change: 'Across organization',
                changeColor: 'text-gray-600'
              },
              {
                label: 'Pending Requests',
                value: stats.pendingRequests || 0,
                icon: '⏳',
                change: 'Requiring attention',
                changeColor: 'text-blue-600'
              }
            ].map((stat, index) => (
              <div key={stat.label} className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl flex items-center justify-center">
                    <span className="text-2xl text-blue-600">{stat.icon}</span>
                  </div>
                </div>
                <div className="mt-4">
                  <span className={`text-sm ${stat.changeColor}`}>{stat.change}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
                  <span className="text-sm text-gray-500">{quickActions.length} available</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quickActions.map((action) => (
                    <Link 
                      key={action.label} 
                      to={action.path}
                      className={`p-5 rounded-xl text-white ${action.color} transition-all duration-200 hover:scale-105 hover:shadow-lg`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                          <span className="text-2xl">{action.icon}</span>
                        </div>
                        <div>
                          <p className="font-bold text-lg">{action.label}</p>
                          <p className="text-sm opacity-90 mt-1">{action.description}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
                <span className="text-sm text-gray-500">{recentActivity.length} items</span>
              </div>
              <div className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity) => (
                    <div 
                      key={activity.id} 
                      className="flex items-start space-x-4 p-4 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors"
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        activity.type === 'join' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        <span className="text-xl">{activity.type === 'join' ? '👤' : '📨'}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{formatDate(activity.timestamp)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">📝</span>
                    </div>
                    <p>No recent activity</p>
                    <p className="text-sm mt-1">Activity will appear here as you add data</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Outlet for nested routes */}
          <div className="mt-8">
            <Routes>
              <Route path="/" element={
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl text-blue-600">👋</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to HR Dashboard</h2>
                  <p className="text-gray-600 mb-6">
                    Manage your employees, recruitment, performance, and more from one place.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-2xl mb-2">👥</div>
                      <h3 className="font-semibold mb-1">Employees</h3>
                      <p className="text-sm text-gray-600">Manage team members</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-2xl mb-2">💼</div>
                      <h3 className="font-semibold mb-1">Recruitment</h3>
                      <p className="text-sm text-gray-600">Post jobs and track applicants</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-2xl mb-2">⭐</div>
                      <h3 className="font-semibold mb-1">Performance</h3>
                      <p className="text-sm text-gray-600">Track employee reviews</p>
                    </div>
                  </div>
                </div>
              } />
              <Route path="/employees" element={<EmployeesPage />} />
              <Route path="/recruitment" element={<RecruitmentPage />} />
              <Route path="/performance" element={<PerformancePage />} />
              <Route path="/leave" element={<LeavePage />} />
              <Route path="/training" element={<TrainingPage />} />
              <Route path="/compensation" element={<CompensationPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
            </Routes>
            <Outlet />
          </div>
        </main>
      </div>
    </HRDashboardErrorBoundary>
  );
};

export default HRDashboard;