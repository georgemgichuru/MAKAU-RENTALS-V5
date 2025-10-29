# Deposit Management and Tenant Application System - Implementation Guide

## Overview
This document outlines the implementation of a comprehensive deposit management system and tenant application workflow.

## Features Implemented

### 1. ✅ TenantApplication Model (COMPLETED)
**Location:** `Makau Rentals/app/accounts/models.py`

Created a new model to track tenant applications with:
- Status tracking (pending/approved/declined)
- Deposit requirement flag (`already_living_in_property`, `deposit_required`, `deposit_paid`)
- Landlord and tenant relationship
- Unit assignment
- Application notes
- Approval/decline methods

**Migration Created:** `0006_add_tenant_application_model.py`

### 2. ✅ Unit Type Deposit Editing (COMPLETED)
**Frontend:** `Makao-Center-V4/src/components/Admin/AdminOrganisation.jsx`
**Backend:** Already supported via `UnitTypeDetailView.put()` endpoint

Added:
- Deposit field in AddRoomTypeDialog
- New EditRoomTypeDialog component with deposit editing
- Display of deposit amounts in room type cards
- Edit button (DollarSign icon) for each room type

### 3. ⏳ Individual Unit Deposit Editing (NEEDS COMPLETION)
**Backend:** Already supported via `UpdateUnitView.put()` - serializer includes deposit field
**Frontend:** Needs UI component

#### TO DO:
Create `EditUnitDialog` component in `AdminOrganisation.jsx`:

```jsx
// Add this component after EditRoomTypeDialog
const EditUnitDialog = ({ isOpen, onClose, onUpdate, unit }) => {
  const [editData, setEditData] = useState({
    unitNumber: '',
    rent: '',
    deposit: ''
  });

  useEffect(() => {
    if (isOpen && unit) {
      setEditData({
        unitNumber: unit.unitNumber || unit.unit_number || '',
        rent: String(unit.rent || ''),
        deposit: String(unit.deposit || '0')
      });
    }
  }, [isOpen, unit]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!editData.unitNumber || !editData.rent) {
      alert('Please provide unit number and rent.');
      return;
    }
    const payload = {
      unit_number: editData.unitNumber,
      rent: Number(editData.rent),
      deposit: Number(editData.deposit) || 0
    };
    
    if (onUpdate) onUpdate(unit.id, payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold">Edit Unit</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unit Number
            </label>
            <input
              type="text"
              value={editData.unitNumber}
              onChange={(e) => setEditData({ ...editData, unitNumber: e.target.value })}
              placeholder="e.g., 101, A1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monthly Rent (KSh)
            </label>
            <input
              type="number"
              value={editData.rent}
              onChange={(e) => setEditData({ ...editData, rent: e.target.value })}
              placeholder="25000"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deposit Amount (KSh)
            </label>
            <input
              type="number"
              value={editData.deposit}
              onChange={(e) => setEditData({ ...editData, deposit: e.target.value })}
              placeholder="25000"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Update Unit
          </button>
        </div>
      </div>
    </div>
  );
};
```

Add state in AdminOrganisation:
```jsx
const [editUnitDialog, setEditUnitDialog] = useState({ isOpen: false, unit: null });
```

Add handler:
```jsx
const handleUpdateUnit = async (unitId, updatedData) => {
  try {
    await propertiesAPI.updateUnit(unitId, updatedData);
    showToast('Unit updated successfully', 'success', 3000);
    setEditUnitDialog({ isOpen: false, unit: null });
    await fetchPropertyData();
  } catch (error) {
    console.error('Error updating unit:', error);
    const errorMessage = error.response?.data?.error || 
                        error.response?.data?.message || 
                        'Failed to update unit.';
    showToast(errorMessage, 'error', 3000);
  }
};
```

Add to JSX (after AddRentalUnitDialog):
```jsx
<EditUnitDialog
  isOpen={editUnitDialog.isOpen}
  onClose={() => setEditUnitDialog({ isOpen: false, unit: null })}
  onUpdate={handleUpdateUnit}
  unit={editUnitDialog.unit}
/>
```

