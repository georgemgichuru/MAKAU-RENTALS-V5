import axios from 'axios';

// Resolve API base URL with smart fallbacks
// Priority:
// 1) VITE_API_BASE_URL from env
// 2) If running on localhost, use local Django server
// 3) Fallback to previous ngrok URL (may be offline)
const resolveApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
    return envUrl.replace(/\/$/, '');
  }

  // Browser-only check; safe in Vite client bundles
  const host = typeof window !== 'undefined' ? window.location.hostname : '';
  const isLocalhost = ['localhost', '127.0.0.1'].includes(host);
  if (isLocalhost) {
    return 'http://localhost:8000/api';
  }

  // Final fallback (production backend on Vercel)
  return 'https://makau-rentals-v5.vercel.app/api';
};

const API_BASE_URL = resolveApiBaseUrl();

// Helper: get API host base (without trailing /api) for media/static URLs
export const getApiBaseHost = () => API_BASE_URL.replace(/\/?api\/?$/, '');

// Helper: build absolute media URL from a relative path returned by backend (e.g., /media/....)
export const buildMediaUrl = (path) => {
  if (!path) return '';
  if (typeof path === 'string' && /^https?:\/\//i.test(path)) return path; // already absolute
  const host = getApiBaseHost();
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${host}${normalized}`;
};

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // 15s timeout to avoid infinite pending requests
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true', // Skip ngrok warning page
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`🔵 API Request: ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
    console.log('🔵 Token present:', !!token);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh and authentication errors
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.method.toUpperCase()} ${response.config.url}`);
    return response;
  },
  async (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('⏰ Request timeout:', error.message);
    }
    if (!error.response) {
      console.error('🌐 Network error or server unreachable. Base URL:', API_BASE_URL);
    } else {
      console.error(`❌ API Error: ${error.response?.status} ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
      console.error('❌ Error details:', error.response?.data);
    }
    const originalRequest = error.config;

    // Handle 401 errors
    if (error.response?.status === 401) {
      // If this is not a retry attempt and we have a refresh token, try to refresh
      if (!originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            const response = await axios.post(`${API_BASE_URL}/accounts/token/refresh/`, {
              refresh: refreshToken
            });

            const { access } = response.data;
            localStorage.setItem('accessToken', access);
            originalRequest.headers.Authorization = `Bearer ${access}`;

            return api(originalRequest);
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          // Continue to clear tokens and redirect
        }
      }

      // Clear invalid tokens
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userType');
      localStorage.removeItem('userData');
      
      // Redirect to login if we're not already there
      try {
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      } catch (_) {}
    }

    return Promise.reject(error);
  }
);

// Auth API endpoints
export const authAPI = {
  // Login
  login: (credentials) => api.post('/accounts/token/', credentials),

  // Register Tenant
  registerTenant: (data) => api.post('/accounts/tenant/register/complete/', data),
  registerTenantStep: (step, data) => {
    return api.post(`/accounts/tenant/register/step/${step}/`, data);
  },

  // Register Landlord
  registerLandlord: (data) => api.post('/accounts/landlord/register/complete/', data),
  registerLandlordStep: (step, data) => {
    return api.post(`/accounts/landlord/register/step/${step}/`, data);
  },

  // Validate Landlord ID
  validateLandlord: (landlordId) => {
    return api.post('/accounts/validate-landlord/', { landlord_code: landlordId });
  },

  // Get current user
  getCurrentUser: () => api.get('/accounts/me/'),

  // Refresh token
  refreshToken: (refresh) => api.post('/accounts/token/refresh/', { refresh }),

  // Update user
  updateUser: (userId, data) => api.put(`/accounts/users/${userId}/update/`, data),

  // Update tenant account info (exclude read-only fields)
  updateTenantAccount: (userId, data) => {
    const payload = { ...data };
    // Strip read-only fields if present
    delete payload.id;
    delete payload.date_joined;
    delete payload.is_active;
    delete payload.is_staff;
    delete payload.is_superuser;
    delete payload.landlord_code;
    return api.put(`/accounts/users/${userId}/update/`, payload).then(r => r.data);
  },

  // Change tenant password
  changeTenantPassword: (currentPassword, newPassword) => {
    return api.put('/accounts/change-password/', {
      current_password: currentPassword,
      new_password: newPassword,
    }).then(r => r.data);
  },
  
// Update tenant account info
};

