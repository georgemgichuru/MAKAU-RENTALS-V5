# app/tasks.py
from celery import shared_task
from communication.messaging import send_report_email

@shared_task
def send_report_email_task(report_id):
    from communication.models import Report
    try:
        report = Report.objects.get(id=report_id)
        send_report_email(report)
    except Report.DoesNotExist:
        print(f"Report with id {report_id} does not exist.")
from django.utils import timezone
from datetime import timedelta
from accounts.models import Unit, CustomUser
from payments.models import Payment
from communication.messaging import send_bulk_emails
from django.core.mail import send_mail
from django.conf import settings
from django.core.mail import EmailMessage


@shared_task
def notify_due_rent_task():
    """
    Celery task to notify tenants whose rent is due today or overdue.
    """
    today = timezone.now().date()
    due_units = Unit.objects.filter(
        tenant__isnull=False,
        rent_due_date__lte=today,
        rent_remaining__gt=0
    )
    tenants = [u.tenant for u in due_units if u.tenant]

    if tenants:
        send_bulk_emails(tenants)

    return f"Notified {len(tenants)} tenants with due/overdue rent"


@shared_task
def landlord_summary_task():
    """
    Celery task to send landlords a summary of tenants with due/overdue rent.
    Runs daily (or weekly if you prefer).
    """
    today = timezone.now().date()
    landlords = CustomUser.objects.filter(user_type="landlord")

    for landlord in landlords:
        # Get all units owned by this landlord
        units = Unit.objects.filter(property_obj__landlord=landlord)

        # Filter tenants who are due/overdue
        overdue_units = units.filter(
            tenant__isnull=False,
            rent_due_date__lte=today,
            rent_remaining__gt=0
        )

        if not overdue_units.exists():
            continue  # Skip landlords with no overdue tenants

        # Build summary message
        summary_lines = []
        total_outstanding = 0
        for unit in overdue_units:
            tenant = unit.tenant
            summary_lines.append(
                f"Unit {unit.unit_number} - Tenant: {tenant.full_name} "
                f"({tenant.email}) | Due: {unit.rent_due_date} | Outstanding: KES {unit.rent_remaining}"
            )
            total_outstanding += float(unit.rent_remaining)

        subject = "Daily Rent Summary - Overdue Tenants"
        message = (
            f"Hello {landlord.full_name},\n\n"
            f"Here is the summary of overdue tenants in your properties:\n\n"
            + "\n".join(summary_lines)
            + f"\n\nTotal Outstanding: KES {total_outstanding}\n\n"
            "Regards,\nYour Rental Management System"
        )

        try:
            send_mail(subject, message, settings.EMAIL_HOST_USER, [landlord.email])
        except Exception as e:
            print(f"Failed to send summary to {landlord.email}: {e}")

    return "Landlord summaries sent"


@shared_task
def delete_unpaid_deposit_tenants():
    """
    Celery task to delete tenants who haven't paid deposit within 14 days of assignment.
    """
    now = timezone.now()
    cutoff_date = now - timedelta(days=14)
    units = Unit.objects.filter(
        tenant__isnull=False,
        assigned_date__isnull=False,
        assigned_date__lte=cutoff_date
    )
    deleted_count = 0
    for unit in units:
        tenant = unit.tenant
        # Check if there is a successful deposit payment within 14 days
        deposit_deadline = unit.assigned_date + timedelta(days=14)
        has_deposit = Payment.objects.filter(
            tenant=tenant,
            payment_type='deposit',
            status='Success',
            transaction_date__lte=deposit_deadline
        ).exists()
        if not has_deposit:
            tenant.delete()
            deleted_count += 1
    return f"Deleted {deleted_count} tenants for unpaid deposit"


@shared_task
def delete_left_tenants():
    """
    Celery task to delete tenants who have been out of a unit for 7 days.
    """
    now = timezone.now()
    cutoff_date = now - timedelta(days=7)
    units = Unit.objects.filter(
        left_date__isnull=False,
        left_date__lte=cutoff_date
    )
    deleted_count = 0
    for unit in units:
        if unit.tenant:  # Though it should be None, but to be safe
            unit.tenant.delete()
            deleted_count += 1
    return f"Deleted {deleted_count} tenants who left units"


@shared_task
def deadline_reminder_task():
    """
    Celery task to send reminders to tenants whose rent payment deadline is 10 days away.
    """
    from communication.messaging import send_deadline_reminders
    send_deadline_reminders()
    return "Deadline reminders sent"


@shared_task
def send_landlord_email_task(subject: str, message: str, tenant_ids: list[int]):
    """
    Asynchronously send a custom email from a landlord to a list of tenants.
    Uses BCC and chunks recipients to avoid provider limits and PII exposure.
    """
    from accounts.models import CustomUser

    # Fetch recipient emails
    recipients = list(
        CustomUser.objects.filter(id__in=tenant_ids, user_type='tenant')
        .values_list('email', flat=True)
    )
    # Remove empties/dupes
    recipients = [e for e in recipients if e]
    recipients = list(dict.fromkeys(recipients))

    if not recipients:
        return "No recipients to email"

    # Chunk recipients (e.g., 50 per email to be safe)
    chunk_size = 50
    total_sent = 0
    for i in range(0, len(recipients), chunk_size):
        chunk = recipients[i:i+chunk_size]
        try:
            email = EmailMessage(
                subject=subject,
                body=message,
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', settings.EMAIL_HOST_USER),
                to=[],  # Empty TO to avoid disclosing recipients
                bcc=chunk,
            )
            email.send(fail_silently=False)
            total_sent += len(chunk)
        except Exception as e:
            print(f"Failed sending chunk {i//chunk_size + 1}: {e}")

    return f"Sent to {total_sent} recipients in {((len(recipients)-1)//chunk_size)+1} batch(es)"


@shared_task
def send_monthly_payment_reminders_task():
    """
    Daily task that checks landlord reminder settings and sends emails
    on matching days of the month.
    """
    from django.utils import timezone
    from accounts.models import CustomUser
    from communication.models import ReminderSetting

    today = timezone.now().date()
    today_day = today.day

    # Iterate over active settings
    settings_qs = ReminderSetting.objects.filter(active=True, send_email=True)
    sent_count = 0
    for setting in settings_qs:
        days = setting.days_of_month or []
        # Normalize to ints
        try:
            days = [int(d) for d in days]
        except Exception:
            continue

        if today_day not in days:
            continue

        # Optional: avoid double-send if beat runs twice in a day
        if setting.last_run_date == today:
            continue

        # Collect tenant recipients for this landlord
        tenant_ids = list(
            CustomUser.objects.filter(
                user_type='tenant',
                unit__property_obj__landlord=setting.landlord
            ).distinct().values_list('id', flat=True)
        )

        if not tenant_ids:
            # Still mark run date to avoid repeated checks
            setting.last_run_date = today
            setting.save(update_fields=['last_run_date'])
            continue

        # Queue send via existing async email task
        send_landlord_email_task.delay(setting.subject, setting.message, tenant_ids)
        setting.last_run_date = today
        setting.save(update_fields=['last_run_date'])
        sent_count += len(tenant_ids)

    return f"Queued monthly reminders for {sent_count} tenant(s)"
