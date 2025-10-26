# Quick Testing Guide: User Type Validation

## Test Objective
Verify that users cannot login to dashboards using wrong account type credentials.

## Prerequisites
- Both Landlord and Tenant test accounts must exist
- Backend server running
- Frontend running
- Browser DevTools console accessible for checking logs

## Test Cases

### ✅ Test 1: Correct Landlord Login
**Steps:**
1. Navigate to login page
2. Click "Sign Up" → Select "Landlord" tab
3. Enter valid landlord email and password
4. Click "Sign In as Landlord"

**Expected Results:**
- ✅ Login succeeds
- ✅ Redirected to `/admin` dashboard
- ✅ "Landlord" shown in navigation
- ✅ Console shows: "User data received: {user_type: 'landlord', ...}"

---

### ✅ Test 2: Correct Tenant Login
**Steps:**
1. Navigate to login page
2. Keep "Login" tab, select "Tenant" tab
3. Enter valid tenant email and password
4. Click "Sign In as Tenant"

**Expected Results:**
- ✅ Login succeeds
- ✅ Redirected to `/tenant` dashboard
- ✅ "Tenant" shown in navigation
- ✅ Console shows: "User data received: {user_type: 'tenant', ...}"

---

### ❌ Test 3: Landlord Credentials with Tenant Account Type
**Steps:**
1. Navigate to login page
2. Select "Login" → Select "Tenant" tab
3. Enter **landlord's** email and password
4. Click "Sign In as Tenant"

**Expected Results:**
- ❌ Login fails
- 🔴 Error message shows:
  ```
  "This account is registered as a landlord, not as a Tenant. 
   Please log in with the correct account type."
  ```
- ❌ User NOT logged in
- ❌ NOT redirected to tenant dashboard
- ✅ Console shows validation error from backend

---

### ❌ Test 4: Tenant Credentials with Landlord Account Type
**Steps:**
1. Navigate to login page
2. Select "Login" → Select "Landlord" tab
3. Enter **tenant's** email and password
4. Click "Sign In as Landlord"

**Expected Results:**
- ❌ Login fails
- 🔴 Error message shows:
  ```
  "This account is registered as a tenant, not as a Landlord. 
   Please log in with the correct account type."
  ```
- ❌ User NOT logged in
- ❌ NOT redirected to landlord dashboard
- ✅ Console shows validation error from backend

---

### 🔒 Test 5: Direct URL Access - Tenant Accessing /admin
**Steps:**
1. Login as tenant successfully (see Test 2)
2. Manually type `/admin` in URL bar or navigate directly
3. Press Enter

**Expected Results:**
- 🔄 Automatically redirected to `/tenant` dashboard
- ✅ No error message (seamless redirect)
- ✅ Console shows: `"Role validation failed: User is 'tenant' but route requires 'landlord'..."`
- ✅ User remains logged in as tenant

---

### 🔒 Test 6: Direct URL Access - Landlord Accessing /tenant
**Steps:**
1. Login as landlord successfully (see Test 1)
2. Manually type `/tenant` in URL bar or navigate directly
3. Press Enter

**Expected Results:**
- 🔄 Automatically redirected to `/admin` dashboard
- ✅ No error message (seamless redirect)
- ✅ Console shows: `"Role validation failed: User is 'landlord' but route requires 'tenant'..."`
- ✅ User remains logged in as landlord

---

### 🔒 Test 7: Token Tampering Prevention
**Advanced Test - Simulates Token Hijacking**

**Steps:**
1. Login as tenant successfully (Test 2)
2. Open DevTools (F12) → Application → LocalStorage
3. Find `userType` and change value from `'tenant'` to `'landlord'`
4. Refresh the page or try to access `/admin`

**Expected Results:**
- ❌ User is automatically logged out
- 🔄 Redirected to `/login`
- ✅ Error message shown (user type mismatch detected)
- ✅ Console shows: `"User type mismatch! Stored: landlord, Actual: tenant. Logging out."`
- ✅ LocalStorage cleared:
  - `accessToken` - removed
  - `refreshToken` - removed
  - `userType` - removed
  - `userData` - removed

---

### 🔒 Test 8: Invalid Credentials (Different Person)
**Steps:**
1. Navigate to login page
2. Select "Login" → Select "Landlord" tab
3. Enter email of a tenant and any random password
4. Click "Sign In as Landlord"

