import React, { useState, useEffect } from 'react';
import { useTenantToast } from '../../context/TenantToastContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Save, 
  Shield, 
  Bell, 
  Smartphone, 
  Mail, 
  Phone, 
  User,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle
} from 'lucide-react';

// API service functions
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
  },

  updateProfile: async (profileData) => {
    const response = await fetch('/api/users/me/update/', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      body: JSON.stringify(profileData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to update profile');
    }
    
    return response.json();
  },

  changePassword: async (passwordData) => {
    const response = await fetch('/api/auth/password-reset-confirm/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      body: JSON.stringify(passwordData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to change password');
    }
    
    return response.json();
  },

  updateReminderPreferences: async (preferences) => {
    const response = await fetch('/api/auth/update-reminder-preferences/', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      body: JSON.stringify(preferences)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to update reminder preferences');
    }
    
    return response.json();
  }
};

const TenantSettings = () => {
  const { showToast } = useTenantToast();
  const { user, updateUser } = useAuth();
  
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    emergency_contact: '',
    reminder_mode: 'days_before',
    reminder_value: 10
  });
  
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState('');

  // Load user data on component mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        const userData = await authAPI.getCurrentUser();
        
        setProfileData({
          full_name: userData.full_name || '',
          email: userData.email || '',
          phone_number: userData.phone_number || '',
          emergency_contact: userData.emergency_contact || '',
          reminder_mode: userData.reminder_mode || 'days_before',
          reminder_value: userData.reminder_value || 10
        });
      } catch (error) {
        console.error('Error loading user data:', error);
        showToast('Failed to load user data', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [showToast]);

  // Validate phone number format
  const validatePhoneNumber = (phone) => {
    if (!phone) return true; // Allow empty
    return /^\+?[0-9]{7,15}$/.test(phone);
  };

  // Check password strength
  const checkPasswordStrength = (password) => {
    if (password.length === 0) return '';
    
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    const mediumRegex = /^(?=.*[a-zA-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
    
    if (strongRegex.test(password)) return 'strong';
    if (mediumRegex.test(password)) return 'medium';
    return 'weak';
  };

  // Handle profile updates
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    setErrors({});

    try {
      // Validate phone numbers
      if (!validatePhoneNumber(profileData.phone_number)) {
        setErrors({ phone_number: 'Please enter a valid phone number' });
        return;
      }
      
      if (!validatePhoneNumber(profileData.emergency_contact)) {
        setErrors({ emergency_contact: 'Please enter a valid emergency contact number' });
        return;
      }

      // Update profile
      const updatedUser = await authAPI.updateProfile(profileData);
      
      // Update reminder preferences separately if changed
      await authAPI.updateReminderPreferences({
        reminder_mode: profileData.reminder_mode,
        reminder_value: profileData.reminder_value
      });

      // Update global auth context
      updateUser(updatedUser);
      
      showToast('Profile updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast(error.message || 'Failed to update profile', 'error');
    } finally {
      setUpdatingProfile(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setChangingPassword(true);
    setErrors({});

    try {
      // Validate passwords
      if (passwordData.new_password !== passwordData.confirm_password) {
        setErrors({ confirm_password: 'Passwords do not match' });
        return;
      }

      if (passwordData.new_password.length < 8) {
        setErrors({ new_password: 'Password must be at least 8 characters long' });
        return;
      }

      // Change password
      await authAPI.changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });

      showToast('Password changed successfully!', 'success');
      
      // Clear password form
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      setPasswordStrength('');
      
    } catch (error) {
      console.error('Error changing password:', error);
      showToast(error.message || 'Failed to change password', 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  // Handle input changes
  const handleProfileChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePasswordChangeInput = (field, value) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'new_password') {
      setPasswordStrength(checkPasswordStrength(value));
    }
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 'strong': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'weak': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getPasswordStrengthText = () => {
    switch (passwordStrength) {
      case 'strong': return 'Strong password';
      case 'medium': return 'Medium strength';
      case 'weak': return 'Weak password';
      default: return 'Enter a password';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-gray-600 mt-1">Manage your profile and notification preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile Settings */}
        <div className="space-y-6">
          {/* Personal Information */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center mb-6">
              <User className="w-6 h-6 text-blue-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
            </div>
            
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={profileData.full_name}
                  onChange={(e) => handleProfileChange('full_name', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => handleProfileChange('email', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="flex items-center">
                  <Phone className="w-5 h-5 text-gray-400 mr-2" />
                  <input
                    type="tel"
                    value={profileData.phone_number}
                    onChange={(e) => handleProfileChange('phone_number', e.target.value)}
                    placeholder="+254712345678"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                {errors.phone_number && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone_number}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Your M-Pesa registered phone number for payments
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emergency Contact
                </label>
                <div className="flex items-center">
                  <Phone className="w-5 h-5 text-gray-400 mr-2" />
                  <input
                    type="tel"
                    value={profileData.emergency_contact}
                    onChange={(e) => handleProfileChange('emergency_contact', e.target.value)}
                    placeholder="+254798765432"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                {errors.emergency_contact && (
                  <p className="mt-1 text-sm text-red-600">{errors.emergency_contact}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={updatingProfile}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updatingProfile ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Update Profile
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Password Change */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center mb-6">
              <Shield className="w-6 h-6 text-green-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Change Password</h2>
            </div>
            
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordData.current_password}
                    onChange={(e) => handlePasswordChangeInput('current_password', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.new_password}
                    onChange={(e) => handlePasswordChangeInput('new_password', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {passwordData.new_password && (
                  <div className={`mt-2 text-sm ${getPasswordStrengthColor()}`}>
                    {getPasswordStrengthText()}
                  </div>
                )}
                {errors.new_password && (
                  <p className="mt-1 text-sm text-red-600">{errors.new_password}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirm_password}
                    onChange={(e) => handlePasswordChangeInput('confirm_password', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirm_password && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirm_password}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={changingPassword}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {changingPassword ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Changing Password...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5 mr-2" />
                    Change Password
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center mb-6">
              <Bell className="w-6 h-6 text-purple-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Rent Reminders</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Reminder Method
                </label>
                <div className="space-y-3">
                  <label className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="reminder_mode"
                      value="days_before"
                      checked={profileData.reminder_mode === 'days_before'}
                      onChange={(e) => handleProfileChange('reminder_mode', e.target.value)}
                      className="mt-1 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">Days Before Due Date</div>
                      <div className="text-sm text-gray-500 mt-1">
                        Receive reminders a specific number of days before rent is due
                      </div>
                      {profileData.reminder_mode === 'days_before' && (
                        <div className="mt-2 flex items-center space-x-2">
                          <input
                            type="number"
                            min="1"
                            max="30"
                            value={profileData.reminder_value}
                            onChange={(e) => handleProfileChange('reminder_value', parseInt(e.target.value))}
                            className="w-20 px-3 py-1 border border-gray-300 rounded text-sm"
                          />
                          <span className="text-sm text-gray-600">days before due date</span>
                        </div>
                      )}
                    </div>
                  </label>

                  <label className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="reminder_mode"
                      value="fixed_day"
                      checked={profileData.reminder_mode === 'fixed_day'}
                      onChange={(e) => handleProfileChange('reminder_mode', e.target.value)}
                      className="mt-1 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">Fixed Day of Month</div>
                      <div className="text-sm text-gray-500 mt-1">
                        Receive reminders on a specific day of each month
                      </div>
                      {profileData.reminder_mode === 'fixed_day' && (
                        <div className="mt-2 flex items-center space-x-2">
                          <input
                            type="number"
                            min="1"
                            max="31"
                            value={profileData.reminder_value}
                            onChange={(e) => handleProfileChange('reminder_value', parseInt(e.target.value))}
                            className="w-20 px-3 py-1 border border-gray-300 rounded text-sm"
                          />
                          <span className="text-sm text-gray-600">day of the month</span>
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Email Notifications</div>
                    <div className="text-sm text-gray-500">Receive rent reminders via email</div>
                  </div>
                  <div className="relative inline-block w-12 h-6">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="sr-only"
                    />
                    <div className="w-12 h-6 bg-blue-600 rounded-full shadow-inner"></div>
                    <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform translate-x-6"></div>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">SMS Notifications</div>
                    <div className="text-sm text-gray-500">Receive rent reminders via SMS</div>
                  </div>
                  <div className="relative inline-block w-12 h-6">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="sr-only"
                    />
                    <div className="w-12 h-6 bg-blue-600 rounded-full shadow-inner"></div>
                    <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform translate-x-6"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center mb-6">
              <Smartphone className="w-6 h-6 text-gray-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Account Information</h2>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Account Type</span>
                <span className="font-medium text-gray-900">Tenant</span>
              </div>
              
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Member Since</span>
                <span className="font-medium text-gray-900">
                  {user?.date_joined ? new Date(user.date_joined).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Status</span>
                <span className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
                  <span className="font-medium text-green-600">Active</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantSettings;