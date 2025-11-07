// src/pages/dashboard/Training.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';

const Training = () => {
  const { 
    user, 
    members, 
    getMembersData,
    // HR Dashboard methods
    getHRTraining,
    performHRTrainingAction,
    hrDashboard,
    isLoading,
    error,
    hasHRDashboardAccess,
    clearHRCache
  } = useAuthStore();

  const [activeTab, setActiveTab] = useState('overview');
  const [localLoading, setLocalLoading] = useState(true);
  const [trainingPrograms, setTrainingPrograms] = useState([]);
  const [employeeTrainings, setEmployeeTrainings] = useState([]);
  const [skills, setSkills] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  // Load training data from HR dashboard
  const loadTrainingData = async () => {
    if (!hasHRDashboardAccess) {
      console.warn('User does not have HR dashboard access');
      setLocalLoading(false);
      return;
    }

    setLocalLoading(true);
    try {
      const result = await getHRTraining();
      
      if (result.success && result.data) {
        // Map the API data to component state
        const trainingData = result.data;
        
        // Set programs data
        if (trainingData.programs) {
          setTrainingPrograms(trainingData.programs);
        } else if (trainingData.trainingPrograms) {
          setTrainingPrograms(trainingData.trainingPrograms);
        }
        
        // Set enrollments data
        if (trainingData.enrollments) {
          setEmployeeTrainings(trainingData.enrollments);
        } else if (trainingData.employeeTrainings) {
          setEmployeeTrainings(trainingData.employeeTrainings);
        }
        
        // Set skills data
        if (trainingData.skills) {
          setSkills(trainingData.skills);
        } else if (trainingData.skillGaps) {
          setSkills(trainingData.skillGaps);
        }
      } else {
        // Fallback to mock data if API fails
        console.warn('Using fallback training data');
        loadFallbackData();
      }
    } catch (error) {
      console.error('Error loading training data:', error);
      loadFallbackData();
    } finally {
      setLocalLoading(false);
    }
  };

  // Fallback mock data (same as before, but extracted)
  const loadFallbackData = () => {
    const mockTrainingPrograms = [
      {
        id: 1,
        title: 'Leadership Development Program',
        description: 'Advanced leadership skills for managers and team leads',
        category: 'Leadership',
        duration: '8 weeks',
        level: 'Advanced',
        enrolled: 12,
        capacity: 20,
        status: 'active',
        startDate: '2024-03-01',
        endDate: '2024-04-26',
        instructor: 'Dr. Sarah Johnson',
        cost: 2500
      },
      {
        id: 2,
        title: 'Project Management Fundamentals',
        description: 'Essential project management methodologies and tools',
        category: 'Project Management',
        duration: '6 weeks',
        level: 'Intermediate',
        enrolled: 18,
        capacity: 25,
        status: 'active',
        startDate: '2024-02-15',
        endDate: '2024-03-28',
        instructor: 'Mike Chen',
        cost: 1800
      },
      {
        id: 3,
        title: 'Advanced React Development',
        description: 'Master React with hooks, context, and performance optimization',
        category: 'Technical',
        duration: '4 weeks',
        level: 'Advanced',
        enrolled: 8,
        capacity: 15,
        status: 'upcoming',
        startDate: '2024-03-15',
        endDate: '2024-04-12',
        instructor: 'Emily Davis',
        cost: 2200
      }
    ];

    const mockEmployeeTrainings = [
      {
        id: 1,
        employeeId: 101,
        programId: 1,
        programName: 'Leadership Development Program',
        status: 'in-progress',
        progress: 65,
        startDate: '2024-03-01',
        expectedCompletion: '2024-04-26',
        lastActivity: '2024-03-20'
      },
      {
        id: 2,
        employeeId: 102,
        programId: 2,
        programName: 'Project Management Fundamentals',
        status: 'completed',
        progress: 100,
        startDate: '2024-02-15',
        completionDate: '2024-03-28',
        score: 92
      }
    ];

    const mockSkills = [
      { id: 1, name: 'Leadership', employees: 8, gap: 3 },
      { id: 2, name: 'Project Management', employees: 15, gap: 2 },
      { id: 3, name: 'React Development', employees: 6, gap: 5 },
      { id: 4, name: 'Data Analysis', employees: 4, gap: 7 },
      { id: 5, name: 'Communication', employees: 12, gap: 1 }
    ];

    setTrainingPrograms(mockTrainingPrograms);
    setEmployeeTrainings(mockEmployeeTrainings);
    setSkills(mockSkills);
  };

  // Handle training actions (create, update, delete programs)
  const handleTrainingAction = async (actionType, data) => {
    setActionLoading(true);
    try {
      const result = await performHRTrainingAction({
        action_type: actionType,
        ...data
      });

      if (result.success) {
        // Refresh training data after successful action
        await loadTrainingData();
        return { success: true, message: result.message };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Training action error:', error);
      return { success: false, error: error.message };
    } finally {
      setActionLoading(false);
    }
  };

  // Handle program creation
  const handleCreateProgram = async (programData) => {
    return await handleTrainingAction('create_program', programData);
  };

  // Handle program enrollment
  const handleEnrollEmployee = async (enrollmentData) => {
    return await handleTrainingAction('enroll_employee', enrollmentData);
  };

  // Handle program update
  const handleUpdateProgram = async (programId, updateData) => {
    return await handleTrainingAction('update_program', {
      program_id: programId,
      ...updateData
    });
  };

  // Handle training progress update
  const handleUpdateProgress = async (enrollmentId, progressData) => {
    return await handleTrainingAction('update_progress', {
      enrollment_id: enrollmentId,
      ...progressData
    });
  };

  // Refresh data when tab changes or component mounts
  useEffect(() => {
    loadTrainingData();
  }, [activeTab]);

  // Refresh members data
  useEffect(() => {
    getMembersData();
  }, [getMembersData]);

  const getStatusColor = (status) => {
    const colors = {
      'active': 'bg-green-100 text-green-800',
      'upcoming': 'bg-blue-100 text-blue-800',
      'completed': 'bg-gray-100 text-gray-800',
      'in-progress': 'bg-yellow-100 text-yellow-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getLevelColor = (level) => {
    const colors = {
      'beginner': 'bg-green-100 text-green-800',
      'intermediate': 'bg-blue-100 text-blue-800',
      'advanced': 'bg-purple-100 text-purple-800'
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  const calculateCompletionRate = () => {
    const completed = employeeTrainings.filter(t => t.status === 'completed').length;
    const total = employeeTrainings.length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const getUpcomingTrainings = () => {
    return trainingPrograms.filter(program => program.status === 'upcoming');
  };

  const getActiveTrainings = () => {
    return trainingPrograms.filter(program => program.status === 'active');
  };

  // Show loading state
  if (localLoading || isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Training & Development</h1>
          <p className="text-gray-600">Manage employee training programs and skill development</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading training data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && trainingPrograms.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Training & Development</h1>
          <p className="text-gray-600">Manage employee training programs and skill development</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">Error Loading Data</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={loadTrainingData}
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
          <h1 className="text-2xl font-bold text-gray-900">Training & Development</h1>
          <p className="text-gray-600">Manage employee training programs and skill development</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => loadTrainingData()}
            disabled={actionLoading}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
          >
            Refresh Data
          </button>
          <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium">
            Export Report
          </button>
          <Link
            to="/dashboard/hr/training/new"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Create Program
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Programs</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{getActiveTrainings().length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">📚</span>
            </div>
          </div>
          <div className="mt-4 text-sm text-green-600">
            <span>+2 this month</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Employees Enrolled</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {trainingPrograms.reduce((sum, program) => sum + program.enrolled, 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">👥</span>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <span>Across all programs</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completion Rate</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{calculateCompletionRate()}%</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">✅</span>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <span>Overall success rate</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Skill Gaps</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {skills.reduce((sum, skill) => sum + skill.gap, 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">🎯</span>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <span>Identified gaps</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {['overview', 'programs', 'enrollments', 'skills', 'reports'].map((tab) => (
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
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upcoming Programs */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Programs</h3>
                  <div className="space-y-4">
                    {getUpcomingTrainings().map((program) => (
                      <div key={program.id} className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900">{program.title}</h4>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(program.status)}`}>
                            {program.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{program.description}</p>
                        <div className="flex justify-between items-center text-sm text-gray-500">
                          <span>Starts: {new Date(program.startDate).toLocaleDateString()}</span>
                          <span>{program.enrolled}/{program.capacity} enrolled</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skill Gaps */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Skill Gaps</h3>
                  <div className="space-y-3">
                    {skills.slice(0, 5).map((skill) => (
                      <div key={skill.id} className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-gray-900">{skill.name}</span>
                          <span className="text-sm text-gray-500">{skill.gap} gaps</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ 
                              width: `${Math.min(100, (skill.employees / (skill.employees + skill.gap)) * 100)}%` 
                            }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>{skill.employees} employees skilled</span>
                          <span>{skill.gap} need training</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Enrollments */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Enrollments</h3>
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Employee
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Program
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Progress
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {employeeTrainings.slice(0, 5).map((enrollment) => (
                        <tr key={enrollment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              Employee #{enrollment.employeeId}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{enrollment.programName}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(enrollment.status)}`}>
                              {enrollment.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                <div 
                                  className="bg-green-600 h-2 rounded-full" 
                                  style={{ width: `${enrollment.progress}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600">{enrollment.progress}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                            <button className="text-gray-600 hover:text-gray-900">Update</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Programs Tab */}
          {activeTab === 'programs' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Training Programs</h3>
                <div className="flex space-x-3">
                  <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option>All Categories</option>
                    <option>Leadership</option>
                    <option>Technical</option>
                    <option>Project Management</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Search programs..."
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trainingPrograms.map((program) => (
                  <div key={program.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-semibold text-gray-900">{program.title}</h4>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(program.status)}`}>
                          {program.status}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-4">{program.description}</p>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Category:</span>
                          <span className="text-gray-900">{program.category}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Level:</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getLevelColor(program.level)}`}>
                            {program.level}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Duration:</span>
                          <span className="text-gray-900">{program.duration}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Instructor:</span>
                          <span className="text-gray-900">{program.instructor}</span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Enrollment</span>
                          <span>{program.enrolled}/{program.capacity}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(program.enrolled / program.capacity) * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-900">${program.cost}</span>
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                            Edit
                          </button>
                          <button className="text-green-600 hover:text-green-800 text-sm font-medium">
                            Enroll
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Enrollments Tab */}
          {activeTab === 'enrollments' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Training Enrollments</h3>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                  New Enrollment
                </button>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Program
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Start Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Progress
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {employeeTrainings.map((enrollment) => (
                      <tr key={enrollment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            Employee #{enrollment.employeeId}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{enrollment.programName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(enrollment.startDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(enrollment.status)}`}>
                            {enrollment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full" 
                                style={{ width: `${enrollment.progress}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600">{enrollment.progress}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {enrollment.score ? `${enrollment.score}%` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-3">
                            <button className="text-blue-600 hover:text-blue-900">View</button>
                            <button className="text-green-600 hover:text-green-900">Update</button>
                            <button className="text-red-600 hover:text-red-900">Withdraw</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Skills Tab */}
          {activeTab === 'skills' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Skills Inventory</h3>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                  Add Skill
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {skills.map((skill) => (
                  <div key={skill.id} className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-semibold text-gray-900">{skill.name}</h4>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                        {skill.gap} gaps
                      </span>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Skill Coverage</span>
                        <span>{skill.employees} / {skill.employees + skill.gap}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full"
                          style={{ 
                            width: `${Math.min(100, (skill.employees / (skill.employees + skill.gap)) * 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        {Math.round((skill.employees / (skill.employees + skill.gap)) * 100)}% coverage
                      </span>
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                          View Employees
                        </button>
                        <button className="text-green-600 hover:text-green-800 text-sm font-medium">
                          Plan Training
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Training Reports & Analytics</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Training Completion</h4>
                  <div className="text-3xl font-bold text-gray-900 mb-2">{calculateCompletionRate()}%</div>
                  <p className="text-sm text-gray-600">Overall completion rate</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Training Budget</h4>
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    ${trainingPrograms.reduce((sum, program) => sum + program.cost, 0).toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-600">Total program costs</p>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Program Performance</h4>
                <div className="space-y-4">
                  {trainingPrograms.map((program) => (
                    <div key={program.id} className="flex items-center justify-between">
                      <span className="text-sm text-gray-900">{program.title}</span>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600">{program.enrolled} enrolled</span>
                        <span className="text-sm text-gray-600">
                          ${program.cost.toLocaleString()}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(program.status)}`}>
                          {program.status}
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

export default Training;