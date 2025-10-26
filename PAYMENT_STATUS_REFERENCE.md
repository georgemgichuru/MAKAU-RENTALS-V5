# Payment Status Reference

## Payment Statuses

### Frontend Display Statuses

| Backend Status | Frontend Display | Color | Icon | Meaning |
|---------------|------------------|-------|------|---------|
| `pending` | Pending | 🟡 Yellow | ⏱️ | Payment initiated, waiting for M-Pesa |
| `completed` | Success | 🟢 Green | ✅ | Payment confirmed by M-Pesa |
| `failed` | Failed | 🔴 Red | ❌ | Payment failed or rejected |
| `cancelled` | Failed | 🔴 Red | ❌ | User cancelled payment |

### Status Flow

```
┌──────────┐
│ INITIATED│ → User submits payment form
└────┬─────┘
     ↓
┌──────────┐
│ PENDING  │ → STK push sent, waiting for user
└────┬─────┘
     ↓
┌────┴─────────────┐
│                  │
│  User Action     │
│                  │
└──┬─────────┬─────┘
   ↓         ↓
┌─────┐   ┌────────┐
│ PAY │   │ CANCEL │
└──┬──┘   └───┬────┘
   ↓          ↓
┌──────────┐ ┌────────┐
│COMPLETED │ │ FAILED │
└──────────┘ └────────┘
```

## M-Pesa Response Codes

### Success Codes
| Code | Meaning |
|------|---------|
| `0` | Success - STK push initiated |
| `0` (callback) | Payment successful |

### Error Codes
| Code | Meaning | User Action |
|------|---------|-------------|
| `1` | Insufficient funds | Add funds and retry |
| `2001` | Wrong PIN | Enter correct PIN |
| `1032` | Cancelled by user | Try again if accidental |
| `1037` | Timeout - no PIN entered | Complete payment faster |
| `1` (callback) | Payment failed | Check M-Pesa message for details |

## Failure Reasons

### Common Failure Reasons Stored

```python
# Backend stores these failure reasons
failure_reasons = {
    "insufficient_funds": "Insufficient M-Pesa balance",
    "wrong_pin": "Incorrect PIN entered",
    "user_cancelled": "Payment cancelled by user",
    "timeout": "Payment request timed out",
    "system_error": "M-Pesa system error",
    "invalid_phone": "Invalid phone number"
}
```

## Payment States in Database

### Payment Model Fields

```python
{
    "id": 123,
    "status": "completed",  # pending, completed, failed, cancelled
    "amount": 5000.00,
    "mpesa_receipt": "QAX7B2C3D4",  # M-Pesa transaction ID
    "mpesa_checkout_request_id": "ws_CO_123...",  # STK request ID
    "reference_number": "PAY-ABC123...",  # Internal reference
    "failure_reason": null,  # or error message
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T10:31:00Z"
}
```

## Polling Behavior

### Polling Configuration

```javascript
{
  interval: 3000,        // Poll every 3 seconds
  timeout: 300000,       // Stop after 5 minutes (300 seconds)
  maxAttempts: 100       // Maximum 100 polls (5 min ÷ 3 sec)
}
```

### Polling States

| State | Description | Action |
|-------|-------------|--------|
| **Active** | Payment pending, polling active | Continue polling |
| **Success** | Payment completed | Stop polling, show success |
| **Failed** | Payment failed | Stop polling, show error |
| **Timeout** | 5 minutes elapsed | Stop polling, show timeout message |

## UI States

### Button States

```javascript
// Button text based on state
{
  idle: "Pay with M-Pesa",
  processing: "Processing...",
  polling: "Verifying...",
  disabled: (greyed out)
}
```

### Status Box Colors

```javascript
{
  pending: {
    background: "bg-blue-50",
    border: "border-blue-100",
    text: "text-blue-800",
    icon: "spinner (rotating)"
  },
  success: {
    background: "bg-green-50",
    border: "border-green-100",
    text: "text-green-800",
    icon: "checkmark"
  },
  error: {
    background: "bg-rose-50",
    border: "border-rose-100",
    text: "text-rose-800",
    icon: "X"
  }
}
```

## API Response Formats

### STK Push Response (Success)

```json
{
  "success": true,
  "message": "STK push initiated successfully",
  "checkout_request_id": "ws_CO_15012025103045",
  "payment_id": 123
}
```

### STK Push Response (Error)

```json
{
  "error": "Failed to initiate STK push",
  "details": "Invalid phone number format",
  "response_data": {
    "ResponseCode": "400",
    "ResponseDescription": "Bad Request"
  }
}
```

### Payment Status Response

```json
{
  "id": 123,
  "payment_id": 123,
  "status": "completed",
  "amount": 5000.00,
  "mpesa_receipt": "QAX7B2C3D4",
  "created_at": "2025-01-15T10:30:00Z",
  "unit_id": 5,
  "unit_number": "A101",
  "failure_reason": null,
  "reference_number": "PAY-ABC123DEF456"
}
```

### Payment History Response

```json
[
  {
    "id": 123,
    "amount": 5000.00,
    "date": "2025-01-15T10:30:00Z",
    "status": "completed",
    "status_display": "Success",
    "reference_number": "PAY-ABC123",
    "mpesa_receipt": "QAX7B2C3D4",
    "phone": "+254712345678",
    "tenant_name": "John Doe",
    "unit_number": "A101"
  }
]
```

