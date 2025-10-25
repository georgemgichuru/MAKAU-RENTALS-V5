import axios from 'axios';

// Use relative URL for development, or absolute URL for production
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api'; // Direct URL for now

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
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

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
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
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userType');
        localStorage.removeItem('userData');
        window.location.href = '/auth';
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
    // Ensure session_id is included
    return api.post(`/accounts/tenant/register/step/${step}/`, data);
  },

  // Register Landlord
  registerLandlord: (data) => api.post('/accounts/landlord/register/complete/', data),
  registerLandlordStep: (step, data) => {
    // Ensure session_id is included
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
  // Deposit payments - use fresh axios instance without auth for registration
  initiateDeposit: (data) => {
    const freshAxios = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return freshAxios.post('/payments/initiate-deposit-registration/', data);
  },
  
  getDepositStatus: (paymentId) => api.get(`/payments/deposit-status/${paymentId}/`),
  
  // Rent payments
  stkPush: (unitId, data) => api.post(`/payments/stk-push/${unitId}/`, data),
  
  // Subscription payments
  stkPushSubscription: (data) => api.post('/payments/stk-push-subscription/', data),
  
  // Payment history
  getPaymentHistory: () => api.get('/payments/rent-payments/'),
};

// Properties API endpoints
export const propertiesAPI = {
  // Landlord properties
  getProperties: () => api.get('/accounts/properties/'),
  createProperty: (data) => api.post('/accounts/properties/create/', data),
  updateProperty: (id, data) => api.put(`/accounts/properties/${id}/`, data),
  deleteProperty: (id) => api.delete(`/accounts/properties/${id}/`),

  // Units
  getUnits: () => api.get('/accounts/units/'),
  getPropertyUnits: (propertyId) => api.get(`/accounts/properties/${propertyId}/units/`),
  createUnit: (data) => api.post('/accounts/units/create/', data),
  updateUnit: (unitId, data) => api.put(`/accounts/units/${unitId}/`, data),
  deleteUnit: (unitId) => api.delete(`/accounts/units/${unitId}/`),

  // Unit types
  getUnitTypes: () => api.get('/accounts/unit-types/'),
  createUnitType: (data) => api.post('/accounts/unit-types/', data),
  updateUnitType: (id, data) => api.put(`/accounts/unit-types/${id}/`, data),
  deleteUnitType: (id) => api.delete(`/accounts/unit-types/${id}/`),
};

// Dashboard API endpoints
export const dashboardAPI = {
  getStats: () => api.get('/accounts/dashboard/stats/'),
  getRentSummary: () => api.get('/payments/rent-payments/summary/'),
};

// Tenant management API endpoints
export const tenantsAPI = {
  getTenants: () => api.get('/accounts/tenants/'),
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

export default api;
