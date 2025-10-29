# Testing Guide: Unit Code Fix

## Quick Test Steps

### 1. Test Tenant Registration with Unit Selection

**Steps:**
1. Open the application in browser
2. Go to tenant registration page
3. Enter a valid landlord code (e.g., from test data)
4. Select a property
5. Select a unit from available rooms
6. Complete the registration form
7. Submit the application

**Expected Results:**
- ✅ Unit selection displays correctly
- ✅ Selected unit shows unit number in confirmation
- ✅ Registration completes successfully
- ✅ Console shows `unitCode` in selection log

### 2. Verify Backend Receives Correct Data

**Check Backend Logs:**
```bash
# Look for these log entries after registration:
✓ Unit with code {unit_code} found
✓ Created TenantApplication with unit reference
```

**Database Check:**
```python
from accounts.models import TenantApplication

# Get the latest application
app = TenantApplication.objects.latest('applied_at')
print(f"Tenant: {app.tenant.full_name}")
print(f"Unit: {app.unit.unit_number if app.unit else 'NOT SET'}")  # Should NOT be 'NOT SET'
print(f"Unit Code: {app.unit.unit_code if app.unit else 'NOT SET'}")
```

### 3. Test Landlord Can See Unit in Applications

**Steps:**
1. Login as landlord
2. Navigate to pending applications
3. View the tenant application

**Expected Results:**
- ✅ Application shows which unit tenant applied for
- ✅ Unit number is displayed
- ✅ Landlord can approve without manually selecting unit

### 4. Test Payment Flow Still Works

**Steps:**
1. During tenant registration, proceed to deposit payment
2. Initiate payment
3. Check payment data being sent

**Expected Results:**
- ✅ Payment API receives numeric `unit_id`
- ✅ Payment initiates successfully
- ✅ Payment is linked to correct unit

### 5. Browser Console Tests

**Open Developer Tools → Console**

When selecting a unit, you should see:
```javascript
Room selected: {
  roomId: 45,              // numeric ID
  unitCode: "UNIT-123abc", // alphanumeric code
  rent: 5000,
  deposit: 5000
}
```

When submitting registration, check the network request payload:
```javascript
{
  "unit_code": "UNIT-123abc",  // Should be string, not number
  "full_name": "...",
  // ... other fields
}
```

### 6. Edge Cases to Test

**Test Case 1: Property with No Available Units**
- Select property → Should show "No available units"
- Should not allow registration without unit selection

**Test Case 2: Changing Property**
- Select property A → Select unit
- Change to property B
- Verify unit selection is cleared
- Select new unit from property B
- Verify correct unit is sent

**Test Case 3: Already Living in Property**
- Check "Already living in property" checkbox
- Registration should still send unit_code if unit selected
- Application should have unit reference

## Quick Verification Command

Run this in Django shell to verify recent applications have units:
```python
from accounts.models import TenantApplication
from django.utils import timezone
from datetime import timedelta

# Check applications from last hour
recent_time = timezone.now() - timedelta(hours=1)
recent_apps = TenantApplication.objects.filter(applied_at__gte=recent_time)

print(f"\n📊 Recent Applications ({recent_apps.count()}):\n")
for app in recent_apps:
    unit_info = f"{app.unit.unit_number} ({app.unit.unit_code})" if app.unit else "❌ NO UNIT"
    print(f"  {app.tenant.full_name} → {unit_info}")
```

## Success Criteria

All tests pass if:
1. ✅ Frontend sends `unit_code` (string) in registration
2. ✅ Backend creates `TenantApplication` with unit reference
3. ✅ Landlord sees unit info in pending applications
4. ✅ Payment flow uses `unit_id` (numeric)
5. ✅ No console errors during unit selection
6. ✅ Database shows unit linked to application

## Rollback Plan

If issues occur, revert this commit:
```bash
cd "Makao-Center-V4"
git revert HEAD
```

The previous code stored `room.id` in `selectedRoom`, which worked for payments but not for registration validation.
