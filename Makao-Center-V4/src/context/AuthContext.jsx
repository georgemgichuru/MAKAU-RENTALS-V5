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

      if (!token || !storedUserType) {
        setIsLoggedIn(false);
        setUserType(null);
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const response = await authAPI.getCurrentUser();
        const userData = response.data;

        if (userData && userData.user_type) {
          // Validate that the stored user type matches the actual user type
          // This prevents cross-type dashboard access even if tokens are valid
          if (userData.user_type !== storedUserType) {
            console.warn(
              `User type mismatch! Stored: ${storedUserType}, Actual: ${userData.user_type}. Logging out.`
            );
            logout();
            return;
          }

          setIsLoggedIn(true);
          setUserType(userData.user_type);
          setUser(userData);
        } else {
          console.warn('Invalid user data received');
          logout();
        }
      } catch (apiError) {
        console.warn('API call failed for /accounts/me/:', apiError.message);
        const status = apiError.response?.status;
        // Treat 401 and 403 as invalid session for the me endpoint
        if (status === 401 || status === 403) {
          logout();
        } else {
          // For other errors, keep user logged in but show warning
          console.warn('Network error, keeping user logged in');
          setIsLoggedIn(true);
          setUserType(storedUserType);
          setUser(JSON.parse(localStorage.getItem('userData') || '{}'));
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsLoggedIn(false);
      setUserType(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (type, userData, tokens) => {
    // Validate that the user type matches before storing
    if (userData.user_type !== type) {
      console.error(
        `Login validation failed: User type mismatch! Expected: ${type}, Got: ${userData.user_type}`
      );
      throw new Error('User type mismatch during login');
    }

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