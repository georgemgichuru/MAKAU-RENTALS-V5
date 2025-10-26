# Bulk Rent Update Integration - Complete Guide

## Overview
The bulk rent update feature has been fully integrated with the backend API. This allows landlords to update rent prices for multiple units simultaneously with proper validation, error handling, and tenant notifications.

## Backend Integration

### API Endpoint
- **URL**: `/api/payments/bulk-rent-update/`
- **Method**: POST
- **Authentication**: Required (Bearer token)

### Request Format
```json
{
  "update_type": "percentage" | "fixed",
  "amount": <number>,
  "unit_type_filter": "all" | <unit_type_name>,
  "preview_only": false
}
```

### Request Parameters
- `update_type`: Type of update
  - `"percentage"`: Percentage increase (e.g., 10 for 10%)
  - `"fixed"`: Fixed amount increase (e.g., 2000 for KSh 2000)
- `amount`: The numeric value (percentage or fixed amount)
- `unit_type_filter`: Filter by unit type
  - `"all"`: Apply to all units
  - `<unit_type_name>`: Apply only to specific unit type (e.g., "Studio", "1 Bedroom")
- `preview_only`: Boolean to preview changes without applying (not currently used in frontend)

### Response Format
```json
{
  "success": true,
  "message": "Successfully updated rent for X units",
  "units_updated": <number>,
  "details": {
    "total_units_processed": <number>,
    "units_with_rent_changes": <number>,
    "units_actually_updated": <number>
  }
}
```

### Error Response
```json
{
  "error": "Error message description"
}
```

## Frontend Implementation

### New API Service Methods

**File**: `src/services/api.js`

```javascript
// Bulk rent update
bulkRentUpdate: (data) => api.post('/payments/bulk-rent-update/', data),

// Individual unit rent update
updateUnitRent: (unitId, data) => api.put(`/payments/unit-rent-update/${unitId}/`, data),
```

### Component Updates

**File**: `src/components/Admin/AdminPayments.jsx`

#### State Management
```javascript
// Units state
const [units, setUnits] = useState([]);
const [unitsLoading, setUnitsLoading] = useState(false);

// Bulk update state
const [bulkUpdateLoading, setBulkUpdateLoading] = useState(false);
const [bulkUpdateError, setBulkUpdateError] = useState(null);
const [bulkUpdateSuccess, setBulkUpdateSuccess] = useState(null);
```

#### Key Features

1. **Units Fetching**
   - Fetches all units from backend on component mount
   - Transforms backend data to match component format
   - Handles loading and error states

2. **Individual Unit Update**
   - Updates single unit rent via API
   - Immediately updates local state on success
   - Shows error if update fails

3. **Bulk Update Flow**
   - User selects update type (percentage/fixed)
   - User selects room type filter (all/specific)
   - User enters amount
   - Preview shows calculated changes locally
   - Click "Apply Bulk Update" → Shows disclaimer modal
   - Confirm → Sends request to backend
   - Backend processes and notifies tenants
   - Frontend refreshes all units from backend
   - Success/error notification shown

4. **User Notifications**
   - Success notifications (green) with auto-dismiss
   - Error notifications (red) with auto-dismiss
   - Disclaimer modal warns about tenant notifications

## Backend Functionality

### What the Backend Does

**File**: `Makau Rentals/app/payments/views.py` (BulkRentUpdateView)

1. **Validation**
   - Verifies user is a landlord
   - Validates update_type and amount
   - Ensures amount is positive

2. **Unit Filtering**
   - Gets all units owned by landlord
   - Filters by unit_type if specified
   - Handles units without unit_type gracefully

3. **Calculation**
   - For percentage: `new_rent = old_rent * (1 + amount/100)`
   - For fixed: `new_rent = old_rent + amount`
   - Rounds to nearest whole number

4. **Update Process**
   - Updates each unit's rent
   - Recalculates rent_paid and rent_remaining
   - Saves changes to database
   - Handles individual unit errors gracefully

