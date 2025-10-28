# PesaPal Payment Integration Migration Guide

## Overview

The payment system has been completely migrated from M-Pesa to **PesaPal** payment gateway. PesaPal provides a more flexible payment solution supporting multiple payment methods including M-Pesa, Airtel Money, Credit/Debit Cards, and more.

## What Changed

### 1. **Environment Configuration (.env)**

**Old M-Pesa Configuration:**
```env
MPESA_CONSUMER_KEY=...
MPESA_CONSUMER_SECRET=...
MPESA_SHORTCODE=...
MPESA_PASSKEY=...
```

**New PesaPal Configuration:**
```env
PESAPAL_CONSUMER_KEY=GUSAz+2YErGa340w/eov0eKyRpu5QYJu
PESAPAL_CONSUMER_SECRET=UETs03tnt5lUXBzqEatOQDwlBhs=
PESAPAL_ENV=sandbox
PESAPAL_IPN_URL=https://your-domain.com/api/payments/callback/pesapal-ipn/
```

### 2. **Backend Changes**

#### New Files Created:
- `payments/pesapal_service.py` - PesaPal service wrapper with authentication and payment operations
- `payments/views_pesapal.py` - New views using PesaPal instead of M-Pesa

#### Updated Files:
- `app/settings.py` - Added PesaPal configuration
- `payments/urls.py` - Updated URL patterns to use new PesaPal endpoints
- `requirements.txt` - Added `pypesapal==1.0.0`

#### New API Endpoints:

**Payment Initiation:**
- `POST /api/payments/initiate-rent-payment/<unit_id>/` - Initiate rent payment
- `POST /api/payments/initiate-subscription-payment/` - Initiate subscription payment
- `POST /api/payments/initiate-deposit/` - Initiate deposit payment (authenticated)
- `POST /api/payments/initiate-deposit-registration/` - Initiate deposit during registration

**Callback:**
- `GET /api/payments/callback/pesapal-ipn/` - PesaPal IPN (Instant Payment Notification) handler

**Status Check:**
- `GET /api/payments/rent-status/<payment_id>/` - Check rent payment status
- `GET /api/payments/deposit-status/<payment_id>/` - Check deposit payment status

### 3. **Frontend Changes**

#### Updated Files:
- `src/services/api.js` - Updated payment API calls to use new PesaPal endpoints
- `src/components/Tenant/TenantPaymentCenter.jsx` - Updated to handle PesaPal redirect flow

#### Payment Flow Changes:

**Old M-Pesa Flow (STK Push):**
1. User enters phone and amount
2. Backend sends STK push to user's phone
3. User enters M-Pesa PIN on phone
4. Frontend polls for payment status
5. Payment completes

**New PesaPal Flow (Redirect):**
1. User enters phone and amount
2. Backend initiates PesaPal payment
3. User is redirected to PesaPal payment page
4. User selects payment method (M-Pesa, Card, etc.)
5. User completes payment on PesaPal
6. User is redirected back to application
7. Frontend polls for payment status confirmation

## Installation & Setup

### 1. Install Dependencies

```bash
cd "Makau Rentals/app"
pip install -r requirements.txt
```

This will install the `pypesapal` package.

### 2. Update Environment Variables

The `.env` file has already been updated with your PesaPal credentials:

```env
PESAPAL_CONSUMER_KEY=GUSAz+2YErGa340w/eov0eKyRpu5QYJu
PESAPAL_CONSUMER_SECRET=UETs03tnt5lUXBzqEatOQDwlBhs=
PESAPAL_ENV=sandbox
PESAPAL_IPN_URL=https://preaccommodatingly-nonabsorbable-joanie.ngrok-free.dev/api/payments/callback/pesapal-ipn/
```

**Important:** Update `PESAPAL_IPN_URL` with your actual domain when deploying to production.

### 3. Run Database Migrations

No database schema changes are required. The existing `Payment` and `SubscriptionPayment` models work with PesaPal.

### 4. Register IPN with PesaPal

The IPN (Instant Payment Notification) URL needs to be registered with PesaPal. This happens automatically on first payment, but you can also test it:

```bash
cd "Makau Rentals/app"
python manage.py shell
```

```python
from payments.pesapal_service import pesapal_service

# Test authentication
token = pesapal_service.get_access_token()
print(f"Access Token: {token[:20]}...")

# Register IPN
ipn_id = pesapal_service.register_ipn()
print(f"IPN ID: {ipn_id}")
```

### 5. Test the Integration

**Backend Test Endpoint:**
```bash
curl -X GET http://localhost:8000/api/payments/test-pesapal/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response:**
```json
{
  "message": "PesaPal test endpoint",
  "pesapal_env": "sandbox",
  "consumer_key": "GUSAz+2YEr..."
}
```

## PesaPal Service Features

### 1. **Automatic Token Caching**
Access tokens are cached for 4 minutes to avoid unnecessary API calls. Tokens expire after 5 minutes.

### 2. **Payment Status Checking**
The system can query PesaPal for transaction status at any time:

```python
from payments.pesapal_service import pesapal_service

