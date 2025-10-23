import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { 
  TrendingUp,
  Percent,
  RefreshCw,
  Edit,
  X,
  Search,
  DollarSign,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  User,
  Home,
  CreditCard,
  AlertTriangle,
  Loader
} from 'lucide-react';

const AdminPayments = () => {
  const [error, setError] = useState(null);
  
  let contextData;
  try {
    contextData = useAppContext();
  } catch (err) {
    console.error('Context Error:', err);
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
            <div>
              <h3 className="font-semibold text-red-900">Context Error</h3>
              <p className="text-red-700 text-sm mt-1">
                Unable to load context data. Please refresh the page.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { 
    units = [], 
    tenants = [], 
    payments = [],
    unitTypes = [],
    updateUnit,
    refreshData,
    updateUnitRent,
    bulkRentUpdate,
    previewBulkRentUpdate,
    fetchPayments, // ADD THIS
    paymentsLoading // ADD THIS
  } = contextData || {};
  
  let toastContext;
  try {
    toastContext = useToast();
  } catch (err) {
    console.error('Toast Context Error:', err);
    toastContext = { showToast: () => {} };
  }
  
  const { showToast } = toastContext;

  const [editingUnit, setEditingUnit] = useState(null);
  const [bulkUpdateType, setBulkUpdateType] = useState('percentage');
  const [selectedUnitType, setSelectedUnitType] = useState('all');
  const [percentageIncrease, setPercentageIncrease] = useState('');
  const [fixedAmount, setFixedAmount] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [previewData, setPreviewData] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [paymentsLoaded, setPaymentsLoaded] = useState(false); // ADD THIS

  // FIXED: Ensure payments are loaded when component mounts
  useEffect(() => {
    const ensurePaymentsLoaded = async () => {
      console.log('🔍 Checking if payments need to be loaded...', {
        paymentsLength: payments?.length || 0,
        paymentsLoaded,
        hasFetchPayments: !!fetchPayments,
        paymentsLoading
      });

      // If payments array exists but is empty or we haven't loaded payments yet
      if ((!payments || payments.length === 0) && !paymentsLoaded && fetchPayments && !paymentsLoading) {
        console.log('🔄 Payments not loaded, fetching now...');
        try {
          await fetchPayments();
          setPaymentsLoaded(true);
          console.log('✅ Payments fetched successfully');
        } catch (error) {
          console.error('❌ Failed to fetch payments:', error);
        }
      } else if (payments && payments.length > 0) {
        console.log('✅ Payments already loaded:', payments.length);
        setPaymentsLoaded(true);
      }
    };

    ensurePaymentsLoaded();
  }, [payments, paymentsLoaded, fetchPayments, paymentsLoading]);


    // Add this function to handle authentication errors
  const handleAuthError = (error) => {
    if (error.message.includes('token') || error.message.includes('authentication') || error.message.includes('401')) {
      showToast('Your session has expired. Please login again.', 'error');
      // Redirect to login after a short delay
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    }
};
  // FIXED: Manual refresh function for payments
// Then update your refreshPayments function to use this:
  const refreshPayments = async () => {
    if (fetchPayments) {
      console.log('🔄 Manually refreshing payments...');
      try {
        await fetchPayments();
        setPaymentsLoaded(true);
        showToast('Payments refreshed', 'success');
      } catch (error) {
        console.error('❌ Failed to refresh payments:', error);
        handleAuthError(error); // Use the new error handler
        if (!error.message.includes('token') && !error.message.includes('authentication')) {
          showToast('Failed to refresh payments', 'error');
        }
      }
    }
  };

  // Debug: Log data on mount
  useEffect(() => {
    console.log('AdminPayments mounted with data:', {
      units: units?.length || 0,
      payments: payments?.length || 0,
      unitTypes: unitTypes?.length || 0,
      paymentsLoaded
    });
  }, [units, payments, unitTypes, paymentsLoaded]);

  // FIXED: Get unique unit types with proper mapping
  const getUnitTypes = () => {
    if (!Array.isArray(units)) return [];
    
    // Create a mapping of unit_type IDs to names
    const unitTypeMap = {};
    if (Array.isArray(unitTypes)) {
      unitTypes.forEach(type => {
        unitTypeMap[type.id] = type.name;
      });
    }
    
    // Get types from units by mapping IDs to names
    const typesFromUnits = [...new Set(
      units
        .map(unit => {
          if (unit?.unit_type) {
            // If unit_type is an object with name
            if (typeof unit.unit_type === 'object' && unit.unit_type.name) {
              return unit.unit_type.name;
            }
            // If unit_type is an ID, map it to name
            else if (unitTypeMap[unit.unit_type]) {
              return unitTypeMap[unit.unit_type];
            }
            // If it's already a string name
            else if (typeof unit.unit_type === 'string') {
              return unit.unit_type;
            }
          }
          return null;
        })
        .filter(Boolean)
    )];
    
    // Get types from unitTypes array
    const typesFromUnitTypes = unitTypes.map(type => type.name).filter(Boolean);
    
    // Combine and remove duplicates
    const allTypes = [...new Set([...typesFromUnits, ...typesFromUnitTypes])];
    
    console.log('📊 Available unit types:', {
      fromUnits: typesFromUnits,
      fromUnitTypes: typesFromUnitTypes,
      combined: allTypes,
      unitTypeMap: unitTypeMap
    });
    
    return allTypes;
  };

  // FIXED: Safe filter with proper unit type matching
  const filteredUnits = React.useMemo(() => {
    if (!Array.isArray(units)) {
      console.warn('Units is not an array:', units);
      return [];
    }
    
    // Create unit type mapping
    const unitTypeMap = {};
    if (Array.isArray(unitTypes)) {
      unitTypes.forEach(type => {
        unitTypeMap[type.id] = type.name;
      });
    }
    
    const filtered = units.filter(unit => {
      if (!unit) return false;
      
      const matchesSearch = unit.unit_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          unit.unit_code?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // FIXED: Enhanced unit type matching
      let matchesType = true;
      if (selectedUnitType !== 'all') {
        let unitTypeName = '';
        
        // Handle different unit_type structures
        if (typeof unit.unit_type === 'object' && unit.unit_type.name) {
          unitTypeName = unit.unit_type.name;
        } else if (unitTypeMap[unit.unit_type]) {
          unitTypeName = unitTypeMap[unit.unit_type];
        } else if (typeof unit.unit_type === 'string') {
          unitTypeName = unit.unit_type;
        }
        
        matchesType = unitTypeName === selectedUnitType;
      }
      
      return matchesSearch && matchesType;
    });

    console.log('🔍 UNIT FILTERING - Total units:', units.length);
    console.log('🔍 UNIT FILTERING - Filtered units:', filtered.length);
    console.log('🔍 UNIT FILTERING - Selected type:', selectedUnitType);
    
    return filtered;
  }, [units, searchTerm, selectedUnitType, unitTypes]);

  // FIXED: Safe filter payments with better data handling
  const filteredPayments = React.useMemo(() => {
    if (!Array.isArray(payments)) {
      console.warn('Payments is not an array:', payments);
      return [];
    }
    
    console.log('💰 Payments data for filtering:', payments);
    
    const filtered = payments.filter(payment => {
      if (!payment) return false;
      
      // Map backend status to frontend status for filtering
      const statusMap = {
        'completed': 'Success',
        'pending': 'Pending', 
        'failed': 'Failed',
        'cancelled': 'Failed',
        'success': 'Success'
      };
      
      const paymentStatus = payment.status || payment.status_display;
      const frontendStatus = statusMap[paymentStatus] || paymentStatus;
      
      return filterStatus === 'all' || frontendStatus === filterStatus;
    });

    console.log('🔍 Payment filtering - Total:', payments.length, 'Filtered:', filtered.length);
    return filtered;
  }, [payments, filterStatus]);

  const handleRentUpdate = async (unitId, newRent) => {
    try {
      if (!updateUnitRent) {
        throw new Error('Rent update functionality not available');
      }
      
      const response = await updateUnitRent(unitId, parseFloat(newRent));
      
      if (response.success) {
        showToast('Rent updated successfully', 'success');
        setEditingUnit(null);
        
        // Refresh data to show updated rent values
        if (refreshData) {
          refreshData();
        }
      } else {
        throw new Error(response.error || 'Failed to update rent');
      }
    } catch (error) {
      console.error('Rent update error:', error);
      showToast(error.message || 'Failed to update rent', 'error');
    }
  };

  // FIXED: Enhanced preview function
  const executePreviewBulkUpdate = async () => {
    if ((bulkUpdateType === 'percentage' && (!percentageIncrease || parseFloat(percentageIncrease) <= 0)) || 
        (bulkUpdateType === 'fixed' && (!fixedAmount || parseFloat(fixedAmount) <= 0))) {
      console.log('⚠️ Preview: Invalid input values');
      return [];
    }

    try {
      if (!previewBulkRentUpdate) {
        console.error('❌ Preview: Function not available');
        showToast('Preview functionality not available', 'error');
        return [];
      }

      const updateData = {
        update_type: bulkUpdateType,
        amount: bulkUpdateType === 'percentage' ? parseFloat(percentageIncrease) : parseFloat(fixedAmount),
        unit_type_filter: selectedUnitType === 'all' ? '' : selectedUnitType,
      };

      console.log('🔍 Preview: Sending request:', updateData);
      
      const response = await previewBulkRentUpdate(updateData);
      console.log('🔍 Preview: Received response:', response);
      
      // Handle different response structures
      if (response && response.success !== false) {
        const previewData = Array.isArray(response.preview_data) ? response.preview_data : 
                           Array.isArray(response) ? response : [];
        
        console.log('✅ Preview: Success, data count:', previewData.length);
        return previewData;
      } else {
        console.error('❌ Preview: Request failed:', response?.error);
        showToast(response?.error || 'Failed to preview changes', 'error');
        return [];
      }

    } catch (error) {
      console.error('❌ Preview: Error:', error);
      showToast('Failed to preview changes', 'error');
      return [];
    }
  };

  // FIXED: Enhanced bulk update handler
  const handleBulkUpdate = async () => {
    if ((bulkUpdateType === 'percentage' && (!percentageIncrease || parseFloat(percentageIncrease) <= 0)) || 
        (bulkUpdateType === 'fixed' && (!fixedAmount || parseFloat(fixedAmount) <= 0))) {
      showToast('Please enter a valid amount', 'error');
      return;
    }

    setIsUpdating(true);
    try {
      if (!bulkRentUpdate) {
        throw new Error('Bulk rent update functionality not available');
      }

      const updateData = {
        update_type: bulkUpdateType,
        amount: bulkUpdateType === 'percentage' ? parseFloat(percentageIncrease) : parseFloat(fixedAmount),
        unit_type_filter: selectedUnitType === 'all' ? '' : selectedUnitType,
      };

      console.log('🚀 Sending bulk update:', updateData);

      const response = await bulkRentUpdate(updateData);
      
      console.log('✅ Bulk update response:', response);
      
      if (response.success) {
        const unitsUpdated = response.units_updated || 
                           response.details?.units_actually_updated || 
                           response.units_affected || 
                           response.updated_units_count ||
                           0;
        
        showToast(`Successfully updated rent for ${unitsUpdated} units`, 'success');
        
        // Reset form
        setPercentageIncrease('');
        setFixedAmount('');
        setPreviewData([]);
        
        // Refresh data
        if (refreshData) {
          await refreshData();
        }
      } else {
        throw new Error(response.error || response.message || 'Failed to update rents');
      }
      
    } catch (error) {
      console.error('Bulk update error:', error);
      showToast(error.message || 'Failed to update rents', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  // FIXED: Enhanced preview useEffect
  useEffect(() => {
    const loadPreview = async () => {
      setPreviewLoading(true);
      try {
        const data = await executePreviewBulkUpdate();
        console.log('🎯 Setting preview data:', data.length, 'items');
        setPreviewData(data);
      } catch (error) {
        console.error('❌ Error loading preview:', error);
        setPreviewData([]);
      } finally {
        setPreviewLoading(false);
      }
    };
    
    // Check if we have valid input for preview
    const hasValidInput = (bulkUpdateType === 'percentage' && percentageIncrease && parseFloat(percentageIncrease) > 0) || 
                         (bulkUpdateType === 'fixed' && fixedAmount && parseFloat(fixedAmount) > 0);
    
    if (hasValidInput) {
      // Add debounce to prevent too many requests
      const timer = setTimeout(loadPreview, 800);
      return () => clearTimeout(timer);
    } else {
      setPreviewData([]);
      setPreviewLoading(false);
    }
  }, [bulkUpdateType, percentageIncrease, fixedAmount, selectedUnitType]);

  // FIXED: Calculate payment statistics with better data handling
  const paymentStats = React.useMemo(() => {
    if (!Array.isArray(payments)) {
      return {
        total: 0,
        completed: 0,
        pending: 0,
        failed: 0,
        totalAmount: 0
      };
    }

    console.log('💰 Payments for stats:', payments);

    // Map backend statuses to frontend statuses for counting
    const statusCounts = payments.reduce((acc, payment) => {
      if (!payment) return acc;
      
      const status = payment.status || payment.status_display;
      if (status === 'completed' || status === 'success') acc.completed++;
      else if (status === 'pending') acc.pending++;
      else if (status === 'failed' || status === 'cancelled') acc.failed++;
      
      return acc;
    }, { completed: 0, pending: 0, failed: 0 });

    const totalAmount = payments.reduce((sum, payment) => {
      if (!payment) return sum;
      const status = payment.status || payment.status_display;
      if (status === 'completed' || status === 'success') {
        return sum + parseFloat(payment.amount || 0);
      }
      return sum;
    }, 0);

    return {
      total: payments.length,
      completed: statusCounts.completed,
      pending: statusCounts.pending,
      failed: statusCounts.failed,
      totalAmount: totalAmount
    };
  }, [payments]);

  // Format currency
  const formatCurrency = (amount) => {
    try {
      return new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 0,
      }).format(amount || 0);
    } catch (err) {
      return `KSh ${amount || 0}`;
    }
  };

  // Format date - handle different date field names
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      return new Date(dateString).toLocaleDateString('en-KE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (err) {
      return 'Invalid date';
    }
  };

  // FIXED: Get payment date - handle different field names
  const getPaymentDate = (payment) => {
    return payment.date || payment.transaction_date || payment.created_at || 'N/A';
  };

  // FIXED: Get receipt number - handle different field names
  const getReceiptNumber = (payment) => {
    return payment.mpesa_receipt || payment.mpesa_receipt_number || payment.reference_number || null;
  };

  // FIXED: Get tenant name safely
  const getTenantName = (payment) => {
    return payment.tenant_name || 
           payment.tenant?.full_name || 
           payment.tenant?.name || 
           'N/A';
  };

  // FIXED: Get status icon and color with backend status mapping
  const getStatusInfo = (backendStatus) => {
    // Map backend status to frontend display status
    const statusMap = {
      'completed': 'Success',
      'pending': 'Pending',
      'failed': 'Failed',
      'cancelled': 'Failed',
      'success': 'Success'
    };
    
    const displayStatus = statusMap[backendStatus] || backendStatus;
    
    switch (displayStatus) {
      case 'Success':
        return { 
          icon: CheckCircle, 
          color: 'text-green-500', 
          bgColor: 'bg-green-100', 
          textColor: 'text-green-800',
          displayText: 'Success'
        };
      case 'Pending':
        return { 
          icon: Clock, 
          color: 'text-yellow-500', 
          bgColor: 'bg-yellow-100', 
          textColor: 'text-yellow-800',
          displayText: 'Pending'
        };
      case 'Failed':
        return { 
          icon: XCircle, 
          color: 'text-red-500', 
          bgColor: 'bg-red-100', 
          textColor: 'text-red-800',
          displayText: 'Failed'
        };
      default:
        return { 
          icon: Clock, 
          color: 'text-gray-500', 
          bgColor: 'bg-gray-100', 
          textColor: 'text-gray-800',
          displayText: backendStatus || 'Unknown'
        };
    }
  };

  // Add this useEffect to debug payments
  useEffect(() => {
    console.log('🔍 PAYMENTS DEBUG:', {
      payments: payments,
      filteredPayments: filteredPayments,
      paymentStats: paymentStats,
      paymentsLength: payments?.length || 0,
      paymentsLoaded
    });
  }, [payments, filteredPayments, paymentStats, paymentsLoaded]);

  // Show loading state if data is still being fetched
  if ((!units || !payments) && paymentsLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payments Management</h1>
          <p className="text-gray-600 mt-1">Manage rental payments and unit pricing</p>
        </div>
      </div>

      {/* Payment Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Payments</p>
              <p className="text-3xl font-bold text-gray-900">{paymentStats.total}</p>
              <p className="text-gray-600 text-sm">All time</p>
            </div>
            <CreditCard className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Completed</p>
              <p className="text-3xl font-bold text-gray-900">{paymentStats.completed}</p>
              <p className="text-gray-600 text-sm">Successful payments</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Pending</p>
              <p className="text-3xl font-bold text-gray-900">{paymentStats.pending}</p>
              <p className="text-gray-600 text-sm">Awaiting confirmation</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Amount</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(paymentStats.totalAmount).replace('KES', 'KSh')}
              </p>
              <p className="text-gray-600 text-sm">Collected revenue</p>
            </div>
            <DollarSign className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* FIXED: Bulk Price Update Section */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <div className="flex items-center mb-4">
          <TrendingUp className="w-6 h-6 text-blue-600 mr-2" />
          <h2 className="text-xl font-semibold">Bulk Rent Update</h2>
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
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="percentage">Percentage Increase</option>
                <option value="fixed">Fixed Amount Increase</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit Type Filter
              </label>
              <select
                value={selectedUnitType}
                onChange={(e) => setSelectedUnitType(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Unit Types</option>
                {Array.isArray(getUnitTypes()) && getUnitTypes().map(type => (
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
                    className="w-full p-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    step="0.1"
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
                    className="w-full p-2 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                  />
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">KSh</span>
                </div>
              </div>
            )}

            <button
              onClick={handleBulkUpdate}
              disabled={(!percentageIncrease && bulkUpdateType === 'percentage') || (!fixedAmount && bulkUpdateType === 'fixed') || isUpdating}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
            >
              {isUpdating ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
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

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-medium text-gray-900 mb-3">Preview Changes</h3>
            
            {previewLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="w-6 h-6 animate-spin text-blue-500 mr-2" />
                <span className="text-gray-600">Calculating changes...</span>
              </div>
            ) : previewData.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {previewData.map((unit, index) => (
                  <div key={unit.unit_id || index} className="flex justify-between items-center py-2 border-b border-gray-200">
                    <div className="flex-1">
                      <div className="font-medium">{unit.unit_number}</div>
                      <div className="text-xs text-gray-600">{unit.unit_type || 'No type'}</div>
                    </div>
                    <div className="text-sm text-right">
                      <div className="text-gray-500">{formatCurrency(unit.old_rent)}</div>
                      <div className="font-medium text-green-600">{formatCurrency(unit.new_rent)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                {selectedUnitType === 'all' 
                  ? 'Enter an amount to preview changes for all units'
                  : `Enter an amount to preview changes for ${selectedUnitType} units`
                }
              </p>
            )}
            
            {!previewLoading && previewData.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200 space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Units affected:</span>
                  <span className="font-medium">{previewData.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total monthly increase:</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(previewData.reduce((sum, unit) => sum + (unit.new_rent - unit.old_rent), 0))}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>New total monthly revenue:</span>
                  <span className="font-medium text-blue-600">
                    {formatCurrency(previewData.reduce((sum, unit) => sum + unit.new_rent, 0))}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FIXED: Recent Payments Section with Refresh Button */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <h2 className="text-xl font-semibold">Recent Payments</h2>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="Success">Completed</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
            </select>
            
            {/* ADD REFRESH BUTTON */}
            <button 
              onClick={refreshPayments}
              disabled={paymentsLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${paymentsLoading ? 'animate-spin' : ''}`} />
              {paymentsLoading ? 'Loading...' : 'Refresh Payments'}
            </button>
            
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Payment ID</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Tenant</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Unit</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Receipt</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(filteredPayments) && filteredPayments.slice(0, 10).map(payment => {
                if (!payment) return null;
                
                const statusInfo = getStatusInfo(payment.status || payment.status_display);
                const StatusIcon = statusInfo.icon;
                
                return (
                  <tr key={payment.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-sm">
                      {payment.reference_number || payment.mpesa_receipt || `#${payment.id}`}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <span>{getTenantName(payment)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {payment.unit_number || payment.unit?.unit_number || 'N/A'}
                    </td>
                    <td className="py-3 px-4 font-semibold">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {formatDate(getPaymentDate(payment))}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                        (payment.payment_type === 'rent' || !payment.payment_type) ? 'bg-blue-100 text-blue-800' : 
                        payment.payment_type === 'deposit' ? 'bg-green-100 text-green-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {payment.payment_type || 'rent'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 w-fit ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusInfo.displayText}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {getReceiptNumber(payment) ? (
                        <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                          {getReceiptNumber(payment)}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">No receipt</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {(!Array.isArray(filteredPayments) || filteredPayments.length === 0) && (
            <div className="text-center py-12 text-gray-500">
              <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No payments found</p>
              <p className="text-sm mt-1 mb-4">
                {filterStatus !== 'all' ? `No ${filterStatus.toLowerCase()} payments` : 'No payment records yet'}
              </p>
              <button
                onClick={refreshPayments}
                disabled={paymentsLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors mx-auto"
              >
                <RefreshCw className={`w-4 h-4 ${paymentsLoading ? 'animate-spin' : ''}`} />
                {paymentsLoading ? 'Loading...' : 'Refresh Payments'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Unit Rental Prices Section */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <h2 className="text-xl font-semibold">Unit Rental Prices</h2>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by unit number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
              />
            </div>
            <select
              value={selectedUnitType}
              onChange={(e) => setSelectedUnitType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              {Array.isArray(getUnitTypes()) && getUnitTypes().map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>
      
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.isArray(filteredUnits) && filteredUnits.map(unit => {
            if (!unit) return null;
            
            return (
              <div key={unit.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{unit.unit_number}</h3>
                    {unit.unit_code && (
                      <p className="text-xs text-gray-500 mt-1">{unit.unit_code}</p>
                    )}
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    unit.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {unit.is_available ? 'Available' : 'Occupied'}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span>{unit.unit_type?.name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bed/Bath:</span>
                    <span>{unit.bedrooms || 0} / {unit.bathrooms || 0}</span>
                  </div>
                  {unit.tenant && (
                    <div className="flex justify-between">
                      <span>Tenant:</span>
                      <span className="font-medium">{unit.tenant.full_name || unit.tenant.name}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
                  {editingUnit === unit.id ? (
                    <div className="flex items-center space-x-2 flex-1">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">KSh</span>
                        <input
                          type="number"
                          defaultValue={unit.rent}
                          className="w-full pl-10 pr-10 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          onBlur={(e) => handleRentUpdate(unit.id, e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleRentUpdate(unit.id, e.target.value);
                            }
                          }}
                          autoFocus
                        />
                      </div>
                      <button
                        onClick={() => setEditingUnit(null)}
                        className="text-gray-600 hover:text-gray-800 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 flex-1">
                      <div className="flex-1">
                        <div className="font-semibold text-lg text-gray-900">
                          {formatCurrency(unit.rent)}
                        </div>
                        <div className="text-xs text-gray-500">per month</div>
                      </div>
                      <button
                        onClick={() => setEditingUnit(unit.id)}
                        className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                        title="Edit rent"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {(!Array.isArray(filteredUnits) || filteredUnits.length === 0) && (
          <div className="text-center py-12 text-gray-500">
            <Home className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No units found</p>
            <p className="text-sm mt-1">
              {searchTerm ? 'Try adjusting your search terms' : 'No units available for the selected filters'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPayments;