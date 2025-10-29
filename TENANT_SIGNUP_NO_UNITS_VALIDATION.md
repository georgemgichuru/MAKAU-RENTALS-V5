# Tenant Signup - No Available Units Validation

## Overview
This document describes the implementation of a validation system that prevents tenant signup when a landlord has no available units. The system ensures that tenants can only sign up if there are units available for rent.

## Problem Statement
Previously, the system allowed tenants to begin the signup process even when the landlord had no available units. This created a poor user experience as tenants would only discover the lack of availability after entering their personal information.

## Solution Implementation

### 1. Backend Changes (Django)

**File**: `Makau Rentals/app/accounts/views.py`

**Location**: `ValidateLandlordView` class (around line 1193)

**Changes Made**:
- Updated the error response when no properties with available units are found
- Changed HTTP status from `404` to `400` for better error handling
- Added a `no_available_units` flag in the error response
- Improved error message to be more user-friendly

**Code Changes**:
```python
if not properties_data:
    return Response({
        'error': 'This landlord has no available units at the moment. All units are currently occupied. Please contact the landlord for more information.',
        'no_available_units': True
    }, status=400)
```

**Previous Code**:
```python
if not properties_data:
    return Response({
        'error': 'This landlord has no available units at the moment'
    }, status=404)
```

### 2. Frontend Changes (React)

**File**: `Makao-Center-V4/src/components/Login and Sign Up/LoginForm.jsx`

#### Change 1: Enhanced Error Handling in `fetchLandlordProperties`

**Location**: Around line 298

**Purpose**: Better handling of the no-units-available scenario

**Code Changes**:
```javascript
const fetchLandlordProperties = async (landlordId) => {
  try {
    const response = await authAPI.validateLandlord(landlordId);
    const { properties, landlord_name, landlord_email } = response.data;
    
    setAvailableProperties(properties);
    return true;
  } catch (err) {
    // Check if the error is specifically about no available units
    const isNoUnitsAvailable = err.response?.data?.no_available_units === true;
    const errorMessage = err.response?.data?.error || 'Landlord ID not found. Please check and try again.';
    
    setError(errorMessage);
    setAvailableProperties([]);
    
    // If no units available, we should not allow progression
    return false;
  }
};
```

#### Change 2: UI Message for Properties with No Available Rooms

**Location**: Around line 1243 (in `renderTenantStep3`)

**Purpose**: Display a clear message when a selected property has no available units

**Code Added**:
```javascript
{tenantData.selectedProperty && availableRooms.length === 0 && (
  <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 text-center">
    <AlertCircle className="w-12 h-12 mx-auto mb-3 text-orange-500" />
    <h3 className="font-semibold text-orange-900 mb-2">No Available Units</h3>
    <p className="text-sm text-orange-700">
      All units in this property are currently occupied. Please select a different property or contact the landlord for more information.
    </p>
  </div>
)}
```

## User Flow

### Scenario 1: Landlord Has No Available Units

1. **Tenant enters Landlord ID** (Step 2)
2. **System validates landlord**:
   - Backend checks if landlord exists
   - Backend filters properties to only include those with available units
   - If NO properties have available units → Returns error with `no_available_units: true`
3. **Frontend displays error message**:
   - "This landlord has no available units at the moment. All units are currently occupied. Please contact the landlord for more information."
4. **Tenant cannot proceed** to step 3 (Property Selection)

### Scenario 2: Landlord Has Some Properties with Available Units

1. **Tenant enters Landlord ID** (Step 2)
2. **System validates landlord**:
   - Backend returns only properties that have available units
3. **Tenant proceeds to Step 3**
4. **Tenant selects a property**:
   - If property has available units → Display list of available rooms
   - If property has NO available units → Display orange warning message

### Scenario 3: Property Selected Has No Available Units

1. **Tenant selects a property**
2. **System checks available rooms**:
   - Filters units where `occupied = false`
