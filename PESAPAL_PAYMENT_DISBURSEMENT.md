# PesaPal Payment Disbursement Guide

## Overview
Your application now uses **PesaPal** as the payment gateway for all transactions including rent payments, deposits, and subscription fees. This document explains how money flows from tenants to landlords.

---

## How Payments Work

### 1. **Payment Collection Flow**

```
Tenant → PesaPal Gateway → Your PesaPal Account → Landlord's Account
```

#### Step-by-Step Process:

**Step 1: Tenant Initiates Payment**
- Tenant clicks "Pay Now" in the Payment Center
- System creates a payment record with status `pending`
- Tenant is redirected to PesaPal payment page

**Step 2: PesaPal Payment Processing**
- Tenant chooses payment method (M-Pesa, Card, Airtel Money, Bank)
- Completes payment through chosen method
- PesaPal processes the transaction

**Step 3: Payment Confirmation**
- PesaPal sends IPN (Instant Payment Notification) to your server
- System updates payment status to `completed`
- Tenant account is updated with payment details
- Unit rent balance is adjusted

**Step 4: Settlement to Your Account**
- PesaPal holds funds in your merchant account
- Funds are settled according to your PesaPal settlement schedule
- Typically: T+1 or T+2 business days

---

## Payment Disbursement to Landlords

### Current System Setup

