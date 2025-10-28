import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useTenantToast } from "../../context/TenantToastContext";
import { useAuth } from "../../context/AuthContext";
import { AppContext } from "../../context/AppContext";
import { paymentsAPI } from "../../services/api";
import PesaPalPaymentModal from "../PesaPalPaymentModal";
import {
  FaMobileAlt,
  FaCreditCard,
  FaCheckCircle,
  FaTimes,
  FaInfoCircle,
  FaSpinner,
  FaExclamationTriangle
} from "react-icons/fa";
import { CheckCircle, XCircle, CreditCard } from 'lucide-react';


const TenantPaymentCenter = () => {
  const navigate = useNavigate();
  const { showToast } = useTenantToast();
  const { user } = useAuth();
  const { fetchTransactions } = useContext(AppContext);

  const [formData, setFormData] = useState({
    amount: "",
    months: 0
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [currentTenant, setCurrentTenant] = useState(null);
  const [tenantPayments, setTenantPayments] = useState([]);
  const [errors, setErrors] = useState({});
  const [pollingPaymentId, setPollingPaymentId] = useState(null);
  
  // PesaPal Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pesapalUrl, setPesapalUrl] = useState('');
  const [currentPaymentId, setCurrentPaymentId] = useState(null);
  const [currentPaymentAmount, setCurrentPaymentAmount] = useState(null);

  const getEffectiveRentDue = (tenant) => {
    if (!tenant) return 0;
    if (tenant.rentDue !== undefined && tenant.rentDue !== null) return tenant.rentDue;
    if (tenant.rentStatus === 'paid') return 0;
    return tenant.rentAmount || 0;
  };

  // Fetch tenant data and payment history
  useEffect(() => {
    async function fetchTenantData() {
      try {
        // Build tenant info from user context
        const tenant = {
          id: user?.id,
          name: user?.full_name,
          room: user?.current_unit?.unit_number || 'Not Assigned',
          unitId: user?.current_unit?.id,
          rentAmount: user?.current_unit?.rent || 0,
          rentDue: user?.current_unit?.rent_remaining || 0,
          bookingId: user?.current_unit?.id || user?.id,
          phone: user?.phone_number,
          rentStatus: user?.current_unit?.rent_status || 'unknown',
        };
        setCurrentTenant(tenant);

        // Fetch payment history from backend
        const historyRes = await paymentsAPI.getPaymentHistory();
        const payments = (historyRes.data || [])
          .map(payment => ({
            id: payment.id,
            amount: payment.amount,
            date: payment.date || payment.created_at,
            status: payment.status_display || payment.status,
            reference: payment.reference_number || payment.mpesa_receipt,
            paymentMethod: 'PesaPal',
            mpesa_receipt: payment.mpesa_receipt
          }))
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        
        setTenantPayments(payments);
      } catch (err) {
        console.error('Error fetching tenant data:', err);
        showToast('Failed to load payment history', 'error');
        setTenantPayments([]);
      }
    }
    
    if (user?.id) {
      fetchTenantData();
    }
  }, [user]);

  // Check for payment status on component mount (after redirect return)
  useEffect(() => {
    const pendingPaymentId = localStorage.getItem('pending_payment_id');
    const paymentType = localStorage.getItem('payment_type');
    
    if (pendingPaymentId && paymentType === 'rent') {
      // Start polling for this payment
      setPollingPaymentId(parseInt(pendingPaymentId));
      // Clear stored data
      localStorage.removeItem('pending_payment_id');
      localStorage.removeItem('payment_type');
    }
  }, []);

  // Poll payment status
  useEffect(() => {
    if (!pollingPaymentId) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await paymentsAPI.getRentPaymentStatus(pollingPaymentId);
        const status = response.data.status;

        if (status === 'completed' || status === 'Success') {
          setPaymentStatus({
            type: 'success',
            message: 'Payment completed successfully!',
            transactionId: response.data.mpesa_receipt || response.data.reference_number
          });
          showToast('Payment completed successfully!', 'success');
          setPollingPaymentId(null);
          setIsProcessing(false);
          
          // Refresh payment history
          const historyRes = await paymentsAPI.getPaymentHistory();
          const payments = (historyRes.data || [])
            .map(payment => ({
              id: payment.id,
              amount: payment.amount,
              date: payment.date || payment.created_at,
              status: payment.status_display || payment.status,
              reference: payment.reference_number || payment.mpesa_receipt,
              paymentMethod: 'PesaPal',
              mpesa_receipt: payment.mpesa_receipt
            }))
            .sort((a, b) => new Date(b.date) - new Date(a.date));
          setTenantPayments(payments);

          // Refresh user data to update rent balance
          if (fetchTransactions) {
            fetchTransactions();
          }
        } else if (status === 'failed' || status === 'Failed' || status === 'cancelled') {
          setPaymentStatus({
            type: 'error',
            message: response.data.failure_reason || 'Payment failed. Please try again.'
          });
          showToast('Payment failed', 'error');
          setPollingPaymentId(null);
          setIsProcessing(false);
        }
      } catch (error) {
        console.error('Error polling payment status:', error);
      }
    }, 3000); // Poll every 3 seconds

    // Stop polling after 5 minutes
    const timeout = setTimeout(() => {
      setPollingPaymentId(null);
      setIsProcessing(false);
      if (paymentStatus?.type !== 'success') {
        setPaymentStatus({
          type: 'error',
          message: 'Payment verification timed out. Please check your payment history.'
        });
      }
    }, 300000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeout);
    };
  }, [pollingPaymentId]);

  const validateForm = () => {
    const newErrors = {};
    const effectiveRentDue = getEffectiveRentDue(currentTenant);

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Please enter a valid amount";
    }

    // If months selected, amount must match months * rentAmount
    if (Number(formData.months) > 0 && currentTenant) {
      const expected = Number(currentTenant.rentAmount || 0) * Number(formData.months);
      if (Number(formData.amount) !== expected) {
        newErrors.amount = `Amount must equal months × monthly rent (KSh ${expected.toLocaleString()})`;
      }
    } else if (effectiveRentDue !== 0 && Number(formData.months) === 0 && parseFloat(formData.amount) > effectiveRentDue) {
      newErrors.amount = "Amount cannot exceed outstanding balance (or use the months option to prepay)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // handle months specially: when months > 0 auto-calc amount
    if (name === 'months') {
      const months = Number(value) || 0;
      if (currentTenant && months > 0) {
        const computed = Number(currentTenant.rentAmount || 0) * months;
        setFormData(prev => ({ ...prev, months, amount: computed.toString() }));
      } else {
        setFormData(prev => ({ ...prev, months, amount: "" }));
      }
      // clear amount error when adjusting months
      setErrors(prev => ({ ...prev, amount: undefined }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const formatPhoneNumber = (value) => {
    let cleaned = value.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '+254' + cleaned.substring(1);
    } else if (cleaned.startsWith('254')) {
      cleaned = '+' + cleaned;
    } else if (!cleaned.startsWith('+254') && cleaned.length > 0) {
      if (!cleaned.startsWith('+')) {
        cleaned = '+254' + cleaned;
      }
    }
    return cleaned;
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast('Please fix the form errors before submitting.', 'error');
      return;
    }

    if (!currentTenant?.unitId) {
      showToast('Unit information not found. Please contact support.', 'error');
      return;
    }

    setIsProcessing(true);
    setPaymentStatus(null);
    setErrors({});

    try {
      // Call PesaPal payment initiation endpoint
      const response = await paymentsAPI.initiateRentPayment(currentTenant.unitId, {
        amount: parseFloat(formData.amount)
      });

      if (response.data.success && response.data.redirect_url) {
        // Store payment ID for status checking
        localStorage.setItem('pending_payment_id', response.data.payment_id);
        localStorage.setItem('payment_type', 'rent');
        
        setPaymentStatus({
          type: 'redirecting',
          message: 'Opening payment gateway...',
          transactionId: response.data.order_tracking_id
        });
        
        // Show modal instead of redirecting
        setCurrentPaymentId(response.data.payment_id);
        setCurrentPaymentAmount(parseFloat(formData.amount));
        setPesapalUrl(response.data.redirect_url);
        setShowPaymentModal(true);
        setIsProcessing(false);
        
      } else {
        const errorMsg = response.data.error || response.data.details || 'Payment failed. Please try again.';
        setPaymentStatus({ type: 'error', message: errorMsg });
        showToast(errorMsg, 'error');
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Payment error:', error);
      const errorMsg = error.response?.data?.error || error.response?.data?.details || 'An error occurred while processing your payment.';
      setPaymentStatus({ type: 'error', message: errorMsg });
      showToast(errorMsg, 'error');
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
    setPaymentStatus({
      type: 'pending',
      message: 'Verifying payment...'
    });
    
    showToast('Payment completed! Verifying...', 'success');
  };

  const effectiveRentDue = getEffectiveRentDue(currentTenant);
  const quickAmounts = currentTenant ? [
    { label: 'Full Rent', amount: currentTenant.rentAmount || 0 },
  ].filter(item => item.amount > 0 && (effectiveRentDue === 0 ? true : item.amount <= effectiveRentDue)) : [];

  if (!currentTenant) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center p-8 bg-gray-50">
        <div className="max-w-xl w-full text-center">
          <FaExclamationTriangle className="mx-auto h-10 w-10 text-gray-400 mb-3" />
          <h2 className="text-lg font-semibold text-slate-800 mb-1">Tenant Data Not Found</h2>
          <p className="text-sm text-slate-500">Unable to load your tenant information. Please contact support.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-6 lg:p-10 bg-gray-50 min-h-screen">
      <div className="max-w-full mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Payment Form (larger) */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h1 className="text-2xl font-semibold text-slate-800">Payment Center</h1>
            <p className="text-sm text-slate-500 mt-1">Securely manage your rent payments</p>
          </div>
          <div className="p-6 space-y-6">
            {paymentStatus && (
              <div className={`p-3 rounded-md border ${
                paymentStatus.type === 'success' 
                  ? 'bg-green-50 border-green-100 text-green-800' 
                  : paymentStatus.type === 'pending'
                  ? 'bg-blue-50 border-blue-100 text-blue-800'
                  : 'bg-rose-50 border-rose-100 text-rose-800'
              }`}>
                <div className="flex items-start gap-3">
                  {paymentStatus.type === 'success' ? (
                    <FaCheckCircle className="text-green-600 mt-1" />
                  ) : paymentStatus.type === 'pending' ? (
                    <FaSpinner className="text-blue-600 mt-1 animate-spin" />
                  ) : (
                    <FaTimes className="text-rose-600 mt-1" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{paymentStatus.message}</p>
                    {paymentStatus.transactionId && (
                      <p className="text-xs text-slate-500 mt-1">Transaction ID: {paymentStatus.transactionId}</p>
                    )}
                    {paymentStatus.type === 'pending' && (
                      <p className="text-xs text-slate-500 mt-1">Verifying payment... This may take a moment.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handlePayment} className="space-y-5">
              <div className="bg-white border border-gray-100 rounded-md p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm text-slate-600">Room Number</p>
                    <p className="text-sm font-medium text-slate-800">{currentTenant.room}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Monthly Rent</p>
                    <p className="text-sm font-medium text-slate-800">KSh {Number(currentTenant.rentAmount || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Outstanding</p>
                    <p className="text-sm font-semibold text-slate-800">KSh {Number(effectiveRentDue).toLocaleString()}</p>
                  </div>
                </div>

                {quickAmounts.length > 0 && (
                  <div className="mb-3">
                    <label className="block text-xs text-slate-600 mb-2">Quick Amount</label>
                    <div className="flex gap-2">
                      {quickAmounts.map((item, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, amount: item.amount.toString(), months: 0 }))}
                          className="text-sm px-3 py-2 border rounded-md bg-white hover:bg-gray-50 text-slate-700"
                        >
                          {item.label} • KSh {Number(item.amount).toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Months to pay (optional)</label>
                    <select
                      name="months"
                      value={formData.months}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-md text-sm border-gray-200"
                      disabled={isProcessing}
                    >
                      <option value={0}>-- Pay by months --</option>
                      {Array.from({length:12}, (_,i) => i+1).map(n => (
                        <option key={n} value={n}>{n} month{n>1 ? 's' : ''} — KSh {(Number(currentTenant?.rentAmount||0)*n).toLocaleString()}</option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-400 mt-1">Selecting months will auto-fill the amount.</p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs text-slate-600 mb-1">Payment Amount (KSh)</label>
                    <input
                      name="amount"
                      type="number"
                      value={formData.amount}
                      onChange={handleInputChange}
                      placeholder="Enter amount"
                      min="1"
                      max={effectiveRentDue || undefined}
                      className={`w-full px-3 py-2 border rounded-md text-sm ${errors.amount ? 'border-rose-300' : 'border-gray-200'}`}
                      disabled={isProcessing || Number(formData.months) > 0}
                    />
                    {errors.amount && <p className="text-xs text-rose-600 mt-1">{errors.amount}</p>}
                    {Number(formData.months) > 0 && <p className="text-xs text-slate-500 mt-1">Amount auto-calculated for {formData.months} month(s).</p>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 justify-end">
                <button
                  type="submit"
                  disabled={isProcessing || pollingPaymentId || (effectiveRentDue === 0 && Number(formData.months) === 0)}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2 rounded-md text-white bg-slate-700 hover:bg-slate-800 text-sm disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <FaSpinner className="animate-spin" /> Processing
                    </>
                  ) : pollingPaymentId ? (
                    <>
                      <FaSpinner className="animate-spin" /> Verifying
                    </>
                  ) : (
                    <>
                      <FaCreditCard /> Pay Now
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => { 
                    setFormData({ 
                      amount: '', 
                      months: 0 
                    }); 
                    setErrors({}); 
                    setPaymentStatus(null);
                  }}
                  className="px-4 py-2 rounded-md border text-sm text-slate-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isProcessing || pollingPaymentId}
                >
                  Reset
                </button>
              </div>

              {effectiveRentDue === 0 && Number(formData.months) === 0 && (
                <div className="p-3 rounded-md bg-green-50 border border-green-100 text-green-700 text-sm">
                  <div className="flex items-center gap-2"><FaCheckCircle /> Your rent is fully paid for this month.</div>
                </div>
              )}
            </form>

            <div className="text-xs text-slate-500 bg-blue-50 border border-blue-100 rounded p-3">
              <FaInfoCircle className="inline-block mr-2" /> You will be redirected to PesaPal to complete your payment securely using M-Pesa, card, or other payment methods.
            </div>

            {/* Payment Tip */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mt-4">
              <div className="flex items-start gap-3">
                <div className="bg-green-100 rounded-full p-2 flex-shrink-0">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-green-800 mb-1">💡 Save Time & Money</h3>
                  <p className="text-xs text-green-700 leading-relaxed">
                    <strong>Pro Tip:</strong> Pay for multiple months at once to reduce the number of transactions and save yourself the hassle of monthly payments. 
                    It's more convenient and helps you budget better!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column - Payment history */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3 mb-3">
            <CreditCard className="w-5 h-5 text-slate-600" />
            <h2 className="text-sm font-semibold text-slate-800">Payment History</h2>
          </div>
          <p className="text-xs text-slate-500 mb-4">Recent transactions</p>

          <div className="space-y-3 overflow-y-auto" style={{ maxHeight: '62vh' }}>
            {tenantPayments.length === 0 && (
              <div className="text-center text-sm text-slate-500 py-8">No transactions found.</div>
            )}
            {tenantPayments.map((payment) => (
              <div key={payment.id} className="border rounded-md p-3 bg-white">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-slate-800">KSh {Number(payment.amount).toLocaleString()}</p>
                    <p className="text-xs text-slate-500">{new Date(payment.date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs ${
                      payment.status === 'completed' || payment.status === 'Success'
                        ? 'bg-green-50 text-green-700' 
                        : payment.status === 'pending' || payment.status === 'Pending'
                        ? 'bg-yellow-50 text-yellow-700'
                        : 'bg-gray-100 text-slate-700'
                    }`}>
                      {payment.status === 'completed' || payment.status === 'Success' ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      {payment.status}
                    </span>
                    {payment.reference && (
                      <p className="text-xs text-slate-500 mt-1">ID: {payment.reference}</p>
                    )}
                    {payment.mpesa_receipt && (
                      <p className="text-xs text-slate-500">Receipt: {payment.mpesa_receipt}</p>
                    )}
                    <p className="text-xs text-slate-500">{payment.paymentMethod || 'PesaPal'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PesaPal Payment Modal */}
      <PesaPalPaymentModal
        isOpen={showPaymentModal}
        redirectUrl={pesapalUrl}
        onClose={handleCloseModal}
        onPaymentComplete={handlePaymentComplete}
        paymentId={currentPaymentId}
        amount={currentPaymentAmount}
      />
    </div>
  );
};

export default TenantPaymentCenter;