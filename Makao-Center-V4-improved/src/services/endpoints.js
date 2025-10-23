// src/services/endpoints.js

// Use a direct URL since process.env is not available in this context
const API_BASE_URL = 'http://127.0.0.1:8000/api';

export const API_ENDPOINTS = {
  // ===== AUTHENTICATION ENDPOINTS =====
  LOGIN: `${API_BASE_URL}/accounts/token/`,
  REFRESH_TOKEN: `${API_BASE_URL}/accounts/token/refresh/`,
  SIGNUP: `${API_BASE_URL}/accounts/signup/`,

  // ===== USER MANAGEMENT ENDPOINTS =====
  USERS: `${API_BASE_URL}/accounts/users/`,
  ME: `${API_BASE_URL}/accounts/me/`,
  UPDATE_USER: (userId) => `${API_BASE_URL}/accounts/users/${userId}/update/`,
  UPDATE_REMINDER_PREFERENCES: `${API_BASE_URL}/accounts/update-reminder-preferences/`,

  // ===== PASSWORD RESET ENDPOINTS =====
  PASSWORD_RESET: `${API_BASE_URL}/accounts/password-reset/`,
  PASSWORD_RESET_CONFIRM: `${API_BASE_URL}/accounts/password-reset-confirm/`,

  // ===== PROPERTY ENDPOINTS =====
  PROPERTIES: `${API_BASE_URL}/accounts/properties/`,
  CREATE_PROPERTY: `${API_BASE_URL}/accounts/properties/create/`,
  UPDATE_PROPERTY: (propertyId) => `${API_BASE_URL}/accounts/properties/${propertyId}/update/`,
  PROPERTY_UNITS: (propertyId) => `${API_BASE_URL}/accounts/properties/${propertyId}/units/`,

  // ===== UNIT ENDPOINTS =====
UNITS: `${API_BASE_URL}/accounts/units/`,
  CREATE_UNIT: `${API_BASE_URL}/accounts/units/create/`,
  UPDATE_UNIT: (unitId) => `${API_BASE_URL}/accounts/units/${unitId}/update/`,
  ASSIGN_TENANT: (unitId, tenantId) => `${API_BASE_URL}/accounts/units/${unitId}/assign/${tenantId}/`,
  AVAILABLE_UNITS: `${API_BASE_URL}/accounts/available-units/`,
  TENANT_UPDATE_UNIT: `${API_BASE_URL}/accounts/units/tenant/update/`,

  // ===== UNIT TYPE ENDPOINTS =====
  UNIT_TYPES: `${API_BASE_URL}/accounts/unit-types/`,
  UNIT_TYPE_DETAIL: (unitTypeId) => `${API_BASE_URL}/accounts/unit-types/${unitTypeId}/`,

  // ===== SUBSCRIPTION ENDPOINTS =====
  SUBSCRIPTION_STATUS: `${API_BASE_URL}/accounts/subscription-status/`,
  UPDATE_TILL_NUMBER: `${API_BASE_URL}/accounts/update-till-number/`,
  ADJUST_RENT: `${API_BASE_URL}/accounts/adjust-rent/`,
  LANDLORD_SUBSCRIPTIONS: `${API_BASE_URL}/accounts/admin/landlord-subscriptions/`,

  // ===== DASHBOARD & STATS ENDPOINTS =====
  DASHBOARD_STATS: `${API_BASE_URL}/accounts/dashboard-stats/`,
  WELCOME: `${API_BASE_URL}/accounts/welcome/`,

  // ===== CONTEXT ENDPOINTS (Lists) =====
  TENANTS: `${API_BASE_URL}/accounts/tenants/`,
  LANDLORDS: `${API_BASE_URL}/accounts/landlords/profile/`,
  PENDING_APPLICATIONS: `${API_BASE_URL}/accounts/pending-applications/`,
  EVICTED_TENANTS: `${API_BASE_URL}/accounts/evicted-tenants/`,

  // ===== PAYMENT ENDPOINTS =====

  // Rent Payments
  RENT_PAYMENTS: `${API_BASE_URL}/payments/rent-payments/`,
  RENT_PAYMENT_DETAIL: (paymentId) => `${API_BASE_URL}/payments/rent-payments/${paymentId}/`,
  RENT_SUMMARY: `${API_BASE_URL}/payments/rent-payments/summary/`,

  // Subscription Payments
  SUBSCRIPTION_PAYMENTS: `${API_BASE_URL}/payments/subscription-payments/`,
  SUBSCRIPTION_PAYMENT_DETAIL: (paymentId) => `${API_BASE_URL}/payments/subscription-payments/${paymentId}/`,

  // M-Pesa STK Push Endpoints
  INITIATE_RENT_PAYMENT: (unitId) => `${API_BASE_URL}/payments/stk-push/${unitId}/`,
  INITIATE_SUBSCRIPTION_PAYMENT: `${API_BASE_URL}/payments/stk-push-subscription/`,
  INITIATE_DEPOSIT_PAYMENT: `${API_BASE_URL}/payments/initiate-deposit/`,
  DEPOSIT_STATUS: (paymentId) => `${API_BASE_URL}/payments/deposit-status/${paymentId}/`,

  // M-Pesa Callback Endpoints (for backend use)
  MPESA_RENT_CALLBACK: `${API_BASE_URL}/payments/callback/rent/`,
  MPESA_SUBSCRIPTION_CALLBACK: `${API_BASE_URL}/payments/callback/subscription/`,
  MPESA_B2C_CALLBACK: `${API_BASE_URL}/payments/callback/b2c/`,
  MPESA_DEPOSIT_CALLBACK: `${API_BASE_URL}/payments/callback/deposit/`,

  // CSV Export Endpoints
  LANDLORD_CSV: (propertyId) => `${API_BASE_URL}/payments/landlord-csv/${propertyId}/`,
  TENANT_CSV: (unitId) => `${API_BASE_URL}/payments/tenant-csv/${unitId}/`,

  // Utility Endpoints
  CLEANUP_PENDING_PAYMENTS: `${API_BASE_URL}/payments/cleanup-pending-payments/`,
  TEST_MPESA: `${API_BASE_URL}/payments/test-mpesa/`,

  // ===== COMMUNICATION & REPORTS ENDPOINTS =====

  // Report Endpoints
  CREATE_REPORT: `${API_BASE_URL}/communication/reports/create/`,
  OPEN_REPORTS: `${API_BASE_URL}/communication/reports/open/`,
  URGENT_REPORTS: `${API_BASE_URL}/communication/reports/urgent/`,
  IN_PROGRESS_REPORTS: `${API_BASE_URL}/communication/reports/in-progress/`,
  RESOLVED_REPORTS: `${API_BASE_URL}/communication/reports/resolved/`,
  UPDATE_REPORT_STATUS: (reportId) => `${API_BASE_URL}/communication/reports/${reportId}/update-status/`,

  // Email Endpoints
  SEND_EMAIL: `${API_BASE_URL}/communication/reports/send-email/`,

    // Step-by-step registration
  TENANT_REGISTRATION_STEP: '/accounts/auth/tenant/step',
  LANDLORD_REGISTRATION_STEP: '/accounts/auth/landlord/step',
  COMPLETE_TENANT_REGISTRATION: '/accounts/auth/tenant/complete/',
  COMPLETE_LANDLORD_REGISTRATION: '/accounts/auth/landlord/complete/',
  VALIDATE_LANDLORD: '/accounts/auth/validate-landlord/',
};

