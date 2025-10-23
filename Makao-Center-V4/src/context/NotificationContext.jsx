import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAppContext } from './AppContext';
import { apiService } from '../services/api';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAppContext();
  
  const [notifications, setNotifications] = useState({
    reports: {
      count: 0,
      hasNew: false,
      lastChecked: null,
      urgentCount: 0,
      openCount: 0
    },
    payments: {
      pendingCount: 0,
      hasNew: false,
      lastChecked: null
    },
    applications: {
      pendingCount: 0,
      hasNew: false,
      lastChecked: null
    },
    unreadCount: 0
  });

  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Check for new reports from API
  const checkForNewReports = useCallback(async () => {
    if (!user || user.user_type !== 'landlord') return;

    try {
      setLoading(true);
      
      // Fetch all report counts using apiService
      const openReports = await apiService.getOpenReports().catch(() => []);
      const urgentCount = openReports.filter(report => 
        report.priority_level === 'urgent' && report.status === 'open'
      ).length;

      const openCount = openReports.length;

      setNotifications(prev => {
        const wasOpenCount = prev.reports.openCount;
        const wasUrgentCount = prev.reports.urgentCount;
        
        const hasNewOpen = openCount > wasOpenCount;
        const hasNewUrgent = urgentCount > wasUrgentCount;
        const hasNew = hasNewOpen || hasNewUrgent;

        const totalUnreadCount = openCount + notifications.payments.pendingCount + notifications.applications.pendingCount;

        return {
          ...prev,
          reports: {
            count: openCount,
            urgentCount,
            hasNew,
            lastChecked: new Date()
          },
          unreadCount: totalUnreadCount
        };
      });

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error checking for new reports:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Check for pending payments using apiService
  const checkForPendingPayments = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch pending payments using apiService
      const rentPayments = await apiService.getRentPayments().catch(() => []);
      const pendingCount = rentPayments.filter(payment => 
        payment.status === 'pending' || payment.status === 'overdue'
      ).length;

      setNotifications(prev => {
        const wasPendingCount = prev.payments.pendingCount;
        const hasNew = pendingCount > wasPendingCount;

        const totalUnreadCount = prev.reports.count + pendingCount + prev.applications.pendingCount;

        return {
          ...prev,
          payments: {
            pendingCount,
            hasNew,
            lastChecked: new Date()
          },
          unreadCount: totalUnreadCount
        };
      });
    } catch (error) {
      console.error('Error checking for pending payments:', error);
    }
  }, [user]);

  // Check for pending applications using apiService
  const checkForPendingApplications = useCallback(async () => {
    if (!user || user.user_type !== 'landlord') return;

    try {
      // Fetch tenants without assigned units as pending applications
      const tenants = await apiService.getTenants().catch(() => []);
      const pendingCount = tenants.filter(tenant => !tenant.unit).length;

      setNotifications(prev => {
        const wasPendingCount = prev.applications.pendingCount;
        const hasNew = pendingCount > wasPendingCount;

        const totalUnreadCount = prev.reports.count + prev.payments.pendingCount + pendingCount;

        return {
          ...prev,
          applications: {
            pendingCount,
            hasNew,
            lastChecked: new Date()
          },
          unreadCount: totalUnreadCount
        };
      });
    } catch (error) {
      console.error('Error checking for pending applications:', error);
    }
  }, [user]);

  // Check all notifications
  const checkAllNotifications = useCallback(async () => {
    if (!user) return;

    await Promise.all([
      checkForNewReports(),
      checkForPendingPayments(),
      checkForPendingApplications()
    ]);
  }, [user, checkForNewReports, checkForPendingPayments, checkForPendingApplications]);

  // Mark specific notification type as read
  const markAsRead = useCallback((type) => {
    setNotifications(prev => {
      let updatedNotifications = { ...prev };
      
      switch (type) {
        case 'reports':
          updatedNotifications.reports = {
            ...prev.reports,
            hasNew: false,
            lastChecked: new Date()
          };
          break;
        case 'payments':
          updatedNotifications.payments = {
            ...prev.payments,
            hasNew: false,
            lastChecked: new Date()
          };
          break;
        case 'applications':
          updatedNotifications.applications = {
            ...prev.applications,
            hasNew: false,
            lastChecked: new Date()
          };
          break;
        case 'all':
          updatedNotifications.reports = {
            ...prev.reports,
            hasNew: false,
            lastChecked: new Date()
          };
          updatedNotifications.payments = {
            ...prev.payments,
            hasNew: false,
            lastChecked: new Date()
          };
          updatedNotifications.applications = {
            ...prev.applications,
            hasNew: false,
            lastChecked: new Date()
          };
          updatedNotifications.unreadCount = 0;
          break;
        default:
          break;
      }

      // Recalculate total unread count
      const totalUnread = 
        (updatedNotifications.reports.hasNew ? updatedNotifications.reports.count : 0) +
        (updatedNotifications.payments.hasNew ? updatedNotifications.payments.pendingCount : 0) +
        (updatedNotifications.applications.hasNew ? updatedNotifications.applications.pendingCount : 0);

      updatedNotifications.unreadCount = totalUnread;

      return updatedNotifications;
    });
  }, []);

  // Add a new notification manually (useful for real-time updates)
  const addNotification = useCallback((type, data) => {
    setNotifications(prev => {
      const updated = { ...prev };
      
      switch (type) {
        case 'report':
          updated.reports = {
            count: prev.reports.count + 1,
            urgentCount: data.priority_level === 'urgent' ? prev.reports.urgentCount + 1 : prev.reports.urgentCount,
            hasNew: true,
            lastChecked: prev.reports.lastChecked
          };
          break;
        case 'payment':
          updated.payments = {
            pendingCount: prev.payments.pendingCount + 1,
            hasNew: true,
            lastChecked: prev.payments.lastChecked
          };
          break;
        case 'application':
          updated.applications = {
            pendingCount: prev.applications.pendingCount + 1,
            hasNew: true,
            lastChecked: prev.applications.lastChecked
          };
          break;
        default:
          break;
      }

      // Update total unread count
      updated.unreadCount = 
        updated.reports.count + 
        updated.payments.pendingCount + 
        updated.applications.pendingCount;

      return updated;
    });
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications({
      reports: {
        count: 0,
        urgentCount: 0,
        hasNew: false,
        lastChecked: new Date()
      },
      payments: {
        pendingCount: 0,
        hasNew: false,
        lastChecked: new Date()
      },
      applications: {
        pendingCount: 0,
        hasNew: false,
        lastChecked: new Date()
      },
      unreadCount: 0
    });
  }, []);

  // Get notification summary for badges
  const getNotificationSummary = useCallback(() => {
    return {
      total: notifications.unreadCount,
      reports: notifications.reports.count,
      urgentReports: notifications.reports.urgentCount,
      pendingPayments: notifications.payments.pendingCount,
      pendingApplications: notifications.applications.pendingCount,
      hasNew: notifications.reports.hasNew || notifications.payments.hasNew || notifications.applications.hasNew
    };
  }, [notifications]);

  // Poll for new notifications periodically
  useEffect(() => {
    if (user) {
      // Check immediately
      checkAllNotifications();

      // Set up interval for polling (every 2 minutes)
      const interval = setInterval(checkAllNotifications, 2 * 60 * 1000);
      
      return () => clearInterval(interval);
    }
  }, [user, checkAllNotifications]);

  // Listen for real-time events (WebSocket or similar)
  useEffect(() => {
    if (!user) return;

    // Example: Listen for new report events
    // You can integrate with WebSockets, Server-Sent Events, or polling
    const handleNewReport = (event) => {
      addNotification('report', event.detail);
    };

    // Example event listeners - replace with your real-time solution
    window.addEventListener('new-report', handleNewReport);

    return () => {
      window.removeEventListener('new-report', handleNewReport);
    };
  }, [user, addNotification]);

  const value = {
    notifications,
    loading,
    lastUpdate,
    checkAllNotifications,
    checkForNewReports,
    checkForPendingPayments,
    checkForPendingApplications,
    markAsRead,
    addNotification,
    clearAllNotifications,
    getNotificationSummary
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;