# Testing Guide: Tenant Signup - No Available Units Validation

## Quick Test Scenarios

### Test 1: Landlord with No Available Units
**Objective**: Verify that tenant cannot signup when landlord has no available units

**Steps**:
1. Navigate to tenant signup page
2. Enter personal information (Step 2)
3. Enter a landlord ID where all units are occupied
4. Click "Continue to Property Selection"

**Expected Result**:
- ❌ Error message appears: "This landlord has no available units at the moment. All units are currently occupied. Please contact the landlord for more information."
- ❌ Cannot proceed to Step 3
- ❌ `availableProperties` array is empty
- ✅ Tenant stays on Step 2

**How to Create Test Scenario**:
```sql
-- In Django admin or database
-- 1. Find a landlord
-- 2. Set all their units to occupied:
UPDATE accounts_unit 
SET is_available = FALSE, tenant_id = (SELECT id FROM accounts_customuser WHERE user_type='tenant' LIMIT 1)
WHERE property_obj_id IN (SELECT id FROM accounts_property WHERE landlord_id = <LANDLORD_ID>);
```

---

### Test 2: Landlord with Some Available Units
**Objective**: Verify that tenant can see and select available units

**Steps**:
1. Navigate to tenant signup page
2. Enter personal information (Step 2)
3. Enter a landlord ID with available units
4. Click "Continue to Property Selection"
5. Verify Step 3 displays

**Expected Result**:
- ✅ No error message
- ✅ Proceeds to Step 3
- ✅ Properties with available units are listed
- ✅ Can select a property
- ✅ Available rooms are displayed

---

### Test 3: Property with No Available Units After Selection
**Objective**: Verify UI when a property has no available rooms

**Steps**:
1. Complete Step 2 with valid landlord
2. In Step 3, select a property with NO available units

**Expected Result**:
- ⚠️ Orange alert box appears with message:
  - "No Available Units"
  - "All units in this property are currently occupied. Please select a different property or contact the landlord for more information."
- ❌ "Continue" button remains disabled
- ✅ Can select a different property

**How to Create Test Scenario**:
```sql
-- Partially occupy a landlord's units
-- Leave one property with all units occupied
UPDATE accounts_unit 
SET is_available = FALSE 
WHERE property_obj_id = <SPECIFIC_PROPERTY_ID>;
```

---

### Test 4: Mixed Availability Across Properties
**Objective**: Verify filtering works correctly with mixed scenarios

**Test Data Setup**:
- Landlord has 3 properties:
  - Property A: All units occupied
  - Property B: Some units available
  - Property C: All units available

**Steps**:
1. Enter landlord ID in Step 2
2. Proceed to Step 3

**Expected Result**:
- ✅ Only Property B and C appear in dropdown (Property A is excluded)
- ✅ Selecting Property B shows only available units
- ✅ Selecting Property C shows all units (since all are available)

---

### Test 5: Room Selection and Continuation
**Objective**: Verify room selection enables continuation

**Steps**:
1. Complete Step 2
2. In Step 3, select a property with available units
3. Observe "Continue" button state
4. Click on a room
5. Observe "Continue" button state

**Expected Result**:
- ❌ "Continue" button disabled before room selection
- ✅ "Continue" button enabled after room selection
- ✅ Selected room is highlighted with blue border
- ✅ Green checkmark appears on selected room
- ✅ Can proceed to Step 4

---

## API Testing

### Test Backend Endpoint Directly

#### Test 1: Valid Landlord with Available Units
```bash
curl -X POST http://localhost:8000/api/auth/validate-landlord/ \
  -H "Content-Type: application/json" \
  -d '{"landlord_code": "VALID_LANDLORD_CODE"}'
```

**Expected Response** (200):
```json
{
  "landlord_id": 123,
  "landlord_name": "John Doe",
  "landlord_email": "john@example.com",
  "landlord_phone": "+254712345678",
  "properties": [
    {
      "id": 1,
      "name": "Property Name",
      "address": "City, State",
      "units": [...]
    }
  ]
}
```

#### Test 2: Landlord with No Available Units
```bash
curl -X POST http://localhost:8000/api/auth/validate-landlord/ \
  -H "Content-Type: application/json" \
  -d '{"landlord_code": "LANDLORD_WITH_NO_UNITS"}'
```

**Expected Response** (400):
```json
{
  "error": "This landlord has no available units at the moment. All units are currently occupied. Please contact the landlord for more information.",
  "no_available_units": true
}
```

#### Test 3: Invalid Landlord Code
```bash
curl -X POST http://localhost:8000/api/auth/validate-landlord/ \
  -H "Content-Type: application/json" \
  -d '{"landlord_code": "INVALID_CODE"}'
```

**Expected Response** (404):
```json
{
  "error": "Landlord ID not found. Please check and try again."
}
```

---

## Database Queries for Testing

### Create Test Landlord with No Available Units
```sql
-- 1. Create/find a landlord
SELECT id, landlord_code, full_name FROM accounts_customuser WHERE user_type = 'landlord' LIMIT 1;

-- 2. Get their properties
SELECT id, name FROM accounts_property WHERE landlord_id = <LANDLORD_ID>;

-- 3. Mark all units as occupied
UPDATE accounts_unit 
SET is_available = FALSE, 
    tenant_id = (SELECT id FROM accounts_customuser WHERE user_type='tenant' LIMIT 1)
WHERE property_obj_id IN (
    SELECT id FROM accounts_property WHERE landlord_id = <LANDLORD_ID>
);
```

