# Subscription Payment Flow Documentation

## Overview
This document explains the complete subscription payment flow for Makau Rentals, from plan selection to payment confirmation and subscription activation.

## Flow Diagram

```
User selects plan → Payment page → M-Pesa STK Push → Payment callback → Subscription activated
```

## Components

### 1. **SubscriptionPage.jsx** (`/admin/subscription`)
**Purpose**: Display available subscription plans

**Features**:
- Shows one-time lifetime plan (KSh 40,000)
- Shows monthly subscription tiers (tier1-tier4)
- Shows enterprise plan (custom pricing)
- Each plan shows features, pricing, and "Select Plan" button

**User Actions**:
- Click "Select Plan" → Navigates to `/admin/subscription/payment` with plan details

**Code Flow**:
```javascript
handleSelectPlan(planId) {
  // Prepare plan details
  const planDetails = {
    id: planId,
    name: planName,
    price: planPrice,
    billingPeriod: 'per month' or 'one-time',
    features: [...]
  };
  
  // Navigate to payment page
  navigate('/admin/subscription/payment', { state: { planDetails } });
}
```

---

### 2. **SubscriptionPaymentPage.jsx** (`/admin/subscription/payment`)
**Purpose**: Handle payment processing for selected plan

**Features**:
- Displays plan summary (name, price, features)
- M-Pesa phone number input
- Secure payment processing
- Real-time payment status updates
- Countdown timer (3 minutes)
- Success/failure handling

**Payment States**:
1. **Initial**: User enters phone number
2. **Processing**: STK push initiated
3. **Pending**: Waiting for user to complete payment on phone
4. **Success**: Payment confirmed, subscription activated
5. **Failed**: Payment failed or cancelled
6. **Timeout**: Payment expired (3 minutes)

**User Actions**:
1. Enter M-Pesa phone number (validated for Kenyan format)
2. Click "Pay KSh X,XXX" button
3. Receive STK push on phone
4. Enter M-Pesa PIN
5. Payment processed automatically

**Code Flow**:
```javascript
handleInitiatePayment() {
  // 1. Validate phone number
  validatePhoneNumber(phoneNumber)
  
  // 2. Call API to initiate STK push
  const response = await paymentsAPI.stkPushSubscription({
    plan: planDetails.id,
    phone_number: phoneNumber
  })
  
  // 3. Set payment to pending
  setPaymentStatus('pending')
  setSubscriptionPaymentId(response.data.subscription_payment_id)
  
  // 4. Start polling for status
  // Polls every 3 seconds until success/failure
}
```

**Status Polling**:
- Runs every 3 seconds while payment is pending
- Checks `/payments/subscription-payments/{id}/` endpoint
- Updates UI based on status changes
- Auto-redirects to dashboard on success

---

### 3. **Backend API Endpoints**

#### **POST** `/payments/stk-push-subscription/`
**Purpose**: Initiate M-Pesa STK push for subscription payment

**Request**:
```json
{
  "plan": "tier1",
  "phone_number": "0712345678"
}
```

**Process**:
1. Validates phone number and plan
2. Generates M-Pesa access token
3. Creates STK push request with:
   - Business ShortCode
   - Password (base64 encoded)
   - Timestamp
   - Amount (based on plan)
   - Phone number
   - Callback URL
4. Creates `SubscriptionPayment` record (status: Pending)
5. Caches checkout request ID for callback

**Response**:
```json
{
  "success": true,
  "message": "Subscription STK push initiated successfully",
  "checkout_request_id": "ws_CO_12345...",
  "subscription_payment_id": 42
}
```

---

#### **GET** `/payments/subscription-payments/{id}/`
**Purpose**: Check subscription payment status

**Response**:
```json
{
  "id": 42,
  "user": 1,
  "amount": "2000.00",
  "subscription_type": "tier1",
  "status": "Success",  // or "Pending", "Failed"
  "mpesa_receipt_number": "REC123456",
  "transaction_date": "2025-10-26T14:30:00Z",
  "is_complete": true
}
```

---

#### **POST** `/payments/callback/subscription/`
**Purpose**: Handle M-Pesa callback after payment processing

**M-Pesa Callback Format**:
```json
{
  "Body": {
    "stkCallback": {
      "ResultCode": 0,
      "ResultDesc": "The service request is processed successfully.",
      "CheckoutRequestID": "ws_CO_12345...",
      "CallbackMetadata": {
        "Item": [
          { "Name": "Amount", "Value": 2000 },
          { "Name": "MpesaReceiptNumber", "Value": "REC123456" },
          { "Name": "PhoneNumber", "Value": "254712345678" }
        ]
      }
    }
  }
}
```

**Process**:
1. Receives callback from M-Pesa
2. Extracts checkout request ID and result
3. Retrieves cached payment data
4. Updates `SubscriptionPayment` record:
   - Sets status to "Success" or "Failed"
   - Stores M-Pesa receipt number
   - Records actual amount paid
5. If successful:
   - Creates or updates user's `Subscription` record
   - Sets plan type
   - Sets expiry date (30 days from now)
6. Clears cache
7. Returns acknowledgement to M-Pesa

---

### 4. **Database Models**

#### **SubscriptionPayment**
```python
class SubscriptionPayment(models.Model):
    user = ForeignKey(CustomUser)
    amount = DecimalField(max_digits=10, decimal_places=2)
    mpesa_receipt_number = CharField(max_length=50)
    mpesa_checkout_request_id = CharField(max_length=100)
    transaction_date = DateTimeField(auto_now_add=True)
    subscription_type = CharField(max_length=20)  # tier1, tier2, etc.
    status = CharField(max_length=20)  # Pending, Success, Failed
```

