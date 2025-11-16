import React, { useEffect } from "react";
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

// 💬 NEW: CHAT - Import the Chat Components
import { AuthProvider } from "./contexts/chat/AuthContext";
import { WebSocketProvider } from "./contexts/chat/WebSocketContext";
import ChatLayout from "./components/chat/layout/ChatLayout";
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

// 💰 NEW: Financial Dashboard Pages
const FinancialOverview = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">
      Financial Overview
    </h2>
    <p className="text-gray-600">Key financial metrics and charts.</p>
  </div>
);
const Invoices = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">
      Invoices & Billing
    </h2>
    <p className="text-gray-600">Manage incoming and outgoing invoices.</p>
  </div>
);
const ProfitAndLoss = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Profit & Loss</h2>
    <p className="text-gray-600">Generate P&L statements.</p>
  </div>
);
const Budgets = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">
      Budgeting & Forecasting
    </h2>
    <p className="text-gray-600">Track and plan organizational budgets.</p>
  </div>
);

// 👨‍💼 NEW: Manager Dashboard Pages
const ManagerOverview = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Manager Overview</h2>
    <p className="text-gray-600">Team performance and management dashboard.</p>
  </div>
);
const TeamManagement = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Team Management</h2>
    <p className="text-gray-600">Manage your team members and assignments.</p>
  </div>
);
const PerformanceReviews = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">
      Performance Reviews
    </h2>
    <p className="text-gray-600">
      Schedule and conduct performance evaluations.
    </p>
  </div>
);
const Approvals = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Pending Approvals</h2>
    <p className="text-gray-600">Review and approve team requests.</p>
  </div>
);
const TrainingManagement = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">
      Training Management
    </h2>
    <p className="text-gray-600">
      Assign and track team training requirements.
    </p>
  </div>
);
const TeamAnalytics = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Team Analytics</h2>
    <p className="text-gray-600">Performance metrics and team insights.</p>
  </div>
);

// 👨‍⚕️ NEW: Social Worker Dashboard Pages - UPDATED TO MATCH THE COMPONENT
const CaseOverview = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">
      Case Overview Details
    </h2>
    <p className="text-gray-600">
      Detailed view of all active cases with advanced filtering options.
    </p>
    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Case Management Features</h3>
      <ul className="list-disc list-inside space-y-1 text-gray-700">
        <li>Advanced case search and filtering</li>
        <li>Case assignment and reassignment</li>
        <li>Priority case management</li>
        <li>Case history and audit trails</li>
      </ul>
    </div>
  </div>
);

const ClientManagement = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Client Management</h2>
    <p className="text-gray-600">
      Comprehensive client information and case management system.
    </p>
    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="p-4 bg-green-50 rounded-lg">
        <h3 className="font-semibold text-green-800">Client Profiles</h3>
        <p className="text-sm text-green-700">
          Complete client demographics and history
        </p>
      </div>
      <div className="p-4 bg-purple-50 rounded-lg">
        <h3 className="font-semibold text-purple-800">Assessment Tools</h3>
        <p className="text-sm text-purple-700">
          Standardized assessment forms and tools
        </p>
      </div>
    </div>
  </div>
);

const VisitScheduling = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">
      Visit Scheduling & Calendar
    </h2>
    <p className="text-gray-600">
      Schedule, reschedule, and track all client visits.
    </p>
    <div className="mt-4 p-4 bg-orange-50 rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Scheduling Features</h3>
      <ul className="list-disc list-inside space-y-1 text-gray-700">
        <li>Calendar integration</li>
        <li>Automated reminders</li>
        <li>Visit outcome tracking</li>
        <li>Route optimization</li>
      </ul>
    </div>
  </div>
);

const CaseNotes = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">
      Case Notes & Documentation
    </h2>
    <p className="text-gray-600">
      Secure documentation system for all client interactions and progress
      notes.
    </p>
    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-800">Progress Notes</h3>
        <p className="text-sm text-blue-700">
          SOAP notes and progress documentation
        </p>
      </div>
      <div className="p-4 bg-red-50 rounded-lg">
        <h3 className="font-semibold text-red-800">Incident Reports</h3>
        <p className="text-sm text-red-700">Critical incident documentation</p>
      </div>
    </div>
  </div>
);

const ResourceManagement = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">
      Resource Management
    </h2>
    <p className="text-gray-600">
      Manage and track community resources, referrals, and support services.
    </p>
    <div className="mt-4 p-4 bg-green-50 rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Available Resources</h3>
      <ul className="list-disc list-inside space-y-1 text-gray-700">
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
  <div className="p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">
      Case Analytics & Reports
    </h2>
    <p className="text-gray-600">
      Comprehensive analytics and reporting for case management.
    </p>
    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="p-4 bg-purple-50 rounded-lg text-center">
        <div className="text-2xl font-bold text-purple-800">85%</div>
        <div className="text-sm text-purple-700">Case Resolution Rate</div>
      </div>
      <div className="p-4 bg-blue-50 rounded-lg text-center">
        <div className="text-2xl font-bold text-blue-800">92%</div>
        <div className="text-sm text-blue-700">Client Satisfaction</div>
      </div>
      <div className="p-4 bg-green-50 rounded-lg text-center">
        <div className="text-2xl font-bold text-green-800">78%</div>
        <div className="text-sm text-green-700">Timely Documentation</div>
      </div>
    </div>
  </div>
);

function App() {
  const { checkAuth, isLoading, user } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="App">
      {/* 🔧 FIX: Move WebSocketProvider to root level */}
      <WebSocketProvider>
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

          {/* 💬 FIXED: Chat Dashboard Routes - SIMPLIFIED STRUCTURE */}
          <Route
            path="/chat"
            element={
              user ? (
                <AuthProvider>
                  <WorkspaceSelector />
                </AuthProvider>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* FIXED: Separate routes without nested Routes component */}
          <Route
            path="/chat/:workspaceId"
            element={
              user ? (
                <AuthProvider>
                  <ChatLayout>
                    <ChatDashboard />
                  </ChatLayout>
                </AuthProvider>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/chat/:workspaceId/channel/:channelId"
            element={
              user ? (
                <AuthProvider>
                  <ChatLayout>
                    <ChannelChat />
                  </ChatLayout>
                </AuthProvider>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/chat/:workspaceId/dm/:dmId"
            element={
              user ? (
                <AuthProvider>
                  <ChatLayout>
                    <DirectMessages />
                  </ChatLayout>
                </AuthProvider>
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
            {/* Additional social worker routes can be added here */}
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
      </WebSocketProvider>
    </div>
  );
}

// Placeholder components for HR routes
const HROverview = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">HR Overview</h2>
    <p className="text-gray-600">Welcome to the HR Management System</p>
  </div>
);

const AddEmployee = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Add New Employee</h2>
  </div>
);

const EmployeeDetail = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Employee Details</h2>
  </div>
);

const NewJobPosting = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">
      Create Job Posting
    </h2>
  </div>
);

const ScheduleReview = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">
      Schedule Performance Review
    </h2>
  </div>
);

export default App;