
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, CreditCard, AlertTriangle, DollarSign, User, Phone, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { paymentsAPI, communicationAPI } from '../../services/api';

const TenantDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rentSummary, setRentSummary] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        console.log('🔵 TenantDashboard: Fetching rent summary...');
        console.log('🔵 User ID:', user?.id);
        console.log('🔵 User Type:', user?.user_type);
        
        // Get rent summary for current user (tenant-specific)
        const rentRes = await paymentsAPI.getRentSummary();
        console.log('✅ Rent Summary Response:', rentRes.data);
        setRentSummary(rentRes.data);

        // Get reports for current tenant
        console.log('🔵 TenantDashboard: Fetching reports...');
        const reportsRes = await communicationAPI.getReports();
        console.log('✅ Reports Response:', reportsRes.data);
        
        // Filter reports for this tenant - check both tenant.id and tenant_id
        const myReports = (reportsRes.data || []).filter(r => {
          const reportTenantId = r.tenant?.id || r.tenant_id || r.tenant;
          console.log(`📋 Report ID: ${r.id}, Tenant ID: ${reportTenantId}, User ID: ${user?.id}, Match: ${reportTenantId === user?.id}`);
          return reportTenantId === user?.id;
        });
        
        // Map backend field names to frontend field names
        const transformedReports = myReports.map(r => ({
          id: r.id,
          title: r.issue_title || r.title || 'Untitled Report',
          category: r.issue_category || r.category || 'general',
          status: r.status || 'open',
          priority: r.priority_level || r.priority || 'medium',
          date: r.reported_date || r.date || new Date().toISOString(),
          description: r.description || '',
          // Keep original data for reference
          ...r
        }));
        
        console.log('✅ Transformed Reports:', transformedReports);
        setReports(transformedReports);
      } catch (err) {
        console.error('❌ Error fetching dashboard data:', err);
        console.error('❌ Error status:', err.response?.status);
        console.error('❌ Error data:', err.response?.data);
        // Don't block UI if API fails - use fallback from user context
        setRentSummary(null);
        setReports([]);
      } finally {
        setLoading(false);
      }
    }
    if (user?.id) fetchData();
  }, [user?.id]);

  // Fallbacks if no backend data
  const tenant = {
    id: user?.id,
    name: user?.full_name,
    room: user?.current_unit?.unit_number || 'Not Assigned',
    bookingId: user?.current_unit?.id || user?.id,
    rentAmount: rentSummary?.monthly_rent || user?.current_unit?.rent || 0,
    rentDue: rentSummary?.rent_due || user?.current_unit?.rent_remaining || 0,
    prepaidMonths: rentSummary?.prepaid_months || 0,
    email: user?.email,
    phone: user?.phone_number,
    rentStatus: rentSummary?.rent_status || user?.current_unit?.rent_status || 'unknown',
  };

  const paid = Math.max(0, (tenant.rentAmount || 0) - (tenant.rentDue || 0));
  const percent = tenant.rentAmount ? Math.min(100, Math.round((paid / tenant.rentAmount) * 100)) : 0;

  // Compute days until due date if available from user context
  const rentDueDateStr = user?.current_unit?.rent_due_date;
  let daysToDue = null;
  if (rentDueDateStr) {
    try {
      // Parse as UTC to avoid timezone drift
      const [y, m, d] = rentDueDateStr.split('-').map(Number);
      const dueDate = new Date(Date.UTC(y, (m || 1) - 1, d || 1));
      const today = new Date();
      const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
      const diffMs = dueDate.getTime() - todayUTC.getTime();
      daysToDue = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    } catch (e) {
      daysToDue = null;
    }
  }

  const showDangerBanner =
    typeof daysToDue === 'number' && daysToDue >= 0 && daysToDue <= 5 && (tenant.rentDue || 0) > 0;

  return (
    <div className="space-y-6">
      {showDangerBanner && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 flex items-start gap-3 w-full">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">
              Please pay rent to prevent any inconviniences or contact us for support
            </p>
            {typeof daysToDue === 'number' && (
              <p className="text-xs text-red-700 mt-1">Due in {daysToDue} day{daysToDue === 1 ? '' : 's'}.</p>
            )}
          </div>
          <button
            onClick={() => navigate('/tenant/payments')}
            className="ml-auto inline-flex items-center bg-red-600 hover:bg-red-700 text-white text-xs font-medium px-3 py-1.5 rounded-md"
          >
            Pay now
          </button>
        </div>
      )}
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
            {loading ? (
              <div className="text-center text-sm text-gray-400">Loading reports...</div>
            ) : reports.length === 0 ? (
              <div className="text-center text-sm text-gray-400">No reports found.</div>
            ) : (
              reports.map(report => (
                <div key={report.id} className="p-3 rounded-lg" style={{background: report.status === 'open' ? '#fee2e2' : '#f3f4f6'}}>
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{report.title}</p>
                    <span className={`px-2 py-1 ${report.status === 'open' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-slate-700'} text-xs rounded-full`}>
                      {report.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{report.category}</p>
                </div>
              ))
            )}
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