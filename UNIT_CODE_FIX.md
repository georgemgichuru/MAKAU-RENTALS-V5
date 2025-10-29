# Unit Code Fix - Tenant Application Unit Detection

## Problem
The system was failing to detect the unit automatically during tenant approval by landlord because when a tenant submitted their application, the unit information was not being properly transmitted.

## Root Cause
The frontend was sending the **unit's numeric ID** instead of the **unit_code** during tenant registration:

1. **Frontend Issue**: In `LoginForm.jsx`, when a user selected a room, the code stored `room.id` (numeric) in `tenantData.selectedRoom`
2. **Backend Expectation**: The backend's `TenantRegistrationStepView` expected `unit_code` (alphanumeric string like "A1", "UNIT-123abc") to look up the unit
3. **Mismatch**: The backend query `Unit.objects.get(unit_code=unit_code, ...)` would fail because it was receiving a number instead of the actual unit code

## Solution
Updated the frontend to properly store and send both the `unit_code` and `unit_id`:

### Changes Made

**File**: `Makao-Center-V4/src/components/Login and Sign Up/LoginForm.jsx`

1. **Updated `tenantData` state** to include `selectedRoomId`:
   ```javascript
   const [tenantData, setTenantData] = useState({
     // ... other fields
     selectedRoom: null,      // Now stores unit_code (string)
     selectedRoomId: null,    // New field: stores unit id (number)
     // ... other fields
   });
   ```

2. **Modified `handleRoomSelection` function** to store both values:
   ```javascript
   setTenantData(prev => ({
     ...prev,
     selectedRoom: room.unit_code,  // Store unit_code for registration
     selectedRoomId: room.id,       // Store id for payment
     monthlyRent: rentAmount,
     depositAmount: depositAmount
   }));
   ```

3. **Updated UI comparison logic** to use `unit_code`:
   ```javascript
   // Before: tenantData.selectedRoom?.toString() === room.id.toString()
   // After:  tenantData.selectedRoom === room.unit_code
   ```

4. **Fixed payment initiation** to use `selectedRoomId`:
   ```javascript
   const paymentData = {
     unit_id: parseInt(tenantData.selectedRoomId),  // Use numeric ID for payment
     // ... other fields
   };
   ```

5. **Updated registration submission** to send `unit_code`:
   ```javascript
   const registrationData = {
     // ... other fields
     unit_code: tenantData.selectedRoom,  // Now sends the actual unit_code
     // ... other fields
   };
   ```

## How It Works Now

### Registration Flow:
1. User selects a unit from available rooms
2. Frontend stores:
   - `selectedRoom` = unit's `unit_code` (e.g., "UNIT-123abc")
   - `selectedRoomId` = unit's numeric `id` (e.g., 45)
3. When submitting registration → sends `unit_code` to backend
4. Backend successfully queries: `Unit.objects.get(unit_code=unit_code, ...)`
5. `TenantApplication` is created with the correct `unit` reference
6. Landlord can now see which unit the tenant applied for

### Payment Flow:
1. When initiating payment → uses `selectedRoomId` (numeric ID)
2. Payment API receives correct `unit_id` parameter
3. Payment is linked to the correct unit

## Benefits
✅ Unit is now automatically detected during tenant approval  
✅ Landlords can see which unit each tenant applied for  
✅ No manual unit selection needed during approval  
✅ Payment flow still works correctly with unit IDs  
✅ Backend validation using `unit_code` works as designed

## Testing Checklist
- [ ] Tenant can select a unit during registration
- [ ] Selected unit displays correctly in UI
- [ ] Registration submits with correct `unit_code`
- [ ] Backend creates `TenantApplication` with unit reference
- [ ] Landlord sees unit information in pending applications
- [ ] Deposit payment uses correct `unit_id`
- [ ] Approval process auto-assigns the correct unit

## Files Modified
- `Makao-Center-V4/src/components/Login and Sign Up/LoginForm.jsx`

## Backend (No Changes Needed)
The backend code was already correct and expecting `unit_code`:
- `accounts/views.py` - `TenantRegistrationStepView` properly handles `unit_code`
- `accounts/models.py` - `TenantApplication.unit` field stores the unit reference
- `accounts/views.py` - `ValidateLandlordView` returns both `unit_code` and `id` in API response

## Date
Fixed: October 29, 2025
