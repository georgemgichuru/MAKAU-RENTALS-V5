"""
Payment Email Notifications
Sends confirmation emails to tenants and landlords when payments are completed
"""
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


def send_rent_payment_confirmation(payment):
    """
    Send rent payment confirmation email to both tenant and landlord
    
    Args:
        payment: Payment object with completed status
    """
    try:
        tenant = payment.tenant
        unit = payment.unit
        landlord = unit.property_obj.landlord if unit.property_obj else None
        
        amount = float(payment.amount)
        receipt = payment.mpesa_receipt or f"RENT-{payment.id}"
        payment_date = payment.created_at.strftime("%B %d, %Y at %I:%M %p")
        
        # Email to Tenant
        tenant_subject = "Rent Payment Confirmation - Makau Rentals"
        tenant_message = f"""
Hello {tenant.full_name},

Your rent payment has been received and confirmed successfully!

Payment Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Property: {unit.property_obj.name if unit.property_obj else 'N/A'}
Unit Number: {unit.unit_number}
Amount Paid: KES {amount:,.2f}
Receipt Number: {receipt}
Payment Date: {payment_date}
Remaining Balance: KES {float(unit.rent_remaining):,.2f}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Thank you for your prompt payment!

You can view your payment history by logging into your account:
{settings.FRONTEND_URL}/tenant/payments

If you have any questions, please contact your landlord or our support team.

Best regards,
Makau Rentals Management System
{settings.EMAIL_HOST_USER}
"""
        
        send_mail(
            tenant_subject,
            tenant_message,
            settings.EMAIL_HOST_USER,
            [tenant.email],
            fail_silently=False
        )
        logger.info(f"Rent payment confirmation sent to tenant: {tenant.email}")
        
        # Email to Landlord
        if landlord and landlord.email:
            landlord_subject = f"Payment Received - {tenant.full_name} - Unit {unit.unit_number}"
            landlord_message = f"""
Hello {landlord.full_name},

A rent payment has been received from your tenant.

Payment Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tenant Name: {tenant.full_name}
Tenant Email: {tenant.email}
Tenant Phone: {tenant.phone_number or 'N/A'}

Property: {unit.property_obj.name if unit.property_obj else 'N/A'}
Unit Number: {unit.unit_number}
Amount Received: KES {amount:,.2f}
Receipt Number: {receipt}
Payment Date: {payment_date}

Unit Status:
- Total Rent: KES {float(unit.rent):,.2f}
- Total Paid: KES {float(unit.rent_paid):,.2f}
- Remaining Balance: KES {float(unit.rent_remaining):,.2f}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You can view all payments in your dashboard:
{settings.FRONTEND_URL}/admin/payments

Best regards,
Makau Rentals Management System
{settings.EMAIL_HOST_USER}
"""
            
            send_mail(
                landlord_subject,
                landlord_message,
                settings.EMAIL_HOST_USER,
                [landlord.email],
                fail_silently=False
            )
            logger.info(f"Rent payment notification sent to landlord: {landlord.email}")
            
    except Exception as e:
        logger.error(f"Failed to send rent payment confirmation emails: {str(e)}", exc_info=True)


def send_subscription_payment_confirmation(subscription_payment):
    """
    Send subscription payment confirmation email to landlord
    
    Args:
        subscription_payment: SubscriptionPayment object with completed status
    """
    try:
        user = subscription_payment.user
        amount = float(subscription_payment.amount)
        receipt = subscription_payment.mpesa_receipt_number or f"SUB-{subscription_payment.id}"
        payment_date = subscription_payment.created_at.strftime("%B %d, %Y at %I:%M %p")
        plan_name = subscription_payment.subscription_type.upper()
        
        # Get subscription expiry
        from accounts.models import Subscription
        subscription = Subscription.objects.filter(user=user).first()
        expiry_date = subscription.expiry_date.strftime("%B %d, %Y") if subscription else "N/A"
        
        subject = "Subscription Payment Confirmation - Makau Rentals"
        message = f"""
Hello {user.full_name},

Your subscription payment has been received and confirmed successfully!

Subscription Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Plan: {plan_name}
Amount Paid: KES {amount:,.2f}
Receipt Number: {receipt}
Payment Date: {payment_date}
Subscription Valid Until: {expiry_date}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your subscription is now active and you have full access to all features.

You can manage your subscription and view payment history:
{settings.FRONTEND_URL}/admin/subscription

Thank you for choosing Makau Rentals!

Best regards,
Makau Rentals Management System
{settings.EMAIL_HOST_USER}
"""
        
        send_mail(
            subject,
            message,
            settings.EMAIL_HOST_USER,
            [user.email],
            fail_silently=False
        )
        logger.info(f"Subscription payment confirmation sent to: {user.email}")
        
    except Exception as e:
        logger.error(f"Failed to send subscription payment confirmation email: {str(e)}", exc_info=True)