5. **Logging**
   - Logs all update attempts
   - Tracks success/failure counts
   - Provides detailed debug information

6. **Tenant Notification** (Backend handles this)
   - Automatically sends notifications to affected tenants
   - Informs them of rent changes

## Usage Instructions

### For Administrators

1. **Navigate to Payments Section**
   - Go to Admin Dashboard → Payments

2. **View Current Units**
   - See all units with current rent prices
   - Edit individual units by clicking edit icon

3. **Bulk Update Process**
   - Select update type:
     - Percentage Increase: e.g., "10" for 10% increase
     - Fixed Amount: e.g., "2000" for KSh 2000 increase
   - Select room type filter:
     - "All Room Types": Updates all units
     - Specific type: Updates only that type
   - Preview changes in the right panel
   - Click "Apply Bulk Update"
   - Read and confirm the disclaimer
   - Wait for success confirmation
   - Units list refreshes automatically

### Preview Calculations

The preview shows:
- Unit number and type
- Current rent (old_rent)
- New rent after update
- Increase amount
- Total units affected
- Total revenue increase

## Error Handling

### Frontend Errors
- API connection failures
- Invalid input validation
- Token expiration (auto-redirect to login)
- Display user-friendly error messages

### Backend Errors
- Permission denied (non-landlords)
- Invalid data format
- Database errors
- Individual unit update failures (logged but don't stop bulk operation)

## Testing

### Manual Testing Steps

1. **Test Individual Update**
   ```
   - Click edit on a unit
   - Enter new rent value
   - Press Enter or click away
   - Verify update in backend
   ```

2. **Test Bulk Update - Percentage**
   ```
   - Select "Percentage Increase"
   - Select "All Room Types"
   - Enter "10"
   - Verify preview calculations
   - Apply and confirm
   - Check backend database
   ```

3. **Test Bulk Update - Fixed Amount**
   ```
   - Select "Fixed Amount Increase"
   - Select specific room type
   - Enter "2000"
   - Verify preview shows only selected type
   - Apply and confirm
   - Verify only selected type updated
   ```

4. **Test Error Cases**
   ```
   - Try without authentication
   - Try with invalid amounts (negative, zero)
   - Try with non-existent unit types
   ```

## Database Impact

### Tables Affected
- `accounts_unit`: rent, rent_paid, rent_remaining fields updated

### Data Integrity
- Rent calculations maintain precision
- Rent_remaining recalculated based on payments
- All changes logged for audit trail

## Future Enhancements

1. **Preview Only Mode**
   - Add "Preview" button to see changes without applying
   - Use `preview_only: true` parameter

2. **Undo Functionality**
   - Store previous rent values
   - Allow rollback within time window

3. **Scheduled Updates**
   - Schedule bulk updates for future date
   - Automatic annual increases

4. **Advanced Filtering**
   - Filter by property
   - Filter by occupancy status
   - Custom unit selection

5. **Bulk Update History**
   - Track all bulk updates
   - Show who made changes and when
   - Export history reports

## Security Considerations

1. **Authentication**: Only authenticated landlords can update rents
2. **Authorization**: Users can only update their own units
3. **Validation**: All inputs validated on backend
4. **Logging**: All updates logged with user and timestamp
5. **Transactions**: Database updates use transactions for consistency

## Troubleshooting

### Issue: Updates not saving
- **Check**: Browser console for API errors
- **Verify**: Backend server is running
- **Confirm**: User has valid authentication token

### Issue: Wrong units being updated
- **Check**: Unit type filter selection
- **Verify**: Backend unit_type.name matches frontend display

### Issue: Tenants not notified
- **Check**: Backend notification service is configured
- **Verify**: Tenant email addresses are valid
- **Review**: Backend logs for notification errors

## Contact & Support

For issues or questions:
1. Check backend logs: `Makau Rentals/app/logs/`
2. Review API responses in browser console
3. Verify database state directly if needed

---

**Last Updated**: October 26, 2025
**Version**: 1.0
**Status**: ✅ Fully Integrated and Tested
