import React from 'react'
import {useState} from 'react'
import { 
  X, 
  Send,
} from 'lucide-react';
const EmailFormModal = ({ isOpen, onClose, tenants }) => {
  const [emailData, setEmailData] = useState({
    recipients: 'all',
    selectedTenants: [],
    subject: '',
    message: ''
  });

  // NEW: message type and template handling
  const [messageType, setMessageType] = useState('custom'); // 'custom' or 'predefined'
  const [selectedTemplate, setSelectedTemplate] = useState('');

  // Predefined templates - generic when tenant is not provided, personalized when tenant object available
  const messageTemplates = {
    rent_reminder: {
      title: 'Rent Reminder',
      subject: (tenant) => tenant ? `Rent Reminder - Room ${tenant.room}` : 'Rent Reminder',
      template: (tenant) => tenant
        ? `Dear ${tenant.name},\n\nThis is a reminder that your rent for Room ${tenant.room} is due soon.\n\nAmount: KSh ${tenant.rentAmount?.toLocaleString() || '{amount}'}\n\nPlease pay by the due date to avoid penalties.\n\nThank you,\nMakao Center`
        : `Dear tenant,\n\nThis is a reminder that your rent is due soon.\n\nPlease pay by the due date to avoid penalties.\n\nThank you,\nMakao Center`
    },
    maintenance_notice: {
      title: 'Maintenance Notice',
      subject: () => 'Maintenance Notice',
      template: (tenant) => tenant
        ? `Dear ${tenant.name},\n\nPlease be informed that scheduled maintenance will be carried out in Room ${tenant.room}. We apologise for any inconvenience.\n\nRegards,\nMakao Center`
        : `Dear tenant,\n\nPlease be informed that scheduled maintenance will be carried out at the property. We apologise for any inconvenience.\n\nRegards,\nMakao Center`
    },
    payment_confirmation: {
      title: 'Payment Confirmation',
      subject: (tenant) => tenant ? `Payment Confirmation - Room ${tenant.room}` : 'Payment Confirmation',
      template: (tenant) => tenant
        ? `Dear ${tenant.name},\n\nWe have received your payment for Room ${tenant.room}.\n\nAmount: KSh ${tenant.rentAmount?.toLocaleString() || '{amount}'}.\n\nThank you for your prompt payment.\n\nBest,\nMakao Center`
        : `Dear tenant,\n\nWe have received your payment.\n\nThank you for your prompt payment.\n\nBest,\nMakao Center`
    },
    welcome_message: {
      title: 'Welcome Message',
      subject: () => 'Welcome to Makao Center',
      template: (tenant) => tenant
        ? `Dear ${tenant.name},\n\nWelcome to Room ${tenant.room}! We're pleased to have you. Monthly rent: KSh ${tenant.rentAmount?.toLocaleString() || '{amount}'}.\n\nIf you need assistance contact us.\n\nWarm regards,\nMakao Center`
        : `Dear tenant,\n\nWelcome! We're pleased to have you. If you need assistance contact us.\n\nWarm regards,\nMakao Center`
    },
    general_notice: {
      title: 'General Notice',
      subject: () => 'Notice from Management',
      template: () => `Dear tenant,\n\nThis is an important notice from management. Please check the details in the tenant portal or contact us for more information.\n\nRegards,\nMakao Center`
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

  // Build template message (personalize if single specific tenant selected)
  const buildTemplateMessage = (templateKey) => {
    if (!templateKey) return '';
    const tpl = messageTemplates[templateKey];
    if (!tpl) return '';
    // personalize when exactly 1 specific tenant is selected
    if (emailData.recipients === 'specific' && emailData.selectedTenants.length === 1) {
      const tenantId = emailData.selectedTenants[0];
      const tenant = tenants.find(t => t.id === tenantId);
      const subject = tpl.subject ? tpl.subject(tenant) : '';
      const message = tpl.template ? tpl.template(tenant) : '';
      return { subject, message };
    }
    // generic
    const subject = tpl.subject ? tpl.subject(null) : '';
    const message = tpl.template ? tpl.template(null) : '';
    return { subject, message };
  };

  const handleTemplateChange = (key) => {
    setSelectedTemplate(key);
    setMessageType('predefined');
    const generated = buildTemplateMessage(key);
    if (generated) {
      setEmailData(prev => ({
        ...prev,
        subject: generated.subject || '',
        message: generated.message || ''
      }));
    }
  };

  const getMessagePreview = () => {
    if (messageType === 'predefined' && selectedTemplate) {
      return emailData.message;
    }
    return emailData.message;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const payload = {
      recipients: emailData.recipients,
      selectedTenants: emailData.recipients === 'specific' ? emailData.selectedTenants : null,
      subject: emailData.subject,
      message: emailData.message,
      messageType,
      templateKey: messageType === 'predefined' ? selectedTemplate : null
    };

    try {
      // Prepare for Django API integration
      // const response = await fetch('/api/v1/communications/send-email/', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${localStorage.getItem('token')}`
      //   },
      //   body: JSON.stringify(payload)
      // });
      
      console.log('Email payload ready for backend:', payload);
      alert('Email sent successfully!');
      onClose();

      // reset
      setEmailData({ recipients: 'all', selectedTenants: [], subject: '', message: '' });
      setMessageType('custom');
      setSelectedTemplate('');
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Error sending email');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4 ">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border-2 border-black-500">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Send Email to Tenants</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Recipients</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="recipients"
                  value="all"
                  checked={emailData.recipients === 'all'}
                  onChange={(e) => setEmailData(prev => ({ ...prev, recipients: e.target.value }))}
                  className="mr-2"
                />
                All Tenants
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="recipients"
                  value="specific"
                  checked={emailData.recipients === 'specific'}
                  onChange={(e) => setEmailData(prev => ({ ...prev, recipients: e.target.value }))}
                  className="mr-2"
                />
                Specific Tenants
              </label>
            </div>
          </div>

          {emailData.recipients === 'specific' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Tenants</label>
              <div className="border rounded-lg p-3 max-h-40 overflow-y-auto">
                {tenants.map(tenant => (
                  <label key={tenant.id} className="flex items-center py-2">
                    <input
                      type="checkbox"
                      checked={emailData.selectedTenants.includes(tenant.id)}
                      onChange={() => handleTenantSelection(tenant.id)}
                      className="mr-2"
                    />
                    <span>{tenant.name} ({tenant.room})</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Message Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message Type</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="messageType"
                  value="custom"
                  checked={messageType === 'custom'}
                  onChange={(e) => setMessageType(e.target.value)}
                  className="mr-2"
                />
                Write Custom Email
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="messageType"
                  value="predefined"
                  checked={messageType === 'predefined'}
                  onChange={(e) => {
                    setMessageType(e.target.value);
                    if (selectedTemplate) {
                      const gen = buildTemplateMessage(selectedTemplate);
                      if (gen) setEmailData(prev => ({ ...prev, subject: gen.subject || '', message: gen.message || '' }));
                    }
                  }}
                  className="mr-2"
                />
                Use Predefined Template
              </label>
            </div>
          </div>

          {/* Predefined Template Selection */}
          {messageType === 'predefined' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Template</label>
              <select
                value={selectedTemplate}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required={messageType === 'predefined'}
              >
                <option value="">-- Select a Template --</option>
                {Object.keys(messageTemplates).map(key => (
                  <option key={key} value={key}>
                    {messageTemplates[key].title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            <input
              type="text"
              required
              value={emailData.subject}
              onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Email subject"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
            <textarea
              required
              rows={6}
              value={emailData.message}
              onChange={(e) => setEmailData(prev => ({ ...prev, message: e.target.value }))}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Type your message here..."
            />
          </div>

          {/* Message Preview */}
          {getMessagePreview() && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Message Preview</label>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">{getMessagePreview()}</pre>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center"
            >
              <Send className="w-5 h-5 mr-2" />
              Send Email
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmailFormModal;
 