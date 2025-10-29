# services/messaging.py
from django.conf import settings
from django.core.mail import send_mail


def send_bulk_emails(tenants):
    """
    Send rent reminder emails to a list of tenants.
    Each tenant receives a personalized message with their outstanding balance.
    """
    for tenant in tenants:
        subject = "Rent Payment Reminder"
        message = (
            f"Hello {tenant.full_name},\n\n"
            f"This is a reminder to pay your rent.\n"
            f"Outstanding balance: KES {tenant.unit.rent_remaining}."
        )
        try:
            send_mail(subject, message, settings.EMAIL_HOST_USER, [tenant.email])
        except Exception as e:
            print(f"Email failed for {tenant.email}: {e}")





def send_deadline_reminder_emails(tenants):
    """
    Send rent deadline reminder emails to a list of tenants.
    Each email includes the payment deadline date, outstanding balance, and login link.
    """
    from datetime import timedelta
    
    for tenant in tenants:
        try:
            # Get unit from tenant profile
            profile = getattr(tenant, 'tenant_profile', None)
            if not profile or not profile.current_unit:
                continue
                
            unit = profile.current_unit
            
            # Determine due date (landlord's deadline or calculated from move-in date)
            due_date = None
            if unit.rent_due_date:
                due_date = unit.rent_due_date
            elif profile.move_in_date:
                # Calculate due date from move-in date
                from django.utils import timezone
                import calendar
                today = timezone.now().date()
                move_in_day = profile.move_in_date.day
                
                try:
                    current_month_due = today.replace(day=move_in_day)
                except ValueError:
                    last_day = calendar.monthrange(today.year, today.month)[1]
                    current_month_due = today.replace(day=last_day)
                
                if today > current_month_due:
                    next_month = today.month + 1 if today.month < 12 else 1
                    next_year = today.year if today.month < 12 else today.year + 1
                    try:
                        due_date = today.replace(year=next_year, month=next_month, day=move_in_day)
                    except ValueError:
                        last_day = calendar.monthrange(next_year, next_month)[1]
                        due_date = today.replace(year=next_year, month=next_month, day=last_day)
                else:
                    due_date = current_month_due
            
            if not due_date:
                continue
            
            subject = "Rent Payment Deadline Reminder"
            login_link = f"{settings.FRONTEND_URL}/login"
            due_date_str = due_date.strftime('%B %d, %Y')
            
            message = (
                f"Hello {tenant.full_name},\n\n"
                f"This is a reminder that your rent payment is due on {due_date_str}.\n"
                f"Outstanding balance: KES {unit.rent_remaining}.\n\n"
                f"Please log in to your account to make the payment: {login_link}\n\n"
                "Thank you,\n"
                "Makau Rentals Team"
            )
            
            send_mail(subject, message, settings.EMAIL_HOST_USER, [tenant.email])
        except Exception as e:
            print(f"Email failed for {tenant.email}: {e}")


def send_deadline_reminders():
    """
    Send reminders to tenants based on their custom reminder preferences.
    Uses landlord's rent deadline if set, otherwise uses tenant's move-in date for monthly reminders.
    """
    from datetime import timedelta
    from django.utils import timezone
    from accounts.models import CustomUser, TenantProfile

    today = timezone.now().date()
    tenants_to_remind = []

    # Get all active tenants with tenant profiles
    tenants = CustomUser.objects.filter(
        user_type="tenant",
        is_active=True,
        tenant_profile__isnull=False
    ).select_related('tenant_profile', 'tenant_profile__current_unit')

    for tenant in tenants:
        try:
            profile = tenant.tenant_profile
            unit = profile.current_unit
            
            # Skip if no unit assigned
            if not unit:
                continue
            
            # Skip if no rent remaining
            if hasattr(unit, 'rent_remaining') and unit.rent_remaining <= 0:
                continue
            
            # Determine the due date to use for reminders
            # Priority 1: Use landlord's rent_due_date if set
            # Priority 2: Use tenant's move_in_date to calculate monthly due date
            due_date = None
            
            if unit.rent_due_date:
                # Landlord has set a specific rent deadline
                due_date = unit.rent_due_date
            elif profile.move_in_date:
                # Use move-in date to calculate monthly due date
                # Rent is due on the same day each month as the move-in date
                move_in_day = profile.move_in_date.day
                
                # Calculate this month's due date
                try:
                    current_month_due = today.replace(day=move_in_day)
                except ValueError:
                    # Handle case where move-in day doesn't exist in current month (e.g., 31st)
                    # Use last day of month
                    import calendar
                    last_day = calendar.monthrange(today.year, today.month)[1]
                    current_month_due = today.replace(day=last_day)
                
                # If we've passed this month's due date, calculate next month's
                if today > current_month_due:
                    # Calculate next month's due date
                    next_month = today.month + 1 if today.month < 12 else 1
                    next_year = today.year if today.month < 12 else today.year + 1
                    try:
                        due_date = today.replace(year=next_year, month=next_month, day=move_in_day)
                    except ValueError:
                        # Handle case where move-in day doesn't exist in next month
                        import calendar
                        last_day = calendar.monthrange(next_year, next_month)[1]
                        due_date = today.replace(year=next_year, month=next_month, day=last_day)
                else:
                    due_date = current_month_due
            
            # Skip if no due date could be determined
            if not due_date:
                continue
            
            # Check if tenant should be reminded based on their preferences
            if tenant.reminder_mode == 'days_before':
                reminder_date = due_date - timedelta(days=tenant.reminder_value)
                if reminder_date == today:
                    tenants_to_remind.append(tenant)
            elif tenant.reminder_mode == 'fixed_day':
                if today.day == tenant.reminder_value:
                    # Check if due date is within a reasonable period, e.g., next 30 days
                    if due_date >= today and (due_date - today).days <= 30:
                        tenants_to_remind.append(tenant)
        
        except Exception as e:
            # Log error but continue processing other tenants
            print(f"Error processing reminder for tenant {tenant.email}: {e}")
            continue

    if tenants_to_remind:
        send_deadline_reminder_emails(tenants_to_remind)

# TODO:
# - This module handles sending bulk emails to tenants for rent reminders.
# - It uses Django's send_mail for email notifications.
# - The send_deadline_reminders() function is scheduled via Celery Beat to run automatically.

def send_report_email(report):
    """
    Send an email to the landlord when a new report is created.
    """
    landlord = report.unit.property_obj.landlord
    subject = f"New Issue Report: {report.issue_title}"
    issue_url = f"{settings.FRONTEND_URL}/reports/{report.id}"
    message = (
        f"Hello {landlord.full_name},\n\n"
        f"A new issue report has been submitted by tenant {report.tenant.full_name}.\n\n"
        f"Unit Number: {report.unit.unit_number}\n"
        f"Issue Category: {report.issue_category}\n"
        f"Priority Level: {report.priority_level}\n"
        f"Issue Title: {report.issue_title}\n"
        f"Description:\n{report.description}\n\n"
        f"To resolve the issue, please visit: {issue_url}\n\n"
        "Best regards,\n"
        "Makau Rentals System"
    )
    try:
        send_mail(subject, message, settings.EMAIL_HOST_USER, [landlord.email])
    except Exception as e:
        print(f"Failed to send report email: {e}")


def send_landlord_email(subject, message, tenants):
    """
    Send a custom email from landlord to a list of tenants.
    """
    recipient_emails = [tenant.email for tenant in tenants]
    try:
        send_mail(subject, message, settings.EMAIL_HOST_USER, recipient_emails)
    except Exception as e:
        print(f"Failed to send landlord email: {e}")
