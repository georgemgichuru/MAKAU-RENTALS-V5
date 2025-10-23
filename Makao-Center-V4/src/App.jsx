import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ContextProvider from "./context/AppContext";
import { TenantToastProvider } from "./context/TenantToastContext";
import { ToastProvider } from "./context/ToastContext";
import { NotificationProvider } from "./context/NotificationContext";

import React from "react";

// auth & layout
import LoginForm from "./components/LoginForm";
import AdminLayout from "./components/Admin/AdminLayout"; 
import TenantLayout from "./components/Tenant/TenantLayout";

// admin pages
import AdminDashboard from "./components/Admin/AdminDashboard";
import AdminReports from "./components/Admin/AdminReports";
import AdminPayments from "./components/Admin/AdminPayments";
import AdminSettings from "./components/Admin/AdminSettings";
import AdminOrganisation from "./components/Admin/AdminOrganisation";
import AdminTenants from "./components/Admin/AdminTenants";
import AddPropertyForm from './components/Admin/AddPropertyForm';
import AdminHelp from "./components/Admin/AdminHelp";

// tenant pages
import TenantDashboard from "./components/Tenant/TenantDashboard";
import TenantPaymentCenter from "./components/Tenant/TenantPaymentCenter";
import TenantReportIssue from "./components/Tenant/TenantReportIssue";
import TenantSettings from "./components/Tenant/TenantSettings";
import TenantSignUpForm from "./components/TenantSignUpForm";

// Debug component to log route changes
function RouteDebugger() {
  const location = useLocation();
  
  React.useEffect(() => {
    console.log('🔵 Route changed to:', location.pathname);
  }, [location]);
  
  return null;
}

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🔴 Error Boundary Caught:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
            <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
              <p className="text-red-800 font-mono text-sm">
                {this.state.error && this.state.error.toString()}
              </p>
            </div>
            <details className="mb-4">
              <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                View error details
              </summary>
              <pre className="mt-2 text-xs bg-gray-100 p-4 rounded overflow-auto">
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ---------------- Protected Route ----------------
function ProtectedRoute({ children, role }) {
  const auth = useAuth();
  
  // Check if auth context is available
  if (!auth) {
    console.error('❌ Auth context not available in ProtectedRoute');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-2">Authentication Error</div>
          <p className="text-gray-600">Auth context is not available. Please refresh the page.</p>
        </div>
      </div>
    );
  }

  const { isLoggedIn, userType, loading } = auth;
  const location = useLocation();

  console.log('🔒 ProtectedRoute Check:', { isLoggedIn, userType, role, path: location.pathname });

  if (loading) {
    console.log('⏳ Auth loading...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    console.log('❌ Not logged in, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (role && userType !== role) {
    console.log('❌ Wrong user type. Expected:', role, 'Got:', userType);
    return <Navigate to="/login" replace />;
  }

  console.log('✅ Access granted');
  return children;
}

// Wrapper for AdminLayout with context providers
function AdminLayoutWithProviders() {
  console.log('🏗️ Rendering AdminLayoutWithProviders');
  
  return (
    <ErrorBoundary>
      <ContextProvider>
        <ToastProvider>
          <NotificationProvider>
            <AdminLayout />
          </NotificationProvider>
        </ToastProvider>
      </ContextProvider>
    </ErrorBoundary>
  );
}

// Wrapper for TenantLayout with context providers
function TenantLayoutWithProviders() {
  console.log('🏗️ Rendering TenantLayoutWithProviders');
  
  return (
    <ErrorBoundary>
      <ContextProvider>
        <TenantToastProvider>
          <TenantLayout />
        </TenantToastProvider>
      </ContextProvider>
    </ErrorBoundary>
  );
}

// Wrapper for LoginForm WITHOUT AppContext (since it doesn't need it)
function LoginFormWithoutAppContext() {
  console.log('🔐 Rendering LoginFormWithoutAppContext');
  
  return (
    <ErrorBoundary>
      <LoginForm />
    </ErrorBoundary>
  );
}

// Wrapper for each admin page component with error boundary
function SafeAdminPayments() {
  console.log('💰 Rendering AdminPayments');
  return (
    <ErrorBoundary>
      <AdminPayments />
    </ErrorBoundary>
  );
}

function SafeAdminOrganisation() {
  console.log('🏢 Rendering AdminOrganisation');
  return (
    <ErrorBoundary>
      <AdminOrganisation />
    </ErrorBoundary>
  );
}

// ---------------- App Content ----------------
function AppContent() {
  const auth = useAuth();

  // Check if auth context is available
  if (!auth) {
    console.error('❌ Auth context not available in AppContent');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-2">Authentication Error</div>
          <p className="text-gray-600">Auth context is not available. Please refresh the page.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  const { isLoggedIn, userType, loading } = auth;

  console.log('🚀 App rendering. Auth state:', { isLoggedIn, userType, loading });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <RouteDebugger />
      <Routes>
        {/* Public login - WITHOUT AppContext */}
        <Route
          path="/login"
          element={
            isLoggedIn ? (
              <Navigate 
                to={userType === "landlord" ? "/landlord-dashboard" : "/tenant-dashboard"} 
                replace 
              />
            ) : (
              <LoginFormWithoutAppContext />
            )
          }
        />

        {/* Public tenant signup page - WITHOUT AppContext */}
        <Route path="/tenant/signup" element={<TenantSignUpForm />} />

        {/* Landlord routes with proper nesting and context providers */}
        <Route
          path="/landlord-dashboard"
          element={
            <ProtectedRoute role="landlord">
              <AdminLayoutWithProviders />
            </ProtectedRoute>
          }
        >
          {/* All nested routes use relative paths */}
          <Route index element={
            <ErrorBoundary>
              <AdminDashboard />
            </ErrorBoundary>
          } />
          <Route path="organisation" element={<SafeAdminOrganisation />} />
          <Route path="add-property" element={
            <ErrorBoundary>
              <AddPropertyForm />
            </ErrorBoundary>
          } />
          <Route path="tenants" element={
            <ErrorBoundary>
              <AdminTenants />
            </ErrorBoundary>
          } />
          <Route path="help" element={
            <ErrorBoundary>
              <AdminHelp />
            </ErrorBoundary>
          } />
          <Route path="reports" element={
            <ErrorBoundary>
              <AdminReports />
            </ErrorBoundary>
          } />
          <Route path="payments" element={<SafeAdminPayments />} />
          <Route path="settings" element={
            <ErrorBoundary>
              <AdminSettings />
            </ErrorBoundary>
          } />
        </Route>

        {/* Tenant routes */}
        <Route
          path="/tenant-dashboard"
          element={
            <ProtectedRoute role="tenant">
              <TenantLayoutWithProviders />
            </ProtectedRoute>
          }
        >
          <Route index element={<TenantDashboard />} />
          <Route path="payments" element={<TenantPaymentCenter />} />
          <Route path="report" element={<TenantReportIssue />} />
          <Route path="settings" element={<TenantSettings />} />
        </Route>

        {/* Legacy redirects */}
        <Route path="/admin/*" element={<Navigate to="/landlord-dashboard" replace />} />
        <Route path="/tenant/*" element={<Navigate to="/tenant-dashboard" replace />} />

        {/* Default routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}

// ---------------- Main App Component ----------------
export default function App() {
  console.log('🎯 App component mounted');
  
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}