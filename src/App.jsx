import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import useAuthStore from "./stores/authStore";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Organization from "./pages/Organization";
import ForgotPassword from "./pages/ForgotPassword";
import PasswordReset from "./components/PasswordReset";
import JoinOrganization from "./pages/Joinorganization";
import EmailVerification from "./pages/EmailVerification";

// Dashboard Components
import HRDashboard from "./components/dashboards/HRDashboard";
import OverviewDashboard from "./components/dashboards/OverviewDashboard";
import FinancialDashboard from "./components/dashboards/FinancialDashboard";
import ManagerDashboard from "./components/dashboards/ManagerDashboard";
import SocialWorkerDashboard from "./components/dashboards/SocialWorkerDashboard";
import CaseDashboard from "./components/dashboards/CaseDashboard";

// 📊 NEW: SHEETS - Import the Sheets Components
import SheetsDashboard from "./components/sheets/SheetsDashboard";
import SpreadsheetEditor from "./components/sheets/SpreadsheetEditor";

// 📊 EDITOR - Import the Editor Components
import EditorDashboard from "./components/editor/EditorDashboard";
import DocumentEditor from "./components/editor/DocumentEditor";

// 💬 CHAT - Import the Chat Components
import { AuthProvider } from "./contexts/chat/AuthContext";
import { WebSocketProvider } from "./contexts/chat/WebSocketContext";
import { NotificationProvider } from "./contexts/chat/NotificationContext";
import WorkspaceSelector from "./components/chat/workspace/WorkspaceSelector";
import ChannelChat from "./components/chat/chat/ChannelChat";
import DirectMessages from "./components/chat/chat/DirectMessages";
import ChatDashboard from "./components/chat/dashboard/ChatDashboard";

// HR Dashboard Pages (Existing Imports)
import Employees from "./pages/dashboard/employees/Employees";
import Recruitment from "./pages/dashboard/Recruitment";
import Performance from "./pages/dashboard/Performance";
import LeaveManagement from "./pages/dashboard/LeaveManagement";
import Training from "./pages/dashboard/Training";
import Compensation from "./pages/dashboard/Compensation";
import Analytics from "./pages/dashboard/Analytics";

// Custom hook for theme management
const useTheme = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) return JSON.parse(saved);
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  return { isDarkMode, toggleTheme };
};

// Theme Toggle Component
const ThemeToggle = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
      aria-label="Toggle theme"
    >
      {isDarkMode ? (
        // Sun icon for light mode
        <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
        </svg>
      ) : (
        // Moon icon for dark mode
        <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      )}
    </button>
  );
};

// Export ThemeToggle for use in other components
export { ThemeToggle, useTheme };

// Add this to your app to track all failed requests
window.addEventListener('error', (event) => {
  if (event.target && event.target.src) {
    console.log('🚨 Failed to load resource:', event.target.src);
  }
});

// Or track fetch errors
const originalFetch = window.fetch;
window.fetch = function(...args) {
  return originalFetch.apply(this, args).then(response => {
    if (!response.ok) {
      console.log('🚨 Fetch error:', response.status, response.url);
    }
    return response;
  });
};

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    console.error("Error caught by boundary:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-red-200 dark:border-red-800">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900">
                <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="mt-3 text-lg font-medium text-gray-900 dark:text-white">Something went wrong</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {this.state.error?.message || "An unexpected error occurred in this component."}
              </p>
              <div className="mt-4">
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                  onClick={this.handleRetry}
                >
                  Try Again
                </button>
              </div>
              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="mt-4 text-left">
                  <summary className="text-sm text-gray-500 dark:text-gray-400 cursor-pointer">Error Details</summary>
                  <pre className="mt-2 text-xs text-gray-400 dark:text-gray-500 overflow-auto">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 💰 NEW: Financial Dashboard Pages
const FinancialOverview = () => (
  <div className="p-6 bg-white dark:bg-gray-900 min-h-screen">
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
      Financial Overview
    </h2>
    <p className="text-gray-600 dark:text-gray-300">Key financial metrics and charts.</p>
  </div>
);
const Invoices = () => (
  <div className="p-6 bg-white dark:bg-gray-900 min-h-screen">
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
      Invoices & Billing
    </h2>
    <p className="text-gray-600 dark:text-gray-300">Manage incoming and outgoing invoices.</p>
  </div>
);
const ProfitAndLoss = () => (
  <div className="p-6 bg-white dark:bg-gray-900 min-h-screen">
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Profit & Loss</h2>
    <p className="text-gray-600 dark:text-gray-300">Generate P&L statements.</p>
  </div>
);
const Budgets = () => (
  <div className="p-6 bg-white dark:bg-gray-900 min-h-screen">
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
      Budgeting & Forecasting
    </h2>
    <p className="text-gray-600 dark:text-gray-300">Track and plan organizational budgets.</p>
  </div>
);

// 👨‍💼 NEW: Manager Dashboard Pages
const ManagerOverview = () => (
  <div className="p-6 bg-white dark:bg-gray-900 min-h-screen">
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Manager Overview</h2>
    <p className="text-gray-600 dark:text-gray-300">Team performance and management dashboard.</p>
  </div>
);
const TeamManagement = () => (
  <div className="p-6 bg-white dark:bg-gray-900 min-h-screen">
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Team Management</h2>
    <p className="text-gray-600 dark:text-gray-300">Manage your team members and assignments.</p>
  </div>
);
const PerformanceReviews = () => (
  <div className="p-6 bg-white dark:bg-gray-900 min-h-screen">
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
      Performance Reviews
    </h2>
    <p className="text-gray-600 dark:text-gray-300">
      Schedule and conduct performance evaluations.
    </p>
  </div>
);
const Approvals = () => (
  <div className="p-6 bg-white dark:bg-gray-900 min-h-screen">
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Pending Approvals</h2>
    <p className="text-gray-600 dark:text-gray-300">Review and approve team requests.</p>
  </div>
);
const TrainingManagement = () => (
  <div className="p-6 bg-white dark:bg-gray-900 min-h-screen">
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
      Training Management
    </h2>
    <p className="text-gray-600 dark:text-gray-300">
      Assign and track team training requirements.
    </p>
  </div>
);
const TeamAnalytics = () => (
  <div className="p-6 bg-white dark:bg-gray-900 min-h-screen">
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Team Analytics</h2>
    <p className="text-gray-600 dark:text-gray-300">Performance metrics and team insights.</p>
  </div>
);

// 👨‍⚕️ NEW: Social Worker Dashboard Pages - UPDATED TO MATCH THE COMPONENT
const CaseOverview = () => (
  <div className="p-6 bg-white dark:bg-gray-900 min-h-screen">
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
      Case Overview Details
    </h2>
    <p className="text-gray-600 dark:text-gray-300">
      Detailed view of all active cases with advanced filtering options.
    </p>
    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
      <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Case Management Features</h3>
      <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
        <li>Advanced case search and filtering</li>
        <li>Case assignment and reassignment</li>
        <li>Priority case management</li>
        <li>Case history and audit trails</li>
      </ul>
    </div>
  </div>
);

const ClientManagement = () => (
  <div className="p-6 bg-white dark:bg-gray-900 min-h-screen">
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Client Management</h2>
    <p className="text-gray-600 dark:text-gray-300">
      Comprehensive client information and case management system.
    </p>
    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <h3 className="font-semibold text-green-800 dark:text-green-300">Client Profiles</h3>
        <p className="text-sm text-green-700 dark:text-green-400">
          Complete client demographics and history
        </p>
      </div>
      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
        <h3 className="font-semibold text-purple-800 dark:text-purple-300">Assessment Tools</h3>
        <p className="text-sm text-purple-700 dark:text-purple-400">
          Standardized assessment forms and tools
        </p>
      </div>
    </div>
  </div>
);

const VisitScheduling = () => (
  <div className="p-6 bg-white dark:bg-gray-900 min-h-screen">
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
      Visit Scheduling & Calendar
    </h2>
    <p className="text-gray-600 dark:text-gray-300">
      Schedule, reschedule, and track all client visits.
    </p>
    <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
      <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Scheduling Features</h3>
      <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
        <li>Calendar integration</li>
        <li>Automated reminders</li>
        <li>Visit outcome tracking</li>
        <li>Route optimization</li>
      </ul>
    </div>
  </div>
);

const CaseNotes = () => (
  <div className="p-6 bg-white dark:bg-gray-900 min-h-screen">
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
      Case Notes & Documentation
    </h2>
    <p className="text-gray-600 dark:text-gray-300">
      Secure documentation system for all client interactions and progress notes.
    </p>
    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h3 className="font-semibold text-blue-800 dark:text-blue-300">Progress Notes</h3>
        <p className="text-sm text-blue-700 dark:text-blue-400">
          SOAP notes and progress documentation
        </p>
      </div>
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <h3 className="font-semibold text-red-800 dark:text-red-300">Incident Reports</h3>
        <p className="text-sm text-red-700 dark:text-red-400">Critical incident documentation</p>
      </div>
    </div>
  </div>
);

const ResourceManagement = () => (
  <div className="p-6 bg-white dark:bg-gray-900 min-h-screen">
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
      Resource Management
    </h2>
    <p className="text-gray-600 dark:text-gray-300">
      Manage and track community resources, referrals, and support services.
    </p>
    <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
      <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Available Resources</h3>
      <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
        <li>Housing assistance programs</li>
        <li>Mental health services</li>
        <li>Substance abuse treatment</li>
        <li>Employment support services</li>
        <li>Educational resources</li>
      </ul>
    </div>
  </div>
);

const SocialWorkerAnalytics = () => (
  <div className="p-6 bg-white dark:bg-gray-900 min-h-screen">
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
      Case Analytics & Reports
    </h2>
    <p className="text-gray-600 dark:text-gray-300">
      Comprehensive analytics and reporting for case management.
    </p>
    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
        <div className="text-2xl font-bold text-purple-800 dark:text-purple-300">85%</div>
        <div className="text-sm text-purple-700 dark:text-purple-400">Case Resolution Rate</div>
      </div>
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
        <div className="text-2xl font-bold text-blue-800 dark:text-blue-300">92%</div>
        <div className="text-sm text-blue-700 dark:text-blue-400">Client Satisfaction</div>
      </div>
      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
        <div className="text-2xl font-bold text-green-800 dark:text-green-300">78%</div>
        <div className="text-sm text-green-700 dark:text-green-400">Timely Documentation</div>
      </div>
    </div>
  </div>
);

function App() {
  const { checkAuth, isLoading, user } = useAuthStore();
  const { isDarkMode } = useTheme();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className={`App ${isDarkMode ? 'dark' : ''}`}>
      {/* 🔧 FIXED: Proper provider order - AuthProvider wraps everything */}
      <AuthProvider>
        <WebSocketProvider>
          <NotificationProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/password-reset" element={<PasswordReset />} />
              <Route path="/join-organization" element={<JoinOrganization />} />
              <Route path="/verify-email" element={<EmailVerification />} />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={user ? <Dashboard /> : <Navigate to="/login" replace />}
              />
              <Route
                path="/dashboard/overview"
                element={
                  user ? <OverviewDashboard /> : <Navigate to="/login" replace />
                }
              />

              {/* 📋 NEW: Case Dashboard Route */}
              <Route
                path="/dashboard/cases"
                element={user ? <CaseDashboard /> : <Navigate to="/login" replace />}
              />

              {/* 📊 NEW: Sheets Dashboard Routes */}
              <Route
                path="/sheets"
                element={
                  user ? <SheetsDashboard /> : <Navigate to="/login" replace />
                }
              />
              <Route
                path="/sheets/:spreadsheetId"
                element={
                  user ? <SpreadsheetEditor /> : <Navigate to="/login" replace />
                }
              />

              {/* 💬 FIXED: Chat Dashboard Routes with Error Boundaries */}
              <Route
                path="/chat"
                element={
                  user ? (
                    <ErrorBoundary>
                      <WorkspaceSelector />
                    </ErrorBoundary>
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />

              <Route
                path="/chat/:workspaceId"
                element={
                  user ? (
                    <ErrorBoundary>
                      <ChatDashboard />
                    </ErrorBoundary>
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />

              <Route
                path="/chat/:workspaceId/channel/:channelId"
                element={
                  user ? (
                    <ErrorBoundary>
                      <ChannelChat />
                    </ErrorBoundary>
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />

              <Route
                path="/chat/:workspaceId/dm/:dmId"
                element={
                  user ? (
                    <ErrorBoundary>
                      <DirectMessages />
                    </ErrorBoundary>
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />

              {/* HR Dashboard with Nested Routes */}
              <Route
                path="/dashboard/hr"
                element={user ? <HRDashboard /> : <Navigate to="/login" replace />}
              >
                <Route
                  index
                  element={<Navigate to="/dashboard/hr/overview" replace />}
                />
                <Route path="overview" element={<HROverview />} />
                <Route path="employees" element={<Employees />} />
                <Route path="employees/new" element={<AddEmployee />} />
                <Route path="employees/:id" element={<EmployeeDetail />} />
                <Route path="recruitment" element={<Recruitment />} />
                <Route path="recruitment/new" element={<NewJobPosting />} />
                <Route path="performance" element={<Performance />} />
                <Route path="performance/new" element={<ScheduleReview />} />
                <Route path="leave" element={<LeaveManagement />} />
                <Route path="training" element={<Training />} />
                <Route path="compensation" element={<Compensation />} />
                <Route path="analytics" element={<Analytics />} />
              </Route>

              {/* 💰 NEW: Financial Dashboard with Nested Routes */}
              <Route
                path="/dashboard/financial"
                element={
                  user ? <FinancialDashboard /> : <Navigate to="/login" replace />
                }
              >
                <Route
                  index
                  element={<Navigate to="/dashboard/financial/overview" replace />}
                />
                <Route path="overview" element={<FinancialOverview />} />
                <Route path="invoices" element={<Invoices />} />
                <Route path="profit-loss" element={<ProfitAndLoss />} />
                <Route path="budgets" element={<Budgets />} />
              </Route>

              {/* 👨‍💼 NEW: Manager Dashboard with Nested Routes */}
              <Route
                path="/dashboard/manager"
                element={
                  user ? <ManagerDashboard /> : <Navigate to="/login" replace />
                }
              >
                <Route
                  index
                  element={<Navigate to="/dashboard/manager/overview" replace />}
                />
                <Route path="overview" element={<ManagerOverview />} />
                <Route path="team" element={<TeamManagement />} />
                <Route path="performance" element={<PerformanceReviews />} />
                <Route path="approvals" element={<Approvals />} />
                <Route path="training" element={<TrainingManagement />} />
                <Route path="analytics" element={<TeamAnalytics />} />
              </Route>

              {/* 👨‍⚕️ NEW: Social Worker Dashboard with Nested Routes - UPDATED */}
              <Route
                path="/dashboard/social-worker"
                element={
                  user ? <SocialWorkerDashboard /> : <Navigate to="/login" replace />
                }
              >
                <Route
                  index
                  element={
                    <Navigate to="/dashboard/social-worker/overview" replace />
                  }
                />
                <Route path="overview" element={<CaseOverview />} />
                <Route path="cases" element={<CaseOverview />} />
                <Route path="clients" element={<ClientManagement />} />
                <Route path="visits" element={<VisitScheduling />} />
                <Route path="notes" element={<CaseNotes />} />
                <Route path="resources" element={<ResourceManagement />} />
                <Route path="analytics" element={<SocialWorkerAnalytics />} />
              </Route>

              {/* 📊 Editor Dashboard Routes */}
              <Route
                path="/editor"
                element={
                  user ? <EditorDashboard /> : <Navigate to="/login" replace />
                }
              />
              <Route
                path="/editor/document/:documentId"
                element={user ? <DocumentEditor /> : <Navigate to="/login" replace />}
              />

              <Route
                path="/profile"
                element={user ? <Profile /> : <Navigate to="/login" replace />}
              />
              <Route
                path="/organization"
                element={user ? <Organization /> : <Navigate to="/login" replace />}
              />

              {/* Default Route */}
              <Route
                path="/"
                element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
              />

              {/* Catch all route - redirect to dashboard */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </NotificationProvider>
        </WebSocketProvider>
      </AuthProvider>
    </div>
  );
}

// Placeholder components for HR routes
const HROverview = () => (
  <div className="p-6 bg-white dark:bg-gray-900 min-h-screen">
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">HR Overview</h2>
    <p className="text-gray-600 dark:text-gray-300">Welcome to the HR Management System</p>
  </div>
);

const AddEmployee = () => (
  <div className="p-6 bg-white dark:bg-gray-900 min-h-screen">
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Add New Employee</h2>
  </div>
);

const EmployeeDetail = () => (
  <div className="p-6 bg-white dark:bg-gray-900 min-h-screen">
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Employee Details</h2>
  </div>
);

const NewJobPosting = () => (
  <div className="p-6 bg-white dark:bg-gray-900 min-h-screen">
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
      Create Job Posting
    </h2>
  </div>
);

const ScheduleReview = () => (
  <div className="p-6 bg-white dark:bg-gray-900 min-h-screen">
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
      Schedule Performance Review
    </h2>
  </div>
);

export default App;