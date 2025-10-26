# Tenant Dashboard - Diagnosis Guide

## What to Check in Browser Console

### Step 1: Check Authentication
1. Open DevTools (F12)
2. Go to **Console** tab
3. Run:
```javascript
// Check if token exists
console.log("Token:", localStorage.getItem('accessToken'));
console.log("User Type:", localStorage.getItem('userType'));
console.log("User Data:", JSON.parse(localStorage.getItem('userData') || '{}'));
```

**Expected Output:**
```
Token: eyJ0eXAiOiJKV1QiLCJhbGc... (JWT token)
User Type: tenant
User Data: {id: 123, email: "tenant@email.com", user_type: "tenant", full_name: "John Doe", ...}
```

---

### Step 2: Check What API Calls are Being Made
1. Go to **Network** tab in DevTools
2. Filter by "XHR" or "Fetch"
3. Look for these requests:
   - `/api/payments/rent-payments/summary/`
   - `/api/communication/reports/`

**For each request, check:**

#### `/api/payments/rent-payments/summary/`
- **Status:** Should be `200`
- **Response Body:** Should contain:
  ```json
  {
    "monthly_rent": 15000,
    "rent_due": 5000,
    "rent_paid": 10000,
    "prepaid_months": 0,
    "rent_status": "due"
  }
  ```

#### `/api/communication/reports/`
- **Status:** Should be `200`
- **Response Body:** Should be an array of reports (or empty array)

---

### Step 3: Check Console Logs for Debugging
1. Go to **Console** tab
2. Look for logs starting with:
   - 🔵 (Info - blue)
   - ✅ (Success - green)
   - ❌ (Error - red)

**Expected logs for successful load:**
```
🔵 API Request: GET https://preaccommodatingly-nonabsorbable-joanie.ngrok-free.dev/api/payments/rent-payments/summary/
🔵 Token present: true
✅ API Response: 200 GET /payments/rent-payments/summary/
🔵 TenantDashboard: Fetching rent summary...
🔵 User ID: 5
🔵 User Type: tenant
✅ Rent Summary Response: {monthly_rent: 15000, rent_due: 5000, ...}
🔵 TenantDashboard: Fetching reports...
✅ Reports Response: [...]
✅ Filtered Reports: [...]
```

---

## Common Issues and Solutions

### Issue 1: `❌ API Error: 403`
**What it means:** Forbidden - user doesn't have permission

**Why it happens:**
- Backend RentSummaryView is still checking for landlord-only
- Backend logic not properly handling tenants

**Fix:**
```bash
# Check backend code at line 1037 in payments/views.py
# Should have: if user.user_type == 'tenant':
```

---

### Issue 2: `❌ API Error: 401`
**What it means:** Unauthorized - token is invalid or expired

**Why it happens:**
- Token in localStorage is not valid
- Token was not set during login

**Fix:**
1. Log out
2. Log back in
3. Check that token was saved to localStorage

---

### Issue 3: `❌ API Error: 404`
**What it means:** Endpoint not found

**Why it happens:**
- Backend endpoint is not registered in urls.py
- Endpoint path is wrong

**Fix:**
```bash
# Check backend urls.py for:
# path('rent-payments/summary/', RentSummaryView.as_view()),
```

---

### Issue 4: No API calls at all
**What it means:** Component never tries to fetch data

**Why it happens:**
- `user?.id` is undefined
- AuthContext is not providing user data

**Fix:**
1. Check in console: `console.log(localStorage.getItem('userData'))`
2. Should show user data with an `id` field
3. If missing, user didn't log in properly

---

## Manual Test Procedure

### Test 1: Token is Valid
```javascript
// Run in console:
const token = localStorage.getItem('accessToken');
fetch('https://preaccommodatingly-nonabsorbable-joanie.ngrok-free.dev/api/accounts/me/', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'ngrok-skip-browser-warning': 'true'
  }
})
.then(r => r.json())
.then(d => console.log('User:', d))
.catch(e => console.error('Error:', e));
```

**Expected:** User object with `user_type: "tenant"`

---

### Test 2: Rent Summary Endpoint
```javascript
// Run in console:
const token = localStorage.getItem('accessToken');
fetch('https://preaccommodatingly-nonabsorbable-joanie.ngrok-free.dev/api/payments/rent-payments/summary/', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'ngrok-skip-browser-warning': 'true'
  }
})
.then(r => r.json())
.then(d => console.log('Rent Summary:', d))
.catch(e => console.error('Error:', e));
```

**Expected:** Rent summary object with `monthly_rent`, `rent_due`, etc.

---

### Test 3: Reports Endpoint
```javascript
// Run in console:
const token = localStorage.getItem('accessToken');
fetch('https://preaccommodatingly-nonabsorbable-joanie.ngrok-free.dev/api/communication/reports/', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'ngrok-skip-browser-warning': 'true'
  }
})
.then(r => r.json())
.then(d => console.log('Reports:', d))
.catch(e => console.error('Error:', e));
```

**Expected:** Array of report objects (or empty array)

---

## Backend Debugging

### Check RentSummaryView Logic
```bash
# SSH to backend server and check:
cd app
python manage.py shell
```

```python
from accounts.models import CustomUser
from payments.models import Unit

# Find a tenant user
tenant = CustomUser.objects.filter(user_type='tenant').first()
print(f"Tenant: {tenant}")
print(f"Tenant ID: {tenant.id}")
print(f"Tenant Type: {tenant.user_type}")

# Find their unit
unit = Unit.objects.filter(tenant=tenant).first()
print(f"Unit: {unit}")
print(f"Unit Rent: {unit.rent if unit else 'NO UNIT'}")
print(f"Unit Rent Remaining: {unit.rent_remaining if unit else 'NO UNIT'}")
```

---

### Check Backend Logs
```bash
# In another terminal, tail the backend logs:
cd app
tail -f logs/debug.log
```

Then reload the frontend dashboard and watch for errors in the logs.

---

## Data Requirements Checklist

Before testing, ensure:

- [ ] At least one tenant user exists
- [ ] Tenant user has `current_unit` assigned
- [ ] Unit has `rent` value set (> 0)
- [ ] Unit has `rent_remaining` value set
- [ ] Unit has `property_obj` assigned to a property
- [ ] Property has a landlord assigned

If any of these are missing, the API calls will fail or return incomplete data.

---

## Next Steps If Still Broken

1. **Collect the actual error messages from console** - Copy and paste the ❌ lines
2. **Check the Network tab response** - Show the full response body from failed requests
3. **Run the manual test procedures above** - See which one fails
4. **Check if tenant user exists** - Run the backend shell commands

Once you have this information, the exact issue can be pinpointed.