### Create Test Landlord with Mixed Availability
```sql
-- 1. Mark some units as available
UPDATE accounts_unit 
SET is_available = TRUE, 
    tenant_id = NULL
WHERE id IN (1, 2, 3);  -- Specific unit IDs

-- 2. Mark others as occupied
UPDATE accounts_unit 
SET is_available = FALSE,
    tenant_id = (SELECT id FROM accounts_customuser WHERE user_type='tenant' LIMIT 1)
WHERE id IN (4, 5, 6);  -- Different unit IDs
```

### Check Unit Availability Status
```sql
SELECT 
    u.id,
    u.unit_number,
    u.unit_code,
    u.is_available,
    u.tenant_id,
    p.name as property_name,
    l.full_name as landlord_name,
    l.landlord_code
FROM accounts_unit u
JOIN accounts_property p ON u.property_obj_id = p.id
JOIN accounts_customuser l ON p.landlord_id = l.id
WHERE l.landlord_code = '<LANDLORD_CODE>'
ORDER BY p.name, u.unit_number;
```

---

## Browser Console Testing

### Check Frontend State After API Call
```javascript
// Open browser console on tenant signup page (Step 2)

// 1. Check available properties after validation
console.log('Available Properties:', JSON.stringify(availableProperties, null, 2));

// 2. Check available rooms after property selection
console.log('Available Rooms:', JSON.stringify(availableRooms, null, 2));

// 3. Check tenant data
console.log('Tenant Data:', JSON.stringify(tenantData, null, 2));

// 4. Check current error
console.log('Error:', error);
```

---

## Edge Cases to Test

### 1. ✅ Landlord Exists but Has No Properties
**Expected**: Error message stating no available units

### 2. ✅ Landlord Has Properties but All Are Empty (No Units Created)
**Expected**: Error message stating no available units

### 3. ✅ Landlord Has Properties with Units but All Marked Unavailable
**Expected**: Error message stating no available units

### 4. ✅ Race Condition: Unit Becomes Occupied During Signup
**Scenario**: Tenant selects unit, another tenant books it before payment
**Expected**: Error during payment or final registration step

### 5. ✅ Network Error During Landlord Validation
**Expected**: Generic error message, cannot proceed

---

## Visual Checklist

When testing in the browser, verify these UI elements:

### Step 2 (Personal Information)
- [ ] Error displays in red alert box with AlertCircle icon
- [ ] Error text is clear and actionable
- [ ] Cannot proceed to Step 3 when error exists
- [ ] No properties are loaded

### Step 3 (Property Selection)
- [ ] Property dropdown only shows properties with available units
- [ ] Orange alert appears when property has no rooms
- [ ] Available rooms display with correct information
- [ ] Selected room is highlighted in blue
- [ ] Continue button is disabled until room selected
- [ ] Continue button is enabled after room selection

---

## Automated Test Cases (Future)

### Jest/React Testing Library
```javascript
describe('Tenant Signup - No Available Units', () => {
  test('should show error when landlord has no units', async () => {
    // Mock API response
    // Render component
    // Enter landlord ID
    // Click Continue
    // Assert error message appears
  });

  test('should disable continue button when no room selected', () => {
    // Render Step 3
    // Assert button is disabled
    // Select room
    // Assert button is enabled
  });
});
```

### Django Tests
```python
class ValidateLandlordTestCase(TestCase):
    def test_landlord_with_no_available_units(self):
        """Test that landlord with no units returns 400 error"""
        # Create landlord
        # Create properties with all units occupied
        # Make API request
        # Assert status 400
        # Assert error message
        # Assert no_available_units flag
        
    def test_landlord_with_available_units(self):
        """Test that landlord with units returns 200 success"""
        # Create landlord
        # Create properties with available units
        # Make API request
        # Assert status 200
        # Assert properties list
```

---

## Sign-off Checklist

Before considering this feature complete, verify:

- [ ] Backend returns correct error when no units available
- [ ] Backend returns `no_available_units: true` flag
- [ ] Frontend displays user-friendly error message
- [ ] Frontend prevents progression when no units available
- [ ] UI shows orange alert for properties with no rooms
- [ ] Continue button is properly disabled/enabled
- [ ] Only available units are displayed
- [ ] Properties without available units are filtered out
- [ ] Error messages are clear and actionable
- [ ] Code is documented
- [ ] Changes are tested on multiple browsers
- [ ] Mobile responsiveness is verified

---

## Rollback Plan

If issues arise, revert these changes:

1. **Backend**: Restore `ValidateLandlordView` to return 404 instead of 400
2. **Frontend**: Remove `no_available_units` check in `fetchLandlordProperties`
3. **Frontend**: Remove orange alert UI for properties with no rooms

---

## Support Information

**Documentation**: See `TENANT_SIGNUP_NO_UNITS_VALIDATION.md` for full details

**Contact**: [Your contact information]

**Last Updated**: October 29, 2025
