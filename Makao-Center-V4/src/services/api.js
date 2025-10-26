import axios from 'axios';

// Use ngrok URL for development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://preaccommodatingly-nonabsorbable-joanie.ngrok-free.dev/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
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
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh and authentication errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
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
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
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
};

// Payments API endpoints
export const paymentsAPI = {
  initiateDeposit: (data) => api.post('/payments/initiate-deposit/', data),

  // For tenant registration (no auth required)
  initiateDepositRegistration: (data) => api.post('/payments/initiate-deposit-registration/', data),

  getDepositStatus: (paymentId) => api.get(`/payments/deposit-status/${paymentId}/`),
  
  // Rent payments
  stkPush: (unitId, data) => api.post(`/payments/stk-push/${unitId}/`, data),
  
  // Subscription payments
  stkPushSubscription: (data) => api.post('/payments/stk-push-subscription/', data),
  
  // Payment history
  getPaymentHistory: () => api.get('/payments/rent-payments/'),
  
  // Rent summary
  getRentSummary: () => api.get('/payments/rent-payments/summary/'),

  // Test connection
  testConnection: () => api.get('/payments/test-connection/'),
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
  getTenantDetails: (tenantId) => api.get(`/accounts/users/${tenantId}/`), // FIXED: removed /api/ prefix
  
  getTenant: (id) => api.get(`/accounts/users/${id}/`),
  updateTenant: (id, data) => api.put(`/accounts/users/${id}/update/`, data),
  assignTenant: (unitId, tenantId) => api.post(`/accounts/units/${unitId}/assign/${tenantId}/`, {}),
  removeTenant: (unitId) => api.post(`/accounts/units/${unitId}/remove-tenant/`, {}),
  getPendingApplications: () => api.get('/accounts/applications/pending/'),
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
        const openReports = response.data.filter(report => report.status === 'open');
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
        const resolvedReports = response.data.filter(report => 
          report.status === 'resolved' || report.status === 'closed'
        );
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
};

export default api;