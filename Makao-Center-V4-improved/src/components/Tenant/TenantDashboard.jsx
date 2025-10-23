import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home, 
  CreditCard, 
  AlertTriangle, 
  DollarSign,
  AlertCircle,
  User,
  Phone,
  CheckCircle
} from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

const TenantDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { mockTenants } = useContext(AppContext);

  // resolve tenant from context (fallback to placeholder)
  const tenant = mockTenants?.find(t => String(t.id) === String(user?.id) || String(t.email) === String(user?.email)) || {
    id: user?.id || '1',
    name: user?.name || 'John Doe',
    room: user?.room || 'A101',
    bookingId: user?.bookingId || 'BK001',
    rentAmount: 25000,
    rentDue: 25000,
    prepaidMonths: 0
  };

  const paid = Math.max(0, (tenant.rentAmount || 0) - (tenant.rentDue || 0));
  const percent = tenant.rentAmount ? Math.min(100, Math.round((paid / tenant.rentAmount) * 100)) : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {tenant.name}</h1>
          <p className="text-gray-600">Room {tenant.room} • Booking ID: {tenant.bookingId}</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/tenant/payments')}
            className="bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900 flex items-center"
          >
            <CreditCard className="w-5 h-5 mr-2" />
            Pay Rent
          </button>
          <button 
            onClick={() => navigate('/tenant/report')}
            className="bg-white border border-gray-200 text-slate-800 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center"
          >
            <AlertTriangle className="w-5 h-5 mr-2 text-amber-600" />
            Report Issue
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Room Details</p>
              <p className="text-2xl font-bold text-slate-900">{tenant.room}</p>
              <p className="text-sm text-slate-500">Booking: {tenant.bookingId}</p>
            </div>
            <Home className="w-8 h-8 text-slate-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border cursor-pointer" onClick={() => navigate('/tenant/payments')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Monthly Rent</p>
              <p className="text-2xl font-bold text-slate-900">KSh {Number(tenant.rentAmount || 0).toLocaleString()}</p>
              <p className="text-sm text-slate-500">Outstanding: KSh {Number(tenant.rentDue || 0).toLocaleString()}</p>
            </div>
            <DollarSign className="w-8 h-8 text-slate-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Prepaid Months</p>
              <p className="text-2xl font-bold text-slate-900">{tenant.prepaidMonths || 0}</p>

            </div>
            <CheckCircle className="w-8 h-8 text-slate-600" />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">Payment Status</h2>
        <p className="text-gray-600 mb-4">Your current rent payment status</p>
        
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium">Rent Paid</span>
            <span className="font-medium">KSh {Number(paid).toLocaleString()} / KSh {Number(tenant.rentAmount || 0).toLocaleString()}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div className="bg-slate-800 h-3 rounded-full" style={{width: `${percent}%`}}></div>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-gray-600">KSh {Number(tenant.rentDue || 0).toLocaleString()} remaining</span>
            <span className={`px-2 py-1 ${tenant.rentStatus === 'due' ? 'bg-amber-100 text-amber-800' : tenant.rentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-slate-700'} text-xs rounded-full`}>
              {tenant.rentStatus || 'unknown'}
            </span>
          </div>
        </div>
    
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
          <p className="text-gray-600 mb-4">Your registered details</p>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <Phone className="w-5 h-5 mr-3 text-gray-400" />
              <div>
                <p className="font-medium">Phone</p>
                <p className="text-gray-600">{tenant.phone || '-'}</p>
              </div>
            </div>
            <div className="flex items-center">
              <User className="w-5 h-5 mr-3 text-gray-400" />
              <div>
                <p className="font-medium">Email</p>
                <p className="text-gray-600">{tenant.email || '-'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">My Reports</h3>
          <p className="text-gray-600 mb-4">Your recent maintenance requests</p>
          
          <div className="space-y-3">
            <div className="p-3 bg-red-50 rounded-lg">
              <div className="flex items-center justify-between">
                <p className="font-medium">Power Outlet Not Working</p>
                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">open</span>
              </div>
              <p className="text-sm text-gray-600">electrical</p>
            </div>
          </div>
          
          <button 
            onClick={() => navigate('/tenant/report')}
            className="w-full mt-4 text-slate-800 border border-gray-200 py-2 rounded-lg hover:bg-gray-50 font-medium"
          >
            Submit New Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default TenantDashboard;