Update table to add Deposit column and Edit action:
```jsx
<thead>
  <tr className="border-b">
    <th className="text-left py-3 px-4">Room</th>
    <th className="text-left py-3 px-4">Type</th>
    <th className="text-left py-3 px-4">Rent (KSh)</th>
    <th className="text-left py-3 px-4">Deposit (KSh)</th> {/* NEW */}
    <th className="text-left py-3 px-4">Tenant</th>
    <th className="text-left py-3 px-4">Status</th>
    <th className="text-left py-3 px-4">Availability</th>
    <th className="text-left py-3 px-4">Actions</th> {/* NEW */}
  </tr>
</thead>
<tbody>
  {displayUnits.map(room => {
    // ... existing code ...
    return (
      <tr key={room.id} className="border-b hover:bg-gray-50">
        <td className="py-3 px-4 font-medium">{room.unitNumber}</td>
        <td className="py-3 px-4">{room.type}</td>
        <td className="py-3 px-4">{room.rent?.toLocaleString()}</td>
        <td className="py-3 px-4">{room.deposit?.toLocaleString() || '0'}</td> {/* NEW */}
        <td className="py-3 px-4 text-sm text-gray-600">{room.tenant || '-'}</td>
        <td className="py-3 px-4">
          {/* ... existing status badge ... */}
        </td>
        <td className="py-3 px-4">
          {/* ... existing availability toggle ... */}
        </td>
        <td className="py-3 px-4"> {/* NEW */}
          <button
            onClick={() => setEditUnitDialog({ isOpen: true, unit: room })}
            className="text-blue-600 hover:text-blue-800"
            title="Edit unit"
          >
            <DollarSign className="w-4 h-4" />
          </button>
        </td>
      </tr>
    );
  })}
</tbody>
```

### 4. ⏳ Tenant Signup Flow with Deposit Logic (NEEDS IMPLEMENTATION)

#### Backend API Endpoints Needed:

**File:** `Makau Rentals/app/accounts/views.py`

```python
from accounts.models import TenantApplication
from accounts.serializers import TenantApplicationSerializer

class TenantApplicationCreateView(APIView):
    """
    Create a tenant application
    """
    permission_classes = []  # Allow unauthenticated (during signup)
    
    def post(self, request):
        serializer = TenantApplicationSerializer(data=request.data)
        if serializer.is_valid():
            application = serializer.save()
            
            # If deposit not required, auto-approve OR keep pending for landlord review
            # You can choose the logic based on your requirements
            
            return Response({
                'status': 'success',
                'message': 'Application submitted successfully',
                'application_id': application.id,
                'deposit_required': application.deposit_required
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LandlordApplicationsView(APIView):
    """
    List all applications for a landlord
    """
    permission_classes = [IsAuthenticated, IsLandlord, HasActiveSubscription]
    
    def get(self, request):
        # Get all applications for this landlord
        applications = TenantApplication.objects.filter(
            landlord=request.user
        ).select_related('tenant', 'unit', 'reviewed_by')
        
        # Filter by status if provided
        status_filter = request.query_params.get('status', None)
        if status_filter:
            applications = applications.filter(status=status_filter)
        
        serializer = TenantApplicationSerializer(applications, many=True)
        return Response(serializer.data)


class ApplicationActionView(APIView):
    """
    Approve or decline a tenant application
    """
    permission_classes = [IsAuthenticated, IsLandlord, HasActiveSubscription]
    
    def post(self, request, application_id):
        try:
            application = TenantApplication.objects.get(
                id=application_id,
                landlord=request.user
            )
            
            action = request.data.get('action')  # 'approve' or 'decline'
            
            if action == 'approve':
                application.approve(reviewed_by_user=request.user)
                return Response({
                    'status': 'success',
                    'message': 'Application approved and tenant assigned to unit'
                })
            elif action == 'decline':
                reason = request.data.get('reason', '')
                application.decline(reviewed_by_user=request.user, reason=reason)
                return Response({
                    'status': 'success',
                    'message': 'Application declined'
                })
            else:
                return Response({
                    'error': 'Invalid action. Use "approve" or "decline"'
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except TenantApplication.DoesNotExist:
            return Response({
                'error': 'Application not found'
            }, status=status.HTTP_404_NOT_FOUND)
```

**Add to URLs:** `Makau Rentals/app/accounts/urls.py`

