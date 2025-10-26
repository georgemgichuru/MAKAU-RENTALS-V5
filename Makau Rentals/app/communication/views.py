from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Report, ReminderSetting
from .serializers import ReportSerializer, UpdateReportStatusSerializer, SendEmailSerializer, ReminderSettingSerializer
from .permissions import IsTenantWithUnit, IsLandlordWithActiveSubscription
from accounts.permissions import CanAccessReport
from accounts.models import CustomUser, Unit
from .messaging import send_landlord_email
from rest_framework.permissions import IsAuthenticated
from app.tasks import send_landlord_email_task
from django.conf import settings


class CreateReportView(generics.CreateAPIView):
    queryset = Report.objects.all()
    serializer_class = ReportSerializer
    permission_classes = [permissions.IsAuthenticated, IsTenantWithUnit]

    def perform_create(self, serializer):
        import logging
        logger = logging.getLogger(__name__)
        
        report = serializer.save()
        logger.info(f"Report {report.id} created successfully by tenant {report.tenant.email}")
        
        # Send email notification to landlord
        email_async = getattr(settings, 'EMAIL_ASYNC_ENABLED', False)

        # If SMTP backend is selected but credentials are missing, skip sending to avoid blocking
        backend = getattr(settings, 'EMAIL_BACKEND', '')
        using_smtp = 'smtp' in backend
        if using_smtp and (not getattr(settings, 'EMAIL_HOST_USER', '') or not getattr(settings, 'EMAIL_HOST_PASSWORD', '')):
            logger.warning('Email backend is SMTP but credentials are missing; skipping email send for report %s', report.id)
            return
        
        if email_async:
            # Try async email via Celery
            try:
                from app.tasks import send_report_email_task
                send_report_email_task.apply_async(args=[report.id], countdown=0)
                logger.info(f"Queued async email for report {report.id}")
            except Exception as celery_error:
                # Fallback to synchronous email if Celery is not available
                logger.warning(f"Celery unavailable, falling back to sync email: {celery_error}")
                try:
                    from .messaging import send_report_email
                    send_report_email(report)
                    logger.info(f"Sent sync email for report {report.id}")
                except Exception as email_error:
                    logger.error(f"Failed to send report email: {email_error}")
        else:
            # Send synchronously
            try:
                from .messaging import send_report_email
                send_report_email(report)
                logger.info(f"Sent sync email for report {report.id}")
            except Exception as email_error:
                logger.error(f"Failed to send report email: {email_error}")
                # Report is still created, just email failed

class ReportListView(generics.ListAPIView):
    serializer_class = ReportSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'is_tenant', False):
            return Report.objects.filter(tenant=user)
        elif getattr(user, 'is_landlord', False):
            # Landlords see reports from their properties
            from accounts.models import Property
            landlord_properties = Property.objects.filter(landlord=user)
            return Report.objects.filter(unit__property_obj__in=landlord_properties)
        return Report.objects.none()
    
class OpenReportsView(generics.ListAPIView):
    serializer_class = ReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if getattr(user, 'is_tenant', False):
            return Report.objects.filter(tenant=user, status='open')
        elif getattr(user, 'is_landlord', False):
            return Report.objects.filter(unit__property_obj__landlord=user, status='open')
        return Report.objects.none()

class UrgentReportsView(generics.ListAPIView):
    serializer_class = ReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'is_tenant', False):
            return Report.objects.filter(tenant=user, priority_level='urgent')
        elif getattr(user, 'is_landlord', False):
            return Report.objects.filter(unit__property_obj__landlord=user, priority_level='urgent')
        return Report.objects.none()

class InProgressReportsView(generics.ListAPIView):
    serializer_class = ReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'is_tenant', False):
            return Report.objects.filter(tenant=user, status='in_progress')
        elif getattr(user, 'is_landlord', False):
            return Report.objects.filter(unit__property_obj__landlord=user, status='in_progress')
        return Report.objects.none()

class ResolvedReportsView(generics.ListAPIView):
    serializer_class = ReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'is_tenant', False):
            return Report.objects.filter(tenant=user, status='resolved')
        elif getattr(user, 'is_landlord', False):
            return Report.objects.filter(unit__property_obj__landlord=user, status='resolved')
        return Report.objects.none()

class UpdateReportStatusView(generics.UpdateAPIView):
    queryset = Report.objects.all()
    serializer_class = UpdateReportStatusSerializer
    permission_classes = [permissions.IsAuthenticated, CanAccessReport]

class SendEmailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsLandlordWithActiveSubscription]

    def post(self, request):
        serializer = SendEmailSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            subject = serializer.validated_data['subject']
            message = serializer.validated_data['message']
            send_to_all = serializer.validated_data['send_to_all']
            property_id = serializer.validated_data.get('property_id')

            if send_to_all:
                # Get all tenants of the landlord, optionally scoped to a single property
                landlord_properties = request.user.property_set.all()
                if property_id:
                    landlord_properties = landlord_properties.filter(id=property_id)
                tenants_qs = CustomUser.objects.filter(
                    groups__name='tenant',
                    unit__property_obj__in=landlord_properties
                ).distinct()
                tenant_ids = list(tenants_qs.values_list('id', flat=True))
            else:
                tenant_ids = [t.id for t in serializer.validated_data['tenants']]

            if getattr(settings, 'EMAIL_ASYNC_ENABLED', True):
                # Send asynchronously via Celery
                send_landlord_email_task.delay(subject, message, tenant_ids)
                return Response({"message": "Emails queued for delivery."}, status=status.HTTP_202_ACCEPTED)
            else:
                # Synchronous fallback (useful when Celery isn't running)
                tenants_qs = CustomUser.objects.filter(id__in=tenant_ids, groups__name='tenant')
                send_landlord_email(subject, message, tenants_qs)
                return Response({"message": "Emails sent successfully."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class ReportStatisticsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        if getattr(user, 'is_landlord', False):
            reports = Report.objects.filter(unit__property_obj__landlord=user)
        else:
            reports = Report.objects.filter(tenant=user)
            
        stats = {
            'total': reports.count(),
            'open': reports.filter(status='open').count(),
            'in_progress': reports.filter(status='in_progress').count(),
            'resolved': reports.filter(status='resolved').count(),
            'urgent': reports.filter(priority_level='urgent', status__in=['open', 'in_progress']).count(),
            'average_resolution_time': self.get_average_resolution_time(reports),
        }
        return Response(stats)
    
    def get_average_resolution_time(self, reports):
        resolved_reports = reports.filter(status='resolved', resolved_date__isnull=False)
        if not resolved_reports:
            return 0
            
        total_days = sum((r.resolved_date - r.reported_date).days for r in resolved_reports)
        return total_days / resolved_reports.count()


class ReminderSettingView(APIView):
    """
    Retrieve and update landlord monthly payment reminder settings.
    GET returns current settings; PUT/PATCH updates them.
    """
    permission_classes = [IsAuthenticated, IsLandlordWithActiveSubscription]

    def get_object(self, user):
        setting, _ = ReminderSetting.objects.get_or_create(landlord=user)
        return setting

    def get(self, request):
        setting = self.get_object(request.user)
        serializer = ReminderSettingSerializer(setting)
        return Response(serializer.data)

    def put(self, request):
        setting = self.get_object(request.user)
        serializer = ReminderSettingSerializer(setting, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request):
        setting = self.get_object(request.user)
        serializer = ReminderSettingSerializer(setting, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