## Error Messages

### User-Friendly Messages

```javascript
const errorMessages = {
  // Network errors
  network_error: "Connection error. Please check your internet and try again.",
  timeout: "Request timed out. Please try again.",
  
  // Validation errors
  invalid_amount: "Please enter a valid amount",
  invalid_phone: "Please enter a valid Kenyan phone number (+254XXXXXXXXX)",
  amount_exceeds: "Amount cannot exceed outstanding balance",
  
  // Payment errors
  payment_failed: "Payment failed. Please try again.",
  insufficient_funds: "Insufficient M-Pesa balance. Please top up and try again.",
  wrong_pin: "Incorrect PIN. Please try again.",
  user_cancelled: "Payment was cancelled. Click 'Pay with M-Pesa' to try again.",
  
  // System errors
  server_error: "Server error. Please try again later.",
  mpesa_error: "M-Pesa service unavailable. Please try again later.",
  
  // Permission errors
  not_authorized: "You don't have permission to make this payment",
  unit_not_found: "Unit information not found. Please contact support.",
  
  // Polling errors
  status_check_failed: "Unable to verify payment status. Please check your payment history.",
  polling_timeout: "Payment verification timed out. Please check your payment history."
}
```

## Logging Events

### Frontend Console Logs

```javascript
// Payment initiation
"🔵 Initiating payment for unit {unitId}"

// API calls
"🔵 API Request: POST /payments/stk-push/{unitId}/"
"✅ API Response: 200 POST /payments/stk-push/{unitId}/"

// Polling
"🔍 Polling payment status for ID: {paymentId}"
"✅ Payment completed: {mpesaReceipt}"
"❌ Payment failed: {failureReason}"

// Errors
"❌ Payment error: {error}"
"❌ API Error: 401 POST /payments/stk-push/{unitId}/"
```

### Backend Logs

```python
# Payment initiation
logger.info(f"STK push initiated for unit {unit_id}, amount {amount}")

# M-Pesa request
logger.info(f"Sending STK push to: {url}")
logger.info(f"Payload: {payload}")

# M-Pesa response
logger.info(f"STK push response: {response_data}")
logger.info(f"Payment ID: {payment.id}, Cache Key: {cache_key}")

# Callback received
logger.info(f"Rent callback received: {callback_data}")
logger.info(f"Payment {payment.id} marked as completed")

# Errors
logger.error(f"STK push failed: {error_message}")
logger.error(f"Callback error: {str(e)}")
```

## Quick Debugging

### Check Payment Status

```python
# Django shell
from payments.models import Payment

payment = Payment.objects.get(id=123)
print(f"Status: {payment.status}")
print(f"Receipt: {payment.mpesa_receipt}")
print(f"Amount: {payment.amount}")
print(f"Created: {payment.created_at}")
print(f"Updated: {payment.updated_at}")
```

### Check Recent Payments

```python
# Last 10 payments
recent = Payment.objects.order_by('-created_at')[:10]
for p in recent:
    print(f"{p.id} | {p.status} | {p.amount} | {p.tenant.full_name}")
```

### Check Pending Payments

```python
# Payments still pending
pending = Payment.objects.filter(status='pending')
print(f"Pending payments: {pending.count()}")
```

### Manually Complete Payment

```python
# For testing - manually mark as completed
payment = Payment.objects.get(id=123)
payment.status = 'completed'
payment.mpesa_receipt = 'TEST123456'
payment.save()

# Update unit rent
unit = payment.unit
unit.rent_remaining -= payment.amount
if unit.rent_remaining <= 0:
    unit.rent_remaining = 0
unit.save()
```

## Status Code Summary

| HTTP Code | Meaning | Action |
|-----------|---------|--------|
| 200 | Success | Payment processed |
| 400 | Bad Request | Check request data |
| 401 | Unauthorized | Login again |
| 403 | Forbidden | Check permissions |
| 404 | Not Found | Check payment ID |
| 500 | Server Error | Contact support |

## Transaction Lifecycle

```
1. USER INITIATES PAYMENT
   ↓
2. FRONTEND VALIDATES FORM
   ↓
3. API CALL: POST /payments/stk-push/{unit_id}/
   ↓
4. BACKEND VALIDATES:
   - User is tenant
   - User owns unit
   - Rent not already paid
   - Phone number valid
   ↓
5. BACKEND CALLS M-PESA API
   ↓
6. M-PESA SENDS STK PUSH TO PHONE
   ↓
7. PAYMENT RECORD CREATED (status=pending)
   ↓
8. FRONTEND STARTS POLLING
   ↓
9. USER ENTERS PIN ON PHONE
   ↓
10. M-PESA PROCESSES PAYMENT
    ↓
11. M-PESA CALLS CALLBACK URL
    ↓
12. BACKEND UPDATES PAYMENT (status=completed)
    ↓
13. BACKEND UPDATES UNIT (rent_remaining)
    ↓
14. FRONTEND DETECTS STATUS CHANGE
    ↓
15. UI SHOWS SUCCESS MESSAGE
    ↓
16. PAYMENT HISTORY REFRESHES
```

Total time: 5-30 seconds (typical)
