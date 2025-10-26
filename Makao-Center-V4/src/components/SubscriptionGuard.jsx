import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '../hooks/useSubscription';
import SubscriptionExpiredModal from './Admin/SubscriptionExpiredModal';
import { Lock, AlertTriangle } from 'lucide-react';

const SubscriptionGuard = ({ 
  children, 
  requireActive = true,
  showWarning = true,
  warningDays = 7 
}) => {
  const navigate = useNavigate();
  const { 
    subscription, 
    isActive, 
    isExpired, 
    daysUntilExpiry, 
    loading 
  } = useSubscription();
  
  const [showModal, setShowModal] = useState(false);
  const [hasSeenWarning, setHasSeenWarning] = useState(false);

  useEffect(() => {
    if (!loading) {
      // Always show modal if expired
      if (isExpired && requireActive) {
        setShowModal(true);
      } 
      // Show warning if expiring soon and user hasn't seen it
      else if (
        showWarning && 
        !isExpired && 
        daysUntilExpiry !== null && 
        daysUntilExpiry <= warningDays &&
        !hasSeenWarning
      ) {
        setShowModal(true);
      }
    }
  }, [loading, isExpired, daysUntilExpiry, requireActive, showWarning, warningDays, hasSeenWarning]);

  const handleCloseWarning = () => {
    setShowModal(false);
    setHasSeenWarning(true);
    // Reset after 24 hours
    setTimeout(() => setHasSeenWarning(false), 24 * 60 * 60 * 1000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If subscription is expired and required, show blocked screen
  if (isExpired && requireActive) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-red-100 rounded-full p-4">
                <Lock className="w-12 h-12 text-red-600" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Subscription Required
            </h1>
            
            <p className="text-gray-600 mb-6">
              Your subscription has expired. Please renew to continue accessing this feature.
            </p>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800">
                <span className="font-semibold">Expired on:</span>{' '}
                {subscription?.expiry_date 
                  ? new Date(subscription.expiry_date).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
            
            <button
              onClick={() => navigate('/admin/subscription')}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
            >
              Renew Subscription
            </button>
            
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="w-full mt-3 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 font-medium"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
        
        <SubscriptionExpiredModal
          isOpen={showModal}
          subscription={subscription}
          isExpired={true}
        />
      </>
    );
  }

  // Show content with warning modal if expiring soon
  return (
    <>
      {children}
      
      {showModal && !isExpired && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-6 bg-yellow-500">
              <div className="flex items-center justify-center mb-4">
                <AlertTriangle className="w-16 h-16 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white text-center">
                Subscription Expiring Soon
              </h2>
            </div>

            <div className="p-6">
              <p className="text-gray-700 text-center mb-4">
                Your subscription will expire in{' '}
                <span className="font-bold text-yellow-600">{daysUntilExpiry} days</span>.
              </p>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800">
                  Renew now to ensure uninterrupted service for you and your tenants.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => navigate('/admin/subscription')}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
                >
                  Renew Now
                </button>
                
                <button
                  onClick={handleCloseWarning}
                  className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 font-medium"
                >
                  Remind Me Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SubscriptionGuard;
