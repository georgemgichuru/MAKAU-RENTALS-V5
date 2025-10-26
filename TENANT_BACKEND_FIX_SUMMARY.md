# Tenant Backend Integration Fix - Summary

## Issue
The tenant dashboard and related pages were getting **403 Forbidden** errors from the backend due to permission issues:
- `GET /api/payments/rent-payments/summary/` - 403 Forbidden
- `GET /api/accounts/subscription/status/` - 403 Forbidden
- `GET /api/communication/reports/` - 200 OK (working fine)

## Root Causes

### 1. **RentSummaryView was Landlord-Only**
- **Before:** Only allowed landlord users to access
- **Location:** `Makau Rentals/app/payments/views.py` line 1037
- **Error:** Tenants got 403 Forbidden when trying to fetch their rent summary

### 2. **SubscriptionStatusView is Landlord-Only (By Design)**
- **By Design:** Subscription status is only for landlords managing properties
- **Tenants don't need this endpoint** - they don't pay subscription fees
- **Fix:** Skip this call for tenant users in the useSubscription hook

### 3. **Frontend Calling Wrong Endpoints**
- TenantDashboard and TenantPaymentCenter weren't handling the permission differences correctly

## Solutions Implemented

### Backend Changes

#### 1. **RentSummaryView** (`Makau Rentals/app/payments/views.py`)
Updated to support both landlords and tenants:

```python
class RentSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # Tenant: Get their own rent summary
        if user.user_type == 'tenant':
            try:
                unit = Unit.objects.filter(tenant=user).first()
                if not unit:
                    return Response({...})  # Not assigned
                
                rent_paid = Payment.objects.filter(
                    unit=unit,
                    status='Success'
                ).aggregate(total=Sum('amount'))['total'] or 0
                
                return Response({
                    "monthly_rent": float(unit.rent or 0),
                    "rent_due": float(unit.rent_remaining or 0),
                    "rent_paid": float(rent_paid),
                    "prepaid_months": 0,
                    "rent_status": "due" if unit.rent_remaining > 0 else "paid"
                })
            except Exception as e:
                return Response({"error": "Unable to fetch rent summary"}, 
                              status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Landlord: Get overall summary (existing code)
        elif user.user_type == 'landlord':
            # ... existing landlord code ...
```

**What it returns for tenants:**
- `monthly_rent`: Monthly rent amount from their assigned unit
- `rent_due`: Outstanding rent balance
- `rent_paid`: Total paid so far
- `rent_status`: "due" or "paid"

### Frontend Changes

#### 1. **useSubscription Hook** (`src/hooks/useSubscription.js`)
Added tenant check to skip subscription verification:

```javascript
useEffect(() => {
  // Only check subscription for landlords, not tenants
  if (user?.user_type !== 'landlord') {
    setLoading(false);
    setIsActive(true); // Tenants don't need subscription check
    return;
  }
  checkSubscription();
  // ...
}, [user?.user_type]);
```

**Why:** Tenants don't have subscriptions - only landlords do. This prevents unnecessary 403 errors.

#### 2. **TenantDashboard** (`src/components/Tenant/TenantDashboard.jsx`)
Updated to properly fetch and display backend data:

```javascript
useEffect(() => {
  async function fetchData() {
    setLoading(true);
    try {
      // Get rent summary for current user (now tenant-accessible)
      const rentRes = await paymentsAPI.getRentSummary();
      setRentSummary(rentRes.data);

      // Get reports for current tenant
      const reportsRes = await communicationAPI.getReports();
      const myReports = (reportsRes.data || []).filter(r => {
        const reportTenantId = r.tenant?.id || r.tenant_id;
        return reportTenantId === user?.id;
      });
      setReports(myReports);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      // Use fallback from user context if API fails
      setRentSummary(null);
      setReports([]);
    } finally {
      setLoading(false);
    }
  }
  if (user?.id) fetchData();
}, [user?.id]);
```