def send_deposit_payment_confirmation(payment, is_registration=False):
    """
    Send deposit payment confirmation email to both tenant and landlord
    
    Args:
        payment: Payment object with completed status
        is_registration: Boolean indicating if this is a registration deposit
    """
    try:
        tenant = payment.tenant
        unit = payment.unit
        landlord = unit.property_obj.landlord if unit.property_obj else None
        
        amount = float(payment.amount)
        receipt = payment.mpesa_receipt or f"DEP-{payment.id}"
        payment_date = payment.created_at.strftime("%B %d, %Y at %I:%M %p")
        payment_type = "Registration Deposit" if is_registration else "Deposit"
        
        # Email to Tenant
        tenant_subject = f"{payment_type} Payment Confirmation - Makau Rentals"
        tenant_message = f"""
Hello {tenant.full_name},

Your {payment_type.lower()} payment has been received and confirmed successfully!

Payment Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Property: {unit.property_obj.name if unit.property_obj else 'N/A'}
Unit Number: {unit.unit_number}
Payment Type: {payment_type}
Amount Paid: KES {amount:,.2f}
Receipt Number: {receipt}
Payment Date: {payment_date}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{"Your registration is being processed. You will receive login credentials shortly." if is_registration else "Thank you for your payment!"}

You can view your payment history by logging into your account:
{settings.FRONTEND_URL}/tenant/dashboard

If you have any questions, please contact your landlord or our support team.

Best regards,
Makau Rentals Management System
{settings.EMAIL_HOST_USER}
"""
        
        send_mail(
            tenant_subject,
            tenant_message,
            settings.EMAIL_HOST_USER,
            [tenant.email],
            fail_silently=False
        )
        logger.info(f"Deposit payment confirmation sent to tenant: {tenant.email}")
        
        # Email to Landlord
        if landlord and landlord.email:
            landlord_subject = f"{payment_type} Received - {tenant.full_name} - Unit {unit.unit_number}"
            landlord_message = f"""
Hello {landlord.full_name},

A {payment_type.lower()} payment has been received from {"a new" if is_registration else "your"} tenant.

Payment Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tenant Name: {tenant.full_name}
Tenant Email: {tenant.email}
Tenant Phone: {tenant.phone_number or 'N/A'}

Property: {unit.property_obj.name if unit.property_obj else 'N/A'}
Unit Number: {unit.unit_number}
Payment Type: {payment_type}
Amount Received: KES {amount:,.2f}
Receipt Number: {receipt}
Payment Date: {payment_date}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{"This is a new tenant registration. Please review and approve in your dashboard." if is_registration else "Deposit payment has been recorded."}

You can view all payments in your dashboard:
{settings.FRONTEND_URL}/admin/payments

Best regards,
Makau Rentals Management System
{settings.EMAIL_HOST_USER}
"""
            
            send_mail(
                landlord_subject,
                landlord_message,
                settings.EMAIL_HOST_USER,
                [landlord.email],
                fail_silently=False
            )
            logger.info(f"Deposit payment notification sent to landlord: {landlord.email}")
            
    except Exception as e:
        logger.error(f"Failed to send deposit payment confirmation emails: {str(e)}", exc_info=True)
