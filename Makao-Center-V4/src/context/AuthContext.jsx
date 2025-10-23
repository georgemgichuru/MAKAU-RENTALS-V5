import { createContext, useContext, useState, useEffect } from "react";
import { apiService } from "../services/api";

// 1. Create the context (this is like a box to store shared data)
const AuthContext = createContext();

// 2. Create a provider component
export function AuthProvider({ children }) {
  // State to keep track of login status and user type
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState(null); // can be "tenant" or "landlord"
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing tokens on app load
  useEffect(() => {
    const checkAuthStatus = async () => {
      const accessToken = localStorage.getItem('accessToken');
      const storedUserType = localStorage.getItem('userType');

      if (accessToken) {
        try {
          // Try to get current user data
          const userData = await apiService.getCurrentUser();
          setUser(userData);
          setUserType(storedUserType || userData.user_type);
          setIsLoggedIn(true);
        } catch (error) {
          console.error('Failed to authenticate with stored tokens:', error);
          // Clear invalid tokens
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('userType');
        }
      }
      setLoading(false);
    };

    checkAuthStatus();
  }, []);

  // Function to log in
  const login = async (email, password, userType) => {
    try {
      const response = await apiService.login(email, password, userType);
      
      // Get user data
      let userData;
      try {
        userData = await apiService.getCurrentUser();
      } catch (userError) {
        console.warn('Could not fetch user profile, using basic info:', userError);
        userData = {
          email: email,
          user_type: userType,
          ...(response.user || {})
        };
      }
      
      // Set context state
      setUser(userData);
      setUserType(userType);
      setIsLoggedIn(true);
      
      return { success: true, userData };
    } catch (error) {
      console.error('Login error in AuthContext:', error);
      return { success: false, error: error.message };
    }
  };

  // Function to log out
  const logout = () => {
    setIsLoggedIn(false);
    setUserType(null);
    setUser(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userType');
  };

  // What we want to share with the whole app
  const value = {
    isLoggedIn,
    userType,
    user,
    login,
    logout,
    loading,
  };

  // Wrap children with our context provider
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// 3. Custom hook to use the auth context (makes it easier to access)
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}