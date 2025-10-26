import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import { useAuth } from "../../context/AuthContext";
import { LogOut, Menu, Bell, X, AlertTriangle, Clock, User, Eye } from "lucide-react";
import { useState, useEffect, useRef, useContext } from "react";
import { useNotifications } from "../../context/NotificationContext";
import { AppContext } from "../../context/AppContext";
import { NavLink } from "react-router-dom";

export default function AdminLayout() {
  const { logout, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const { notifications, markReportsAsViewed } = useNotifications();
  const { properties, selectedPropertyId } = useContext(AppContext);
  const dropdownRef = useRef(null);

// Get selected property name - with proper null checks
const selectedProperty = properties?.find(p => p.id?.toString() === selectedPropertyId);
const propertyName = selectedProperty?.name || (properties?.length > 0 ? properties[0]?.name : 'Loading...');

  // Use real notification data from NotificationContext
  // notifications.reports.count is the real count of open reports

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
    if (!notificationDropdownOpen) {
      markReportsAsViewed();
    }
  };

  const getNotificationIcon = (type, priority) => {
    switch (type) {
      case 'report':
        return <AlertTriangle className={`w-4 h-4 ${priority === 'high' ? 'text-red-500' : 'text-yellow-500'}`} />;
      case 'payment':
        return <Clock className="w-4 h-4 text-orange-500" />;
      case 'tenant':
        return <User className="w-4 h-4 text-blue-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const unreadCount = notifications?.reports?.count || 0;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {/* Top bar */}
        <div className="bg-white shadow-sm border-b px-4 py-3 flex items-center justify-between">
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
            <div className='italic text-gray-600'>{propertyName}</div>
            
            {/* Notification Bell with Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={handleNotificationClick}
                className="relative p-2 text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
                aria-label="Notifications"
              >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {notificationDropdownOpen && (
                <div className="absolute right-[-40px] sm:right-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                    <button
                      onClick={() => setNotificationDropdownOpen(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Notifications List */}
                  <div className="max-h-80 overflow-y-auto">
                    {unreadCount === 0 ? (
                      <div className="px-4 py-8 text-center text-gray-500">
                        <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p>No notifications</p>
                      </div>
                    ) : (
                      <div className="px-4 py-4 text-gray-700">
                        <p>You have {unreadCount} open report(s).</p>
                        <NavLink
                          to="/admin/reports"
                          onClick={() => setNotificationDropdownOpen(false)}
                          className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 mt-2"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View Reports
                        </NavLink>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  {unreadCount > 0 && (
                    <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <button className="text-sm text-blue-600 hover:text-blue-800 font-medium" onClick={markReportsAsViewed}>
                          Mark all as viewed
                        </button>
                        <NavLink
                          to="/admin/reports"
                          onClick={() => setNotificationDropdownOpen(false)}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View all reports →
                        </NavLink>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <span className="text-gray-600 hidden md:inline">
              Welcome, {user?.full_name || 'Admin'}
            </span>
            <button
              onClick={logout}
              className="text-gray-600 hover:text-gray-800 flex items-center"
              aria-label="Logout"
            >
              <LogOut className="w-5 h-5 mr-1" />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Routed page content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}