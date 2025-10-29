# Quick Test Credentials

## 🔐 Login Credentials

### Superuser
```
Email:    georgem.gichuru@gmail.com
Password: [Your superuser password]
```

### Landlord 1 (John Smith) - Basic Plan
```
Email:    landlord1@test.com
Password: testpass123
Code:     L-7E7A73509E
```

### Landlord 2 (Sarah Johnson) - Free Trial
```
Email:    landlord2@test.com
Password: testpass123
Code:     L-F5D337A13B
```

### Tenants

#### Tenant 1 - Michael Brown (Unit A1 - Studio)
```
Email:    tenant1@test.com
Password: testpass123
Status:   Rent PAID FULL
```

#### Tenant 2 - Emma Wilson (Unit B1 - 1BR)
```
Email:    tenant2@test.com
Password: testpass123
Status:   Rent PARTIAL (KES 10,000 remaining)
```

#### Tenant 3 - David Miller (Unit C1 - 2BR)
```
Email:    tenant3@test.com
Password: testpass123
Status:   Rent PENDING (KES 35,000 due)
```

#### Tenant 4 - Lisa Anderson (Unit B2 - 1BR)
```
Email:    tenant4@test.com
Password: testpass123
Status:   No rent payment yet
```

#### Tenant 5 - James Taylor (PENDING APPLICATION)
```
Email:    tenant5@test.com
Password: testpass123
Status:   Applied for Unit A2 (PENDING)
```

#### Tenant 6 - Maria Garcia (APPROVED APPLICATION)
```
Email:    tenant6@test.com
Password: testpass123
Status:   Applied for Unit A3 (APPROVED, deposit paid)
```

---

## 🏢 Properties Overview

### Sunset Apartments (Landlord 1)
- 18 Units (20 max)
- 4 Occupied, 14 Available
- Location: Nairobi, Nairobi County

**Unit Types:**
- Studio (A1-A5): KES 15,000/month
- 1 Bedroom (B1-B8): KES 25,000/month
- 2 Bedroom (C1-C5): KES 35,000/month

**Occupied:**
- A1: Michael Brown
- B1: Emma Wilson
- B2: Lisa Anderson
- C1: David Miller

### Green Valley Residences (Landlord 1)
- 0 Units (15 max)
- Empty property for testing

---

## 📋 Test Scenarios

### Quick Login Tests
1. Landlord Dashboard: `landlord1@test.com / testpass123`
2. Tenant with Pending Rent: `tenant3@test.com / testpass123`
3. Tenant with Partial Payment: `tenant2@test.com / testpass123`
4. Application Review: `landlord1@test.com` → Check applications
5. Maintenance Reports: `landlord1@test.com` → View 3 reports

---

## 🔄 Reset Command

```bash
cd "c:\Users\George Mwangi\Desktop\MAKAU-RENTALS-V5\Makau Rentals\app"
python reset_and_populate_db.py
```

**Note:** Type `yes` when prompted to confirm deletion.

---

**Last Updated:** October 29, 2025
