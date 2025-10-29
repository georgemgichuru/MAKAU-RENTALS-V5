import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { 
  Calendar,
  ChevronRight
} from 'lucide-react';

const AdminSettings = () => {
  const navigate = useNavigate();
  
  // Get user data from localStorage
  const userData = localStorage.getItem('userData') ? JSON.parse(localStorage.getItem('userData')) : {};

  // Account info state
  const [firstName, setFirstName] = useState(userData.first_name || '');
  const [lastName, setLastName] = useState(userData.last_name || '');
  const [email, setEmail] = useState(userData.email || '');
  const [phone, setPhone] = useState(userData.phone_number || '');
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountError, setAccountError] = useState('');
  const [accountSuccess, setAccountSuccess] = useState('');
  
  const [selectedReminderDates, setSelectedReminderDates] = useState([]);
  const [reminderTemplate, setReminderTemplate] = useState({
    subject: 'Rent Reminder',
    message: `Dear tenant,

This is a reminder that your rent is due soon.

Please pay by the due date to avoid penalties.

Thank you,
Makao Center`
  });
  const [reminderLoading, setReminderLoading] = useState(false);
  const [reminderError, setReminderError] = useState('');
  const [reminderSuccess, setReminderSuccess] = useState('');

  // Subscription state
  const [subscription, setSubscription] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);

  // Security settings state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [enable2FA, setEnable2FA] = useState(false);
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securityError, setSecurityError] = useState("");
  const [securitySuccess, setSecuritySuccess] = useState("");

  const reminderDates = [
    { value: '1', label: '1st' },
    { value: '2', label: '2nd' },
    { value: '3', label: '3rd' },
    { value: '4', label: '4th' },
    { value: '5', label: '5th' },
    { value: '10', label: '10th' },
    { value: '15', label: '15th' },
    { value: '20', label: '20th' },
    { value: '25', label: '25th' },
  ];

  // Update account info handler
  const handleAccountUpdate = async (e) => {
    e.preventDefault();
    setAccountLoading(true);
    setAccountError('');
    setAccountSuccess('');
    try {
      const response = await api.put(`/accounts/users/${userData.id}/update/`, {
        first_name: firstName,
        last_name: lastName,
        email,
        phone_number: phone,
      });
      
      if (response && response.data) {
        setAccountSuccess('Account information updated successfully.');
        // Update localStorage with new data
        const updatedUserData = {
          ...userData,
          first_name: firstName,
          last_name: lastName,
          email,
          phone_number: phone
        };
        localStorage.setItem('userData', JSON.stringify(updatedUserData));
        
        // Auto-clear success message after 4 seconds
        setTimeout(() => setAccountSuccess(''), 4000);
      }
    } catch (err) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Failed to update account information.';
      setAccountError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
    setAccountLoading(false);
  };

  const handleDateToggle = (date) => {
    setSelectedReminderDates(prev => 
      prev.includes(date) 
        ? prev.filter(d => d !== date)
        : [...prev, date]
    );
  };

  const handleSaveReminders = () => {
    setReminderError('');
    setReminderSuccess('');
    if (selectedReminderDates.length === 0) {
      setReminderError('Please select at least one reminder date.');
      return;
    }

    const payload = {
      days_of_month: selectedReminderDates.map((d) => parseInt(d, 10)).filter((n) => !isNaN(n)),
      subject: reminderTemplate.subject,
      message: reminderTemplate.message,
      send_email: true,
      active: true,
    };

    setReminderLoading(true);
    api
      .put('/communication/reminders/settings/', payload)
      .then((res) => {
        setReminderSuccess('Reminder settings saved successfully.');
        // Auto-clear
        setTimeout(() => setReminderSuccess(''), 4000);
      })
      .catch((err) => {
        const msg = err.response?.data?.error || err.response?.data || err.message || 'Failed to save reminder settings.';
        setReminderError(typeof msg === 'string' ? msg : 'Failed to save reminder settings.');
      })
      .finally(() => setReminderLoading(false));
  };

  const handleSaveSecuritySettings = async () => {
    setSecurityError("");
    setSecuritySuccess("");
    
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setSecurityError("Please fill in all password fields.");
      return;
    }
    
    if (newPassword !== confirmNewPassword) {
      setSecurityError("New passwords do not match.");
      return;
    }
    
    if (newPassword.length < 8) {
      setSecurityError("New password must be at least 8 characters long.");
      return;
    }
    
    setSecurityLoading(true);
    
    try {
      // Call backend API to change password using the api service
      const response = await api.put('/accounts/change-password/', {
        current_password: currentPassword,
        new_password: newPassword,
        enable_2fa: enable2FA,
      });
      
      const data = response.data;
      
      setSecuritySuccess(data.message || "Security settings updated successfully! A confirmation email has been sent.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      
      // Auto-clear success message after 5 seconds
      setTimeout(() => {
        setSecuritySuccess("");
      }, 5000);
      
    } catch (err) {
      setSecurityError(err.response?.data?.error || err.response?.data?.message || err.message || "An error occurred while updating security settings.");
    } finally {
      setSecurityLoading(false);
    }
  };

  // Load existing reminder settings on mount
  useEffect(() => {
    let isMounted = true;
    setReminderLoading(true);
    api
      .get('/communication/reminders/settings/')
      .then((res) => {
        if (!isMounted) return;
        const data = res.data || {};
        const days = Array.isArray(data.days_of_month) ? data.days_of_month : [];
        setSelectedReminderDates(days.map((d) => String(d)));
        setReminderTemplate({
          subject: data.subject || 'Rent Reminder',
          message:
            data.message || `Dear tenant,

This is a reminder that your rent is due soon.

Please pay by the due date to avoid penalties.

Thank you,
Makao Center`,
        });
      })
      .catch((err) => {
        // If 404 or other, silently keep defaults
        console.warn('Failed to load reminder settings:', err?.message || err);
      })
      .finally(() => {
        if (isMounted) setReminderLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Load subscription data on mount
  useEffect(() => {
    let isMounted = true;
    setSubscriptionLoading(true);
    api
      .get('/accounts/subscription/status/')
      .then((res) => {
        if (!isMounted) return;
        setSubscription(res.data);
      })
      .catch((err) => {
        console.warn('Failed to load subscription:', err?.message || err);
      })
      .finally(() => {
        if (isMounted) setSubscriptionLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Helper function to get plan display info
  const getPlanDisplayInfo = () => {
    if (!subscription) {
      return {
        name: 'Loading...',
        description: 'Fetching subscription details...',
        status: 'loading',
        expiryDate: null
      };
    }

    const plan = subscription.plan?.toLowerCase() || 'free';
    const isActive = subscription.is_active;
    const isTrial = plan === 'free';
    const expiryDate = subscription.expiry_date;
    
    let planName, description, status;

    if (isTrial) {
      const daysRemaining = subscription.days_remaining || 0;
      planName = 'Free Trial';
      description = `${daysRemaining} days remaining • Up to 2 properties, 10 units`;
      status = isActive ? 'Active' : 'Expired';
    } else {
      switch (plan) {
        case 'starter':
          planName = 'Starter Plan';
          description = 'Up to 3 properties, 10 units • Monthly';
          break;
        case 'basic':
          planName = 'Basic Plan';
          description = 'Up to 10 properties, 50 units • Monthly';
          break;
        case 'professional':
          planName = 'Professional Plan';
          description = 'Up to 25 properties, 100 units • Monthly';
          break;
        case 'onetime':
          planName = 'One-Time Purchase';
          description = 'Unlimited properties & units • Lifetime access';
          break;
        default:
          planName = plan.charAt(0).toUpperCase() + plan.slice(1);
          description = 'Custom plan';
      }
      status = isActive ? 'Active' : 'Inactive';
    }

    return { name: planName, description, status, expiryDate };
  };

  const planInfo = getPlanDisplayInfo();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
      <p className="text-gray-600">Manage your account settings and preferences</p>

      {/* Account Settings */}
      <form className="bg-white p-6 rounded-lg shadow" onSubmit={handleAccountUpdate}>
        <h2 className="text-xl font-semibold mb-4">Account Information</h2>
        <div className="space-y-4">
          {(accountError || accountSuccess) && (
            <div className={`p-3 border rounded text-sm ${accountError ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
              {accountError || accountSuccess}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div className="flex justify-end pt-2">
            <button 
              type="submit" 
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={accountLoading}
            >
              {accountLoading ? 'Updating...' : 'Update Information'}
            </button>
          </div>
        </div>
      </form>

      {/* Billing Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Billing</h2>
        
        <div className="space-y-4">
          {/* Current Plan Info */}
          <div className="border border-gray-200 rounded-lg p-4">
            {subscriptionLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Current Plan</p>
                    <p className="text-lg font-semibold text-gray-900">{planInfo.name}</p>
                    <p className="text-sm text-gray-600 mt-1">{planInfo.description}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${
                    planInfo.status === 'Active' 
                      ? 'bg-green-50 text-green-700' 
                      : planInfo.status === 'Expired'
                      ? 'bg-red-50 text-red-700'
                      : 'bg-gray-50 text-gray-700'
                  }`}>
                    {planInfo.status}
                  </span>
                </div>
                {planInfo.expiryDate && planInfo.name !== 'One-Time Purchase' && (
                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-600">
                      {planInfo.status === 'Expired' ? 'Expired on' : 'Expires on'}:{' '}
                      <span className="font-medium text-gray-900">
                        {new Date(planInfo.expiryDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/admin/subscription')}
              className="flex items-center justify-between p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="text-left">
                <p className="font-medium text-gray-900">Subscription Plans</p>
                <p className="text-sm text-gray-600">View all available plans</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>

            <button
              onClick={() => navigate('/admin/sms-purchase')}
              className="flex items-center justify-between p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="text-left">
                <p className="font-medium text-gray-900">SMS Credits</p>
                <p className="text-sm text-gray-600">Purchase SMS credits</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Monthly Payment Reminders */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-gray-700" />
          Monthly Payment Reminders
        </h2>
        <p className="text-gray-600 text-sm mb-4">Choose date(s) to automatically remind tenants about rent payments</p>
        
        <div className="space-y-4">
          {(reminderError || reminderSuccess) && (
            <div className={`p-3 border rounded text-sm ${reminderError ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
              {reminderError || reminderSuccess}
            </div>
          )}
          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Reminder Dates</label>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {reminderDates.map(date => (
                <label key={date.value} className="flex items-center space-x-2 p-2 border border-gray-300 rounded hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedReminderDates.includes(date.value)}
                    onChange={() => handleDateToggle(date.value)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    disabled={reminderLoading}
                  />
                  <span className="text-sm text-gray-700">{date.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Reminder Template Editor */}
          <div className="border-t pt-4 mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Reminder Template</h3>
            
            {/* Subject Line */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 mb-2">Subject Line</label>
              <input
                type="text"
                value={reminderTemplate.subject}
                onChange={(e) => setReminderTemplate(prev => ({ ...prev, subject: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Email subject"
                disabled={reminderLoading}
              />
            </div>

            {/* Message Body */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 mb-2">Message Body</label>
              <textarea
                value={reminderTemplate.message}
                onChange={(e) => setReminderTemplate(prev => ({ ...prev, message: e.target.value }))}
                rows={8}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Type your reminder message here..."
                disabled={reminderLoading}
              />
            </div>

            {/* Message Preview */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 mb-2">Message Preview</label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-xs font-semibold text-gray-700 mb-2">Subject: {reminderTemplate.subject}</p>
                <div className="border-t border-gray-300 pt-2">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">{reminderTemplate.message}</pre>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-500">
              💡 Tip: This template will be sent to all tenants on the selected dates. 
            </p>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-2 border-t">
            <button
              onClick={handleSaveReminders}
              disabled={reminderLoading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {reminderLoading ? 'Saving…' : 'Save Reminder Settings'}
            </button>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Change Password</h2>
        <div className="space-y-4">
          {securityError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {securityError}
            </div>
          )}
          {securitySuccess && (
            <div className="p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
              {securitySuccess}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your current password"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter new password (min. 8 characters)"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
            <input
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Confirm new password"
            />
          </div>
          
          {/* Two-Factor Authentication checkbox removed as requested */}
          
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSaveSecuritySettings}
              disabled={securityLoading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {securityLoading ? "Saving..." : "Save Security Settings"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
