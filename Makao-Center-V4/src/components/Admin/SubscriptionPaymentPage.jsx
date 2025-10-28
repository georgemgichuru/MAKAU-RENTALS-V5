import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Loader2,
  ArrowLeft,
  Shield
} from 'lucide-react';
import { paymentsAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import PesaPalPaymentModal from '../PesaPalPaymentModal';

const SubscriptionPaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [subscriptionPaymentId, setSubscriptionPaymentId] = useState(null);
  const [pollingPaymentId, setPollingPaymentId] = useState(null);
  
  // PesaPal Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pesapalUrl, setPesapalUrl] = useState('');

  // Get plan details from navigation state
  const planDetails = location.state?.planDetails || null;

  useEffect(() => {
    // Redirect if no plan details
    if (!planDetails) {
      showToast('Please select a subscription plan first', 'error');
      navigate('/admin/subscription');
    }
  }, [planDetails, navigate, showToast]);

  // Check for payment status on component mount (after redirect return)
  useEffect(() => {
    const pendingPaymentId = localStorage.getItem('pending_payment_id');
    const paymentType = localStorage.getItem('payment_type');
    
    if (pendingPaymentId && paymentType === 'subscription') {
      setPollingPaymentId(parseInt(pendingPaymentId));
      localStorage.removeItem('pending_payment_id');
      localStorage.removeItem('payment_type');
    }
  }, []);

  // Poll for payment status
  useEffect(() => {
    let statusInterval;
    if (pollingPaymentId) {
      setPaymentStatus('pending');
      
      statusInterval = setInterval(async () => {
        try {
          const response = await paymentsAPI.getSubscriptionPaymentStatus(pollingPaymentId);
          
          console.log('Payment status check:', response.data);
          
          if (response.data.status === 'Success' || response.data.status === 'completed') {
            setPaymentStatus('success');
            clearInterval(statusInterval);
            showToast('Subscription payment successful!', 'success');
            
            // Redirect to dashboard after 3 seconds
            setTimeout(() => {
              navigate('/admin/dashboard');
            }, 3000);
          } else if (response.data.status === 'Failed' || response.data.status === 'failed') {
            setPaymentStatus('failed');
            clearInterval(statusInterval);
            showToast('Payment failed. Please try again.', 'error');
          }
        } catch (error) {
          console.error('Error checking payment status:', error);
        }
      }, 3000);
    }

    return () => {
      if (statusInterval) {
        clearInterval(statusInterval);
      }
    };
  }, [pollingPaymentId, navigate, showToast]);

  const handleInitiatePayment = async () => {
    setIsProcessing(true);
    setPaymentStatus(null);

    try {
      console.log('Initiating subscription payment:', {
        subscription_type: planDetails.backendPlan || planDetails.id,
        amount: planDetails.price
      });

      const response = await paymentsAPI.initiateSubscriptionPayment({
        subscription_type: planDetails.backendPlan || planDetails.id,
        amount: planDetails.price
      });

      console.log('Payment response:', response.data);

      if (response.data.success && response.data.redirect_url) {
        // Store payment ID for status checking
        localStorage.setItem('pending_payment_id', response.data.payment_id);
        localStorage.setItem('payment_type', 'subscription');
        
        setPaymentStatus('redirecting');
        
        // Show modal instead of redirecting
        setSubscriptionPaymentId(response.data.payment_id);
        setPesapalUrl(response.data.redirect_url);
        setShowPaymentModal(true);
        setIsProcessing(false);
      } else {
        throw new Error(response.data.error || 'Failed to initiate payment');
      }
    } catch (error) {
      console.error('Payment initiation error:', error);
      
      let errorMessage = 'Failed to initiate payment';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        errorMessage = errorData.error || errorData.details || errorData.message || JSON.stringify(errorData);
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showToast(errorMessage, 'error');
      setPaymentStatus('failed');
      setIsProcessing(false);
    }
  };

  // Handle payment modal close
  const handleCloseModal = () => {
    setShowPaymentModal(false);
    setPesapalUrl('');
    setPaymentStatus(null);
  };

  // Handle payment completion from modal
  const handlePaymentComplete = (paymentId) => {
    setShowPaymentModal(false);
    setPesapalUrl('');
    
    // Start polling for payment status
    setPollingPaymentId(paymentId);
    setPaymentStatus('pending');
    
    showToast('Payment completed! Verifying...', 'success');
  };

  const handleRetry = () => {
    setPaymentStatus(null);
    setSubscriptionPaymentId(null);
    setPollingPaymentId(null);
  };

  if (!planDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/admin/subscription')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Plans
        </button>

        {/* Payment Card */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-white">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Complete Your Subscription</h1>
            <p className="text-blue-100">Secure payment via PesaPal</p>
          </div>

          <div className="p-6 sm:p-8">
            {/* Plan Summary */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Selected Plan</h2>
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{planDetails.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{planDetails.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900">
                      KSh {planDetails.price.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">{planDetails.billingPeriod}</div>
                  </div>
                </div>
                
                {/* Plan Features */}
                {planDetails.features && (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Included Features:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {planDetails.features.slice(0, 4).map((feature, idx) => (
                        <li key={idx} className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Status Display */}
            {paymentStatus === 'pending' && (
              <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin mr-3" />
                  <h3 className="text-lg font-semibold text-blue-900">Processing Payment...</h3>
                </div>
                <p className="text-blue-800">
                  Verifying your payment. This may take a moment...
                </p>
              </div>
            )}

            {paymentStatus === 'redirecting' && (
              <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin mr-3" />
                  <h3 className="text-lg font-semibold text-blue-900">Redirecting...</h3>
                </div>
                <p className="text-blue-800">
                  Redirecting you to PesaPal payment gateway...
                </p>
              </div>
            )}

            {paymentStatus === 'success' && (
              <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
                  <h3 className="text-lg font-semibold text-green-900">Payment Successful!</h3>
                </div>
                <p className="text-green-800">
                  Your subscription has been activated. Redirecting to dashboard...
                </p>
              </div>
            )}

            {(paymentStatus === 'failed') && (
              <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <XCircle className="w-6 h-6 text-red-600 mr-3" />
                  <h3 className="text-lg font-semibold text-red-900">Payment Failed</h3>
                </div>
                <p className="text-red-800 mb-4">
                  The payment could not be processed. Please try again or contact support.
                </p>
                <button
                  onClick={handleRetry}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm font-medium"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Payment Form */}
            {!paymentStatus && (
              <>
                {/* Security Notice */}
                <div className="bg-blue-50 rounded-lg p-4 mb-6 flex items-start">
                  <Shield className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-700">
                    <p className="font-medium mb-1">Secure Payment</p>
                    <p className="text-gray-600">
                      You'll be redirected to PesaPal's secure payment gateway where you can pay using M-Pesa, cards, or other payment methods.
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={() => navigate('/admin/subscription')}
                    className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 font-medium"
                    disabled={isProcessing}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleInitiatePayment}
                    disabled={isProcessing}
                    className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5 mr-2" />
                        Pay KSh {planDetails.price.toLocaleString()}
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Need help? Contact support at <a href="mailto:makaorentalmanagementsystem@gmail.com" className="text-blue-600 hover:underline">makaorentalmanagementsystem@gmail.com</a></p>
        </div>
      </div>

      {/* PesaPal Payment Modal */}
      <PesaPalPaymentModal
        isOpen={showPaymentModal}
        redirectUrl={pesapalUrl}
        onClose={handleCloseModal}
        onPaymentComplete={handlePaymentComplete}
        paymentId={subscriptionPaymentId}
        amount={planDetails?.price}
      />
    </div>
  );
};

export default SubscriptionPaymentPage;