**Important:** The current implementation collects all payments into **ONE central PesaPal merchant account** (your platform's account). Landlords do **NOT** receive automatic disbursements.

### Recommended Disbursement Methods

You have **three options** for distributing rent to landlords:

---

### **Option 1: Manual Bank Transfers (Current)**

**How it works:**
1. All rent payments accumulate in your PesaPal account
2. Money settles to your linked bank account (T+1/T+2 days)
3. You manually review payment reports
4. Transfer each landlord's share via bank transfer

**Advantages:**
- ✅ Simple to implement
- ✅ No additional integration needed
- ✅ Full control over disbursements

**Disadvantages:**
- ❌ Time-consuming for many landlords
- ❌ Manual reconciliation required
- ❌ Transfer fees add up

**Implementation:**
```python
# Generate landlord payment report
GET /api/payments/rent-payments/csv/?landlord_id=123

# Shows all payments for landlord's properties
# Calculate total to disburse
# Perform bank transfer manually
```

---

### **Option 2: PesaPal Split Payments (Recommended)**

**How it works:**
1. Configure each landlord's PesaPal account in your system
2. When tenant pays, money automatically splits:
   - Platform fee → Your account
   - Landlord share → Landlord's PesaPal account

**Advantages:**
- ✅ Fully automated
- ✅ Instant settlement to landlords
- ✅ Transparent commission structure
- ✅ Reduces manual work

**Disadvantages:**
- ❌ Requires PesaPal Business account upgrade
- ❌ Each landlord needs PesaPal account
- ❌ Additional PesaPal configuration

**Implementation Required:**
```python
# In models.py - Add landlord PesaPal account
class CustomUser(AbstractUser):
    pesapal_merchant_id = models.CharField(max_length=100, blank=True)
    commission_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=10.00)

# In views_pesapal.py - Configure split payment
def submit_order():
    payload = {
        # ... existing fields
        "split_payment": {
            "merchant_reference": landlord.pesapal_merchant_id,
            "percentage": 100 - platform_commission,
        }
    }
```

**Contact PesaPal to enable:** support@pesapal.com

---

### **Option 3: Automated M-Pesa B2C Transfers**

**How it works:**
1. Collect all payments to your account
2. Run daily/weekly batch job
3. Automatically send M-Pesa to landlords' phone numbers
4. Use M-Pesa B2C API

**Advantages:**
- ✅ Automated disbursement
- ✅ Landlords receive money directly to M-Pesa
- ✅ No landlord account setup needed

**Disadvantages:**
- ❌ Requires separate M-Pesa B2C integration
- ❌ Additional transaction fees
- ❌ Daily limits apply

**Implementation Required:**
```python
# Create new disbursement service
# File: payments/mpesa_disbursement.py

import requests
from django.conf import settings

class MPesaDisbursement:
    def send_to_landlord(landlord_phone, amount, transaction_ref):
        """
        Send money to landlord via M-Pesa B2C
        """
        url = "https://api.safaricom.co.ke/mpesa/b2c/v1/paymentrequest"
        
        payload = {
            "InitiatorName": settings.MPESA_INITIATOR_NAME,
            "SecurityCredential": settings.MPESA_SECURITY_CREDENTIAL,
            "CommandID": "BusinessPayment",
            "Amount": amount,
            "PartyA": settings.MPESA_SHORTCODE,
            "PartyB": landlord_phone,
            "Remarks": f"Rent collection - {transaction_ref}",
            "QueueTimeOutURL": settings.MPESA_TIMEOUT_URL,
            "ResultURL": settings.MPESA_RESULT_URL,
            "Occasion": "Rent Disbursement"
        }
        
        response = requests.post(url, json=payload, headers=headers)
        return response.json()

# Schedule daily with celery
@shared_task
def disburse_landlord_payments():
    """Run daily at midnight"""
    for landlord in CustomUser.objects.filter(is_landlord=True):
        total_owed = calculate_landlord_balance(landlord)
        if total_owed >= 100:  # Minimum threshold
            MPesaDisbursement.send_to_landlord(
                landlord.phone_number,
                total_owed,
                f"RENT-{landlord.id}-{date.today()}"
            )
```

---

## Current System Behavior

### What Happens Now:

1. **Tenant pays rent:**
   - Money goes to: Your PesaPal account
   - Database updated: `Payment.status = 'completed'`
   - Unit balance reduced: `Unit.rent_remaining -= payment.amount`

2. **Money settlement:**
   - PesaPal settles to your bank account (1-2 business days)
   - All funds accumulated in one account

3. **Landlord tracking:**
   - System tracks which payments belong to which landlord
   - Reports available via: `GET /api/payments/rent-payments/csv/`

4. **Disbursement:**
   - **Currently manual** - You transfer to landlords yourself

---

## Recommended Next Steps

### For Production Deployment:

**Phase 1: Manual Disbursement (Current)**
- ✅ Already working
- Export payment reports
- Transfer manually to landlords
- Track in spreadsheet

**Phase 2: Add Landlord Bank Details**
```python
# In models.py
class CustomUser(AbstractUser):
    bank_name = models.CharField(max_length=100, blank=True)
    bank_account_number = models.CharField(max_length=50, blank=True)
    bank_branch = models.CharField(max_length=100, blank=True)
```

**Phase 3: Automate with PesaPal Split Payments**
- Contact PesaPal support
- Upgrade account to Business tier
- Implement split payment logic
- Test with pilot landlords

**Alternative Phase 3: Automate with M-Pesa B2C**
- Integrate M-Pesa B2C API
- Create disbursement scheduler
- Set minimum thresholds
- Implement retry logic

---

## Commission Structure Example

### Option A: Platform Fee Model
```
Tenant pays: KES 10,000 rent
├─ Platform commission (10%): KES 1,000 → Your account
└─ Landlord payment (90%): KES 9,000 → Landlord account
```

### Option B: Fixed Fee Model
```
Tenant pays: KES 10,000 rent
├─ Platform fee (fixed): KES 200 → Your account
└─ Landlord payment: KES 9,800 → Landlord account
```

### Implementation:
```python
# In settings.py
PLATFORM_COMMISSION_PERCENTAGE = 10.0  # 10%
PLATFORM_FIXED_FEE = 200  # KES 200

# In views_pesapal.py
def calculate_disbursement(payment_amount):
    commission = payment_amount * (PLATFORM_COMMISSION_PERCENTAGE / 100)
    landlord_share = payment_amount - commission
    
    return {
        'total': payment_amount,
        'commission': commission,
        'landlord_share': landlord_share
    }
```

---

## Database Tracking

### Current Payment Records:

```python
# Payment model tracks all transactions
Payment.objects.filter(
    unit__property_obj__landlord=landlord,
    status='completed'
)

# Calculate total collected per landlord
total_collected = Payment.objects.filter(
    unit__property_obj__landlord=landlord,
    status='completed'
).aggregate(Sum('amount'))['amount__sum']

# Track disbursements (add new model)
class Disbursement(models.Model):
    landlord = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20)  # 'bank', 'mpesa', 'pesapal'
    transaction_id = models.CharField(max_length=100)
    status = models.CharField(max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)
    disbursed_at = models.DateTimeField(null=True, blank=True)
```

---

## Security & Compliance

### Best Practices:

1. **Escrow Period**
   - Hold funds for 24-48 hours before disbursement
   - Allows dispute resolution window

2. **Reconciliation**
   - Daily reconciliation reports
   - Match PesaPal settlements with database records

3. **Audit Trail**
   - Log all disbursements
   - Track payment → disbursement mapping

4. **Tax Compliance**
   - Generate tax reports for landlords
   - Track withholding tax if applicable

---

## API Endpoints for Disbursement

### Get Landlord Balance:
```
GET /api/payments/landlord-balance/
Response:
{
  "total_collected": 150000,
  "total_disbursed": 120000,
  "pending_disbursement": 30000,
  "last_disbursement_date": "2025-10-20"
}
```

### Create Disbursement:
```
POST /api/payments/disburse-to-landlord/
{
  "landlord_id": 123,
  "amount": 30000,
  "method": "mpesa",
  "phone_number": "+254712345678"
}
```

---

## Summary

**Current State:**
- ✅ Tenants can pay via PesaPal
- ✅ Money goes to your central account
- ✅ System tracks landlord shares
- ❌ Manual disbursement required

**Next Steps:**
1. Choose disbursement method (Manual → Automated)
2. Add landlord payment details to database
3. Implement chosen disbursement method
4. Test with pilot landlords
5. Roll out to all landlords

**Questions?**
Contact PesaPal Support: support@pesapal.com
