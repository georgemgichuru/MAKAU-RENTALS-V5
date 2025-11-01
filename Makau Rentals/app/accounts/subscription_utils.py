# accounts/subscription_utils.py
"""
Utilities for subscription management, tracking, and notifications
"""
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from django.core.cache import cache
from datetime import timedelta
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)

# Plan limits configuration
PLAN_LIMITS = {
    "free": {
        "properties": 2,
        "units": 10,
        "duration_days": 30,
        "price": 0,
        "description": "Free Trial (30 days)"
    },
    "starter": {
        "properties": 3,
        "units": 10,
        "duration_days": 30,
        "price": 500,
        "description": "Starter Plan (Up to 10 units)"
    },
    "basic": {
        "properties": 10,
        "units": 50,
        "duration_days": 30,
        "price": 2000,
        "description": "Basic Plan (10-50 units)"
    },
    "professional": {
        "properties": 25,
        "units": 100,
        "duration_days": 30,
        "price": 5000,
        "description": "Professional Plan (50-100 units)"
    },
    "lifetime": {
        "properties": None,  # Unlimited properties
        "units": 50,        # Strictly 50 units only
        "duration_days": None,  # Lifetime
        "price": 40000,
        "description": "Lifetime Plan (Up to 50 units only)"
    }
}


def get_plan_limits(plan_name):
    """Get limits for a given plan"""
    return PLAN_LIMITS.get(plan_name.lower(), {})


def suggest_plan_upgrade(current_properties, current_units):
    """
    Suggest the most appropriate subscription plan based on current usage
    
    Returns:
        dict: {
            'suggested_plan': str,
            'reason': str,
            'current_limits': dict,
            'new_limits': dict
        }
    """
    # Sort plans by unit capacity (excluding lifetime for now)
    sorted_plans = [
        ('starter', PLAN_LIMITS['starter']),
        ('basic', PLAN_LIMITS['basic']),
        ('professional', PLAN_LIMITS['professional']),
    ]
    for plan_name, limits in sorted_plans:
        if (current_properties <= limits['properties'] and 
            current_units <= limits['units']):
            return {
                'suggested_plan': plan_name,
                'reason': f'Your current usage ({current_properties} properties, {current_units} units) fits within this plan',
                'limits': limits,
                'can_accommodate': True
            }
    # If no plan fits, suggest lifetime
    return {
        'suggested_plan': 'lifetime',
        'reason': f'You have {current_properties} properties and {current_units} units, which exceeds all monthly plans',
        'limits': PLAN_LIMITS['lifetime'],
        'can_accommodate': True
    }


def check_subscription_limits(landlord, action_type='property'):
    """
    Check if landlord can create more properties or units
    
    Args:
        landlord: CustomUser instance (landlord)
        action_type: 'property' or 'unit'
    
    Returns:
        dict: {
            'can_create': bool,
            'current_count': int,
            'limit': int or None,
            'message': str,
            'upgrade_needed': bool,
            'suggested_plan': str or None
        }
    """
    from accounts.models import Property, Unit, Subscription
    
    try:
        subscription = Subscription.objects.get(user=landlord)
    except Subscription.DoesNotExist:
        return {
            'can_create': False,
            'current_count': 0,
            'limit': 0,
            'message': 'No subscription found. Please subscribe to continue.',
            'upgrade_needed': True,
            'suggested_plan': 'starter'
        }
    
    # Check if subscription is active
    if not subscription.is_active():
        return {
            'can_create': False,
            'current_count': 0,
            'limit': 0,
            'message': 'Your subscription has expired. Please renew to continue.',
            'upgrade_needed': True,
            'suggested_plan': subscription.plan
        }
    
    plan_limits = get_plan_limits(subscription.plan)
    
    if action_type == 'property':
        current_count = Property.objects.filter(landlord=landlord).count()
        limit = plan_limits.get('properties')
        limit_type = 'properties'
    else:  # unit
        current_count = Unit.objects.filter(property_obj__landlord=landlord).count()
        limit = plan_limits.get('units')
        limit_type = 'units'
    
    # Unlimited (lifetime plan with unlimited properties, but units capped at 50)
    if subscription.plan == 'lifetime' and limit is None:
        return {
            'can_create': True,
            'current_count': current_count,
            'limit': None,
            'message': 'You have unlimited access to properties, but units are capped at 50.',
            'upgrade_needed': False,
            'suggested_plan': None
        }
    
    # Check if limit reached
    if current_count >= limit:
        suggestion = suggest_plan_upgrade(
            Property.objects.filter(landlord=landlord).count(),
            Unit.objects.filter(property_obj__landlord=landlord).count()
        )
        
        # For free trial, allow creation but notify about tier change
        if subscription.plan == 'free':
            return {
                'can_create': True,
                'current_count': current_count,
                'limit': limit,
                'message': f'Creating this {limit_type[:-1]} will change your subscription tier.',
                'upgrade_needed': True,
                'suggested_plan': suggestion['suggested_plan'],
                'is_free_trial': True,
                'tier_change_warning': True
            }
        
        return {
            'can_create': False,
            'current_count': current_count,
            'limit': limit,
            'message': f'You have reached your plan limit of {limit} {limit_type}. Please upgrade your subscription.',
            'upgrade_needed': True,
            'suggested_plan': suggestion['suggested_plan']
        }
    
    # Check if approaching limit (within 1 of limit)
    approaching_limit = (current_count >= limit - 1)
    
    return {
        'can_create': True,
        'current_count': current_count,
        'limit': limit,
        'message': f'You can create {limit - current_count} more {limit_type}' if not approaching_limit else f'Warning: You are approaching your limit of {limit} {limit_type}',
        'upgrade_needed': approaching_limit,
        'suggested_plan': None
    }


