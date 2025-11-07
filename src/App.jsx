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
// 💰 NEW: Import the Financial Dashboard
import FinancialDashboard from "./components/dashboards/FinancialDashboard"; 

// EDITOR: Import the Editor Components
import EditorDashboard from "./components/editor/EditorDashboard";
import DocumentEditor from "./components/editor/DocumentEditor";

// HR Dashboard Pages (Existing Imports)
import Employees from "./pages/dashboard/employees/Employees";
import Recruitment from "./pages/dashboard/Recruitment";
import Performance from "./pages/dashboard/Performance";
import LeaveManagement from "./pages/dashboard/LeaveManagement";
import Training from "./pages/dashboard/Training";
import Compensation from "./pages/dashboard/Compensation";
import Analytics from "./pages/dashboard/Analytics";

// 💰 NEW: Financial Dashboard Pages (You will need to create these files)
const FinancialOverview = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Financial Overview</h2>
    <p className="text-gray-600">Key financial metrics and charts.</p>
  </div>
);
const Invoices = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Invoices & Billing</h2>
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
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Budgeting & Forecasting</h2>
    <p className="text-gray-600">Track and plan organizational budgets.</p>
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
          element={user ? <OverviewDashboard /> : <Navigate to="/login" replace />}
        />
        
        {/* HR Dashboard with Nested Routes */}
        <Route
          path="/dashboard/hr"
          element={user ? <HRDashboard /> : <Navigate to="/login" replace />}
        >
          <Route index element={<Navigate to="/dashboard/hr/overview" replace />} />
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
          element={user ? <FinancialDashboard /> : <Navigate to="/login" replace />}
        >
          <Route index element={<Navigate to="/dashboard/financial/overview" replace />} />
          <Route path="overview" element={<FinancialOverview />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="profit-loss" element={<ProfitAndLoss />} />
          <Route path="budgets" element={<Budgets />} />
          {/* Add more finance specific routes like 'reports', 'payroll', etc. */}
        </Route>

        {/* 📊 NEW: Editor Dashboard Routes */}
        <Route
          path="/editor"
          element={user ? <EditorDashboard /> : <Navigate to="/login" replace />}
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
      </Routes>
    </div>
  );
}

// Placeholder components for HR routes (Kept for completeness)
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
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Create Job Posting</h2>
  </div>
);

const ScheduleReview = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Schedule Performance Review</h2>
  </div>
);

export default App;