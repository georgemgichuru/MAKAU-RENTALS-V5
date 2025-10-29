# Deposit Default Fix - Unit Creation

## Problem
When creating units (both single and bulk), if the deposit field was left empty or set to 0, the system was incorrectly setting the deposit to 0 instead of defaulting to the monthly rent value.

## Root Cause
The issue existed in two places:

### 1. Backend (Django) - `views.py`
In the `CreateUnitView`, when preparing unit data, the deposit was being set using:
```python
'deposit': request.data.get('deposit', 0)
```

This meant:
- Empty string → 0
- Not provided → 0
- 0 → 0

### 2. Frontend (React) - `AdminOrganisation.jsx`
The JavaScript code was using:
```javascript
deposit: parseInt(unitData.deposit || unitData.rent)
```

The problem with this is:
- `parseInt("")` returns `NaN`
- `parseInt("0")` returns `0`
- Both cases should fall back to rent, but the logic wasn't working correctly

## Solution

### Backend Fix (`Makau Rentals/app/accounts/views.py`)
Changed the deposit handling logic in `CreateUnitView`:

```python
# Get rent value
rent = request.data.get('rent', 0)
# Get deposit value - if not provided or empty, default to rent
deposit = request.data.get('deposit')
if deposit is None or deposit == '' or deposit == 0:
    deposit = rent  # Default deposit to rent if not specified

# Prepare unit data
unit_data = {
    # ... other fields ...
    'rent': rent,
    'deposit': deposit,
    # ... other fields ...
}
```

### Frontend Fix (`Makao-Center-V4/src/components/Admin/AdminOrganisation.jsx`)
Updated both single unit creation and bulk unit creation:

```javascript
// Parse deposit - if empty or 0, use rent value
const depositValue = unitData.deposit && parseInt(unitData.deposit) > 0 
  ? parseInt(unitData.deposit) 
  : parseInt(unitData.rent);

const unitPayload = {
  // ... other fields ...
  rent: parseInt(unitData.rent),
  deposit: depositValue,
  // ... other fields ...
};
```

## Expected Behavior After Fix

### Creating a Unit
1. **Deposit field left empty**: Deposit = Rent
2. **Deposit set to 0**: Deposit = Rent  
3. **Deposit set to custom value (e.g., 15000)**: Deposit = 15000
4. **Deposit set but then cleared**: Deposit = Rent

### Examples
- Rent: 25,000 KSh, Deposit: (empty) → **Deposit becomes 25,000 KSh**
- Rent: 30,000 KSh, Deposit: 0 → **Deposit becomes 30,000 KSh**
- Rent: 25,000 KSh, Deposit: 15,000 → **Deposit remains 15,000 KSh**
- Rent: 40,000 KSh, Deposit: 50,000 → **Deposit remains 50,000 KSh**

## Testing Checklist

### Single Unit Creation
- [ ] Create unit with empty deposit field → Deposit should equal rent
- [ ] Create unit with deposit = 0 → Deposit should equal rent
- [ ] Create unit with custom deposit → Deposit should be custom value
- [ ] Create unit, enter deposit, then clear it → Deposit should equal rent

### Bulk Unit Creation
- [ ] Bulk create units with empty deposit field → All units should have deposit = rent
- [ ] Bulk create units with deposit = 0 → All units should have deposit = rent
- [ ] Bulk create units with custom deposit → All units should have custom deposit
- [ ] Bulk create with custom room type (has default deposit) → Should use room type deposit if not overridden

### Verification
- [ ] Check created units in database to confirm deposit values
- [ ] Verify UI displays correct deposit amounts
- [ ] Test with different rent amounts (e.g., 10,000, 25,000, 50,000)
- [ ] Confirm landlord can still set custom deposits when needed

## Files Modified
1. `Makau Rentals/app/accounts/views.py` - Backend CreateUnitView
2. `Makao-Center-V4/src/components/Admin/AdminOrganisation.jsx` - Frontend unit creation logic

## Impact
✅ Fixes issue where deposits were incorrectly set to 0
✅ Maintains backward compatibility with existing units
✅ Allows landlords to set custom deposits when needed
✅ Works for both single and bulk unit creation
✅ Applies to both predefined unit types and custom room types

## Notes
- The default behavior (deposit = rent) is a common practice in rental management
- Landlords can still override this by explicitly setting a different deposit amount
- This fix applies to NEW units being created; existing units are not affected
- The fix is consistent across both frontend and backend
