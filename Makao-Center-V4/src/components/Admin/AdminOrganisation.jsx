import React, { useContext, useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Bed, 
  Key,
  DollarSign,
  AlertTriangle,
  X,
  Building2,
  Plus,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { NavLink } from "react-router-dom";
import { propertiesAPI, communicationAPI, tenantsAPI } from '../../services/api';

// Confirmation Dialog Component
const ConfirmationDialog = ({ isOpen, onClose, onConfirm, room }) => {
  if (!isOpen) return null;

  const hasTenant = room?.hasTenant || room?.tenant;
  const currentStatus = hasTenant ? 'occupied' : (room?.isAvailable ? 'available' : 'unavailable');
  const newStatus = room?.isAvailable ? 'unavailable' : 'available';

  return (
    <div className="fixed inset-0 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4 ">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            <AlertTriangle className="w-6 h-6 text-yellow-500 mr-2" />
            <h3 className="text-lg font-semibold">Confirm Availability Change</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            Are you sure you want to change the availability status for:
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="font-medium text-gray-600">Room:</div>
              <div className="font-semibold">{room?.unitNumber}</div>
              
              <div className="font-medium text-gray-600">Type:</div>
              <div>{room?.type}</div>
              
              <div className="font-medium text-gray-600">Current Status:</div>
              <div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  currentStatus === 'available' 
                    ? 'bg-green-100 text-green-800' 
                    : currentStatus === 'occupied'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {currentStatus}
                </span>
              </div>
              
              <div className="font-medium text-gray-600">New Status:</div>
              <div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  newStatus === 'available'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {newStatus}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Confirm Change
          </button>
        </div>
      </div>
    </div>
  );
};

// Add Room Type Dialog
const AddRoomTypeDialog = ({ isOpen, onClose, onAdd }) => {
  const [roomType, setRoomType] = useState({
    name: '',
    baseRent: '',
    description: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!roomType.name || !roomType.baseRent) {
      alert('Please provide both name and base rent.');
      return;
    }
    // Prepare payload for backend - match Django model fields
    const payload = {
      name: roomType.name,
      rent: Number(roomType.baseRent),  // Backend expects 'rent', not 'base_rent'
      deposit: 0,  // Required field with default
      description: roomType.description || '',
      number_of_units: 0  // Required field with default
    };
    
    console.log('🚀 Creating unit type with payload:', payload);
    
    try {
      const { propertiesAPI } = await import('../../services/api');
      const response = await propertiesAPI.createUnitType(payload);
      console.log('✅ Unit type created successfully:', response.data);
      
      if (onAdd) onAdd(response.data);
      setRoomType({ name: '', baseRent: '', description: '' });
      onClose();
      
      // Refresh the page to show the new room type
      window.location.reload();
    } catch (error) {
      console.error('❌ Failed to create unit type:', error.response?.data || error);
      alert(`Failed to add room type: ${error.response?.data?.error || error.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4 ">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold">Add Room Type</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Room Type Name
            </label>
            <input
              type="text"
              value={roomType.name}
              onChange={(e) => setRoomType({ ...roomType, name: e.target.value })}
              placeholder="e.g., Studio, 1 Bedroom"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Base Rent (KSh)
            </label>
            <input
              type="number"
              value={roomType.baseRent}
              onChange={(e) => setRoomType({ ...roomType, baseRent: e.target.value })}
              placeholder="25000"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <input
              type="text"
              value={roomType.description}
              onChange={(e) => setRoomType({ ...roomType, description: e.target.value })}
              placeholder="Short description of room type"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Add Room Type
          </button>
        </div>
      </div>
    </div>
  );
};

// Add Rental Unit Dialog
const AddRentalUnitDialog = ({ isOpen, onClose, onAdd, roomTypes, propertyId }) => {
  const [unitData, setUnitData] = useState({
    unitNumber: '',
    type: '',
    rent: ''
  });

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!unitData.unitNumber || !unitData.type || !unitData.rent) {
      alert('Please fill in all fields');
      return;
    }
    onAdd(unitData);
    setUnitData({ unitNumber: '', type: '', rent: '' });
  };

  return (
    <div className="fixed inset-0 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4 ">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold">Add Rental Unit</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unit Number
            </label>
            <input
              type="text"
              value={unitData.unitNumber}
              onChange={(e) => setUnitData({...unitData, unitNumber: e.target.value})}
              placeholder="e.g., A101"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Room Type
            </label>
            <select
              value={unitData.type || ''}
              onChange={(e) => {
                const selectedType = roomTypes.find(rt => rt.name === e.target.value);
                setUnitData({
                  ...unitData, 
                  type: e.target.value,
                  rent: selectedType ? selectedType.baseRent : unitData.rent
                });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select room type</option>
              {roomTypes.map(rt => (
                <option key={rt.id} value={rt.name}>{rt.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rent (KSh)
            </label>
            <input
              type="number"
              value={unitData.rent}
              onChange={(e) => setUnitData({...unitData, rent: e.target.value})}
              placeholder="25000"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Add Unit
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminOrganisation = () => {
  // Safe context access with error handling
  let contextValue;
  try {
    contextValue = useContext(AppContext);
  } catch (error) {
    console.error('Error accessing AppContext:', error);
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Context Error</h2>
          <p className="text-gray-600">Unable to access application context. Please refresh the page.</p>
        </div>
      </div>
    );
  }

  // Use the exact same destructuring as AdminDashboard
  const {
    selectedPropertyId,
    setSelectedPropertyId,
    reports = [],
    tenants = [],
    properties = [],
    propertyUnits: allPropertyUnits = [],
    addRoomType = () => {},
    deleteRoomType = () => {},
    addUnit = () => {},
    updateUnitAvailability = () => {},
  } = contextValue || {};
  
  const { showToast = () => {} } = useToast() || {};
  
  const [currentProperty, setCurrentProperty] = useState(null);
  const [apiPropertyUnits, setApiPropertyUnits] = useState([]);
  const [apiPropertyTenants, setApiPropertyTenants] = useState([]);
  const [apiPropertyReports, setApiPropertyReports] = useState([]);
  const [apiRoomTypes, setApiRoomTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [totalTenants, setTotalTenants] = useState(0);

  const [rooms, setRooms] = useState(allPropertyUnits);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, room: null });
  const [roomTypeDialog, setRoomTypeDialog] = useState(false);
  const [addUnitDialog, setAddUnitDialog] = useState(false);

  // Get current property
  const contextCurrentProperty = properties?.find(p => {
    const propertyId = p?.id?.toString();
    const selectedId = selectedPropertyId?.toString();
    return propertyId === selectedId;
  }) || properties?.[0];

  // Auto-select first property if none selected
  useEffect(() => {
    if (properties?.length > 0 && (!selectedPropertyId || !contextCurrentProperty)) {
      const firstProperty = properties[0];
      setSelectedPropertyId(firstProperty.id.toString());
      setCurrentProperty(firstProperty);
    }
  }, [properties, selectedPropertyId, contextCurrentProperty, setSelectedPropertyId]);

  // Filter data by selected property
  const propertyUnits = useMemo(() => {
    return (allPropertyUnits || []).filter(unit => {
      const unitPropertyId = unit?.propertyId?.toString();
      const selectedId = selectedPropertyId?.toString();
      return unitPropertyId === selectedId;
    });
  }, [allPropertyUnits, selectedPropertyId]);

  const propertyReports = useMemo(() => {
    console.log('🔍 Filtering context reports:', {
      totalReports: reports?.length,
      selectedPropertyId,
      sampleReport: reports?.[0]
    });
    
    return (reports || []).filter(report => {
      // Try multiple ways to get the property ID from the report
      const reportPropertyId = report?.unit?.property_obj?.id?.toString() ||
                              report?.unit?.property?.toString() ||
                              report?.property?.toString() ||
                              report?.propertyId?.toString() ||
                              report?.property_id?.toString();
      const selectedId = selectedPropertyId?.toString();
      
      const matches = reportPropertyId === selectedId;
      
      if (reports?.length <= 3) { // Only log for first few to avoid spam
        console.log('📋 Context report filter:', {
          reportId: report?.id,
          reportPropertyId,
          selectedId,
          matches,
          report
        });
      }
      
      return matches;
    });
  }, [reports, selectedPropertyId]);

  // Update rooms when property changes
  useEffect(() => {
    setRooms(propertyUnits);
  }, [propertyUnits]);

  // Set current property when selectedPropertyId changes
  useEffect(() => {
    if (selectedPropertyId && properties?.length > 0) {
      const property = properties.find(p => p?.id?.toString() === selectedPropertyId.toString());
      setCurrentProperty(property || properties[0]);
    }
  }, [selectedPropertyId, properties]);

  // Fetch API data when property changes
  useEffect(() => {
    if (selectedPropertyId) {
      fetchPropertyData();
    }
  }, [selectedPropertyId]);

  // Fetch property data - SIMPLIFIED WITHOUT DEBUGGING
  const fetchPropertyData = async () => {
    if (!selectedPropertyId) return;

    try {
      setLoading(true);
      setApiError(null);

      const property = properties.find(p => p?.id?.toString() === selectedPropertyId.toString());
      setCurrentProperty(property);

      const [unitsResponse, tenantsResponse, reportsResponse, roomTypesResponse] = await Promise.allSettled([
        propertiesAPI.getPropertyUnits(selectedPropertyId),
        tenantsAPI.getTenants(),
        communicationAPI.getReports(),
        propertiesAPI.getUnitTypes()
      ]);

      // Process units data
      if (unitsResponse.status === 'fulfilled') {
        console.log('🏠 Raw units from API:', unitsResponse.value.data);
        
        const unitsWithStatus = (unitsResponse.value.data || []).map(unit => {
          console.log('🔍 Processing unit:', {
            unit_number: unit.unit_number,
            tenant: unit.tenant,
            tenant_obj: unit.tenant_obj,
            is_available: unit.is_available
          });
          
          // Determine if unit is occupied based on tenant presence
          const hasTenant = unit.tenant !== null && unit.tenant !== undefined;
          const actuallyAvailable = !hasTenant && unit.is_available;
          
          // Format tenant name
          let tenantName = null;
          if (unit.tenant_obj) {
            tenantName = `${unit.tenant_obj.first_name || ''} ${unit.tenant_obj.last_name || ''}`.trim();
            console.log('✅ Tenant name from tenant_obj:', tenantName);
          } else if (unit.tenant) {
            console.log('⚠️ Tenant exists but no tenant_obj, tenant value:', unit.tenant);
          }
          
          return {
            ...unit,
            status: hasTenant ? 'occupied' : (actuallyAvailable ? 'available' : 'unavailable'),
            isAvailable: actuallyAvailable,
            unitNumber: unit.unit_number || unit.unitNumber || 'N/A',
            type: unit.unit_type?.name || unit.type || 'N/A',
            rent: unit.rent || unit.baseRent || 0,
            propertyId: unit.property_obj?.id?.toString() || selectedPropertyId,
            tenant: tenantName || unit.tenant || null,
            tenant_obj: unit.tenant_obj,
            hasTenant: hasTenant
          };
        });
        
        console.log('📦 Processed units:', unitsWithStatus);
        setApiPropertyUnits(unitsWithStatus);
      }

      // Process tenants data - Get all tenants since tenant objects don't have property info
      if (tenantsResponse.status === 'fulfilled') {
        const apiTenants = tenantsResponse.value.data || [];
        setApiPropertyTenants(apiTenants);
      }

      // Process reports data
      if (reportsResponse.status === 'fulfilled') {
        console.log('📋 Raw reports from API:', reportsResponse.value.data);
        console.log('🔍 Sample report structure:', reportsResponse.value.data[0]);
        console.log('🏠 Selected property ID:', selectedPropertyId);
        
        const filteredReports = (reportsResponse.value.data || []).filter(report => {
          // Try multiple ways to get the property ID from the report
          const reportPropertyId = report.unit?.property_obj?.id?.toString() || 
                                  report.unit?.property?.toString() ||
                                  report.property?.toString() ||
                                  report.propertyId?.toString() ||
                                  report.property_id?.toString();
          
          console.log('📋 Report filtering:', {
            reportId: report.id,
            reportPropertyId,
            selectedPropertyId: selectedPropertyId.toString(),
            matches: reportPropertyId === selectedPropertyId.toString(),
            reportObject: report
          });
          
          return reportPropertyId === selectedPropertyId.toString();
        });
        
        console.log('✅ Filtered reports for property:', filteredReports);
        setApiPropertyReports(filteredReports);
      }

      // Process room types data
      if (roomTypesResponse.status === 'fulfilled') {
        console.log('🏷️ Room types from API:', roomTypesResponse.value.data);
        setApiRoomTypes(roomTypesResponse.value.data || []);
      }

    } catch (error) {
      console.error('Error fetching property data:', error);
      setApiError('Failed to load property data from API');
      showToast('Failed to load some data', 'error', 3000);
    } finally {
      setLoading(false);
    }
  };

  // Calculate tenant count from occupied units
  useEffect(() => {
    const displayUnits = apiPropertyUnits.length > 0 ? apiPropertyUnits : propertyUnits;
    const tenantCount = displayUnits.filter(unit => 
      unit?.hasTenant || unit?.tenant !== null && unit?.tenant !== undefined
    ).length;
    
    setTotalTenants(tenantCount);
  }, [apiPropertyUnits, propertyUnits]);

  // Calculate other stats
  const displayUnits = apiPropertyUnits.length > 0 ? apiPropertyUnits : propertyUnits;
  const totalUnits = displayUnits.length;
  const occupiedUnits = displayUnits.filter(unit => 
    unit?.hasTenant || unit?.tenant !== null && unit?.tenant !== undefined
  ).length;
  const availableUnits = displayUnits.filter(unit => 
    !unit?.hasTenant && !unit?.tenant && unit?.isAvailable
  ).length;

  const totalRevenue = displayUnits
    .filter(unit => unit?.hasTenant || unit?.tenant)
    .reduce((sum, unit) => sum + (Number(unit?.rent) || 0), 0);

  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

  // Map reports to expected structure for display
  const displayReportsRaw = apiPropertyReports.length > 0 ? apiPropertyReports : propertyReports;
  
  // Debug: Log the raw reports data
  console.log('🔍 Raw reports data:', {
    apiPropertyReports,
    propertyReports,
    displayReportsRaw,
    selectedPropertyId
  });
  
  const displayReports = (displayReportsRaw || []).map(report => {
    // Try to get title, tenant, room, priority from various possible fields
    let title = report.title || report.subject || report.issue || report.description || 'Untitled Report';
    let tenant = report.tenant || report.tenant_name || (report.tenant_obj ? `${report.tenant_obj.first_name || ''} ${report.tenant_obj.last_name || ''}`.trim() : '');
    let room = report.room || report.unitNumber || (report.unit && (report.unit.unit_number || report.unit.unitNumber)) || (report.unit_obj && report.unit_obj.unit_number) || '';
    let priority = report.priority || report.severity || 'normal';
    
    console.log('📋 Mapped report:', { original: report, mapped: { title, tenant, room, priority } });
    
    return {
      ...report,
      title,
      tenant,
      room,
      priority
    };
  });
  
  console.log('✅ Final displayReports:', displayReports);
  
  const openReportsCount = displayReports.filter(report => 
    report.status === 'open' || report.status === 'Open' || report.status === 'pending'
  ).length;

  // Get tenants from occupied units for display
  const propertyTenantsFromUnits = useMemo(() => {
    console.log('🔍 Building tenant list from units:', {
      displayUnitsCount: displayUnits.length,
      apiPropertyTenantsCount: apiPropertyTenants.length,
      sampleUnit: displayUnits[0],
      sampleApiTenant: apiPropertyTenants[0]
    });

    return displayUnits
      .filter(unit => unit?.hasTenant || unit?.tenant)
      .map(unit => {
        console.log('📦 Processing unit for tenant display:', {
          unitId: unit.id,
          unitNumber: unit.unitNumber,
          tenant: unit.tenant,
          tenant_obj: unit.tenant_obj,
          hasTenant: unit.hasTenant
        });

        // The tenant field is just an ID, so we need to find the actual tenant data
        let tenantName = 'Unknown Tenant';
        let tenantEmail = 'No email';
        
        // Try to find tenant in apiPropertyTenants by ID
        const tenantId = unit.tenant_obj?.id || unit.tenant;
        const tenantData = apiPropertyTenants.find(t => 
          t.id === tenantId || t.id?.toString() === tenantId?.toString()
        );
        
        console.log('🔍 Looking for tenant ID:', tenantId, 'Found:', tenantData);
        
        if (tenantData) {
          // Build name from tenant data - API provides full_name directly!
          tenantName = tenantData.full_name || 
                      `${tenantData.first_name || ''} ${tenantData.last_name || ''}`.trim() ||
                      tenantData.user?.username || 
                      'Unknown Tenant';
          tenantEmail = tenantData.email || tenantData.user?.email || 'No email';
          console.log('✅ Tenant found:', tenantName);
        } else if (unit.tenant_obj) {
          // Fallback to tenant_obj if available
          tenantName = `${unit.tenant_obj.first_name || ''} ${unit.tenant_obj.last_name || ''}`.trim() || 'Unknown Tenant';
          tenantEmail = unit.tenant_obj.email || 'No email';
        } else if (typeof unit.tenant === 'string' && unit.tenant && isNaN(unit.tenant)) {
          // If tenant is already a string name (not a number)
          tenantName = unit.tenant;
        }
        
        console.log('✅ Tenant name resolved:', tenantName);
        
        return {
          id: unit.id,
          tenantId: tenantId,
          name: tenantName,
          email: tenantEmail,
          unitNumber: unit.unitNumber
        };
      });
  }, [displayUnits, apiPropertyTenants]);

  // Open confirmation dialog
  const openConfirmDialog = (room) => {
    // Don't allow changing availability if room has a tenant
    if (room.hasTenant || room.tenant) {
      showToast('Cannot change availability - unit has an assigned tenant. Remove tenant first.', 'error', 3000);
      return;
    }
    setConfirmDialog({ isOpen: true, room: room });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog({ isOpen: false, room: null });
  };

  // Toggle room availability with confirmation
  const handleConfirmToggle = () => {
    const roomToUpdate = confirmDialog.room;
    
    if (!roomToUpdate?.id) {
      showToast('Invalid room data', 'error', 3000);
      return;
    }
    
    // Update via context
    updateUnitAvailability(roomToUpdate.id, !roomToUpdate.isAvailable);
    
    showToast(
      `Room ${roomToUpdate.unitNumber} marked as ${!roomToUpdate.isAvailable ? 'available' : 'occupied'}`,
      'success',
      3000
    );
    
    closeConfirmDialog();
  };

  // Handle adding room type
  const handleAddRoomType = (roomType) => {
    if (!selectedPropertyId) {
      showToast('Please select a property first', 'error', 3000);
      return;
    }
    addRoomType(selectedPropertyId, roomType);
    showToast('Room type added successfully', 'success', 3000);
    setRoomTypeDialog(false);
  };

  // Handle deleting room type
  const handleDeleteRoomType = (roomTypeId) => {
    if (window.confirm('Are you sure you want to delete this room type?')) {
      deleteRoomType(selectedPropertyId, roomTypeId);
      showToast('Room type deleted successfully', 'success', 3000);
    }
  };

  // Handle adding rental unit
  const handleAddUnit = async (unitData) => {
    try {
      if (!selectedPropertyId) {
        showToast('Please select a property first', 'error', 3000);
        return;
      }

      // Call the API to create the unit
      const response = await propertiesAPI.createUnit({
        unit_number: unitData.unitNumber,
        unit_type: unitData.type,
        rent: parseInt(unitData.rent),
        property: selectedPropertyId,
        is_available: true
      });

      // If API call successful, update local state
      const newUnit = {
        id: response.data.id,
        unitNumber: response.data.unit_number,
        type: response.data.unit_type,
        rent: parseInt(response.data.rent),
        status: 'available',
        isAvailable: true,
        tenant: null,
        propertyId: selectedPropertyId
      };
      
      addUnit(newUnit);
      showToast(`Unit ${unitData.unitNumber} added successfully`, 'success', 3000);
      setAddUnitDialog(false);
      
      // Refresh the units data
      fetchPropertyData();
      
    } catch (error) {
      console.error('Error adding unit:', error);
      showToast('Failed to add unit. Please try again.', 'error', 3000);
    }
  };

  // Use API room types if available, otherwise fall back to context
  const roomTypes = apiRoomTypes.length > 0 
    ? apiRoomTypes 
    : (contextCurrentProperty?.unit_types || contextCurrentProperty?.roomTypes || []);

  console.log('🏷️ Room types to display:', roomTypes);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading property data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={closeConfirmDialog}
        onConfirm={handleConfirmToggle}
        room={confirmDialog.room}
      />

      <AddRoomTypeDialog
        isOpen={roomTypeDialog}
        onClose={() => setRoomTypeDialog(false)}
        onAdd={handleAddRoomType}
      />

      <AddRentalUnitDialog
        isOpen={addUnitDialog}
        onClose={() => setAddUnitDialog(false)}
        onAdd={handleAddUnit}
        roomTypes={roomTypes}
        propertyId={selectedPropertyId}
      />

      {/* Header with Property Selector and Refresh Button */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Property Management</h1>
            <p className="text-gray-600 mt-1">Manage your properties and rental units</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <select
              value={selectedPropertyId || ''}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {properties?.map(property => (
                <option key={property?.id} value={property?.id?.toString()}>
                  {property?.name || 'Unnamed Property'}
                </option>
              ))}
            </select>
            
            <button
              onClick={fetchPropertyData}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Refreshing...' : 'Refresh Data'}
            </button>
            
            <NavLink to="/admin/add-property">
              <button className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
                <Plus className="w-5 h-5" />
                Add New Property
              </button>
            </NavLink>
          </div>
        </div>
      </div>

      {/* API Status Banner */}
      {apiError && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-900">API Connection Issue</p>
              <p className="text-sm text-yellow-700">
                Using local data. Some features may be limited. {apiError}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Property Info Banner */}
      {contextCurrentProperty && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
          <div className="flex items-start">
            <Building2 className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-900">
                Viewing: {contextCurrentProperty.name}
              </p>
              <p className="text-sm text-blue-700">
                {contextCurrentProperty.address || contextCurrentProperty.city} • {contextCurrentProperty.city}
              </p>
              <p className="text-sm text-blue-600 mt-1">
                Units: {displayUnits.length} total ({occupiedUnits} occupied, {availableUnits} available) • 
                Tenants: {totalTenants}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Tenants</p>
              <p className="text-3xl font-bold text-gray-900">{totalTenants}</p>
              <p className="text-gray-600 text-sm">Active tenants</p>
            </div>
            <Users className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Units</p>
              <p className="text-3xl font-bold text-gray-900">{totalUnits}</p>
              <p className="text-gray-600 text-sm">Units in this property</p>
            </div>
            <Bed className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Available Units</p>
              <p className="text-3xl font-bold text-gray-900">{availableUnits}</p>
              <p className="text-gray-600 text-sm">Units currently available</p>
            </div>
            <Key className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Occupancy Rate</p>
              <p className="text-3xl font-bold text-gray-900">{occupancyRate}%</p>
              <p className="text-gray-600 text-sm">{occupiedUnits}/{totalUnits} occupied</p>
            </div>
            <DollarSign className="w-8 h-8 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Property Images */}
      {contextCurrentProperty?.images && contextCurrentProperty.images.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Property Gallery</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contextCurrentProperty.images.map((image, index) => (
              <div key={`image-${index}`} className="bg-gray-50 rounded-lg overflow-hidden">
                <img 
                  src={image} 
                  alt={`${contextCurrentProperty.name} ${index + 1}`}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="font-medium text-gray-900">{contextCurrentProperty.name}</h3>
                  <p className="text-sm text-gray-600">{contextCurrentProperty.address}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Room Types Management */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Room Types</h2>
          <button
            onClick={() => setRoomTypeDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            <Plus className="w-4 h-4" />
            Add Room Type
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roomTypes.map(roomType => (
            <div key={roomType.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900">{roomType.name}</h3>
                  <p className="text-lg text-blue-600 font-bold mt-1">
                    KSh {roomType.baseRent?.toLocaleString() || roomType.rent?.toLocaleString()}
                  </p>
                </div>
                <button 
                  onClick={() => handleDeleteRoomType(roomType.id)}
                  className="text-red-400 hover:text-red-600"
                  title="Delete room type"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          
          {roomTypes.length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-500">
              No room types defined. Click "Add Room Type" to get started.
            </div>
          )}
        </div>
      </div>

      {/* Room Management Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold">Room Management</h2>
            <p className="text-sm text-gray-500 mt-1">
              {displayUnits.length} units total • {occupiedUnits} occupied • {availableUnits} available
            </p>
          </div>
          <button
            onClick={() => setAddUnitDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Plus className="w-4 h-4" />
            Add Rental Unit
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Room</th>
                <th className="text-left py-3 px-4">Type</th>
                <th className="text-left py-3 px-4">Rent (KSh)</th>
                <th className="text-left py-3 px-4">Tenant</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Availability</th>
              </tr>
            </thead>
            <tbody>
              {displayUnits.map(room => {
                const hasTenant = room.hasTenant || room.tenant;
                const isActuallyAvailable = !hasTenant && room.isAvailable;
                
                return (
                  <tr key={room.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{room.unitNumber}</td>
                    <td className="py-3 px-4">{room.type}</td>
                    <td className="py-3 px-4">{room.rent?.toLocaleString()}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{room.tenant || '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        hasTenant
                          ? 'bg-red-100 text-red-800'
                          : isActuallyAvailable 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {hasTenant ? 'occupied' : (isActuallyAvailable ? 'available' : 'unavailable')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button 
                        onClick={() => openConfirmDialog(room)} 
                        disabled={hasTenant}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          hasTenant 
                            ? 'bg-gray-300 cursor-not-allowed opacity-50' 
                            : isActuallyAvailable 
                            ? 'bg-green-500' 
                            : 'bg-gray-300'
                        }`} 
                        title={hasTenant ? 'Remove tenant first to change availability' : 'Click to change availability'}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          isActuallyAvailable ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {displayUnits.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Bed className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No rental units added yet for this property.</p>
              <p className="text-sm mt-1">Click "Add Rental Unit" to add your first unit.</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Recent Reports</h3>
          <div className="space-y-3">
            {displayReports.slice(0, 3).map(report => (
              <div key={report.id || report._id || Math.random()} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{report.title}</p>
                  <p className="text-sm text-gray-600">{report.tenant || 'Unknown'} - Room {report.room || 'N/A'}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  report.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {report.priority}
                </span>
              </div>
            ))}
            {displayReports.length === 0 && (
              <p className="text-center py-8 text-gray-500">No reports for this property</p>
            )}
          </div>
          <NavLink to="/admin/reports">
            <button className="w-full flex mt-5 items-center justify-center px-6 py-3 text-white rounded hover:bg-gray-800 bg-gray-800 cursor-pointer">
              View All Reports
            </button>
          </NavLink>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Recent Tenants</h3>
          <div className="space-y-3">
            {propertyTenantsFromUnits.slice(0, 3).map(tenant => (
              <div key={tenant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{tenant.name}</p>
                  <p className="text-sm text-gray-600">Room {tenant.unitNumber}</p>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  Active
                </span>
              </div>
            ))}
            
            {propertyTenantsFromUnits.length === 0 && (
              <p className="text-center py-8 text-gray-500">No tenants for this property</p>
            )}
          </div>
          <NavLink to="/admin/tenants">
            <button className="w-full flex mt-5 items-center justify-center px-6 py-3 text-white rounded hover:bg-gray-800 bg-gray-800 cursor-pointer">
              View All Tenants
            </button>
          </NavLink>
        </div>
      </div>
    </div>
  );
};

export default AdminOrganisation;