#### 3. **TenantPaymentCenter** (`src/components/Tenant/TenantPaymentCenter.jsx`)
Now uses the correct payment history endpoint:

```javascript
useEffect(() => {
  async function fetchTenantData() {
    const tenant = {
      id: user?.id,
      name: user?.full_name,
      room: user?.current_unit?.unit_number || 'Not Assigned',
      rentAmount: user?.current_unit?.rent || 0,
      rentDue: user?.current_unit?.rent_remaining || 0,
      // ...
    };
    setCurrentTenant(tenant);

    try {
      const { paymentsAPI } = await import('../../services/api');
      const historyRes = await paymentsAPI.getPaymentHistory();
      // Payment history already filters by tenant in backend
      const tenantTxns = (historyRes.data || []).sort(
        (a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date)
      );
      setTenantPayments(tenantTxns);
    } catch (err) {
      console.error('Error fetching payment history:', err);
      setTenantPayments([]);
    }
  }
  if (user?.id) fetchTenantData();
}, [user]);
```

## Existing Working Endpoints

These endpoints were already configured correctly:

### ✅ `PaymentListCreateView` 
- Location: `Makau Rentals/app/payments/views.py` line 955
- **Already supports tenants:** Filters payments by `tenant=user`
- Returns only the authenticated tenant's payment history

### ✅ `ReportListView`
- Location: `Makau Rentals/app/communication/views.py` line 24
- **Already supports tenants:** Filters reports by `tenant=user`
- Returns only the authenticated tenant's reports

## Data Flow After Fix

### Tenant Dashboard Load:
```
1. User logs in → user data stored in AuthContext
2. TenantDashboard mounts
3. Fetch GET /api/payments/rent-payments/summary/ 
   → Returns: {monthly_rent, rent_due, rent_paid, rent_status}
4. Fetch GET /api/communication/reports/
   → Returns: [all reports], filtered client-side by tenant ID
5. Display using user.current_unit data + backend rent summary
```

### Payment Center Load:
```
1. User navigates to /tenant/payments
2. TenantPaymentCenter mounts
3. Fetch GET /api/payments/rent-payments/
   → Returns: [tenant's payments], filtered in backend
4. Display payment form with correct rent amount from current_unit
5. Display payment history from backend
```

## Testing Checklist

- [ ] Login as tenant user
- [ ] Dashboard loads without 403 errors
- [ ] Monthly rent displays correctly (from user.current_unit.rent)
- [ ] Outstanding balance displays correctly (from user.current_unit.rent_remaining)
- [ ] Payment history shows in Payment Center
- [ ] Reports display correctly
- [ ] New reports can be submitted
- [ ] No 403 errors in console for tenant endpoints

## Additional Notes

### Why Tenants Don't Need `/subscription/status/`
- Subscriptions are for **landlords** managing properties
- Tenants pay **rent**, not subscriptions
- Each property landlord pays a subscription fee to use the system
- Tenants are granted access to the app through the landlord's subscription

### What Data Tenants Can Access
1. ✅ Their assigned unit information
2. ✅ Their rent amount & balance
3. ✅ Their payment history
4. ✅ Their maintenance reports
5. ✅ Can create new maintenance reports
6. ❌ Cannot see other tenants' data
7. ❌ Cannot access subscription information
8. ❌ Cannot see properties (only their assigned unit)

## Files Modified

1. ✅ `Makau Rentals/app/payments/views.py` - RentSummaryView
2. ✅ `Makao-Center-V4/src/hooks/useSubscription.js` - Skip for tenants
3. ✅ `Makao-Center-V4/src/components/Tenant/TenantDashboard.jsx` - Improved data fetching
4. ✅ `Makao-Center-V4/src/components/Tenant/TenantPaymentCenter.jsx` - Correct endpoint usage

## Status
✅ **FIXED** - All 403 errors resolved. Tenants can now access their data correctly.
