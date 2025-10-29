# Testing Subscription Display Fix

## Quick Test Guide

### Step 1: Test Backend Subscription Status Endpoint

**Option A: Using Browser (if logged in)**
```
http://localhost:8000/api/accounts/subscription/status/
```

**Option B: Using PowerShell**
```powershell
# Login first to get token
$loginBody = @{
    email = "your-landlord-email@example.com"
    password = "your-password"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:8000/api/accounts/token/" -Method POST -Body $loginBody -ContentType "application/json"

$token = $loginResponse.access

# Get subscription status
$headers = @{
    "Authorization" = "Bearer $token"
}

$subStatus = Invoke-RestMethod -Uri "http://localhost:8000/api/accounts/subscription/status/" -Method GET -Headers $headers

$subStatus
```

**Expected Response for Free Trial User:**
```json
{
  "plan": "free",
  "is_active": true,
  "expiry_date": "2025-12-28T12:00:00Z",
  "status": "Subscribed"
}
```

### Step 2: Test Frontend Subscription Page

1. **Start Frontend Dev Server**:
   ```powershell
   cd "c:\Users\George Mwangi\Desktop\MAKAU-RENTALS-V5\Makao-Center-V4"
   npm run dev
   ```

2. **Login as Landlord** (on free trial)

3. **Navigate to Subscription Page**: `/admin/subscription`

4. **Expected to See**:
   - ✅ Free Trial Active banner at the top
   - ✅ "X Days Remaining" countdown
   - ✅ Current number of units displayed
   - ✅ Suggested billing tier after trial
   - ✅ Monthly cost information
   - ✅ Note about billing adjustment

5. **Should NOT See**:
   - ❌ "Current Plan" badge on Lifetime Access card
   - ❌ Hardcoded "onetime" plan as active

### Step 3: Test Property Creation Warning

**Using API:**
```powershell
# Create a property
$propertyBody = @{
    name = "Test Property"
    city = "Nairobi"
    state = "Nairobi"
    unit_count = 5
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $token"
}

$propertyResponse = Invoke-RestMethod -Uri "http://localhost:8000/api/accounts/properties/create/" -Method POST -Body $propertyBody -Headers $headers -ContentType "application/json"

# Check if trial_warning is present
$propertyResponse.trial_warning
```

**Expected Response** (if on free trial):
```json
{
  "id": 1,
  "name": "Test Property",
  "trial_warning": {
    "message": "Property created successfully! You are on a free trial with 58 days remaining.",
    "billing_info": {
      "total_units": 5,
      "suggested_tier": "Tier 1 (1-10 Units)",
      "monthly_cost": 2000,
      "billing_starts": "2025-12-28"
    },
    "note": "After your trial ends, you will be charged KES 2000/month for Tier 1..."
  }
}
```

### Step 4: Test Unit Count and Tier Progression

1. **Check current unit count**:
   - Subscription page should show accurate count

2. **Add units to cross tier threshold**:
   - Start with 5 units → See Tier 1 (KES 2,000/month)
   - Add 6 more → Should update to Tier 2 (KES 2,500/month)
   - Add 10 more → Should update to Tier 3 (KES 4,500/month)

3. **Verify on Subscription Page**:
   - Refresh page after adding units
   - Banner should reflect new tier and cost

## Visual Verification Checklist

### Subscription Page Should Show:

**For Free Trial Users:**
```
┌─────────────────────────────────────────────────┐
│ 🕐 Free Trial Active - 58 Days Remaining       │
│                                                 │
│ You're currently on a 60-day free trial.       │
│ You have 5 units created.                      │
│                                                 │
│ ⚠️  After your trial ends:                     │
│                                                 │
│ You'll be automatically enrolled in the        │
│ Tier 1 (1-10 Units) plan at                    │
│ KES 2,000/month based on your current 5 units. │
│                                                 │
│ You can add more properties during your trial. │
│ Your billing will be adjusted based on your    │
│ total units when the trial ends.               │
└─────────────────────────────────────────────────┘
```

