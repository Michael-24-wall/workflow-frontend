// contexts/chat/AuthContext.jsx
import React, { createContext, useContext, useEffect } from 'react';
import useAuthStore from '../../stores/authStore';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const {
    user,
    login,
    logout,
    isLoading: loading,
    error,
    clearError,
    isAuthenticated,
    checkAuth
  } = useAuthStore();

  // Check auth status on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const value = {
    user,
    login,
    logout,
    loading,
    error,
    clearError,
    isAuthenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;