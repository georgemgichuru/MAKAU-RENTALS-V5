# PesaPal Frontend Integration - Complete Updates

## Summary of Changes

All frontend components have been updated to use the new PesaPal payment system. Phone numbers are no longer required for payment initiation as PesaPal handles payment method selection on their secure gateway.

---

## Files Modified

### 1. **TenantPaymentCenter.jsx** ✅
**Location:** `Makao-Center-V4/src/components/Tenant/TenantPaymentCenter.jsx`

**Changes Made:**
- ❌ **Removed:** Phone number input field and validation
- ❌ **Removed:** `formData.phoneNumber` state
- ✅ **Updated:** Payment initiation to only send `amount`
- ✅ **Updated:** Payment method label from "M-PESA" to "PesaPal"
- ✅ **Updated:** Button text from "Pay with M-Pesa" to "Pay Now"
- ✅ **Updated:** Info message to mention PesaPal redirect
- ✅ **Added:** Redirect flow handling with localStorage
- ✅ **Added:** Payment status polling after redirect return

**New Payment Flow:**
```javascript
// Before (M-Pesa STK Push)
paymentsAPI.initiateRentPayment(unitId, {
  phone_number: formattedPhone,
  amount: amount
});

// After (PesaPal Redirect)
paymentsAPI.initiateRentPayment(unitId, {
  amount: amount  // Phone not needed
});
// → Redirects to PesaPal gateway
// → User completes payment
// → Redirects back to app
// → Status polling begins
```

**UI Changes:**
- Removed M-Pesa phone number field
- Updated payment button to "Pay Now"
- Changed info text to explain PesaPal redirect
- Payment history shows "PesaPal" instead of "M-PESA"

---

### 2. **LoginForm.jsx** ✅
**Location:** `Makao-Center-V4/src/components/Login and Sign Up/LoginForm.jsx`

**Changes Made:**
- ❌ **Removed:** `mpesaPhone` from tenant registration data
- ❌ **Removed:** Phone number validation for deposit payment
- ✅ **Updated:** `processTenantDepositPayment()` to use PesaPal
- ✅ **Updated:** Deposit payment UI (Tenant Step 5)
- ✅ **Added:** Redirect flow for registration deposit payments

**New Deposit Payment Flow:**
```javascript
// Before
const paymentData = {
  unit_id: unitId,
  phone_number: mpesaPhone,
  amount: depositAmount
};

// After
const paymentData = {
  unit_id: unitId,
  amount: depositAmount  // No phone needed
};
// → Redirects to PesaPal
// → Returns after payment
```

**UI Changes:**
- Removed M-Pesa phone number input
- Updated button text and messaging
- Changed info text to explain PesaPal redirect

---

### 3. **AdminSettings.jsx** ✅
**Location:** `Makao-Center-V4/src/components/Admin/AdminSettings.jsx`

**Changes Made:**
- ❌ **Removed:** Entire "M-Pesa Till Number" section
- ❌ **Removed:** Till number state variables
- ❌ **Removed:** `handleTillNumberUpdate()` function
- ❌ **Removed:** Till number form

**Rationale:**
Till numbers are not used in PesaPal integration. PesaPal uses merchant accounts with automatic settlement to your linked bank account.

---

### 4. **api.js** ✅
**Location:** `Makao-Center-V4/src/services/api.js`

**Already Updated:** No changes needed - endpoints already use PesaPal:
- `initiateRentPayment(unitId, data)` → `/payments/initiate-rent-payment/{unitId}/`
- `initiateSubscriptionPayment(data)` → `/payments/initiate-subscription-payment/`
- `initiateDepositRegistration(data)` → `/payments/initiate-deposit-registration/`

---

## Complete Payment Flow Diagram

### Tenant Rent Payment:

