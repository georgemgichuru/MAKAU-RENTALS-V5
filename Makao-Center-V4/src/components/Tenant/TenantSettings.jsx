import React, { useState } from 'react';
import { authAPI } from '../../services/api';
import { 
  Home, 
  BarChart3, 
  Building, 
  CreditCard, 
  Users, 
  AlertTriangle, 
  Settings, 
  HelpCircle, 
  Menu, 
  X, 
  Plus, 
  Search, 
  Filter,
  Bell,
  User,
  ChevronDown,
  Eye,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  Download,
  Upload,
  LogOut,
  Shield,
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react';
const TenantSettings = () => {
  // Get user data from localStorage
  const userData = localStorage.getItem('userData') ? JSON.parse(localStorage.getItem('userData')) : {};

  // Account info state
  const [email, setEmail] = useState(userData.email || '');
  const [phone, setPhone] = useState(userData.phone_number || '');
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountError, setAccountError] = useState('');
  const [accountSuccess, setAccountSuccess] = useState('');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Update account info handler
  const handleAccountUpdate = async (e) => {
    e.preventDefault();
    setAccountLoading(true);
    setAccountError('');
    setAccountSuccess('');
    try {
      const data = await authAPI.updateTenantAccount(userData.id, {
        email,
        phone_number: phone,
      });
      if (data && !data.errors) {
        setAccountSuccess('Account information updated successfully.');
        // Optionally update localStorage
        localStorage.setItem('userData', JSON.stringify({ ...userData, email, phone_number: phone }));
      } else {
        setAccountError(data.errors ? JSON.stringify(data.errors) : 'Failed to update account info.');
      }
    } catch (err) {
      const msg = err?.response?.data ? JSON.stringify(err.response.data) : (err?.message || 'Network error.');
      setAccountError(msg);
    }
    setAccountLoading(false);
  };

  // Change password handler
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError('');
    setPasswordSuccess('');
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      setPasswordLoading(false);
      return;
    }
    try {
      const data = await authAPI.changeTenantPassword(currentPassword, newPassword);
      if (data && !data.errors) {
        setPasswordSuccess('Password changed successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(data.errors ? JSON.stringify(data.errors) : (data.detail || 'Failed to change password.'));
      }
    } catch (err) {
      const msg = err?.response?.data ? JSON.stringify(err.response.data) : (err?.message || 'Network error.');
      setPasswordError(msg);
    }
    setPasswordLoading(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {/* Account Settings */}
      <form className="bg-white p-6 rounded-lg shadow" onSubmit={handleAccountUpdate}>
        <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700" disabled={accountLoading}>
            {accountLoading ? 'Updating...' : 'Update Information'}
          </button>
          {accountError && <div className="text-red-600 mt-2">{accountError}</div>}
          {accountSuccess && <div className="text-green-600 mt-2">{accountSuccess}</div>}
        </div>
      </form>

      {/* Change Password */}
      <form className="bg-white p-6 rounded-lg shadow" onSubmit={handleChangePassword}>
        <h2 className="text-xl font-semibold mb-4">Change Password</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700" disabled={passwordLoading}>
            {passwordLoading ? 'Changing...' : 'Change Password'}
          </button>
          {passwordError && <div className="text-red-600 mt-2">{passwordError}</div>}
          {passwordSuccess && <div className="text-green-600 mt-2">{passwordSuccess}</div>}
        </div>
      </form>

      {/* Notifications (static for now) */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Notifications</h2>
        <div className="space-y-3">
          <label className="flex items-center">
            <input type="checkbox" defaultChecked className="mr-3" />
            <span>Email notifications for rent reminders</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" defaultChecked className="mr-3" />
            <span>SMS notifications for maintenance updates</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" defaultChecked className="mr-3" />
            <span>Email notifications for announcements</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default TenantSettings;