```python
urlpatterns = [
    # ... existing paths ...
    
    # Tenant Applications
    path('applications/create/', TenantApplicationCreateView.as_view(), name='application-create'),
    path('applications/', LandlordApplicationsView.as_view(), name='landlord-applications'),
    path('applications/<int:application_id>/action/', ApplicationActionView.as_view(), name='application-action'),
]
```

#### Frontend Tenant Signup Changes:

**File:** `Makao-Center-V4/src/components/Login and Sign Up/LoginForm.jsx`

In the tenant signup flow (Step 3 - Property Selection), add a checkbox:

```jsx
// In renderTenantStep3()
<div className="mb-4">
  <label className="flex items-center space-x-3 cursor-pointer">
    <input
      type="checkbox"
      checked={tenantData.alreadyLivingInProperty || false}
      onChange={(e) => setTenantData({ ...tenantData, alreadyLivingInProperty: e.target.checked })}
      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
    />
    <span className="text-sm text-gray-700">
      I already live in this landlord's property
    </span>
  </label>
  {tenantData.alreadyLivingInProperty && (
    <p className="text-sm text-green-600 mt-2">
      ✓ Deposit payment will be waived. Your application will be sent to the landlord for approval.
    </p>
  )}
</div>
```

Modify Step 5 (Deposit Payment) logic:

```jsx
// Skip Step 5 if already living in property
const handleTenantNext = async () => {
  // ... existing validation ...
  
  if (currentStep === 4) {
    // After document upload
    if (tenantData.alreadyLivingInProperty) {
      // Skip deposit payment, go directly to password step
      setCurrentStep(6);
      return;
    } else {
      // Proceed to deposit payment
      setCurrentStep(5);
      return;
    }
  }
  
  // ... rest of the code ...
};
```

In the final submission (Step 6), create application instead of direct assignment:

```jsx
// In handleTenantNext when currentStep === 6
const registrationData = {
  session_id: currentSessionId,
  full_name: tenantData.name,
  email: tenantData.email,
  password: tenantData.password,
  phone_number: tenantData.phone,
  national_id: tenantData.governmentId,
  emergency_contact: tenantData.emergencyContact,
  landlord_code: tenantData.landlordId,
  unit_code: tenantData.selectedRoom,
  id_document: tenantData.idDocument?.base64,
  already_living_in_property: tenantData.alreadyLivingInProperty || false
};

// Complete registration
await authAPI.registerTenant(registrationData);

// Create application
const applicationData = {
  landlord: landlordInfo.id,  // Get from landlord validation
  tenant: tenantResponse.id,  // Get from registration response
  unit: unitInfo.id,  // Get from selected unit
  already_living_in_property: tenantData.alreadyLivingInProperty || false,
  deposit_required: !tenantData.alreadyLivingInProperty,
  deposit_paid: paymentStatus === 'completed',
  notes: `Application from ${tenantData.name}`
};

await api.post('/api/accounts/applications/create/', applicationData);

if (tenantData.alreadyLivingInProperty) {
  alert('Registration successful! Your application has been sent to the landlord for approval.');
} else {
  alert('Registration and deposit payment successful! Your application has been submitted.');
}
```

### 5. ⏳ AdminTenants Component Updates (NEEDS IMPLEMENTATION)

**File:** `Makao-Center-V4/src/components/Admin/AdminTenants.jsx`

Replace mock pending applications with actual API data:

```jsx
// Add to imports
import { applicationsAPI } from '../../services/api';

// In the component
const [pendingApplications, setPendingApplications] = useState([]);
const [applicationsLoading, setApplicationsLoading] = useState(false);

useEffect(() => {
  fetchPendingApplications();
}, []);

const fetchPendingApplications = async () => {
  setApplicationsLoading(true);
  try {
    const response = await api.get('/api/accounts/applications/?status=pending');
    setPendingApplications(response.data);
  } catch (error) {
    console.error('Error fetching applications:', error);
  } finally {
    setApplicationsLoading(false);
  }
};

const handleApproveApplication = async (applicationId) => {
  try {
    await api.post(`/api/accounts/applications/${applicationId}/action/`, {
      action: 'approve'
    });
    alert('Application approved! Tenant has been assigned to the unit.');
    fetchPendingApplications();  // Refresh list
  } catch (error) {
    console.error('Error approving application:', error);
    alert('Failed to approve application. Please try again.');
  }
};

const handleDeclineApplication = async (applicationId) => {
  const reason = prompt('Please provide a reason for declining (optional):');
  try {
    await api.post(`/api/accounts/applications/${applicationId}/action/`, {
      action: 'decline',
      reason: reason || ''
    });
    alert('Application declined.');
    fetchPendingApplications();  // Refresh list
  } catch (error) {
    console.error('Error declining application:', error);
    alert('Failed to decline application. Please try again.');
  }
};
```

