import React from 'react'
import { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tenantsAPI, propertiesAPI, paymentsAPI, communicationAPI } from '../services/api';
import { useToast } from './ToastContext';

export const AppContext = createContext();

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-red-800 font-semibold">Something went wrong</h2>
          <p className="text-red-600">{this.state.error?.message}</p>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const ContextProvider = (props) => {
  // API data states
  const [tenants, setTenants] = useState([]);
  const [properties, setProperties] = useState([]);
  const [propertyUnits, setPropertyUnits] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [reports, setReports] = useState([]);

  // Loading and error states
  const [tenantsLoading, setTenantsLoading] = useState(false);
  const [propertiesLoading, setPropertiesLoading] = useState(false);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [reportsLoading, setReportsLoading] = useState(false);

  const [tenantsError, setTenantsError] = useState(null);
  const [propertiesError, setPropertiesError] = useState(null);
  const [unitsError, setUnitsError] = useState(null);
  const [transactionsError, setTransactionsError] = useState(null);
  const [reportsError, setReportsError] = useState(null);

  // === FIXED: Fetch tenants from API with proper data transformation ===
// === ULTIMATE FIX: Fetch tenants with multiple fallbacks ===
const fetchTenants = async () => {
  try {
    setTenantsLoading(true);
    setTenantsError(null);
    console.log('🔄 fetchTenants: Starting...');

    let tenantsData = [];

    // STRATEGY 1: Try direct tenants endpoint
    try {
      console.log('1️⃣ Trying direct tenants endpoint...');
      const response = await tenantsAPI.getTenants();
      tenantsData = response.data || [];
      console.log(`📊 Direct tenants: ${tenantsData.length} found`);
    } catch (error) {
      console.log('⚠️ Direct tenants endpoint failed');
    }

    // STRATEGY 2: If no tenants found, try users endpoint with tenant filter
    if (tenantsData.length === 0) {
      try {
        console.log('2️⃣ Trying users endpoint with tenant filter...');
        // This might vary based on your API - try different approaches
        const usersResponse = await api.get('/accounts/users/', {
          params: { user_type: 'tenant' }
        });
        if (usersResponse.data && Array.isArray(usersResponse.data)) {
          tenantsData = usersResponse.data.filter(user => user.user_type === 'tenant');
          console.log(`📊 Users as tenants: ${tenantsData.length} found`);
        }
      } catch (error) {
        console.log('⚠️ Users endpoint failed');
      }
    }

    // STRATEGY 3: Extract from units (this should work if units have tenant data)
    if (tenantsData.length === 0) {
      try {
        console.log('3️⃣ Extracting tenants from units...');
        const unitsResponse = await propertiesAPI.getUnits();
        const unitsWithTenants = (unitsResponse.data || []).filter(unit => 
          unit.tenant && typeof unit.tenant === 'object' && unit.tenant.id
        );
        
        console.log(`🏠 Units with tenant objects: ${unitsWithTenants.length}`);
        
        // Extract unique tenants from units
        const tenantMap = new Map();
        unitsWithTenants.forEach(unit => {
          if (unit.tenant && unit.tenant.id && !tenantMap.has(unit.tenant.id)) {
            tenantMap.set(unit.tenant.id, {
              ...unit.tenant,
              current_unit: unit,
              propertyId: unit.property_obj?.id?.toString() || 'unknown'
            });
          }
        });
        
        tenantsData = Array.from(tenantMap.values());
        console.log(`👥 Unique tenants from units: ${tenantsData.length}`);
        
      } catch (error) {
        console.error('❌ Units extraction failed:', error);
      }
    }

    // STRATEGY 4: Last resort - check if units have tenant IDs but not full objects
    if (tenantsData.length === 0) {
      try {
        console.log('4️⃣ Checking for tenant IDs in units...');
        const unitsResponse = await propertiesAPI.getUnits();
        const unitsWithTenantIds = (unitsResponse.data || []).filter(unit => 
          unit.tenant && (typeof unit.tenant === 'number' || typeof unit.tenant === 'string')
        );
        
        console.log(`🔢 Units with tenant IDs: ${unitsWithTenantIds.length}`);
        
        if (unitsWithTenantIds.length > 0) {
          // We have tenant IDs but need to fetch the actual tenant data
          console.log('💡 Found tenant IDs in units, but need to fetch tenant details');
          // For now, create placeholder tenants
          tenantsData = unitsWithTenantIds.map(unit => ({
            id: unit.tenant,
            full_name: `Tenant from Unit ${unit.unit_number}`,
            email: `tenant${unit.tenant}@example.com`,
            phone_number: 'N/A',
            current_unit: unit,
            propertyId: unit.property_obj?.id?.toString() || 'unknown',
            isPlaceholder: true
          }));
        }
      } catch (error) {
        console.error('❌ Tenant ID check failed:', error);
      }
    }

    console.log('🔄 fetchTenants: Final tenants data:', tenantsData);

    // If still no tenants, check if this is expected (new landlord with no tenants)
    if (tenantsData.length === 0) {
      console.log('ℹ️ No tenants found in the system. This might be normal for a new landlord.');
      setTenantsError('No tenants found. You can add tenants by assigning them to units.');
      setTenants([]);
      return;
    }

    // Transform the data
    const transformedTenants = tenantsData.map((tenant) => {
      return {
        id: tenant.id,
        full_name: tenant.full_name || tenant.name || 'Unknown Tenant',
        email: tenant.email || 'no-email@example.com',
        phone_number: tenant.phone_number || tenant.phone || 'N/A',
        current_unit: tenant.current_unit || null,
        propertyId: tenant.propertyId || tenant.property_id || 'unknown',
        isPlaceholder: tenant.isPlaceholder || false,
        // Include all original data
        ...tenant
      };
    });

    console.log('✅ fetchTenants: Successfully set tenants:', transformedTenants.length);
    setTenants(transformedTenants);

  } catch (error) {
    console.error('❌ fetchTenants: Ultimate error:', error);
    
    setTenantsError('Unable to load tenant data. Please check your connection and try again.');
    setTenants([]);
  } finally {
    setTenantsLoading(false);
  }
};
// === SIMPLIFIED: Fetch reports from API ===
const fetchReports = async () => {
  try {
    setReportsLoading(true);
    setReportsError(null);
    console.log('🔄 fetchReports: Starting...');
    
    const response = await communicationAPI.getReports();
    console.log('🔄 fetchReports: Raw API response:', response);
    
    // Handle different response structures
    let reportsData = response.data;
    
    // If response.data doesn't exist, try response directly
    if (!reportsData && Array.isArray(response)) {
      reportsData = response;
    }
    
    console.log('🔄 fetchReports: Processed data:', reportsData);
    
    if (!reportsData || !Array.isArray(reportsData)) {
      console.error('❌ fetchReports: Invalid data format:', reportsData);
      setReportsError('No report data received or invalid format');
      setReports([]);
      return;
    }
    
    if (reportsData.length === 0) {
      console.log('ℹ️ fetchReports: No reports found in response');
      setReports([]);
      return;
    }
    
    // Simple transformation
    const transformedReports = reportsData.map((report, index) => {
      return {
        id: report.id || `report-${index}`,
        title: report.issue_title || report.title || `Report ${index + 1}`,
        category: report.issue_category || report.category || 'general',
        priority: report.priority_level || report.priority || 'medium',
        status: report.status || 'open',
        date: report.reported_date || report.created_at || report.date || new Date().toISOString(),
        description: report.description || report.issue_description || 'No description',
        tenantName: report.tenant_name || report.tenant?.full_name || report.reported_by || 'Unknown',
        unitNumber: report.unit_number || report.unit?.unit_number || 'N/A',
        propertyName: report.property_name || report.property?.name || 'Unknown',
        // Include all original data
        ...report
      };
    });
    
    console.log('✅ fetchReports: Successfully set reports:', transformedReports.length);
    setReports(transformedReports);
    
  } catch (error) {
    console.error('❌ fetchReports: Error:', error);
    
    // Detailed error information
    if (error.response) {
      console.error('❌ Response error:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
      
      if (error.response.status === 401) {
        setReportsError('Authentication failed. Please log in again.');
      } else if (error.response.status === 403) {
        setReportsError('You do not have permission to access report data.');
      } else if (error.response.status === 404) {
        setReportsError('Reports endpoint not found (404). Check API URL.');
      } else {
        setReportsError(`Server error: ${error.response.status} - ${error.response.data?.error || 'Unknown error'}`);
      }
    } else if (error.request) {
      console.error('❌ Request error:', error.request);
      setReportsError('Network error: Could not connect to server.');
    } else {
      setReportsError(`Error: ${error.message}`);
    }
    
    setReports([]);
  } finally {
    setReportsLoading(false);
  }
};
  // Fetch properties from API - IMPROVED VERSION with 401 handling
  const fetchProperties = async () => {
    try {
      setPropertiesLoading(true);
      setPropertiesError(null);
      console.log('🔄 Fetching properties...');
      
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.log('No auth token, skipping properties fetch');
        setProperties([]);
        return;
      }
      
      const response = await propertiesAPI.getProperties();
      console.log('✅ Properties data received:', response.data);
      setProperties(response.data);
    } catch (error) {
      console.error('❌ Error fetching properties:', error);
      
      if (error.response?.status === 401) {
        setPropertiesError('Authentication required. Please log in again.');
      } else {
        setPropertiesError(error.response?.data?.error || 'Failed to load properties');
      }
    } finally {
      setPropertiesLoading(false);
    }
  };

  // Fetch property units from API - IMPROVED VERSION with 401 handling
  const fetchPropertyUnits = async () => {
    try {
      setUnitsLoading(true);
      setUnitsError(null);
      console.log('🔄 Fetching property units...');
      
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.log('No auth token, skipping units fetch');
        setPropertyUnits([]);
        return;
      }
      
      const response = await propertiesAPI.getUnits();
      console.log('✅ Units data received:', response.data);
      
      // Enhanced transformation with better error handling
      const transformedUnits = response.data.map(unit => {
        try {
          return {
            id: unit.id,
            unitNumber: unit.unit_number || 'N/A',
            type: unit.unit_type?.name || unit.unit_type || 'N/A',
            rent: unit.rent || 0,
            size: unit.size || 'N/A',
            status: unit.is_available ? 'available' : 'occupied',
            isAvailable: Boolean(unit.is_available),
            tenant: unit.tenant?.full_name || unit.tenant?.name || null,
            propertyId: unit.property_obj?.id?.toString() || unit.property?.toString() || 'unknown',
            bedrooms: unit.bedrooms || 0,
            bathrooms: unit.bathrooms || 1
          };
        } catch (transformError) {
          console.warn('Error transforming unit:', unit, transformError);
          return null;
        }
      }).filter(unit => unit !== null); // Remove any failed transformations
      
      setPropertyUnits(transformedUnits);
      console.log('✅ Transformed units:', transformedUnits.length);
      
    } catch (error) {
      console.error('❌ Error fetching property units:', error);
      
      if (error.response?.status === 401) {
        setUnitsError('Authentication required. Please log in again.');
      } else {
        setUnitsError(error.response?.data?.error || 'Failed to load property units');
      }
    } finally {
      setUnitsLoading(false);
    }
  };

  // Fetch transactions from API - IMPROVED VERSION with 401 handling
  const fetchTransactions = async () => {
    try {
      setTransactionsLoading(true);
      setTransactionsError(null);
      console.log('🔄 Fetching transactions...');
      
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.log('No auth token, skipping transactions fetch');
        setTransactions([]);
        return;
      }
      
      const response = await paymentsAPI.getPaymentHistory();
      console.log('✅ Transactions data received:', response.data);
      console.log('🔍 First transaction raw:', response.data[0]);
      
      const transformedTransactions = response.data.map(txn => {
        // Extract tenant ID from multiple possible sources
        let tenantId = null;
        
        // Method 1: Direct tenant field (object or ID)
        if (txn.tenant) {
          tenantId = typeof txn.tenant === 'object' ? txn.tenant.id : txn.tenant;
        }
        
        // Method 2: tenant_id field
        if (!tenantId && txn.tenant_id) {
          tenantId = txn.tenant_id;
        }
        
        // Method 3: From unit object (if tenant lives in the unit)
        if (!tenantId && txn.unit) {
          if (typeof txn.unit === 'object') {
            tenantId = txn.unit.tenant?.id || txn.unit.tenant;
          }
        }
        
        // Method 4: From unit_id (need to match with property units)
        if (!tenantId && txn.unit_id) {
          // This will need to be matched with propertyUnits later
          console.log('⚠️ Transaction has unit_id but no direct tenant:', txn.id);
        }
        
        console.log(`🔍 Transaction ${txn.id} -> Tenant ID: ${tenantId}`);
        
        return {
          id: txn.id,
          tenantId: tenantId,
          date: txn.created_at || txn.date || new Date().toISOString(),
          description: txn.description || `Payment for ${txn.unit?.unit_number || 'unit'}`,
          amount: txn.amount || 0,
          type: txn.transaction_type || txn.type || 'rent',
          status: txn.status || 'pending',
          reference: txn.reference_number || txn.reference || `REF-${txn.id}`,
          paymentMethod: txn.payment_method || 'mpesa',
          propertyId: txn.property?.id?.toString() || txn.property_id?.toString() || 'unknown',
          // Keep unit info for reference
          unitId: txn.unit?.id || txn.unit_id || txn.unit,
          unitNumber: txn.unit?.unit_number || txn.unit_number,
          // Keep original data for debugging
          ...txn
        };
      });
      
      console.log('✅ Transformed transactions with tenant IDs:', transformedTransactions.filter(t => t.tenantId).length);
      console.log('⚠️ Transactions without tenant IDs:', transformedTransactions.filter(t => !t.tenantId).length);
      
      setTransactions(transformedTransactions);
    } catch (error) {
      console.error('❌ Error fetching transactions:', error);
      
      if (error.response?.status === 401) {
        setTransactionsError('Authentication required. Please log in again.');
      } else {
        setTransactionsError(error.response?.data?.error || 'Failed to load transactions');
      }
    } finally {
      setTransactionsLoading(false);
    }
  };

  // Fetch all data on component mount ONLY when user is authenticated - UPDATED
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      fetchTenants();
      fetchProperties();
      fetchPropertyUnits();
      fetchTransactions();
      fetchReports();
    }
  }, []);

  // Selected property (so admin pages know which property is active)
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);

  // Set default selected property when properties are loaded
  useEffect(() => {
    if (properties.length > 0 && !selectedPropertyId) {
      setSelectedPropertyId(properties[0].id.toString());
    }
  }, [properties, selectedPropertyId]);

  // Helper function to calculate estimated tenants from units
  const getEstimatedTenants = () => {
    // Calculate estimated tenants from occupied units
    const occupiedUnits = propertyUnits.filter(unit => !unit.isAvailable && unit.tenant);
    
    const estimatedTenants = occupiedUnits.map(unit => ({
      id: `estimated-${unit.id}`,
      full_name: unit.tenant || 'Unknown Tenant',
      email: `${unit.unitNumber}@estimated.com`,
      phone_number: 'N/A',
      unit_data: {
        unit_number: unit.unitNumber,
        rent: unit.rent,
        rent_remaining: unit.rent // Default assumption
      },
      isEstimated: true // Flag to indicate this is estimated data
    }));
    
    return estimatedTenants;
  };

  // Get tenants with fallback to estimated data
  const getTenantsWithFallback = () => {
    if (tenants.length > 0) {
      return tenants;
    }
    return getEstimatedTenants();
  };

  // Helper functions
  const getUnitsByProperty = (propertyId) => {
    return (propertyUnits || []).filter(u => u.propertyId === propertyId);
  };

  // === FIXED: getTenantsByProperty function ===
  const getTenantsByProperty = (propertyId) => {
    if (!propertyId) return [];
    
    // First, try to get tenants from the actual tenants array
    const directTenants = tenants.filter(tenant => {
      const tenantPropertyId = tenant.current_unit?.property_obj?.id?.toString() || 
                             tenant.propertyId || 
                             tenant.property?.toString();
      return tenantPropertyId === propertyId.toString();
    });
    
    if (directTenants.length > 0) {
      return directTenants;
    }
    
    // Fallback: get tenants from units
    const unitsWithTenants = propertyUnits.filter(unit => 
      unit.propertyId === propertyId && unit.tenant
    );
    
    return unitsWithTenants.map(unit => ({
      id: `unit-${unit.id}`,
      full_name: unit.tenant,
      email: `${unit.unitNumber}@estimated.com`,
      phone_number: 'N/A',
      current_unit: unit,
      isEstimated: true
    }));
  };

  const getPropertyUnitStats = (propertyId) => {
    const unitsForProperty = getUnitsByProperty(propertyId);
    const total = unitsForProperty.length;
    const available = unitsForProperty.filter(u => u.isAvailable).length;
    const occupied = unitsForProperty.filter(u => u.status === 'occupied').length;
    const revenue = unitsForProperty
      .filter(u => u.status === 'occupied')
      .reduce((s, u) => s + (Number(u.rent) || 0), 0);
    return { total, available, occupied, revenue, units: unitsForProperty };
  };

  const getTransactionsByTenant = (tenantId) => {
    return transactions.filter(t => t.tenantId == tenantId); // loose equality to tolerate string/number ids
  };

  // Property management functions (for local state updates)
  const addUnit = (newUnit) => {
    setPropertyUnits(prev => [...prev, newUnit]);
  };

  const updateUnitAvailability = (unitId, isAvailable) => {
    setPropertyUnits(prev =>
      prev.map(unit => {
        if (unit.id === unitId) {
          return {
            ...unit,
            isAvailable: isAvailable,
            status: isAvailable ? 'available' : 'occupied'
          };
        }
        return unit;
      })
    );
  };

  // Placeholder functions for missing property management
  const addProperty = (landlordId, propertyData) => {
    // Placeholder: Add property to local state or call API
    console.log('Adding property:', propertyData);
    // For now, just log; implement API call if needed
  };

  const updateProperty = (propertyId, updatedData) => {
    // Placeholder
    console.log('Updating property:', propertyId, updatedData);
  };

  const addRoomType = (propertyId, roomTypeData) => {
    // Placeholder
    console.log('Adding room type:', roomTypeData);
  };

  const deleteRoomType = (roomTypeId) => {
    // Placeholder
    console.log('Deleting room type:', roomTypeId);
  };

  // Transaction management placeholders
  const addTransaction = (transactionData) => {
    // Placeholder
    console.log('Adding transaction:', transactionData);
  };

  const applyPayment = (paymentData) => {
    // Placeholder
    console.log('Applying payment:', paymentData);
  };

  return (
    <AppContext.Provider value={{
      // API data
      tenants,
      properties,
      propertyUnits,
      transactions,
      reports,

      // Loading states
      tenantsLoading,
      propertiesLoading,
      unitsLoading,
      transactionsLoading,
      reportsLoading,

      // Error states
      tenantsError,
      propertiesError,
      unitsError,
      transactionsError,
      reportsError,

      // Property selection
      selectedPropertyId,
      setSelectedPropertyId,

      // Property management
      addProperty,
      updateProperty,
      addRoomType,
      deleteRoomType,
      addUnit,
      updateUnitAvailability,

      // Helper functions
      getUnitsByProperty,
      getTenantsByProperty, // This is the fixed function
      getPropertyUnitStats,
      getTransactionsByTenant,
      getEstimatedTenants,
      getTenantsWithFallback,

      // Transaction management
      addTransaction,
      applyPayment,

      // Backward compatibility - map tenants to mockTenants for existing components
      mockTenants: getTenantsWithFallback(), // Use fallback tenants
      mockPendingApplications: [], // Recent tenant applications - can be populated from API if needed
      mockEvictedTenants: [], // Evicted tenants - can be populated from API if needed
      landlords: [], // Simplified - could be expanded if needed
      setLandlords: () => {}, // Placeholder
    }}>
      {props.children}
    </AppContext.Provider>
  )
}

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppContext Provider');
  }
  return context;
};

