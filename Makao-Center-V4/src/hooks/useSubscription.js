import { useState, useEffect } from 'react';
import { subscriptionAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [isActive, setIsActive] = useState(true);
  const [isExpired, setIsExpired] = useState(false);
  const [daysUntilExpiry, setDaysUntilExpiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Only check subscription for landlords, not tenants
    if (user?.user_type !== 'landlord') {
      setLoading(false);
      setIsActive(true); // Tenants don't need subscription check
      return;
    }

    checkSubscription();
    // Check subscription every 5 minutes
    const interval = setInterval(checkSubscription, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user?.user_type]);

  const checkSubscription = async () => {
    try {
      setLoading(true);
      const response = await subscriptionAPI.getStatus();
      const subData = response.data;
      
      setSubscription(subData);
      
      // Calculate days until expiry
      if (subData.expiry_date) {
        const expiryDate = new Date(subData.expiry_date);
        const today = new Date();
        const diffTime = expiryDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        setDaysUntilExpiry(diffDays);
        setIsExpired(diffDays <= 0);
        setIsActive(subData.is_active && diffDays > 0);
      } else {
        setIsActive(false);
        setIsExpired(true);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error checking subscription:', err);
      setError(err);
      // If we can't check, assume active to avoid blocking user
      setIsActive(true);
      setIsExpired(false);
    } finally {
      setLoading(false);
    }
  };

  return {
    subscription,
    isActive,
    isExpired,
    daysUntilExpiry,
    loading,
    error,
    recheckSubscription: checkSubscription
  };
};
