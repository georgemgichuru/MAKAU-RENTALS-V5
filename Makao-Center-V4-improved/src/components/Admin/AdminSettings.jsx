import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Smartphone,
  Monitor,
  Tablet,
  Calendar,
  ChevronRight
} from 'lucide-react';

const AdminSettings = () => {
  const navigate = useNavigate();
  const [selectedReminderDates, setSelectedReminderDates] = useState([]);
  const [reminderTemplate, setReminderTemplate] = useState({
    subject: 'Rent Reminder',
    message: `Dear tenant,\n\nThis is a reminder that your rent is due soon.\n\nPlease pay by the due date to avoid penalties.\n\nThank you,\nMakao Center`
  });

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

  const handleDateToggle = (date) => {
    setSelectedReminderDates(prev => 
      prev.includes(date) 
        ? prev.filter(d => d !== date)
        : [...prev, date]
    );
  };

  const handleSaveReminders = () => {
    if (selectedReminderDates.length === 0) {
      alert('Please select at least one reminder date.');
      return;
    }
    
    console.log('Saving reminder settings:', {
      dates: selectedReminderDates,
      template: reminderTemplate
    });
    
    alert(`Reminder settings saved successfully!\n\nSelected dates: ${selectedReminderDates.join(', ')}\nTemplate will be sent automatically on these dates.`);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
      <p className="text-gray-600">Manage your account settings and preferences</p>

      {/* Billing Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Billing</h2>
        
        <div className="space-y-4">
          {/* Current Plan Info */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600 mb-1">Current Plan</p>
                <p className="text-lg font-semibold text-gray-900">One-Time Purchase</p>
                <p className="text-sm text-gray-600 mt-1">Up to 50 units • Lifetime access</p>
              </div>
              <span className="bg-green-50 text-green-700 text-xs font-medium px-2 py-1 rounded">
                Active
              </span>
            </div>
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
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              Save Reminder Settings
            </button>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Change Password</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
            <input
              type="password"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
            <input
              type="password"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
            <input
              type="password"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center">
            <input type="checkbox" className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 mr-2" />
            <label className="text-sm text-gray-700">Enable Two-Factor Authentication</label>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              Save Security Settings
            </button>
          </div>
        </div>
      </div>

      {/* Login History & Active Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Login History</h3>
          <p className="text-gray-600 text-sm mb-4">Recent login activities on your account</p>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <div>
                <p className="font-medium text-sm">2025-10-17 14:30 UTC</p>
                <p className="text-xs text-gray-600">192.168.1.1</p>
              </div>
              <span className="text-xs text-gray-500">Nairobi, KE</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <div>
                <p className="font-medium text-sm">2025-10-16 09:15 UTC</p>
                <p className="text-xs text-gray-600">10.0.0.1</p>
              </div>
              <span className="text-xs text-gray-500">Nairobi, KE</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <div>
                <p className="font-medium text-sm">2025-10-15 22:45 UTC</p>
                <p className="text-xs text-gray-600">172.16.0.1</p>
              </div>
              <span className="text-xs text-gray-500">Mombasa, KE</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Active Sessions</h3>
          <p className="text-gray-600 text-sm mb-4">Currently active sessions on your account</p>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <div className="flex items-center">
                <Monitor className="w-5 h-5 mr-3 text-gray-600" />
                <div>
                  <p className="font-medium text-sm">Laptop</p>
                  <p className="text-xs text-gray-600">Chrome</p>
                </div>
              </div>
              <span className="text-xs text-gray-500">Windows 11</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <div className="flex items-center">
                <Smartphone className="w-5 h-5 mr-3 text-gray-600" />
                <div>
                  <p className="font-medium text-sm">Smartphone</p>
                  <p className="text-xs text-gray-600">Safari</p>
                </div>
              </div>
              <span className="text-xs text-gray-500">iOS 16</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <div className="flex items-center">
                <Tablet className="w-5 h-5 mr-3 text-gray-600" />
                <div>
                  <p className="font-medium text-sm">Tablet</p>
                  <p className="text-xs text-gray-600">Firefox</p>
                </div>
              </div>
              <span className="text-xs text-gray-500">Android 13</span>
            </div>
          </div>
          <button className="w-full mt-4 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 text-sm font-medium">
            Log Out All Other Sessions
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;