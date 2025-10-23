import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
import { 
  Home, 
  CreditCard, 
  AlertTriangle, 
  DollarSign,
  AlertCircle,
  User,
  Phone,
  FileText,
  Calendar,
  Clock,
  Mail,
  TrendingUp,
  RefreshCw,
  Loader2
} from 'lucide-react';

const TenantDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tenants, units, reports, refreshData, isLoading } = useAppContext();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get current tenant's data
  const currentTenant = tenants.find(t => t.id === user?.id) || user;
  const tenantUnit = units.find(u => u.tenant?.id === user?.id);
  const tenantReports = reports.filter(r => r.tenant?.id === user?.id);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      console.log('Loading tenant dashboard data...');
      console.log('User:', user);
      console.log('Tenants:', tenants);
      console.log('Units:', units);
      
      // If data is empty, trigger refresh
      if (!tenants.length && !isLoading) {
        console.log('Data empty, refreshing...');
        await refreshData();
      }
    };

    loadData();
  }, [user?.id]); // Reload when user ID changes

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
      alert('Dashboard updated successfully');
    } catch (error) {
      console.error('Refresh error:', error);
      alert('Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Calculate payment status
  const calculatePaymentStatus = () => {
    if (!tenantUnit) return { paid: 0, remaining: 0, percentage: 0, status: 'no_unit' };
    
    const rent = parseFloat(tenantUnit.rent || 0);
    const paid = parseFloat(tenantUnit.rent_paid || 0);
    const remaining = parseFloat(tenantUnit.rent_remaining || 0);
    const percentage = rent > 0 ? (paid / rent) * 100 : 0;

    let status = 'paid';
    if (remaining === rent) status = 'due';
    else if (remaining > 0) status = 'overdue';
    else if (remaining === 0) status = 'paid';

    return { paid, remaining, percentage, status };
  };

  const paymentStatus = calculatePaymentStatus();

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Get status color and text
  const getPaymentStatusInfo = () => {
    switch (paymentStatus.status) {
      case 'paid':
        return { color: 'green', text: 'Paid', bgColor: 'bg-green-100', textColor: 'text-green-800' };
      case 'due':
        return { color: 'yellow', text: 'Due', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' };
      case 'overdue':
        return { color: 'red', text: 'Overdue', bgColor: 'bg-red-100', textColor: 'text-red-800' };
      default:
        return { color: 'gray', text: 'No Unit', bgColor: 'bg-gray-100', textColor: 'text-gray-800' };
    }
  };

  const paymentInfo = getPaymentStatusInfo();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error if no user
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-4">Please log in to access your dashboard</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome, {currentTenant?.full_name || user?.email || 'Tenant'}
            </h1>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              title="Refresh data"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-gray-600">
            {tenantUnit ? (
              <span className="flex items-center gap-1">
                <Home className="w-4 h-4" />
                Unit {tenantUnit.unit_number}
                {tenantUnit.unit_code && ` (${tenantUnit.unit_code})`}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-yellow-600">
                <AlertCircle className="w-4 h-4" />
                No unit assigned
              </span>
            )}
            <span className="flex items-center gap-1">
              <User className="w-4 h-4" />
              ID: {currentTenant?.id || user?.id || 'N/A'}
            </span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <button 
            onClick={() => navigate('/tenant/payments')}
            disabled={!tenantUnit}
            className={`px-4 py-2 rounded-lg flex items-center justify-center transition-colors ${
              tenantUnit
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <CreditCard className="w-5 h-5 mr-2" />
            Pay Rent
          </button>
          <button 
            onClick={() => navigate('/tenant/report')}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center justify-center transition-colors"
          >
            <AlertTriangle className="w-5 h-5 mr-2" />
            Report Issue
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Room Details */}
        <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Room Details</p>
              <p className="text-2xl font-bold text-blue-900">
                {tenantUnit ? `Unit ${tenantUnit.unit_number}` : 'Not Assigned'}
              </p>
              <div className="text-blue-600 text-sm space-y-1 mt-2">
                {tenantUnit ? (
                  <>
                    <p>{tenantUnit.bedrooms || 0} bed / {tenantUnit.bathrooms || 0} bath</p>
                    {tenantUnit.floor && <p>Floor {tenantUnit.floor}</p>}
                    {tenantUnit.assigned_date && (
                      <p>Since {new Date(tenantUnit.assigned_date).toLocaleDateString()}</p>
                    )}
                  </>
                ) : (
                  <p>Contact landlord for assignment</p>
                )}
              </div>
            </div>
            <Home className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        {/* Monthly Rent */}
        <div 
          className={`bg-green-50 border border-green-200 p-6 rounded-lg cursor-pointer transition-all hover:scale-105 ${
            !tenantUnit ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          onClick={tenantUnit ? () => navigate('/tenant/payments') : undefined}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Monthly Rent</p>
              <p className="text-2xl font-bold text-green-900">
                {tenantUnit ? formatCurrency(tenantUnit.rent) : 'N/A'}
              </p>
              <p className="text-green-600 text-sm">
                {paymentStatus.status !== 'no_unit' ? (
                  <>Due: {formatCurrency(paymentStatus.remaining)}</>
                ) : (
                  'No unit assigned'
                )}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>

        {/* Reports Status */}
        <div className="bg-purple-50 border border-purple-200 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">My Reports</p>
              <p className="text-2xl font-bold text-purple-900">
                {tenantReports.length}
              </p>
              <p className="text-purple-600 text-sm">
                {tenantReports.filter(r => r.status === 'open').length} open
              </p>
            </div>
            <FileText className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-blue-600" />
          Contact Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900">Phone Number</p>
              <p className="text-gray-600">{currentTenant?.phone_number || 'Not provided'}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900">Email</p>
              <p className="text-gray-600">{currentTenant?.email || user?.email}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantDashboard;