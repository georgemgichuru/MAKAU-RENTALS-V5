# Tenant Application Approval System

## Overview
This implementation adds a feature for tenants to indicate whether they need to pay a deposit during registration. Tenants already living in the property can submit their application without paying a deposit, and the landlord can approve or decline them.

## Frontend Changes (LoginForm.jsx)

### 1. Added New State Fields
```javascript
const [tenantData, setTenantData] = useState({
  // ... existing fields
  alreadyLivingInProperty: false,
  requiresDeposit: true
});
```

### 2. Updated Step 3 - Property Selection
- Added checkbox: "I am already living in this property"
- When checked:
  - `alreadyLivingInProperty` = true
  - `requiresDeposit` = false
- Shows clear message about application being sent to landlord for approval

### 3. Updated Step Navigation Logic
- **Step 4 (Document Upload)**:
  - If `alreadyLivingInProperty` is true, skip directly to Step 6 (Password)
  - Bypass Step 5 (Deposit Payment) entirely
  
- **Step 6 (Password/Completion)**:
  - Sends `already_living_in_property` and `requires_deposit` flags to backend
  - Shows different success messages:
    - Already living: "Registration submitted! Your application has been sent to the landlord for approval."
    - New tenant: "Registration successful! You can now log in."

## Backend Changes

### 1. Updated Models (models.py)

#### TenantApplication Model (Already Exists)
```python
class TenantApplication(models.Model):
    tenant = ForeignKey to CustomUser
    landlord = ForeignKey to CustomUser
    unit = ForeignKey to Unit (nullable)
    
    status = 'pending' | 'approved' | 'declined'
    already_living_in_property = BooleanField
    deposit_required = BooleanField
    deposit_paid = BooleanField
    
    applied_at = DateTimeField
    reviewed_at = DateTimeField (nullable)
    reviewed_by = ForeignKey to CustomUser (nullable)
    
    notes = TextField (tenant notes)
    landlord_notes = TextField (landlord notes)
```

### 2. Updated CompleteTenantRegistrationView (views.py)

**Key Changes:**
- Creates tenant user as **INACTIVE** if `already_living_in_property` is true
- Creates TenantApplication record for all registrations
- Auto-approves if deposit is paid
- Returns different messages based on registration type

**Flow:**
```
New Tenant (Deposit Required):
1. Register → 2. Pay Deposit → 3. Auto-Approve → 4. Active Account

Existing Tenant (No Deposit):
1. Register → 2. Pending Application → 3. Landlord Approval → 4. Active Account
```

### 3. New API Endpoints

#### Get Pending Applications
```
GET /api/accounts/tenant-applications/pending/
Permission: IsAuthenticated, IsLandlord, HasActiveSubscription

Response:
{
  "status": "success",
  "count": 2,
  "applications": [
    {
      "id": 1,
      "tenant_id": 5,
      "tenant_name": "John Doe",
      "tenant_email": "john@example.com",
      "tenant_phone": "+254712345678",
      "tenant_national_id": "12345678",
      "unit_number": "A101",
      "unit_id": 10,
      "property_name": "Sunrise Apartments",
      "already_living_in_property": true,
      "deposit_required": false,
      "deposit_paid": false,
      "applied_at": "2025-10-28T10:30:00Z",
      "notes": "",
      "status": "pending"
    }
  ]
}
```

#### Approve Application
```
POST /api/accounts/tenant-applications/{application_id}/approve/
Permission: IsAuthenticated, IsLandlord, HasActiveSubscription

Response:
{
  "status": "success",
  "message": "Tenant John Doe has been approved and can now log in",
  "application_id": 1,
  "tenant_id": 5
}
```

**What Happens:**
1. Application status → 'approved'
2. Tenant account activated (is_active = True)
3. Tenant assigned to unit (if unit specified)
4. TenantProfile updated with current_unit
5. Unit marked as occupied (is_available = False)

#### Decline Application
```
POST /api/accounts/tenant-applications/{application_id}/decline/
Permission: IsAuthenticated, IsLandlord, HasActiveSubscription

Body:
{
  "reason": "Optional decline reason"
}

Response:
{
  "status": "success",
  "message": "Application for John Doe has been declined and account deleted",
  "application_id": 1,
  "deleted_tenant_id": 5
}
```

**What Happens:**
1. Application status → 'declined'
2. **Tenant account DELETED** (including all related data)
3. Email notification sent to tenant (optional)
4. All related records cascade deleted (TenantProfile, TenantApplication)

## Usage Flow

### For Tenants

#### Scenario 1: New Tenant (Requires Deposit)
1. Fill personal information
2. Select property and room
3. Uncheck "I am already living in this property"
4. Upload ID document
5. Pay deposit via PesaPal
6. Set password
7. Account auto-approved → Can login immediately

