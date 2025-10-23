import React, {useContext, useState} from 'react'
import {AppContext} from '../../context/AppContext';
import Toast from '/src/components/Toast.jsx';
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
  Tablet
} from 'lucide-react';

const AdminReports = () => {
  const {propertyUnits, mockReports, mockTenants} = useContext(AppContext);

  const [toast, setToast] = useState(null);
  const [reports, setReports] = useState(mockReports);

  const markAsResolved = (reportId) => {
    setReports(reports.map(report => 
      report.id === reportId ? { ...report, status: 'closed' } : report
    ));
    setToast({
      message: 'Report marked as resolved',
      type: 'success'
    });
  };

  const markAsUnresolved = (reportId) => {
    setReports(reports.map(report => 
      report.id === reportId ? { ...report, status: 'open' } : report
    ));
    setToast({
      message: 'Report marked as unresolved',
      type: 'success'
    });
  };

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
              <p className="text-2xl font-bold text-red-600">
                {reports.filter(r => r.status === 'open').length}
              </p>
              <p className="text-red-600 text-sm">Open Reports</p>
            </div>
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-green-600">
                {reports.filter(r => r.status === 'closed').length}
              </p>
              <p className="text-green-600 text-sm">Resolved</p>
            </div>
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
        </div>
      </div>

      <div className="flex space-x-4 mb-4">
        <select className="px-3 py-2 border rounded-lg">
          <option>All Status</option>
          <option>Open</option>
          <option>Closed</option>
        </select>
        <select className="px-3 py-2 border rounded-lg">
          <option>All Categories</option>
          <option>Electrical</option>
          <option>Plumbing</option>
          <option>Noise</option>
          <option>Safety/Violence</option>
          <option>WiFi</option>
          <option>Maintenance</option>
        </select>
      </div>

      <div className="space-y-4">
        {reports.map(report => (
          <div key={report.id} className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-lg font-semibold">{report.title}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    report.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {report.priority}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    report.status === 'open' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {report.status === 'open' ? 'Open' : 'Closed'}
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div>
                    <p className="text-sm text-gray-600">Tenant: {report.tenant}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Room: {report.room}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Reported: {report.date}</p>
                  </div>
                </div>
                
                <p className="text-gray-700">{report.description}</p>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                {report.status === 'open' ? (
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
        ))}
      </div>
    </div>
  );
};

export default AdminReports;