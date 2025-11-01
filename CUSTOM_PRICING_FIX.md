# Custom Pricing Fix for 100+ Units - Implementation Summary

## Issue
When landlords signed up with more than 100 units, the subscription displayed "KES 0" instead of showing custom pricing information with contact details.

## Solution Implemented
Updated both frontend and backend to properly handle enterprise/custom pricing for landlords with more than 100 units.

---

## Changes Made

### 1. Frontend - LoginForm.jsx (`Makao-Center-V4/src/components/Login and Sign Up/LoginForm.jsx`)

#### Updated Pricing Tiers Array
```javascript
const pricingTiers = [
  { min: 1, max: 10, price: 2000, label: '1-10 units' },
  { min: 11, max: 20, price: 2500, label: '11-20 units' },
  { min: 21, max: 50, price: 4500, label: '21-50 units' },
  { min: 51, max: 100, price: 7500, label: '51-100 units' },
  { min: 101, max: Infinity, price: 'custom', label: '100+ units - Contact us for custom pricing', isCustom: true }
];
```

**Changes:**
- Changed `price: 0` to `price: 'custom'`
- Updated label to include contact messaging
- Added `isCustom: true` flag for easier identification

#### Updated Fee Calculation Logic
```javascript
const calculateMonthlyFee = () => {
  const totalUnits = calculateTotalUnits();
  const tier = pricingTiers.find(t => totalUnits >= t.min && totalUnits <= t.max);
  return tier ? tier.price : 'custom';
};

const formatFeeDisplay = () => {
  const fee = calculateMonthlyFee();
  if (fee === 'custom') {
    return 'Contact us for custom pricing at +254722714334';
  }
  return `KES ${fee}`;
};
```

**Changes:**
- Modified `calculateMonthlyFee()` to return `'custom'` instead of `0`
- Added new `formatFeeDisplay()` helper function with phone number

#### Updated UI Display (Step 3 - Unit Review)
```javascript
<p className="text-blue-700 text-sm">
  Total Units: <strong>{calculateTotalUnits()}</strong> | 
  Monthly Subscription: <strong>{formatFeeDisplay()}</strong>
</p>
```

**Changes:**
- Replaced direct `KES {calculateMonthlyFee()}` with `{formatFeeDisplay()}`

#### Updated Subscription Plan Display (Step 4)
```javascript
// Main subscription info box
<div className="flex justify-between items-center pt-2 border-t border-gray-300">
  <span className="text-gray-600">Monthly Subscription (after trial):</span>
  <span className="font-bold text-lg text-blue-600">{formatFeeDisplay()}</span>
</div>

// Conditional display based on pricing type
{calculateMonthlyFee() !== 'custom' && (
  <div className="mt-3 p-2 bg-green-100 rounded text-center">
    <p className="text-sm font-semibold text-green-700">
      First month: <span className="line-through text-gray-500">KES {calculateMonthlyFee()}</span> <span className="text-xl">FREE</span>
    </p>
  </div>
)}

{calculateMonthlyFee() === 'custom' && (
  <div className="mt-3 p-3 bg-amber-50 border border-amber-300 rounded text-center">
    <p className="text-sm font-semibold text-amber-800 mb-1">
      📞 Custom Enterprise Pricing
    </p>
    <p className="text-xs text-amber-700">
      Please contact us at <a href="tel:+254722714334" className="underline font-bold">+254722714334</a> for a personalized quote
    </p>
  </div>
)}
```

**Changes:**
- Shows custom pricing message with contact number for 100+ units
- Shows standard free trial message for regular tiers

#### Updated Pricing Tier Cards
```javascript
<div className="text-right">
  {tier.isCustom ? (
    <div>
      <p className="font-bold text-xl text-amber-600">Custom Pricing</p>
      <p className="text-xs text-gray-500">Call for quote</p>
    </div>
  ) : (
    <>
      <p className="font-bold text-xl">KES {tier.price}<span className="text-sm text-gray-500">/month</span></p>
      <p className="text-xs text-gray-500">After free trial</p>
    </>
  )}
</div>
```

**Changes:**
- Added conditional rendering for custom pricing tier
- Shows "Custom Pricing" instead of "KES 0"

#### Fixed Button Disable Logic
```javascript
<button
  onClick={handleLandlordNext}
  disabled={isLoading}
  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 font-bold text-lg shadow-lg flex items-center justify-center"
>
  {isLoading ? (
    <>
      <Loader2 className="w-4 h-4 animate-spin mr-2" />
      Creating Account...
    </>
  ) : (
    <>
      <CheckCircle className="w-5 h-5 mr-2" />
      {calculateMonthlyFee() === 'custom' ? 'Complete Registration' : 'Start Free Trial'}
    </>
  )}
</button>
```