Update the Recent Tenants tab to show real applications:

```jsx
{activeTab === 'recent' && (
  <div className="bg-white rounded-lg shadow">
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <Clock className="mr-2 text-yellow-600" />
        Pending Applications
        {pendingApplications.length > 0 && (
          <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
            {pendingApplications.length} new
          </span>
        )}
      </h3>
      
      {applicationsLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading applications...</p>
        </div>
      ) : pendingApplications.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Applications</h3>
          <p className="text-gray-500 mb-4">New tenant applications will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingApplications.map(application => (
            <div key={application.id} className="border rounded-lg p-6 hover:bg-gray-50">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900">{application.tenant_name}</h4>
                  <p className="text-sm text-gray-600">Email: {application.tenant_email}</p>
                  <p className="text-sm text-gray-600">Phone: {application.tenant_phone}</p>
                  <p className="text-sm text-gray-500">Applied: {new Date(application.applied_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {application.deposit_paid ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Deposit Paid
                    </span>
                  ) : application.already_living_in_property ? (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      Existing Tenant
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                      Deposit Pending
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Property</p>
                  <p className="font-medium">{application.property_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Unit</p>
                  <p className="font-medium">{application.unit_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <p className="font-medium capitalize">{application.already_living_in_property ? 'Existing Resident' : 'New Applicant'}</p>
                </div>
              </div>

              {application.notes && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500">Notes</p>
                  <p className="text-sm text-gray-700">{application.notes}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => handleApproveApplication(application.id)}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Application
                </button>
                <button
                  onClick={() => handleDeclineApplication(application.id)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center"
                >
                  <X className="w-4 h-4 mr-2" />
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
)}
```

## Migration and Database

Run the migration:
```powershell
cd "c:\Users\George Mwangi\Desktop\MAKAU-RENTALS-V5\Makau Rentals\app"
python manage.py migrate accounts
```

## Testing Checklist

1. **Unit Type Deposit Management**
   - ✅ Create new unit type with deposit
   - ✅ Edit existing unit type deposit amount
   - ✅ Verify deposit displays correctly

2. **Individual Unit Deposit Management**
   - ⏳ Edit individual unit deposit
   - ⏳ Verify deposit updates correctly

3. **Tenant Signup - New Applicant (Requires Deposit)**
   - ⏳ Tenant signs up
   - ⏳ Does NOT check "already living" box
   - ⏳ Goes through deposit payment step
   - ⏳ Application created with `deposit_required=True` and `deposit_paid=True`
   - ⏳ Application appears in landlord's pending list

4. **Tenant Signup - Existing Resident (No Deposit)**
   - ⏳ Tenant signs up
   - ⏳ CHECKS "already living" box
   - ⏳ Skips deposit payment step
   - ⏳ Application created with `deposit_required=False` and `already_living_in_property=True`
   - ⏳ Application appears in landlord's pending list

5. **Landlord Application Management**
   - ⏳ View pending applications
   - ⏳ Approve application (tenant assigned to unit)
   - ⏳ Decline application with reason
   - ⏳ Verify application status updates

## Next Steps

1. Complete Individual Unit Deposit Editing UI
2. Implement TenantApplication API endpoints
3. Update Tenant Signup flow with deposit logic
4. Update AdminTenants component for application management
5. Test complete workflow
6. Add email notifications for application status changes (optional enhancement)

## Notes

- Deposit amounts can be edited at both unit type and individual unit levels
- Individual unit deposits override unit type defaults
- Existing tenants (already living in property) can sign up without deposit
- New tenants must pay deposit before application submission
- Landlords can approve/decline all applications regardless of deposit status
- Application history is maintained for audit purposes
