# Subscription Enforcement System

## Overview
This system ensures that landlords maintain active subscriptions to access premium features and prevents tenants from using the system when their landlord's subscription has expired.

## Components

### 1. **useSubscription Hook** (`hooks/useSubscription.js`)
- Checks subscription status every 5 minutes
- Returns:
  - `subscription`: Subscription details
  - `isActive`: Boolean if subscription is active
  - `isExpired`: Boolean if subscription has expired
  - `daysUntilExpiry`: Days remaining until expiration
  - `loading`: Loading state
  - `recheckSubscription()`: Function to manually recheck

### 2. **SubscriptionGuard Component** (`components/SubscriptionGuard.jsx`)
Wraps protected routes and enforces subscription requirements.

**Features**:
- Blocks access to expired subscriptions
- Shows warning 7 days before expiry
- Displays blocked screen with renewal option
- Allows "Remind Me Later" for warnings

**Usage**:
```jsx
<SubscriptionGuard requireActive={true}>
  <ProtectedComponent />
</SubscriptionGuard>
```

### 3. **SubscriptionExpiredModal** (`components/Admin/SubscriptionExpiredModal.jsx`)
Modal dialog showing subscription status.

**Props**:
- `isOpen`: Boolean to show/hide
- `subscription`: Subscription object
- `daysUntilExpiry`: Days until expiration
- `isExpired`: Boolean if expired

## Protected Routes

### Landlord Routes (Require Active Subscription)
✅ **Always Accessible**:
- `/admin/dashboard` - Can view but with warnings
- `/admin/settings` - Access to renew subscription
- `/admin/subscription` - Subscription management
- `/admin/subscription/payment` - Payment processing
- `/admin/help` - Support access

🔒 **Restricted When Expired**:
- `/admin/tenants` - Tenant management
- `/admin/tenants/:id/transactions` - Transaction history
- `/admin/tenants/:id/details` - Tenant details
- `/admin/payments` - Payment tracking
- `/admin/reports` - Reporting features
- `/admin/organisation` - Property/unit management

### Tenant Routes (Require Landlord's Active Subscription)
🔒 **Restricted When Landlord Subscription Expired**:
- `/tenant/payments` - Cannot make rent payments

✅ **Always Accessible**:
- `/tenant` (dashboard) - Can view with warning
- `/tenant/report` - Can report issues
- `/tenant/settings` - Profile settings

## Backend Enforcement

### Permission Class: `HasActiveSubscription`

Located in: `accounts/permissions.py`

**For Landlords**:
```python
# Checks landlord's own subscription
subscription = Subscription.objects.get(user=request.user)
is_active = subscription.is_active()
```

**For Tenants**:
```python
# Checks tenant's landlord subscription
landlord = request.user.tenant_profile.landlord
subscription = Subscription.objects.get(user=landlord)
is_active = subscription.is_active()
```

**Caching**: Results cached for 5 minutes to reduce database queries.

### Protected API Endpoints

```python
# Example: Tenant management (landlord only)
class LandlordTenantsView(APIView):
    permission_classes = [IsAuthenticated, IsLandlord, HasActiveSubscription]
    
# Example: Rent payment (tenant - checks landlord subscription)
@api_view(['POST'])
@permission_classes([IsAuthenticated, HasActiveSubscription])
def stk_push(request, unit_id):
    # Tenants can only pay if landlord has active subscription
```

## User Experience Flow

### Landlord Experience

#### 1. **Subscription Active** (Normal Operation)
- Full access to all features
- No warnings or restrictions

#### 2. **7 Days Before Expiry** (Warning Period)
- Dashboard shows yellow warning banner
- Warning modal appears once per session
- Can click "Remind Me Later" to dismiss
- Full functionality still available

#### 3. **Subscription Expired** (Restricted Access)
- Dashboard shows red critical banner
- Blocked from:
  - Viewing payments
  - Managing tenants
  - Viewing reports
  - Managing properties/units
- Modal forces renewal (no "Remind Me Later")
- Can only access:
  - Dashboard (with restrictions)
  - Settings
  - Subscription page
  - Help

### Tenant Experience

#### 1. **Landlord Subscription Active**
- Normal operation
- Can make rent payments
- Full access to tenant features

#### 2. **Landlord Subscription Expired**
- Blocked from making payments
- See message: "Payment unavailable - Your landlord's subscription has expired"
- Can still:
  - View dashboard
  - Report issues
  - Access settings

## Warning Banners

### Dashboard Banner (Landlord)

**Expiring Soon (7 days or less)**:
```jsx
<div className="bg-yellow-50 border-yellow-200">
  <Clock /> Subscription Expiring Soon
  Your subscription expires in 5 days. Renew now to avoid interruption.
  [Renew Now]
</div>
```

**Expired**:
```jsx
<div className="bg-red-50 border-red-200">
  <AlertOctagon /> Subscription Expired
  Some features are restricted. Your tenants cannot make payments.
  [Renew Now]
</div>
```

## Renewal Flow

1. User clicks "Renew Now" button
2. Redirected to `/admin/subscription`
3. Selects subscription plan
4. Redirected to `/admin/subscription/payment`
5. Enters phone number and completes M-Pesa payment
6. Backend receives callback
7. Subscription updated in database
8. Cache cleared automatically
9. User can access features again

## Technical Details

### Subscription Check Logic

```javascript
// Frontend (useSubscription hook)
const expiryDate = new Date(subscription.expiry_date);
const today = new Date();
const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

const isExpired = diffDays <= 0;
const isActive = subscription.is_active && diffDays > 0;
```

```python
# Backend (Subscription model)
def is_active(self):
    return timezone.now() < self.expiry_date
```

### Cache Management

**Cache Keys**:
- `subscription_status:{user_id}` - Subscription active status

**Cache Duration**: 5 minutes (300 seconds)

**Cache Invalidation**:
- Automatically after payment callback
- After subscription update
- After cache timeout

### Database Schema

```python
class Subscription(models.Model):
    user = OneToOneField(CustomUser)
    plan = CharField(max_length=20)  # starter, basic, professional, onetime
    expiry_date = DateTimeField()
    
    def is_active(self):
        return timezone.now() < self.expiry_date
```

## Features Disabled When Expired

### Landlord Features
- ❌ View payment history
- ❌ Track rent collections
- ❌ Manage tenants (add/edit/remove)
- ❌ Add/edit properties
- ❌ Add/edit units
- ❌ View reports
- ❌ Send bulk emails/SMS
- ❌ Export data

### Tenant Features
- ❌ Make rent payments via M-Pesa
- ❌ View payment history (if landlord expired)

### Always Available
- ✅ View dashboard (with warnings)
- ✅ Access settings
- ✅ Manage subscription
- ✅ Contact support
- ✅ View profile

## Testing Scenarios

### 1. Test Active Subscription
```
Given: Landlord has active subscription (30 days remaining)
When: Landlord accesses any feature
Then: Full access granted, no warnings shown
```

### 2. Test Expiring Soon
```
Given: Landlord subscription expires in 5 days
When: Landlord logs in
Then: Yellow warning banner appears
And: Warning modal shows once per session
And: Full functionality still available
```

### 3. Test Expired Subscription
```
Given: Landlord subscription expired yesterday
When: Landlord tries to access payments
Then: Blocked screen appears
And: Must renew to continue
And: Cannot dismiss modal
```

### 4. Test Tenant with Expired Landlord
```
Given: Tenant's landlord has expired subscription
When: Tenant tries to make payment
Then: Payment blocked
And: Message shows landlord subscription expired
```

### 5. Test Renewal
```
Given: Landlord with expired subscription
When: Landlord completes subscription payment
Then: Subscription updated immediately
And: Cache cleared
And: Full access restored
```

## Error Handling

### Subscription Check Fails
- Default to allowing access (fail open)
- Log error for investigation
- User can still access features

### API Unreachable
- Use cached subscription status
- Show warning if cache expired
- Allow temporary access

### Payment Callback Delayed
- Subscription remains expired until callback processed
- User can check status manually
- Polling checks for updates

## Monitoring & Alerts

### Metrics to Track
1. Number of expired subscriptions
2. Number of expiring soon (7 days)
3. Renewal conversion rate
4. Time to renewal after expiry
5. Failed payment attempts

### Recommended Alerts
- Alert when subscription < 7 days
- Email reminder at 7, 3, 1 days before expiry
- SMS reminder on expiry day
- Daily report of expired subscriptions

## Future Enhancements

1. **Grace Period**: 3-day grace period after expiry
2. **Auto-Renewal**: Automatic subscription renewal
3. **Proration**: Pro-rated upgrades/downgrades
4. **Email Notifications**: Automated expiry reminders
5. **SMS Reminders**: SMS alerts for upcoming expiry
6. **Payment Retries**: Automatic retry for failed payments
7. **Subscription History**: View past subscriptions
8. **Usage Analytics**: Show feature usage stats

---

**Implementation Complete!** ✅

The subscription enforcement system is now fully functional with comprehensive checks on both frontend and backend, ensuring landlords maintain active subscriptions and protecting tenant payment functionality.
