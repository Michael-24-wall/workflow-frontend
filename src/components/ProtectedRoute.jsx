// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';

const ProtectedRoute = ({ children, requiredRole, dashboardType }) => {
  const { isAuthenticated, user, hasDashboardAccess } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Check specific role requirement
  if (requiredRole && user?.organization_role !== requiredRole) {
    return <Navigate to="/dashboard/personal" replace />;
  }
  
  // Check dashboard access by type
  if (dashboardType && !hasDashboardAccess(dashboardType)) {
    return <Navigate to="/dashboard/personal" replace />;
  }
  
  return children;
};

export default ProtectedRoute;