**Changes:**
- Removed `|| calculateMonthlyFee() === 0` from disabled condition
- Now allows registration for custom pricing customers
- Changed button text to "Complete Registration" for custom pricing

---

### 2. Backend - views.py (`Makau Rentals/app/accounts/views.py`)

#### Updated CreatePropertyView
```python
# Determine which tier they'll be charged for
suggested_tier = None
suggested_price = 0
contact_number = None
if total_units <= 10:
    suggested_tier = "Tier 1 (1-10 Units)"
    suggested_price = 2000
elif total_units <= 20:
    suggested_tier = "Tier 2 (11-20 Units)"
    suggested_price = 2500
elif total_units <= 50:
    suggested_tier = "Tier 3 (21-50 Units)"
    suggested_price = 4500
elif total_units <= 100:
    suggested_tier = "Tier 4 (51-100 Units)"
    suggested_price = 7500
else:
    suggested_tier = "Enterprise (100+ Units)"
    suggested_price = "Custom"
    contact_number = "+254722714334"

# Updated warning message logic
if tier_changed:
    if suggested_price == "Custom":
        warning_message = f'Property created! You now have {total_properties} properties and {total_units} units. For custom enterprise pricing, please contact us at {contact_number}.'
    else:
        warning_message = f'Property created! You now have {total_properties} properties. Your subscription plan will automatically adjust to {suggested_tier} (KES {suggested_price}/month) when your trial ends in {days_remaining} days.'

response_data['trial_warning'] = {
    'message': warning_message,
    'billing_info': {
        'total_properties': total_properties,
        'total_units': total_units,
        'suggested_tier': suggested_tier,
        'monthly_cost': suggested_price,
        'contact_number': contact_number,
        'billing_starts': subscription.expiry_date.strftime('%Y-%m-%d') if subscription.expiry_date else None,
        'tier_changed': tier_changed
    },
    'note': f'After your trial ends, you will be charged KES {suggested_price}/month for {suggested_tier} based on your {total_properties} property(ies) and {total_units} unit(s).' if isinstance(suggested_price, int) else f'Please contact us at {contact_number} for enterprise pricing.'
}
```

**Changes:**
- Added `contact_number` variable set to `+254722714334` for 100+ units
- Changed `suggested_price` to `"Custom"` string instead of maintaining it as integer
- Updated warning message to include contact number for custom pricing
- Added `contact_number` to `billing_info` response
- Updated note to show contact information for custom pricing

#### Updated CreateUnitView
```python
# Same changes as CreatePropertyView
suggested_tier = None
suggested_price = 0
contact_number = None
# ... (same tier logic as above)

# Updated warning message
if tier_changed:
    if suggested_price == "Custom":
        warning_message = f'Unit created! You now have {total_units} units across {total_properties} properties. For custom enterprise pricing, please contact us at {contact_number}.'
    else:
        warning_message = f'Unit created! You now have {total_units} units. Your subscription plan will automatically adjust to {suggested_tier} (KES {suggested_price}/month) when your trial ends in {days_remaining} days.'

response_data['trial_warning'] = {
    'message': warning_message,
    'billing_info': {
        'total_properties': total_properties,
        'total_units': total_units,
        'suggested_tier': suggested_tier,
        'monthly_cost': suggested_price,
        'contact_number': contact_number,
        'billing_starts': subscription.expiry_date.strftime('%Y-%m-%d') if subscription.expiry_date else None,
        'tier_changed': tier_changed
    },
    'note': f'After your trial ends, you will be charged KES {suggested_price}/month for {suggested_tier} based on your {total_properties} property(ies) and {total_units} unit(s).' if isinstance(suggested_price, int) else f'Please contact us at {contact_number} for enterprise pricing.'
}
```

**Changes:**
- Same logic as CreatePropertyView for consistency
- Added contact number for custom pricing
- Updated response messages

---

### 3. Frontend - SubscriptionPage.jsx (`Makao-Center-V4/src/components/Admin/SubscriptionPage.jsx`)

#### Updated Pricing Tiers
```javascript
{ 
  id: 'tier5',
  min: 101, 
  max: Infinity, 
  price: 'custom', 
  label: '100+ Units - Enterprise',
  billingPeriod: 'custom',
  enterprise: true,
  contactNumber: '+254722714334',
  features: [
    'Unlimited rental units',
    'White-label solution',
    'Custom features',
    'Dedicated account manager',
    'SLA guarantee',
    'On-premise deployment option',
    'Custom training',
    'Contact us for pricing at +254722714334'
  ]
}
```

