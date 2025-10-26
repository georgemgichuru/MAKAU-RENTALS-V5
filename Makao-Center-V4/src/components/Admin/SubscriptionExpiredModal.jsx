import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Lock, CreditCard, Clock } from 'lucide-react';

const SubscriptionExpiredModal = ({ 
  isOpen, 
  subscription, 
  daysUntilExpiry = null,
  isExpired = false 
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleRenewNow = () => {
    navigate('/admin/subscription');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className={`p-6 ${isExpired ? 'bg-red-600' : 'bg-yellow-500'}`}>
          <div className="flex items-center justify-center mb-4">
            {isExpired ? (
              <Lock className="w-16 h-16 text-white" />
            ) : (
              <AlertTriangle className="w-16 h-16 text-white" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-white text-center">
            {isExpired ? 'Subscription Expired' : 'Subscription Expiring Soon'}
          </h2>
        </div>

        {/* Content */}
        <div className="p-6">
          {isExpired ? (
            <>
              <p className="text-gray-700 text-center mb-4">
                Your subscription has expired. You need to renew to continue accessing the system.
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-red-900 mb-2">Limited Access</h3>
                <ul className="text-sm text-red-800 space-y-1">
                  <li>• Cannot view payments</li>
                  <li>• Cannot manage tenants</li>
                  <li>• Cannot add properties/units</li>
                  <li>• Your tenants cannot make payments</li>
                </ul>
              </div>
            </>
          ) : (
            <>
              <p className="text-gray-700 text-center mb-4">
                Your subscription will expire in <span className="font-bold text-yellow-600">{daysUntilExpiry} days</span>.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-center mb-2">
                  <Clock className="w-5 h-5 text-yellow-600 mr-2" />
                  <h3 className="font-semibold text-yellow-900">Renew Now to Avoid Interruption</h3>
                </div>
                <p className="text-sm text-yellow-800">
                  Renew your subscription now to ensure uninterrupted service for you and your tenants.
                </p>
              </div>
            </>
          )}

          {subscription && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">Current Plan</h3>
              <div className="text-sm text-gray-700">
                <p><span className="font-medium">Plan:</span> {subscription.plan}</p>
                <p><span className="font-medium">Expires:</span> {new Date(subscription.expiry_date).toLocaleDateString()}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleRenewNow}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold flex items-center justify-center"
            >
              <CreditCard className="w-5 h-5 mr-2" />
              Renew Subscription Now
            </button>
            
            {!isExpired && (
              <button
                onClick={() => {/* Close modal */}}
                className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 font-medium"
              >
                Remind Me Later
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionExpiredModal;
