# Subscription Tracking System - Quick Reference

## 🚀 Quick Start

### 1. Run Migration
```bash
cd "Makau Rentals/app"
python manage.py migrate accounts
```

### 2. Test Email Configuration
```python
python manage.py shell

from django.core.mail import send_mail
from django.conf import settings

send_mail(
    'Test Email',
    'Testing subscription notifications',
    settings.EMAIL_HOST_USER,
    ['your-test-email@gmail.com'],
    fail_silently=False
)
```

### 3. Setup Celery Beat (Optional - for automated reminders)
```python
# In celery.py or settings.py
from celery.schedules import crontab

app.conf.beat_schedule = {
    'check-subscription-expiry': {
        'task': 'app.tasks.check_subscription_expiry_task',
        'schedule': crontab(hour=9, minute=0),  # Daily at 9 AM
    },
    'notify-approaching-limits': {
        'task': 'app.tasks.notify_landlords_approaching_limits_task',
        'schedule': crontab(day_of_week=1, hour=10, minute=0),  # Monday 10 AM
    },
}
```

---

## 📋 What Was Implemented

### ✅ Backend Components

1. **PropertyUnitTracker Model** (`accounts/models.py`)
   - Tracks every property/unit creation
   - Records subscription plan at time of action
   - Stores totals and flags (limit_reached, notification_sent)

2. **Subscription Utilities** (`accounts/subscription_utils.py`)
   - `check_subscription_limits()` - Verify if can create property/unit
   - `suggest_plan_upgrade()` - Recommend appropriate plan
   - `send_limit_reached_email()` - Notify when limit hit
   - `send_approaching_limit_email()` - Warn when near limit
   - `send_subscription_expiry_reminder()` - Remind before expiry
   - `send_subscription_expired_email()` - Alert when expired

3. **Enhanced Views** (`accounts/views.py`)
   - `CreatePropertyView` - Now checks limits and tracks creation
   - `CreateUnitView` - Now checks limits and tracks creation
   - `SubscriptionSuggestionView` - New API for plan suggestions
   - `SubscriptionTrackingHistoryView` - New API for tracking history

4. **Celery Tasks** (`app/tasks.py`)
   - `check_subscription_expiry_task()` - Daily expiry reminders
   - `notify_landlords_approaching_limits_task()` - Weekly limit warnings

5. **URL Routes** (`accounts/urls.py`)
   - `/api/subscription/suggestion/` - Get plan suggestions
   - `/api/subscription/tracking/` - Get tracking history

---

## 🎯 How It Works

### Property/Unit Creation Flow

```
1. Landlord tries to create property/unit
   ↓
2. System checks subscription status
   ↓
3. System counts current properties/units
   ↓
4. If LIMIT REACHED:
   - ❌ Block creation (403 error)
   - 📧 Send "Limit Reached" email
   - 💡 Suggest upgrade plan
   ↓
5. If WITHIN LIMIT:
   - ✅ Create property/unit
   - 📝 Track in PropertyUnitTracker
   - If approaching limit (≥80% or within 1):
     - 📧 Send "Approaching Limit" warning
```

---

## 📧 Email Notifications

### Automatic Emails Sent

1. **Limit Reached** (Immediate)
   - When: Landlord tries to create beyond limit
   - Subject: "🚨 Subscription Limit Reached - Upgrade Required"
   - Content: Current plan, limits, suggested upgrade

2. **Approaching Limit** (Immediate)
   - When: Creates property/unit within 1 of limit
   - Subject: "⚠️ Approaching Subscription Limit"
   - Content: Usage stats, remaining capacity, upgrade info

3. **Expiry Reminders** (Scheduled Daily)
   - When: 7, 3, or 1 day(s) before expiry
   - Subject: "📅/⚠️ Reminder: Subscription Renewal Required"
   - Content: Days remaining, renewal instructions

4. **Expired Notice** (Scheduled Daily)
   - When: Subscription has expired
   - Subject: "🚨 URGENT: Your Subscription Has Expired"
   - Content: Disabled features, impact on tenants, renewal urgency

---

## 🔌 API Endpoints

### 1. Get Subscription Suggestions
```bash
GET /api/subscription/suggestion/
Authorization: Bearer {token}
```

**Response**:
```json
{
    "current_usage": {
        "properties": 3,
        "units": 15
    },
    "suggested_plan": {
        "plan": "basic",
        "reason": "Your current usage fits within this plan",
        "limits": {
            "properties": 10,
            "units": 50,
            "price": 2000
        }
    },
    "status": {
        "can_create_property": false,
        "properties_remaining": 0,
        "can_create_unit": false,
        "units_remaining": 0
    }
}
```

### 2. Get Tracking History
```bash
GET /api/subscription/tracking/?limit=20
Authorization: Bearer {token}
```

**Response**:
```json
{
    "count": 5,
    "results": [
        {
            "id": 1,
            "action": "property_created",
            "subscription_plan": "starter",
            "total_properties_after": 3,
            "total_units_after": 10,
            "limit_reached": true,
            "created_at": "2025-10-29T10:30:00Z"
        }
    ]
}
```

---

## 🧪 Testing

### Test Limit Enforcement

```python
python manage.py shell

from accounts.models import CustomUser, Property, Subscription
from accounts.subscription_utils import check_subscription_limits

# Get a landlord
landlord = CustomUser.objects.filter(user_type='landlord').first()

# Check property limit
result = check_subscription_limits(landlord, 'property')
print(result)
# Output:
# {
#     'can_create': False,
#     'current_count': 3,
#     'limit': 3,
#     'message': 'You have reached your plan limit...',
#     'upgrade_needed': True,
#     'suggested_plan': 'basic'
# }
```