export default ContextProvider;
export { ErrorBoundary }; // Export ErrorBoundary for use in other components

// ============== ADD PROPERTY FORM COMPONENT ==============
export const AddPropertyForm = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Simplified form data - only what backend needs
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    state: '',
    unit_count: ''
  });

  const [errors, setErrors] = useState({});
// Add this function to your ContextProvider component
const debugAPICalls = async () => {
  console.log('🔍 ===== STARTING API DEBUG =====');
  
  const token = localStorage.getItem('accessToken');
  console.log('🔐 Token exists:', !!token);
  if (token) {
    console.log('🔐 Token length:', token.length);
  }

  try {
    // Test tenants endpoint
    console.log('🧪 Testing tenants endpoint...');
    const tenantsResponse = await tenantsAPI.getTenants();
    console.log('✅ Tenants response structure:', tenantsResponse);
    console.log('📊 Tenants response.data:', tenantsResponse.data);
    console.log('📊 Tenants response.status:', tenantsResponse.status);
    
    // Test reports endpoint
    console.log('🧪 Testing reports endpoint...');
    const reportsResponse = await communicationAPI.getReports();
    console.log('✅ Reports response structure:', reportsResponse);
    console.log('📊 Reports response.data:', reportsResponse.data);
    console.log('📊 Reports response.status:', reportsResponse.status);
    
    // Test if we can access the actual data
    if (tenantsResponse.data && Array.isArray(tenantsResponse.data)) {
      console.log(`👥 Tenants count: ${tenantsResponse.data.length}`);
      if (tenantsResponse.data.length > 0) {
        console.log('📋 First tenant:', tenantsResponse.data[0]);
      }
    }
    
    if (reportsResponse.data && Array.isArray(reportsResponse.data)) {
      console.log(`📝 Reports count: ${reportsResponse.data.length}`);
      if (reportsResponse.data.length > 0) {
        console.log('📋 First report:', reportsResponse.data[0]);
      }
    }
    
  } catch (error) {
    console.error('❌ Debug API call failed:', error);
    console.error('❌ Error details:', error.response?.data);
    console.error('❌ Error status:', error.response?.status);
    console.error('❌ Error message:', error.message);
  }
  
  console.log('🔍 ===== END API DEBUG =====');
};

