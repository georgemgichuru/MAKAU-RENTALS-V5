# Test Data Reference Guide# Test Data Reference



## Overview## 🎉 Database Successfully Populated!

This document provides a comprehensive reference for all test data created in the system.

Your database now contains comprehensive test data for testing the Makau Rentals application.

**Created:** October 29, 2025  

**Script:** `Makau Rentals/app/reset_and_populate_db.py`---



---## 👤 Landlord Accounts



## Quick Reset Instructions### Landlord 1 - John Kamau (Professional Plan)

- **Email:** `landlord1@test.com`

To reset the database and recreate test data:- **Password:** `Test123!`

- **Landlord Code:** Check terminal output or database

```bash- **Phone:** +254712345678

cd "c:\Users\George Mwangi\Desktop\MAKAU-RENTALS-V5\Makau Rentals\app"- **Till Number:** 123456

python reset_and_populate_db.py- **Subscription:** Professional (50-100 units)

```- **Properties:** ~2-3 properties with multiple units



**⚠️ WARNING:** This deletes ALL data except superuser accounts!### Landlord 2 - Mary Wanjiku (Basic Plan)

- **Email:** `landlord2@test.com`

---- **Password:** `Test123!`

- **Landlord Code:** Check terminal output or database

## Test Accounts- **Phone:** +254723456789

- **Till Number:** 234567

### Superuser (Preserved)- **Subscription:** Basic (10-50 units)

- **Email:** georgem.gichuru@gmail.com- **Properties:** ~2-3 properties with multiple units

- **Status:** Admin/Superuser

### Landlord 3 - Peter Omondi (Starter Plan)

### Landlord Accounts- **Email:** `landlord3@test.com`

- **Password:** `Test123!`

#### Landlord 1 - John Smith- **Landlord Code:** Check terminal output or database

- **Email:** landlord1@test.com- **Phone:** +254734567890

- **Password:** testpass123- **Till Number:** None

- **Landlord Code:** L-7E7A73509E- **Subscription:** Starter (up to 10 units)

- **Phone:** +254712345678- **Properties:** ~2-3 properties with multiple units

- **M-Pesa Till:** 5678901

- **Address:** 123 Business Street, Nairobi---

- **Website:** https://johnsmith-properties.com

- **Subscription:** Basic (90 days)## 🏠 Tenant Accounts

- **Reminder Mode:** Days before (5 days)

All tenants have the password: **`Test123!`**

#### Landlord 2 - Sarah Johnson

- **Email:** landlord2@test.com| Email | Full Name | Property Assignment |

- **Password:** testpass123|-------|-----------|---------------------|

- **Landlord Code:** L-F5D337A13B| tenant1@test.com | Various Names | Assigned to different units |

- **Phone:** +254723456789| tenant2@test.com | Various Names | Assigned to different units |

- **M-Pesa Till:** 6789012| tenant3@test.com | Various Names | Assigned to different units |

- **Address:** 456 Property Avenue, Mombasa| ... | ... | ... |

- **Website:** https://sarahjohnson-realty.com| tenant29@test.com | Various Names | Assigned to different units |

- **Subscription:** Free (60 days trial)

- **Reminder Mode:** Fixed day (28th)**Note:** 29 tenants have been created and assigned to units. Each has a unique profile with:

- National ID

### Tenant Accounts- Phone number

- Emergency contact

#### Tenant 1 - Michael Brown (ASSIGNED)- Move-in date

- **Email:** tenant1@test.com- Lease end date

- **Password:** testpass123- Current unit assignment

- **Phone:** +254734567890

- **National ID:** 12345678---

- **Unit:** A1 (Studio)

- **Rent Status:** PAID IN FULL (KES 15,000)## 📊 Generated Data Summary

- **Deposit:** Paid (KES 15,000)

- **Move-in Date:** 30 days ago### Properties

- **Total:** 7 properties across 3 landlords

#### Tenant 2 - Emma Wilson (ASSIGNED)- **Locations:** Nairobi, Mombasa, Kisumu

- **Email:** tenant2@test.com- **Types:** Apartments, Residences, Estates, Towers

- **Password:** testpass123

- **Phone:** +254745678901### Units

- **National ID:** 23456789- **Total:** 122 units

- **Unit:** B1 (1 Bedroom)- **Available:** 93 units (ready for new tenants)

- **Rent Status:** PARTIAL - KES 15,000 paid, KES 10,000 remaining- **Occupied:** 29 units (with tenants)

- **Deposit:** Paid (KES 25,000)- **Unit Types:**

- **Move-in Date:** 20 days ago  - Studio apartments

  - Bedsitters

#### Tenant 3 - David Miller (ASSIGNED)  - 1-Bedroom

- **Email:** tenant3@test.com  - 2-Bedroom

- **Password:** testpass123  - 3-Bedroom

- **Phone:** +254756789012

- **National ID:** 34567890### Payments

- **Unit:** C1 (2 Bedroom)- **Total:** 99 payment records

- **Rent Status:** PENDING (KES 35,000 due)- **Types:**

- **Deposit:** Paid (KES 35,000)  - Rent payments (most common)

- **Move-in Date:** 10 days ago  - Deposit payments

  - Maintenance fees

#### Tenant 4 - Lisa Anderson (ASSIGNED)- **Status:** Mix of completed, pending, and failed

- **Email:** tenant4@test.com- **Methods:** M-Pesa, Cash, Bank Transfer

- **Password:** testpass123- **Date Range:** Last 6 months

- **Phone:** +254767890123

- **National ID:** 45678901### Maintenance Reports

- **Unit:** B2 (1 Bedroom)- **Total:** 44 reports

- **Rent Status:** Not yet paid- **Categories:**

- **Deposit:** Paid (KES 25,000)  - Electrical issues

- **Move-in Date:** 5 days ago  - Plumbing problems

  - Noise complaints

#### Tenant 5 - James Taylor (PENDING APPLICATION)  - WiFi issues

- **Email:** tenant5@test.com  - General maintenance

- **Password:** testpass123  - Pest control

- **Phone:** +254778901234  - Security concerns

- **National ID:** 56789012  - Cleanliness

- **Unit:** Applied for A2 (Studio) - PENDING- **Status:** Mix of open, in_progress, resolved, and closed

- **Deposit Required:** Yes- **Priority Levels:** Low, Medium, High, Urgent

- **Deposit Paid:** No

---

#### Tenant 6 - Maria Garcia (APPROVED APPLICATION)

- **Email:** tenant6@test.com## 🧪 Testing Scenarios

- **Password:** testpass123

- **Phone:** +254789012345### 1. Landlord Login & Dashboard

- **National ID:** 67890123- Log in as any landlord account

- **Unit:** Applied for A3 (Studio) - APPROVED- View all properties, units, and tenants

- **Deposit Required:** Yes- Check subscription status and limits

- **Deposit Paid:** Yes- Review payment history

- Manage maintenance reports

---

### 2. Tenant Login & Portal

## Properties & Units- Log in as any tenant account (tenant1 - tenant29)

- View current unit and lease details

### Property 1: Sunset Apartments- Check payment history and outstanding balance

- **Owner:** John Smith (landlord1@test.com)- Submit maintenance reports

- **Location:** Nairobi, Nairobi County- Make rent payments

- **Total Units:** 20 (max capacity)

- **Units Created:** 18### 3. Payment Testing

- **Occupied Units:** 4- View payment history for tenants

- **Available Units:** 14- Check different payment statuses

- Test M-Pesa integration with test data

#### Unit Types- Review payment reports for landlords



1. **Studio**### 4. Maintenance Workflow

   - Rent: KES 15,000/month- View open maintenance reports

   - Deposit: KES 15,000- Test report assignment to landlords

   - Units: A1-A5 (5 units)- Update report status (open → in_progress → resolved)

   - Floor: 1- Add cost estimates and actual costs

   - Description: Compact studio apartment with kitchenette- View report history and analytics



2. **1 Bedroom**### 5. Subscription Management

   - Rent: KES 25,000/month- Test different subscription tiers

   - Deposit: KES 25,000- View unit limits per subscription

   - Units: B1-B8 (8 units)- Test subscription expiry scenarios

   - Floors: 2-3- Upgrade/downgrade subscription plans

   - Description: One bedroom apartment with living area

---

3. **2 Bedroom**

   - Rent: KES 35,000/month## 🔧 Useful Management Commands

   - Deposit: KES 35,000

   - Units: C1-C5 (5 units)### Re-populate Database

   - Floor: 4```bash

   - Description: Spacious two bedroom apartmentcd "Makau Rentals\app"

python manage.py populate_test_data

#### Occupied Units```

When prompted, type `yes` to clear existing test data first.

| Unit | Type | Tenant | Rent Status | Deposit |

|------|------|--------|-------------|---------|### Create Additional Test Data

| A1 | Studio | Michael Brown | PAID FULL | Paid |Run the command again without clearing to add more data.

| B1 | 1 Bedroom | Emma Wilson | PARTIAL | Paid |

| C1 | 2 Bedroom | David Miller | PENDING | Paid |### View All Landlord Codes

| B2 | 1 Bedroom | Lisa Anderson | None | Paid |```bash

python manage.py shell

#### Available Units```

Then run:

Studios: A2, A3, A4, A5 (4 units)  ```python

1 Bedrooms: B3, B4, B5, B6, B7, B8 (6 units)  from accounts.models import CustomUser

2 Bedrooms: C2, C3, C4, C5 (4 units)landlords = CustomUser.objects.filter(user_type='landlord', email__contains='test')

for l in landlords:

### Property 2: Green Valley Residences    print(f"{l.full_name}: {l.landlord_code}")

- **Owner:** John Smith (landlord1@test.com)```

- **Location:** Nairobi, Nairobi County

- **Total Units:** 15 (max capacity)---

- **Units Created:** 0

- **Status:** Empty property (for testing property creation)## 📝 Notes



---1. **All passwords are:** `Test123!`

2. **Landlord codes** are auto-generated and shown in terminal output

## Tenant Applications3. **Data is randomized** - each time you run the script, you get different variations

4. **Payment amounts** are based on actual unit rent prices

### Application 1 - PENDING5. **Reports** have realistic dates and status progressions

- **Applicant:** James Taylor (tenant5@test.com)6. **Tenants** are automatically linked to their landlords via TenantProfile

- **Unit:** A2 (Studio)

- **Landlord:** John Smith---

- **Status:** Pending

- **Deposit Required:** Yes## 🚀 Next Steps

- **Deposit Paid:** No

- **Notes:** Interested in moving in next month1. **Start the development server:**

   ```bash

### Application 2 - APPROVED   cd "Makau Rentals\app"

- **Applicant:** Maria Garcia (tenant6@test.com)   python manage.py runserver

- **Unit:** A3 (Studio)   ```

- **Landlord:** John Smith

- **Status:** Approved (2 days ago)2. **Start the React frontend:**

- **Deposit Required:** Yes   ```bash

- **Deposit Paid:** Yes   cd "Makao-Center-V4"

- **Notes:** Ready to move in   npm run dev

   ```

---

3. **Log in and explore** the application with test data!

## Payments

---

### Deposit Payments (4 total - All Completed)

## ⚠️ Important

| Tenant | Unit | Amount | Receipt | Date |

|--------|------|--------|---------|------|This is **TEST DATA ONLY**. Do not use these accounts in production. Before deploying:

| Michael Brown | A1 | KES 15,000 | QFR1000000XYZ | 30 days ago |- Delete all test accounts

| Emma Wilson | B1 | KES 25,000 | QFR1000001XYZ | 20 days ago |- Clear all test data

| David Miller | C1 | KES 35,000 | QFR1000002XYZ | 10 days ago |- Create proper production accounts

