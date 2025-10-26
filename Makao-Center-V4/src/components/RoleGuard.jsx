import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, Lock } from 'lucide-react';

/**
 * RoleGuard Component
 * 
 * Protects routes from cross-type dashboard access.
 * Prevents landlords from accessing tenant dashboards and vice versa.
 * 
 * @param {React.ReactNode} children - The component to render if authorized
 * @param {string|string[]} requiredRole - The required user role(s) (e.g., 'tenant', 'landlord')
 * @param {React.ReactNode} fallback - Optional fallback component to show if unauthorized
 */
const RoleGuard = ({ children, requiredRole, fallback = null }) => {
  const navigate = useNavigate();
  const { isLoggedIn, userType, isLoading } = useAuth();

  // Normalize required role to array for consistency
  const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

  useEffect(() => {
    // Wait for auth to load
    if (isLoading) return;

    // If not logged in, redirect to login
    if (!isLoggedIn) {
      navigate('/login', { replace: true });
      return;
    }

    // Check if user has required role
    if (userType && !requiredRoles.includes(userType)) {
      console.warn(
        `Access denied: User is a ${userType}, but route requires ${requiredRoles.join(' or ')}`
      );
      // Redirect to appropriate dashboard based on user type
      if (userType === 'landlord') {
        navigate('/admin', { replace: true });
      } else if (userType === 'tenant') {
        navigate('/tenant', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    }
  }, [isLoggedIn, userType, isLoading, requiredRoles, navigate]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Not logged in
  if (!isLoggedIn) {
    return null;
  }

  // User doesn't have required role
  if (userType && !requiredRoles.includes(userType)) {
    if (fallback) {
      return fallback;
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
          <div className="flex justify-center mb-6">
            <div className="bg-red-100 rounded-full p-4">
              <Lock className="w-12 h-12 text-red-600" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-4 text-center">
            Access Denied
          </h1>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 text-sm">
                You are logged in as a <strong>{userType?.toLowerCase()}</strong> and cannot access this 
                {requiredRoles.length === 1 
                  ? ` ${requiredRoles[0].toLowerCase()} ` 
                  : ' '} 
                dashboard.
              </p>
            </div>
          </div>

          <p className="text-gray-600 text-center mb-6">
            Please log out and log in with the correct account type to access this area.
          </p>

          <button
            onClick={() => navigate(userType === 'landlord' ? '/admin' : '/tenant', { replace: true })}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold transition-colors"
          >
            Go to {userType === 'landlord' ? 'Landlord' : 'Tenant'} Dashboard
          </button>
        </div>
      </div>
    );
  }

  // User has required role, render children
  return children;
};

export default RoleGuard;
