import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { 
  X, 
  Send,
  Users,
  Search,
  Check,
  Mail
} from 'lucide-react';

const EmailFormModal = ({ isOpen, onClose }) => {
  const { tenants, tenantsLoading } = useAppContext();
  const { showToast } = useToast();

  const [emailData, setEmailData] = useState({
    recipients: 'all',
    selectedTenants: [],
    subject: '',
    message: ''
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Filter tenants based on search
  const filteredTenants = tenants.filter(tenant =>
    tenant.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.unit?.unit_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setEmailData({
        recipients: 'all',
        selectedTenants: [],
        subject: '',
        message: ''
      });
      setSearchTerm('');
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!emailData.subject.trim() || !emailData.message.trim()) {
      showToast('Please fill in both subject and message', 'error');
      return;
    }

    if (emailData.recipients === 'specific' && emailData.selectedTenants.length === 0) {
      showToast('Please select at least one tenant', 'error');
      return;
    }

    setIsSending(true);

    try {
      // Prepare payload for Django backend
      const payload = {
        subject: emailData.subject.trim(),
        message: emailData.message.trim(),
        send_to_all: emailData.recipients === 'all',
        tenants: emailData.recipients === 'specific' ? emailData.selectedTenants : []
      };

      // TODO: Uncomment and integrate with your actual Django endpoint
      /*
      const response = await fetch('/api/communications/send-email/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }
      */

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      const recipientCount = emailData.recipients === 'all' 
        ? tenants.length 
        : emailData.selectedTenants.length;

      showToast(`Email sent successfully to ${recipientCount} tenant(s)`, 'success');
      onClose();
    } catch (error) {
      console.error('Error sending email:', error);
      showToast('Failed to send email. Please try again.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleTenantSelection = (tenantId) => {
    setEmailData(prev => ({
      ...prev,
      selectedTenants: prev.selectedTenants.includes(tenantId)
        ? prev.selectedTenants.filter(id => id !== tenantId)
        : [...prev.selectedTenants, tenantId]
    }));
  };

  const selectAllTenants = () => {
    setEmailData(prev => ({
      ...prev,
      selectedTenants: filteredTenants.map(tenant => tenant.id)
    }));
  };

  const clearSelection = () => {
    setEmailData(prev => ({
      ...prev,
      selectedTenants: []
    }));
  };

  const getSelectedTenantsCount = () => {
    if (emailData.recipients === 'all') {
      return tenants.length;
    }
    return emailData.selectedTenants.length;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Mail className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Send Email to Tenants</h2>
              <p className="text-sm text-gray-600 mt-1">
                Communicate with your tenants via email
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg transition-colors"
            disabled={isSending}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Recipients Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Send To
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setEmailData(prev => ({ ...prev, recipients: 'all' }))}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    emailData.recipients === 'all'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-5 h-5" />
                    <span className="font-medium">All Tenants</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Send to all {tenants.length} tenants in the system
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setEmailData(prev => ({ ...prev, recipients: 'specific' }))}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    emailData.recipients === 'specific'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-5 h-5" />
                    <span className="font-medium">Specific Tenants</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Select individual tenants to receive the email
                  </p>
                </button>
              </div>
            </div>

            {/* Tenant Selection */}
            {emailData.recipients === 'specific' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-700">
                    Select Tenants ({emailData.selectedTenants.length} selected)
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAllTenants}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={clearSelection}
                      className="text-xs text-gray-600 hover:text-gray-800 font-medium"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search tenants by name, email, or unit..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Tenants List */}
                <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                  {tenantsLoading ? (
                    <div className="p-4 text-center text-gray-500">
                      Loading tenants...
                    </div>
                  ) : filteredTenants.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      {searchTerm ? 'No tenants match your search' : 'No tenants available'}
                    </div>
                  ) : (
                    filteredTenants.map(tenant => (
                      <label
                        key={tenant.id}
                        className={`flex items-center p-3 border-b border-gray-100 last:border-b-0 cursor-pointer transition-colors ${
                          emailData.selectedTenants.includes(tenant.id)
                            ? 'bg-blue-50'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={emailData.selectedTenants.includes(tenant.id)}
                          onChange={() => handleTenantSelection(tenant.id)}
                          className="hidden"
                        />
                        <div className={`w-5 h-5 border-2 rounded flex items-center justify-center mr-3 transition-colors ${
                          emailData.selectedTenants.includes(tenant.id)
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-gray-300'
                        }`}>
                          {emailData.selectedTenants.includes(tenant.id) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {tenant.full_name}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="truncate">{tenant.email}</span>
                            {tenant.unit && (
                              <>
                                <span>•</span>
                                <span>Unit {tenant.unit.unit_number}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <input
                type="text"
                required
                value={emailData.subject}
                onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter email subject..."
                disabled={isSending}
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                required
                rows={6}
                value={emailData.message}
                onChange={(e) => setEmailData(prev => ({ ...prev, message: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Type your message here..."
                disabled={isSending}
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            disabled={isSending}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSending || !emailData.subject.trim() || !emailData.message.trim()}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send to {getSelectedTenantsCount()} Tenant{getSelectedTenantsCount() !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailFormModal;