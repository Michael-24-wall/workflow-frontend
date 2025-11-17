// contexts/chat/AuthContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
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
    isAuthenticated: storeIsAuthenticated,
    checkAuth
  } = useAuthStore();

  const [authChecked, setAuthChecked] = useState(false);

  // Check auth status on mount
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('🔐 [AUTH CONTEXT] Initializing auth...');
      await checkAuth();
      setAuthChecked(true);
    };
    
    initializeAuth();
  }, [checkAuth]);

  // ✅ FIX: Create a RELIABLE isAuthenticated value
  const reliableIsAuthenticated = useMemo(() => {
    if (!authChecked) {
      console.log('⏳ [AUTH CONTEXT] Auth not checked yet');
      return false;
    }

    // Check multiple sources to determine authentication
    const token = localStorage.getItem('access_token');
    const userEmail = localStorage.getItem('user_email');
    
    const hasValidToken = !!token;
    const hasUserData = !!user || !!userEmail;
    const isActuallyAuthenticated = hasValidToken && hasUserData;
    
    console.log('🔐 [AUTH CONTEXT] Reliability check:', {
      storeIsAuthenticated,
      hasValidToken,
      hasUserData,
      storeUser: !!user,
      localStorageUser: !!userEmail,
      reliableResult: isActuallyAuthenticated,
      authChecked
    });
    
    return isActuallyAuthenticated;
  }, [storeIsAuthenticated, user, authChecked]);

  // ✅ FIX: Create a reliable user object
  const reliableUser = useMemo(() => {
    // If store has user, use it. Otherwise create from localStorage
    if (user) {
      return user;
    } else {
      const userEmail = localStorage.getItem('user_email');
      if (userEmail) {
        // Fallback: create basic user object from localStorage
        const fallbackUser = {
          email: userEmail,
          id: localStorage.getItem('user_id') || 'unknown',
          display_name: localStorage.getItem('user_display_name') || userEmail
        };
        console.log('🔄 [AUTH CONTEXT] Using fallback user from localStorage:', fallbackUser);
        return fallbackUser;
      }
    }
    
    return null;
  }, [user]);

  // Add refreshAuth function for components that need to manually refresh
  const refreshAuth = async () => {
    console.log('🔄 [AUTH CONTEXT] Manual auth refresh requested');
    await checkAuth();
  };

  const value = {
    user: reliableUser,
    login,
    logout,
    loading: loading || !authChecked, // Show loading until auth is checked
    error,
    clearError,
    isAuthenticated: reliableIsAuthenticated,
    refreshAuth,
    authChecked
  };

  console.log('🎯 [AUTH CONTEXT] Providing auth context:', {
    user: reliableUser?.email,
    isAuthenticated: reliableIsAuthenticated,
    loading: value.loading,
    authChecked
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;