// Payments API endpoints
export const paymentsAPI = {
  initiateDeposit: (data) => api.post('/payments/initiate-deposit/', data),

  // For tenant registration (no auth required)
  initiateDepositRegistration: (data) => api.post('/payments/initiate-deposit-registration/', data),

  getDepositStatus: (paymentId) => api.get(`/payments/deposit-status/${paymentId}/`),
  
  // Rent payments - NOW USING PESAPAL
  initiateRentPayment: (unitId, data) => api.post(`/payments/initiate-rent-payment/${unitId}/`, data),
  getRentPaymentStatus: (paymentId) => api.get(`/payments/rent-status/${paymentId}/`),
  
  // Subscription payments - NOW USING PESAPAL
  initiateSubscriptionPayment: (data) => api.post('/payments/initiate-subscription-payment/', data),
  getSubscriptionPaymentStatus: (paymentId) => api.get(`/payments/subscription-payments/${paymentId}/`),
  
  // Payment history
  getPaymentHistory: () => api.get('/payments/rent-payments/'),
  
  // Rent summary
  getRentSummary: () => api.get('/payments/rent-payments/summary/'),

  // Test connection
  testConnection: () => api.get('/payments/test-connection/'),
  testPesaPal: () => api.get('/payments/test-pesapal/'),

  // Bulk rent update
  bulkRentUpdate: (data) => api.post('/payments/bulk-rent-update/', data),

  // Individual unit rent update
  updateUnitRent: (unitId, data) => api.put(`/payments/unit-rent-update/${unitId}/`, data),

  // Download payments CSV (for landlord, all payments)
  downloadPaymentsCSV: (config = {}) =>
    api.get('/payments/rent-payments/csv/', { 
      ...config, 
      responseType: 'blob',
      params: config.params || {}
    }),
};

// Properties API endpoints
export const propertiesAPI = {
  // Landlord properties
  getProperties: () => api.get('/accounts/properties/'),
  createProperty: (data) => api.post('/accounts/properties/create/', data),
  updateProperty: (id, data) => api.put(`/accounts/properties/${id}/`, data),
  deleteProperty: (id) => api.delete(`/accounts/properties/${id}/`),

  // Units - FIXED to always use main units endpoint
  getUnits: () => api.get('/accounts/units/'),
  
  // Property units - always use the main units endpoint and filter
  getPropertyUnits: async (propertyId) => {
    try {
      const response = await api.get('/accounts/units/');
      const filteredUnits = response.data.filter(unit => {
        // Handle different property ID formats
        const unitPropertyId = unit.property_obj?.id || unit.property_obj;
        return unitPropertyId?.toString() === propertyId.toString();
      });
      return { data: filteredUnits };
    } catch (error) {
      console.error('Failed to fetch property units:', error);
      // Return empty array instead of throwing to prevent crashes
      return { data: [] };
    }
  },
  
  createUnit: (data) => api.post('/accounts/units/create/', data),
  updateUnit: (unitId, data) => api.put(`/accounts/units/${unitId}/`, data),
  deleteUnit: (unitId) => api.delete(`/accounts/units/${unitId}/`),

  // Unit types
  getUnitTypes: () => api.get('/accounts/unit-types/'),
  createUnitType: (data) => api.post('/accounts/unit-types/', data),
  updateUnitType: (id, data) => api.put(`/accounts/unit-types/${id}/`, data),
  deleteUnitType: (id) => api.delete(`/accounts/unit-types/${id}/`),

  // Add this function for organisation dashboard data
  getOrganisationStats: async (propertyId) => {
    try {
      console.log('🔍 Fetching organisation stats for property:', propertyId);
      
      // Get comprehensive data for organisation dashboard
      const [unitsResponse, tenantsResponse, reportsResponse] = await Promise.all([
        api.get('/accounts/units/'),
        api.get('/accounts/tenants/'),
        api.get('/communication/reports/')
      ]);

      // Filter data by property ID
      const filteredUnits = unitsResponse.data.filter(unit => {
        const unitPropertyId = unit.property_obj?.id?.toString() || unit.property_obj?.toString();
        return unitPropertyId === propertyId.toString();
      });

      const filteredTenants = tenantsResponse.data.filter(tenant => {
        const tenantPropertyId = tenant.current_unit?.property_obj?.id?.toString();
        return tenantPropertyId === propertyId.toString();
      });

      const filteredReports = reportsResponse.data.filter(report => {
        const reportPropertyId = report.unit?.property_obj?.id?.toString();
        return reportPropertyId === propertyId.toString();
      });

      return {
        data: {
          units: filteredUnits,
          tenants: filteredTenants,
          reports: filteredReports,
          totalUnits: filteredUnits.length,
          occupiedUnits: filteredUnits.filter(unit => !unit.is_available).length,
          availableUnits: filteredUnits.filter(unit => unit.is_available).length,
          totalTenants: filteredTenants.length,
          openReports: filteredReports.filter(report => 
            report.status === 'open' || report.status === 'Open'
          ).length
        }
      };
    } catch (error) {
      console.error('Error fetching organisation stats:', error);
      throw error;
    }
  },
};

