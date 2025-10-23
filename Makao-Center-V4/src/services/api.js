import { API_ENDPOINTS, EndpointHelpers } from './endpoints';

class ApiService {
  constructor() {
    // Use direct URL instead of process.env
    this.baseURL = 'http://127.0.0.1:8000/api';
    this.isRefreshing = false;
    this.failedQueue = [];
  }

  // Enhanced request method with token refresh
  async request(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
    
    const isFormData = options.body instanceof FormData;
    
    const config = {
      headers: {
        ...(!isFormData && { 'Content-Type': 'application/json' }),
        ...options.headers,
      },
      ...options,
    };

    // Remove Content-Type for FormData
    if (isFormData && config.headers['Content-Type']) {
      delete config.headers['Content-Type'];
    }

    // Add authorization header if token exists
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      console.log('🚀 Making API request to:', url);
      console.log('📋 Request config:', {
        method: config.method,
        headers: config.headers,
        body: config.body ? (isFormData ? '[FormData]' : JSON.parse(config.body)) : 'No body'
      });

      const response = await fetch(url, config);
      
      console.log('📨 Response status:', response.status);
      console.log('📨 Response ok:', response.ok);
      
      // If unauthorized, try to refresh token
      if (response.status === 401 && token) {
        console.log('🔐 Token expired, attempting refresh...');
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry the original request with new token
          const newToken = localStorage.getItem('accessToken');
          config.headers.Authorization = `Bearer ${newToken}`;
          console.log('🔄 Retrying request with new token...');
          return this.request(endpoint, options); // Recursive call with same options
        } else {
          // Refresh failed, logout user
          this.logout();
          throw new Error('Authentication failed. Please login again.');
        }
      }

