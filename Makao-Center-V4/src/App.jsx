import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "./context/AuthContext"
import ContextProvider from "./context/AppContext"
import { TenantToastProvider } from "./context/TenantToastContext"
import { NotificationProvider } from "./context/NotificationContext"
import { ToastProvider } from "./context/ToastContext"
import { AddPropertyForm } from "./context/AppContext"
import React, { useState, useEffect } from "react"
// auth & layout
import UnifiedAuthSystem from "./components/Login and Sign Up/LoginForm"

import AdminLayout from "./components/Admin/AdminLayout"
import TenantLayout from "./components/Tenant/TenantLayout"

import ForgotPasswordRequest from "./components/Login and Sign Up/ForgotPasswordRequest"
import ResetPassword from "./components/Login and Sign Up/ResetPassword"
import ResetPasswordSuccess from "./components/Login and Sign Up/ResetPasswordSuccess"

// admin pages
import AdminDashboard from "./components/Admin/AdminDashboard"
import AdminReports from "./components/Admin/AdminReports"
import AdminPayments from "./components/Admin/AdminPayments"
import AdminSettings from "./components/Admin/AdminSettings"
import AdminOrganisation from "./components/Admin/AdminOrganisation"
import AdminTenants from "./components/Admin/AdminTenants"
import AdminHelp from "./components/Admin/AdminHelp"
import TenantTransactions from "./components/Admin/TenantTransactions"
import TenantDetails from "./components/Admin/TenantDetailsPage"

// NEW: Subscription and SMS pages
import SubscriptionPage from "./components/Admin/SubscriptionPage"
import SubscriptionPaymentPage from "./components/Admin/SubscriptionPaymentPage"
import SMSPurchasePage from "./components/Admin/SMSPurchasePage"
import SubscriptionGuard from "./components/SubscriptionGuard"

// tenant pages
import TenantDashboard from "./components/Tenant/TenantDashboard"
import TenantPaymentCenter from "./components/Tenant/TenantPaymentCenter"
import TenantReportIssue from "./components/Tenant/TenantReportIssue"
import TenantSettings from "./components/Tenant/TenantSettings"

// Fixed ErrorBoundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-6">
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
            >
              Refresh Page
            </button>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500">Error Details (Development)</summary>
                <pre className="text-xs text-red-600 mt-2 overflow-auto">
                  {this.state.error?.toString() || 'Unknown error'}
                  <br />
                  {this.state.errorInfo?.componentStack || 'No component stack available'}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Loading component
function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

// AppInitializer component
function AppInitializer({ children }) {
  const { isLoggedIn, isLoading } = useAuth();
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    // Wait for auth check to complete and only then render the app
    if (!isLoading) {
      setAppReady(true);
    }
  }, [isLoading]);

  if (!appReady) {
    return <LoadingSpinner />;
  }

  return children;
}

function ProtectedRoute({ children, role }) {
  const { isLoggedIn, userType, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!isLoggedIn) return <Navigate to="/login" replace />
  if (role && userType !== role) return <Navigate to="/login" replace />

  return children
}

function AppContent() {
  const { isLoggedIn, userType, isLoading } = useAuth()

  // Show loading spinner while checking auth status
  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <AppInitializer>
      <Routes>
        {/* Public login */}
        <Route
          path="/login"
          element={
            isLoggedIn ? (
              <Navigate to={userType === "landlord" ? "/admin" : "/tenant"} replace />
            ) : (
              <UnifiedAuthSystem />
            )
          }
        />

        <Route path="/forgot-password" element={<ForgotPasswordRequest />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/reset-success" element={<ResetPasswordSuccess />} />

        {/* Admin routes */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute role="landlord">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminOrganisation />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="add-property" element={<AddPropertyForm />} />
          
          {/* Protected routes that require active subscription */}
          <Route path="tenants" element={
            <SubscriptionGuard requireActive={true}>
              <AdminTenants />
            </SubscriptionGuard>
          } />
          <Route path="tenants/:tenantId/transactions" element={
            <SubscriptionGuard requireActive={true}>
              <TenantTransactions />
            </SubscriptionGuard>
          } />
          <Route path="tenants/:tenantId/details" element={
            <SubscriptionGuard requireActive={true}>
              <TenantDetails />
            </SubscriptionGuard>
          } />
          
          <Route path="help" element={<AdminHelp />} />
          
          <Route path="reports" element={
            <SubscriptionGuard requireActive={true}>
              <AdminReports />
            </SubscriptionGuard>
          } />
          <Route path="payments" element={
            <SubscriptionGuard requireActive={true}>
              <AdminPayments />
            </SubscriptionGuard>
          } />
          
          <Route path="settings" element={<AdminSettings />} />
          
          <Route path="organisation" element={
            <SubscriptionGuard requireActive={true}>
              <AdminOrganisation />
            </SubscriptionGuard>
          } />
          
          {/* NEW ROUTES: Subscription and SMS Purchase - Always accessible */}
          <Route path="subscription" element={<SubscriptionPage />} />
          <Route path="subscription/payment" element={<SubscriptionPaymentPage />} />
          <Route path="sms-purchase" element={<SMSPurchasePage />} />
        </Route>

        {/* Tenant routes */}
        <Route
          path="/tenant/*"
          element={
            <ProtectedRoute role="tenant">
              <TenantToastProvider>
                <TenantLayout />
              </TenantToastProvider>
            </ProtectedRoute>
          }
        >
          <Route index element={<TenantDashboard />} />
          <Route path="payments" element={
            <SubscriptionGuard requireActive={true}>
              <TenantPaymentCenter />
            </SubscriptionGuard>
          } />
          <Route path="report" element={<TenantReportIssue />} />
          <Route path="settings" element={<TenantSettings />} />
        </Route>

        {/* Default → login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AppInitializer>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <ContextProvider>
        <ToastProvider>
          <NotificationProvider>
            <AuthProvider>
              <Router>
                <AppContent />
              </Router>
            </AuthProvider>
          </NotificationProvider>
        </ToastProvider>
      </ContextProvider>
    </ErrorBoundary>
  )
}