// Dashboard API endpoints
export const dashboardAPI = {
  getStats: () => api.get('/accounts/dashboard/stats/'),
  getRentSummary: () => api.get('/payments/rent-payments/summary/'),
};

export const tenantsAPI = {
  getTenants: async () => {
    try {
      console.log('🔍 Fetching tenants from:', '/accounts/tenants/');
      const response = await api.get('/accounts/tenants/');
      console.log('✅ Tenants API response:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Tenants API error:', error);
      
      // If the regular endpoint fails, try alternatives
      try {
        console.log('🔄 Trying alternative endpoint: /accounts/users/');
        const alternativeResponse = await api.get('/accounts/users/', {
          params: { user_type: 'tenant' }
        });
        console.log('✅ Alternative tenants response:', alternativeResponse.data);
        return alternativeResponse;
      } catch (altError) {
        console.error('❌ Alternative endpoint also failed:', altError);
        throw error; // Throw the original error
      }
    }
  },
  
  // Also fix the getTenantDetails endpoint:
  deleteTenantAccount: (tenantId) => api.delete(`/accounts/users/${tenantId}/delete/`),
  getTenantDetails: (tenantId) => api.get(`/accounts/users/${tenantId}/`), // FIXED: removed /api/ prefix
  
  getTenant: (id) => api.get(`/accounts/users/${id}/`),
  updateTenant: (id, data) => api.put(`/accounts/users/${id}/update/`, data),
  assignTenant: (unitId, tenantId) => api.post(`/accounts/units/${unitId}/assign/${tenantId}/`, {}),
  removeTenant: (unitId) => api.post(`/accounts/units/${unitId}/remove-tenant/`, {}),
  getPendingApplications: () => api.get('/accounts/tenant-applications/pending/'),
  
  // Tenant application management
  approveTenantApplication: (applicationId) => api.post(`/accounts/tenant-applications/${applicationId}/approve/`),
  declineTenantApplication: (applicationId) => api.post(`/accounts/tenant-applications/${applicationId}/decline/`),
};

// Subscription API endpoints
export const subscriptionAPI = {
  getStatus: () => api.get('/accounts/subscription/status/'),
  updateTillNumber: (data) => api.patch('/accounts/till-number/update/', data),
};

// Communication API endpoints
export const communicationAPI = {
  // Reports - FIXED with better error handling
  createReport: (data) => api.post('/communication/reports/create/', data),
  
  getReports: () => api.get('/communication/reports/'),
  
  getOpenReports: async () => {
    try {
      const response = await api.get('/communication/reports/open/');
      return response;
    } catch (error) {
      console.warn('Open reports endpoint failed, using fallback');
      // Fallback: get all reports and filter
      try {
        const response = await api.get('/communication/reports/');
        const openReports = response.data.filter(report => {
          const s = (report?.status ?? '').toString().toLowerCase();
          return s === 'open' || s === 'pending';
        });
        return { data: openReports };
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        return { data: [] }; // Return empty array instead of throwing
      }
    }
  },
  
  getResolvedReports: async () => {
    try {
      const response = await api.get('/communication/reports/resolved/');
      return response;
    } catch (error) {
      console.warn('Resolved reports endpoint failed, using fallback');
      // Fallback: get all reports and filter
      try {
        const response = await api.get('/communication/reports/');
        const resolvedReports = response.data.filter(report => {
          const s = (report?.status ?? '').toString().toLowerCase();
          return s === 'resolved' || s === 'closed';
        });
        return { data: resolvedReports };
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        return { data: [] }; // Return empty array instead of throwing
      }
    }
  },
  
  updateReportStatus: (reportId, data) => api.patch(`/communication/reports/${reportId}/update-status/`, data),
  
  // ADDED: Send email function
  sendEmail: (data) => api.post('/communication/reports/send-email/', data),

  // Reminder settings
  getReminderSettings: () => api.get('/communication/reminders/settings/'),
  updateReminderSettings: (data) => api.put('/communication/reminders/settings/', data),
};

export default api;