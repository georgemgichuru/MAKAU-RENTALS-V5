import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from "../services/api";

export const AppContext = createContext();

const ContextProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  // State for tenants
  const [tenants, setTenants] = useState([]);
  const [tenantsLoading, setTenantsLoading] = useState(false);
  const [tenantsError, setTenantsError] = useState(null);

  // State for reports
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState(null);

  // State for units
  const [units, setUnits] = useState([]);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [unitsError, setUnitsError] = useState(null);

  const [unitTypes, setUnitTypes] = useState([]);
  const [unitTypesLoading, setUnitTypesLoading] = useState(false);
  const [unitTypesError, setUnitTypesError] = useState(null);

  // State for pending applications
  const [pendingApplications, setPendingApplications] = useState([]);
  const [pendingApplicationsLoading, setPendingApplicationsLoading] = useState(false);
  const [pendingApplicationsError, setPendingApplicationsError] = useState(null);

  // State for evicted tenants
  const [evictedTenants, setEvictedTenants] = useState([]);
  const [evictedTenantsLoading, setEvictedTenantsLoading] = useState(false);
  const [evictedTenantsError, setEvictedTenantsError] = useState(null);

  // Landlords with properties
  const [landlords, setLandlords] = useState([]);
  const [landlordsLoading, setLandlordsLoading] = useState(false);
  const [landlordsError, setLandlordsError] = useState(null);

  // Properties
  const [properties, setProperties] = useState([]);
  const [propertiesLoading, setPropertiesLoading] = useState(false);
  const [propertiesError, setPropertiesError] = useState(null);

  // Selected property state
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);

  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsError, setPaymentsError] = useState(null);

  // Fetch data on component mount
  useEffect(() => {
    const initializeData = async () => {
      console.log('🚀 DEBUG: Initializing AppContext...');
      const userType = localStorage.getItem('userType');
      
      if (userType === 'landlord') {
        console.log('🔍 DEBUG: Starting data fetch sequence...');
        
        // Step 1: Fetch units
        console.log('📋 DEBUG: Step 1 - Fetching units...');
        await fetchUnits();
        
        // Step 2: Fetch payments (this has tenant data)
        console.log('📋 DEBUG: Step 2 - Fetching payments...');
        await fetchPayments();
        
        // Step 3: Fetch tenants
        console.log('📋 DEBUG: Step 3 - Fetching tenants...');
        await fetchTenants();
        
        // Step 4: Fetch other data
        console.log('📋 DEBUG: Step 4 - Fetching other data...');
        await Promise.all([
          fetchProperties(),
          fetchLandlords(),
          fetchPendingApplications(),
          fetchEvictedTenants(),
          fetchUnitTypes()
        ]);
        
        console.log('✅ DEBUG: All data fetching completed');
        
      } else if (userType === 'tenant') {
        console.log('✅ Tenant logged in - skipping landlord data fetch');
      }
    };

    initializeData();
  }, []);

  // DEBUG: Enhanced tenants fetch function with detailed logging
  // FIXED: Enhanced tenants fetch function with proper async handling
