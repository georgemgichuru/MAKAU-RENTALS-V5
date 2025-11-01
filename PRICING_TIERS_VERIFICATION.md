# 🎯 Pricing Tiers Verification & Subscription System Summary

## ✅ COMPLETE PRICING STRUCTURE

### Monthly Subscription Tiers (Based on Units)

| Tier | Unit Range | Properties | Monthly Price | Backend Plan |
|------|-----------|-----------|---------------|--------------|
| **Free Trial** | 1-10 units | Up to 2 | KSh 0 | `free` |
| **Tier 1** | 1-10 units | Up to 3 | **KSh 2,000** | `starter` |
| **Tier 2** | 11-20 units | Up to 10 | **KSh 2,500** | `basic` |
| **Tier 3** | 21-50 units | Up to 10 | **KSh 4,500** | `basic` |
| **Tier 4** | 51-100 units | Up to 25 | **KSh 7,500** | `professional` |
| **Enterprise** | 100+ units | Custom | Contact Sales | Custom |

### 🎁 One-Time Payment Option (Lifetime Access)

| Plan | Unit Range | Properties | One-Time Price | Backend Plan |
|------|-----------|-----------|----------------|--------------|
| **Lifetime** | **Up to 50 units ONLY** | **Unlimited** | **KSh 40,000** | `onetime` |

#### Important Notes on One-Time Plan:
- ✅ Unlimited properties
- ⚠️ **Strictly limited to 50 units maximum** (same as Tier 3 range)
- 💰 One-time payment of KSh 40,000
- 🔒 Lifetime access with no monthly fees
- 📊 Ideal for landlords with 21-50 units who want to avoid monthly payments

---

## 📍 WHERE EACH TIER IS USED

### 1. Backend: `accounts/views.py`
```python
# Lines 502-522 & 716-736 - Tier calculation for free trial warnings
if total_units <= 10:
    suggested_tier = "Tier 1 (1-10 Units)"
    suggested_price = 2000
elif total_units <= 20:
    suggested_tier = "Tier 2 (11-20 Units)"
    suggested_price = 2500
elif total_units <= 50:
    suggested_tier = "Tier 3 (21-50 Units)"
    suggested_price = 4500
    is_one_time_eligible = True  # 🎁 One-Time option available!
elif total_units <= 100:
    suggested_tier = "Tier 4 (51-100 Units)"
    suggested_price = 7500
else:
    suggested_tier = "Enterprise (100+ Units)"
    suggested_price = "Custom"
```

**✅ Fixed:** Added `is_one_time_eligible` flag for users with 21-50 units

### 2. Backend: `accounts/subscription_utils.py`
```python
PLAN_LIMITS = {
    "free": {"properties": 2, "units": 10, "price": 0},
    "starter": {"properties": 3, "units": 10, "price": 2000},
    "basic": {"properties": 10, "units": 50, "price": 2500},
    "professional": {"properties": 25, "units": 100, "price": 7500},
    "onetime": {"properties": None, "units": 50, "price": 40000}
}
```

**✅ Fixed:** 
- Updated `starter` from 500 → 2000
- Updated `basic` from 2000 → 2500
- Updated `professional` from 5000 → 7500
- Changed `lifetime` → `onetime` for consistency

### 3. Backend: `payments/views.py`
```python
plan_amounts = {
    'starter': 2000,        # tier1: 1-10 units
    'basic': 2500,          # tier2: 11-20 units  
    'professional': 4500,   # tier3/tier4: 21-100 units
    'onetime': 40000        # Lifetime access
}
```

**⚠️ NOTE:** This has a discrepancy - professional is 4500 instead of 7500. This needs review!

### 4. Backend: `payments/views_pesapal.py`
```python
plan_amounts = {
    'starter': 2000,
    'basic': 2500,
    'professional': 4500,
    'onetime': 40000
}
```

**⚠️ NOTE:** Same discrepancy - professional is 4500 instead of 7500

### 5. Frontend: Landing Page (`page.tsx`)
```tsx
✅ Free Trial (30 days) - KSh 0
✅ Tier 1 (1–10 Units) - KSh 2,000/mo
✅ Tier 2 (11–20 Units) - KSh 2,500/mo
✅ Tier 3 (21–50 Units) - KSh 4,500/mo (Most Popular)
✅ Tier 4 (51–100 Units) - KSh 7,500/mo
✅ Lifetime (One‑Time) - KSh 40,000 (Up to 50 units only)
```

