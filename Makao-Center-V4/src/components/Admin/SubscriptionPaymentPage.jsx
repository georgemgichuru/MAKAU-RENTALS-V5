import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Loader2,
  ArrowLeft,
  Shield,
  Clock
} from 'lucide-react';
import { paymentsAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const SubscriptionPaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null); // 'pending', 'success', 'failed'
  const [checkoutRequestId, setCheckoutRequestId] = useState(null);
  const [subscriptionPaymentId, setSubscriptionPaymentId] = useState(null);
  const [countdown, setCountdown] = useState(180); // 3 minutes countdown

  // Get plan details from navigation state
  const planDetails = location.state?.planDetails || null;

  useEffect(() => {
    // Redirect if no plan details
    if (!planDetails) {
      showToast('Please select a subscription plan first', 'error');
      navigate('/admin/subscription');
    }
  }, [planDetails, navigate, showToast]);

  useEffect(() => {
    // Countdown timer when payment is pending
    let timer;
    if (paymentStatus === 'pending' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setPaymentStatus('timeout');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [paymentStatus, countdown]);

  useEffect(() => {
    // Poll for payment status when pending
    let statusInterval;
    if (paymentStatus === 'pending' && subscriptionPaymentId) {
      statusInterval = setInterval(async () => {
        try {
          const response = await paymentsAPI.getSubscriptionPaymentStatus(subscriptionPaymentId);
          
          console.log('Payment status check:', response.data);
          
          if (response.data.status === 'Success') {
            setPaymentStatus('success');
            clearInterval(statusInterval);
            showToast('Subscription payment successful!', 'success');
            
            // Redirect to dashboard after 3 seconds
            setTimeout(() => {
              navigate('/admin/dashboard');
            }, 3000);
          } else if (response.data.status === 'Failed') {
            setPaymentStatus('failed');
            clearInterval(statusInterval);
            showToast('Payment failed. Please try again.', 'error');
          }
        } catch (error) {
          console.error('Error checking payment status:', error);
          // Don't clear interval on error - keep polling
        }
      }, 3000); // Check every 3 seconds
    }

    return () => {
      if (statusInterval) {
        clearInterval(statusInterval);
      }
    };
  }, [paymentStatus, subscriptionPaymentId, navigate, showToast]);

  const handlePhoneChange = (e) => {
    // Allow only numbers and basic formatting
    const value = e.target.value.replace(/[^\d+]/g, '');
    setPhoneNumber(value);
  };

  const validatePhoneNumber = (phone) => {
    // Remove spaces and special characters
    const cleaned = phone.replace(/\s+/g, '').replace(/[^\d+]/g, '');
    
    // Check various valid formats
    if (cleaned.match(/^(\+?254|0)[17]\d{8}$/)) {
      return true;
    }
    return false;
  };

  const handleInitiatePayment = async () => {
    // Validate phone number
    if (!validatePhoneNumber(phoneNumber)) {
      showToast('Please enter a valid Kenyan phone number (e.g., 0712345678 or +254712345678)', 'error');
      return;
    }

    setIsProcessing(true);

    try {
      // Use backendPlan if available, otherwise use id
      const planToSend = planDetails.backendPlan || planDetails.id;
      
      console.log('Initiating subscription payment:', {
        plan: planToSend,
        phone_number: phoneNumber,
        amount: planDetails.price
      });

      const response = await paymentsAPI.stkPushSubscription({
        plan: planToSend,
        phone_number: phoneNumber
      });

      console.log('Payment response:', response.data);

      if (response.data.success) {
        setPaymentStatus('pending');
        setCheckoutRequestId(response.data.checkout_request_id);
        setSubscriptionPaymentId(response.data.subscription_payment_id);
        setCountdown(180); // Reset countdown
        
        showToast('Payment request sent! Please check your phone for M-Pesa prompt.', 'info');
      } else {
        throw new Error(response.data.error || 'Failed to initiate payment');
      }
    } catch (error) {
      console.error('Payment initiation error:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      
      // Extract detailed error message
      let errorMessage = 'Failed to initiate payment';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Check various error formats
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.details) {
          errorMessage = errorData.details;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else {
          // If error data is an object, stringify it
          errorMessage = JSON.stringify(errorData);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.log('Final error message:', errorMessage);
      showToast(errorMessage, 'error');
      setPaymentStatus('failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    setPaymentStatus(null);
    setCheckoutRequestId(null);
    setSubscriptionPaymentId(null);
    setCountdown(180);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
            <p className="text-blue-100">Secure M-Pesa payment processing</p>
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
                <p className="text-blue-800 mb-4">
                  Please enter your M-Pesa PIN on your phone to complete the payment.
                </p>
                <div className="flex items-center text-sm text-blue-700">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>Time remaining: {formatTime(countdown)}</span>
                </div>
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

            {(paymentStatus === 'failed' || paymentStatus === 'timeout') && (
              <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <XCircle className="w-6 h-6 text-red-600 mr-3" />
                  <h3 className="text-lg font-semibold text-red-900">
                    {paymentStatus === 'timeout' ? 'Payment Timeout' : 'Payment Failed'}
                  </h3>
                </div>
                <p className="text-red-800 mb-4">
                  {paymentStatus === 'timeout' 
                    ? 'The payment request has timed out. Please try again.'
                    : 'The payment could not be processed. Please try again or contact support.'}
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
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h2>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      M-Pesa Phone Number
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={handlePhoneChange}
                        placeholder="e.g., 0712345678 or +254712345678"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={isProcessing}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <CreditCard className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Enter the phone number registered with M-Pesa
                    </p>
                  </div>
                </div>

                {/* Security Notice */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6 flex items-start">
                  <Shield className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-700">
                    <p className="font-medium mb-1">Secure Payment</p>
                    <p className="text-gray-600">
                      Your payment is processed securely through Safaricom M-Pesa. 
                      You'll receive an STK push prompt on your phone.
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
                    disabled={isProcessing || !phoneNumber}
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
    </div>
  );
};

export default SubscriptionPaymentPage;