      const responseText = await response.text();
      console.log('📨 Raw response text:', responseText);

      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
        console.log('✅ Parsed response data:', data);
      } catch (parseError) {
        console.error('❌ Failed to parse response as JSON:', parseError);
        throw new Error('Invalid JSON response from server');
      }

      if (!response.ok) {
        console.error('❌ API error response:', data);
        throw new Error(data.detail || data.message || data.error || `HTTP ${response.status}`);
      }

      console.log('✅ API request successful, returning data');
      return data;
    } catch (error) {
      console.error('❌ API request failed:', error);
      throw error;
    }
  }

  // Enhanced token refresh method
  async refreshToken() {
    // Prevent multiple simultaneous refresh attempts
    if (this.isRefreshing) {
      console.log('🔄 Token refresh already in progress, waiting...');
      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject });
      });
    }

    this.isRefreshing = true;
    
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        console.error('❌ No refresh token available');
        this.isRefreshing = false;
        this.processQueue(null, new Error('No refresh token available'));
        return false;
      }

      console.log('🔄 Refreshing token...');
      
      const response = await fetch(`${this.baseURL}/accounts/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed with status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Token refresh response:', data);

      if (data.access) {
        localStorage.setItem('accessToken', data.access);
        console.log('✅ New access token stored');
        
        // If the response includes a new refresh token, store it too
        if (data.refresh) {
          localStorage.setItem('refreshToken', data.refresh);
          console.log('✅ New refresh token stored');
        }
        
        this.isRefreshing = false;
        this.processQueue(data.access, null);
        return true;
      } else {
        throw new Error('No access token in refresh response');
      }
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      this.isRefreshing = false;
      this.processQueue(null, error);
      return false;
    }
  }

  // Process queued requests after token refresh
  processQueue(token, error) {
    this.failedQueue.forEach(promise => {
      if (error) {
        promise.reject(error);
      } else {
        promise.resolve(token);
      }
    });
    this.failedQueue = [];
  }

  // ===== AUTHENTICATION METHODS =====
  async login(email, password, user_type) {
    try {
      console.log('Login API call:', { email, user_type });
      
      const response = await fetch(`${this.baseURL}/accounts/token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, user_type }),
      });

      console.log('Login response status:', response.status);
      
      // First, get the response text to see what's actually being returned
      const responseText = await response.text();
      console.log('Raw login response:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse login response as JSON:', parseError);
        throw new Error('Invalid response from server');
      }

      console.log('Parsed login data:', data);

      if (!response.ok) {
        throw new Error(data.detail || data.message || data.error || 'Login failed');
      }

      // Handle different possible response structures
      let accessToken, refreshToken;

      // Try different possible field names for tokens
      if (data.access) {
        // Standard JWT structure
        accessToken = data.access;
        refreshToken = data.refresh;
      } else if (data.access_token) {
        // Alternative JWT structure
        accessToken = data.access_token;
        refreshToken = data.refresh_token;
      } else if (data.token) {
        // Simple token structure
        accessToken = data.token;
        refreshToken = data.refresh_token;
      } else if (data.key) {
        // Django REST framework token auth
        accessToken = data.key;
      } else {
        console.error('No token found in response. Available keys:', Object.keys(data));
        throw new Error('No authentication token received from server');
      }

      // Store tokens
      if (accessToken) {
        localStorage.setItem('accessToken', accessToken);
        console.log('Access token stored');
      }
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
        console.log('Refresh token stored');
      }
      localStorage.setItem('userType', user_type);

      // Return the complete response data
      return {
        ...data,
        access: accessToken,
        refresh: refreshToken
      };

    } catch (error) {
      console.error('Login API error:', error);
      throw error;
    }
  }

  async signup(userData) {
    return await this.request(API_ENDPOINTS.SIGNUP, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getCurrentUser() {
    return await this.request(API_ENDPOINTS.ME);
  }

  async updateUser(userId, userData) {
    return await this.request(EndpointHelpers.getUserUpdateUrl(userId), {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  // ===== PASSWORD RESET METHODS =====
  async requestPasswordReset(email) {
    return await this.request(API_ENDPOINTS.PASSWORD_RESET, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async confirmPasswordReset(uid, token, newPassword) {
    return await this.request(API_ENDPOINTS.PASSWORD_RESET_CONFIRM, {
      method: 'POST',
      body: JSON.stringify({ uid, token, new_password: newPassword }),
    });
  }

  // ===== PROPERTY METHODS =====
  async getProperties() {
    return await this.request(API_ENDPOINTS.PROPERTIES);
  }

  async createProperty(propertyData) {
    return await this.request(API_ENDPOINTS.CREATE_PROPERTY, {
      method: 'POST',
      body: JSON.stringify(propertyData),
    });
  }

  async updateProperty(propertyId, propertyData) {
    return await this.request(EndpointHelpers.getPropertyUpdateUrl(propertyId), {
      method: 'PUT',
      body: JSON.stringify(propertyData),
    });
  }

  async getPropertyUnits(propertyId) {
    return await this.request(EndpointHelpers.getPropertyUnitsUrl(propertyId));
  }

  // ===== UNIT METHODS =====
  async getUnits() {
    return await this.request(API_ENDPOINTS.UNITS);
  }

  async createUnit(unitData) {
    return await this.request(API_ENDPOINTS.CREATE_UNIT, {
      method: 'POST',
      body: JSON.stringify(unitData),
    });
  }

  async updateUnit(unitId, unitData) {
    return await this.request(EndpointHelpers.getUnitUpdateUrl(unitId), {
      method: 'PUT',
      body: JSON.stringify(unitData),
    });
  }

  async assignTenant(unitId, tenantId) {
    return await this.request(EndpointHelpers.getAssignTenantUrl(unitId, tenantId), {
      method: 'POST',
    });
  }

  async getAvailableUnits() {
    return await this.request(API_ENDPOINTS.AVAILABLE_UNITS);
  }

  async getUnitTypes() {
    return await this.request(API_ENDPOINTS.UNIT_TYPES);
  }

  async createUnitType(unitTypeData) {
    return await this.request(API_ENDPOINTS.UNIT_TYPES, {
      method: 'POST',
      body: JSON.stringify(unitTypeData),
    });
  }

  async getUnitTypeDetail(unitTypeId) {
    return await this.request(EndpointHelpers.getUnitTypeDetailUrl(unitTypeId));
  }

  // Bulk rent update with proper error handling
  async bulkRentUpdate(updateData) {
    try {
      console.log('🚀 Sending bulk rent update:', updateData);
      const response = await this.request('/payments/bulk-rent-update/', {
        method: 'POST',
        body: JSON.stringify(updateData),
      });
      console.log('✅ Bulk rent update response:', response);
      return response;
    } catch (error) {
      console.error('❌ Bulk rent update failed:', error);
      throw error;
    }
  }

  // Preview bulk rent update - ENHANCED VERSION
  async previewBulkRentUpdate(updateData) {
    try {
      console.log('🔍 Sending preview request:', updateData);
      
      const previewData = {
        ...updateData,
        preview_only: true
      };
      
      const response = await this.request('/payments/bulk-rent-update/', {
        method: 'POST',
        body: JSON.stringify(previewData),
      });
      
      console.log('🔍 Preview response:', response);
      
      // Ensure consistent response structure
      if (response && response.preview_data) {
        return {
          success: true,
          preview_data: Array.isArray(response.preview_data) ? response.preview_data : [],
          summary: response.summary || {
            units_affected: response.preview_data?.length || 0,
            total_increase: 0,
            total_new_revenue: 0
          }
        };
      }
      
      // Return empty data if no preview data
      return {
        success: true,
        preview_data: [],
        summary: {
          units_affected: 0,
          total_increase: 0,
          total_new_revenue: 0
        }
      };
      
    } catch (error) {
      console.error('❌ Preview bulk rent update failed:', error);
      // Return empty data instead of throwing error for better UX
      return {
        success: false,
        preview_data: [],
        summary: {
          units_affected: 0,
          total_increase: 0,
          total_new_revenue: 0
        },
        error: error.message
      };
    }
  }

  // Update unit rent - ENHANCED VERSION
  async updateUnitRent(unitId, rent) {
    try {
      console.log('💰 Updating unit rent:', { unitId, rent });
      
      const response = await this.request(`/payments/unit-rent-update/${unitId}/`, {
        method: 'PUT',
        body: JSON.stringify({ rent: parseFloat(rent) }),
      });
      
      console.log('✅ Unit rent update response:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Unit rent update failed:', error);
      throw error;
    }
  }

  // Get payments with better error handling and token refresh
  async getPayments(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key] && filters[key] !== 'all') {
          queryParams.append(key, filters[key]);
        }
      });
      
      const queryString = queryParams.toString();
      const url = queryString ? `/payments/rent-payments/?${queryString}` : '/payments/rent-payments/';
      
      console.log('📋 Fetching payments from:', url);
      const response = await this.request(url);
      console.log('✅ Payments response received, length:', Array.isArray(response) ? response.length : 'unknown');
      
      // Handle different response structures
      if (Array.isArray(response)) {
        console.log('✅ Returning payments array with', response.length, 'items');
        return response;
      } else if (response && Array.isArray(response.data)) {
        console.log('✅ Returning payments data array with', response.data.length, 'items');
        return response.data;
      } else if (response && Array.isArray(response.results)) {
        console.log('✅ Returning payments results array with', response.results.length, 'items');
        return response.results;
      } else if (response && typeof response === 'object') {
        // If it's a single payment object, return as array
        console.log('✅ Returning single payment as array');
        return [response];
      } else {
        console.warn('⚠️ Unexpected payments response format, returning empty array');
        return [];
      }
      
    } catch (error) {
      console.error('❌ Failed to fetch payments:', error);
      // Return empty array instead of throwing to prevent UI crashes
      return [];
    }
  }

  // ===== PAYMENT METHODS =====
  async getRentPayments() {
    return await this.request(API_ENDPOINTS.RENT_PAYMENTS);
  }

  async getRentPaymentDetail(paymentId) {
    return await this.request(EndpointHelpers.getRentPaymentDetailUrl(paymentId));
  }

  async initiateRentPayment(unitId) {
    return await this.request(EndpointHelpers.getInitiateRentPaymentUrl(unitId), {
      method: 'POST',
    });
  }

  async initiateDepositPayment(unitId) {
    return await this.request(API_ENDPOINTS.INITIATE_DEPOSIT_PAYMENT, {
      method: 'POST',
      body: JSON.stringify({ unit_id: unitId }),
    });
  }

  async getDepositStatus(paymentId) {
    return await this.request(EndpointHelpers.getDepositStatusUrl(paymentId));
  }

  async getRentSummary() {
    return await this.request(API_ENDPOINTS.RENT_SUMMARY);
  }

  // ===== SUBSCRIPTION METHODS =====
  async getSubscriptionStatus() {
    return await this.request(API_ENDPOINTS.SUBSCRIPTION_STATUS);
  }

  async updateTillNumber(tillNumber) {
    return await this.request(API_ENDPOINTS.UPDATE_TILL_NUMBER, {
      method: 'POST',
      body: JSON.stringify({ mpesa_till_number: tillNumber }),
    });
  }

  async updateReminderPreferences(preferences) {
    return await this.request(API_ENDPOINTS.UPDATE_REMINDER_PREFERENCES, {
      method: 'POST',
      body: JSON.stringify(preferences),
    });
  }

  // ===== REPORT METHODS =====
  async createReport(reportData) {
    return await this.request(API_ENDPOINTS.CREATE_REPORT, {
      method: 'POST',
      body: JSON.stringify(reportData),
    });
  }

  async getOpenReports() {
    return await this.request(API_ENDPOINTS.OPEN_REPORTS);
  }

  async updateReportStatus(reportId, status) {
    return await this.request(EndpointHelpers.getUpdateReportStatusUrl(reportId), {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // ===== DASHBOARD METHODS =====
  async getDashboardStats() {
    return await this.request(API_ENDPOINTS.DASHBOARD_STATS);
  }

  // ===== CONTEXT METHODS (Lists) =====
  async getTenants() {
    return await this.request(API_ENDPOINTS.TENANTS);
  }

  async getLandlords() {
    return await this.request(API_ENDPOINTS.LANDLORDS);
  }

  // ===== STEP-BY-STEP REGISTRATION METHODS =====
  async saveTenantStep(step, data) {
    return await this.request(`${API_ENDPOINTS.TENANT_REGISTRATION_STEP}/${step}/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTenantStep(step) {
    return await this.request(`${API_ENDPOINTS.TENANT_REGISTRATION_STEP}/${step}/`);
  }

  // Landlord step-by-step registration  
  async saveLandlordStep(step, data) {
    return await this.request(`${API_ENDPOINTS.LANDLORD_REGISTRATION_STEP}/${step}/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getLandlordStep(step) {
    return await this.request(`${API_ENDPOINTS.LANDLORD_REGISTRATION_STEP}/${step}/`);
  }

  // Complete registration
  async completeTenantRegistration(finalData) {
    return await this.request(API_ENDPOINTS.COMPLETE_TENANT_REGISTRATION, {
      method: 'POST',
      body: JSON.stringify(finalData),
    });
  }

  async validateLandlord(landlordCode) {
    return await this.request(API_ENDPOINTS.VALIDATE_LANDLORD, {
      method: 'POST',
      body: JSON.stringify({ landlord_code: landlordCode }),
    });
  }

  async completeLandlordRegistration(finalData) {
    return await this.request(API_ENDPOINTS.COMPLETE_LANDLORD_REGISTRATION, {
      method: 'POST',
      body: JSON.stringify(finalData),
    });
  }

  // ===== UTILITY METHODS =====
  logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('userType');
    window.location.href = '/login';
  }

  isAuthenticated() {
    return !!localStorage.getItem('accessToken');
  }

  getUserType() {
    return localStorage.getItem('userType');
  }
// Add this method to your existing ApiService class in api.js
async getUsers() {
  return await this.request('/accounts/users/');
}
  // Check if token is valid
  async validateToken() {
    try {
      await this.getCurrentUser();
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Create and export a singleton instance
export const apiService = new ApiService();
export default apiService;