// Call this function in your useEffect to see what's happening
useEffect(() => {
  const initializeData = async () => {
    const token = localStorage.getItem('accessToken');
    console.log('🎯 Initializing app data...');
    
    if (token) {
      // First, run debug to see what's happening
      await debugAPICalls();
      
      // Then fetch data
      try {
        await fetchProperties();
        await fetchPropertyUnits();
        await fetchTenants();
        await fetchTransactions();
        await fetchReports();
        
        console.log('✅ All data initialized successfully');
      } catch (error) {
        console.error('❌ Error initializing data:', error);
      }
    } else {
      console.log('⚠️ No auth token, skipping data initialization');
    }
  };

  initializeData();
}, []);
  const validate = () => {
    const newErrors = {};
    
    // Required fields validation
    if (!formData.name.trim()) {
      newErrors.name = 'Property name is required';
    }
    
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    
    if (!formData.state.trim()) {
      newErrors.state = 'State/County is required';
    }
    
    if (!formData.unit_count || isNaN(formData.unit_count) || Number(formData.unit_count) <= 0) {
      newErrors.unit_count = 'Number of units must be a positive number';
    }

    return newErrors;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    
    try {
      // Send data to backend
      const response = await propertiesAPI.createProperty(formData);
      
      if (response.data) {
        showToast?.('Property created successfully!', 'success');
        navigate('/admin/organisation');
      }
    } catch (error) {
      console.error('Error creating property:', error);
      const errorMessage = error.response?.data?.message 
        || error.response?.data?.error 
        || 'Failed to create property. Please try again.';
      showToast?.(errorMessage, 'error');
      
      // Set field-specific errors if provided by backend
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFormData({
      name: '',
      city: '',
      state: '',
      unit_count: ''
    });
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate('/admin/organisation')}
          className="mb-6 flex items-center text-blue-600 hover:text-blue-800 font-medium"
        >
          <span className="mr-2">←</span> Back to Organisation
        </button>
        
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Property</h1>
          <p className="text-gray-600 mb-8">Add a new property to your portfolio</p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Property Name */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Property Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Sunrise Apartments"
                className={`w-full px-4 py-3 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                required
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            {/* City */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="e.g., Nairobi"
                className={`w-full px-4 py-3 border ${errors.city ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                required
              />
              {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
            </div>

            {/* State/County */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                State/County <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                placeholder="e.g., Nairobi County"
                className={`w-full px-4 py-3 border ${errors.state ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                required
              />
              {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
            </div>

            {/* Number of Units */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Number of Units <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="unit_count"
                value={formData.unit_count}
                onChange={handleInputChange}
                min="1"
                placeholder="e.g., 20"
                className={`w-full px-4 py-3 border ${errors.unit_count ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                required
              />
              {errors.unit_count && <p className="text-red-500 text-sm mt-1">{errors.unit_count}</p>}
              <p className="text-sm text-gray-500">
                This is the maximum number of rental units for this property
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t">
              <button
                type="button"
                onClick={handleClear}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                disabled={loading}
              >
                Clear
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Property'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};