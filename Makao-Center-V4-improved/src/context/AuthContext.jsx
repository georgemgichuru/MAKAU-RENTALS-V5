import { createContext, useContext, useState, useEffect } from "react";
import apiService from "../services/api";

// 1. Create the context (this is like a box to store shared data)
const AuthContext = createContext();

// 2. Create a provider component
export function AuthProvider({ children }) {
  // State to keep track of login status and user type
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState(null); // can be "tenant" or "admin"
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing authentication on app start
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');
      const storedUserType = localStorage.getItem('userType');

      if (token && storedUserType) {
        try {
          // Validate token by fetching current user
          const userData = await apiService.getCurrentUser();
          setUser(userData);
          setUserType(storedUserType);
          setIsLoggedIn(true);
        } catch (error) {
          console.error('Token validation failed:', error);
          // Token is invalid, clear storage
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('userType');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Function to log in
  const login = async (email, password, user_type) => {
    try {
      const response = await apiService.login(email, password, user_type);

      // Store user data
      setUser(response.user || response);
      setUserType(user_type);
      setIsLoggedIn(true);

      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  // Function to log out
const logout = () => {
  // Clear API service state
  apiService.logout();

  // Clear local state
  setIsLoggedIn(false);
  setUserType(null);
  setUser(null);
};

  // What we want to share with the whole app
const value = {
  isLoggedIn,
  userType,
  user,
  loading,
  login,
  logout,
};

  // Wrap children with our context provider
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// 3. Custom hook to use the auth context (makes it easier to access)
export function useAuth() {
  return useContext(AuthContext);
}
