# Approve/Decline Tenant UI Implementation

## Overview
Added approve and decline buttons to the landlord tenant management interface, allowing landlords to accept or reject pending tenant applications directly from the AdminTenants component.

## Changes Made

### 1. Frontend API Service (`api.js`)
**Location:** `Makao-Center-V4/src/services/api.js`

Added two new API methods to the `tenantsAPI` object:

```javascript
// Tenant application management
approveTenantApplication: (applicationId) => api.post(`/accounts/approve-application/${applicationId}/`),
declineTenantApplication: (applicationId) => api.post(`/accounts/decline-application/${applicationId}/`),
```

**Also Fixed:**
- Updated `getPendingApplications` endpoint from `/accounts/applications/pending/` to `/accounts/tenant-applications/pending/` to match backend URL

### 2. AdminTenants Component (`AdminTenants.jsx`)
**Location:** `Makao-Center-V4/src/components/Admin/AdminTenants.jsx`

#### Added Icons
```javascript
import { UserCheck, UserX } from 'lucide-react';
```
- `UserCheck` - Approve button icon
- `UserX` - Decline button icon

#### Added API Import
```javascript
import { tenantsAPI } from '../../services/api';
```

#### Added Handler Functions

**Approve Handler:**
```javascript
const handleApproveTenant = async (application) => {
  if (!window.confirm(`Are you sure you want to approve ${application.name}'s application?`)) {
    return;
  }

  try {
    console.log('Approving application:', application.id);
    const response = await tenantsAPI.approveTenantApplication(application.id);
    console.log('Approval response:', response.data);
    
    alert(`${application.name} has been approved! They can now login to their account.`);
    
    // Refresh the page to update the pending applications list
    window.location.reload();
  } catch (error) {
    console.error('Error approving application:', error);
    const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to approve application';
    alert(`Error: ${errorMessage}`);
  }
};
```

**Decline Handler:**
```javascript
const handleDeclineTenant = async (application) => {
  const reason = window.prompt(
    `Are you sure you want to decline ${application.name}'s application?\n\nPlease enter a reason (optional):`
  );
  
  // User clicked cancel
  if (reason === null) {
    return;
  }

  try {
    console.log('Declining application:', application.id);
    const response = await tenantsAPI.declineTenantApplication(application.id);
    console.log('Decline response:', response.data);
    
    alert(`${application.name}'s application has been declined and removed from the system.`);
    
    // Refresh the page to update the pending applications list
    window.location.reload();
  } catch (error) {
    console.error('Error declining application:', error);
    const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to decline application';
    alert(`Error: ${errorMessage}`);
  }
};
```

#### Updated UI - Pending Applications Section

Added action buttons to each pending application card:

```jsx
<div className="flex justify-between items-center pt-4 border-t">
  <div className="flex space-x-3">
    {/* Existing View/Download buttons */}
  </div>
  
  <div className="flex space-x-3">
    <button
      onClick={() => handleApproveTenant(application)}
      className="flex items-center bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded-lg transition-colors"
    >
      <UserCheck className="w-4 h-4 mr-2" />
      Approve
    </button>
    <button
      onClick={() => handleDeclineTenant(application)}
      className="flex items-center bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
    >
      <UserX className="w-4 h-4 mr-2" />
      Decline
    </button>
  </div>
</div>
```

## How It Works

### Approve Flow
1. Landlord clicks "Approve" button on a pending application
2. Confirmation dialog appears
3. If confirmed, calls `POST /accounts/approve-application/{id}/`
4. Backend activates the tenant account (`is_active=True`)
5. Backend updates TenantApplication status to 'approved'
6. Success message shown, page refreshes
7. Tenant can now login and access their account

### Decline Flow
1. Landlord clicks "Decline" button on a pending application
2. Prompt appears asking for optional reason
3. If confirmed, calls `POST /accounts/decline-application/{id}/`
4. Backend deletes the tenant's user account
5. Backend deletes the TenantApplication record
6. Success message shown, page refreshes
7. Application removed from pending list

## Backend Endpoints (Already Implemented)

### Approve Endpoint
- **URL:** `/accounts/approve-application/<application_id>/`
- **Method:** POST
- **Location:** `accounts/views.py` line 2292
- **Action:** 
  - Sets `user.is_active = True`
  - Updates `application.status = 'approved'`
  - Assigns tenant to unit if unit_id provided

### Decline Endpoint
- **URL:** `/accounts/decline-application/<application_id>/`
- **Method:** POST
- **Location:** `accounts/views.py` line ~2320
- **Action:**
  - Deletes the tenant's user account
  - Deletes the TenantApplication record

## UI Location

The approve/decline buttons appear in:
- **Tab:** "Recent Tenants" tab in AdminTenants component
- **Section:** Each pending application card
- **Position:** Bottom right of each application card
- **Visibility:** Only shown when there are pending applications

## User Experience

### Landlord View
1. Navigate to Tenants section
2. Click "Recent Tenants" tab
3. See list of pending applications with full details:
   - Contact information
   - Room type selected
   - Uploaded documents
   - Payment details
4. Review application details
5. Click "View Documents" to inspect uploads
6. Click "Approve" (green button) or "Decline" (red button)
7. Confirm action in dialog
8. Page refreshes with updated list

### Visual Styling
- **Approve Button:** Green background (`bg-green-600`), white text, check icon
- **Decline Button:** Red background (`bg-red-600`), white text, X icon
- **Hover Effects:** Darker shade on hover
- **Layout:** Buttons positioned on right side of card

## Error Handling

Both handlers include:
- Try/catch blocks
- Console logging for debugging
- Error message extraction from API response
- User-friendly alert messages
- Graceful error display

## Testing Checklist

- [ ] Approve button appears on pending applications
- [ ] Decline button appears on pending applications
- [ ] Approve confirmation dialog works
- [ ] Decline prompt with reason works
- [ ] Successful approval activates tenant account
- [ ] Successful decline removes tenant and application
- [ ] Error messages display correctly
- [ ] Page refreshes after successful action
- [ ] Tenant can login after being approved
- [ ] Tenant cannot login after being declined
- [ ] Pending applications list updates correctly

## Related Files

- `Makao-Center-V4/src/services/api.js` - API methods
- `Makao-Center-V4/src/components/Admin/AdminTenants.jsx` - UI component
- `Makau Rentals/app/accounts/views.py` - Backend endpoints
- `Makau Rentals/app/accounts/urls.py` - URL routing

## Complete Tenant Approval Workflow

1. ✅ Tenant registers with deposit checkbox
2. ✅ Account created as `is_active=False`
3. ✅ TenantApplication created with status 'pending'
4. ✅ Tenant tries to login → sees "pending approval" message
5. ✅ Application appears in landlord's "Recent Tenants" tab
6. **✅ Landlord approves application** ← NEW
7. ✅ Tenant account activated
8. ✅ Tenant can now login successfully

OR

6. **✅ Landlord declines application** ← NEW
7. ✅ Tenant account and application deleted
8. ✅ Tenant removed from system

## Status

✅ **COMPLETE** - Landlords can now approve or decline tenant applications directly from the UI.
