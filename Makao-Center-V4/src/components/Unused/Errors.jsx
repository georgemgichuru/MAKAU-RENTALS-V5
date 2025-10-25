import React from 'react';
import { AlertTriangle, WifiOff, CreditCard, Phone, User, Server, Clock } from 'lucide-react';
// Main M-Pesa Error Handler Component
export const MPesaErrorHandler = ({ errorCode, errorMessage, className = "" }) => {
    const getErrorDetails = (code) => {
        const errorMap = {
            // Authentication & Token Errors
            400: {
                title: "Invalid Credentials / Bad Request",
                description: "Wrong consumer key/secret or missing/malformed parameters in JSON body",
                icon: AlertTriangle,
                category: "Authentication",
                color: "red"
            },
            401: {
                title: "Unauthorized",
                description: "Access token expired or missing",
                icon: User,
                category: "Authentication",
                color: "red"
            },
            "InvalidAccessToken": {
                title: "Invalid Access Token",
                description: "Token is not valid for the request",
                icon: User,
                category: "Authentication",
                color: "red"
            },
            
            // Request Format Errors
            1032: {
                title: "Invalid Amount",
                description: "Amount is not valid (e.g., negative or too many decimals)",
                icon: CreditCard,
                category: "Request Format",
                color: "orange"
            },
            1037: {
                title: "Invalid Phone Number",
                description: "MSISDN format wrong (must be 2547XXXXXXXX)",
                icon: Phone,
                category: "Request Format",
                color: "orange"
            },
            1001: {
                title: "Invalid Account Number",
                description: "Wrong format or not matching expected pattern",
                icon: User,
                category: "Request Format",
                color: "orange"
            },
            
            // Business Rule Errors
            2001: {
                title: "Insufficient Funds",
                description: "Customer's M-Pesa account doesn't have enough balance",
                icon: CreditCard,
                category: "Business Rule",
                color: "yellow"
            },
            2002: {
                title: "Below Minimum Transaction Value",
                description: "Amount is too small for this transaction",
                icon: CreditCard,
                category: "Business Rule",
                color: "yellow"
            },
            2003: {
                title: "Above Maximum Transaction Value",
                description: "Amount exceeds the maximum allowed limit",
                icon: CreditCard,
                category: "Business Rule",
                color: "yellow"
            },
            2006: {
                title: "Unresolved Primary Party",
                description: "Wrong shortcode (till/paybill not registered)",
                icon: AlertTriangle,
                category: "Business Rule",
                color: "yellow"
            },
            2007: {
                title: "Unresolved Receiver Party",
                description: "Destination shortcode doesn't exist",
                icon: AlertTriangle,
                category: "Business Rule",
                color: "yellow"
            },
            2026: {
                title: "Merchant Not Allowed",
                description: "Merchant account not allowed for that operation",
                icon: User,
                category: "Business Rule",
                color: "yellow"
            },
            
            // System & Network Errors
            500: {
                title: "Internal Server Error",
                description: "Server error on Safaricom's end",
                icon: Server,
                category: "System",
                color: "purple"
            },
            "RequestTimeout": {
                title: "Request Timeout",
                description: "Network interruption or API took too long to respond",
                icon: Clock,
                category: "System",
                color: "purple"
            },
            "ConnectionError": {
                title: "Unable to Connect to Host",
                description: "Wrong base URL (check if using sandbox vs production)",
                icon: WifiOff,
                category: "System",
                color: "purple"
            },
            
            // Callback/Processing Errors
            "CallbackTimeout": {
                title: "No Response at Callback URL",
                description: "Your server didn't acknowledge Safaricom's callback",
                icon: WifiOff,
                category: "Callback",
                color: "blue"
            },
            "InvalidCallback": {
                title: "Invalid Callback Response",
                description: "Your server returned the wrong response structure",
                icon: AlertTriangle,
                category: "Callback",
                color: "blue"
            },
            "DuplicateTransaction": {
                title: "Duplicate Transaction",
                description: "Same transaction has been submitted twice",
                icon: AlertTriangle,
                category: "Processing",
                color: "gray"
            }
        };
        
        return errorMap[code] || {
            title: "Unknown Error",
            description: errorMessage || "An unexpected error occurred",
            icon: AlertTriangle,
            category: "Unknown",
            color: "gray"
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
            icon: "text-red-500"
        },
        orange: {
            bg: "bg-orange-50",
            border: "border-orange-200",
            text: "text-orange-800",
            desc: "text-orange-700",
            icon: "text-orange-500"
        },
        yellow: {
            bg: "bg-yellow-50",
            border: "border-yellow-200",
            text: "text-yellow-800",
            desc: "text-yellow-700",
            icon: "text-yellow-600"
        },
        purple: {
            bg: "bg-purple-50",
            border: "border-purple-200",
            text: "text-purple-800",
            desc: "text-purple-700",
            icon: "text-purple-500"
        },
        blue: {
            bg: "bg-blue-50",
            border: "border-blue-200",
            text: "text-blue-800",
            desc: "text-blue-700",
            icon: "text-blue-500"
        },
        gray: {
            bg: "bg-gray-50",
            border: "border-gray-200",
            text: "text-gray-800",
            desc: "text-gray-700",
            icon: "text-gray-500"
        }
    };
    
    const colors = colorMap[error.color];
    
    return (
        <div className={`${colors.bg} ${colors.border} border rounded-lg p-4 ${className}`}>
            <div className="flex items-start space-x-3">
                <Icon className={`h-5 w-5 ${colors.icon} flex-shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                        <h3 className={`${colors.text} font-medium`}>
                            Error {errorCode}: {error.title}
                        </h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${colors.bg} ${colors.border} ${colors.desc}`}>
                            {error.category}
                        </span>
                    </div>
                    <p className={`${colors.desc} text-sm mt-1`}>
                        {error.description}
                    </p>
                    {errorMessage && errorMessage !== error.description && (
                        <p className={`${colors.desc} text-xs mt-2 font-mono bg-white p-2 rounded border`}>
                            Raw message: {errorMessage}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

// Demo component showing all error types
export const MPesaErrorDemo = () => {
    const demoErrors = [
        { code: 400, message: "Invalid request format" },
        { code: 401, message: "Token has expired" },
        { code: 1032, message: "Amount cannot be negative" },
        { code: 1037, message: "Phone number format is incorrect" },
        { code: 2001, message: "Customer has insufficient balance" },
        { code: 2003, message: "Amount exceeds daily limit" },
        { code: 500, message: "Server temporarily unavailable" },
        { code: "DuplicateTransaction", message: "Transaction already processed" }
    ];
    
    return (
        <div className="max-w-4xl mx-auto p-6 space-y-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">M-Pesa API Error Handler Demo</h1>
            
            {demoErrors.map((error, index) => (
                <MPesaErrorHandler 
                    key={index}
                    errorCode={error.code}
                    errorMessage={error.message}
                />
            ))}
            
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Usage Example:</h3>
                <pre className="text-sm text-gray-700 bg-white p-3 rounded border overflow-x-auto">
{`// Basic usage
<MPesaErrorHandler errorCode={2001} />

// With custom message
<MPesaErrorHandler 
  errorCode={400} 
  errorMessage="Missing required field: Amount" 
/>

// With custom styling
<MPesaErrorHandler 
  errorCode={500} 
  className="mb-4 max-w-md" 
/>`}
                </pre>
            </div>
        </div>
    );
};

export default MPesaErrorDemo;