// Helper functions for common endpoint patterns
export const EndpointHelpers = {
  // Property endpoints
  getPropertyUpdateUrl: (propertyId) => `${API_BASE_URL}/accounts/properties/${propertyId}/update/`,
  getPropertyUnitsUrl: (propertyId) => `${API_BASE_URL}/accounts/properties/${propertyId}/units/`,

  // Unit endpoints
  getUnitUpdateUrl: (unitId) => `${API_BASE_URL}/accounts/units/${unitId}/update/`,
  getAssignTenantUrl: (unitId, tenantId) => `${API_BASE_URL}/accounts/units/${unitId}/assign/${tenantId}/`,

  // User endpoints
  getUserUpdateUrl: (userId) => `${API_BASE_URL}/accounts/users/${userId}/update/`,

  // Payment endpoints
  getRentPaymentDetailUrl: (paymentId) => `${API_BASE_URL}/payments/rent-payments/${paymentId}/`,
  getSubscriptionPaymentDetailUrl: (paymentId) => `${API_BASE_URL}/payments/subscription-payments/${paymentId}/`,
  getInitiateRentPaymentUrl: (unitId) => `${API_BASE_URL}/payments/stk-push/${unitId}/`,
  getDepositStatusUrl: (paymentId) => `${API_BASE_URL}/payments/deposit-status/${paymentId}/`,

  // Report endpoints
  getUpdateReportStatusUrl: (reportId) => `${API_BASE_URL}/communication/reports/${reportId}/update-status/`,

  // CSV export endpoints
  getLandlordCsvUrl: (propertyId) => `${API_BASE_URL}/payments/landlord-csv/${propertyId}/`,
  getTenantCsvUrl: (unitId) => `${API_BASE_URL}/payments/tenant-csv/${unitId}/`,

  // Unit Type endpoints
  getUnitTypeDetailUrl: (unitTypeId) => `${API_BASE_URL}/accounts/unit-types/${unitTypeId}/`,
};

// Default export for the base URL
export default API_BASE_URL;
