# PesaPal Amount Limit Issue - Fixed

## Issues Found & Fixed

### 1. ✅ Backend Ignoring User-Specified Amount
**Problem**: Backend was using `unit.rent_remaining` instead of the amount submitted by the user.

**Location**: `payments/views_pesapal.py` line 67

**Before**:
```python
amount = float(unit.rent_remaining)  # Always used full rent remaining
```

**After**:
```python
# Get amount from request body
amount = request.data.get('amount')
if not amount:
    return Response({"error": "Amount is required"}, status=status.HTTP_400_BAD_REQUEST)

amount = float(amount)

# Validate amount doesn't exceed rent remaining
if amount > unit.rent_remaining:
    return Response({
        "error": f"Amount exceeds rent remaining (KES {unit.rent_remaining})"
    }, status=status.HTTP_400_BAD_REQUEST)

if amount <= 0:
    return Response({"error": "Amount must be greater than zero"}, status=status.HTTP_400_BAD_REQUEST)
```

**Result**: Backend now correctly uses the amount specified by the user (700 in your case).

---

### 2. ⚠️ PesaPal Transaction Limit Error
**Problem**: PesaPal API returns:
```json
{
  "error": {
    "error_type": "contractual_error",
    "code": "amount_exceeds_default_limit",
    "message": "Transaction amount exceeds limit. Contact support for assistance"
  },
  "status": "500"
}
```

**Cause**: Your PesaPal merchant account has a default transaction limit (likely KES 5,000 or similar). Attempting to process 6,005 KES exceeded this limit.

**Solutions**:

#### Option 1: Contact PesaPal Support (Recommended)
1. Log into your PesaPal merchant account: https://pay.pesapal.com
2. Navigate to **Settings > Account Limits** or **Profile**
3. Contact support@pesapal.com or use live chat
4. Request to increase your transaction limit based on your business needs
   - For rent payments: Suggest KES 50,000 - 100,000
   - For subscriptions: Should be fine (max KES 4,500)
   - For deposits: Match your highest deposit amount

#### Option 2: Split Large Payments (Temporary Workaround)
Add frontend validation to prevent amounts exceeding the limit:

```javascript
// In TenantPaymentCenter.jsx
const PESAPAL_TRANSACTION_LIMIT = 5000; // Update based on your limit

const validateForm = () => {
  const newErrors = {};
  const parsedAmount = parseFloat(formData.amount);

  if (!formData.amount || parsedAmount <= 0) {
    newErrors.amount = 'Please enter a valid amount';
  } else if (parsedAmount > PESAPAL_TRANSACTION_LIMIT) {
    newErrors.amount = `Amount exceeds transaction limit (KES ${PESAPAL_TRANSACTION_LIMIT}). Please contact admin.`;
  } else if (parsedAmount > effectiveRentDue) {
    newErrors.amount = `Amount exceeds rent due (KES ${effectiveRentDue})`;
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

#### Option 3: Backend Limit Enforcement
Add validation in `views_pesapal.py`:

```python
# Add to settings.py
PESAPAL_TRANSACTION_LIMIT = 5000  # Update based on your account limit

# In initiate_rent_payment()
from django.conf import settings

if amount > settings.PESAPAL_TRANSACTION_LIMIT:
    return Response({
        "error": f"Amount exceeds transaction limit (KES {settings.PESAPAL_TRANSACTION_LIMIT}). Please contact support."
    }, status=status.HTTP_400_BAD_REQUEST)
```

---

## Testing After Fix

### Test 1: Partial Rent Payment
1. Navigate to Tenant Payment Center
2. Enter amount: **700**
3. Click "Proceed to Payment"
4. **Expected**: Payload shows `"amount": 700.0` (not 6005.0)
5. **Expected**: Redirects to PesaPal payment page

### Test 2: Verify Amount Validation
1. Try to pay more than `rent_remaining`
2. **Expected**: Error message "Amount exceeds rent remaining"

### Test 3: Check Logs
```bash
# Look for correct amount in logs
tail -f logs/payments.log
```
Should show: `"amount": 700.0`

---

## Next Steps

1. ✅ **Fixed**: Backend now respects user-specified amounts
2. ⚠️ **Action Required**: Contact PesaPal to increase your transaction limit
   - Email: support@pesapal.com
   - Or log into https://pay.pesapal.com and use live chat
   - Request limit increase based on your business needs (suggest KES 50,000+)

3. **Optional**: Add frontend/backend validation for transaction limits until PesaPal increases your limit

---

## Why This Happened

1. **Amount Mismatch**: Backend code was written to always charge full rent remaining, ignoring user input. This is now fixed.

2. **Transaction Limit**: PesaPal sandbox and new live accounts have default transaction limits for security. This is normal and can be increased by contacting support.

---

## Updated Payment Flow

```
User enters 700 → Frontend sends {amount: 700} → Backend validates:
  ✅ Amount > 0
  ✅ Amount <= rent_remaining  
  ✅ Amount <= transaction_limit (if enforced)
→ PesaPal receives 700 → Payment processes successfully
```

---

**Status**: Amount calculation fixed. Transaction limit is a PesaPal account setting that needs to be updated through their support team.