**✅ Fixed:** Updated Tier 4 from 4,500 → 7,500 and clarified "50 units only"

---

## 🔧 CRITICAL DISCREPANCIES TO RESOLVE

### Issue 1: Payment Views vs. Views.py Pricing Mismatch

**In `views.py`:** Tier 4 = KSh 7,500
**In `payments/views.py`:** professional = KSh 4,500

#### Recommended Fix:
Update both payment files to match the tier system:

```python
# payments/views.py & payments/views_pesapal.py
plan_amounts = {
    'starter': 2000,        # Tier 1: 1-10 units
    'basic': 2500,          # Tier 2: 11-20 units  
    'professional': 7500,   # Tier 4: 51-100 units
    'onetime': 40000        # Lifetime: up to 50 units
}
```

**But wait!** What about **Tier 3 (21-50 units at 4,500)**?

### Issue 2: Missing Tier 3 in Payment Plans

The current backend plan names don't distinguish between:
- Tier 2 (11-20 units) → KSh 2,500
- Tier 3 (21-50 units) → KSh 4,500

Both use `basic` plan but have different prices!

#### Option A: Add a new plan
```python
plan_amounts = {
    'starter': 2000,      # Tier 1: 1-10
    'basic': 2500,        # Tier 2: 11-20
    'premium': 4500,      # Tier 3: 21-50  ⭐ NEW
    'professional': 7500, # Tier 4: 51-100
    'onetime': 40000      # Lifetime: up to 50
}
```

#### Option B: Dynamic pricing based on unit count
Keep current plans but calculate price dynamically in views.py based on actual unit count.

---

## ✅ SUBSCRIPTION SYSTEM VERIFICATION

### Models (`accounts/models.py`)
```python
PLAN_CHOICES = [
    ("free", "Free (60-day trial)"),
    ("starter", "Starter (up to 10 units)"),
    ("basic", "Basic (10-50 units)"),
    ("professional", "Professional (50-100 units)"),
    ("onetime", "One-time (Unlimited properties)"),
]
```

✅ **Status:** `onetime` plan exists in model

### Subscription Logic
- ✅ Free trial: 60 days (can be 30 days based on PLAN_LIMITS)
- ✅ Monthly plans: Auto-renew every 30 days
- ✅ One-time plan: No expiry (`expiry_date = None`)

### Subscription Enforcement
- ✅ Property creation checks limits
- ✅ Unit creation checks limits
- ✅ Free trial shows tier change warnings with one-time option
- ✅ Email notifications for limit reached/approaching

---

## 🎯 RECOMMENDED ACTIONS

### Immediate (Critical)
1. **Decide on Tier 3 handling:**
   - Option A: Add `premium` plan to backend
   - Option B: Keep 4 plans, use dynamic pricing in views.py

2. **Fix payment amount discrepancy:**
   - Update `payments/views.py` line 220
   - Update `payments/views_pesapal.py` line 189
   - Make professional = 7500 OR keep at 4500 (decide which is correct)

### Short-term
1. **Align free trial duration:**
   - Models say 60 days
   - PLAN_LIMITS say 30 days
   - Landing page says 30 days
   - **Pick one!**

2. **Update subscription_utils.py:**
   - If using Tier 3 separately, add to PLAN_LIMITS

### Long-term
1. Create centralized pricing config file
2. Add pricing validation tests
3. Document tier upgrade paths clearly

---

## 📊 CURRENT STATUS SUMMARY

| Component | Status | Notes |
|-----------|--------|-------|
| Landing Page Pricing | ✅ Fixed | Shows all 6 tiers correctly |
| Backend Tier Calculation | ✅ Fixed | Added one-time eligibility flag |
| Subscription Utils | ✅ Fixed | Updated to onetime, correct prices |
| Payment Views | ⚠️ Needs Review | Professional price mismatch |
| Models | ✅ Good | Onetime plan exists |
| Limits Enforcement | ✅ Working | Checks properties/units |

---

## 🔑 KEY TAKEAWAYS

1. **One-Time Plan IS included** in the system (`onetime` plan)
2. **Lifetime plan strictly limited to 50 units** (not unlimited)
3. **Tier 4 should be KSh 7,500** per views.py (not 4,500)
4. **Tier 3 (21-50 units @ 4,500) needs payment plan mapping**
5. **Landing page now shows all pricing correctly**

---

Generated: November 1, 2025
Last Updated: After fixing Tier 4 pricing and adding one-time plan clarifications
