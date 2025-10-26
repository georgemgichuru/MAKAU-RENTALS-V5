import React, {useState, useContext} from 'react'
import {AppContext} from '../../context/AppContext';
import { paymentsAPI, propertiesAPI } from '../../services/api';
import { 
  Home, 
  BarChart3, 
  Building, 
  CreditCard, 
  Users, 
  AlertTriangle, 
  Settings, 
  HelpCircle, 
  Menu, 
  X, 
  Plus, 
  Search, 
  Filter,
  Bell,
  User,
  ChevronDown,
  Eye,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  Download,
  Upload,
  LogOut,
  Shield,
  Smartphone,
  Monitor,
  Tablet,
  Percent,
  TrendingUp,
  RefreshCw
} from 'lucide-react';

const AdminPayments = () => {
  const {mockTenants, mockReports, properties, propertyUnits} = useContext(AppContext);

  // Property selection state for CSV download
  const [selectedPropertyId, setSelectedPropertyId] = useState(
    properties && properties.length > 0 ? properties[0].id : ''
  );

  // Payments state
  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsError, setPaymentsError] = useState(null);

  // Units state
  const [editingUnit, setEditingUnit] = useState(null);
  const [units, setUnits] = useState([]);
  const [unitsLoading, setUnitsLoading] = useState(false);
  
  // Bulk update state
  const [bulkUpdateType, setBulkUpdateType] = useState('percentage');
  const [selectedRoomType, setSelectedRoomType] = useState('all');
  const [percentageIncrease, setPercentageIncrease] = useState('');
  const [fixedAmount, setFixedAmount] = useState('');
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [bulkUpdateLoading, setBulkUpdateLoading] = useState(false);
  const [bulkUpdateError, setBulkUpdateError] = useState(null);
  const [bulkUpdateSuccess, setBulkUpdateSuccess] = useState(null);

  // Update selected property when properties are loaded
  React.useEffect(() => {
    if (properties && properties.length > 0 && !selectedPropertyId) {
      setSelectedPropertyId(properties[0].id.toString());
    }
  }, [properties]);

  // Fetch units from backend
  React.useEffect(() => {
    const fetchUnits = async () => {
      setUnitsLoading(true);
      try {
        const response = await propertiesAPI.getUnits();
        // Defensive: handle array or object response
        const unitsData = Array.isArray(response.data) ? response.data : response.data.results || response.data.units || [];
        const transformedUnits = unitsData.map(unit => ({
          id: unit.id,
          unitNumber: unit.unit_number || 'N/A',
          type: unit.unit_type?.name || unit.unit_type || 'N/A',
          rent: parseFloat(unit.rent) || 0,
          size: unit.size || 'N/A',
          tenant: unit.tenant?.full_name || unit.tenant?.name || null,
          isAvailable: Boolean(unit.is_available),
          propertyId: unit.property_obj?.id?.toString() || unit.property?.toString() || 'unknown',
        }));
        setUnits(transformedUnits);
      } catch (error) {
        setUnits([]);
        console.error('❌ Failed to load units:', error);
      } finally {
        setUnitsLoading(false);
      }
    };
    fetchUnits();
  }, []);

  // Fetch payments from backend
  React.useEffect(() => {
    const fetchPayments = async () => {
      setPaymentsLoading(true);
      setPaymentsError(null);
      try {
        // Get payments for current landlord
        const response = await paymentsAPI.getPaymentHistory();
        console.log('🔄 Payments API raw response:', response);
        // Try to handle different response formats
        let data = [];
        if (Array.isArray(response.data)) {
          data = response.data;
        } else if (response.data && Array.isArray(response.data.results)) {
          data = response.data.results;
        } else if (response.data && typeof response.data === 'object') {
          // Try to find payments array in object
          data = response.data.payments || response.data.data || [];
        }
        console.log('✅ Payments processed data:', data);
        
        // Debug: Log first payment to see structure
        if (data.length > 0) {
          console.log('🔍 First payment structure:', data[0]);
          console.log('🔍 Payment unit info:', {
            unit: data[0].unit,
            unit_id: data[0].unit_id,
            property: data[0].property,
            property_id: data[0].property_id
          });
        }
        
        setPayments(data);
      } catch (error) {
        console.error('❌ Failed to load payments:', error);
        setPaymentsError('Failed to load payments.');
      } finally {
        setPaymentsLoading(false);
      }
    };
    fetchPayments();
  }, []);

  // Filter units by selected property
  const filteredUnits = React.useMemo(() => {
    if (!selectedPropertyId || !units.length) return units;
    return units.filter(unit => unit.propertyId === selectedPropertyId.toString());
  }, [units, selectedPropertyId]);

  // Filter payments by selected property
  const filteredPayments = React.useMemo(() => {
    console.log('🔍 Filtering payments - selectedPropertyId:', selectedPropertyId);
    console.log('🔍 Total payments:', payments.length);
    console.log('🔍 Total units:', units.length);
    
    // If no property selected or no payments, show all payments
    if (!selectedPropertyId || !payments.length) {
      console.log('ℹ️ No filter applied - showing all payments');
      return payments;
    }
    
    // Get unit IDs for the selected property
    const propertyUnits = units.filter(unit => 
      unit.propertyId === selectedPropertyId.toString()
    );
    const propertyUnitIds = propertyUnits.map(unit => unit.id);
    
    console.log('🔍 Property units count:', propertyUnits.length);
    console.log('🔍 Property unit IDs:', propertyUnitIds);
    
    // Filter payments that belong to units in the selected property
    const filtered = payments.filter(payment => {
      // Check various possible unit ID fields in payment object
      const paymentUnitId = payment.unit?.id || payment.unit_id || payment.unit;
      
      // Also check if payment has property information directly
      const paymentPropertyId = payment.property?.id || payment.property_id || payment.property;
      
      // Match by unit ID or property ID
      const matchByUnit = paymentUnitId && propertyUnitIds.includes(paymentUnitId);
      const matchByProperty = paymentPropertyId && paymentPropertyId.toString() === selectedPropertyId.toString();
      
      return matchByUnit || matchByProperty;
    });
    
    console.log('✅ Filtered payments count:', filtered.length);
    if (filtered.length > 0) {
      console.log('🔍 First filtered payment:', filtered[0]);
    }
    
    return filtered;
  }, [payments, selectedPropertyId, units]);

  // Individual unit price update
  const handlePriceUpdate = async (unitId, newPrice) => {
    try {
      // Update backend
      await paymentsAPI.updateUnitRent(unitId, { rent: parseFloat(newPrice) });
      // Refresh units from backend after update
      setUnitsLoading(true);
      const response = await propertiesAPI.getUnits();
      const unitsData = Array.isArray(response.data) ? response.data : response.data.results || response.data.units || [];
      const transformedUnits = unitsData.map(unit => ({
        id: unit.id,
        unitNumber: unit.unit_number || 'N/A',
        type: unit.unit_type?.name || unit.unit_type || 'N/A',
        rent: parseFloat(unit.rent) || 0,
        size: unit.size || 'N/A',
        tenant: unit.tenant?.full_name || unit.tenant?.name || null,
        isAvailable: Boolean(unit.is_available),
        propertyId: unit.property_obj?.id?.toString() || unit.property?.toString() || 'unknown',
      }));
      setUnits(transformedUnits);
      setEditingUnit(null);
      setUnitsLoading(false);
      console.log('✅ Unit rent updated and units refreshed');
    } catch (error) {
      setUnitsLoading(false);
      console.error('❌ Failed to update unit rent:', error);
      alert('Failed to update unit rent. Please try again.');
    }
  };

  const getRoomTypes = () => {
  if (!filteredUnits || filteredUnits.length === 0) return [];
  const types = [...new Set(filteredUnits.map(unit => unit.type).filter(Boolean))];
  return types.length > 0 ? types : ['No types available'];
};

  // Backend-integrated bulk update
  const handleBulkUpdate = async () => {
    try {
      setBulkUpdateLoading(true);
      setBulkUpdateError(null);
      setBulkUpdateSuccess(null);

      // Prepare request data matching backend expectations
      const requestData = {
        update_type: bulkUpdateType,
        amount: bulkUpdateType === 'percentage' 
          ? parseFloat(percentageIncrease) 
          : parseFloat(fixedAmount),
        unit_type_filter: selectedRoomType,
        property_id: selectedPropertyId, // Ensure property_id is sent
        preview_only: false // Actual update, not preview
      };

      // Call backend API
      const response = await paymentsAPI.bulkRentUpdate(requestData);

      // Defensive: handle success and error
      let message = 'Bulk update completed.';
      if (response.data) {
        message = response.data.message || response.data.detail || `Successfully updated ${response.data.units_updated || ''} units`;
      }
      setBulkUpdateSuccess(message);

      // Refresh units from backend to get updated data
      const unitsResponse = await propertiesAPI.getUnits();
      const unitsData = Array.isArray(unitsResponse.data) ? unitsResponse.data : unitsResponse.data.results || unitsResponse.data.units || [];
      const transformedUnits = unitsData.map(unit => ({
        id: unit.id,
        unitNumber: unit.unit_number || 'N/A',
        type: unit.unit_type?.name || unit.unit_type || 'N/A',
        rent: parseFloat(unit.rent) || 0,
        size: unit.size || 'N/A',
        tenant: unit.tenant?.full_name || unit.tenant?.name || null,
        isAvailable: Boolean(unit.is_available),
        propertyId: unit.property_obj?.id?.toString() || unit.property?.toString() || 'unknown',
      }));
      setUnits(transformedUnits);

      // Reset form
      setPercentageIncrease('');
      setFixedAmount('');

      // Auto-hide success message after 5 seconds
      setTimeout(() => setBulkUpdateSuccess(null), 5000);

    } catch (error) {
      let errorMessage = 'Failed to update rents. Please try again.';
      if (error.response && error.response.data) {
        errorMessage = error.response.data.error || error.response.data.detail || errorMessage;
      }
      setBulkUpdateError(errorMessage);
      setTimeout(() => setBulkUpdateError(null), 5000);
    } finally {
      setBulkUpdateLoading(false);
    }
  };

  const previewBulkUpdate = () => {
    let affectedUnits = filteredUnits.filter(unit => 
      selectedRoomType === 'all' || unit.type === selectedRoomType
    );
    
    if (bulkUpdateType === 'percentage' && percentageIncrease) {
      const increase = parseFloat(percentageIncrease) / 100;
      return affectedUnits.map(unit => ({
        ...unit,
        newRent: Math.round(unit.rent * (1 + increase))
      }));
    } else if (bulkUpdateType === 'fixed' && fixedAmount) {
      const amount = parseFloat(fixedAmount);
      return affectedUnits.map(unit => ({
        ...unit,
        newRent: Math.round(unit.rent + amount)
      }));
    }
    
    return [];
  };

  const previewData = previewBulkUpdate();

  // Download payments CSV for landlord (uses selectedPropertyId)
  const handleDownloadPaymentsCSV = async () => {
    setPaymentsLoading(true);
    setPaymentsError(null);
    try {
      const token = localStorage.getItem('accessToken');
      
      // Build URL with property_id parameter if a property is selected
      let url = '/payments/rent-payments/csv/';
      if (selectedPropertyId) {
        url += `?property_id=${selectedPropertyId}`;
      }
      
      console.log('📥 Downloading CSV for property:', selectedPropertyId);
      console.log('📥 CSV URL:', url);
      
      const response = await paymentsAPI.downloadPaymentsCSV({
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        responseType: 'blob',
        params: selectedPropertyId ? { property_id: selectedPropertyId } : {}
      });
      
      const blob = response.data instanceof Blob ? response.data : new Blob([response.data], { type: 'text/csv' });
      
      // Get property name for filename
      const selectedProperty = properties.find(p => p.id.toString() === selectedPropertyId.toString());
      const propertyName = selectedProperty?.name || 'property';
      const filename = `rent_payments_${propertyName.replace(/\s+/g, '_')}.csv`;
      
      if (window.navigator && window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveOrOpenBlob(blob, filename);
      } else {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
      
      console.log('✅ CSV downloaded successfully');
    } catch (error) {
      console.error('❌ CSV download failed:', error);
      setPaymentsError('Failed to download CSV.');
    } finally {
      setPaymentsLoading(false);
    }
  };

  // Confirm and apply bulk update
  const handleConfirmBulkUpdate = () => {
    setShowDisclaimer(false);
    handleBulkUpdate();
  };

  // Cancel disclaimer
  const handleCancelDisclaimer = () => {
    setShowDisclaimer(false);
  };

  // Trigger disclaimer modal before bulk update
  const handleBulkUpdateClick = () => {
    setShowDisclaimer(true);
  };

  return (
    <div className="space-y-6 relative">
      {/* Property Selection Dropdown for CSV Download */}
      <div className="flex items-center gap-4 mb-4">
        <label htmlFor="property-select" className="font-medium">Select Property:</label>
        <select
          id="property-select"
          value={selectedPropertyId}
          onChange={e => setSelectedPropertyId(e.target.value)}
          className="p-2 border rounded"
        >
          {properties && properties.length > 0 ? (
            properties.map(property => (
              <option key={property.id} value={property.id}>{property.name || `Property ${property.id}`}</option>
            ))
          ) : (
            <option value="">No properties available</option>
          )}
        </select>
      </div>
      {/* Success Notification */}
      {bulkUpdateSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in">
          <CheckCircle className="w-6 h-6" />
          <span>{bulkUpdateSuccess}</span>
          <button onClick={() => setBulkUpdateSuccess(null)} className="ml-2">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Error Notification */}
      {bulkUpdateError && (
        <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in">
          <AlertCircle className="w-6 h-6" />
          <span>{bulkUpdateError}</span>
          <button onClick={() => setBulkUpdateError(null)} className="ml-2">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Disclaimer Modal */}
      {showDisclaimer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-40 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-8 h-8 text-yellow-600 mr-3" />
              <h2 className="text-xl font-bold text-yellow-700">Confirm Bulk Price Update</h2>
            </div>
            <p className="text-gray-800 mb-6">
              <strong>Warning:</strong> All tenants will be notified of this price change. Are you sure you want to proceed?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelDisclaimer}
                className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBulkUpdate}
                className="px-4 py-2 rounded bg-yellow-600 text-white hover:bg-yellow-700"
              >
                Confirm & Apply
              </button>
            </div>
          </div>
        </div>
      )}

      <h1 className="text-3xl font-bold text-gray-900">Payments</h1>

    

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">All Payments</h2>
          <button
            onClick={handleDownloadPaymentsCSV}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Download className="w-5 h-5 mr-2" />
            Download CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Payment ID</th>
                <th className="text-left py-3 px-4">Client</th>
                <th className="text-left py-3 px-4">Amount</th>
                <th className="text-left py-3 px-4">Date</th>
                <th className="text-left py-3 px-4">Method</th>
                <th className="text-left py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {paymentsLoading ? (
                <tr><td colSpan={6} className="py-4 text-center text-gray-500">Loading payments...</td></tr>
              ) : paymentsError ? (
                <tr><td colSpan={6} className="py-4 text-center text-red-500">{paymentsError}</td></tr>
              ) : filteredPayments.length === 0 ? (
                <tr><td colSpan={6} className="py-4 text-center text-gray-400">No payments found for this property.</td></tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id || p.payment_id} className="border-b">
                    <td className="py-3 px-4">{p.id || p.payment_id}</td>
                    <td className="py-3 px-4">{p.client || p.tenant_name || p.tenant || p.payer_name}</td>
                    <td className="py-3 px-4">KSh {Number(p.amount || p.amount_paid || 0).toLocaleString()}</td>
                    <td className="py-3 px-4">{p.date || p.payment_date || p.created_at}</td>
                    <td className="py-3 px-4">{
  p.method ||
  p.payment_method ||
  p.channel ||
  p.mode ||
  p.type ||
  p.paymentType ||
  p.payment_mode ||
  p.paymentChannel ||
  p.payment_type ||
  p.paymentMethod ||
  p.payment_mode_name ||
  'N/A'
}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        (p.status || p.payment_status) === 'Completed' ? 'bg-green-100 text-green-800' :
                        (p.status || p.payment_status) === 'Processing' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {p.status || p.payment_status || 'Unknown'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold mb-4">Unit Rental Prices</h2>
        <input type="" placeholder='Search for unit' className='rounded solid-black' />
        </div>
      
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUnits.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              No units found for this property.
            </div>
          ) : (
            filteredUnits.map(unit => (
            <div key={unit.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">Unit {unit.unitNumber}</h3>
               
              </div>
              <p className="text-sm text-gray-600 mb-2">Type: {unit.type}</p>
              {unit.tenant && <p className="text-sm text-gray-600 mb-2">Tenant: {unit.tenant}</p>}
              
              <div className="flex items-center justify-between">
                {editingUnit === unit.id ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      defaultValue={unit.rent}
                      className="w-24 p-1 border rounded"
                      onBlur={(e) => handlePriceUpdate(unit.id, e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handlePriceUpdate(unit.id, e.target.value);
                        }
                      }}
                      autoFocus
                    />
                    <button
                      onClick={() => setEditingUnit(null)}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold">KSh {unit.rent.toLocaleString()}</span>
                    <button
                      onClick={() => setEditingUnit(unit.id)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
          )}
        </div>
      </div>
        {/* Bulk Price Update Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center mb-4">
          <TrendingUp className="w-6 h-6 text-blue-600 mr-2" />
          <h2 className="text-xl font-semibold">Bulk Price Update</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Update Type
              </label>
              <select
                value={bulkUpdateType}
                onChange={(e) => setBulkUpdateType(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="percentage">Percentage Increase</option>
                <option value="fixed">Fixed Amount Increase</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Room Type
              </label>
              <select
                value={selectedRoomType}
                onChange={(e) => setSelectedRoomType(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Room Types</option>
                {getRoomTypes().map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {bulkUpdateType === 'percentage' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Percentage Increase (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={percentageIncrease}
                    onChange={(e) => setPercentageIncrease(e.target.value)}
                    placeholder="Enter percentage (e.g., 10)"
                    className="w-full p-2 pr-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <Percent className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fixed Amount Increase (KSh)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={fixedAmount}
                    onChange={(e) => setFixedAmount(e.target.value)}
                    placeholder="Enter amount (e.g., 2000)"
                    className="w-full p-2 pl-12 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">KSh</span>
                </div>
              </div>
            )}

            <button
              onClick={handleBulkUpdateClick}
              disabled={
                bulkUpdateLoading || 
                (!percentageIncrease && bulkUpdateType === 'percentage') || 
                (!fixedAmount && bulkUpdateType === 'fixed')
              }
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {bulkUpdateLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Apply Bulk Update
                </>
              )}
            </button>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">Preview Changes</h3>
            {previewData.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {previewData.map(unit => (
                  <div key={unit.id} className="flex justify-between items-center py-2 border-b border-gray-200">
                    <div>
                      <span className="font-medium">{unit.unitNumber}</span>
                      <span className="text-sm text-gray-600 ml-2">({unit.type})</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500">KSh {unit.rent.toLocaleString()}</span>
                      <span className="mx-2 text-gray-400">→</span>
                      <span className="font-medium text-green-600">KSh {unit.newRent.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                {selectedRoomType === 'all' 
                  ? 'Enter an amount to preview changes for all units'
                  : `Enter an amount to preview changes for ${selectedRoomType} units`
                }
              </p>
            )}
            
            {previewData.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                  <span>Units affected:</span>
                  <span className="font-medium">{previewData.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total increase:</span>
                  <span className="font-medium text-green-600">
                    KSh {previewData.reduce((sum, unit) => sum + (unit.newRent - unit.rent), 0).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPayments;