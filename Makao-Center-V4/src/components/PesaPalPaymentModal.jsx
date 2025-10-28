import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * PesaPal Payment Modal - Embedded Iframe Integration
 * 
 * Usage:
 * <PesaPalPaymentModal
 *   isOpen={showModal}
 *   redirectUrl={pesapalUrl}
 *   onClose={() => setShowModal(false)}
 *   onPaymentComplete={(paymentId) => handlePaymentSuccess(paymentId)}
 *   paymentId={123}
 * />
 */
const PesaPalPaymentModal = ({ 
  isOpen, 
  redirectUrl, 
  onClose, 
  onPaymentComplete,
  paymentId,
  amount 
}) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    // Listen for messages from the iframe
    const handleMessage = (event) => {
      // Security: Only accept messages from PesaPal domains
      if (!event.origin.includes('pesapal.com')) return;

      console.log('Message from PesaPal iframe:', event.data);

      // PesaPal sends payment completion messages
      if (event.data.status === 'completed' || event.data.status === 'success') {
        onPaymentComplete?.(paymentId);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [isOpen, paymentId, onPaymentComplete]);

  // Monitor URL changes in iframe to detect payment completion
  useEffect(() => {
    if (!isOpen) return;

    const checkPaymentStatus = setInterval(() => {
      const iframe = document.getElementById('pesapal-iframe');
      if (!iframe) return;

      try {
        // Try to read iframe URL (will fail due to CORS, but we can check localStorage)
        const pendingPaymentId = localStorage.getItem('pending_payment_id');
        const paymentCompleted = localStorage.getItem(`payment_${pendingPaymentId}_completed`);
        
        if (paymentCompleted === 'true') {
          onPaymentComplete?.(pendingPaymentId);
          localStorage.removeItem(`payment_${pendingPaymentId}_completed`);
        }
      } catch (e) {
        // Expected - cross-origin restrictions
      }
    }, 2000);

    return () => clearInterval(checkPaymentStatus);
  }, [isOpen, onPaymentComplete]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Complete Payment</h2>
            {amount && (
              <p className="text-sm text-gray-600">Amount: KES {amount.toLocaleString()}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Close payment window"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading payment gateway...</p>
            </div>
          </div>
        )}

        {/* PesaPal Iframe */}
        <div className="flex-1 overflow-hidden">
          <iframe
            id="pesapal-iframe"
            src={redirectUrl}
            className="w-full h-full border-0"
            title="PesaPal Payment"
            onLoad={() => setIsLoading(false)}
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation"
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2 text-gray-600">
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Secured by PesaPal</span>
            </div>
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              Cancel Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PesaPalPaymentModal;