**Expected Results:**
- ❌ Login fails
- 🔴 Error message shows:
  ```
  "Invalid email or password"
  ```
  (This is the standard auth error, not a type mismatch)
- ❌ User NOT logged in

---

## Console Logging Verification

Open DevTools Console (F12 → Console) and verify these logs appear:

### Successful Tenant Login:
```
Attempting login with: {email: "tenant@example.com", userType: "tenant"}
User data received: {id: 1, email: "tenant@example.com", user_type: "tenant", ...}
```

### Failed Cross-Type Login (Landlord creds with Tenant selection):
```
Attempting login with: {email: "landlord@example.com", userType: "tenant"}
Login error: {
  response: {
    data: {
      non_field_errors: [
        "Invalid credentials. This account is registered as a landlord, not as a tenant. 
         Please log in using the correct account type."
      ]
    }
  }
}
```

### Token Tampering Detection:
```
User type mismatch! Stored: landlord, Actual: tenant. Logging out.
```

### Route Protection Redirect:
```
Role validation failed: User is 'tenant' but route requires 'landlord'. 
Redirecting to appropriate dashboard.
```

---

## Checking Network Requests

Use Browser DevTools Network Tab to verify backend validation:

1. Login as Tenant with Landlord credentials
2. Open DevTools → Network tab
3. Filter for "token" requests
4. Click on the login request
5. Check Response tab - should see error:

```json
{
  "non_field_errors": [
    "Invalid credentials. This account is registered as a landlord, 
     not as a tenant. Please log in using the correct account type."
  ]
}
```

---

## Test Data

**Sample Test Accounts:**

### Landlord Account
- Email: `landlord@example.com`
- Password: `SecurePassword123`
- User Type: `landlord`

### Tenant Account  
- Email: `tenant@example.com`
- Password: `SecurePassword456`
- User Type: `tenant`

*Note: Replace with actual test accounts from your database*

---

## Test Results Template

| Test # | Test Name | Status | Notes |
|--------|-----------|--------|-------|
| 1 | Correct Landlord Login | ✅ PASS | Logged in as landlord |
| 2 | Correct Tenant Login | ✅ PASS | Logged in as tenant |
| 3 | Landlord Creds as Tenant | ❌ PASS | Error shown correctly |
| 4 | Tenant Creds as Landlord | ❌ PASS | Error shown correctly |
| 5 | Tenant Direct /admin | 🔒 PASS | Redirected to /tenant |
| 6 | Landlord Direct /tenant | 🔒 PASS | Redirected to /admin |
| 7 | Token Tampering | 🔒 PASS | Auto logout detected |
| 8 | Invalid Credentials | ❌ PASS | Standard error shown |

---

## Common Issues & Troubleshooting

### Issue: Login succeeds when it shouldn't
**Possible Causes:**
- Backend not updated/restarted
- Browser cache not cleared
- User type in database not set correctly

**Solution:**
```bash
# Backend
- Restart Django server
- Verify user_type in database
- Check backend console for validation logs

# Frontend  
- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh (Ctrl+Shift+R)
```

### Issue: Token tampering test doesn't work
**Possible Causes:**
- Browser cache preventing auth check
- Token still valid despite type mismatch

**Solution:**
- Hard refresh page after modifying localStorage
- Try accessing a protected API endpoint
- Check if auth check runs on next page navigation

### Issue: Error message not showing
**Possible Causes:**
- Error extracted from wrong response field
- Network error preventing backend response

**Solution:**
- Check Network tab in DevTools for response
- Check browser console for errors
- Verify backend error format matches expectations

---

## Sign-Off Checklist

- [ ] Test 1: Correct Landlord Login - PASS
- [ ] Test 2: Correct Tenant Login - PASS  
- [ ] Test 3: Landlord Creds as Tenant - PASS (Error shown)
- [ ] Test 4: Tenant Creds as Landlord - PASS (Error shown)
- [ ] Test 5: Tenant Direct /admin - PASS (Redirected)
- [ ] Test 6: Landlord Direct /tenant - PASS (Redirected)
- [ ] Test 7: Token Tampering - PASS (Auto logout)
- [ ] Test 8: Invalid Credentials - PASS (Error shown)
- [ ] Console Logs verified
- [ ] Network requests verified
- [ ] No breaking changes observed
- [ ] All UI flows work correctly

**Tested By**: ________________  
**Date**: ________________  
**Backend Version**: ________________  
**Frontend Version**: ________________