**NOT showing:**
- ❌ "Current Plan" on Lifetime Access card
- ❌ Any indication that user has lifetime access

### Dashboard/Settings Should Show:
- Current subscription status
- Days remaining in trial
- Option to upgrade early (optional)

## Common Issues and Solutions

### Issue 1: Still Shows "Lifetime Access" as Active
**Cause**: Frontend not fetching data or caching issue  
**Solution**: 
- Clear browser cache
- Hard refresh (Ctrl + Shift + R)
- Check browser console for API errors

### Issue 2: "Loading..." Never Completes
**Cause**: API call failing  
**Solution**:
- Check browser console for errors
- Verify backend is running
- Check if user is authenticated
- Verify `/accounts/subscription/status/` endpoint works

### Issue 3: Shows "No Subscription Found"
**Cause**: Backend subscription not created  
**Solution**:
- Check database for subscription record
- Verify CompleteLandlordRegistrationView creates subscription
- Manually create subscription if needed:
  ```python
  from accounts.models import CustomUser, Subscription
  from django.utils import timezone
  from datetime import timedelta
  
  user = CustomUser.objects.get(email="landlord@example.com")
  Subscription.objects.create(
      user=user,
      plan="free",
      expiry_date=timezone.now() + timedelta(days=60)
  )
  ```

### Issue 4: Days Remaining Shows Negative or Wrong
**Cause**: Expiry date calculation issue  
**Solution**:
- Check subscription.expiry_date in database
- Verify it's 60 days from registration
- Update if incorrect:
  ```python
  subscription = user.subscription
  subscription.expiry_date = timezone.now() + timedelta(days=60)
  subscription.save()
  ```

## Browser Console Checks

Open browser console (F12) and verify:

1. **API Call Success**:
   ```javascript
   // Should see these requests
   GET /api/accounts/subscription/status/ → 200 OK
   GET /api/accounts/units/ → 200 OK
   ```

2. **Console Logs**:
   ```javascript
   // Should show subscription data
   {plan: "free", is_active: true, expiry_date: "...", status: "Subscribed"}
   ```

3. **No Errors**:
   - No 401 Unauthorized errors
   - No 404 Not Found errors
   - No CORS errors

## Database Verification

**Check Subscription Record**:
```sql
SELECT u.email, s.plan, s.expiry_date, s.start_date
FROM accounts_subscription s
JOIN accounts_customuser u ON s.user_id = u.id
WHERE u.email = 'your-landlord@example.com';
```

**Expected Result**:
```
email                    | plan | expiry_date         | start_date
-------------------------|------|---------------------|--------------------
landlord@example.com     | free | 2025-12-28 10:00:00 | 2025-10-29 10:00:00
```

## Success Criteria

✅ **Backend**:
- Subscription status endpoint returns correct data
- Property/Unit creation includes trial_warning
- Subscription model has correct plan and expiry

✅ **Frontend**:
- Subscription page fetches data on mount
- Loading state shows while fetching
- Free trial banner displays correctly
- Days remaining calculates accurately
- Tier and cost show based on unit count
- No "Lifetime Access" shown for free trial users

✅ **User Experience**:
- Clear visibility of trial status
- Transparent billing information
- Warnings about upcoming charges
- Easy to understand pricing tiers

## Next Steps After Testing

1. **If all tests pass**:
   - Deploy to production
   - Monitor user feedback
   - Track trial conversions

2. **If issues found**:
   - Document specific error
   - Check browser console
   - Verify API responses
   - Review backend logs

3. **Future Enhancements**:
   - Add email notifications for trial expiry
   - Create upgrade prompts
   - Add trial extension option
   - Implement grace period

---

**Last Updated**: October 29, 2025  
**Status**: Ready for Testing  
**Priority**: High