3. **If no rooms available**:
   - Display orange alert box with message
   - "Continue" button remains disabled
   - Tenant must select a different property

## Key Features

### 1. Backend Validation
- ✅ Only returns properties with available units
- ✅ Returns specific error flag (`no_available_units`)
- ✅ Provides user-friendly error messages
- ✅ Uses appropriate HTTP status codes (400 instead of 404)

### 2. Frontend User Experience
- ✅ Clear error messages at each step
- ✅ Prevents progression when no units available
- ✅ Visual feedback with color-coded alerts (red for errors, orange for warnings)
- ✅ Disabled "Continue" button when no room is selected
- ✅ Option to select different property if one has no units

### 3. Data Integrity
- ✅ Only available units are shown to tenants
- ✅ Occupied units are automatically filtered out
- ✅ Properties without available units are excluded from response

## Technical Details

### Backend API Endpoint
- **Endpoint**: `POST /api/auth/validate-landlord/`
- **Request**: `{ "landlord_code": "LANDLORD_ID" }`
- **Success Response** (200):
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
        "units": [
          {
            "id": 1,
            "unit_number": "A101",
            "unit_code": "PROP-A101",
            "rent": 5000,
            "deposit": 5000,
            "room_type": "Studio",
            "bedrooms": 1,
            "bathrooms": 1
          }
        ]
      }
    ]
  }
  ```
- **Error Response** (400 - No Units Available):
  ```json
  {
    "error": "This landlord has no available units at the moment. All units are currently occupied. Please contact the landlord for more information.",
    "no_available_units": true
  }
  ```
- **Error Response** (404 - Landlord Not Found):
  ```json
  {
    "error": "Landlord ID not found. Please check and try again."
  }
  ```

### Frontend State Management

**Key State Variables**:
- `availableProperties`: Array of properties with available units
- `availableRooms`: Array of available rooms for selected property
- `tenantData.selectedProperty`: ID of selected property
- `tenantData.selectedRoom`: Unit code of selected room
- `error`: Current error message to display

**Validation Flow**:
1. Step 2 → Validate landlord ID and fetch properties
2. Step 3 → Validate property selection and room selection
3. Continue button disabled until room is selected

## Testing Checklist

- [ ] Test with landlord who has no properties
- [ ] Test with landlord who has properties but all units occupied
- [ ] Test with landlord who has some available units
- [ ] Test property selection with no available units
- [ ] Test property selection with available units
- [ ] Verify error messages display correctly
- [ ] Verify "Continue" button is disabled when no room selected
- [ ] Verify tenant cannot bypass validation

## Benefits

1. **Better User Experience**: Tenants know immediately if units are available
2. **Time Saving**: Prevents tenants from wasting time on properties with no availability
3. **Clear Communication**: Helpful error messages guide tenants
4. **Data Accuracy**: Only shows truly available units
5. **System Integrity**: Prevents invalid signup attempts

## Future Enhancements

1. **Waitlist Feature**: Allow tenants to join a waitlist when no units available
2. **Email Notifications**: Notify tenants when units become available
3. **Alternative Properties**: Suggest other landlords with available units
4. **Availability Calendar**: Show when units might become available

## Notes

- The system filters units based on `is_available=True` and `tenant__isnull=True`
- Units are considered occupied when they have a tenant assigned
- The validation happens at the API level for security
- Frontend validation provides immediate user feedback
- Backend validation ensures data integrity

## Related Files

### Backend
- `Makau Rentals/app/accounts/views.py` - ValidateLandlordView
- `Makau Rentals/app/accounts/models.py` - Unit model
- `Makau Rentals/app/accounts/urls.py` - URL routing

### Frontend
- `Makao-Center-V4/src/components/Login and Sign Up/LoginForm.jsx` - Main component
- `Makao-Center-V4/src/services/api.js` - API service

## Version History

- **v1.0** (October 29, 2025) - Initial implementation
  - Added backend validation
  - Enhanced frontend error handling
  - Added UI messages for no available units