def send_limit_reached_email(landlord, limit_type='property', current_plan=None, suggested_plan=None):
    """
    Send email to landlord when they reach subscription limits
    Rate limited to prevent sending duplicate emails within 1 hour.
    
    Args:
        landlord: CustomUser instance
        limit_type: 'property' or 'unit'
        current_plan: Current subscription plan name
        suggested_plan: Suggested plan to upgrade to
    """
    # Check if we've recently sent a limit reached email to this landlord
    cache_key = f"limit_email_sent:{landlord.id}:{limit_type}"
    last_sent = cache.get(cache_key)
    
    if last_sent:
        logger.info(f"Skipping limit reached email to {landlord.email} - already sent within the last hour")
        return False
    
    subject = f'🚨 Subscription Limit Reached - Upgrade Required'
    
    plan_info = get_plan_limits(suggested_plan) if suggested_plan else {}
    current_info = get_plan_limits(current_plan) if current_plan else {}
    
    message = f"""
Dear {landlord.full_name},

You have reached the limit of your current subscription plan ({current_plan.upper() if current_plan else 'UNKNOWN'}).

Current Plan Limits:
- Properties: {current_info.get('properties', 'N/A')}
- Units: {current_info.get('units', 'N/A')}
- Monthly Price: KES {current_info.get('price', 0)}

You attempted to create a new {limit_type}, but your current plan does not allow this.

RECOMMENDED ACTION:
We recommend upgrading to the {suggested_plan.upper()} plan:
- Properties: {plan_info.get('properties', 'Unlimited')}
- Units: {plan_info.get('units', 'Unlimited')}
- Monthly Price: KES {plan_info.get('price', 0)}

To upgrade your subscription:
1. Log in to your dashboard
2. Navigate to Settings > Subscription
3. Select the {suggested_plan.upper()} plan
4. Complete the payment via M-Pesa

If you need assistance, please contact our support team.

Best regards,
Makau Rentals Team

---
This is an automated notification. Please do not reply to this email.
"""
    
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[landlord.email],
            fail_silently=False,
        )
        # Set cache to prevent duplicate emails for 1 hour
        cache.set(cache_key, True, 3600)  # 3600 seconds = 1 hour
        logger.info(f"Limit reached email sent to {landlord.email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send limit reached email to {landlord.email}: {str(e)}")
        return False


def send_approaching_limit_email(landlord, limit_type='property', current_count=0, limit=0, current_plan=None):
    """
    Send email to landlord when they are approaching subscription limits
    """
    remaining = limit - current_count
    
    subject = f'⚠️ Approaching Subscription Limit - {remaining} {limit_type.capitalize()}(s) Remaining'
    
    plan_info = get_plan_limits(current_plan) if current_plan else {}
    
    message = f"""
Dear {landlord.full_name},

This is a friendly reminder that you are approaching the limit of your current subscription plan.

Current Usage:
- {limit_type.capitalize()}s: {current_count} of {limit}
- Remaining: {remaining} {limit_type}(s)

Your Plan: {current_plan.upper() if current_plan else 'UNKNOWN'}
- Properties Limit: {plan_info.get('properties', 'N/A')}
- Units Limit: {plan_info.get('units', 'N/A')}
- Monthly Price: KES {plan_info.get('price', 0)}

WHAT THIS MEANS:
Once you reach the limit, you will not be able to create additional {limit_type}s without upgrading your subscription.

PLAN AHEAD:
If you anticipate needing more {limit_type}s, consider upgrading your plan now to avoid any interruption to your business.

To upgrade:
1. Log in to your dashboard
2. Go to Settings > Subscription
3. Choose a higher-tier plan
4. Complete the payment

Need help choosing the right plan? Contact our support team.

Best regards,
Makau Rentals Team

---
This is an automated notification.
"""
    
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[landlord.email],
            fail_silently=False,
        )
        logger.info(f"Approaching limit email sent to {landlord.email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send approaching limit email to {landlord.email}: {str(e)}")
        return False


