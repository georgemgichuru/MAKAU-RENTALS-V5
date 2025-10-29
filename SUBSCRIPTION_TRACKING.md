# Subscription Tracking and Enforcement System

## Overview

This comprehensive system tracks property and unit creation, enforces subscription limits, prevents landlords from exceeding their plan limits, and sends automated email notifications for subscription management.

## Table of Contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [Subscription Plans](#subscription-plans)
4. [Components](#components)
5. [API Endpoints](#api-endpoints)
6. [Email Notifications](#email-notifications)
7. [Scheduled Tasks](#scheduled-tasks)
8. [Testing Guide](#testing-guide)
9. [Frontend Integration](#frontend-integration)

---

## Features

### ✅ Automatic Tracking
- **Property Creation Tracking**: Every property created is logged with timestamp, landlord, and subscription plan
- **Unit Creation Tracking**: Every unit created is tracked with complete context
- **Historical Record**: Full audit trail of all property/unit additions
- **Snapshot Metrics**: Records total properties and units after each action

### ✅ Subscription Limit Enforcement
- **Hard Limits**: Prevents creation of properties/units beyond subscription limits
- **Soft Warnings**: Sends notifications when approaching limits (80% threshold)
- **Dynamic Checking**: Real-time verification before allowing creation
- **Plan-Specific Rules**: Different limits for each subscription tier

### ✅ Email Notifications
- **Limit Reached**: Immediate notification when landlord hits their limit
- **Approaching Limit**: Warning emails when nearing capacity
- **Expiry Reminders**: Automated reminders at 7, 3, and 1 day(s) before expiry
- **Expired Notification**: Alert when subscription has expired
- **Upgrade Suggestions**: Recommends appropriate plan based on usage

### ✅ Intelligent Plan Suggestions
- **Usage-Based Recommendations**: Suggests plans that fit current usage
- **Upgrade Paths**: Clear guidance on which plan to choose
- **Cost Transparency**: Shows pricing for all plans
- **Capacity Planning**: Helps landlords plan for growth

---

## Architecture

### Data Flow

```
┌─────────────────────────────────────────────────────────┐
│  Landlord Creates Property/Unit                         │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  1. Check Subscription Status (is_active?)              │
│  2. Verify Current Limits (check_subscription_limits)   │
│  3. Count Current Properties/Units                      │
└────────────────┬────────────────────────────────────────┘
                 │
         ┌───────┴────────┐
         │                │
         ▼                ▼
    ✅ CAN CREATE    ❌ LIMIT REACHED
         │                │
         │                ├─► Send "Limit Reached" Email
         │                └─► Return 403 Error with Suggestion
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│  Create Property/Unit                                    │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  Track Creation (PropertyUnitTracker.track_*)           │
│  - Record timestamp                                      │
│  - Store subscription plan                               │
│  - Count total properties/units                          │
│  - Mark if limit reached                                 │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  Check if Approaching Limit (≥80% or within 1)          │
└────────────────┬────────────────────────────────────────┘
                 │
         ┌───────┴────────┐
         │                │
         ▼                ▼
    YES - Send         NO - Continue
    Warning Email      Normally
```

---

## Subscription Plans

### Plan Limits Matrix

| Plan          | Properties | Units | Duration | Price (KES) | Description                    |
|---------------|-----------|-------|----------|-------------|--------------------------------|
| **Free**      | 2         | 10    | 60 days  | 0           | Free Trial (60 days)          |
| **Starter**   | 3         | 10    | 30 days  | 500         | Up to 10 units                |
| **Basic**     | 10        | 50    | 30 days  | 2,000       | 10-50 units                   |
| **Professional** | 25     | 100   | 30 days  | 5,000       | 50-100 units                  |
| **One-time**  | Unlimited | Unlimited | Lifetime | 50,000  | Unlimited properties & units  |

### Plan Features

#### Free Trial (60 Days)
- Perfect for getting started
- 2 properties, 10 units
- Full feature access
- No credit card required
- Auto-expires after 60 days

#### Starter Plan (KES 500/month)
- Small property managers
- 3 properties, up to 10 units
- Monthly billing
- Email notifications
- Payment tracking

#### Basic Plan (KES 2,000/month)
- Growing property portfolios
- Up to 10 properties, 50 units
- Advanced reporting
- Bulk operations
- Priority support

#### Professional Plan (KES 5,000/month)
- Large property management
- Up to 25 properties, 100 units
- All premium features
- API access
- Dedicated support

#### One-time Plan (KES 50,000)
- Unlimited properties and units
- Lifetime access
- All features unlocked
- No recurring fees
- Enterprise support

---

## Components

### 1. PropertyUnitTracker Model

**Location**: `accounts/models.py`

**Purpose**: Track every property and unit creation/deletion event

**Fields**:
- `landlord` - ForeignKey to CustomUser (landlord)
- `action` - Type of action (property_created, unit_created, etc.)
- `property` - ForeignKey to Property (nullable)
- `unit` - ForeignKey to Unit (nullable)
- `subscription_plan` - Plan at time of action
- `total_properties_after` - Count after action
- `total_units_after` - Count after action
- `upgrade_notification_sent` - Boolean flag
- `limit_reached` - Boolean flag
- `created_at` - Timestamp
- `notes` - Optional notes

**Methods**:
```python
# Track property creation
PropertyUnitTracker.track_property_creation(landlord, property_obj)

# Track unit creation
PropertyUnitTracker.track_unit_creation(landlord, unit)
```

### 2. Subscription Utilities

**Location**: `accounts/subscription_utils.py`

**Key Functions**:

#### `check_subscription_limits(landlord, action_type)`
Checks if landlord can create more properties or units.

**Returns**:
```python
{
    'can_create': bool,
    'current_count': int,
    'limit': int or None,
    'message': str,
    'upgrade_needed': bool,
    'suggested_plan': str or None
}
```

#### `suggest_plan_upgrade(current_properties, current_units)`
Suggests the most appropriate plan based on usage.

**Returns**:
```python
{
    'suggested_plan': str,
    'reason': str,
    'limits': dict,
    'can_accommodate': bool
}
```

#### Email Notification Functions
- `send_limit_reached_email(landlord, limit_type, current_plan, suggested_plan)`
- `send_approaching_limit_email(landlord, limit_type, current_count, limit, current_plan)`
- `send_subscription_expiry_reminder(landlord, days_until_expiry)`
- `send_subscription_expired_email(landlord)`

### 3. Enhanced Views

#### CreatePropertyView
**Location**: `accounts/views.py`

**Enhanced Features**:
1. Checks subscription status and expiry
2. Verifies property limit before creation
3. Tracks creation in PropertyUnitTracker
4. Sends email if limit reached
5. Sends warning if approaching limit (within 1 of limit)
6. Returns detailed response with tracking info

**Response on Limit Reached**:
```json
{
    "error": "You have reached your plan limit...",
    "current_count": 3,
    "limit": 3,
    "upgrade_needed": true,
    "suggested_plan": "basic",
    "action_required": "upgrade_subscription",
    "redirect_to": "/admin/subscription"
}
```

**Response on Success**:
```json
{
    "id": 5,
    "name": "Sunset Apartments",
    "tracking": {
        "total_properties": 3,
        "limit": 3,
        "approaching_limit": true,
        "limit_reached": true
    }
}
```

#### CreateUnitView
**Location**: `accounts/views.py`

**Enhanced Features**:
1. Checks unit limit before creation
2. Tracks unit creation
3. Sends notifications for limits
4. Returns tracking information

---

## API Endpoints

### 1. Subscription Suggestion API

**Endpoint**: `GET /api/subscription/suggestion/`

**Authentication**: Required (Landlord only)

**Description**: Get personalized subscription plan suggestions based on current usage

**Response**:
```json
{
    "current_usage": {
        "properties": 3,
        "units": 15
    },
    "current_subscription": {
        "plan": "starter",
        "is_active": true,
        "expiry_date": "2025-11-28T12:00:00Z",
        "properties_limit": 3,
        "units_limit": 10,
        "price": 500
    },
    "status": {
        "can_create_property": false,
        "properties_remaining": 0,
        "can_create_unit": false,
        "units_remaining": 0
    },
    "suggested_plan": {
        "plan": "basic",
        "reason": "Your current usage (3 properties, 15 units) fits within this plan",
        "limits": {
            "properties": 10,
            "units": 50,
            "price": 2000,
            "duration_days": 30
        }
    },
    "all_plans": [
        {
            "plan": "starter",
            "description": "Starter Plan (Up to 10 units)",
            "properties_limit": 3,
            "units_limit": 10,
            "price": 500,
            "duration_days": 30,
            "can_accommodate": false,
            "is_current": true
        },
        {
            "plan": "basic",
            "description": "Basic Plan (10-50 units)",
            "properties_limit": 10,
            "units_limit": 50,
            "price": 2000,
            "duration_days": 30,
            "can_accommodate": true,
            "is_current": false
        }
    ]
}
```

### 2. Subscription Tracking History API

**Endpoint**: `GET /api/subscription/tracking/`

**Authentication**: Required (Landlord only)

**Query Parameters**:
- `limit` - Number of records to return (default: 50)
- `action_type` - Filter by action type (optional)

**Description**: Get history of property/unit creation events

**Response**:
```json
{
    "count": 10,
    "results": [
        {
            "id": 42,
            "action": "unit_created",
            "subscription_plan": "starter",
            "total_properties_after": 3,
            "total_units_after": 10,
            "limit_reached": true,
            "upgrade_notification_sent": true,
            "created_at": "2025-10-29T10:30:00Z",
            "property_name": "Sunset Apartments",
            "unit_number": "101",
            "notes": null
        }
    ]
}
```

---

## Email Notifications

### 1. Limit Reached Email

**Triggered**: When landlord tries to create property/unit beyond limit

**Subject**: 🚨 Subscription Limit Reached - Upgrade Required

**Content**:
- Current plan limits
- Attempted action (property/unit)
- Recommended upgrade plan
- Upgrade instructions
- Pricing information

**Example**:
```
Dear John Doe,

You have reached the limit of your current subscription plan (STARTER).

Current Plan Limits:
- Properties: 3
- Units: 10
- Monthly Price: KES 500

You attempted to create a new unit, but your current plan does not allow this.

RECOMMENDED ACTION:
We recommend upgrading to the BASIC plan:
- Properties: 10
- Units: 50
- Monthly Price: KES 2,000

To upgrade your subscription:
1. Log in to your dashboard
2. Navigate to Settings > Subscription
3. Select the BASIC plan
4. Complete the payment via M-Pesa
```

### 2. Approaching Limit Email

**Triggered**: When landlord creates property/unit and is within 1 of limit (or ≥80%)

**Subject**: ⚠️ Approaching Subscription Limit - X Property(s)/Unit(s) Remaining

**Content**:
- Current usage vs limit
- Remaining capacity
- Plan details
- Upgrade suggestions
- Proactive planning advice

### 3. Subscription Expiry Reminders

**Triggered**: Daily at 7, 3, and 1 day(s) before expiry, and on expiry day

**Subjects**:
- 7 days: 📅 Reminder: Subscription Renewal Required
- 3 days: ⚠️ Important: Subscription expires in 3 days!
- 1 day: ⚠️ URGENT: Subscription expires TOMORROW!
- 0 days: 🚨 URGENT: Your subscription has EXPIRED

**Content**:
- Days remaining
- Expiry date
- Impact of expiry (features disabled)
- Renewal instructions
- Pricing reminder

### 4. Subscription Expired Email

**Triggered**: Daily for expired subscriptions

**Subject**: 🚨 URGENT: Your Subscription Has Expired

**Content**:
- Expiry date
- Disabled features list
- Impact on tenants (cannot make payments!)
- Renewal urgency
- Support contact

---

## Scheduled Tasks

### 1. Subscription Expiry Check Task

**Function**: `check_subscription_expiry_task()`

**Location**: `app/tasks.py`

**Schedule**: Daily (recommended: 9:00 AM)

**Purpose**: Send expiry reminders and expired notifications

**Celery Configuration**:
```python
from celery.schedules import crontab

app.conf.beat_schedule = {
    'check-subscription-expiry': {
        'task': 'app.tasks.check_subscription_expiry_task',
        'schedule': crontab(hour=9, minute=0),  # Daily at 9 AM
    },
}
```

### 2. Notify Landlords Approaching Limits

**Function**: `notify_landlords_approaching_limits_task()`

**Location**: `app/tasks.py`

**Schedule**: Weekly (recommended: Monday 10:00 AM)

**Purpose**: Proactive notifications for landlords at 80% capacity

**Celery Configuration**:
```python
'notify-approaching-limits': {
    'task': 'app.tasks.notify_landlords_approaching_limits_task',
    'schedule': crontab(day_of_week=1, hour=10, minute=0),  # Monday at 10 AM
},
```

---

## Testing Guide

### Test Scenario 1: Property Creation Within Limits

**Setup**:
- Landlord on Starter plan (limit: 3 properties)
- Current: 1 property

**Steps**:
1. Create property via API
2. Check response for success
3. Verify tracking record created
4. Check no limit email sent

**Expected**:
- ✅ Property created successfully
- ✅ Tracking record shows 2 total properties
- ✅ `limit_reached` = False
- ✅ `upgrade_notification_sent` = False

### Test Scenario 2: Property Creation at Limit

**Setup**:
- Landlord on Starter plan (limit: 3 properties)
- Current: 2 properties

**Steps**:
1. Create property via API
2. Check response for success
3. Check email inbox

**Expected**:
- ✅ Property created successfully
- ✅ Tracking shows 3 properties, `limit_reached` = True
- ✅ "Approaching Limit" email received
- ✅ `upgrade_notification_sent` = True

### Test Scenario 3: Property Creation Beyond Limit

**Setup**:
- Landlord on Starter plan (limit: 3 properties)
- Current: 3 properties

**Steps**:
1. Try to create property via API
2. Check response error

**Expected**:
- ❌ 403 Forbidden response
- ❌ Error: "You have reached your plan limit..."
- ✅ "Limit Reached" email sent
- ✅ Suggested upgrade to "basic" plan
- ❌ No property created

### Test Scenario 4: Unit Creation Beyond Limit

**Setup**:
- Landlord on Starter plan (limit: 10 units)
- Current: 10 units

**Steps**:
1. Try to create unit via API
2. Check response

**Expected**:
- ❌ 403 Forbidden response
- ✅ Suggests upgrade to "basic" plan
- ✅ Email notification sent

### Test Scenario 5: Subscription Expiry Reminders

**Setup**:
- Create subscription expiring in 7 days
- Run Celery task manually

**Steps**:
```bash
cd "Makau Rentals/app"
python manage.py shell

from app.tasks import check_subscription_expiry_task
result = check_subscription_expiry_task()
print(result)
```

**Expected**:
- ✅ Email sent to landlord
- ✅ Subject: "📅 Reminder: Subscription Renewal Required"
- ✅ Contains expiry date and renewal instructions

### Test Scenario 6: Subscription Suggestion API

**Setup**:
- Landlord with 5 properties, 25 units

**Steps**:
1. Call `GET /api/subscription/suggestion/`
2. Check suggested plan

**Expected**:
```json
{
    "suggested_plan": {
        "plan": "basic",
        "reason": "Your current usage (5 properties, 25 units) fits within this plan"
    }
}
```

### Test Scenario 7: Tracking History API

**Steps**:
1. Create 3 properties
2. Create 5 units
3. Call `GET /api/subscription/tracking/?limit=10`

**Expected**:
- ✅ Returns 8 tracking records
- ✅ Shows chronological history
- ✅ Includes property names and unit numbers

---

## Frontend Integration

### 1. Check Before Creating Property

```javascript
// Before showing "Create Property" form
const checkCanCreateProperty = async () => {
    const response = await fetch('/api/subscription/suggestion/', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    
    const data = await response.json();
    
    if (!data.status.can_create_property) {
        showUpgradeModal({
            message: `You've reached your limit of ${data.current_subscription.properties_limit} properties`,
            suggestedPlan: data.suggested_plan,
            currentPlan: data.current_subscription.plan
        });
        return false;
    }
    
    return true;
};
```

### 2. Handle Limit Reached Response

```javascript
const createProperty = async (propertyData) => {
    try {
        const response = await fetch('/api/properties/create/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(propertyData)
        });
        
        if (response.status === 403) {
            const error = await response.json();
            
            if (error.action_required === 'upgrade_subscription') {
                // Show upgrade modal
                showUpgradeModal({
                    message: error.error,
                    suggestedPlan: error.suggested_plan,
                    redirectTo: error.redirect_to
                });
            } else if (error.action_required === 'renew_subscription') {
                // Show renewal modal
                showRenewalModal();
            }
            
            return null;
        }
        
        const data = await response.json();
        
        // Check if approaching limit
        if (data.tracking?.approaching_limit) {
            showWarningToast(
                `You have ${data.tracking.limit - data.tracking.total_properties} properties remaining in your plan`
            );
        }
        
        return data;
    } catch (error) {
        console.error('Error creating property:', error);
        return null;
    }
};
```

### 3. Display Subscription Status

```javascript
const SubscriptionStatus = () => {
    const [suggestion, setSuggestion] = useState(null);
    
    useEffect(() => {
        fetchSuggestion();
    }, []);
    
    const fetchSuggestion = async () => {
        const response = await fetch('/api/subscription/suggestion/');
        const data = await response.json();
        setSuggestion(data);
    };
    
    if (!suggestion) return <Loading />;
    
    return (
        <div className="subscription-status">
            <h3>Subscription Status</h3>
            
            <div className="current-plan">
                <p>Plan: {suggestion.current_subscription.plan.toUpperCase()}</p>
                <p>Expires: {new Date(suggestion.current_subscription.expiry_date).toLocaleDateString()}</p>
            </div>
            
            <div className="usage">
                <ProgressBar 
                    label="Properties"
                    current={suggestion.current_usage.properties}
                    max={suggestion.current_subscription.properties_limit}
                />
                <ProgressBar 
                    label="Units"
                    current={suggestion.current_usage.units}
                    max={suggestion.current_subscription.units_limit}
                />
            </div>
            
            {suggestion.status.properties_remaining <= 1 && (
                <Alert type="warning">
                    You have {suggestion.status.properties_remaining} properties remaining.
                    Consider upgrading to {suggestion.suggested_plan.plan.toUpperCase()}.
                </Alert>
            )}
        </div>
    );
};
```

### 4. Upgrade Modal Component

```javascript
const UpgradeModal = ({ isOpen, onClose, suggestedPlan, currentPlan }) => {
    const navigate = useNavigate();
    
    const handleUpgrade = () => {
        navigate('/admin/subscription');
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="upgrade-modal">
                <h2>🚀 Upgrade Your Subscription</h2>
                
                <p className="message">
                    You've reached the limit of your {currentPlan.toUpperCase()} plan.
                </p>
                
                <div className="plan-comparison">
                    <div className="current">
                        <h3>Current Plan: {currentPlan}</h3>
                        <p>Properties: {PLAN_LIMITS[currentPlan].properties}</p>
                        <p>Units: {PLAN_LIMITS[currentPlan].units}</p>
                        <p>Price: KES {PLAN_LIMITS[currentPlan].price}</p>
                    </div>
                    
                    <div className="suggested">
                        <h3>Recommended: {suggestedPlan.plan}</h3>
                        <p>Properties: {suggestedPlan.limits.properties || 'Unlimited'}</p>
                        <p>Units: {suggestedPlan.limits.units || 'Unlimited'}</p>
                        <p>Price: KES {suggestedPlan.limits.price}</p>
                        <span className="badge">✨ Best Value</span>
                    </div>
                </div>
                
                <div className="actions">
                    <button onClick={handleUpgrade} className="btn-primary">
                        Upgrade Now
                    </button>
                    <button onClick={onClose} className="btn-secondary">
                        Maybe Later
                    </button>
                </div>
            </div>
        </Modal>
    );
};
```

---

## Database Migration

### Run Migration

```bash
cd "Makau Rentals/app"
python manage.py migrate accounts
```

### Expected Output
```
Running migrations:
  Applying accounts.0008_add_property_unit_tracker... OK
```

### Verify Migration

```bash
python manage.py shell
```

```python
from accounts.models import PropertyUnitTracker
PropertyUnitTracker.objects.count()  # Should return 0
```

---

## Configuration

### Email Settings

Ensure your `settings.py` has email configured:

```python
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'your-email@gmail.com'
EMAIL_HOST_PASSWORD = 'your-app-password'
DEFAULT_FROM_EMAIL = 'Makau Rentals <your-email@gmail.com>'
```

### Celery Beat Schedule

Add to `celery.py` or `settings.py`:

```python
from celery.schedules import crontab

app.conf.beat_schedule = {
    # Check subscription expiry daily at 9 AM
    'check-subscription-expiry': {
        'task': 'app.tasks.check_subscription_expiry_task',
        'schedule': crontab(hour=9, minute=0),
    },
    
    # Check approaching limits weekly on Monday at 10 AM
    'notify-approaching-limits': {
        'task': 'app.tasks.notify_landlords_approaching_limits_task',
        'schedule': crontab(day_of_week=1, hour=10, minute=0),
    },
}
```

---

## Monitoring & Alerts

### Metrics to Track

1. **Subscription Expiry Rate**: % of landlords letting subscriptions expire
2. **Upgrade Conversion**: % of landlords who upgrade after hitting limits
3. **Email Open Rate**: % of limit/expiry emails opened
4. **Average Time to Upgrade**: Days between limit notification and upgrade
5. **Plan Distribution**: Number of landlords per plan

### Logging

All key events are logged:

```python
logger.info(f"Property limit reached for user {user.id}")
logger.info(f"Limit reached email sent to {landlord.email}")
logger.info(f"Expiry reminder ({days_until_expiry} days) sent to {landlord.email}")
```

Check logs:
```bash
tail -f logs/app.log | grep "subscription"
```

---

## Troubleshooting

### Issue: Emails Not Sending

**Check**:
1. Email configuration in `settings.py`
2. SMTP credentials are correct
3. `fail_silently=False` to see errors
4. Email service is not blocking

**Test**:
```python
from django.core.mail import send_mail
from django.conf import settings

send_mail(
    'Test Email',
    'This is a test',
    settings.EMAIL_HOST_USER,
    ['test@example.com'],
    fail_silently=False
)
```

### Issue: Limits Not Being Enforced

**Check**:
1. `HasActiveSubscription` permission in views
2. Subscription exists for landlord
3. Subscription `is_active()` returns correct value
4. Plan limits are correctly defined

**Debug**:
```python
from accounts.subscription_utils import check_subscription_limits
result = check_subscription_limits(landlord, 'property')
print(result)
```

### Issue: Tracking Not Recording

**Check**:
1. Migration ran successfully
2. PropertyUnitTracker imported in views
3. Tracking methods called after successful creation
4. Database permissions

**Verify**:
```python
from accounts.models import PropertyUnitTracker
PropertyUnitTracker.objects.all()
```

---

## Summary

This comprehensive system ensures:

✅ **Landlords cannot exceed their subscription limits**
- Hard enforcement prevents creation beyond limits
- Clear error messages explain why

✅ **Automated email notifications keep landlords informed**
- Limit reached alerts
- Approaching limit warnings
- Expiry reminders (7, 3, 1 day(s))
- Expired notifications

✅ **Complete audit trail of property/unit creation**
- Every action is tracked
- Historical data preserved
- Subscription plan at time of action recorded

✅ **Intelligent plan suggestions**
- Usage-based recommendations
- Clear upgrade paths
- Transparent pricing

✅ **Scheduled tasks handle automation**
- Daily expiry checks
- Weekly limit notifications
- No manual intervention needed

This system protects your business model while providing a great user experience for landlords who understand their limits and know exactly how to upgrade when needed.

---

## Next Steps

1. **Run the migration**: `python manage.py migrate accounts`
2. **Configure Celery Beat**: Set up scheduled tasks
3. **Test email settings**: Send test emails
4. **Update frontend**: Integrate new APIs
5. **Monitor metrics**: Track upgrade conversions
6. **Gather feedback**: Improve notification messages

For support or questions, contact the development team.

**Last Updated**: October 29, 2025
**Version**: 1.0.0