| Lisa Anderson | B2 | KES 25,000 | QFR1000003XYZ | 5 days ago |- Set up real payment credentials



### Rent Payments (3 total)---



| Tenant | Unit | Amount | Status | Receipt | Notes |## 🐛 Troubleshooting

|--------|------|--------|--------|---------|-------|

| Michael Brown | A1 | KES 15,000 | Completed | QFR2000001XYZ | Full payment (5 days ago) |### If you see duplicate data errors:

| Emma Wilson | B1 | KES 15,000 | Completed | QFR2000002XYZ | Partial payment (3 days ago) |- Run the command with "yes" to clear existing data first

| David Miller | C1 | KES 35,000 | Pending | - | Payment pending |

### If tenants don't appear:

### Subscription Payment (1 total)- Check that TenantProfile was created for each tenant

- Verify landlord-tenant relationships in the database

| User | Plan | Amount | Status | Receipt | Date |

|------|------|--------|--------|---------|------|### If payments don't show:

| John Smith | Basic | KES 2,500 | Success | QFR3000001XYZ | 30 days ago |- Verify tenant profiles are properly linked

- Check that units have assigned tenants

---

---

## Maintenance Reports

**Happy Testing! 🎊**

### Report 1 - OPEN (Urgent)
- **Tenant:** Michael Brown
- **Unit:** A1
- **Category:** Plumbing
- **Priority:** Urgent
- **Title:** Leaking pipe in bathroom
- **Description:** The pipe under the sink is leaking water constantly
- **Status:** Open
- **Assigned To:** John Smith
- **Estimated Cost:** KES 5,000

### Report 2 - IN PROGRESS (High Priority)
- **Tenant:** Emma Wilson
- **Unit:** B1
- **Category:** Electrical
- **Priority:** High
- **Title:** Faulty light switches in bedroom
- **Description:** Two light switches are not working properly
- **Status:** In Progress
- **Assigned To:** John Smith
- **Estimated Cost:** KES 3,000
- **Reported:** 3 days ago

### Report 3 - RESOLVED
- **Tenant:** David Miller
- **Unit:** C1
- **Category:** WiFi
- **Priority:** Medium
- **Title:** WiFi not working
- **Description:** Cannot connect to WiFi network
- **Status:** Resolved
- **Assigned To:** John Smith
- **Estimated Cost:** KES 1,000
- **Actual Cost:** KES 500
- **Reported:** 10 days ago
- **Resolved:** 2 days ago

---

## Reminder Settings

### Landlord 1 - John Smith
- **Days of Month:** 1st, 15th, 28th
- **Subject:** Monthly Rent Reminder
- **Send Email:** Yes
- **Send SMS:** No
- **Status:** Active
- **Message Template:**
  ```
  Dear Tenant,

  This is a friendly reminder that your rent payment is due soon.

  Please ensure payment is made by the due date to avoid any penalties.

  Thank you for your cooperation.

  Best regards,
  John Smith
  Sunset Apartments
  ```

---

## Database Statistics

| Entity | Count |
|--------|-------|
| **Landlords** | 3 (2 test + 1 superuser) |
| **Tenants** | 6 |
| **Properties** | 2 |
| **Unit Types** | 3 |
| **Total Units** | 18 |
| **Occupied Units** | 4 |
| **Available Units** | 14 |
| **Tenant Profiles** | 4 |
| **Tenant Applications** | 2 |
| **Pending Applications** | 1 |
| **Approved Applications** | 1 |
| **Payments** | 7 |
| **Completed Payments** | 6 |
| **Pending Payments** | 1 |
| **Subscription Payments** | 1 |
| **Maintenance Reports** | 3 |
| **Open Reports** | 1 |
| **In Progress Reports** | 1 |
| **Resolved Reports** | 1 |
| **Reminder Settings** | 1 |

---

## Testing Scenarios

### Scenario 1: Landlord Login & Dashboard
- **Login as:** landlord1@test.com / testpass123
- **Expected:**
  - See 2 properties
  - See 18 total units (4 occupied, 14 available)
  - See 6 tenants
  - See 2 pending applications
  - See 3 maintenance reports (1 urgent)
  - See payment statistics

### Scenario 2: Tenant Login & Payments
- **Login as:** tenant2@test.com / testpass123
- **Expected:**
  - See assigned unit: B1 (1 Bedroom)
  - See rent balance: KES 10,000 remaining
  - See payment history (1 deposit + 1 partial rent)
  - See 1 in-progress maintenance report

### Scenario 3: Application Approval
- **Login as:** landlord1@test.com / testpass123
- **Action:** Approve James Taylor's application for Unit A2
- **Expected:**
  - Application status changes to "Approved"
  - Unit A2 should be assignable to tenant
  - Can create tenant profile

### Scenario 4: Maintenance Report Management
- **Login as:** landlord1@test.com / testpass123
- **Action:** Update Report #1 (plumbing) to "In Progress"
- **Expected:**
  - Status updates
  - Can add actual cost
  - Tenant receives notification

### Scenario 5: Payment Processing
- **Login as:** tenant3@test.com / testpass123
- **Action:** Make rent payment for KES 35,000
- **Expected:**
  - Payment record created
  - Unit rent status updates
  - Receipt generated

### Scenario 6: Create New Unit
- **Login as:** landlord1@test.com / testpass123
- **Property:** Sunset Apartments
- **Action:** Create new unit (within 20 unit limit)
- **Expected:**
  - Unit created successfully
  - Unit code auto-generated
  - Available for assignment

### Scenario 7: Tenant Application Workflow
- **Login as:** tenant5@test.com / testpass123
- **Action:** View application status for Unit A2
- **Expected:**
  - See pending application
  - Can withdraw application
  - Receives notification when landlord responds

---

## API Testing Endpoints

### Authentication
```bash
# Login as Landlord
POST /api/login/
{
  "email": "landlord1@test.com",
  "password": "testpass123"
}

# Login as Tenant
POST /api/login/
{
  "email": "tenant1@test.com",
  "password": "testpass123"
}
```

### Properties & Units
```bash
# Get landlord's properties
GET /api/properties/
Authorization: Bearer <token>

# Get units for property
GET /api/properties/{property_id}/units/
Authorization: Bearer <token>
```

### Payments
```bash
# Get tenant's payments
GET /api/payments/
Authorization: Bearer <tenant_token>

# Create payment
POST /api/payments/
{
  "unit": 1,
  "payment_type": "rent",
  "amount": 15000,
  "payment_method": "mpesa"
}
```

### Reports
```bash
# Get tenant's reports
GET /api/reports/
Authorization: Bearer <tenant_token>

# Create report
POST /api/reports/
{
  "unit": 1,
  "issue_category": "plumbing",
  "issue_title": "Test issue",
  "description": "Test description"
}
```

---

## Notes

- All passwords are set to `testpass123` for easy testing
- Superuser account is preserved during reset
- Landlord codes are auto-generated (format: L-XXXXXXXXXX)
- Unit codes are auto-generated (format: PROPERTY-UNITNUMBER)
- Payment receipts follow format: QFR{number}XYZ
- All monetary values are in Kenyan Shillings (KES)
- Dates are relative to script execution time

---

## Next Steps

1. **Test Frontend Integration:**
   - Login flows for landlords and tenants
   - Dashboard data display
   - Payment processing
   - Application workflows

2. **Test Backend APIs:**
   - Authentication endpoints
   - CRUD operations for all models
   - Payment processing
   - Report management

3. **Test Business Logic:**
   - Subscription enforcement
   - Unit assignment rules
   - Payment calculations
   - Reminder scheduling

4. **Test Edge Cases:**
   - Expired subscriptions
   - Unit capacity limits
   - Duplicate applications
   - Invalid payments

---

**Last Updated:** October 29, 2025  
**Script Location:** `Makau Rentals/app/reset_and_populate_db.py`
