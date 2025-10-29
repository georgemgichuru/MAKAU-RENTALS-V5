"""
Management command to fix existing tenants and create approval workflow
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from accounts.models import CustomUser, TenantProfile, TenantApplication, Unit


class Command(BaseCommand):
    help = 'Fix existing tenants to require landlord approval if not assigned to a unit'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Starting tenant approval fix...'))
        
        # Get all active tenants
        tenants = CustomUser.objects.filter(
            groups__name='tenant',
            is_active=True
        )
        
        self.stdout.write(f'Found {tenants.count()} active tenants')
        
        deactivated_count = 0
        applications_created = 0
        
        for tenant in tenants:
            try:
                # Check if tenant has a TenantProfile
                if not hasattr(tenant, 'tenant_profile'):
                    self.stdout.write(self.style.WARNING(
                        f'Tenant {tenant.email} has no profile - skipping'
                    ))
                    continue
                
                profile = tenant.tenant_profile
                landlord = profile.landlord
                
                # Check if tenant is assigned to a unit
                assigned_unit = Unit.objects.filter(tenant=tenant).first()
                
                # Check if tenant has an existing application
                existing_app = TenantApplication.objects.filter(
                    tenant=tenant,
                    landlord=landlord
                ).first()
                
                if existing_app:
                    # Application exists - check status
                    if existing_app.status == 'pending':
                        # Deactivate tenant if still pending
                        tenant.is_active = False
                        tenant.save()
                        deactivated_count += 1
                        self.stdout.write(self.style.SUCCESS(
                            f'✓ Deactivated {tenant.email} - has pending application'
                        ))
                    elif existing_app.status == 'approved' and assigned_unit:
                        # Already approved and assigned - keep active
                        self.stdout.write(self.style.SUCCESS(
                            f'✓ {tenant.email} - already approved and assigned'
                        ))
                    else:
                        self.stdout.write(self.style.WARNING(
                            f'? {tenant.email} - status: {existing_app.status}, unit: {assigned_unit}'
                        ))
                else:
                    # No application exists - create one
                    if assigned_unit:
                        # Tenant is already assigned - auto-approve
                        TenantApplication.objects.create(
                            tenant=tenant,
                            landlord=landlord,
                            unit=assigned_unit,
                            already_living_in_property=True,
                            deposit_required=False,
                            deposit_paid=True,
                            status='approved',
                            reviewed_at=timezone.now()
                        )
                        applications_created += 1
                        self.stdout.write(self.style.SUCCESS(
                            f'✓ Created approved application for {tenant.email} (already assigned to unit)'
                        ))
                    else:
                        # Tenant not assigned - create pending application and deactivate
                        TenantApplication.objects.create(
                            tenant=tenant,
                            landlord=landlord,
                            unit=profile.current_unit,
                            already_living_in_property=True,
                            deposit_required=False,
                            deposit_paid=False,
                            status='pending'
                        )
                        tenant.is_active = False
                        tenant.save()
                        applications_created += 1
                        deactivated_count += 1
                        self.stdout.write(self.style.SUCCESS(
                            f'✓ Created pending application and deactivated {tenant.email}'
                        ))
                        
            except Exception as e:
                self.stdout.write(self.style.ERROR(
                    f'✗ Error processing {tenant.email}: {str(e)}'
                ))
        
        self.stdout.write(self.style.SUCCESS(
            f'\n=== Summary ==='
        ))
        self.stdout.write(self.style.SUCCESS(
            f'Tenants deactivated: {deactivated_count}'
        ))
        self.stdout.write(self.style.SUCCESS(
            f'Applications created: {applications_created}'
        ))
        self.stdout.write(self.style.SUCCESS(
            f'✓ Tenant approval fix completed!'
        ))
