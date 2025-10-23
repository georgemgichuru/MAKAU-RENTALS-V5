import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import { useAuth } from "../../context/AuthContext";
import { LogOut, Menu, Bell, X, AlertTriangle, Clock, User, Eye, DollarSign } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNotifications } from "../../context/NotificationContext";
import { useAppContext } from "../../context/AppContext";
import { NavLink } from "react-router-dom";

export default function AdminLayout() {
  const { logout, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // Use actual context data instead of mock data
  const { landlords, properties, reports } = useAppContext();
  const { 
    notifications, 
    markAsRead, 
    getNotificationSummary,
    loading: notificationsLoading 
  } = useNotifications();

  const notificationSummary = getNotificationSummary();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setNotificationDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile drawer when resizing up
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleNotificationClick = () => {
    setNotificationDropdownOpen(!notificationDropdownOpen);
    if (notificationDropdownOpen) {
      markAsRead('all');
    }
  };

  const getNotificationIcon = (type, priority) => {
    switch (type) {
      case 'report':
        return <AlertTriangle className={`w-4 h-4 ${priority === 'urgent' ? 'text-red-500' : 'text-yellow-500'}`} />;
      case 'payment':
        return <DollarSign className="w-4 h-4 text-green-500" />;
      case 'application':
        return <User className="w-4 h-4 text-blue-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Recently';
    
    const now = new Date();
    const diff = now - new Date(timestamp);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  // Generate real notifications from actual data
  const generateRealNotifications = () => {
    const realNotifications = [];

    // Add report notifications
    reports.slice(0, 5).forEach(report => {
      if (report.status === 'open') {
        realNotifications.push({
          id: `report-${report.id}`,
          type: 'report',
          title: `New ${report.priority} Report: ${report.title}`,
          message: report.description.length > 100 
            ? `${report.description.substring(0, 100)}...` 
            : report.description,
          timestamp: report.createdAt,
          isRead: false,
          priority: report.priority,
          tenant: report.tenant?.name || 'Unknown Tenant',
          room: report.unit?.unit_number || 'Unknown Unit',
          reportId: report.id
        });
      }
    });

    // Add payment notifications (you can integrate real payment data here)
    if (notificationSummary.pendingPayments > 0) {
      realNotifications.push({
        id: 'payment-summary',
        type: 'payment',
        title: 'Pending Payments',
        message: `${notificationSummary.pendingPayments} payments awaiting confirmation`,
        timestamp: new Date(),
        isRead: false,
        priority: 'medium'
      });
    }

    // Add application notifications
    if (notificationSummary.pendingApplications > 0) {
      realNotifications.push({
        id: 'application-summary',
        type: 'application',
        title: 'New Applications',
        message: `${notificationSummary.pendingApplications} tenant applications to review`,
        timestamp: new Date(),
        isRead: false,
        priority: 'low'
      });
    }

    return realNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  const realNotifications = generateRealNotifications();
  const displayNotifications = realNotifications.slice(0, 10); // Show only latest 10

  // Get current property name for display
  const getCurrentPropertyName = () => {
    if (properties.length > 0) {
      return properties[0].name;
    }
    if (landlords.length > 0 && landlords[0].properties.length > 0) {
      return landlords[0].properties[0].name;
    }
    return 'No Property';
  };

  const getUserDisplayName = () => {
    if (user) {
      return user.full_name || user.email || 'User';
    }
    return 'Admin';
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content (shifts right only on md+) */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="bg-white shadow-sm border-b px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center">
            {/* Hamburger - mobile only */}
            <button
              className="mr-3 p-2 text-gray-600 hover:text-gray-800 md:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            <h2 className="text-lg font-semibold">Admin Dashboard</h2>
          </div>

          <div className="flex items-center space-x-4">
            {/* Current Property */}
            <div className='italic text-sm text-gray-600 hidden sm:block'>
              {getCurrentPropertyName()}
            </div>
            
            {/* Notification Bell with Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={handleNotificationClick}
                className="relative p-2 text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg transition-colors"
                aria-label="Notifications"
                disabled={notificationsLoading}
              >
                <Bell className="w-6 h-6" />
                {notificationSummary.total > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                    {notificationSummary.total > 99 ? '99+' : notificationSummary.total}
                  </span>
                )}
                {notificationsLoading && (
                  <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    <Clock className="w-3 h-3 animate-spin" />
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {notificationDropdownOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden">
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                      <p className="text-sm text-gray-600">
                        {notificationSummary.total} unread notifications
                      </p>
                    </div>
                    <button
                      onClick={() => setNotificationDropdownOpen(false)}
                      className="text-gray-400 hover:text-gray-600 p-1 rounded"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Notifications List */}
                  <div className="max-h-80 overflow-y-auto">
                    {notificationsLoading ? (
                      <div className="px-4 py-8 text-center text-gray-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                        <p>Loading notifications...</p>
                      </div>
                    ) : displayNotifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-gray-500">
                        <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p>No notifications</p>
                        <p className="text-sm mt-1">You're all caught up!</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {displayNotifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`px-4 py-3 hover:bg-gray-50 transition-colors ${
                              !notification.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0 mt-1">
                                {getNotificationIcon(notification.type, notification.priority)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between">
                                  <p className={`text-sm font-medium text-gray-900 ${
                                    !notification.isRead ? 'font-semibold' : ''
                                  }`}>
                                    {notification.title}
                                  </p>
                                  <span className="text-xs text-gray-500 ml-2 flex-shrink-0 mt-0.5">
                                    {formatTimestamp(notification.timestamp)}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                  {notification.message}
                                </p>
                                {notification.tenant && (
                                  <div className="flex items-center mt-2 text-xs text-gray-500">
                                    <User className="w-3 h-3 mr-1" />
                                    <span>{notification.tenant}</span>
                                    {notification.room && (
                                      <>
                                        <span className="mx-2">•</span>
                                        <span>Unit {notification.room}</span>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Action buttons - FIXED ROUTES */}
                            <div className="mt-2 ml-7 flex space-x-3">
                              {notification.type === 'report' && notification.reportId && (
                                <NavLink
                                  to={`/landlord-dashboard/reports`}
                                  onClick={() => setNotificationDropdownOpen(false)}
                                  className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 font-medium"
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  View Reports
                                </NavLink>
                              )}
                              {notification.type === 'payment' && (
                                <NavLink
                                  to="/landlord-dashboard/payments"
                                  onClick={() => setNotificationDropdownOpen(false)}
                                  className="inline-flex items-center text-xs text-green-600 hover:text-green-800 font-medium"
                                >
                                  <DollarSign className="w-3 h-3 mr-1" />
                                  View Payments
                                </NavLink>
                              )}
                              {notification.type === 'application' && (
                                <NavLink
                                  to="/landlord-dashboard/tenants"
                                  onClick={() => setNotificationDropdownOpen(false)}
                                  className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 font-medium"
                                >
                                  <User className="w-3 h-3 mr-1" />
                                  View Tenants
                                </NavLink>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer - FIXED ROUTES */}
                  {displayNotifications.length > 0 && (
                    <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <button 
                          onClick={() => markAsRead('all')}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Mark all as read
                        </button>
                        <div className="flex space-x-4">
                          <NavLink
                            to="/landlord-dashboard/reports"
                            onClick={() => setNotificationDropdownOpen(false)}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            View Reports
                          </NavLink>
                          <NavLink
                            to="/landlord-dashboard"
                            onClick={() => setNotificationDropdownOpen(false)}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            See All
                          </NavLink>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User Info and Logout */}
            <div className="flex items-center space-x-3">
              <span className="text-gray-600 hidden md:inline text-sm">
                Welcome, {getUserDisplayName()}
              </span>
              <button
                onClick={logout}
                className="text-gray-600 hover:text-gray-800 flex items-center p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Logout"
              >
                <LogOut className="w-5 h-5 mr-1" />
                <span className="hidden md:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Routed page content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}