def send_subscription_expiry_reminder(landlord, days_until_expiry):
    """
    Send reminder email about upcoming subscription expiry
    
    Args:
        landlord: CustomUser instance
        days_until_expiry: Number of days until expiry
    """
    from accounts.models import Subscription
    
    try:
        subscription = Subscription.objects.get(user=landlord)
    except Subscription.DoesNotExist:
        logger.warning(f"No subscription found for landlord {landlord.id}")
        return False
    
    if days_until_expiry <= 0:
        urgency = '🚨 URGENT'
        urgency_message = 'Your subscription has EXPIRED or will expire TODAY!'
    elif days_until_expiry == 1:
        urgency = '⚠️ URGENT'
        urgency_message = 'Your subscription expires TOMORROW!'
    elif days_until_expiry <= 3:
        urgency = '⚠️ Important'
        urgency_message = f'Your subscription expires in {days_until_expiry} days!'
    else:
        urgency = '📅 Reminder'
        urgency_message = f'Your subscription expires in {days_until_expiry} days.'
    
    subject = f'{urgency}: Subscription Renewal Required'
    
    plan_info = get_plan_limits(subscription.plan)
    expiry_date = subscription.expiry_date.strftime('%B %d, %Y at %I:%M %p') if subscription.expiry_date else 'Unknown'
    
    message = f"""
Dear {landlord.full_name},

{urgency_message}

SUBSCRIPTION DETAILS:
- Current Plan: {subscription.plan.upper()}
- Expiry Date: {expiry_date}
- Days Remaining: {days_until_expiry if days_until_expiry > 0 else 0}

WHAT HAPPENS WHEN YOUR SUBSCRIPTION EXPIRES:
❌ You will not be able to add new properties or units
❌ Your tenants will not be able to make rent payments
❌ You will lose access to payment tracking and reports
❌ You cannot manage tenant information

RENEW NOW TO AVOID INTERRUPTION:
1. Log in to your dashboard at [Your Dashboard URL]
2. Navigate to Settings > Subscription
3. Select your plan ({subscription.plan.upper()})
4. Complete payment via M-Pesa (KES {plan_info.get('price', 0)})

Your subscription will be automatically extended for another {plan_info.get('duration_days', 30)} days upon successful payment.

NEED TO UPGRADE?
If your business has grown, consider upgrading to a higher-tier plan:
- Basic Plan: Up to 50 units (KES 2,000/month)
- Professional Plan: Up to 100 units (KES 5,000/month)
- One-time Plan: Unlimited (KES 50,000 one-time)

Questions? Contact our support team.

Best regards,
Makau Rentals Team

---
This is an automated reminder. Please do not reply to this email.
"""
    
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[landlord.email],
            fail_silently=False,
        )
        logger.info(f"Expiry reminder ({days_until_expiry} days) sent to {landlord.email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send expiry reminder to {landlord.email}: {str(e)}")
        return False


def send_subscription_expired_email(landlord):
    """
    Send email when subscription has already expired
    """
    from accounts.models import Subscription
    
    try:
        subscription = Subscription.objects.get(user=landlord)
    except Subscription.DoesNotExist:
        return False
    
    subject = '🚨 URGENT: Your Subscription Has Expired'
    
    plan_info = get_plan_limits(subscription.plan)
    expiry_date = subscription.expiry_date.strftime('%B %d, %Y') if subscription.expiry_date else 'Unknown'
    
    message = f"""
Dear {landlord.full_name},

Your subscription has EXPIRED as of {expiry_date}.

IMMEDIATE ACTIONS REQUIRED:
Your account is now in a restricted state with the following limitations:

❌ DISABLED FEATURES:
- Cannot add new properties or units
- Tenants CANNOT make rent payments via M-Pesa
- Cannot access payment reports and analytics
- Limited tenant management capabilities

✅ STILL AVAILABLE:
- View dashboard (with warnings)
- Access subscription renewal page
- View profile settings
- Contact support

RENEW IMMEDIATELY:
To restore full functionality and allow your tenants to pay rent:

1. Log in to your dashboard
2. Go to Settings > Subscription
3. Select the {subscription.plan.upper()} plan (KES {plan_info.get('price', 0)})
4. Complete M-Pesa payment
5. Access will be restored within minutes

YOUR TENANTS ARE AFFECTED:
Please note that your tenants cannot make rent payments while your subscription is expired. 
Renew now to avoid affecting your rental income.

Need assistance? Contact support immediately.

Best regards,
Makau Rentals Team

---
RENEW NOW: [Dashboard URL]/admin/subscription
"""
    
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[landlord.email],
            fail_silently=False,
        )
        logger.info(f"Subscription expired email sent to {landlord.email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send expired email to {landlord.email}: {str(e)}")
        return False