**Changes:**
- Changed `price: 0` to `price: 'custom'`
- Added `contactNumber: '+254722714334'`
- Updated label and features to include contact number

#### Updated Trial Warning Display
```javascript
{suggestedPlan.price === 'custom' ? (
  <div>
    <p className="text-sm text-gray-700">
      You'll need <strong>{suggestedPlan.label}</strong> based on your current {totalUnits} unit{totalUnits !== 1 ? 's' : ''}.
    </p>
    <p className="text-sm text-amber-700 mt-2 font-semibold">
      📞 Please contact us at <a href="tel:+254722714334" className="underline">+254722714334</a> for custom enterprise pricing.
    </p>
  </div>
) : (
  // ... standard pricing display
)}
```

**Changes:**
- Added conditional rendering for custom pricing
- Shows contact information for enterprise customers

#### Updated Tier Card Display
```javascript
<div className="mb-5">
  {tier.price === 'custom' ? (
    <>
      <span className="text-2xl sm:text-3xl font-bold text-amber-600">
        Custom Pricing
      </span>
      <p className="text-xs sm:text-sm text-gray-600 mt-2">
        Call {tier.contactNumber} for quote
      </p>
    </>
  ) : (
    <>
      <span className="text-2xl sm:text-3xl font-bold text-gray-900">
        KSh {tier.price.toLocaleString()}
      </span>
      <span className="text-sm text-gray-500 ml-1">/{tier.billingPeriod}</span>
    </>
  )}
</div>
```

**Changes:**
- Added conditional rendering for price display
- Shows "Custom Pricing" and contact number for enterprise tier

#### Updated Button Styling and Action
```javascript
<button
  onClick={() => handleSelectPlan(tier.id)}
  className={`w-full py-2.5 sm:py-3 rounded-lg font-medium text-sm transition-colors ${
    tier.popular
      ? 'bg-blue-600 text-white hover:bg-blue-700'
      : tier.enterprise
      ? 'bg-amber-600 text-white hover:bg-amber-700'
      : 'bg-gray-50 text-gray-900 hover:bg-gray-100 border border-gray-300'
  }`}
>
  {tier.enterprise ? 'Contact Us' : 'Select Plan'}
</button>
```

**Changes:**
- Added amber styling for enterprise tier
- Changed button text to "Contact Us" for enterprise

#### Updated handleSelectPlan Function
```javascript
const handleSelectPlan = (planId) => {
  console.log('Selected plan:', planId);
  
  // Handle enterprise tier separately
  if (planId === 'tier5') {
    window.location.href = 'tel:+254722714334';
    return;
  }
  
  // ... rest of the function
};
```

**Changes:**
- Added check for tier5 (enterprise)
- Redirects to phone dialer when enterprise tier is selected

---

## Testing Checklist

### Landlord Signup Flow
- [ ] Test with 1-10 units: Should show "KES 2000"
- [ ] Test with 11-20 units: Should show "KES 2500"
- [ ] Test with 21-50 units: Should show "KES 4500"
- [ ] Test with 51-100 units: Should show "KES 7500"
- [ ] Test with 101+ units: Should show "Contact us for custom pricing at +254722714334"
- [ ] Verify button is NOT disabled for 100+ units
- [ ] Verify button text changes to "Complete Registration" for 100+ units

### Subscription Page
- [ ] Verify enterprise tier shows "Custom Pricing"
- [ ] Verify contact number +254722714334 is displayed
- [ ] Verify "Contact Us" button works and initiates phone call
- [ ] Verify trial warning shows custom pricing message for 100+ units

### Backend API Responses
- [ ] Test CreatePropertyView response for 100+ units includes contact_number
- [ ] Test CreateUnitView response for 100+ units includes contact_number
- [ ] Verify monthly_cost is "Custom" string (not integer 0)
- [ ] Verify warning messages include contact number

---

## Contact Information
**Custom Pricing Phone Number:** +254722714334

This number is now displayed in:
1. Landlord signup flow (Step 3 & 4)
2. Subscription page (enterprise tier)
3. Backend API responses (trial warnings)
4. All custom pricing messages

---

## Files Modified
1. `Makao-Center-V4/src/components/Login and Sign Up/LoginForm.jsx`
2. `Makau Rentals/app/accounts/views.py`
3. `Makao-Center-V4/src/components/Admin/SubscriptionPage.jsx`

## Date
October 31, 2025
