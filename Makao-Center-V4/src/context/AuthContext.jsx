// AuthContext.js
import { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const storedUserType = localStorage.getItem('userType');
      
      if (token && storedUserType) {
        // Verify token is still valid
        const response = await authAPI.getCurrentUser();
        const userData = response.data;
        
        if (userData.user_type === storedUserType) {
          setIsLoggedIn(true);
          setUserType(userData.user_type);
          setUser(userData);
        } else {
          console.warn('User type mismatch, logging out');
          logout();
        }
      } else {
        setIsLoggedIn(false);
        setUserType(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (type, userData, tokens) => {
    localStorage.setItem('accessToken', tokens.access);
    localStorage.setItem('refreshToken', tokens.refresh);
    localStorage.setItem('userType', type);
    localStorage.setItem('userData', JSON.stringify(userData));

    setIsLoggedIn(true);
    setUserType(type);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userType');
    localStorage.removeItem('userData');

    setIsLoggedIn(false);
    setUserType(null);
    setUser(null);
  };

  const value = {
    isLoggedIn,
    userType,
    user,
    isLoading,
    login,
    logout,
    checkAuthStatus
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}