const fetchTenants = async () => {
  setTenantsLoading(true);
  try {
    console.log('🔄 DEBUG: Starting tenant data collection...');
    
    // Wait a moment to ensure payments and units data is properly set
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('📊 DEBUG: Current payments data after delay:', payments);
    console.log('📊 DEBUG: Current units data after delay:', units);
    
    let tenantsData = [];
    const tenantMap = new Map();

    // METHOD 1: Extract from PAYMENTS
    console.log('💰 DEBUG: METHOD 1 - Checking payments for tenant data...');
    if (payments && payments.length > 0) {
      console.log(`💰 DEBUG: Found ${payments.length} payments to check`);
      
      payments.forEach((payment, index) => {
        if (payment.tenant && payment.tenant.id) {
          const tenantId = payment.tenant.id;
          
          if (!tenantMap.has(tenantId)) {
            const tenantFromPayment = {
              id: tenantId,
              full_name: payment.tenant_name || payment.tenant.full_name || `Tenant ${tenantId}`,
              name: payment.tenant_name || payment.tenant.full_name || `Tenant ${tenantId}`,
              email: payment.tenant?.email || 'No email provided',
              phone_number: payment.phone || payment.tenant?.phone_number || 'N/A',
              emergency_contact: null,
              government_id: null,
              date_joined: payment.date || new Date().toISOString(),
              unit: payment.unit ? {
                id: payment.unit.id,
                unit_number: payment.unit.unit_number || 'N/A',
                property_name: 'Unknown Property',
                rent: parseFloat(payment.amount) || 0,
                rent_paid: parseFloat(payment.amount) || 0,
                rent_remaining: 0,
                is_available: false,
                assigned_date: payment.date || null
              } : null,
              status: 'active',
              reminder_mode: 'days_before',
              reminder_value: 10,
              source: 'payments'
            };
            tenantMap.set(tenantId, tenantFromPayment);
          }
        }
      });
    }

    // METHOD 2: Extract from UNITS
    console.log('🏠 DEBUG: METHOD 2 - Checking units for tenant data...');
    if (units && units.length > 0) {
      const unitsWithTenants = units.filter(unit => unit.tenant && unit.tenant.id);
      
      unitsWithTenants.forEach((unit) => {
        const tenant = unit.tenant;
        const tenantId = tenant.id;
        
        if (!tenantMap.has(tenantId)) {
          const tenantFromUnit = {
            id: tenantId,
            full_name: tenant.full_name || tenant.name || `Tenant ${tenantId}`,
            name: tenant.full_name || tenant.name || `Tenant ${tenantId}`,
            email: tenant.email || 'No email provided',
            phone_number: tenant.phone_number || 'N/A',
            emergency_contact: tenant.emergency_contact || null,
            government_id: tenant.government_id || null,
            date_joined: tenant.date_joined || tenant.created_at || new Date().toISOString(),
            unit: {
              id: unit.id,
              unit_number: unit.unit_number || 'N/A',
              property_name: unit.property?.name || 'Unknown Property',
              rent: parseFloat(unit.rent) || 0,
              rent_paid: parseFloat(unit.rent_paid) || 0,
              rent_remaining: parseFloat(unit.rent_remaining) || 0,
              is_available: unit.is_available,
              assigned_date: unit.assigned_date || null
            },
            status: 'active',
            reminder_mode: tenant.reminder_mode || 'days_before',
            reminder_value: tenant.reminder_value || 10,
            source: 'units'
          };
          tenantMap.set(tenantId, tenantFromUnit);
        }
      });
    }

    // METHOD 3: Try USERS endpoint
    console.log('👥 DEBUG: METHOD 3 - Trying users endpoint...');
    if (tenantMap.size === 0) {
      try {
        const usersResponse = await apiService.getUsers();
        
        if (Array.isArray(usersResponse) && usersResponse.length > 0) {
          const tenantUsers = usersResponse.filter(user => user.user_type === 'tenant');
          
          tenantUsers.forEach((tenant) => {
            const tenantId = tenant.id;
            
            if (!tenantMap.has(tenantId)) {
              const assignedUnit = units.find(unit => 
                unit.tenant && unit.tenant.id === tenantId
              );
              
              let unitData = null;
              if (assignedUnit) {
                unitData = {
                  id: assignedUnit.id,
                  unit_number: assignedUnit.unit_number || 'N/A',
                  property_name: assignedUnit.property?.name || 'Unknown Property',
                  rent: parseFloat(assignedUnit.rent) || 0,
                  rent_paid: parseFloat(assignedUnit.rent_paid) || 0,
                  rent_remaining: parseFloat(assignedUnit.rent_remaining) || 0,
                  is_available: assignedUnit.is_available,
                  assigned_date: assignedUnit.assigned_date || null
                };
              }
              
              const tenantFromUsers = {
                id: tenantId,
                full_name: tenant.full_name || tenant.name || `Tenant ${tenantId}`,
                name: tenant.full_name || tenant.name || `Tenant ${tenantId}`,
                email: tenant.email || 'No email provided',
                phone_number: tenant.phone_number || 'N/A',
                emergency_contact: tenant.emergency_contact || null,
                government_id: tenant.government_id || null,
                date_joined: tenant.date_joined || tenant.created_at || new Date().toISOString(),
                unit: unitData,
                status: unitData ? 'active' : 'pending',
                reminder_mode: tenant.reminder_mode || 'days_before',
                reminder_value: tenant.reminder_value || 10,
                source: 'users'
              };
              tenantMap.set(tenantId, tenantFromUsers);
            }
          });
        }
      } catch (error) {
        console.error('❌ DEBUG: Error fetching users:', error);
      }
    }

    // METHOD 4: Direct tenants endpoint
    console.log('🔧 DEBUG: METHOD 4 - Trying direct tenants endpoint...');
    if (tenantMap.size === 0) {
      try {
        const tenantsResponse = await apiService.getTenants();
        
        if (Array.isArray(tenantsResponse) && tenantsResponse.length > 0) {
          tenantsResponse.forEach((tenant) => {
            const tenantId = tenant.id;
            
            if (!tenantMap.has(tenantId)) {
              const transformedTenant = {
                id: tenantId,
                full_name: tenant.full_name || tenant.name || `Tenant ${tenantId}`,
                name: tenant.full_name || tenant.name || `Tenant ${tenantId}`,
                email: tenant.email || 'No email provided',
                phone_number: tenant.phone_number || tenant.phone || 'N/A',
                emergency_contact: tenant.emergency_contact || null,
                government_id: tenant.government_id || null,
                date_joined: tenant.date_joined || tenant.created_at || new Date().toISOString(),
                unit: tenant.unit ? {
                  id: tenant.unit.id || tenant.unit,
                  unit_number: tenant.unit.unit_number || 'N/A',
                  property_name: tenant.unit.property_obj?.name || tenant.unit.property?.name || 'Unknown Property',
                  rent: parseFloat(tenant.unit.rent) || 0,
                  rent_paid: parseFloat(tenant.unit.rent_paid) || 0,
                  rent_remaining: parseFloat(tenant.unit.rent_remaining) || 0,
                  is_available: tenant.unit.is_available !== undefined ? tenant.unit.is_available : true,
                  assigned_date: tenant.unit.assigned_date || null
                } : null,
                status: tenant.status || (tenant.unit ? 'active' : 'pending'),
                reminder_mode: tenant.reminder_mode || 'days_before',
                reminder_value: tenant.reminder_value || 10,
                source: 'tenants_endpoint'
              };
              tenantMap.set(tenantId, transformedTenant);
            }
          });
        }
      } catch (error) {
        console.error('❌ DEBUG: Error fetching tenants endpoint:', error);
      }
    }

    // FINAL: Convert Map to array
    tenantsData = Array.from(tenantMap.values());
    
    console.log('📊 DEBUG: FINAL tenant data collection result:');
    console.log('👥 DEBUG: Total tenants found:', tenantsData.length);
    console.log('🔍 DEBUG: Tenant details:', tenantsData);
    
    // REMOVED THE EMERGENCY FALLBACK - Now just log if empty
    if (tenantsData.length === 0) {
      console.log('ℹ️ No tenants found in database - this is normal if you haven\'t added any yet');
    }
    
    setTenants(tenantsData);
    setTenantsError(null);
    
  } catch (error) {
    console.error('❌ DEBUG: Error in fetchTenants:', error);
    setTenantsError(error.message);
    setTenants([]);
  } finally {
    setTenantsLoading(false);
  }
};

  // Function to fetch unit types
  const fetchUnitTypes = async () => {
    setUnitTypesLoading(true);
    try {
      const response = await apiService.getUnitTypes();
      console.log('📊 Fetched unit types:', response);
      
      if (!Array.isArray(response)) {
        console.warn('Unit types response is not an array:', response);
        setUnitTypes([]);
        setUnitTypesError('Failed to load unit types');
        return;
      }
      
      const transformedData = response.map(unitType => ({
        id: unitType.id,
        name: unitType.name || unitType.unit_type_name || 'Unknown',
        rent: parseFloat(unitType.rent) || 0,
        deposit: parseFloat(unitType.deposit) || 0,
        description: unitType.description || '',
        landlord: unitType.landlord ? {
          id: unitType.landlord.id,
          name: unitType.landlord.full_name
        } : null,
        created_at: unitType.created_at
      }));
      
      console.log('✅ Transformed unit types:', transformedData);
      setUnitTypes(transformedData);
      setUnitTypesError(null);
    } catch (error) {
      console.error('Error fetching unit types:', error);
      setUnitTypesError(error.message);
      setUnitTypes([]);
    } finally {
      setUnitTypesLoading(false);
    }
  };

  const fetchReports = async () => {
    setReportsLoading(true);
    try {
      const response = await apiService.getOpenReports();
      const transformedData = response.map(report => ({
        id: report.id,
        title: report.issue_title,
        category: report.issue_category,
        priority: report.priority_level,
        status: report.status,
        description: report.description,
        createdAt: report.created_at,
        tenant: report.tenant ? {
          id: report.tenant.id,
          name: report.tenant.full_name
        } : null,
        unit: report.unit ? {
          id: report.unit.id,
          unit_number: report.unit.unit_number
        } : null
      }));
      setReports(transformedData);
      setReportsError(null);
    } catch (error) {
      setReportsError(error.message);
    } finally {
      setReportsLoading(false);
    }
  };

  const fetchUnits = async () => {
    setUnitsLoading(true);
    try {
      const response = await apiService.getUnits();
      console.log('🏠 DEBUG: Raw units response:', response);
      
      const transformedData = response.map(unit => ({
        id: unit.id,
        unit_number: unit.unit_number,
        unit_code: unit.unit_code,
        property: unit.property_obj ? {
          id: unit.property_obj.id,
          name: unit.property_obj.name
        } : null,
        rent: parseFloat(unit.rent) || 0,
        rent_paid: parseFloat(unit.rent_paid) || 0,
        rent_remaining: parseFloat(unit.rent_remaining) || 0,
        deposit: parseFloat(unit.deposit) || 0,
        is_available: unit.is_available,
        tenant: unit.tenant ? {
          id: unit.tenant.id,
          name: unit.tenant.full_name || unit.tenant.name,
          email: unit.tenant.email,
          phone_number: unit.tenant.phone_number
        } : null,
        bedrooms: unit.bedrooms,
        bathrooms: unit.bathrooms,
        floor: unit.floor
      }));
      
      console.log('✅ DEBUG: Transformed units:', transformedData);
      setUnits(transformedData);
      setUnitsError(null);
    } catch (error) {
      console.error('Error fetching units:', error);
      setUnitsError(error.message);
    } finally {
      setUnitsLoading(false);
    }
  };

  const fetchProperties = async () => {
    setPropertiesLoading(true);
    try {
      const response = await apiService.getProperties();
      const transformedData = response.map(property => ({
        id: property.id,
        name: property.name,
        city: property.city,
        state: property.state,
        unit_count: property.unit_count,
        landlord: property.landlord ? {
          id: property.landlord.id,
          name: property.landlord.full_name
        } : null
      }));
      setProperties(transformedData);
      setPropertiesError(null);
    } catch (error) {
      setPropertiesError(error.message);
    } finally {
      setPropertiesLoading(false);
    }
  };

  // FIXED: Enhanced pending applications fetch
  const fetchPendingApplications = async () => {
    setPendingApplicationsLoading(true);
    try {
      // Get all tenants and filter those without units
      const pending = tenants.filter(tenant => !tenant.unit);
      console.log('⏳ DEBUG: Pending applications found:', pending.length);
      
      const transformedData = pending.map(tenant => {
        const fullName = tenant.full_name || tenant.name || `Applicant ${tenant.id}`;
        
        return {
          id: tenant.id,
          full_name: fullName,
          name: fullName,
          email: tenant.email || 'No email provided',
          phone_number: tenant.phone_number || 'N/A',
          applicationDate: tenant.date_joined || tenant.created_at,
          status: 'pending',
          emergency_contact: tenant.emergency_contact || null,
          government_id: tenant.government_id || null,
          reminder_mode: tenant.reminder_mode || 'days_before',
          reminder_value: tenant.reminder_value || 10,
          ...tenant
        };
      });
      
      console.log('✅ DEBUG: Transformed pending applications:', transformedData);
      setPendingApplications(transformedData);
      setPendingApplicationsError(null);
    } catch (error) {
      console.error('Error fetching pending applications:', error);
      setPendingApplicationsError(error.message);
      setPendingApplications([]);
    } finally {
      setPendingApplicationsLoading(false);
    }
  };

  const fetchEvictedTenants = async () => {
    setEvictedTenantsLoading(true);
    try {
      const evicted = tenants.filter(tenant => 
        tenant.status === 'evicted' || tenant.is_active === false
      );
      
      const transformedData = evicted.map(tenant => ({
        id: tenant.id,
        name: tenant.full_name || tenant.name,
        email: tenant.email,
        phone: tenant.phone_number,
        evictionDate: tenant.eviction_date || tenant.updated_at,
        reason: tenant.eviction_reason || 'Not specified'
      }));
      
      setEvictedTenants(transformedData);
      setEvictedTenantsError(null);
    } catch (error) {
      setEvictedTenantsError(error.message);
    } finally {
      setEvictedTenantsLoading(false);
    }
  };

  const fetchLandlords = async () => {
    setLandlordsLoading(true);
    try {
      const response = await apiService.getLandlords();
      const transformedData = response.map(landlord => ({
        id: landlord.id,
        name: landlord.full_name,
        email: landlord.email,
        phone: landlord.phone_number,
        landlord_code: landlord.landlord_code,
        mpesa_till_number: landlord.mpesa_till_number,
        properties: properties.filter(prop => prop.landlord?.id === landlord.id)
      }));
      setLandlords(transformedData);
      setLandlordsError(null);
    } catch (error) {
      setLandlordsError(error.message);
    } finally {
      setLandlordsLoading(false);
    }
  };

  // Enhanced payment fetching
  const fetchPayments = async () => {
    setPaymentsLoading(true);
    try {
      const response = await apiService.getPayments();
      console.log('💰 DEBUG: Raw payments response:', response);
      
      if (!response) {
        console.warn('⚠️ Payments response is null or undefined');
        setPayments([]);
        return;
      }
      
      let paymentsData = response;
      if (response.data && Array.isArray(response.data)) {
        paymentsData = response.data;
      } else if (response.results && Array.isArray(response.results)) {
        paymentsData = response.results;
      }
      
      if (!Array.isArray(paymentsData)) {
        console.warn('⚠️ Payments data is not an array:', paymentsData);
        setPayments([]);
        return;
      }
      
      const transformedPayments = paymentsData.map(payment => {
        if (!payment) return null;
        
        return {
          id: payment.id,
          amount: parseFloat(payment.amount) || 0,
          status: payment.status?.toLowerCase() || 'pending',
          payment_type: payment.payment_type || 'rent',
          mpesa_receipt: payment.mpesa_receipt || payment.mpesa_receipt_number,
          reference_number: payment.reference_number || payment.id?.toString(),
          date: payment.transaction_date || payment.created_at || payment.payment_date,
          tenant: payment.tenant ? {
            id: payment.tenant.id,
            name: payment.tenant.full_name || payment.tenant.name,
            email: payment.tenant.email
          } : null,
          unit: payment.unit ? {
            id: payment.unit.id,
            unit_number: payment.unit.unit_number
          } : null,
          ...payment
        };
      }).filter(Boolean);
      
      console.log('✅ DEBUG: Transformed payments:', transformedPayments);
      setPayments(transformedPayments);
      setPaymentsError(null);
      
    } catch (error) {
      console.error('❌ Context: Error fetching payments:', error);
      setPaymentsError(error.message);
    } finally {
      setPaymentsLoading(false);
    }
  };

  // Update refreshData function
  const refreshData = async () => {
    console.log('🔄 Refreshing all data...');
    
    try {
      const userType = localStorage.getItem('userType');
      console.log('👤 User type:', userType);

      if (userType === 'tenant') {
        try {
          const reportsData = await apiService.getOpenReports();
          setReports(Array.isArray(reportsData) ? reportsData : []);
        } catch (err) {
          console.warn('Could not fetch reports:', err);
          setReports([]);
        }

      } else if (userType === 'landlord') {
        console.log('📊 Fetching landlord data...');
        
        // Fetch units and payments first (they contain tenant data)
        await fetchUnits();
        await fetchPayments();
        await fetchTenants(); // This now uses the enhanced method
        
        await Promise.all([
          fetchProperties(),
          fetchLandlords(),
          fetchPendingApplications(),
          fetchEvictedTenants(),
          fetchUnitTypes()
        ]);
        
        try {
          const reportsData = await apiService.getOpenReports();
          setReports(Array.isArray(reportsData) ? reportsData : []);
        } catch (err) {
          console.warn('Could not fetch reports:', err);
          setReports([]);
        }
      }

    } catch (error) {
      console.error('❌ Error refreshing data:', error);
    }
  };

  // ADD THE MISSING FUNCTIONS:

  // Function to add a new property
  const addProperty = async (propertyData) => {
    try {
      const response = await apiService.createProperty(propertyData);
      const newProperty = {
        id: response.id,
        name: response.name,
        city: response.city,
        state: response.state,
        unit_count: response.unit_count,
        landlord: response.landlord ? {
          id: response.landlord.id,
          name: response.landlord.full_name
        } : null
      };
      
      setProperties(prev => [...prev, newProperty]);
      
      if (currentUser && currentUser.user_type === 'landlord') {
        setLandlords(prev => 
          prev.map(landlord => {
            if (landlord.id === currentUser.id) {
              return {
                ...landlord,
                properties: [...landlord.properties, newProperty]
              };
            }
            return landlord;
          })
        );
      }
      
      return newProperty;
    } catch (error) {
      throw error;
    }
  };

  // Function to update property
  const updateProperty = async (propertyId, updates) => {
    try {
      const response = await apiService.updateProperty(propertyId, updates);
      const updatedProperty = {
        id: response.id,
        name: response.name,
        city: response.city,
        state: response.state,
        unit_count: response.unit_count,
        landlord: response.landlord ? {
          id: response.landlord.id,
          name: response.landlord.full_name
        } : null
      };
      
      setProperties(prev =>
        prev.map(prop =>
          prop.id === propertyId ? { ...prop, ...updatedProperty } : prop
        )
      );
      
      return updatedProperty;
    } catch (error) {
      throw error;
    }
  };

  // Function to add a new unit
  const addUnit = async (unitData) => {
    try {
      const response = await apiService.createUnit(unitData);
      const newUnit = {
        id: response.id,
        unit_number: response.unit_number,
        unit_code: response.unit_code,
        property: response.property_obj ? {
          id: response.property_obj.id,
          name: response.property_obj.name
        } : null,
        rent: parseFloat(response.rent),
        rent_paid: parseFloat(response.rent_paid),
        rent_remaining: parseFloat(response.rent_remaining),
        deposit: parseFloat(response.deposit),
        is_available: response.is_available,
        tenant: response.tenant ? {
          id: response.tenant.id,
          name: response.tenant.full_name,
          email: response.tenant.email
        } : null,
        bedrooms: response.bedrooms,
        bathrooms: response.bathrooms,
        floor: response.floor
      };
      
      setUnits(prev => [...prev, newUnit]);
      return newUnit;
    } catch (error) {
      throw error;
    }
  };

  // Function to update unit
  const updateUnit = async (unitId, updates) => {
    try {
      const response = await apiService.updateUnit(unitId, updates);
      const updatedUnit = {
        id: response.id,
        unit_number: response.unit_number,
        unit_code: response.unit_code,
        property: response.property_obj ? {
          id: response.property_obj.id,
          name: response.property_obj.name
        } : null,
        rent: parseFloat(response.rent),
        rent_paid: parseFloat(response.rent_paid),
        rent_remaining: parseFloat(response.rent_remaining),
        deposit: parseFloat(response.deposit),
        is_available: response.is_available,
        tenant: response.tenant ? {
          id: response.tenant.id,
          name: response.tenant.full_name,
          email: response.tenant.email
        } : null,
        bedrooms: response.bedrooms,
        bathrooms: response.bathrooms,
        floor: response.floor
      };
      
      setUnits(prev =>
        prev.map(unit =>
          unit.id === unitId ? { ...unit, ...updatedUnit } : unit
        )
      );
      
      return updatedUnit;
    } catch (error) {
      throw error;
    }
  };

  // Function to update unit availability
  const updateUnitAvailability = async (unitId, isAvailable) => {
    return await updateUnit(unitId, { is_available: isAvailable });
  };

  // Function to create a report
  const createReport = async (reportData) => {
    try {
      const response = await apiService.createReport(reportData);
      const newReport = {
        id: response.id,
        title: response.issue_title,
        category: response.issue_category,
        priority: response.priority_level,
        status: response.status,
        description: response.description,
        createdAt: response.created_at,
        tenant: response.tenant ? {
          id: response.tenant.id,
          name: response.tenant.full_name
        } : null,
        unit: response.unit ? {
          id: response.unit.id,
          unit_number: response.unit.unit_number
        } : null
      };
      
      setReports(prev => [...prev, newReport]);
      return newReport;
    } catch (error) {
      throw error;
    }
  };

  // Function to update report status
  const updateReportStatus = async (reportId, status) => {
    try {
      const response = await apiService.updateReportStatus(reportId, status);
      const updatedReport = {
        id: response.id,
        title: response.issue_title,
        category: response.issue_category,
        priority: response.priority_level,
        status: response.status,
        description: response.description,
        createdAt: response.created_at,
        tenant: response.tenant ? {
          id: response.tenant.id,
          name: response.tenant.full_name
        } : null,
        unit: response.unit ? {
          id: response.unit.id,
          unit_number: response.unit.unit_number
        } : null
      };
      
      setReports(prev =>
        prev.map(report =>
          report.id === reportId ? { ...report, status } : report
        )
      );
      
      return updatedReport;
    } catch (error) {
      throw error;
    }
  };

  // Function to add a new unit type
  const addUnitType = async (unitTypeData) => {
    try {
      console.log('📝 Adding unit type with data:', unitTypeData);
      
      const response = await apiService.createUnitType(unitTypeData);
      console.log('✅ Unit type created:', response);
      
      const newUnitType = {
        id: response.id,
        name: response.name,
        rent: parseFloat(response.rent) || 0,
        deposit: parseFloat(response.deposit) || 0,
        description: response.description || '',
        landlord: response.landlord ? {
          id: response.landlord.id,
          name: response.landlord.full_name
        } : null,
        created_at: response.created_at
      };
      
      setUnitTypes(prev => [...prev, newUnitType]);
      return newUnitType;
      
    } catch (error) {
      console.error('❌ Error adding unit type:', error);
      throw error;
    }
  };

  // Function to update unit rent
  const updateUnitRent = async (unitId, newRent) => {
    try {
      const response = await apiService.updateUnitRent(unitId, newRent);
      
      setUnits(prev =>
        prev.map(unit =>
          unit.id === unitId ? { 
            ...unit, 
            rent: parseFloat(newRent),
            rent_remaining: response.unit.rent_remaining 
          } : unit
        )
      );
      
      return response;
    } catch (error) {
      console.error('Error updating unit rent:', error);
      throw error;
    }
  };

  // Fixed bulk rent update function
  const bulkRentUpdate = async (updateData) => {
    try {
      console.log('🔄 Context: Bulk rent update:', updateData);
      
      const response = await apiService.bulkRentUpdate(updateData);
      console.log('✅ Context: Bulk rent update response:', response);
      
      await fetchUnits();
      
      return response;
    } catch (error) {
      console.error('❌ Context: Bulk rent update failed:', error);
      throw error;
    }
  };

  // Fixed preview function
  const previewBulkRentUpdate = async (updateData) => {
    try {
      console.log('🔍 Context: Preview bulk rent update:', updateData);
      
      const response = await apiService.previewBulkRentUpdate(updateData);
      console.log('🔍 Context: Preview response:', response);
      
      return response;
    } catch (error) {
      console.error('❌ Context: Preview failed:', error);
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
  };

  return (
    <AppContext.Provider value={{
      // Data
      tenants,
      tenantsLoading,
      tenantsError,
      reports,
      reportsLoading,
      reportsError,
      units,
      unitsLoading,
      unitsError,
      properties,
      propertiesLoading,
      propertiesError,
      pendingApplications,
      pendingApplicationsLoading,
      pendingApplicationsError,
      evictedTenants,
      evictedTenantsLoading,
      evictedTenantsError,
      landlords,
      landlordsLoading,
      landlordsError,
      selectedPropertyId,
      
      // Setters
      setSelectedPropertyId,

      unitTypes,
      unitTypesLoading,
      unitTypesError,
      
      // Actions
      addProperty,
      updateProperty,
      addUnit,
      updateUnit,
      updateUnitAvailability,
      createReport,
      updateReportStatus,
      addUnitType,
      refreshData,
      payments,
      paymentsLoading,
      paymentsError,
    
      // ... existing actions
      fetchPayments,
      updateUnitRent,
      bulkRentUpdate,
      previewBulkRentUpdate,
      // Backward compatibility aliases
      mockTenants: tenants,
      mockReports: reports,
      mockUnits: units,
      mockPendingApplications: pendingApplications,
      mockEvictedTenants: evictedTenants
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppContext Provider');
  }
  return context;
};

export default ContextProvider;