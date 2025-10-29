# Unit Code Fix - Visual Flow Diagram

## BEFORE (Problem)

```
┌─────────────────────────────────────────────────────────────┐
│                    TENANT REGISTRATION                      │
└─────────────────────────────────────────────────────────────┘

Frontend (LoginForm.jsx)
  │
  ├─ User selects unit "A1"
  │   Room object: { id: 45, unit_number: "A1", unit_code: "UNIT-ABC123", ... }
  │
  ├─ handleRoomSelection(45)
  │   ❌ Stores: selectedRoom = 45 (numeric ID)
  │
  └─ Registration submission
      ├─ Sends: { unit_code: 45, ... }
      │          ^^^^^^^^^^^^^^^^
      │          WRONG! Sending number instead of code
      │
      └─ Backend receives unit_code = 45

Backend (views.py)
  │
  ├─ unit_code = all_data.get('unit_code')  → Gets 45
  │
  ├─ Unit.objects.get(unit_code=45, ...)
  │   ❌ FAILS! No unit has unit_code="45"
  │   (unit_code is "UNIT-ABC123", not 45)
  │
  └─ TenantApplication.objects.create(
        tenant=user,
        landlord=landlord,
        unit=None,  ← ❌ No unit linked!
        ...
      )

Result: Application created but unit = NULL
Landlord approval screen: ❌ Cannot see which unit
```

## AFTER (Solution)

```
┌─────────────────────────────────────────────────────────────┐
│                    TENANT REGISTRATION                      │
└─────────────────────────────────────────────────────────────┘

Frontend (LoginForm.jsx)
  │
  ├─ User selects unit "A1"
  │   Room object: { id: 45, unit_number: "A1", unit_code: "UNIT-ABC123", ... }
  │
  ├─ handleRoomSelection(45)
  │   ✅ Stores: selectedRoom = "UNIT-ABC123" (unit_code)
  │   ✅ Stores: selectedRoomId = 45 (numeric ID)
  │
  ├─ Registration submission
  │   └─ Sends: { unit_code: "UNIT-ABC123", ... }
  │               ^^^^^^^^^^^^^^^^^^^^^^^^^^^
  │               CORRECT! Sending actual unit_code
  │
  └─ Payment initiation
      └─ Sends: { unit_id: 45, ... }
                  ^^^^^^^^^^^^
                  CORRECT! Payment uses numeric ID

Backend (views.py)
  │
  ├─ unit_code = all_data.get('unit_code')  → Gets "UNIT-ABC123"
  │
  ├─ Unit.objects.get(unit_code="UNIT-ABC123", ...)
  │   ✅ SUCCESS! Unit found
  │
  └─ TenantApplication.objects.create(
        tenant=user,
        landlord=landlord,
        unit=<Unit: A1>,  ← ✅ Unit properly linked!
        ...
      )

Result: Application created WITH unit reference
Landlord approval screen: ✅ Shows "Unit A1" in application
```

## Data Structure Comparison

### BEFORE (Broken)
```javascript
// Frontend State
tenantData = {
  selectedRoom: 45,  // ❌ Numeric ID only
  ...
}

// Registration Payload
{
  "unit_code": 45,  // ❌ Wrong type
  ...
}

// Backend Query
Unit.objects.get(unit_code=45)  // ❌ Fails
```

### AFTER (Fixed)
```javascript
// Frontend State
tenantData = {
  selectedRoom: "UNIT-ABC123",  // ✅ Actual unit_code
  selectedRoomId: 45,           // ✅ Numeric ID for payments
  ...
}

// Registration Payload
{
  "unit_code": "UNIT-ABC123",  // ✅ Correct type and value
  ...
}

// Payment Payload
{
  "unit_id": 45,  // ✅ Numeric ID for payment API
  ...
}

// Backend Query
Unit.objects.get(unit_code="UNIT-ABC123")  // ✅ Success!
```

## Unit Model Reference

```python
class Unit(models.Model):
    id = AutoField(primary_key=True)           # 45
    unit_code = CharField(max_length=30)       # "UNIT-ABC123"
    unit_number = CharField(max_length=10)     # "A1"
    ...
```

## Key Takeaways

1. **unit_code** ≠ **unit_id**
   - `unit_code`: Alphanumeric string (e.g., "UNIT-ABC123")
   - `unit_id`: Numeric primary key (e.g., 45)

2. **Different APIs need different identifiers**
   - Registration API: Expects `unit_code` (string)
   - Payment API: Expects `unit_id` (number)

3. **Frontend must maintain both**
   - `selectedRoom`: For registration (unit_code)
   - `selectedRoomId`: For payments (unit_id)

4. **The fix ensures**
   - Proper unit lookup during registration
   - TenantApplication has unit reference
   - Landlord can see unit in approval screen
   - Payments still work correctly