### Test Email Sending

```python
from accounts.subscription_utils import send_limit_reached_email

landlord = CustomUser.objects.filter(user_type='landlord').first()
send_limit_reached_email(
    landlord=landlord,
    limit_type='property',
    current_plan='starter',
    suggested_plan='basic'
)
# Check email inbox for notification
```

### Test Tracking

```python
from accounts.models import Property, PropertyUnitTracker

landlord = CustomUser.objects.filter(user_type='landlord').first()
property_obj = Property.objects.filter(landlord=landlord).first()

# Track property creation
tracker = PropertyUnitTracker.track_property_creation(landlord, property_obj)
print(f"Tracked: {tracker.total_properties_after} properties, {tracker.total_units_after} units")
```

### Manual Celery Task Run

```python
from app.tasks import check_subscription_expiry_task

result = check_subscription_expiry_task()
print(result)
# Output: "Sent 2 expiry reminders and 1 expired notifications"
```

---

## 📊 Subscription Plan Limits

| Plan | Properties | Units | Price | Duration |
|------|-----------|-------|-------|----------|
| Free | 2 | 10 | KES 0 | 60 days |
| Starter | 3 | 10 | KES 500 | 30 days |
| Basic | 10 | 50 | KES 2,000 | 30 days |
| Professional | 25 | 100 | KES 5,000 | 30 days |
| One-time | ∞ | ∞ | KES 50,000 | Lifetime |

---

## 🎨 Frontend Integration Examples

### Check Before Creating

```javascript
// Check if can create property
const canCreate = async () => {
    const res = await fetch('/api/subscription/suggestion/');
    const data = await res.json();
    
    if (!data.status.can_create_property) {
        alert(`You've reached your limit. Upgrade to ${data.suggested_plan.plan}`);
        return false;
    }
    return true;
};
```

### Handle 403 Response

```javascript
const createProperty = async (propertyData) => {
    const res = await fetch('/api/properties/create/', {
        method: 'POST',
        body: JSON.stringify(propertyData)
    });
    
    if (res.status === 403) {
        const error = await res.json();
        
        if (error.action_required === 'upgrade_subscription') {
            // Redirect to subscription page
            window.location.href = '/admin/subscription';
        }
    }
};
```

---

## 🔧 Configuration

### Email Settings (settings.py)
```python
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'your-email@gmail.com'
EMAIL_HOST_PASSWORD = 'your-app-password'
DEFAULT_FROM_EMAIL = 'Makau Rentals <your-email@gmail.com>'
```

### Celery Configuration
```python
# celery.py
from celery import Celery
from celery.schedules import crontab

app = Celery('app')
app.config_from_object('django.conf:settings', namespace='CELERY')

app.conf.beat_schedule = {
    'check-subscription-expiry': {
        'task': 'app.tasks.check_subscription_expiry_task',
        'schedule': crontab(hour=9, minute=0),
    },
    'notify-approaching-limits': {
        'task': 'app.tasks.notify_landlords_approaching_limits_task',
        'schedule': crontab(day_of_week=1, hour=10, minute=0),
    },
}
```

---

## 📝 Common Commands

```bash
# Run migration
python manage.py migrate accounts

# Create superuser for testing
python manage.py createsuperuser

# Run Celery worker (in separate terminal)
celery -A app worker -l info

# Run Celery beat for scheduled tasks
celery -A app beat -l info

# Test sending email
python manage.py shell
>>> from django.core.mail import send_mail
>>> send_mail('Test', 'Test message', 'from@example.com', ['to@example.com'])

# Check tracking records
python manage.py shell
>>> from accounts.models import PropertyUnitTracker
>>> PropertyUnitTracker.objects.all()
```

---

## 🎯 Key Features Summary

✅ **Tracks** every property/unit creation with full context
✅ **Enforces** subscription limits (prevents creation beyond plan)
✅ **Notifies** landlords via email when limits reached
✅ **Warns** when approaching limits (proactive)
✅ **Reminds** about upcoming subscription expiry
✅ **Suggests** appropriate upgrade plans based on usage
✅ **Provides** APIs for subscription status and tracking history
✅ **Automates** expiry reminders and limit warnings (Celery)

---

## 🐛 Troubleshooting

### Emails not sending?
1. Check `settings.py` email configuration
2. Verify SMTP credentials
3. Check spam folder
4. Test with `send_mail()` in shell

### Limits not being enforced?
1. Verify subscription exists for landlord
2. Check `subscription.is_active()` returns True
3. Ensure views have `HasActiveSubscription` permission

### Tracking not recording?
1. Run migration: `python manage.py migrate accounts`
2. Check imports in views
3. Verify tracking methods are called

### Celery tasks not running?
1. Start Celery worker: `celery -A app worker -l info`
2. Start Celery beat: `celery -A app beat -l info`
3. Check beat schedule configuration

---

## 📚 Documentation

Full documentation: `SUBSCRIPTION_TRACKING.md`

**Files Modified**:
- `accounts/models.py` - Added PropertyUnitTracker model
- `accounts/subscription_utils.py` - NEW file with utilities
- `accounts/views.py` - Enhanced CreatePropertyView, CreateUnitView, added new APIs
- `accounts/urls.py` - Added new endpoints
- `app/tasks.py` - Added expiry and limit check tasks
- `accounts/migrations/0008_add_property_unit_tracker.py` - NEW migration

**Ready to Use!** 🚀

All features are implemented and ready for testing. Run the migration and start using the system!
