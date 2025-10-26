import React, { useContext, useState, useEffect } from 'react';
import { 
  Users, 
  AlertTriangle, 
  Plus, 
  Mail,
  DollarSign,
  AlertCircle,
  ExternalLink,
  Building,
  Home,
  CreditCard,
  FileText,
  AlertOctagon,
  Clock
} from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import { NavLink, useNavigate } from 'react-router-dom';
import EmailFormModal from './Modals/EmailFormModal';
import WhatsAppFormModal from './Modals/WhatsAppFormModal';
import { useSubscription } from '../../hooks/useSubscription';

const AdminDashboard = ({ onEmailClick }) => {
  const navigate = useNavigate();
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isWhatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  
  // Get subscription status
  const { subscription, isExpired, daysUntilExpiry, loading: subLoading } = useSubscription();
  
  // Get data from context
  const { 
    selectedPropertyId, 
    tenants,
    properties,
    propertyUnits,
    transactions,
    reports,
    tenantsLoading,
    tenantsError,
    propertiesLoading,
    unitsLoading,
    transactionsLoading,
    reportsLoading,
    getUnitsByProperty,
    getPropertyUnitStats,
    getEstimatedTenants
  } = useContext(AppContext);

  const [dashboardStats, setDashboardStats] = useState({
    totalTenants: 0,
    monthlyRevenue: 0,
    openReports: 0,
    totalUnits: 0,
    occupiedUnits: 0,
    availableUnits: 0,
    rentDue: 0,
    totalProperties: 0,
    totalTransactions: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [error, setError] = useState(null);
  const [usingFallbackData, setUsingFallbackData] = useState(false);

  useEffect(() => {
    calculateDashboardStats();
  }, [tenants, properties, propertyUnits, transactions, reports, selectedPropertyId]);

  const calculateDashboardStats = () => {
    try {
      setLoading(true);
      
      console.log('📊 Calculating stats with data:', {
        properties: properties.length,
        units: propertyUnits.length,
        tenants: tenants.length,
        transactions: transactions.length,
        reports: reports.length,
        selectedProperty: selectedPropertyId,
        tenantsError: tenantsError
      });

      // Check if we need to use fallback data for tenants
      const shouldUseFallback = tenants.length === 0 && tenantsError;
      setUsingFallbackData(shouldUseFallback);
      
      // Use actual tenants or fallback estimation
      const effectiveTenants = shouldUseFallback ? getEstimatedTenants() : tenants;

      // Calculate stats based on ALL data
      const totalProperties = properties.length;
      const totalUnits = propertyUnits.length;
      
      // Count occupied vs available units
      const occupiedUnits = propertyUnits.filter(unit => !unit.isAvailable).length;
      const availableUnits = propertyUnits.filter(unit => unit.isAvailable).length;

      // Calculate revenue from successful transactions
      const monthlyRevenue = transactions
        .filter(txn => txn.status === 'Success' || txn.status === 'completed')
        .reduce((sum, txn) => sum + (parseFloat(txn.amount) || 0), 0);

      // Calculate rent due (pending transactions)
      const rentDue = transactions
        .filter(txn => (txn.status === 'pending' || txn.status === 'Pending') && txn.type === 'rent')
        .reduce((sum, txn) => sum + (parseFloat(txn.amount) || 0), 0);

      // Count open reports
      const openReportsCount = reports.filter(report => 
        report.status === 'open' || report.status === 'Open'
      ).length;

      const stats = {
        totalTenants: effectiveTenants.length,
        monthlyRevenue: monthlyRevenue,
        openReports: openReportsCount,
        totalUnits: totalUnits,
        occupiedUnits: occupiedUnits,
        availableUnits: availableUnits,
        rentDue: rentDue,
        totalProperties: totalProperties,
        totalTransactions: transactions.length
      };

      console.log('📊 Final dashboard stats:', stats);
      setDashboardStats(stats);

      // Set recent transactions (last 5)
      const recent = transactions
        .filter(txn => txn.status === 'Success' || txn.status === 'completed')
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
      
      setRecentTransactions(recent);

    } catch (error) {
      console.error('Error calculating dashboard stats:', error);
      setError('Failed to calculate dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppClick = () => {
    alert("This Feature is not yet available. Coming soon !");
  };

  // Show loading states
  if (loading || tenantsLoading || propertiesLoading || unitsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3">Loading dashboard data...</span>
      </div>
    );
  }

  // Show errors if any
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-semibold">Failed to load data</h3>
        <p className="text-red-600 text-sm">{error}</p>
        <button 
          onClick={calculateDashboardStats}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Subscription Status Banner */}
      {!subLoading && (isExpired || (daysUntilExpiry !== null && daysUntilExpiry <= 7)) && (
        <div className={`rounded-lg p-4 ${isExpired ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'} border`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start">
              {isExpired ? (
                <AlertOctagon className="w-6 h-6 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
              ) : (
                <Clock className="w-6 h-6 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <h3 className={`font-semibold ${isExpired ? 'text-red-900' : 'text-yellow-900'}`}>
                  {isExpired ? 'Subscription Expired' : 'Subscription Expiring Soon'}
                </h3>
                <p className={`text-sm mt-1 ${isExpired ? 'text-red-800' : 'text-yellow-800'}`}>
                  {isExpired ? (
                    <>
                      Your subscription has expired. Some features are now restricted. 
                      Your tenants cannot make payments until you renew.
                    </>
                  ) : (
                    <>
                      Your subscription expires in <strong>{daysUntilExpiry} days</strong>. 
                      Renew now to avoid service interruption.
                    </>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/admin/subscription')}
              className={`px-4 py-2 rounded-lg font-semibold text-white ${
                isExpired ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-600 hover:bg-yellow-700'
              }`}
            >
              Renew Now
            </button>
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-center flex-col sm:flex-row gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Overview of your property management</p>
        </div>
        <div className="flex gap-3 flex-col sm:flex-row">
          <button
            onClick={() => setIsEmailModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Mail className="w-5 h-5 mr-2" />
            Send Email
          </button>
          <button
            onClick={handleWhatsAppClick}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center"
            title="This feature is coming soon"
          >
            <Mail className="w-5 h-5 mr-2" />
            WhatsApp (Coming Soon)
          </button>
        </div>
      </div>

      {/* API Status Banner */}
      {tenantsError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertOctagon className="w-5 h-5 text-yellow-600 mr-3" />
            <div>
              <p className="font-semibold text-yellow-800">API Notice</p>
              <p className="text-sm text-yellow-700">
                {tenantsError} Using estimated data from occupied units.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Data Status Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <Building className="w-5 h-5 text-blue-600 mr-3" />
          <div>
            <p className="font-semibold text-blue-800">Data Status</p>
            <p className="text-sm text-blue-600">
              Properties: {properties.length} | Units: {propertyUnits.length} | 
              Transactions: {transactions.length} | Reports: {reports.length} |
              Tenants: {usingFallbackData ? 'Estimated' : 'Actual'} ({dashboardStats.totalTenants})
            </p>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <NavLink to="/admin/tenants">
          <div className="bg-blue-50 p-6 rounded-lg hover:shadow-lg transition-shadow border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-blue-600 text-sm font-medium">Total Tenants</p>
                  {usingFallbackData && (
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                      Estimated
                    </span>
                  )}
                </div>
                <p className="text-3xl pb-2 font-bold text-blue-900">{dashboardStats.totalTenants}</p>
                <p className="text-blue-600 text-sm">
                  {usingFallbackData ? 'Based on occupied units' : 'Active tenants'}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </NavLink>

        <div className="bg-green-50 p-6 rounded-lg border border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium pb-3">Monthly Revenue</p>
              <p className="text-3xl pb-2 font-bold text-green-900">
                KSh {dashboardStats.monthlyRevenue.toLocaleString()}
              </p>
              <p className="text-green-600 text-sm">Total collected revenue</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <NavLink to="/admin/tenants">
          <div className="bg-orange-50 p-6 rounded-lg hover:shadow-lg transition-shadow border border-orange-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium pb-3">Rent Due</p>
                <p className="text-3xl pb-2 font-bold text-orange-900">
                  KSh {dashboardStats.rentDue.toLocaleString()}
                </p>
                <p className="text-orange-600 text-sm">Outstanding payments</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </NavLink>

        <NavLink to="/admin/reports">
          <div className="bg-red-50 p-6 rounded-lg hover:shadow-lg transition-shadow border border-red-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 text-sm font-medium pb-3">Open Reports</p>
                <p className="text-3xl pb-2 font-bold text-red-900">{dashboardStats.openReports}</p>
                <p className="text-red-600 text-sm">Require attention</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </NavLink>
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <NavLink to="/admin/organisation">
          <div className="bg-purple-50 p-6 rounded-lg hover:shadow-lg transition-shadow border border-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium pb-3">Total Properties</p>
                <p className="text-3xl pb-2 font-bold text-purple-900">{dashboardStats.totalProperties}</p>
                <p className="text-purple-600 text-sm">Managed properties</p>
              </div>
              <Building className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </NavLink>

        <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-600 text-sm font-medium pb-3">Occupied Units</p>
              <p className="text-3xl pb-2 font-bold text-indigo-900">{dashboardStats.occupiedUnits}</p>
              <p className="text-indigo-600 text-sm">Currently rented</p>
            </div>
            <Home className="w-8 h-8 text-indigo-600" />
          </div>
        </div>

        <div className="bg-cyan-50 p-6 rounded-lg border border-cyan-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-cyan-600 text-sm font-medium pb-3">Available Units</p>
              <p className="text-3xl pb-2 font-bold text-cyan-900">{dashboardStats.availableUnits}</p>
              <p className="text-cyan-600 text-sm">Ready for rent</p>
            </div>
            <Home className="w-8 h-8 text-cyan-600" />
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Building className="w-5 h-5 mr-2 text-gray-600" />
            Properties Overview
          </h3>
          <div className="space-y-3">
            {properties.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Building className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No properties found</p>
                <NavLink to="/admin/add-property" className="text-blue-600 hover:text-blue-800 text-sm">
                  Add your first property
                </NavLink>
              </div>
            ) : (
              properties.map(property => (
                <div key={property.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{property.name}</p>
                    <p className="text-sm text-gray-600">{property.city}, {property.state}</p>
                  </div>
                  <span className="text-sm text-gray-500">
                    {getUnitsByProperty ? getUnitsByProperty(property.id.toString()).length : 0} units
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <CreditCard className="w-5 h-5 mr-2 text-gray-600" />
            Recent Transactions
          </h3>
          <div className="space-y-3">
            {transactionsLoading ? (
              <div className="flex justify-center items-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-500">Loading transactions...</span>
              </div>
            ) : recentTransactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No recent transactions</p>
              </div>
            ) : (
              recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium truncate">{transaction.description || 'Payment'}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(transaction.date).toLocaleDateString()} • {transaction.reference}
                    </p>
                  </div>
                  <span className="font-medium text-green-600 whitespace-nowrap ml-2">
                    KSh {parseFloat(transaction.amount || 0).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      <EmailFormModal 
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        tenants={tenants}
      />
      <WhatsAppFormModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setWhatsAppModalOpen(false)}
        tenants={tenants}
      />
    </div>
  );
};

export default AdminDashboard;