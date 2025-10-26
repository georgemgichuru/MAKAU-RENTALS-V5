import React, { useContext, useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle 
} from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import { communicationAPI } from '../../services/api';
import Toast from '/src/components/Toast.jsx';

const AdminReports = () => {
  const { selectedPropertyId } = useContext(AppContext);
  const [toast, setToast] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all'
  });

  // Helpers: normalize values for robust filtering
  const normalize = (v) => (v ?? '').toString().trim().toLowerCase();
  const keyify = (v) => normalize(v).replace(/[^a-z0-9]/g, '');

  useEffect(() => {
    fetchReports();
  }, [filters, selectedPropertyId]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      let response;
      const statusKey = normalize(filters.status);

      if (statusKey === 'open') {
        response = await communicationAPI.getOpenReports();
      } else if (statusKey === 'closed' || statusKey === 'resolved') {
        response = await communicationAPI.getResolvedReports();
      } else {
        response = await communicationAPI.getReports();
      }

      // Support both array and paginated responses
      let filteredReports = Array.isArray(response?.data)
        ? response.data
        : (response?.data?.results ?? []);

      if (selectedPropertyId) {
        const pid = selectedPropertyId.toString();
        filteredReports = filteredReports.filter(report => {
          const rid = (report?.property_id ?? report?.unit?.property_obj?.id ?? report?.unit?.property_obj);
          return rid?.toString() === pid;
        });
      }
      
      if (filters.category && filters.category !== 'all') {
        filteredReports = filteredReports.filter(report => 
          keyify(report.issue_category) === keyify(filters.category)
        );
      }
      
      setReports(filteredReports);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setToast({
        message: 'Failed to load reports',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsResolved = async (reportId) => {
    try {
      await communicationAPI.updateReportStatus(reportId, { status: 'resolved' });
      setReports(reports.map(report =>
        report.id === reportId ? { ...report, status: 'resolved' } : report
      ));
      setToast({
        message: 'Report marked as resolved',
        type: 'success'
      });
    } catch (error) {
      console.error('Error updating report status:', error);
      setToast({
        message: 'Failed to update report status',
        type: 'error'
      });
    }
  };

  const markAsUnresolved = async (reportId) => {
    try {
      await communicationAPI.updateReportStatus(reportId, { status: 'open' });
      setReports(reports.map(report =>
        report.id === reportId ? { ...report, status: 'open' } : report
      ));
      setToast({
        message: 'Report marked as unresolved',
        type: 'success'
      });
    } catch (error) {
      console.error('Error updating report status:', error);
      setToast({
        message: 'Failed to update report status',
        type: 'error'
      });
    }
  };

  const openReportsCount = reports.filter(r => ['open', 'pending'].includes(normalize(r.status))).length;
  const resolvedReportsCount = reports.filter(r => ['resolved', 'closed'].includes(normalize(r.status))).length;

  return (
    <div className="space-y-6">
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      <h1 className="text-3xl font-bold text-red-600">Reports & Issues</h1>
      <p className="text-gray-600">Manage tenant reports and maintenance requests</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-red-600">{openReportsCount}</p>
              <p className="text-red-600 text-sm">Open Reports</p>
            </div>
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-green-600">{resolvedReportsCount}</p>
              <p className="text-green-600 text-sm">Resolved</p>
            </div>
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
        </div>
      </div>

      <div className="flex space-x-4 mb-4">
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
        </select>
        <select
          value={filters.category}
          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="all">All Categories</option>
          <option value="electrical">Electrical</option>
          <option value="plumbing">Plumbing</option>
          <option value="noise">Noise</option>
          <option value="safetyviolence">Safety/Violence</option>
          <option value="wifi">WiFi</option>
          <option value="maintenance">Maintenance</option>
        </select>
      </div>

      {loading ? (
        <div className="bg-white p-6 rounded-lg shadow text-gray-600">Loading reports…</div>
      ) : (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="bg-white p-6 rounded-lg shadow text-gray-600">
              No reports found for the selected filters.
            </div>
          ) : (
            reports.map(report => {
              const statusK = normalize(report.status);
              const isOpen = statusK === 'open' || statusK === 'pending';
              const statusClass = isOpen
                ? 'bg-red-100 text-red-800'
                : (statusK === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800');
              const statusText = statusK === 'open' ? 'Open' : (statusK === 'pending' ? 'Pending' : (statusK === 'resolved' ? 'Resolved' : 'Closed'));
              const priorityK = normalize(report.priority_level);
              const priorityClass = priorityK === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800';

              return (
                <div key={report.id} className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold">{report.issue_title || report.title}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${priorityClass}`}>
                          {report.priority_level || 'normal'}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${statusClass}`}>
                          {statusText}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div>
                          <p className="text-sm text-gray-600">Tenant: {report.tenant_name || report.tenant?.full_name || report.reporter_name || '—'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Room: {report.unit_number || report.unit?.unit_number || report.unit?.number || '—'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Reported: {(() => {
                            const d = report.reported_date || report.created_at || report.timestamp;
                            try { return d ? new Date(d).toLocaleDateString() : '—'; } catch { return '—'; }
                          })()}</p>
                        </div>
                      </div>
                      
                      <p className="text-gray-700">{report.description || report.details || 'No description provided.'}</p>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {isOpen ? (
                        <button 
                          onClick={() => markAsResolved(report.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Mark as Resolved
                        </button>
                      ) : (
                        <button 
                          onClick={() => markAsUnresolved(report.id)}
                          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Mark as Unresolved
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default AdminReports;