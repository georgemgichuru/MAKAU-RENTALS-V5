# Quick Testing Guide - Tenant Payment Center

## Prerequisites
✅ Backend running on localhost or ngrok
✅ M-Pesa credentials configured in Django settings
✅ Tenant account with assigned unit
✅ Frontend connected to backend API

## Test Scenarios

### 1. View Payment History
**Expected Result**: Should show all previous payments from database

**Steps**:
1. Login as tenant
2. Navigate to Payment Center
3. Check right sidebar for "Payment History"

**Verify**:
- ✅ Payments display with correct amounts
- ✅ Dates are formatted properly
- ✅ Status shows (Success, Pending, Failed)
- ✅ M-Pesa receipts display when available
- ✅ "No transactions found" if no history

---

### 2. Initiate Payment - Success Flow
**Expected Result**: Payment processes successfully

**Steps**:
1. Enter valid amount (e.g., full rent)
2. Enter M-Pesa phone number (+254XXXXXXXXX)
3. Click "Pay with M-Pesa"
4. Wait for STK push on phone
5. Enter M-Pesa PIN

**Verify**:
- ✅ Shows "Processing..." during submission
- ✅ Shows "Payment request sent" message (blue box)
- ✅ Button changes to "Verifying..." with spinner
- ✅ Phone receives M-Pesa prompt
- ✅ After entering PIN, status updates to "Success" (green)
- ✅ Payment appears in history immediately
- ✅ Status in history updates from Pending to Success

**Console Checks**:
```javascript
// Should see:
"🔵 API Request: POST .../payments/stk-push/{unit_id}/"
"✅ API Response: 200 POST .../payments/stk-push/{unit_id}/"
"🔵 API Request: GET .../payments/rent-status/{payment_id}/" (every 3 seconds)
```

---

### 3. Initiate Payment - Cancellation Flow
**Expected Result**: Payment marked as failed when user cancels

**Steps**:
1. Enter valid amount
2. Enter M-Pesa phone number
3. Click "Pay with M-Pesa"
4. Receive STK push on phone
5. **Cancel or ignore** the prompt

**Verify**:
- ✅ Status stays "Verifying..." while waiting
- ✅ After ~30 seconds, M-Pesa times out
- ✅ Status updates to "Failed" (red box)
- ✅ Shows failure reason if available
- ✅ Payment in history shows "Failed" status

---

### 4. Phone Number Validation
**Expected Result**: Invalid phone numbers rejected

**Test Cases**:
| Input | Expected |
|-------|----------|
| `0712345678` | ✅ Converts to `+254712345678` |
| `712345678` | ✅ Converts to `+254712345678` |
| `254712345678` | ✅ Converts to `+254712345678` |
| `+254712345678` | ✅ Valid as-is |
| `12345` | ❌ Error: "Invalid phone number" |
| `+255712345678` | ❌ Error: "Must be Kenyan number" |

---

### 5. Amount Validation
**Expected Result**: Invalid amounts rejected

**Test Cases**:
| Scenario | Amount | Expected |
|----------|--------|----------|
| Empty field | `` | ❌ "Please enter a valid amount" |
| Zero | `0` | ❌ "Please enter a valid amount" |
| Negative | `-100` | ❌ "Please enter a valid amount" |
| Valid | `5000` | ✅ Accepted |
| Exceeds rent | `999999` | ❌ "Cannot exceed outstanding balance" |

---

### 6. Quick Amount Button
**Expected Result**: One-click amount selection

**Steps**:
1. Click "Full Rent • KSh X,XXX" button

**Verify**:
- ✅ Amount field auto-fills with rent amount
- ✅ Amount field becomes enabled
- ✅ Can manually edit after clicking

---

### 7. Monthly Prepayment
**Expected Result**: Can pay multiple months in advance

**Steps**:
1. Select "3 months" from dropdown
2. Observe amount field

**Verify**:
- ✅ Amount auto-calculates (3 × monthly rent)
- ✅ Amount field becomes disabled
- ✅ Helper text shows "Amount auto-calculated for 3 month(s)"
- ✅ Changing months updates amount immediately

---

### 8. Concurrent Payment Prevention
**Expected Result**: Cannot initiate multiple payments simultaneously

**Steps**:
1. Start a payment
2. Try to start another payment while first is processing

**Verify**:
- ✅ "Pay with M-Pesa" button is disabled during processing
- ✅ Button shows "Verifying..." with spinner
- ✅ Reset button is also disabled
- ✅ Cannot submit form while polling

---

### 9. Payment Polling Timeout
**Expected Result**: Polling stops after 5 minutes

