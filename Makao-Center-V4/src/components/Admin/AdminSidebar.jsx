import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  Home, 
  BarChart3, 
  Building, 
  CreditCard, 
  Users,
  AlertTriangle, 
  Settings, 
  HelpCircle, 
  X,
  DollarSign,
  FileText
} from "lucide-react";
import { useNotifications } from "../../context/NotificationContext";
import { useAuth } from "../../context/AuthContext";
import { apiService } from "../../services/api";

const AdminSidebar = ({ isOpen = false, onClose = () => {} }) => {
  const { notifications, getNotificationSummary, markAsRead } = useNotifications();
  const { user: authUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user data from /me/ endpoint
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        console.log('Fetching user data from /me/ endpoint...');
        
        const token = localStorage.getItem('accessToken');
        
        if (!token) {
          console.warn('No access token found');
          setUserData(authUser);
          setLoading(false);
          return;
        }
        
        const response = await fetch('http://127.0.0.1:8000/api/accounts/me/', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('User data received:', data);
        setUserData(data);
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        // Fallback to auth context user
        setUserData(authUser);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [authUser]);

  const user = userData || authUser;
  
  const notificationSummary = getNotificationSummary();

 const sidebarItems = [
  { 
    path: "/landlord-dashboard", 
    label: "Dashboard", 
    icon: Home,
    description: "Overview and analytics"
  },
  { 
    path: "/landlord-dashboard/organisation", 
    label: "Properties", 
    icon: Building,
    description: "Manage properties and units"
  },
  { 
    path: "/landlord-dashboard/payments", 
    label: "Payments", 
    icon: CreditCard,
    description: "Rent payments and financials",
    hasNotification: notificationSummary.pendingPayments > 0,
    notificationCount: notificationSummary.pendingPayments
  },
  { 
    path: "/landlord-dashboard/tenants", 
    label: "Tenants", 
    icon: Users,
    description: "Tenant management",
    hasNotification: notificationSummary.pendingApplications > 0,
    notificationCount: notificationSummary.pendingApplications
  },
  { 
    path: "/landlord-dashboard/reports", 
    label: "Reports & Issues", 
    icon: AlertTriangle,
    description: "Maintenance and issues",
    hasNotification: notificationSummary.hasNew,
    notificationCount: notificationSummary.total
  },
  { 
    path: "/landlord-dashboard/settings", 
    label: "Settings", 
    icon: Settings,
    description: "Account and preferences"
  },
  { 
    path: "/landlord-dashboard/help", 
    label: "Help", 
    icon: HelpCircle,
    description: "Support and documentation"
  }
];

  const handleItemClick = (item) => {
    // Mark relevant notifications as read when navigating
    if (item.path === "/landlord-dashboard/reports" && notificationSummary.hasNew) {
      markAsRead('reports');
    } else if (item.path === "/landlord-dashboard/payments" && notificationSummary.pendingPayments > 0) {
      markAsRead('payments');
    } else if (item.path === "/landlord-dashboard/tenants" && notificationSummary.pendingApplications > 0) {
      markAsRead('applications');
    }
    
    onClose();
  };

  const getNotificationBadge = (item) => {
    if (!item.hasNotification || item.notificationCount === 0) return null;

    // Different colors for different notification types
    let badgeColor = "bg-red-500";
    let pulseAnimation = "animate-pulse";
    
    if (item.path === "/landlord-dashboard/payments") {
      badgeColor = "bg-green-500";
    } else if (item.path === "/landlord-dashboard/tenants") {
      badgeColor = "bg-blue-500";
    }

    return (
      <span className={`${badgeColor} text-white text-xs rounded-full h-5 w-5 flex items-center justify-center ml-2 ${pulseAnimation}`}>
        {item.notificationCount > 99 ? '99+' : item.notificationCount}
      </span>
    );
  };

  const getIconColor = (item, isActive) => {
    if (isActive) return "text-white";
    if (item.hasNotification) {
      if (item.path === "/landlord-dashboard/reports") return "text-red-400";
      if (item.path === "/landlord-dashboard/payments") return "text-green-400";
      if (item.path === "/landlord-dashboard/tenants") return "text-blue-400";
    }
    return "text-gray-400";
  };

  return (
    <>
      {/* Backdrop (mobile only) */}
      <div
        className={`${isOpen ? "fixed inset-0 z-40 md:hidden bg-black bg-opacity-50" : "hidden"}`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 transform transition-transform duration-200 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:static md:inset-auto md:h-screen flex flex-col
        `}
        aria-hidden={!isOpen && true}
      >
        {/* Header */}
        <div className="p-6 flex items-center justify-between border-b border-gray-700">
          <div>
            <h1 className="text-xl font-bold text-white">Makao Rentals</h1>
            <p className="text-sm text-gray-400 mt-1">Landlord Portal</p>
          </div>

          {/* Close button - mobile only */}
          <button
            className="md:hidden text-gray-400 hover:text-white transition-colors"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <span className="text-white font-semibold text-sm">
                  {user?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'L'}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              {loading ? (
                <>
                  <div className="h-4 bg-gray-700 rounded w-24 mb-1 animate-pulse"></div>
                  <div className="h-3 bg-gray-700 rounded w-32 animate-pulse"></div>
                </>
              ) : (
                <>
                  <p className="text-white font-medium text-sm truncate">
                    {user?.full_name || 'Landlord'}
                  </p>
                  <p className="text-gray-400 text-xs truncate">
                    {user?.email || 'landlord@example.com'}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="space-y-1 px-3">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/landlord-dashboard"}
                  className={({ isActive }) =>
                    `group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 relative ${
                      isActive 
                        ? "bg-blue-600 text-white shadow-lg" 
                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                    }`
                  }
                  onClick={() => handleItemClick(item)}
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={`w-5 h-5 mr-3 flex-shrink-0 ${getIconColor(item, isActive)}`} />
                      <div className="flex-1 min-w-0">
                        <span className="block truncate">{item.label}</span>
                        <span className="block text-xs text-gray-400 group-hover:text-gray-300 truncate">
                          {item.description}
                        </span>
                      </div>
                      {getNotificationBadge(item)}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700">
          <div className="text-center">
            <p className="text-xs text-gray-400">
              Makao Rentals v1.0
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Secure Landlord Portal
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;