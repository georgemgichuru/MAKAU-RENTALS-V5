import React, { useState } from 'react';
import { X, Send, Mail, MessageCircle } from 'lucide-react';

const InvoiceModal = ({ isOpen, onClose, tenant }) => {
  const [sendMethod, setSendMethod] = useState('both'); // 'email', 'whatsapp', or 'both'
  const [invoiceData, setInvoiceData] = useState({
    dueDate: '',
    additionalNotes: ''
  });

  if (!isOpen || !tenant) return null;

  // Template for invoice message
  const generateInvoiceMessage = () => {
    const dueDate = invoiceData.dueDate 
      ? new Date(invoiceData.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
      : 'the 5th of this month';

    return `Dear ${tenant.name},

This is a friendly reminder that your rent payment for Room ${tenant.room} is due.

Amount Due: KSh ${tenant.rentAmount.toLocaleString()}
Due Date: ${dueDate}

Please make your payment via M-PESA to ensure uninterrupted service.

${invoiceData.additionalNotes ? `\nAdditional Notes:\n${invoiceData.additionalNotes}` : ''}

Thank you for your prompt attention to this matter.

Best regards,
Property Management`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const message = generateInvoiceMessage();

    const payload = {
      tenantId: tenant.id,
      tenantName: tenant.name,
      tenantEmail: tenant.email,
      tenantPhone: tenant.phone,
      roomNumber: tenant.room,
      amount: tenant.rentAmount,
      dueDate: invoiceData.dueDate,
      sendMethod: sendMethod,
      message: message,
      additionalNotes: invoiceData.additionalNotes
    };

    try {
      // BACKEND INTEGRATION - Uncomment when backend is ready
      /*
      const response = await fetch('/api/v1/communications/send-invoice/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to send invoice');
      }

      const result = await response.json();
      */

      // SIMULATION
      console.log('Invoice payload ready for backend:', payload);
      
      let successMessage = 'Invoice sent successfully!\n\n';
      if (sendMethod === 'email' || sendMethod === 'both') {
        successMessage += `✓ Email sent to ${tenant.email}\n`;
      }
      if (sendMethod === 'whatsapp' || sendMethod === 'both') {
        successMessage += `✓ WhatsApp message sent to ${tenant.phone}\n`;
      }

      alert(successMessage);
      onClose();
      
      // Reset form
      setInvoiceData({ dueDate: '', additionalNotes: '' });
      setSendMethod('both');

    } catch (error) {
      console.error('Error sending invoice:', error);
      alert('Error sending invoice. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Send Rent Invoice</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tenant Info */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold mb-2">Tenant Details</h3>
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
              <p className="text-gray-600">Email:</p>
              <p className="font-medium">{tenant.email}</p>
            </div>
            <div>
              <p className="text-gray-600">Phone:</p>
              <p className="font-medium">{tenant.phone}</p>
            </div>
            <div>
              <p className="text-gray-600">Rent Amount:</p>
              <p className="font-medium text-green-600">KSh {tenant.rentAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Send Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Send Via</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="sendMethod"
                  value="both"
                  checked={sendMethod === 'both'}
                  onChange={(e) => setSendMethod(e.target.value)}
                  className="mr-2"
                />
                <Mail className="w-4 h-4 mr-1 text-blue-600" />
                <span className="mr-2">Email</span>
                <MessageCircle className="w-4 h-4 mr-1 text-green-600" />
                <span>WhatsApp (Both)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="sendMethod"
                  value="email"
                  checked={sendMethod === 'email'}
                  onChange={(e) => setSendMethod(e.target.value)}
                  className="mr-2"
                />
                <Mail className="w-4 h-4 mr-1 text-blue-600" />
                Email Only
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="sendMethod"
                  value="whatsapp"
                  checked={sendMethod === 'whatsapp'}
                  onChange={(e) => setSendMethod(e.target.value)}
                  className="mr-2"
                />
                <MessageCircle className="w-4 h-4 mr-1 text-green-600" />
                WhatsApp Only
              </label>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Due Date (Optional)
            </label>
            <input
              type="date"
              value={invoiceData.dueDate}
              onChange={(e) => setInvoiceData(prev => ({ ...prev, dueDate: e.target.value }))}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave blank to use default due date (5th of the month)
            </p>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={invoiceData.additionalNotes}
              onChange={(e) => setInvoiceData(prev => ({ ...prev, additionalNotes: e.target.value }))}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Add any special instructions or notes..."
            />
          </div>

          {/* Message Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message Preview</label>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                {generateInvoiceMessage()}
              </pre>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center"
            >
              <Send className="w-5 h-5 mr-2" />
              Send Invoice
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

export default InvoiceModal;