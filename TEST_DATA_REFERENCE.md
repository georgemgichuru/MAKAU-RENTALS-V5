# Test Data Reference

## 🎉 Database Successfully Populated!

Your database now contains comprehensive test data for testing the Makau Rentals application.

---

## 👤 Landlord Accounts

### Landlord 1 - John Kamau (Professional Plan)
- **Email:** `landlord1@test.com`
- **Password:** `Test123!`
- **Landlord Code:** Check terminal output or database
- **Phone:** +254712345678
- **Till Number:** 123456
- **Subscription:** Professional (50-100 units)
- **Properties:** ~2-3 properties with multiple units

### Landlord 2 - Mary Wanjiku (Basic Plan)
- **Email:** `landlord2@test.com`
- **Password:** `Test123!`
- **Landlord Code:** Check terminal output or database
- **Phone:** +254723456789
- **Till Number:** 234567
- **Subscription:** Basic (10-50 units)
- **Properties:** ~2-3 properties with multiple units

### Landlord 3 - Peter Omondi (Starter Plan)
- **Email:** `landlord3@test.com`
- **Password:** `Test123!`
- **Landlord Code:** Check terminal output or database
- **Phone:** +254734567890
- **Till Number:** None
- **Subscription:** Starter (up to 10 units)
- **Properties:** ~2-3 properties with multiple units

---

## 🏠 Tenant Accounts

All tenants have the password: **`Test123!`**

| Email | Full Name | Property Assignment |
|-------|-----------|---------------------|
| tenant1@test.com | Various Names | Assigned to different units |
| tenant2@test.com | Various Names | Assigned to different units |
| tenant3@test.com | Various Names | Assigned to different units |
| ... | ... | ... |
| tenant29@test.com | Various Names | Assigned to different units |

**Note:** 29 tenants have been created and assigned to units. Each has a unique profile with:
- National ID
- Phone number
- Emergency contact
- Move-in date
- Lease end date
- Current unit assignment

---

## 📊 Generated Data Summary

### Properties
- **Total:** 7 properties across 3 landlords
- **Locations:** Nairobi, Mombasa, Kisumu
- **Types:** Apartments, Residences, Estates, Towers

### Units
- **Total:** 122 units
- **Available:** 93 units (ready for new tenants)
- **Occupied:** 29 units (with tenants)
- **Unit Types:**
  - Studio apartments
  - Bedsitters
  - 1-Bedroom
  - 2-Bedroom
  - 3-Bedroom

### Payments
- **Total:** 99 payment records
- **Types:**
  - Rent payments (most common)
  - Deposit payments
  - Maintenance fees
- **Status:** Mix of completed, pending, and failed
- **Methods:** M-Pesa, Cash, Bank Transfer
- **Date Range:** Last 6 months

### Maintenance Reports
- **Total:** 44 reports
- **Categories:**
  - Electrical issues
  - Plumbing problems
  - Noise complaints
  - WiFi issues
  - General maintenance
  - Pest control
  - Security concerns
  - Cleanliness
- **Status:** Mix of open, in_progress, resolved, and closed
- **Priority Levels:** Low, Medium, High, Urgent

---

## 🧪 Testing Scenarios

### 1. Landlord Login & Dashboard
- Log in as any landlord account
- View all properties, units, and tenants
- Check subscription status and limits
- Review payment history
- Manage maintenance reports

### 2. Tenant Login & Portal
- Log in as any tenant account (tenant1 - tenant29)
- View current unit and lease details
- Check payment history and outstanding balance
- Submit maintenance reports
- Make rent payments

### 3. Payment Testing
- View payment history for tenants
- Check different payment statuses
- Test M-Pesa integration with test data
- Review payment reports for landlords

### 4. Maintenance Workflow
- View open maintenance reports
- Test report assignment to landlords
- Update report status (open → in_progress → resolved)
- Add cost estimates and actual costs
- View report history and analytics

### 5. Subscription Management
- Test different subscription tiers
- View unit limits per subscription
- Test subscription expiry scenarios
- Upgrade/downgrade subscription plans

---

## 🔧 Useful Management Commands

### Re-populate Database
```bash
cd "Makau Rentals\app"
python manage.py populate_test_data
```
When prompted, type `yes` to clear existing test data first.

### Create Additional Test Data
Run the command again without clearing to add more data.

### View All Landlord Codes
```bash
python manage.py shell
```
Then run:
```python
from accounts.models import CustomUser
landlords = CustomUser.objects.filter(user_type='landlord', email__contains='test')
for l in landlords:
    print(f"{l.full_name}: {l.landlord_code}")
```

---

## 📝 Notes

1. **All passwords are:** `Test123!`
2. **Landlord codes** are auto-generated and shown in terminal output
3. **Data is randomized** - each time you run the script, you get different variations
4. **Payment amounts** are based on actual unit rent prices
5. **Reports** have realistic dates and status progressions
6. **Tenants** are automatically linked to their landlords via TenantProfile

---

## 🚀 Next Steps

1. **Start the development server:**
   ```bash
   cd "Makau Rentals\app"
   python manage.py runserver
   ```

2. **Start the React frontend:**
   ```bash
   cd "Makao-Center-V4"
   npm run dev
   ```

3. **Log in and explore** the application with test data!

---

## ⚠️ Important

This is **TEST DATA ONLY**. Do not use these accounts in production. Before deploying:
- Delete all test accounts
- Clear all test data
- Create proper production accounts
- Set up real payment credentials

---

## 🐛 Troubleshooting

### If you see duplicate data errors:
- Run the command with "yes" to clear existing data first

### If tenants don't appear:
- Check that TenantProfile was created for each tenant
- Verify landlord-tenant relationships in the database

### If payments don't show:
- Verify tenant profiles are properly linked
- Check that units have assigned tenants

---

**Happy Testing! 🎊**