#### Scenario 2: Existing Tenant (No Deposit)
1. Fill personal information
2. Select property and room
3. **Check "I am already living in this property"**
4. Upload ID document
5. ~~Deposit payment step skipped~~
6. Set password
7. Application sent to landlord → Wait for approval
8. Cannot login until approved

### For Landlords

#### View Pending Applications
```javascript
// Frontend API call
const response = await api.get('/api/accounts/tenant-applications/pending/');
const applications = response.data.applications;

// Display in UI with:
// - Tenant details
// - Unit requested
// - Application date
// - Approve/Decline buttons
```

#### Approve Application
```javascript
const approveApplication = async (applicationId) => {
  await api.post(`/api/accounts/tenant-applications/${applicationId}/approve/`);
  // Refresh applications list
  // Tenant can now login
};
```

#### Decline Application
```javascript
const declineApplication = async (applicationId, reason) => {
  await api.post(`/api/accounts/tenant-applications/${applicationId}/decline/`, {
    reason: reason
  });
  // Application deleted
  // Tenant account deleted
  // Tenant receives notification email
};
```

## Database Schema

### TenantApplication Table
```sql
CREATE TABLE tenant_application (
    id SERIAL PRIMARY KEY,
    tenant_id INT REFERENCES custom_user(id) ON DELETE CASCADE,
    landlord_id INT REFERENCES custom_user(id) ON DELETE CASCADE,
    unit_id INT REFERENCES unit(id) ON DELETE CASCADE NULL,
    
    status VARCHAR(20) DEFAULT 'pending',
    already_living_in_property BOOLEAN DEFAULT FALSE,
    deposit_required BOOLEAN DEFAULT TRUE,
    deposit_paid BOOLEAN DEFAULT FALSE,
    
    applied_at TIMESTAMP DEFAULT NOW(),
    reviewed_at TIMESTAMP NULL,
    reviewed_by_id INT REFERENCES custom_user(id) NULL,
    
    notes TEXT NULL,
    landlord_notes TEXT NULL,
    
    INDEX idx_landlord_status (landlord_id, status),
    INDEX idx_tenant_status (tenant_id, status)
);
```

## Security Considerations

1. **Inactive Accounts**: Tenants requiring approval cannot login until approved
2. **Cascade Delete**: Declining deletes all tenant data (clean removal)
3. **Permission Checks**: Only landlord who owns the application can approve/decline
4. **Audit Trail**: Tracks who reviewed and when
5. **Email Notifications**: Tenants notified of decline

## Frontend UI Components Needed

### 1. Landlord Dashboard - Pending Applications Tab
```jsx
<PendingApplicationsTable>
  - Tenant Name
  - Email/Phone
  - Unit Requested
  - Property
  - Applied Date
  - Already Living? Badge
  - Actions (Approve/Decline buttons)
</PendingApplicationsTable>
```

### 2. Approve Confirmation Modal
```jsx
<Modal>
  <h3>Approve Tenant Application?</h3>
  <p>Tenant: {tenantName}</p>
  <p>Unit: {unitNumber}</p>
  <Button onClick={handleApprove}>Approve</Button>
  <Button onClick={handleCancel}>Cancel</Button>
</Modal>
```

### 3. Decline Confirmation Modal
```jsx
<Modal>
  <h3>Decline Tenant Application?</h3>
  <p>This will permanently delete the tenant account.</p>
  <textarea placeholder="Reason for decline (optional)..." />
  <Button onClick={handleDecline}>Decline & Delete</Button>
  <Button onClick={handleCancel}>Cancel</Button>
</Modal>
```

## Testing Checklist

- [ ] Tenant can check "already living in property" checkbox
- [ ] Deposit payment step is skipped when checkbox is checked
- [ ] Tenant account created as inactive
- [ ] TenantApplication record created with correct flags
- [ ] Landlord can see pending applications
- [ ] Landlord can approve application
- [ ] Tenant account becomes active after approval
- [ ] Tenant can login after approval
- [ ] Landlord can decline application
- [ ] Tenant account is deleted after decline
- [ ] Email sent to tenant on decline
- [ ] New tenants with deposit payment auto-approved

## Migration Notes

If the TenantApplication model doesn't exist yet:

```bash
cd "Makau Rentals/app"
python manage.py makemigrations accounts
python manage.py migrate accounts
```

## Next Steps

1. Create frontend components for landlord to view/manage applications
2. Add email notifications for approval/decline
3. Add SMS notifications (optional)
4. Add application history/audit log
5. Add bulk approve/decline functionality
6. Add filters for applications (by property, date, etc.)
