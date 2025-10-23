import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Filter,
  Search,
  Eye,
  MessageCircle,
  Calendar,
  User,
  Home,
  Clock,
  ArrowUp,
  ArrowDown,
  RefreshCw
} from 'lucide-react';

const AdminReports = () => {
  const { 
    reports, 
    reportsLoading,
    tenants,
    units,
    updateReportStatus,
    refreshData
  } = useAppContext();
  
  const { showToast } = useToast();

  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Filter and sort reports
  const filteredReports = reports
    .filter(report => {
      const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
      const matchesCategory = filterCategory === 'all' || report.issue_category === filterCategory;
      const matchesPriority = filterPriority === 'all' || report.priority_level === filterPriority;
      const matchesSearch = searchTerm === '' || 
        report.issue_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.tenant?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.unit?.unit_number.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesStatus && matchesCategory && matchesPriority && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'oldest':
          return new Date(a.created_at) - new Date(b.created_at);
        case 'priority':
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
          return priorityOrder[a.priority_level] - priorityOrder[b.priority_level];
        default:
          return 0;
      }
    });

  // Handle status update
  const handleStatusUpdate = async (reportId, newStatus) => {
    try {
      await updateReportStatus(reportId, newStatus);
      showToast(
        `Report ${newStatus === 'resolved' ? 'resolved' : 'reopened'} successfully`,
        'success'
      );
    } catch (error) {
      showToast('Failed to update report status', 'error');
    }
  };

  // Get status counts
  const statusCounts = {
    open: reports.filter(r => r.status === 'open').length,
    in_progress: reports.filter(r => r.status === 'in_progress').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
    closed: reports.filter(r => r.status === 'closed').length,
    urgent: reports.filter(r => r.priority_level === 'urgent' && r.status === 'open').length
  };

  // Get unique categories and priorities
  const categories = [...new Set(reports.map(r => r.issue_category))];
  const priorities = [...new Set(reports.map(r => r.priority_level))];

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get time ago
  const getTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  };

  // Get status color and icon
  const getStatusInfo = (status) => {
    switch (status) {
      case 'open':
        return { color: 'text-red-600', bgColor: 'bg-red-100', borderColor: 'border-red-200', icon: AlertTriangle };
      case 'in_progress':
        return { color: 'text-yellow-600', bgColor: 'bg-yellow-100', borderColor: 'border-yellow-200', icon: Clock };
      case 'resolved':
        return { color: 'text-green-600', bgColor: 'bg-green-100', borderColor: 'border-green-200', icon: CheckCircle };
      case 'closed':
        return { color: 'text-gray-600', bgColor: 'bg-gray-100', borderColor: 'border-gray-200', icon: CheckCircle };
      default:
        return { color: 'text-gray-600', bgColor: 'bg-gray-100', borderColor: 'border-gray-200', icon: AlertTriangle };
    }
  };

  // Get priority color and icon
  const getPriorityInfo = (priority) => {
    switch (priority) {
      case 'urgent':
        return { color: 'text-red-600', bgColor: 'bg-red-100', icon: ArrowUp, label: 'Urgent' };
      case 'high':
        return { color: 'text-orange-600', bgColor: 'bg-orange-100', icon: ArrowUp, label: 'High' };
      case 'medium':
        return { color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: ArrowDown, label: 'Medium' };
      case 'low':
        return { color: 'text-blue-600', bgColor: 'bg-blue-100', icon: ArrowDown, label: 'Low' };
      default:
        return { color: 'text-gray-600', bgColor: 'bg-gray-100', icon: AlertTriangle, label: 'Unknown' };
    }
  };

  if (reportsLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-200 p-4 rounded-lg animate-pulse">
              <div className="h-6 bg-gray-300 rounded mb-2"></div>
              <div className="h-4 bg-gray-300 rounded"></div>
            </div>
          ))}
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Issues</h1>
          <p className="text-gray-600 mt-1">Manage tenant reports and maintenance requests</p>
        </div>
        <button
          onClick={refreshData}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-red-600">{statusCounts.open}</p>
              <p className="text-red-600 text-sm font-medium">Open Reports</p>
            </div>
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-yellow-600">{statusCounts.in_progress}</p>
              <p className="text-yellow-600 text-sm font-medium">In Progress</p>
            </div>
            <Clock className="w-6 h-6 text-yellow-600" />
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-green-600">{statusCounts.resolved}</p>
              <p className="text-green-600 text-sm font-medium">Resolved</p>
            </div>
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-600">{statusCounts.closed}</p>
              <p className="text-gray-600 text-sm font-medium">Closed</p>
            </div>
            <CheckCircle className="w-6 h-6 text-gray-600" />
          </div>
        </div>

        <div className="bg-red-100 border border-red-300 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-red-700">{statusCounts.urgent}</p>
              <p className="text-red-700 text-sm font-medium">Urgent</p>
            </div>
            <AlertTriangle className="w-6 h-6 text-red-700" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search reports by title, description, tenant, or unit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Priorities</option>
              {priorities.map(priority => (
                <option key={priority} value={priority}>
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="priority">Priority</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow border border-gray-200 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reports Found</h3>
            <p className="text-gray-600">
              {searchTerm || filterStatus !== 'all' || filterCategory !== 'all' || filterPriority !== 'all'
                ? 'Try adjusting your filters or search terms'
                : 'No reports have been submitted yet'
              }
            </p>
          </div>
        ) : (
          filteredReports.map(report => {
            const statusInfo = getStatusInfo(report.status);
            const priorityInfo = getPriorityInfo(report.priority_level);
            const StatusIcon = statusInfo.icon;
            const PriorityIcon = priorityInfo.icon;

            return (
              <div key={report.id} className="bg-white p-6 rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">{report.issue_title}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${priorityInfo.bgColor} ${priorityInfo.color}`}>
                        <PriorityIcon className="w-3 h-3" />
                        {priorityInfo.label}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${statusInfo.bgColor} ${statusInfo.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {report.status.replace('_', ' ')}
                      </span>
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full capitalize">
                        {report.issue_category}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-gray-700 mb-4 leading-relaxed">{report.description}</p>

                    {/* Metadata */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2 text-gray-400" />
                        <span>{report.tenant?.name || 'Unknown Tenant'}</span>
                      </div>
                      <div className="flex items-center">
                        <Home className="w-4 h-4 mr-2 text-gray-400" />
                        <span>Unit {report.unit?.unit_number || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        <span>{formatDate(report.created_at)}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-gray-400" />
                        <span>{getTimeAgo(report.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
                    {report.status === 'open' && (
                      <button 
                        onClick={() => handleStatusUpdate(report.id, 'in_progress')}
                        className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center justify-center gap-2 transition-colors"
                      >
                        <Clock className="w-4 h-4" />
                        Start Progress
                      </button>
                    )}
                    
                    {report.status === 'in_progress' && (
                      <button 
                        onClick={() => handleStatusUpdate(report.id, 'resolved')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Mark Resolved
                      </button>
                    )}

                    {report.status === 'resolved' && (
                      <button 
                        onClick={() => handleStatusUpdate(report.id, 'closed')}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center justify-center gap-2 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Close Report
                      </button>
                    )}

                    {(report.status === 'resolved' || report.status === 'closed') && (
                      <button 
                        onClick={() => handleStatusUpdate(report.id, 'open')}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        Reopen
                      </button>
                    )}

                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors">
                      <MessageCircle className="w-4 h-4" />
                      Contact Tenant
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminReports;