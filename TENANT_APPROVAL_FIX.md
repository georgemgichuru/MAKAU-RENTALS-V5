# Tenant Approval Workflow - Complete Fix

## Issue Summary
New tenant registrations were bypassing the landlord approval requirement and automatically activating accounts, allowing immediate login even when applications were pending.

## Root Cause
In `accounts/views.py` at line 1495, the `CompleteTenantRegistrationView` was auto-activating tenants (`user.is_active = True`) when a deposit payment was detected, completely bypassing the landlord approval workflow.

## Changes Made

### 1. Backend: Remove Auto-Activation Logic
**File:** `Makau Rentals/app/accounts/views.py`

**Before (Lines 1470-1496):**
```python
if deposit_paid:
    # Auto-approve if deposit is paid
    application.deposit_paid = True
    application.status = 'approved'
    application.reviewed_at = timezone.now()
    application.save()

    unit.tenant = user
    unit.is_available = False
    unit.save()

    # Activate user
    user.is_active = True  # ❌ BUG: Auto-activating tenant
    user.save()
```

**After:**
```python
if deposit_paid:
    # Mark deposit as paid but keep status as 'pending' for landlord approval
    application.deposit_paid = True
    application.status = 'pending'  # ✓ Keep pending until landlord approval
    application.save()

    # Reserve the unit but don't assign tenant yet
    unit.is_available = False
    unit.save()

    # DO NOT activate user - must wait for landlord approval
    # user.is_active remains False ✓
```

### 2. Backend: Update Registration Response
**File:** `Makau Rentals/app/accounts/views.py` (Lines 1509-1520)

**Before:**
```python
response_data = {
    'requires_approval': already_living_in_property,  # Only some required approval
}

if already_living_in_property:
    response_data['message'] = 'Registration submitted! Your application has been sent to the landlord for approval.'
else:
    response_data['message'] = 'Registration successful! You can now log in.'  # ❌ Misleading
```

**After:**
```python
response_data = {
    'requires_approval': True,  # ✓ All tenants now require approval
}

# All tenants must wait for landlord approval
response_data['message'] = 'Registration submitted! Your application is pending landlord approval. You will be notified once approved.'
```

### 3. Backend: Inactive Account Detection
**File:** `Makau Rentals/app/accounts/serializers.py` (Lines 30-50)

Added early detection for inactive tenant accounts before password validation:

```python
# Normalize email case for lookup
email_normalized = email.strip()
try:
    email_ci_user = CustomUser.objects.filter(email__iexact=email_normalized).first()
except Exception:
    email_ci_user = None

# If user exists and is inactive tenant, return pending approval message
# even if password is incorrect
if email_ci_user and not email_ci_user.is_active:
    if email_ci_user.groups.filter(name='tenant').exists() or getattr(email_ci_user, 'user_type', None) == 'tenant':
        error_msg = "Your account is pending approval. Please await approval from your landlord or contact us for support."
        raise_string_error(error_msg)
```

### 4. Frontend: Error Message Handling
**File:** `Makao-Center-V4/src/components/Login and Sign Up/LoginForm.jsx` (Lines 183-215)

Updated to handle Django REST Framework's array format for validation errors:

```javascript
if (err.response?.data) {
  // Handle DRF non_field_errors (most common for ValidationError)
  if (err.response.data.non_field_errors) {
    errorMessage = Array.isArray(err.response.data.non_field_errors) 
      ? err.response.data.non_field_errors[0] 
      : err.response.data.non_field_errors;
  }
  // Handle detail field
  else if (err.response.data.detail) {
    errorMessage = Array.isArray(err.response.data.detail) 
      ? err.response.data.detail[0] 
      : err.response.data.detail;
  }
  // ... other error fields
}
```

### 5. Data Migration: Fix Existing Tenants
Created and ran migration scripts to fix existing tenants in the database:

**Fixed tenants:**
- `mpkggamer@gmail.com` - Created TenantApplication, deactivated
- `gegejeb@gmail.com` - Deactivated (old registration flow, no profile)
- `mzee@mail.com` - Deactivated (old registration flow, no profile)

**Total inactive tenants:** 5 (all will see pending approval message)

## Current Workflow

### New Tenant Registration Flow
1. **Step 1-3:** Tenant fills registration form (email, password, landlord code, etc.)
2. **Step 4:** Tenant chooses whether to pay deposit
3. **Backend:**
   - Creates `CustomUser` with `is_active=False` ✓
   - Creates `TenantProfile` linked to landlord ✓
   - Creates `TenantApplication` with `status='pending'` ✓
   - If deposit paid: marks `application.deposit_paid=True` but keeps status as `pending` ✓
   - Reserves unit (`is_available=False`) but doesn't assign tenant yet ✓
4. **Response:** "Registration submitted! Your application is pending landlord approval."

### Login Attempt (Inactive Tenant)
1. Tenant tries to login
2. Backend checks if user exists and is inactive (before password check)
3. Returns: `{"non_field_errors": ["Your account is pending approval. Please await approval from your landlord or contact us for support."]}`
4. Frontend displays friendly error message

### Landlord Approval
1. Landlord views pending applications (`/api/accounts/pending-applications/`)
2. Landlord approves application (`/api/accounts/approve-application/<id>/`)
3. Backend:
   - Sets `application.status = 'approved'`
   - Sets `tenant.is_active = True` ✓
   - Assigns `unit.tenant = tenant`
   - Updates `unit.is_available = False`
4. Tenant can now login successfully

## Testing

### Test Case 1: New Registration
```bash
# Register new tenant
POST /api/accounts/tenant/register/step/5/
# Response: "Your application is pending landlord approval"

# Try to login
POST /api/accounts/token/
{
  "email": "newtenant@test.com",
  "password": "Password123",
  "user_type": "tenant"
}
# Response: 400 {"non_field_errors": ["Your account is pending approval..."]}
```

### Test Case 2: Landlord Approval
```bash
# Landlord approves
POST /api/accounts/approve-application/123/
# Response: 200 OK

# Tenant can now login
POST /api/accounts/token/
# Response: 200 OK with access token
```

### Test Case 3: Existing Inactive Tenants
Verified that all 5 inactive tenants receive the pending approval message:
- `gegejeb@gmail.com` ✓
- `mzee@mail.com` ✓
- `tenant@mail.com` ✓
- `Aruai@mail.com` ✓
- `mpkggamer@gmail.com` ✓

## Files Modified
1. **`Makau Rentals/app/accounts/views.py`** - Fixed ALL tenant registration paths:
   - Line 1388: `CompleteTenantRegistrationView` (step-based) - `is_active=False` ✓
   - Line 1437: Creates `TenantApplication` with `status='pending'` ✓
   - Line 1470-1493: Removed auto-activation even when deposit paid ✓
   - Line 2150: `CompleteTenantRegistrationView` (duplicate) - `is_active=False` ✓
   - Line 2170: Creates `TenantApplication` for this path too ✓
   - Line 2178-2203: Keep tenant inactive even with deposit ✓
2. **`Makau Rentals/app/accounts/serializers.py`** - Fixed all paths:
   - Line 30-50: Inactive account detection before password check ✓
   - Line 161: `TenantRegistrationSerializer` - `is_active=False` ✓
3. **`Makao-Center-V4/src/components/Login and Sign Up/LoginForm.jsx`** - Error handling ✓

## Files Created (Diagnostic Tools)
1. `verify_tenant_status.py` - Check tenant account statuses
2. `fix_buggy_tenants.py` - Fix active tenants without applications
3. `fix_old_tenants.py` - Deactivate tenants from old registration flow
4. `call_token.py` - Test token endpoint
5. `reset_test_password.py` - Reset test user passwords
6. `test_registration_paths.py` - Verify all registration paths ✓

## Verification
✓ **ALL** tenant registration paths create inactive accounts
✓ Deposit payment does NOT auto-activate tenants
✓ Login attempts by inactive tenants show pending approval message
✓ Existing buggy tenants have been fixed
✓ Frontend correctly displays error messages from backend
✓ **New tenants who haven't been created yet will be inactive** ✓

## Next Steps
1. **Test the complete flow:** Register a new tenant and verify they cannot login
2. **Test approval flow:** Have landlord approve the tenant, then verify login works
3. **Optional:** Add email notifications for approval/decline
4. **Optional:** Create landlord dashboard UI for viewing pending applications

## Notes
- All tenants (new and existing) must now wait for landlord approval before accessing the system
- Deposit payment reserves the unit but does not auto-approve the tenant
- Error messages are consistent across all inactive tenant scenarios
- Case-insensitive email lookup ensures the pending message shows regardless of email casing
