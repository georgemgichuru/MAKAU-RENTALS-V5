# Testing Instructions - Tenant Backend Integration Fix

## Prerequisites
- Django backend running: `python manage.py runserver`
- React frontend running: `npm run dev`
- User logged in as a **tenant** (user_type = 'tenant')

## Quick Test Steps

### 1. Clear Browser Cache
```bash
# In DevTools Console:
localStorage.clear()
```
Then refresh the page.

### 2. Monitor Network & Console Errors
- Open DevTools (F12)
- Go to **Network** tab
- Go to **Console** tab
- Refresh the page

### 3. Navigate to Tenant Dashboard
```
URL: http://localhost:5173/tenant
```

### Expected Results:

#### ✅ No 403 Errors
You should NOT see these errors:
- ❌ `GET /api/payments/rent-payments/summary/ 403 Forbidden`
- ❌ `GET /api/accounts/subscription/status/ 403 Forbidden`
- ❌ `GET /api/communication/reports/ 403 Forbidden`

#### ✅ Correct Data Display
**Dashboard should show:**
- ✅ Tenant name: `Welcome, [First Name]`
- ✅ Room number: From `user.current_unit.unit_number`
- ✅ Monthly Rent: **From Backend** (via `/api/payments/rent-payments/summary/`)
  - Should match database Unit.rent value
- ✅ Outstanding Balance: **From Backend**
  - Should match database Unit.rent_remaining value
- ✅ Prepaid Months: From backend response
- ✅ Contact Information: Email and phone
- ✅ My Reports: List of tenant's reports (if any exist)

### 4. Test Payment Center
```
URL: http://localhost:5173/tenant/payments
```

**Should show:**
- ✅ Room number and correct monthly rent amount
- ✅ Outstanding balance
- ✅ Payment form ready to use
- ✅ Payment History section (if payments exist)
- ✅ No 403 errors

### 5. Test Report Issue
```
URL: http://localhost:5173/tenant/report
```

**Should show:**
- ✅ Form to submit maintenance report
- ✅ Can select category, priority, title, description
- ✅ Submit button works
- ✅ Report created in backend

## Console Network Requests to Verify

### Good Requests (200 OK):
```
GET /api/payments/rent-payments/summary/ 200 OK
{
  "monthly_rent": 30000,
  "rent_due": 15000,
  "rent_paid": 15000,
  "prepaid_months": 0,
  "rent_status": "due"
}

GET /api/communication/reports/ 200 OK
[{...reports...}]

GET /api/payments/rent-payments/ 200 OK
[{...payment history...}]
```

### Bad Requests to Fix (Should NOT appear):
```
❌ GET /api/accounts/subscription/status/ 403 Forbidden
   → This is OK - tenants don't need subscriptions

❌ GET /api/accounts/properties/ 403 Forbidden
   → This should not be called for tenants
```

## Database Verification

### Check tenant has assigned unit:
```python
from accounts.models import Unit, CustomUser

user = CustomUser.objects.get(user_type='tenant', email='tenant@example.com')
unit = Unit.objects.filter(tenant=user).first()

print(f"Unit: {unit.unit_number}")
print(f"Monthly Rent: {unit.rent}")
print(f"Outstanding: {unit.rent_remaining}")
print(f"Tenant: {unit.tenant}")
```

### Check payment history exists:
```python
from payments.models import Payment

user = CustomUser.objects.get(user_type='tenant', email='tenant@example.com')
unit = Unit.objects.filter(tenant=user).first()
payments = Payment.objects.filter(unit=unit)

for p in payments:
    print(f"Payment {p.id}: {p.amount} - {p.status}")
```

### Check reports exist:
```python
from communication.models import Report

user = CustomUser.objects.get(user_type='tenant', email='tenant@example.com')
reports = Report.objects.filter(tenant=user)

for r in reports:
    print(f"Report {r.id}: {r.title} - {r.status}")
```

## Troubleshooting

### Issue: Still seeing 403 errors
**Solution 1:** Restart Django backend
```bash
Ctrl+C in terminal
python manage.py runserver
```

**Solution 2:** Clear all cache
```bash
python manage.py shell
from django.core.cache import cache
cache.clear()
exit()
```

**Solution 3:** Check user_type in database
```python
from accounts.models import CustomUser
user = CustomUser.objects.get(email='tenant@example.com')
print(f"User Type: {user.user_type}")  # Should be 'tenant'
```

### Issue: Dashboard shows 0 for monthly rent
**Possible Causes:**
1. Tenant not assigned to a unit
2. Unit.rent field is empty
3. API call failed silently

**Fix:**
```python
from accounts.models import CustomUser, Unit
user = CustomUser.objects.get(email='tenant@example.com')
unit = Unit.objects.filter(tenant=user).first()

if not unit:
    print("❌ Tenant not assigned to any unit")
else:
    print(f"✅ Assigned to unit: {unit.unit_number}")
    print(f"Monthly rent: {unit.rent}")
    if not unit.rent:
        print("⚠️ Unit.rent is empty - update it in admin or API")
```

### Issue: Payment history not showing
**Check:**
1. Payments exist in database
2. Payment status is 'Success'
3. Payment.tenant field matches user ID

```python
from payments.models import Payment
from accounts.models import Unit, CustomUser

user = CustomUser.objects.get(email='tenant@example.com')
unit = Unit.objects.filter(tenant=user).first()

payments = Payment.objects.filter(unit=unit)
print(f"Payments count: {payments.count()}")
for p in payments:
    print(f"  {p.id}: {p.amount} ({p.status})")
```

## Success Indicators

### ✅ All systems working if you see:
1. Dashboard loads in 2-3 seconds without 403 errors
2. Monthly rent displays correct value from database
3. Outstanding balance shows correct amount
4. Payment history displays (if payments exist)
5. Reports list shows (if reports exist)
6. Can submit new reports without errors
7. Payment form shows correct data
8. No red error boxes in UI

### Expected Data Sources:
| Item | Source | Field |
|------|--------|-------|
| Monthly Rent | Database Unit | `Unit.rent` |
| Outstanding | Database Unit | `Unit.rent_remaining` |
| Room Number | Database Unit | `Unit.unit_number` |
| Payment History | Database Payments | Filtered by tenant |
| Reports | Database Reports | Filtered by tenant |
| Tenant Info | Auth Context | `user` object |

## Next Steps if Issues Persist

1. **Check backend logs:**
   ```bash
   # Look for any errors in Django output
   ```

2. **Check frontend logs:**
   ```javascript
   // Console should show:
   // "Loading reports..." messages
   // No Uncaught errors
   ```

3. **Make API request manually:**
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:8000/api/payments/rent-payments/summary/
   ```

4. **Create test data if needed:**
   ```python
   # Use Django admin or shell to create:
   # - Units with tenant assignments
   # - Payments with Success status
   # - Reports with tenant assignments
   ```

---

**All changes documented in:** `TENANT_BACKEND_FIX_SUMMARY.md`