**Steps**:
1. Initiate payment
2. Ignore M-Pesa prompt (don't pay or cancel)
3. Wait 5 minutes

**Verify**:
- ✅ Polling stops after 5 minutes
- ✅ Shows error: "Payment verification timed out"
- ✅ Button re-enables
- ✅ Can initiate new payment

---

### 10. Network Error Handling
**Expected Result**: Graceful error handling

**Test**:
1. Stop backend server
2. Try to initiate payment

**Verify**:
- ✅ Shows error message
- ✅ Button re-enables
- ✅ Form stays filled (doesn't reset)
- ✅ Console shows clear error

---

### 11. Already Paid Rent
**Expected Result**: Prevents payment if rent fully paid

**Setup**:
- Ensure tenant's rent is fully paid (rent_remaining = 0)

**Verify**:
- ✅ Shows green message: "Your rent is fully paid for this month"
- ✅ "Pay with M-Pesa" button is disabled
- ✅ Can still use months dropdown to prepay

---

### 12. Payment History Refresh
**Expected Result**: History updates after successful payment

**Steps**:
1. Note current payment count in history
2. Make a successful payment
3. Check history

**Verify**:
- ✅ New payment appears at top of list
- ✅ Initially shows "Pending"
- ✅ Updates to "Success" when M-Pesa confirms
- ✅ Shows correct amount, date, receipt

---

## Backend Testing

### Check Payment Record Created
```python
# In Django shell
from payments.models import Payment

# Check pending payments
Payment.objects.filter(status='pending').order_by('-created_at')

# Check last payment
last_payment = Payment.objects.last()
print(f"Amount: {last_payment.amount}")
print(f"Status: {last_payment.status}")
print(f"Tenant: {last_payment.tenant.full_name}")
print(f"Unit: {last_payment.unit.unit_number}")
print(f"M-Pesa Receipt: {last_payment.mpesa_receipt}")
```

### Test Status Endpoint
```bash
# Get payment status
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/payments/rent-status/1/
```

### Check Callback Logs
```bash
# Watch Django logs for callback
tail -f logs/django.log | grep "callback"
```

---

## Common Issues & Solutions

### Issue: Payment stays "Pending" forever
**Cause**: Callback not received
**Check**:
1. Is callback URL accessible from internet?
2. Are M-Pesa credentials correct?
3. Check backend logs for callback errors
4. Verify ngrok tunnel is running

**Solution**:
```python
# Manually update payment status for testing
payment = Payment.objects.get(id=1)
payment.status = 'completed'
payment.mpesa_receipt = 'TEST123456'
payment.save()
```

---

### Issue: Phone doesn't receive STK push
**Cause**: M-Pesa API error
**Check**:
1. Backend logs for error message
2. M-Pesa API response in logs
3. Phone number format
4. M-Pesa environment (sandbox vs production)

**Look for**:
```
"STK push response: {'ResponseCode': '0', ...}"  # Success
"STK push failed: ..."  # Error
```

---

### Issue: "Permission denied" error
**Cause**: Tenant doesn't own the unit
**Check**:
```python
# Verify tenant assignment
unit = Unit.objects.get(id=1)
print(f"Tenant: {unit.tenant}")
print(f"Assigned: {unit.is_available}")
```

---

### Issue: Payment history not loading
**Cause**: API authentication or backend error
**Check**:
1. Browser console for API errors
2. Network tab for failed requests
3. Token expiration

**Console should show**:
```
✅ API Response: 200 GET .../payments/rent-payments/
```

---

## Testing Checklist

Before deploying:
- [ ] Payment initiation works
- [ ] M-Pesa STK push received
- [ ] Payment status updates correctly
- [ ] Payment history displays
- [ ] All validations working
- [ ] Error messages clear
- [ ] Polling starts and stops correctly
- [ ] Callbacks processed
- [ ] Rent balance updates
- [ ] Multiple payments prevented
- [ ] Timeout handling works
- [ ] Phone number formatting works
- [ ] Amount calculations correct
- [ ] Monthly prepayment works
- [ ] Backend logs clean

---

## Performance Checks

### Frontend
- [ ] No memory leaks from polling
- [ ] Polling intervals clear properly
- [ ] Component unmounts cleanly
- [ ] No unnecessary re-renders

### Backend
- [ ] Payment queries optimized
- [ ] Callbacks process quickly
- [ ] No N+1 queries
- [ ] Cache used appropriately

---

## Security Checks

- [ ] Only authenticated users can access
- [ ] Tenants can only pay their own rent
- [ ] Phone numbers validated server-side
- [ ] Amounts validated server-side
- [ ] No SQL injection possible
- [ ] CSRF protection on callbacks
- [ ] Sensitive data not logged

---

## Success Criteria

✅ **All tests pass**
✅ **Payment flow smooth**  
✅ **Status updates reliably**
✅ **History accurate**
✅ **Errors handled gracefully**
✅ **No console errors**
✅ **Backend logs clean**
✅ **M-Pesa integration working**

---

## Next Steps After Testing

1. **Load Testing**: Test with multiple simultaneous payments
2. **Edge Cases**: Test with edge case amounts, phone numbers
3. **Mobile Testing**: Test on actual mobile devices
4. **Network Testing**: Test with slow/flaky connections
5. **Production**: Deploy to production environment
6. **Monitoring**: Set up payment monitoring alerts
