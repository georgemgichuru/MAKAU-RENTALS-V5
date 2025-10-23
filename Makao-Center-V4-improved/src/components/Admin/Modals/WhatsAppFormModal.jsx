import React, { useState } from 'react';
import { X, Send, MessageCircle } from 'lucide-react';

const WhatsAppFormModal = ({ isOpen, onClose, tenants }) => {
  const [whatsappData, setWhatsappData] = useState({
    recipients: 'all',
    selectedTenants: [],
    message: ''
  });

  const [sendingStatus, setSendingStatus] = useState({
    isSending: false,
    successCount: 0,
    failedCount: 0,
    results: []
  });

  // NEW: message type and template handling (from CustomMessageModal idea)
  const [messageType, setMessageType] = useState('custom'); // 'custom' or 'predefined'
  const [selectedTemplate, setSelectedTemplate] = useState('');

  // Predefined templates as functions that accept a tenant (or null -> generic message)
  const messageTemplates = {
    rent_reminder: {
      title: 'Rent Reminder',
      template: (tenant) => tenant
        ? `Dear ${tenant.name},\n\nThis is a friendly reminder that your rent payment for Room ${tenant.room} is due soon.\n\nAmount: KSh ${tenant.rentAmount?.toLocaleString() || '{amount}'}\n\nPlease ensure payment is made by the due date to avoid any late fees.\n\nThank you.`
        : `Dear tenant,\n\nThis is a friendly reminder that your rent payment is due soon.\n\nPlease ensure payment is made by the due date to avoid any late fees.\n\nThank you.`
    },
    maintenance_notice: {
      title: 'Maintenance Notice',
      template: (tenant) => tenant
        ? `Dear ${tenant.name},\n\nPlease be informed that scheduled maintenance will be conducted in Room ${tenant.room}.\n\nWe apologize for any inconvenience and will update you with timing details.\n\nThank you.`
        : `Dear tenant,\n\nPlease be informed that scheduled maintenance will be conducted in the property.\n\nWe apologize for any inconvenience and will update you with timing details.\n\nThank you.`
    },
    payment_confirmation: {
      title: 'Payment Confirmation',
      template: (tenant) => tenant
        ? `Dear ${tenant.name},\n\nWe have received your payment for Room ${tenant.room}.\n\nAmount: KSh ${tenant.rentAmount?.toLocaleString() || '{amount}'}.\n\nThank you for your prompt payment.`
        : `Dear tenant,\n\nWe have received your payment.\n\nThank you for your prompt payment.`
    },
    welcome_message: {
      title: 'Welcome Message',
      template: (tenant) => tenant
        ? `Dear ${tenant.name},\n\nWelcome to Room ${tenant.room}! Monthly Rent: KSh ${tenant.rentAmount?.toLocaleString() || '{amount}'}.\n\nIf you need any assistance, contact us.\n\nWe hope you enjoy your stay.`
        : `Dear tenant,\n\nWelcome! We're delighted to have you. If you need any assistance, please contact us.\n\nWe hope you enjoy your stay.`
    }
  };

  // Helper to build template message for the current selection
  const buildTemplateMessage = (templateKey) => {
    if (!templateKey) return '';
    const templateFn = messageTemplates[templateKey]?.template;
    if (!templateFn) return '';
    // If specific recipients and exactly one selected tenant -> personalize
    if (whatsappData.recipients === 'specific' && whatsappData.selectedTenants.length === 1) {
      const tenantId = whatsappData.selectedTenants[0];
      const tenant = tenants.find(t => t.id === tenantId);
      return templateFn(tenant || null);
    }
    // Otherwise return generic version (uses "Dear tenant")
    return templateFn(null);
  };

  // When template is selected, set message to generated template (admin can still edit)
  const handleTemplateChange = (key) => {
    setSelectedTemplate(key);
    setMessageType('predefined');
    const generated = buildTemplateMessage(key);
    setWhatsappData(prev => ({ ...prev, message: generated }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSendingStatus({ isSending: true, successCount: 0, failedCount: 0, results: [] });

    // Determine which tenants to send to
    let recipientTenants = [];
    if (whatsappData.recipients === 'all') {
      recipientTenants = tenants;
    } else {
      recipientTenants = tenants.filter(t => whatsappData.selectedTenants.includes(t.id));
    }

    // Filter tenants who have phone numbers
    const tenantsWithPhones = recipientTenants.filter(tenant => tenant.phone);

    // If using a predefined template and multiple tenants selected, generate personalized messages per tenant
    let messagesPerTenant = tenantsWithPhones.map(t => ({
      tenantId: t.id,
      name: t.name,
      phone: t.phone,
      message: whatsappData.message // default
    }));

    if (messageType === 'predefined' && selectedTemplate) {
      const templateFn = messageTemplates[selectedTemplate]?.template;
      if (templateFn) {
        messagesPerTenant = tenantsWithPhones.map(t => ({
          tenantId: t.id,
          name: t.name,
          phone: t.phone,
          message: templateFn(t)
        }));
      }
    }

    const payload = {
      recipients: whatsappData.recipients,
      selectedTenants: whatsappData.recipients === 'specific' ? whatsappData.selectedTenants : null,
      messageType,
      templateKey: messageType === 'predefined' ? selectedTemplate : null,
      message: whatsappData.message,
      phoneNumbers: messagesPerTenant.map(m => ({
        tenantId: m.tenantId,
        name: m.name,
        phone: m.phone,
        message: m.message
      }))
    };

    try {
      // BACKEND INTEGRATION - Uncomment when backend is ready
      /*
      const response = await fetch('/api/v1/communications/send-whatsapp/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to send WhatsApp messages');
      }

      const result = await response.json();
      setSendingStatus({
        isSending: false,
        successCount: result.sent,
        failedCount: result.failed,
        results: result.results
      });
      */

      // SIMULATION - Remove when backend is ready
      console.log('WhatsApp payload ready for backend:', payload);
      const simulatedResults = payload.phoneNumbers.map(p => {
        const hasWhatsApp = Math.random() > 0.2; // 80% success
        return {
          tenantId: p.tenantId,
          name: p.name,
          phone: p.phone,
          status: hasWhatsApp ? 'sent' : 'failed',
          error: hasWhatsApp ? null : 'No WhatsApp account found'
        };
      });

      const successCount = simulatedResults.filter(r => r.status === 'sent').length;
      const failedCount = simulatedResults.filter(r => r.status === 'failed').length;

      setSendingStatus({
        isSending: false,
        successCount,
        failedCount,
        results: simulatedResults
      });

      alert(`WhatsApp messages sent!\nSuccessful: ${successCount}\nFailed: ${failedCount}`);

      // Auto-close after 3 seconds if all successful
      if (failedCount === 0) {
        setTimeout(() => {
          onClose();
          setWhatsappData({ recipients: 'all', selectedTenants: [], message: '' });
          setSendingStatus({ isSending: false, successCount: 0, failedCount: 0, results: [] });
          setMessageType('custom');
          setSelectedTemplate('');
        }, 3000);
      }

    } catch (error) {
      console.error('Error sending WhatsApp messages:', error);
      alert('Error sending WhatsApp messages. Please try again.');
      setSendingStatus({ isSending: false, successCount: 0, failedCount: 0, results: [] });
    }
  };

  const handleTenantSelection = (tenantId) => {
    setWhatsappData(prev => ({
      ...prev,
      selectedTenants: prev.selectedTenants.includes(tenantId)
        ? prev.selectedTenants.filter(id => id !== tenantId)
        : [...prev.selectedTenants, tenantId]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border-2 border-black-500">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <MessageCircle className="w-6 h-6 text-green-600 mr-2" />
            <h2 className="text-2xl font-bold">Send WhatsApp Message</h2>
          </div>
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
                  checked={whatsappData.recipients === 'all'}
                  onChange={(e) => setWhatsappData(prev => ({ ...prev, recipients: e.target.value }))}
                  className="mr-2"
                />
                All Tenants with WhatsApp
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="recipients"
                  value="specific"
                  checked={whatsappData.recipients === 'specific'}
                  onChange={(e) => setWhatsappData(prev => ({ ...prev, recipients: e.target.value }))}
                  className="mr-2"
                />
                Specific Tenants
              </label>
            </div>
          </div>

          {whatsappData.recipients === 'specific' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Tenants</label>
              <div className="border rounded-lg p-3 max-h-40 overflow-y-auto">
                {tenants.map(tenant => (
                  <label key={tenant.id} className="flex items-center py-2">
                    <input
                      type="checkbox"
                      checked={whatsappData.selectedTenants.includes(tenant.id)}
                      onChange={() => handleTenantSelection(tenant.id)}
                      className="mr-2"
                    />
                    <span>{tenant.name} ({tenant.phone || 'No phone'})</span>
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
                Write Custom Message
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="messageType"
                  value="predefined"
                  checked={messageType === 'predefined'}
                  onChange={(e) => {
                    setMessageType(e.target.value);
                    // if switching to predefined and a template already selected, prefill
                    if (selectedTemplate) {
                      const generated = buildTemplateMessage(selectedTemplate);
                      setWhatsappData(prev => ({ ...prev, message: generated }));
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Template
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
            <textarea
              required
              rows={6}
              value={whatsappData.message}
              onChange={(e) => setWhatsappData(prev => ({ ...prev, message: e.target.value }))}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="Type your WhatsApp message here..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Messages will only be sent to tenants with valid phone numbers and WhatsApp accounts
            </p>
          </div>

          {/* Sending Status */}
          {sendingStatus.results.length > 0 && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-medium mb-2">Delivery Status</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {sendingStatus.results.map((result, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span>{result.name}</span>
                    {result.status === 'sent' ? (
                      <span className="text-green-600">✓ Sent</span>
                    ) : (
                      <span className="text-red-600" title={result.error}>✗ Failed</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={sendingStatus.isSending}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 flex items-center justify-center disabled:bg-gray-400"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              {sendingStatus.isSending ? 'Sending...' : 'Send WhatsApp Message'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={sendingStatus.isSending}
              className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 disabled:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </form>

        {/* Info Alert */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> WhatsApp messages will be sent through the WhatsApp Business API. 
            If a tenant doesn't have WhatsApp, the message will fail silently without error.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppFormModal;