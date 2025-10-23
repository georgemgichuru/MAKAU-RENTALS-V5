import React from 'react';
import { AlertTriangle, WifiOff, CreditCard, Phone, User, Server, Clock, HelpCircle, RefreshCw, Shield } from 'lucide-react';

// Main M-Pesa Error Handler Component
export const MPesaErrorHandler = ({ 
  errorCode, 
  errorMessage, 
  className = "", 
  showRetry = false,
  onRetry = null,
  showRawMessage = true 
}) => {
  const getErrorDetails = (code) => {
    const errorMap = {
      // Authentication & Token Errors
      400: {
        title: "Invalid Credentials / Bad Request",
        description: "Wrong consumer key/secret or missing/malformed parameters in JSON body",
        icon: AlertTriangle,
        category: "Authentication",
        color: "red",
        action: "Check your API credentials and request parameters",
        retryable: false
      },
      401: {
        title: "Unauthorized",
        description: "Access token expired or missing",
        icon: User,
        category: "Authentication",
        color: "red",
        action: "Refresh your access token and try again",
        retryable: true
      },
      "InvalidAccessToken": {
        title: "Invalid Access Token",
        description: "Token is not valid for the request",
        icon: User,
        category: "Authentication",
        color: "red",
        action: "Generate a new access token",
        retryable: true
      },
      
      // Request Format Errors
      1032: {
        title: "Invalid Amount",
        description: "Amount is not valid (e.g., negative or too many decimals)",
        icon: CreditCard,
        category: "Request Format",
        color: "orange",
        action: "Enter a valid positive amount with proper formatting",
        retryable: true
      },
      1037: {
        title: "Invalid Phone Number",
        description: "MSISDN format wrong (must be 2547XXXXXXXX)",
        icon: Phone,
        category: "Request Format",
        color: "orange",
        action: "Use the correct phone number format: 2547XXXXXXXX",
        retryable: true
      },
      1001: {
        title: "Invalid Account Number",
        description: "Wrong format or not matching expected pattern",
        icon: User,
        category: "Request Format",
        color: "orange",
        action: "Check your account number format",
        retryable: true
      },
      
      // Business Rule Errors
      2001: {
        title: "Insufficient Funds",
        description: "Customer's M-Pesa account doesn't have enough balance",
        icon: CreditCard,
        category: "Business Rule",
        color: "yellow",
        action: "Ask the customer to top up their M-Pesa account",
        retryable: true
      },
      2002: {
        title: "Below Minimum Transaction Value",
        description: "Amount is too small for this transaction",
        icon: CreditCard,
        category: "Business Rule",
        color: "yellow",
        action: "Increase the amount to meet the minimum requirement",
        retryable: true
      },
      2003: {
        title: "Above Maximum Transaction Value",
        description: "Amount exceeds the maximum allowed limit",
        icon: CreditCard,
        category: "Business Rule",
        color: "yellow",
        action: "Reduce the amount to within the allowed limit",
        retryable: true
      },
      2006: {
        title: "Unresolved Primary Party",
        description: "Wrong shortcode (till/paybill not registered)",
        icon: AlertTriangle,
        category: "Business Rule",
        color: "yellow",
        action: "Verify your business shortcode is correct and active",
        retryable: false
      },
      2007: {
        title: "Unresolved Receiver Party",
        description: "Destination shortcode doesn't exist",
        icon: AlertTriangle,
        category: "Business Rule",
        color: "yellow",
        action: "Check the recipient's phone number or paybill number",
        retryable: true
      },
      2026: {
        title: "Merchant Not Allowed",
        description: "Merchant account not allowed for that operation",
        icon: User,
        category: "Business Rule",
        color: "yellow",
        action: "Contact M-Pesa support to enable this operation",
        retryable: false
      },
      
      // System & Network Errors
      500: {
        title: "Internal Server Error",
        description: "Server error on Safaricom's end",
        icon: Server,
        category: "System",
        color: "purple",
        action: "Wait a few minutes and try again",
        retryable: true
      },
      503: {
        title: "Service Unavailable",
        description: "M-Pesa service is temporarily down",
        icon: Server,
        category: "System",
        color: "purple",
        action: "Try again after some time",
        retryable: true
      },
      "RequestTimeout": {
        title: "Request Timeout",
        description: "Network interruption or API took too long to respond",
        icon: Clock,
        category: "System",
        color: "purple",
        action: "Check your internet connection and try again",
        retryable: true
      },
      "ConnectionError": {
        title: "Unable to Connect to Host",
        description: "Wrong base URL (check if using sandbox vs production)",
        icon: WifiOff,
        category: "System",
        color: "purple",
        action: "Verify your API endpoint URL",
        retryable: false
      },
      
      // Callback/Processing Errors
      "CallbackTimeout": {
        title: "No Response at Callback URL",
        description: "Your server didn't acknowledge Safaricom's callback",
        icon: WifiOff,
        category: "Callback",
        color: "blue",
        action: "Check your server's callback endpoint",
        retryable: false
      },
      "InvalidCallback": {
        title: "Invalid Callback Response",
        description: "Your server returned the wrong response structure",
        icon: AlertTriangle,
        category: "Callback",
        color: "blue",
        action: "Fix your callback response format",
        retryable: false
      },
      "DuplicateTransaction": {
        title: "Duplicate Transaction",
        description: "Same transaction has been submitted twice",
        icon: AlertTriangle,
        category: "Processing",
        color: "gray",
        action: "Wait for the first transaction to complete",
        retryable: false
      },
      
      // Custom Errors for our application
      "PaymentPending": {
        title: "Payment Processing",
        description: "Your payment is being processed. Please wait for confirmation.",
        icon: Clock,
        category: "Processing",
        color: "blue",
        action: "Check your phone for M-Pesa prompt",
        retryable: false
      },
      "NetworkError": {
        title: "Network Connection Issue",
        description: "Unable to connect to the payment service",
        icon: WifiOff,
        category: "Network",
        color: "purple",
        action: "Check your internet connection and try again",
        retryable: true
      }
    };
    
    return errorMap[code] || {
      title: "Unknown Error",
      description: errorMessage || "An unexpected error occurred",
      icon: HelpCircle,
      category: "Unknown",
      color: "gray",
      action: "Please try again or contact support if the issue persists",
      retryable: true
    };
  };
  
  const error = getErrorDetails(errorCode);
  const Icon = error.icon;
  
  const colorMap = {
    red: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-800",
      desc: "text-red-700",
      icon: "text-red-500",
      button: "bg-red-600 hover:bg-red-700"
    },
    orange: {
      bg: "bg-orange-50",
      border: "border-orange-200",
      text: "text-orange-800",
      desc: "text-orange-700",
      icon: "text-orange-500",
      button: "bg-orange-600 hover:bg-orange-700"
    },
    yellow: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      text: "text-yellow-800",
      desc: "text-yellow-700",
      icon: "text-yellow-600",
      button: "bg-yellow-600 hover:bg-yellow-700"
    },
    purple: {
      bg: "bg-purple-50",
      border: "border-purple-200",
      text: "text-purple-800",
      desc: "text-purple-700",
      icon: "text-purple-500",
      button: "bg-purple-600 hover:bg-purple-700"
    },
    blue: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-800",
      desc: "text-blue-700",
      icon: "text-blue-500",
      button: "bg-blue-600 hover:bg-blue-700"
    },
    gray: {
      bg: "bg-gray-50",
      border: "border-gray-200",
      text: "text-gray-800",
      desc: "text-gray-700",
      icon: "text-gray-500",
      button: "bg-gray-600 hover:bg-gray-700"
    }
  };
  
  const colors = colorMap[error.color];
  
  return (
    <div className={`${colors.bg} ${colors.border} border rounded-lg p-4 ${className}`}>
      <div className="flex items-start space-x-3">
        <Icon className={`h-5 w-5 ${colors.icon} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
            <div className="flex items-center space-x-2">
              <h3 className={`${colors.text} font-medium text-sm sm:text-base`}>
                {errorCode ? `Error ${errorCode}: ${error.title}` : error.title}
              </h3>
              <span className={`px-2 py-1 text-xs rounded-full ${colors.bg} ${colors.border} ${colors.desc}`}>
                {error.category}
              </span>
            </div>
            
            {showRetry && error.retryable && onRetry && (
              <button
                onClick={onRetry}
                className={`${colors.button} text-white px-3 py-1 rounded text-sm flex items-center space-x-1 transition-colors`}
              >
                <RefreshCw className="h-3 w-3" />
                <span>Retry</span>
              </button>
            )}
          </div>
          
          <p className={`${colors.desc} text-sm mb-2`}>
            {error.description}
          </p>
          
          <div className={`${colors.desc} text-xs bg-white p-2 rounded border mb-2`}>
            <strong>Suggested Action:</strong> {error.action}
          </div>
          
          {showRawMessage && errorMessage && errorMessage !== error.description && (
            <details className="mt-2">
              <summary className={`${colors.desc} text-xs cursor-pointer hover:underline`}>
                Technical Details
              </summary>
              <pre className={`${colors.desc} text-xs mt-1 bg-white p-2 rounded border overflow-x-auto font-mono`}>
                {errorMessage}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
};

// Compact version for inline use
export const MPesaErrorInline = ({ errorCode, errorMessage, className = "" }) => {
  const error = getErrorDetails(errorCode);
  const Icon = error.icon;
  
  return (
    <div className={`inline-flex items-center space-x-1 text-red-600 text-sm ${className}`}>
      <Icon className="h-4 w-4" />
      <span>{error.title}</span>
    </div>
  );
};

// Success handler for completed payments
export const MPesaSuccessHandler = ({ transactionId, amount, phoneNumber, className = "" }) => {
  return (
    <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start space-x-3">
        <Shield className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-green-800 font-medium">Payment Successful!</h3>
          <div className="text-green-700 text-sm space-y-1 mt-1">
            <p>Your payment of <strong>KSh {amount?.toLocaleString()}</strong> has been processed successfully.</p>
            {transactionId && <p>Transaction ID: <code className="bg-green-100 px-1 rounded">{transactionId}</code></p>}
            {phoneNumber && <p>Paid from: {phoneNumber}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

// Demo component showing all error types
export const MPesaErrorDemo = () => {
  const [retryCount, setRetryCount] = React.useState({});
  
  const handleRetry = (errorCode) => {
    setRetryCount(prev => ({
      ...prev,
      [errorCode]: (prev[errorCode] || 0) + 1
    }));
    console.log(`Retrying error: ${errorCode}`);
  };
  
  const demoErrors = [
    { code: 400, message: "Invalid request format" },
    { code: 401, message: "Token has expired" },
    { code: 1032, message: "Amount cannot be negative" },
    { code: 1037, message: "Phone number format is incorrect" },
    { code: 2001, message: "Customer has insufficient balance" },
    { code: 2003, message: "Amount exceeds daily limit" },
    { code: 500, message: "Server temporarily unavailable" },
    { code: "DuplicateTransaction", message: "Transaction already processed" },
    { code: "PaymentPending", message: "Waiting for user confirmation" }
  ];
  
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">M-Pesa API Error Handler</h1>
        <p className="text-gray-600">Comprehensive error handling for M-Pesa integration</p>
      </div>
      
      {/* Success Example */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Success Example</h2>
        <MPesaSuccessHandler 
          amount={2500}
          transactionId="LGR219G3V1"
          phoneNumber="254712345678"
        />
      </div>
      
      {/* Error Examples */}
      <h2 className="text-lg font-semibold text-gray-900 mb-3">Error Examples</h2>
      {demoErrors.map((error, index) => (
        <MPesaErrorHandler 
          key={index}
          errorCode={error.code}
          errorMessage={error.message}
          showRetry={true}
          onRetry={() => handleRetry(error.code)}
          showRawMessage={index === 0} // Show raw message only for first example
        />
      ))}
      
      {/* Usage Examples */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-3">Usage Examples:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Basic Usage</h4>
            <pre className="text-xs text-gray-700 bg-white p-3 rounded border overflow-x-auto">
{`<MPesaErrorHandler 
  errorCode={2001} 
  errorMessage="Insufficient balance" 
/>`}
            </pre>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">With Retry Button</h4>
            <pre className="text-xs text-gray-700 bg-white p-3 rounded border overflow-x-auto">
{`<MPesaErrorHandler 
  errorCode={500}
  showRetry={true}
  onRetry={() => handleRetry()}
/>`}
            </pre>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Success Handler</h4>
            <pre className="text-xs text-gray-700 bg-white p-3 rounded border overflow-x-auto">
{`<MPesaSuccessHandler 
  amount={2500}
  transactionId="LGR219G3V1"
  phoneNumber="254712345678"
/>`}
            </pre>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Inline Error</h4>
            <pre className="text-xs text-gray-700 bg-white p-3 rounded border overflow-x-auto">
{`<MPesaErrorInline 
  errorCode={1037}
  errorMessage="Invalid phone"
/>`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MPesaErrorDemo;