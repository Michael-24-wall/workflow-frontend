import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './stores/authStore';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Organization from './pages/Organization';
import ForgotPassword from './pages/ForgotPassword';
import PasswordReset from './components/PasswordReset';
import JoinOrganization from './pages/Joinorganization';

// Chat Components
import ChatApp from './pages/ChatApp';
import UserProfile from './pages/UserProfile';
import RoomManagement from './pages/RoomManagement';

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
        
        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={user ? <Dashboard /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/profile" 
          element={user ? <Profile /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/organization" 
          element={user ? <Organization /> : <Navigate to="/login" replace />} 
        />
        
        {/* Chat Routes */}
        <Route 
          path="/chat" 
          element={user ? <ChatApp /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/chat/profile" 
          element={user ? <UserProfile /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/chat/rooms" 
          element={user ? <RoomManagement /> : <Navigate to="/login" replace />} 
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

export default App;