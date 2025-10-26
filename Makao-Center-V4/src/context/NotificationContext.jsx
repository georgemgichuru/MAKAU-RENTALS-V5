import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { communicationAPI } from '../services/api';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  
  const [notifications, setNotifications] = useState({
    reports: {
      count: 0,
      hasNew: false,
      lastChecked: null
    }
  });
  
  // Check for new reports using API
  const checkForNewReports = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.log('No auth token, skipping reports check');
        return;
      }
      
      const response = await communicationAPI.getOpenReports();
      const openReports = response.data;
      const newReportsCount = openReports.length;

      setNotifications(prev => {
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
      // Don't throw error, just log it
    }
  }, []);

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