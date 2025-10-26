# Tenant Report Issue - User Guide

## For Tenants

### How to Report an Issue

1. **Login** to your tenant account
2. **Navigate** to "Report Issue" from the sidebar menu
3. **Read** the Terms & Conditions disclaimer (appears after 2 seconds)
4. **Scroll** to the bottom of the disclaimer
5. **Click** "I Accept and Proceed to Report"
6. **Fill in** the report form:
   - **Issue Category**: Select the type of issue (electrical, plumbing, security, etc.)
   - **Priority Level**: 
     - `Urgent`: Life-threatening/Emergency
     - `High`: Significant damage/Major inconvenience
     - `Medium`: Important but not immediate
     - `Low`: Minor issues
   - **Issue Title**: Brief summary (e.g., "Broken water pipe in bathroom")
   - **Detailed Description**: Full details including:
     - When the issue started
     - What happened
     - What you've tried
     - How it affects you
7. **Click** "Submit Report"
8. **Wait** for confirmation message
9. **Redirected** to dashboard after 2 seconds

### Important Notes

✅ **You CAN report:**
- Electrical issues (power failures, exposed wires)
- Plumbing issues (water supply, sewage, burst pipes)
- Security issues (broken locks, gates)
- Structural issues (roof leaks, wall damage)
- Safety concerns (fire hazards, gas leaks)
- Building-wide pest infestations
- Common area issues

❌ **You CANNOT report (handle yourself):**
- Tenant-caused damage
- Minor repairs (light bulbs, toilet seats)
- Personal appliances
- KPLC power outages (contact Kenya Power)
- Water company issues (contact Nairobi Water)
- Internet/WiFi issues (contact your ISP)
- Neighbor disputes

### Requirements

- You must have a **unit assigned** by your landlord
- You must **accept the Terms & Conditions**
- You must be **logged in** as a tenant

### What Happens After Submission?

1. Your landlord receives an **email notification**
2. The report appears in your landlord's dashboard
3. Your landlord will review and respond
4. You can check the status in your dashboard

### Response Time Expectations

- **Urgent**: Within 24 hours
- **High**: Within 3-5 business days
- **Medium**: Within 1-2 weeks
- **Low**: Within 3-4 weeks

---

## For Landlords

### How to View Reports

1. **Login** to your landlord account
2. **Navigate** to "Reports" or "Maintenance" section
3. **View** all reports from your tenants
4. **Filter** by:
   - Status (Open, In Progress, Resolved)
   - Priority (Urgent, High, Medium, Low)
   - Property
   - Date

### How to Respond to Reports

1. **Open** the report details
2. **Update** the status:
   - `Open`: Not yet addressed
   - `In Progress`: Currently being worked on
   - `Resolved`: Issue fixed
   - `Closed`: Completed/No action needed
3. **Add** estimated cost (optional)
4. **Add** actual cost after resolution (optional)
5. **Save** changes

### Email Notifications

You receive email notifications when:
- A new report is submitted
- A report is marked as urgent
- Follow-up is needed

---

## For Developers

### API Endpoint

**POST** `/api/communication/reports/create/`

### Request Format

```json
{
  "issue_category": "electrical",
  "priority_level": "urgent",
  "issue_title": "Power outage in unit",
  "description": "Complete power failure since morning...",
  "unit": 123
}
```

### Response Format (Success)

```json
{
  "id": 45,
  "tenant": 12,
  "tenant_name": "John Doe",
  "unit": 123,
  "unit_number": "A101",
  "property_name": "Sunset Apartments",
  "property_id": 5,
  "issue_category": "electrical",
  "priority_level": "urgent",
  "issue_title": "Power outage in unit",
  "description": "Complete power failure since morning...",
  "status": "open",
  "reported_date": "2025-01-15T10:30:00Z",
  "resolved_date": null,
  "assigned_to": null,
  "estimated_cost": null,
  "actual_cost": null,
  "attachment": null,
  "days_open": 0
}
```

### Response Format (Error)

```json
{
  "unit": ["No unit assigned to your account. Please contact your landlord."]
}
```

### Authentication

- Requires valid JWT Bearer token
- Must be authenticated as tenant
- Must have unit assigned

### Permissions

- `IsAuthenticated`: User must be logged in
- `IsTenantWithUnit`: User must be a tenant with assigned unit

---

## Troubleshooting

### "No unit assigned" error

**Problem:** Tenant account doesn't have a unit assigned.

**Solution:** 
1. Landlord must assign a unit to the tenant
2. Check `TenantProfile` model has `current_unit` set
3. Verify unit exists and is linked to the property

### "Error submitting report"

**Problem:** Generic submission error.

**Solution:**
1. Check browser console for detailed error
2. Verify all required fields are filled
3. Ensure authentication token is valid
4. Check backend logs for server errors

### Form is disabled

**Problem:** Cannot interact with form fields.

**Solution:**
1. Accept the Terms & Conditions disclaimer
2. Wait for tenant information to load
3. Ensure you have a unit assigned
4. Check you're logged in as a tenant

### Toast notifications not showing

**Problem:** No feedback after submission.

**Solution:**
1. Check browser console for errors
2. Ensure JavaScript is enabled
3. Try refreshing the page
4. Clear browser cache

---

## Support Contacts

For technical issues:
- Email: support@makaocenter.com
- Phone: +254 XXX XXX XXX

For landlord/tenant disputes:
- Contact your property manager
- Refer to your tenancy agreement

---

**Last Updated:** January 2025
