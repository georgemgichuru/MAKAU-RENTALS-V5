import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useTenantToast } from "../../context/TenantToastContext";
import { useAuth } from "../../context/AuthContext";
import { AppContext } from "../../context/AppContext";
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

const localMockTenants = [
  { id: '1', name: 'John Doe', email: 'john@email.com', room: 'A101', phone: '+254712345678', status: 'active', rentStatus: 'due', rentAmount: 25000, rentDue: 25000, bookingId: 'BK001' },
  { id: '2', name: 'Jane Smith', email: 'jane@email.com', room: 'B205', phone: '+254723456789', status: 'active', rentStatus: 'paid', rentAmount: 35000, rentDue: 0, bookingId: 'BK002' },
  { id: '3', name: 'Mike Johnson', email: 'mike@email.com', room: 'C301', phone: '+254734567890', status: 'active', rentStatus: 'overdue', rentAmount: 20000, rentDue: 40000, bookingId: 'BK003' }
];

const TenantPaymentCenter = () => {
  const navigate = useNavigate();
  const { showToast } = useTenantToast();
  const { user } = useAuth();
  // get applyPayment from context (it will add transaction + update tenant)
  const { mockTenants: contextTenants, transactions, applyPayment } = useContext(AppContext);

  const [formData, setFormData] = useState({
    amount: "",
    phoneNumber: "",
    months: 0 // optional: allow user to explicitly choose months
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [currentTenant, setCurrentTenant] = useState(null);
  const [tenantPayments, setTenantPayments] = useState([]);
  const [errors, setErrors] = useState({});

  const getEffectiveRentDue = (tenant) => {
    if (!tenant) return 0;
    if (tenant.rentDue !== undefined && tenant.rentDue !== null) return tenant.rentDue;
    if (tenant.rentStatus === 'paid') return 0;
    return tenant.rentAmount || 0;
  };

  useEffect(() => {
    let tenant = null;
    if (contextTenants && user) {
      tenant = contextTenants.find(t => String(t.id) === String(user.id) || String(t.email) === String(user.email)) || null;
    }
    if (!tenant && user) {
      tenant = localMockTenants.find(t => String(t.id) === String(user.id) || String(t.email) === String(user.email)) || null;
    }

    setCurrentTenant(tenant);

    if (tenant && transactions) {
      const tenantTxns = (transactions || [])
        .filter(tx => String(tx.tenantId) === String(tenant.id))
        .sort((a,b) => new Date(b.date) - new Date(a.date));
      setTenantPayments(tenantTxns);
    } else {
      setTenantPayments([]);
    }

    if (tenant?.phone && !formData.phoneNumber) {
      setFormData(prev => ({ ...prev, phoneNumber: tenant.phone }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, transactions, contextTenants]);

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

    if (!formData.phoneNumber) {
      newErrors.phoneNumber = "Phone number is required";
    } else if (!/^\+254[0-9]{9}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "Please enter a valid Kenyan phone number (+254XXXXXXXXX)";
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

  const initiateMpesaPayment = async (amount, phoneNumber) => {
    // simulated
    return new Promise((resolve) => {
      setTimeout(() => {
        const isSuccess = Math.random() > 0.3;
        resolve({
          success: isSuccess,
          message: isSuccess ? "Payment request sent. Check your phone for the M-Pesa prompt." : "Payment request failed. Try again.",
          transactionId: isSuccess ? `MPX${Date.now()}` : null,
          checkoutRequestId: isSuccess ? `ws_CO_${Date.now()}` : null
        });
      }, 1400);
    });
  };

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
        // compose transaction
        const monthsText = Number(formData.months) > 0 ? ` - ${formData.months} month(s)` : '';
        const newPayment = {
          id: `TXN${Date.now()}`,
          tenantId: currentTenant ? currentTenant.id : (user?.id || null),
          date: new Date().toISOString().split('T')[0],
          description: `Rent Payment${monthsText}`,
          amount: parseFloat(formData.amount),
          type: 'Payment',
          status: 'pending',
          reference: response.transactionId || null,
          paymentMethod: 'M-PESA',
          phone: formattedPhone,
          months: Number(formData.months) || 0,
          propertyId: currentTenant?.propertyId || null
        };

        // applyPayment will record transaction and update tenant's prepaidMonths / rentDue / rentStatus
        applyPayment(newPayment);

        // backend integration (Django) - commented out until backend ready
        /*
        await fetch('/api/transactions/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(newPayment)
        });
        */

        setPaymentStatus({ type: 'success', message: response.message, transactionId: response.transactionId });
        showToast('Payment request sent. Check your phone for M-Pesa prompt.', 'success');

        setFormData({ amount: "", phoneNumber: formattedPhone, months: 0 });
      } else {
        setPaymentStatus({ type: 'error', message: response.message });
        showToast(response.message || 'Payment failed. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStatus({ type: 'error', message: 'An error occurred while processing your payment.' });
      showToast('An error occurred while processing your payment. Please try again.', 'error');
    } finally {
      setIsProcessing(false);
    }
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
              <div className={`p-3 rounded-md border ${paymentStatus.type === 'success' ? 'bg-green-50 border-green-100 text-green-800' : 'bg-rose-50 border-rose-100 text-rose-800'}`}>
                <div className="flex items-start gap-3">
                  {paymentStatus.type === 'success' ? <FaCheckCircle className="text-green-600 mt-1" /> : <FaTimes className="text-rose-600 mt-1" />}
                  <div>
                    <p className="text-sm font-medium">{paymentStatus.message}</p>
                    {paymentStatus.transactionId && <p className="text-xs text-slate-500 mt-1">Transaction ID: {paymentStatus.transactionId}</p>}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 mb-1">M-Pesa Phone Number</label>
                  <input
                    name="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="+254712345678"
                    className={`w-full px-3 py-2 border rounded-md text-sm ${errors.phoneNumber ? 'border-rose-300' : 'border-gray-200'}`}
                    disabled={isProcessing}
                  />
                  {errors.phoneNumber && <p className="text-xs text-rose-600 mt-1">{errors.phoneNumber}</p>}
                  <p className="text-xs text-slate-500 mt-1">Use your M-Pesa registered number</p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={isProcessing || (effectiveRentDue === 0 && Number(formData.months) === 0)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-white bg-slate-700 hover:bg-slate-800 text-sm disabled:opacity-50"
                  >
                    {isProcessing ? (<><FaSpinner className="animate-spin" /> Processing</>) : (<><FaCreditCard /> Pay with M-Pesa</>)}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setFormData({ amount: '', phoneNumber: formData.phoneNumber, months: 0 }); setErrors({}); }}
                    className="px-4 py-2 rounded-md border text-sm text-slate-700 bg-white hover:bg-gray-50"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {effectiveRentDue === 0 && Number(formData.months) === 0 && (
                <div className="p-3 rounded-md bg-green-50 border border-green-100 text-green-700 text-sm">
                  <div className="flex items-center gap-2"><FaCheckCircle /> Your rent is fully paid for this month.</div>
                </div>
              )}
            </form>

            <div className="text-xs text-slate-500">
              <FaInfoCircle className="inline-block mr-2" /> You will receive the M-Pesa prompt on your phone—enter your PIN to complete.
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
                    <p className="text-xs text-slate-500">{payment.date}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs ${payment.status === 'completed' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-slate-700'}`}>
                      {payment.status === 'completed' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {payment.status === 'completed' ? 'Completed' : (payment.status || 'Pending')}
                    </span>
                    <p className="text-xs text-slate-500 mt-1">ID: {payment.reference || payment.id}</p>
                    <p className="text-xs text-slate-500">{payment.phone || currentTenant.phone || ''} • {payment.paymentMethod || payment.method || 'M-PESA'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantPaymentCenter;