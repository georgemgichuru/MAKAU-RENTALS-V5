import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AppContext } from './AppContext';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  // Move useContext to the top level of the component
  const { mockReports } = useContext(AppContext);
  
  const [notifications, setNotifications] = useState({
    reports: {
      count: 0,
      hasNew: false,
      lastChecked: null
    }
  });
  
  // Check for new reports - now mockReports is available in the closure
  const checkForNewReports = useCallback(() => {
    try {
      const openReports = mockReports.filter(report => report.status === 'open');
      const newReportsCount = openReports.length;
      
      setNotifications(prev => {
        // Only update if the count actually changed
        if (prev.reports.count === newReportsCount) {
          return prev;
        }
        
        return {
          ...prev,
          reports: {
            count: newReportsCount,
            hasNew: newReportsCount > prev.reports.count,
            lastChecked: new Date()
          }
        };
      });
    } catch (error) {
      console.error('Error checking for new reports:', error);
    }
  }, []); // Remove mockReports dependency - access it directly from context

  // Mark reports as viewed
  const markReportsAsViewed = useCallback(() => {
    setNotifications(prev => ({
      ...prev,
      reports: {
        ...prev.reports,
        hasNew: false,
        lastChecked: new Date()
      }
    }));
  }, []);

  // Check for new reports periodically
  useEffect(() => {
    checkForNewReports();
    const interval = setInterval(checkForNewReports, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [checkForNewReports]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      checkForNewReports,
      markReportsAsViewed
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;