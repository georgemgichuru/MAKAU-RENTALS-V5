import React, { useState } from 'react';
import { 
  Users, 
  AlertTriangle, 
  Plus, 
  Mail,
  DollarSign,
  AlertCircle,
  ExternalLink,
  TrendingUp,
  Activity,
  Home
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useNotifications } from '../../context/NotificationContext';
import { NavLink, useNavigate } from 'react-router-dom';
import EmailFormModal from './EmailFormModal';

const AdminDashboard = ({ onClose }) => {
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const navigate = useNavigate();
  
  // Use actual context data instead of mock data
  const { 
    tenants, 
    tenantsLoading,
    reports, 
    units,
    properties,
    landlords,
    pendingApplications
  } = useAppContext();

  const { getNotificationSummary } = useNotifications();
  const notificationSummary = getNotificationSummary();

  // Calculate dashboard metrics from real data
  const calculateMetrics = () => {
    // Total tenants
    const totalTenants = tenants.length;
    
    // Active tenants (with assigned units)
    const activeTenants = tenants.filter(tenant => tenant.unit).length;
    
    // Monthly revenue (sum of all unit rents)
    const monthlyRevenue = units.reduce((total, unit) => {
      return total + (parseFloat(unit.rent) || 0);
    }, 0);
    
    // Rent due (sum of rent_remaining for all units)
    const rentDue = units.reduce((total, unit) => {
      return total + (parseFloat(unit.rent_remaining) || 0);
    }, 0);
    
    // Open reports
    const openReports = reports.filter(report => report.status === 'open').length;
    
    // Occupancy rate
    const occupiedUnits = units.filter(unit => !unit.is_available).length;
    const totalUnits = units.length;
    const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

    return {
      totalTenants,
      activeTenants,
      monthlyRevenue,
      rentDue,
      openReports,
      occupancyRate,
      totalProperties: properties.length,
      totalUnits: units.length,
      pendingApplications: pendingApplications.length
    };
  };

  const metrics = calculateMetrics();

  // Function to handle the tenant signup link
  const handleTenantSignup = () => {
    const signupUrl = `${window.location.origin}/signup?user_type=tenant`;
    window.open(signupUrl, '_blank');
  };

  // Function to handle adding new property
// Function to handle adding new property
  const handleAddProperty = () => {
    // Navigate to the correct property creation page
    navigate('/landlord-dashboard/add-property');
    if (onClose) onClose();
  };

  // Function to copy the signup link to clipboard
  const copySignupLink = async () => {
    const signupUrl = `${window.location.origin}/signup?user_type=tenant`;
    try {
      await navigator.clipboard.writeText(signupUrl);
      alert('Signup link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy: ', err);
      alert('Failed to copy link. Please try again.');
    }
  };

  // Format currency for display
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Get recent transactions from actual data (you might want to create a payments API for this)
  const getRecentTransactions = () => {
    // This is a placeholder - you'll need to implement actual payment data
    // For now, we'll create some sample data based on tenant payments
    const recentTransactions = tenants.slice(0, 3).map(tenant => ({
      id: tenant.id,
      name: tenant.name || tenant.full_name || 'Unknown Tenant',
      date: new Date().toISOString().split('T')[0],
      amount: tenant.unit ? parseFloat(tenant.unit.rent_paid) || 0 : 0,
      type: 'payment'
    }));

    return recentTransactions.length > 0 ? recentTransactions : [
      {
        id: 1,
        name: 'No recent transactions',
        date: new Date().toISOString().split('T')[0],
        amount: 0,
        type: 'info'
      }
    ];
  };

  const recentTransactions = getRecentTransactions();

  if (tenantsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Loading dashboard data...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-200 p-6 rounded-lg animate-pulse">
              <div className="h-4 bg-gray-300 rounded mb-2"></div>
              <div className="h-8 bg-gray-300 rounded mb-2"></div>
              <div className="h-3 bg-gray-300 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-col sm:flex-row gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Manage your properties and tenants</p>
        </div>
        <div className="flex gap-3 flex-col sm:flex-row">
          <button
            onClick={() => setIsEmailModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center transition-colors"
          >
            <Mail className="w-5 h-5 mr-2" />
            Send Email
          </button>
          
          {/* Add New Property Button */}
          <button
            onClick={handleAddProperty}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center transition-colors"
          >
            <Home className="w-5 h-5 mr-2" />
            Add New Property
          </button>
     
          {/* Dropdown for tenant signup options */}
          <div className="relative group">
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center transition-colors">
              <Plus className="w-5 h-5 mr-2" />
              Add New Tenant
            </button>
            
            {/* Dropdown menu */}
            <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              <div className="py-2">
                <button
                  onClick={handleTenantSignup}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center transition-colors"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Signup Form
                </button>
                <button
                  onClick={copySignupLink}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center transition-colors"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Copy Signup Link
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Signup URL Display for Admin Reference */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-medium text-green-800 mb-2">Tenant Signup Link</h3>
        <div className="flex items-center justify-between flex-col sm:flex-row gap-2">
          <code className="text-sm text-green-700 bg-green-100 px-3 py-2 rounded flex-1 text-wrap">
            {window.location.origin}/signup?user_type=tenant
          </code>
          <button
            onClick={copySignupLink}
            className="text-green-600 hover:text-green-800 text-sm font-medium px-3 py-1 border border-green-300 rounded hover:bg-green-100 transition-colors"
          >
            Copy Link
          </button>
        </div>
        <p className="text-sm text-green-600 mt-2">
          Share this link with prospective tenants to allow them to sign up for the system
        </p>
      </div>

      {/* Dashboard Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Tenants */}
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium pb-3">Total Tenants</p>
              <p className="text-3xl pb-2 font-bold text-blue-900">{metrics.totalTenants}</p>
              <p className="text-blue-600 text-sm">{metrics.activeTenants} active • {metrics.pendingApplications} pending</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="bg-green-50 p-6 rounded-lg border border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium pb-3">Monthly Revenue</p>
              <p className="text-3xl pb-2 font-bold text-green-900">{formatCurrency(metrics.monthlyRevenue)}</p>
              <p className="text-green-600 text-sm">{metrics.occupancyRate.toFixed(1)}% occupancy</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>

        {/* Rent Due */}
        <NavLink 
          to="/admin/payments"
          onClick={onClose}
          className="block hover:scale-105 transition-transform"
        >
          <div className="bg-orange-50 p-6 rounded-lg border border-orange-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium pb-3">Rent Due</p>
                <p className="text-3xl pb-2 font-bold text-orange-900">{formatCurrency(metrics.rentDue)}</p>
                <p className="text-orange-600 text-sm">Outstanding payments</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </NavLink>

        {/* Open Reports */}
        <NavLink    
          to="/admin/reports"    
          onClick={onClose}
          className="block hover:scale-105 transition-transform"
        >
          <div className="bg-red-50 p-6 rounded-lg border border-red-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 text-sm font-medium pb-3">Open Reports</p>
                <p className="text-3xl pb-2 font-bold text-red-900">{metrics.openReports}</p>
                <p className="text-red-600 text-sm">
                  {notificationSummary.urgentReports > 0 
                    ? `${notificationSummary.urgentReports} urgent` 
                    : 'Require attention'
                  }
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </NavLink>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <NavLink 
          to="/admin/properties"
          onClick={onClose}
          className="block hover:scale-105 transition-transform"
        >
          <div className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Properties</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalProperties}</p>
              </div>
              <TrendingUp className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </NavLink>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Units</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalUnits}</p>
            </div>
            <Activity className="w-6 h-6 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Occupancy Rate</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.occupancyRate.toFixed(1)}%</p>
            </div>
            <Users className="w-6 h-6 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
            Revenue Overview
          </h3>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200">
            <div className="text-center text-gray-500">
              <DollarSign className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>Revenue chart integration</p>
              <p className="text-sm">Total: {formatCurrency(metrics.monthlyRevenue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-green-500" />
            Recent Activity
          </h3>
          <div className="space-y-3">
            {recentTransactions.map((transaction) => (
              <div 
                key={transaction.id} 
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  transaction.type === 'info' 
                    ? 'bg-gray-50 border-gray-200' 
                    : 'bg-green-50 border-green-200'
                }`}
              >
                <div>
                  <p className={`font-medium ${
                    transaction.type === 'info' ? 'text-gray-600' : 'text-gray-900'
                  }`}>
                    {transaction.name}
                  </p>
                  <p className="text-sm text-gray-600">{transaction.date}</p>
                </div>
                <span className={`font-medium ${
                  transaction.amount > 0 
                    ? 'text-green-600' 
                    : transaction.type === 'info'
                    ? 'text-gray-500'
                    : 'text-red-600'
                }`}>
                  {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                </span>
              </div>
            ))}
            
            {recentTransactions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p>No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <EmailFormModal 
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        tenants={tenants}
      />
  
    </div>
  );
};

export default AdminDashboard;