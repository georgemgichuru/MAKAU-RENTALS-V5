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
  const {mockTenants, mockReports, propertyUnits} = useContext(AppContext);

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

  // Fetch units from backend
  React.useEffect(() => {
    const fetchUnits = async () => {
      setUnitsLoading(true);
      try {
        const response = await propertiesAPI.getUnits();
        console.log('✅ Units fetched:', response.data);
        
        // Transform backend data to match component format
        const transformedUnits = response.data.map(unit => ({
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

  // Individual unit price update
  const handlePriceUpdate = async (unitId, newPrice) => {
    try {
      // Update backend
      await paymentsAPI.updateUnitRent(unitId, { rent: parseFloat(newPrice) });
      
      // Update local state
      setUnits(units.map(unit => 
        unit.id === unitId ? { ...unit, rent: parseFloat(newPrice) } : unit
      ));
      setEditingUnit(null);
      
      console.log('✅ Unit rent updated successfully');
    } catch (error) {
      console.error('❌ Failed to update unit rent:', error);
      alert('Failed to update unit rent. Please try again.');
    }
  };

  const getRoomTypes = () => {
  if (!units || units.length === 0) return [];
  const types = [...new Set(units.map(unit => unit.type).filter(Boolean))];
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
        preview_only: false // Actual update, not preview
      };

      console.log('🔄 Sending bulk update request:', requestData);

      // Call backend API
      const response = await paymentsAPI.bulkRentUpdate(requestData);
      console.log('✅ Bulk update response:', response.data);

      // Refresh units from backend to get updated data
      const unitsResponse = await propertiesAPI.getUnits();
      const transformedUnits = unitsResponse.data.map(unit => ({
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

      // Show success message
      const message = response.data.message || `Successfully updated ${response.data.units_updated} units`;
      setBulkUpdateSuccess(message);
      
      // Reset form
      setPercentageIncrease('');
      setFixedAmount('');
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => setBulkUpdateSuccess(null), 5000);

    } catch (error) {
      console.error('❌ Bulk update failed:', error);
      const errorMessage = error.response?.data?.error || 'Failed to update rents. Please try again.';
      setBulkUpdateError(errorMessage);
      
      // Auto-hide error message after 5 seconds
      setTimeout(() => setBulkUpdateError(null), 5000);
    } finally {
      setBulkUpdateLoading(false);
    }
  };

  const previewBulkUpdate = () => {
    let affectedUnits = units.filter(unit => 
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
      // Get selected property ID from context
      const propertyId = selectedPropertyId;
      if (!propertyId) {
        setPaymentsError('No property selected.');
        setPaymentsLoading(false);
        return;
      }
      // Call correct backend endpoint for landlord CSV
      const token = localStorage.getItem('accessToken');
      const response = await paymentsAPI.downloadPaymentsCSV({
        url: `/payments/landlord-csv/${propertyId}/`,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        responseType: 'blob',
      });
      const blob = response.data instanceof Blob ? response.data : new Blob([response.data], { type: 'text/csv' });
      if (window.navigator && window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveOrOpenBlob(blob, `landlord_payments_${propertyId}.csv`);
      } else {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `landlord_payments_${propertyId}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
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
              ) : payments.length === 0 ? (
                <tr><td colSpan={6} className="py-4 text-center text-gray-400">No payments found.</td></tr>
              ) : (
                payments.map((p) => (
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
          {units.map(unit => (
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
          ))}
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