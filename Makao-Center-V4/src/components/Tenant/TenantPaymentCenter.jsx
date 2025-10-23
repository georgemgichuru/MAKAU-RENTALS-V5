import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTenantToast } from "../../context/TenantToastContext";
import { useAuth } from "../../context/AuthContext";
import { 
  FaMobileAlt, 
  FaCreditCard, 
  FaCheckCircle, 
  FaClock, 
  FaTimes,
  FaInfoCircle,
  FaSpinner,
  FaReceipt,
  FaExclamationTriangle
} from "react-icons/fa";
import { CheckCircle, XCircle, CreditCard } from 'lucide-react';

// API service functions (you'll need to implement these based on your backend)
const paymentAPI = {
  initiateRentPayment: async (unitId, paymentData) => {
    const response = await fetch(`/api/payments/stk-push/${unitId}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      body: JSON.stringify(paymentData)
    });
    
    if (!response.ok) {
      throw new Error('Payment initiation failed');
    }
    
    return response.json();
  },
  
  getRentPayments: async () => {
    const response = await fetch('/api/payments/rent-payments/', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch payments');
    }
    
    return response.json();
  },
  
  checkPaymentStatus: async (paymentId) => {
    const response = await fetch(`/api/payments/rent-payments/${paymentId}/`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to check payment status');
    }
    
    return response.json();
  }
};

const authAPI = {
  getCurrentUser: async () => {
    const response = await fetch('/api/auth/me/', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user data');
    }
    
    return response.json();
  }
};

const TenantPaymentCenter = () => {
  const navigate = useNavigate();
  const { showToast } = useTenantToast();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    amount: "",
    phoneNumber: ""
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [currentTenant, setCurrentTenant] = useState(null);
  const [tenantPayments, setTenantPayments] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);

  // Load tenant data on component mount
  useEffect(() => {
    const loadTenantData = async () => {
      if (user?.id) {
        try {
          setLoading(true);
          
          // Get tenant info from API
          const tenantData = await authAPI.getCurrentUser();
          const userUnit = tenantData.unit || {};
          
          setCurrentTenant({
            id: tenantData.id,
            name: tenantData.full_name || `${tenantData.first_name} ${tenantData.last_name}`,
            email: tenantData.email,
            room: userUnit.unit_number || 'N/A',
            phone: tenantData.phone_number,
            status: tenantData.is_active ? 'active' : 'inactive',
            rentAmount: parseFloat(userUnit.rent) || 0,
            rentDue: parseFloat(userUnit.rent_remaining) || 0,
            unitId: userUnit.id
          });

          // Get payment history from API
          const paymentsData = await paymentAPI.getRentPayments();
          // Filter payments for current tenant (backend should handle this, but double-check)
          const filteredPayments = paymentsData
            .filter(payment => payment.tenant === user.id)
            .map(payment => ({
              id: payment.id,
              amount: parseFloat(payment.amount),
              status: payment.status.toLowerCase(),
              mpesa_receipt: payment.mpesa_receipt,
              phone: payment.tenant_phone,
              date: payment.transaction_date,
              payment_type: payment.payment_type
            }))
            .sort((a, b) => new Date(b.date) - new Date(a.date));
            
          setTenantPayments(filteredPayments);

          // Pre-fill phone number if available
          if (tenantData.phone_number) {
            setFormData(prev => ({ ...prev, phoneNumber: tenantData.phone_number }));
          }
        } catch (error) {
          console.error('Error loading tenant data:', error);
          showToast('Failed to load tenant data', 'error');
        } finally {
          setLoading(false);
        }
      }
    };

    loadTenantData();
  }, [user, showToast]);

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Please enter a valid amount";
    } else if (parseFloat(formData.amount) > (currentTenant?.rentDue || 0)) {
      newErrors.amount = "Amount cannot exceed outstanding balance";
    }
    
    if (!formData.phoneNumber) {
      newErrors.phoneNumber = "Phone number is required";
    } else if (!/^\+254[0-9]{9}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "Please enter a valid Kenyan phone number (+254XXXXXXXXX)";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear specific error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  // Format phone number as user types
  const formatPhoneNumber = (value) => {
    // Remove all non-numeric characters except +
    let cleaned = value.replace(/[^\d+]/g, '');
    
    // Ensure it starts with +254
    if (cleaned.startsWith('0')) {
      cleaned = '+254' + cleaned.substring(1);
    } else if (cleaned.startsWith('254')) {
      cleaned = '+' + cleaned;
    } else if (!cleaned.startsWith('+254') && cleaned.length > 0) {
      if (cleaned.startsWith('+')) {
        // If starts with + but not +254, keep as is for now
      } else {
        cleaned = '+254' + cleaned;
      }
    }
    
    return cleaned;
  };

  // Initiate M-Pesa STK Push API call
  const initiateMpesaPayment = async (amount, phoneNumber) => {
    try {
      const response = await paymentAPI.initiateRentPayment(currentTenant.unitId, {
        amount: parseFloat(amount),
        phone_number: phoneNumber
      });

      return {
        success: true,
        message: "Payment request sent successfully. Check your phone for M-Pesa prompt.",
        transactionId: response.checkout_request_id,
        paymentId: response.payment_id
      };
    } catch (error) {
      console.error('M-Pesa payment error:', error);
      return {
        success: false,
        message: error.response?.data?.error || "Payment request failed. Please try again.",
        transactionId: null,
        paymentId: null
      };
    }
  };

  // Handle payment submission
  const handlePayment = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showToast('Please fix the form errors before submitting.', 'error');
      return;
    }

    setIsProcessing(true);
    setPaymentStatus(null);
    setErrors({});

    try {
      const formattedPhone = formatPhoneNumber(formData.phoneNumber);
      const response = await initiateMpesaPayment(formData.amount, formattedPhone);

      if (response.success) {
        setPaymentStatus({
          type: 'success',
          message: response.message,
          transactionId: response.transactionId,
          paymentId: response.paymentId
        });

        showToast('Payment request sent! Check your phone for M-Pesa prompt.', 'success');

        // Add pending payment to local state
        const newPayment = {
          id: response.paymentId || `temp-${Date.now()}`,
          amount: parseFloat(formData.amount),
          status: 'pending',
          mpesa_receipt: null,
          phone: formattedPhone,
          date: new Date().toISOString(),
          payment_type: 'rent'
        };

        setTenantPayments(prev => [newPayment, ...prev]);
        
        // Clear form but keep phone number
        setFormData(prev => ({ ...prev, amount: "" }));
        
        // Poll for payment status update
        if (response.paymentId) {
          checkPaymentStatusPeriodically(response.paymentId);
        }
        
      } else {
        setPaymentStatus({
          type: 'error',
          message: response.message
        });
        showToast(response.message || 'Payment failed. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Payment error:', error);
      const errorMessage = 'An error occurred while processing your payment. Please try again.';
      setPaymentStatus({
        type: 'error',
        message: errorMessage
      });
      showToast(errorMessage, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Check payment status periodically
  const checkPaymentStatusPeriodically = async (paymentId) => {
    const maxAttempts = 10;
    let attempts = 0;
    
    const checkStatus = async () => {
      try {
        const paymentData = await paymentAPI.checkPaymentStatus(paymentId);
        
        if (paymentData.status === 'Success') {
          // Update local state with successful payment
          setTenantPayments(prev => 
            prev.map(payment => 
              payment.id === paymentId 
                ? { ...payment, status: 'completed', mpesa_receipt: paymentData.mpesa_receipt }
                : payment
            )
          );
          
          // Refresh tenant data to update rent due
          const tenantData = await authAPI.getCurrentUser();
          const userUnit = tenantData.unit || {};
          setCurrentTenant(prev => ({
            ...prev,
            rentDue: parseFloat(userUnit.rent_remaining) || 0
          }));
          
          showToast('Payment completed successfully!', 'success');
          return;
        } else if (paymentData.status === 'Failed') {
          // Update local state with failed payment
          setTenantPayments(prev => 
            prev.map(payment => 
              payment.id === paymentId 
                ? { ...payment, status: 'failed' }
                : payment
            )
          );
          showToast('Payment failed. Please try again.', 'error');
          return;
        }
        
        // Continue polling if still pending
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 3000); // Check every 3 seconds
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 3000);
        }
      }
    };
    
    setTimeout(checkStatus, 3000);
  };

  // Quick amount buttons
  const quickAmounts = currentTenant ? [
    { label: 'Full Balance', amount: currentTenant.rentDue },
    { label: 'Half Payment', amount: Math.floor(currentTenant.rentDue / 2) },
  ].filter(item => item.amount > 0 && item.amount <= currentTenant.rentDue) : [];

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <FaSpinner className="mx-auto h-8 w-8 text-blue-600 animate-spin mb-4" />
          <h2 className="text-lg font-medium text-gray-900">Loading payment information...</h2>
        </div>
      </div>
    );
  }

  if (!currentTenant) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <FaExclamationTriangle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">Tenant Data Not Found</h2>
          <p className="text-gray-500">Unable to load your tenant information. Please contact support.</p>
        </div>
      </div>
    );
  }

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'completed':
      case 'success':
        return { text: 'Completed', class: 'bg-green-100 text-green-800', icon: CheckCircle };
      case 'pending':
        return { text: 'Pending', class: 'bg-yellow-100 text-yellow-800', icon: FaClock };
      case 'failed':
        return { text: 'Failed', class: 'bg-red-100 text-red-800', icon: XCircle };
      default:
        return { text: 'Unknown', class: 'bg-gray-100 text-gray-800', icon: FaInfoCircle };
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
          Payment Center
        </h1>
        <p className="text-gray-600 mt-2">Manage your rent payments securely with M-Pesa</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Form */}
        <div className="rounded-xl shadow-sm bg-white">
          <div className="p-4 border-b bg-gradient-to-r from-green-50 to-emerald-50">
            <h2 className="text-lg font-semibold flex items-center">
              <FaMobileAlt className="mr-2 text-green-600" />
              M-Pesa Payment
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Pay your rent using M-Pesa mobile money
            </p>
          </div>

          <div className="p-6">
            {/* Payment Status Alert */}
            {paymentStatus && (
              <div className={`mb-4 p-4 rounded-lg border flex items-start ${
                paymentStatus.type === 'success' 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                {paymentStatus.type === 'success' ? (
                  <FaCheckCircle className="mr-2 mt-0.5 text-green-600" />
                ) : (
                  <FaTimes className="mr-2 mt-0.5 text-red-600" />
                )}
                <div>
                  <p className="font-medium">{paymentStatus.message}</p>
                  {paymentStatus.transactionId && (
                    <p className="text-sm mt-1">Request ID: {paymentStatus.transactionId}</p>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handlePayment} className="space-y-6">
              {/* Balance Summary */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-3">Account Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-blue-700">Unit Number:</span>
                    <span className="text-sm font-bold text-blue-900">{currentTenant.room}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-blue-700">Monthly Rent:</span>
                    <span className="text-sm text-blue-800">KSh {currentTenant.rentAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-blue-200 pt-2">
                    <span className="text-sm font-medium text-blue-700">Outstanding Balance:</span>
                    <span className="text-lg font-bold text-blue-900">
                      KSh {currentTenant.rentDue.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Amount Buttons */}
              {quickAmounts.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quick Amount Selection
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {quickAmounts.map((item, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, amount: item.amount.toString() }))}
                        className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      >
                        <div className="font-medium">{item.label}</div>
                        <div className="text-xs text-gray-500">KSh {item.amount.toLocaleString()}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Amount Input */}
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Amount (KSh) *
                </label>
                <input
                  id="amount"
                  name="amount"
                  type="number"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="Enter amount to pay"
                  min="1"
                  max={currentTenant.rentDue}
                  className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                    errors.amount ? 'border-red-300' : 'border-gray-300'
                  }`}
                  disabled={isProcessing}
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                )}
              </div>

              {/* Phone Input */}
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  M-Pesa Phone Number *
                </label>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="+254712345678"
                  className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                    errors.phoneNumber ? 'border-red-300' : 'border-gray-300'
                  }`}
                  disabled={isProcessing}
                />
                {errors.phoneNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Enter your M-Pesa registered phone number
                </p>
              </div>

              {/* Info Alert */}
              <div className="flex items-start p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm">
                <FaInfoCircle className="mr-2 mt-0.5 text-blue-600" />
                <div>
                  <p className="font-medium mb-1">How it works:</p>
                  <ul className="text-xs space-y-1">
                    <li>• You'll receive an M-Pesa prompt on your phone</li>
                    <li>• Enter your M-Pesa PIN to complete payment</li>
                    <li>• Payment confirmation will be sent via SMS</li>
                  </ul>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isProcessing || currentTenant.rentDue === 0}
                className="w-full flex items-center justify-center px-4 py-3 rounded-lg font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isProcessing ? (
                  <>
                    <FaSpinner className="mr-2 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <FaCreditCard className="mr-2" />
                    Pay with M-Pesa
                  </>
                )}
              </button>

              {/* Fully Paid Alert */}
              {currentTenant.rentDue === 0 && (
                <div className="flex items-start p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
                  <FaCheckCircle className="mr-2 mt-0.5 text-green-600" />
                  <p className="font-medium">Your rent is fully paid for this month!</p>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Payment History */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center mb-4">
            <CreditCard className="w-6 h-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-bold">Payment History</h2>
          </div>
          <p className="text-gray-600 mb-4">Your recent payment transactions</p>
          
          {/* Scrollable Container */}
          <div 
            className="space-y-4 pr-2"
            style={{
              maxHeight: '600px',
              minHeight: '400px',
              overflowY: 'auto',
            }}
          >
            {tenantPayments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FaReceipt className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <p>No payment history found</p>
              </div>
            ) : (
              tenantPayments.map((payment) => {
                const statusInfo = getStatusDisplay(payment.status);
                const StatusIcon = statusInfo.icon;
                
                return (
                  <div key={payment.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="text-2xl font-bold text-gray-900">
                          KSh {payment.amount.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500 capitalize mt-1">
                          {payment.payment_type || 'rent'}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm flex items-center ${statusInfo.class}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusInfo.text}
                      </span>
                    </div>
                    <p className="text-gray-700 font-medium mb-2">
                      {new Date(payment.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    {payment.mpesa_receipt && (
                      <p className="text-sm text-gray-600 mb-1">
                        Receipt: {payment.mpesa_receipt}
                      </p>
                    )}
                    <p className="text-sm text-gray-600">{payment.phone} • M-Pesa</p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantPaymentCenter;