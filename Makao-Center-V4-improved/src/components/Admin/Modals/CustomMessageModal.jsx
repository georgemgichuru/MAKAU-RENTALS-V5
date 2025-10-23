import React, { useState } from 'react';
import { X, Send, MessageCircle } from 'lucide-react';

const CustomMessageModal = ({ isOpen, onClose, tenant }) => {
  const [messageType, setMessageType] = useState('custom'); // 'custom' or 'predefined'
  const [customMessage, setCustomMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');

  if (!isOpen || !tenant) return null;

  // Predefined message templates
  const messageTemplates = {
    rent_reminder: {
      title: 'Rent Reminder',
      message: `Dear ${tenant.name},\n\nThis is a friendly reminder that your rent payment for Room ${tenant.room} is due soon.\n\nAmount: KSh ${tenant.rentAmount.toLocaleString()}\n\nPlease ensure payment is made by the due date to avoid any late fees.\n\nThank you for your cooperation.`
    },
    maintenance_notice: {
      title: 'Maintenance Notice',
      message: `Dear ${tenant.name},\n\nWe would like to inform you that scheduled maintenance will be conducted in your area.\n\nRoom: ${tenant.room}\n\nWe apologize for any inconvenience this may cause. If you have any concerns, please contact us.\n\nThank you for your understanding.`
    },
    payment_confirmation: {
      title: 'Payment Received',
      message: `Dear ${tenant.name},\n\nWe have successfully received your rent payment for Room ${tenant.room}.\n\nAmount: KSh ${tenant.rentAmount.toLocaleString()}\n\nThank you for your prompt payment. Your receipt will be sent separately.\n\nBest regards.`
    },
    inspection_notice: {
      title: 'Unit Inspection Notice',
      message: `Dear ${tenant.name},\n\nThis is to inform you that a routine inspection will be conducted for Room ${tenant.room}.\n\nWe will contact you to schedule a convenient time. Please ensure the unit is accessible.\n\nThank you for your cooperation.`
    },
    welcome_message: {
      title: 'Welcome Message',
      message: `Dear ${tenant.name},\n\nWelcome to Room ${tenant.room}! We're delighted to have you as our tenant.\n\nMonthly Rent: KSh ${tenant.rentAmount.toLocaleString()}\n\nIf you have any questions or need assistance, please don't hesitate to contact us.\n\nWe hope you enjoy your stay!`
    }
  };

  const getMessage = () => {
    if (messageType === 'predefined' && selectedTemplate) {
      return messageTemplates[selectedTemplate].message;
    }
    return customMessage;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const message = getMessage();

    if (!message.trim()) {
      alert('Please enter a message or select a template');
      return;
    }

    const payload = {
      tenantId: tenant.id,
      tenantName: tenant.name,
      tenantPhone: tenant.phone,
      roomNumber: tenant.room,
      messageType: messageType,
      template: messageType === 'predefined' ? selectedTemplate : null,
      message: message
    };

    try {
      // BACKEND INTEGRATION - Uncomment when backend is ready
      /*
      const response = await fetch('/api/v1/communications/send-whatsapp-message/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const result = await response.json();
      */

      // SIMULATION
      console.log('Custom message payload ready for backend:', payload);
      
      alert(`WhatsApp message sent successfully to ${tenant.name}!\n\nPhone: ${tenant.phone}`);
      onClose();
      
      // Reset form
      setCustomMessage('');
      setSelectedTemplate('');
      setMessageType('custom');

    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border-2 ">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <MessageCircle className="w-6 h-6 text-green-600 mr-2" />
            <h2 className="text-2xl font-bold">Send Custom WhatsApp Message</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tenant Info */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold mb-2">Sending to:</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-600">Name:</p>
              <p className="font-medium">{tenant.name}</p>
            </div>
            <div>
              <p className="text-gray-600">Room:</p>
              <p className="font-medium">{tenant.room}</p>
            </div>
            <div>
              <p className="text-gray-600">Phone:</p>
              <p className="font-medium">{tenant.phone}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
                  onChange={(e) => setMessageType(e.target.value)}
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
                onChange={(e) => setSelectedTemplate(e.target.value)}
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

          {/* Custom Message Input */}
          {messageType === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Message
              </label>
              <textarea
                rows={8}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder={`Type your custom message to ${tenant.name}...`}
                required={messageType === 'custom'}
              />
            </div>
          )}

          {/* Message Preview */}
          {getMessage() && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message Preview
              </label>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                  {getMessage()}
                </pre>
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 flex items-center justify-center"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Send WhatsApp Message
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

        {/* Info Alert */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> This message will be sent via WhatsApp Business API to {tenant.phone}.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CustomMessageModal;