```
┌─────────────────────────────────────────────────────────────┐
│  1. Tenant Payment Center                                   │
│     - Enter amount                                           │
│     - Select months (optional)                               │
│     - Click "Pay Now"                                        │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Frontend (TenantPaymentCenter.jsx)                      │
│     POST /api/payments/initiate-rent-payment/{unitId}/      │
│     Body: { amount: 5000 }                                   │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Backend (views_pesapal.py)                              │
│     - Create Payment record (status: pending)                │
│     - Call PesaPal API: submit_order()                      │
│     - Receive redirect_url                                   │
│     Response: { redirect_url, payment_id, tracking_id }     │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Frontend Redirect                                        │
│     - Store payment_id in localStorage                       │
│     - window.location.href = redirect_url                    │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  5. PesaPal Gateway (External)                              │
│     - User selects payment method                            │
│     - Completes payment (M-Pesa/Card/etc)                   │
│     - Redirects back to app                                  │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  6. IPN Callback (Background)                               │
│     POST /api/payments/callback/pesapal-ipn/                │
│     - PesaPal sends payment status                           │
│     - Update Payment.status = 'completed'                    │
│     - Update Unit.rent_remaining                             │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  7. Frontend Returns                                         │
│     - useEffect detects pending_payment_id                   │
│     - Starts polling: GET /api/payments/rent-status/{id}/   │
│     - Shows "Verifying payment..."                           │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  8. Payment Complete                                         │
│     - Status changes to 'completed'                          │
│     - Show success message                                   │
│     - Refresh payment history                                │
│     - Update rent balance                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Testing Checklist

### Tenant Rent Payment:
- [ ] Open Payment Center
- [ ] Enter payment amount
- [ ] Click "Pay Now" (no phone number needed)
- [ ] Redirected to PesaPal
- [ ] Select M-Pesa on PesaPal
- [ ] Complete payment with STK push
- [ ] Redirected back to app
- [ ] See "Verifying payment..." status
- [ ] Payment status updates to "completed"
- [ ] Rent balance updated
- [ ] Payment appears in history

### Tenant Registration Deposit:
- [ ] Start tenant registration
- [ ] Complete steps 1-4
- [ ] Reach deposit payment step
- [ ] Click "Pay Now" (no phone field shown)
- [ ] Redirected to PesaPal
- [ ] Complete payment
- [ ] Return to app
- [ ] Registration completes

### Admin Settings:
- [ ] Open Settings page
- [ ] Verify no "Till Number" section
- [ ] Account settings work
- [ ] Reminder settings work
- [ ] Security settings work

---

## Key Differences: M-Pesa vs PesaPal

| Feature | M-Pesa STK Push (Old) | PesaPal (New) |
|---------|----------------------|---------------|
| **Phone Number** | Required | Not needed |
| **Payment Flow** | Push to phone → User enters PIN | Redirect → User selects method |
| **Payment Methods** | M-Pesa only | M-Pesa, Cards, Airtel, Bank |
| **User Experience** | Wait for prompt on phone | Complete in browser |
| **Transaction Limit** | KES 150,000 | KES 500,000 |
| **Settlement** | To Till/Paybill | To Merchant Account |
| **International** | Kenya only | Global payments |
| **Callbacks** | Callback URL | IPN (Instant Payment Notification) |

---

## Environment Variables

Ensure these are set in `Makau Rentals/app/app/.env`:

```env
# PesaPal Configuration
PESAPAL_CONSUMER_KEY="GUSAz+2YErGa340w/eov0eKyRpu5QYJu"
PESAPAL_CONSUMER_SECRET="UETs03tnt5lUXBzqEatOQDwlBhs="
PESAPAL_ENV="live"
PESAPAL_IPN_URL="https://your-domain.com/api/payments/callback/pesapal-ipn/"
```

---

## API Endpoints Updated

### Rent Payments:
```
POST /api/payments/initiate-rent-payment/{unit_id}/
Body: { "amount": 5000 }
Response: {
  "success": true,
  "payment_id": 123,
  "order_tracking_id": "abc-123-xyz",
  "redirect_url": "https://pay.pesapal.com/...",
  "message": "Payment initiated successfully"
}
```

### Subscription Payments:
```
POST /api/payments/initiate-subscription-payment/
Body: { "amount": 2000, "subscription_type": "starter" }
Response: { ... same as rent ... }
```

### Deposit Payments (Registration):
```
POST /api/payments/initiate-deposit-registration/
Body: { "unit_id": 45, "amount": 10000 }
Response: { ... same as rent ... }
```

### Payment Status:
```
GET /api/payments/rent-status/{payment_id}/
Response: {
  "id": 123,
  "status": "completed",
  "amount": 5000,
  "mpesa_receipt": "PESAPAL-R-123",
  "created_at": "2025-10-28T10:30:00Z"
}
```

---

## Troubleshooting

### Issue: Redirect not working
**Solution:** Check browser console for errors. Ensure `window.location.href` is being called.

### Issue: Payment status stuck on "Verifying"
**Solution:** 
1. Check IPN endpoint is accessible: `/api/payments/callback/pesapal-ipn/`
2. Check PesaPal IPN registration: IPN ID should be in logs
3. Verify payment in PesaPal dashboard

### Issue: "Payment initiated but no redirect"
**Solution:** Check backend response includes `redirect_url`

### Issue: Payment successful but status not updating
**Solution:** 
1. Check IPN callback logs
2. Verify payment_id in localStorage matches database
3. Check polling interval (3 seconds) is working

---

## Next Steps

1. **Test on Development**
   - Use PesaPal sandbox for testing
   - Test all payment flows
   - Verify callbacks work

2. **Update Documentation**
   - Update user guides
   - Update landlord onboarding
   - Update tenant instructions

3. **Production Deployment**
   - Switch to live environment
   - Update IPN URL to production domain
   - Monitor first transactions closely

4. **Future Enhancements**
   - Add payment receipts download
   - Add email notifications for successful payments
   - Add SMS notifications (optional)
   - Implement automatic landlord disbursements

---

## Support

For PesaPal issues:
- Email: support@pesapal.com
- Phone: +254 709 598 000
- Dashboard: https://pay.pesapal.com/

For technical issues:
- Check logs: `Makau Rentals/app/logs/payments.log`
- Review IPN callbacks
- Test with PesaPal sandbox first
