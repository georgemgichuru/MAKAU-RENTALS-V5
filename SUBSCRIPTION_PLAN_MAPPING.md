# Subscription Plan Mapping Reference

## Issue Fixed
The frontend was sending plan IDs like `'tier1'`, `'tier2'`, etc., but the backend expected plan names like `'starter'`, `'basic'`, `'professional'`.

## Current Plan Mapping

### Frontend → Backend Mapping

| Frontend Plan ID | Backend Plan Name | Units | Price | Duration |
|-----------------|-------------------|-------|-------|----------|
| `tier1` | `starter` | 1-10 | KSh 2,000 | 30 days |
| `tier2` | `basic` | 11-20 | KSh 2,500 | 30 days |
| `tier3` | `basic` | 21-50 | KSh 4,500 | 30 days |
| `tier4` | `professional` | 51-100 | KSh 7,500 | 30 days |
| `onetime` | `onetime` | Up to 50 | KSh 40,000 | Lifetime |

## Backend Plan Configuration

```python
plan_amounts = {
    'starter': 2000,        # tier1: 1-10 units
    'basic': 2500,          # tier2: 11-20 units  
    'professional': 4500,   # tier3/tier4: 21-100 units
    'onetime': 40000        # Lifetime access
}
```

## Frontend Plan Configuration

```javascript
const planMapping = {
  'tier1': 'starter',       // 1-10 units → starter
  'tier2': 'basic',         // 11-20 units → basic
  'tier3': 'basic',         // 21-50 units → basic (higher tier)
  'tier4': 'professional',  // 51-100 units → professional
  'onetime': 'onetime'      // Keep as is
};
```

## How It Works Now

1. User selects a plan on the subscription page (e.g., "tier1")
2. Frontend maps it to backend plan name (e.g., "starter")
3. Payment page receives both:
   - `planDetails.id`: Frontend ID for display (e.g., "tier1")
   - `planDetails.backendPlan`: Backend name for API call (e.g., "starter")
4. When initiating payment, sends `backendPlan` to backend
5. Backend validates the plan name and retrieves the correct amount

## Example Flow

```
User clicks "Select Plan" on tier1 card
  ↓
Frontend creates planDetails:
  {
    id: 'tier1',
    backendPlan: 'starter',
    name: '1-10 Units',
    price: 2000,
    ...
  }
  ↓
Navigate to payment page
  ↓
User enters phone and clicks Pay
  ↓
Frontend sends to backend:
  {
    plan: 'starter',  // Uses backendPlan
    phone_number: '0712345678'
  }
  ↓
Backend validates plan and initiates M-Pesa STK push
```

## Error Handling

If an invalid plan is sent, the backend now returns:
```json
{
  "error": "Invalid plan 'invalid_plan'. Valid plans are: starter, basic, professional, onetime"
}
```

This makes debugging much easier!

## Testing

To test each plan:

1. **Tier 1 (Starter)**: Select "1-10 Units" → Should charge KSh 2,000
2. **Tier 2 (Basic)**: Select "11-20 Units" → Should charge KSh 2,500
3. **Tier 3 (Basic)**: Select "21-50 Units" → Should charge KSh 4,500
4. **Tier 4 (Professional)**: Select "51-100 Units" → Should charge KSh 7,500
5. **One-Time**: Select "Lifetime Access" → Should charge KSh 40,000

Check the browser console for the plan mapping:
```javascript
console.log('Plan details with backend mapping:', planDetails);
```

## Files Modified

1. **SubscriptionPage.jsx**: Added plan mapping logic
2. **SubscriptionPaymentPage.jsx**: Uses `backendPlan` for API calls
3. **payments/views.py**: Updated plan amounts and added onetime support

---

**Status**: ✅ Fixed - Payment should now work correctly!