#### **Subscription**
```python
class Subscription(models.Model):
    user = OneToOneField(CustomUser)
    plan = CharField(max_length=20)  # free, tier1, tier2, onetime
    expiry_date = DateTimeField()
    
    def is_active(self):
        return timezone.now() < self.expiry_date
```

---

## Payment Plans

### Monthly Plans
| Plan | Units | Price | Duration |
|------|-------|-------|----------|
| tier1 | 1-10 | KSh 2,000 | 30 days |
| tier2 | 11-20 | KSh 2,500 | 30 days |
| tier3 | 21-50 | KSh 4,500 | 30 days |
| tier4 | 51-100 | KSh 7,500 | 30 days |

### One-Time Plan
| Plan | Units | Price | Duration |
|------|-------|-------|----------|
| onetime | Up to 50 | KSh 40,000 | Lifetime |

### Enterprise Plan
| Plan | Units | Price | Duration |
|------|-------|-------|----------|
| enterprise | 100+ | Custom | Custom |

---

## Error Handling

### Frontend Errors
1. **Invalid Phone Number**: Validates Kenyan format (254XXXXXXXXX or 07XXXXXXXX)
2. **Payment Timeout**: Shows timeout message after 3 minutes
3. **Payment Failed**: Displays failure reason with retry button
4. **Network Errors**: Shows generic error with retry option

### Backend Errors
1. **Invalid Plan**: Returns 400 with error message
2. **Invalid Phone**: Returns 400 with validation error
3. **M-Pesa API Failure**: Returns 400 with M-Pesa error details
4. **Token Generation Failure**: Returns 500 with error message

---

## Security Features

1. **Authentication Required**: User must be logged in
2. **Phone Validation**: Strict format validation
3. **Amount Validation**: Server-side validation of plan amounts
4. **HTTPS Only**: All M-Pesa communication over HTTPS
5. **Token Expiry**: M-Pesa tokens expire after short period
6. **Callback Verification**: Verifies callback data integrity

---

## User Experience

### Success Flow
1. User sees plan options
2. Clicks "Select Plan" → Redirected to payment page
3. Enters phone number
4. Clicks "Pay" → STK push sent
5. Sees "Processing Payment..." message
6. Enters PIN on phone
7. Sees "Payment Successful!" message
8. Auto-redirected to dashboard after 3 seconds
9. Subscription is active

### Failure Flow
1. User sees plan options
2. Clicks "Select Plan" → Redirected to payment page
3. Enters phone number
4. Clicks "Pay" → STK push sent
5. Cancels on phone OR enters wrong PIN
6. Sees "Payment Failed" message
7. Can click "Try Again" to retry

---

## Testing

### Test Scenarios
1. **Successful Payment**: Complete payment → Subscription activated
2. **Failed Payment**: Cancel on phone → Show error, allow retry
3. **Timeout**: Don't respond within 3 minutes → Show timeout
4. **Invalid Phone**: Enter invalid format → Show validation error
5. **Network Error**: Simulate network failure → Show error message

### Test Data (Sandbox)
- **Phone**: Use Safaricom sandbox test numbers
- **Amount**: Use plan amounts (2000, 2500, etc.)
- **Environment**: Set `MPESA_ENV=sandbox` in settings

---

## Monitoring

### Logs to Check
1. **STK Push Initiation**: `"Sending STK push to: {url}"`
2. **Callback Received**: `"Subscription callback received: {data}"`
3. **Payment Success**: `"Subscription payment {id} completed successfully"`
4. **Subscription Updated**: `"User {email} subscription updated to {plan}"`

### Database Checks
1. `SubscriptionPayment` records created with status "Pending"
2. Status updated to "Success" or "Failed" after callback
3. `Subscription` records created/updated on success
4. Expiry dates set correctly (30 days from payment)

---

## Troubleshooting

### Payment Not Showing as Complete
1. Check `SubscriptionPayment.status` in database
2. Check M-Pesa callback logs
3. Verify callback URL is accessible
4. Check cache for checkout request ID

### STK Push Not Received
1. Verify phone number format
2. Check M-Pesa credentials (shortcode, passkey)
3. Check access token generation
4. Review M-Pesa API response

### Subscription Not Activated
1. Check `Subscription` table for user
2. Verify callback processed successfully
3. Check subscription expiry_date
4. Review payment success logs

---

## Future Enhancements

1. **Email Notifications**: Send receipt emails on successful payment
2. **SMS Notifications**: Send SMS confirmation
3. **Payment History**: Show past subscription payments
4. **Auto-Renewal**: Automatic subscription renewal before expiry
5. **Proration**: Handle mid-month upgrades/downgrades
6. **Refunds**: Support refund requests
7. **Multiple Payment Methods**: Add card payments, bank transfers

---

## API Integration Checklist

✅ **Frontend**:
- [x] Subscription plan selection page
- [x] Payment processing page
- [x] Phone number validation
- [x] Status polling
- [x] Success/failure handling
- [x] Timeout handling
- [x] Navigation flow

✅ **Backend**:
- [x] STK push initiation endpoint
- [x] Payment status endpoint
- [x] M-Pesa callback handler
- [x] Subscription creation/update
- [x] Payment validation
- [x] Error handling
- [x] Logging

✅ **Database**:
- [x] SubscriptionPayment model
- [x] Subscription model
- [x] Proper constraints
- [x] Status tracking

---

## Contact & Support

For issues or questions:
- **Email**: makaorentalmanagementsystem@gmail.com
- **Phone**: +254722714334
- **Documentation**: See backend docs for M-Pesa setup

---

**Last Updated**: October 26, 2025
**Version**: 1.0