status = pesapal_service.get_transaction_status('order_tracking_id')
print(status)
```

### 3. **Flexible Payment Methods**
PesaPal supports:
- M-Pesa (Safaricom)
- Airtel Money
- Credit/Debit Cards (Visa, Mastercard)
- Bank transfers

### 4. **Higher Transaction Limits**
- M-Pesa: KES 150,000 limit
- PesaPal: KES 500,000 limit

## Payment Flow Details

### Rent Payment Flow

1. **Tenant initiates payment:**
   ```javascript
   paymentsAPI.initiateRentPayment(unitId, {
     phone_number: '+254712345678',
     amount: 15000
   })
   ```

2. **Backend creates payment record and initiates PesaPal order:**
   ```python
   pesapal_response = pesapal_service.submit_order(
       amount=15000,
       description="Rent payment for Unit 101",
       phone_number="254712345678",
       email="tenant@example.com",
       merchant_reference="RENT-123-ABC12345"
   )
   ```

3. **Frontend receives redirect URL:**
   ```json
   {
     "success": true,
     "payment_id": 123,
     "order_tracking_id": "abc-def-ghi",
     "redirect_url": "https://cybqa.pesapal.com/payment/..."
   }
   ```

4. **User is redirected to PesaPal:**
   - Selects payment method
   - Completes payment
   - Redirected back to app

5. **PesaPal sends IPN notification:**
   - Backend receives notification at `/api/payments/callback/pesapal-ipn/`
   - Backend queries transaction status
   - Updates payment record

6. **Frontend polls payment status:**
   - Every 3 seconds for up to 5 minutes
   - Displays success/failure message

## Callback/IPN Handler

The IPN (Instant Payment Notification) handler processes payment notifications from PesaPal:

```python
@csrf_exempt
def pesapal_ipn_callback(request):
    order_tracking_id = request.GET.get('OrderTrackingId')
    
    # Query transaction status
    transaction_status = pesapal_service.get_transaction_status(order_tracking_id)
    
    # Process based on payment type (rent, subscription, deposit)
    if payment_status == 'completed':
        # Update payment record
        # Update unit balances
        # Send notifications
    
    return JsonResponse({"status": "success"})
```

## Migration Checklist

- [x] Update `.env` with PesaPal credentials
- [x] Install `pypesapal` package
- [x] Create `pesapal_service.py`
- [x] Create `views_pesapal.py`
- [x] Update `settings.py`
- [x] Update `urls.py`
- [x] Update frontend `api.js`
- [x] Update `TenantPaymentCenter.jsx`
- [ ] Test rent payments
- [ ] Test subscription payments
- [ ] Test deposit payments
- [ ] Test IPN callback
- [ ] Update ngrok URL for testing
- [ ] Deploy to production

## Testing Guide

### 1. Test Rent Payment

1. Login as tenant
2. Navigate to Payment Center
3. Enter amount and phone number
4. Click "Pay Now"
5. Should redirect to PesaPal
6. Complete payment on PesaPal
7. Verify redirect back to app
8. Verify payment status updates

### 2. Test Subscription Payment

1. Login as landlord
2. Navigate to Subscription page
3. Select plan
4. Enter phone number
5. Click "Subscribe"
6. Complete payment on PesaPal
7. Verify subscription activation

### 3. Test Deposit Payment (Registration)

1. Start tenant registration
2. Select unit
3. Enter deposit information
4. Complete payment on PesaPal
5. Verify unit reservation
6. Complete registration

## Troubleshooting

### Issue: "Failed to generate PesaPal token"

**Solution:** Check your credentials in `.env`:
```bash
echo $PESAPAL_CONSUMER_KEY
echo $PESAPAL_CONSUMER_SECRET
```

### Issue: "IPN not receiving notifications"

**Solution:** Verify IPN URL is accessible:
```bash
curl https://your-domain.com/api/payments/callback/pesapal-ipn/
```

### Issue: "Payment stuck in pending"

**Solution:** Manually check payment status:
```python
from payments.pesapal_service import pesapal_service

status = pesapal_service.get_transaction_status('order_tracking_id')
print(status)
```

### Issue: "Redirect not working"

**Solution:** Check callback URLs in payment initiation:
- Frontend: `${settings.FRONTEND_URL}/tenant/payments?payment_id=${payment.id}`
- Ensure `FRONTEND_URL` is correct in `.env`

## Production Deployment

### 1. Update Environment to Live

```env
PESAPAL_ENV=live
PESAPAL_IPN_URL=https://your-production-domain.com/api/payments/callback/pesapal-ipn/
```

### 2. Update Frontend URL

```env
FRONTEND_URL=https://your-production-frontend.com
```

### 3. Register IPN in Production

```python
from payments.pesapal_service import pesapal_service

ipn_id = pesapal_service.register_ipn()
print(f"Production IPN ID: {ipn_id}")
```

### 4. Test with Small Amounts

Start with small test transactions (KES 10-50) to verify everything works.

## Support

### PesaPal Support
- Website: https://www.pesapal.com
- Email: support@pesapal.com
- Documentation: https://developer.pesapal.com

### Common PesaPal Status Codes
- `PENDING` - Payment initiated, waiting for completion
- `COMPLETED` - Payment successful
- `FAILED` - Payment failed
- `CANCELLED` - Payment cancelled by user

## Benefits of PesaPal

1. **Multiple Payment Methods** - Not limited to M-Pesa
2. **Higher Limits** - Up to KES 500,000 per transaction
3. **Better User Experience** - Hosted payment page with all options
4. **Easier Integration** - No complex STK push handling
5. **Detailed Reporting** - Comprehensive transaction reports
6. **Regional Support** - Works across East Africa

## Next Steps

1. Test all payment flows in sandbox
2. Review transaction reports in PesaPal dashboard
3. Set up production credentials
4. Deploy to production
5. Monitor first few transactions closely
6. Update documentation for end users

---

**Last Updated:** October 27, 2025  
**Migration Status:** ✅ Complete  
**Environment:** Sandbox (Testing)
