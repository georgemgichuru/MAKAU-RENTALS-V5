import React, { useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  Filter, 
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Search
} from 'lucide-react';
import { AppContext } from '../../context/AppContext';

const TenantTransactions = () => {
  const { tenantId } = useParams();
  const navigate = useNavigate();
  const { mockTenants, tenants, tenantsLoading, transactions } = useContext(AppContext);

  // Find the specific tenant - check both mockTenants and tenants from API
  const allTenants = mockTenants || tenants || [];
  const tenant = allTenants.find(t => String(t.id) === String(tenantId));
  
  console.log('🔍 TenantTransactions - tenantId:', tenantId);
  console.log('🔍 TenantTransactions - allTenants:', allTenants.length);
  console.log('🔍 TenantTransactions - found tenant:', tenant);

  // Use transactions from context and filter for this tenant
  const [allTxns] = useState(() => (transactions || []).filter(tx => String(tx.tenantId) === String(tenantId)));
  const [transactionsState] = useState(allTxns); // used by filters below
  // If you prefer live updates, remove the above useState and use `const transactionsState = transactions.filter(...)`

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  console.log('💳 TenantTransactions - filtered transactions:', transactionsState.length);

  // Show loading state while tenants are being fetched
  if (tenantsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Loading tenant data...</p>
      </div>
    );
  }

  // If tenant not found, redirect back
  if (!tenant) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Tenant Not Found</h2>
        <button
          onClick={() => navigate('/admin/tenants')}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Back to Tenants
        </button>
      </div>
    );
  }

  // Filter transactions
  const filteredTransactions = transactionsState.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (transaction.reference || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || transaction.status === filterStatus;
    const matchesType = filterType === 'all' || transaction.type === filterType;
    
    let matchesDate = true;
    if (startDate && endDate) {
      const txnDate = new Date(transaction.date);
      matchesDate = txnDate >= new Date(startDate) && txnDate <= new Date(endDate);
    }
    
    return matchesSearch && matchesStatus && matchesType && matchesDate;
  });

  // Calculate totals
  const totalPaid = filteredTransactions
    .filter(t => t.status === 'completed' || t.status === 'Success')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  
  const totalTransactions = filteredTransactions.length;
  
  // Get tenant details safely
  const tenantName = tenant.full_name || tenant.name || 'Unknown Tenant';
  const unit = tenant.current_unit || tenant.unit_data || tenant.unit;
  const roomNumber = unit?.unit_number || unit?.number || tenant.room || 'N/A';
  const rentAmount = unit?.rent || unit?.rent_amount || tenant.rentAmount || 0;
  const rentStatus = tenant.rent_status || tenant.rentStatus || 'due';
  const tenantEmail = tenant.email || 'no-email@example.com';
  const tenantPhone = tenant.phone_number || tenant.phone || 'N/A';
  const tenantBookingId = tenant.bookingId || tenant.id;

  // Download CSV function
  const handleDownloadCSV = () => {
    console.log('📥 Downloading CSV for transactions:', filteredTransactions.length);
    
    if (filteredTransactions.length === 0) {
      alert('No transactions to download');
      return;
    }
    
    const headers = ['Date', 'Description', 'Amount (KSh)', 'Type', 'Status', 'Reference', 'Payment Method'];
    const csvContent = [
      headers.join(','),
      ...filteredTransactions.map(t => {
        const date = t.date || t.created_at || new Date().toISOString().split('T')[0];
        const description = (t.description || 'Payment').replace(/"/g, '""'); // Escape quotes
        const amount = t.amount || 0;
        const type = t.type || 'Payment';
        const status = t.status || 'Completed';
        const reference = (t.reference || t.transaction_id || 'N/A').replace(/"/g, '""');
        const method = (t.paymentMethod || t.payment_method || 'M-Pesa').replace(/"/g, '""');
        
        return `${date},"${description}",${amount},${type},${status},"${reference}","${method}"`;
      })
    ].join('\n');
    
    console.log('📄 CSV Content preview:', csvContent.substring(0, 200));

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tenantName.replace(/\s+/g, '_')}_transactions_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    console.log('✅ CSV downloaded successfully');
  };

  // Clear filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterType('all');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/admin/tenants')}
            className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            Back to Tenants
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Transaction History</h1>
            <p className="text-gray-600">
              Viewing transactions for {tenantName} - Room {roomNumber}
            </p>
          </div>
        </div>
        <button
          onClick={handleDownloadCSV}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
        >
          <Download className="w-5 h-5 mr-2" />
          Download Statement
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Total Transactions</p>
              <p className="text-2xl font-bold text-blue-900">{totalTransactions}</p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Total Paid</p>
              <p className="text-2xl font-bold text-green-900">KSh {totalPaid.toLocaleString()}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Current Rent</p>
              <p className="text-2xl font-bold text-purple-900">KSh {Number(rentAmount).toLocaleString()}</p>
            </div>
            <DollarSign className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-600 text-sm font-medium">Rent Status</p>
              <p className="text-lg font-bold text-yellow-900 capitalize">{rentStatus}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      {/* <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Filter className="w-5 h-5 mr-2 text-gray-600" />
            Filter Transactions
          </h3>
          <button
            onClick={handleClearFilters}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Clear All Filters
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          {/* <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div> */}

          {/* Status Filter */}
          {/* <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select> */}

          {/* Type Filter */}
          {/* <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="Payment">Payment</option>
            <option value="Deposit">Deposit</option>
            <option value="Refund">Refund</option>
          </select> */}

          {/* Date Range */}
          {/* <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="flex-1 px-2 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Start"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="flex-1 px-2 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="End"
            /> */}
          {/* </div> */}
        {/* </div> */}
      {/* </div> */} 

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            All Transactions ({filteredTransactions.length})
          </h3>
          
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Transactions Found</h3>
              <p className="text-gray-500">Try adjusting your filters to see more results</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Date</th>
                    <th className="text-left py-3 px-4">Description</th>
                    <th className="text-left py-3 px-4">Type</th>
                    <th className="text-left py-3 px-4">Amount</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Reference</th>
                    <th className="text-left py-3 px-4">Method</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map(transaction => (
                    <tr key={transaction.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <p className="text-sm text-gray-900">
                          {new Date(transaction.date).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900">{transaction.description}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                            transaction.type === 'Payment' ? 'bg-blue-100 text-blue-800' :
                            transaction.type === 'Deposit' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                          {transaction.type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-gray-900">
                          KSh {transaction.amount.toLocaleString()}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs rounded-full flex items-center w-fit ${
                            transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                            transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                          {transaction.status === 'completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {transaction.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                          {transaction.status === 'failed' && <XCircle className="w-3 h-3 mr-1" />}
                          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-gray-600 font-mono">{transaction.reference}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-gray-900">{transaction.paymentMethod}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Tenant Information Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Tenant Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Name</p>
            <p className="font-medium text-gray-900">{tenantName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Email</p>
            <p className="font-medium text-gray-900">{tenantEmail}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Phone</p>
            <p className="font-medium text-gray-900">{tenantPhone}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Room Number</p>
            <p className="font-medium text-gray-900">{roomNumber}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Booking ID</p>
            <p className="font-medium text-gray-900">{tenantBookingId}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Monthly Rent</p>
            <p className="font-medium text-gray-900">KSh {Number(rentAmount).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantTransactions;