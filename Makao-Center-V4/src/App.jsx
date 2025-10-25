import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "./context/AuthContext"
import ContextProvider from "./context/AppContext"
import { TenantToastProvider } from "./context/TenantToastContext"
import { AddPropertyForm } from "./context/AppContext"

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
import SMSPurchasePage from "./components/Admin/SMSPurchasePage"

// tenant pages
import TenantDashboard from "./components/Tenant/TenantDashboard"
import TenantPaymentCenter from "./components/Tenant/TenantPaymentCenter"
import TenantReportIssue from "./components/Tenant/TenantReportIssue"
import TenantSettings from "./components/Tenant/TenantSettings"

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
        <Route path="tenants" element={<AdminTenants />} />
        <Route path="tenants/:tenantId/transactions" element={<TenantTransactions />} />
        <Route path="tenants/:tenantId/details" element={<TenantDetails />} />
        <Route path="help" element={<AdminHelp />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="payments" element={<AdminPayments />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="organisation" element={<AdminOrganisation />} />
        
        {/* NEW ROUTES: Subscription and SMS Purchase */}
        <Route path="subscription" element={<SubscriptionPage />} />
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
        <Route path="payments" element={<TenantPaymentCenter />} />
        <Route path="report" element={<TenantReportIssue />} />
        <Route path="settings" element={<TenantSettings />} />
      </Route>

      {/* Default → login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ContextProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ContextProvider>
  )
}