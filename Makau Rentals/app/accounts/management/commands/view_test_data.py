"""
Management command to view test data summary
Usage: python manage.py view_test_data
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from accounts.models import CustomUser, Property, UnitType, Unit, TenantProfile
from payments.models import Payment
from communication.models import Report


class Command(BaseCommand):
    help = 'Display comprehensive summary of test data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--landlord',
            type=str,
            help='Show details for specific landlord email'
        )
        parser.add_argument(
            '--tenant',
            type=str,
            help='Show details for specific tenant email'
        )
        parser.add_argument(
            '--stats',
            action='store_true',
            help='Show detailed statistics'
        )

    def handle(self, *args, **options):
        if options['landlord']:
            self.show_landlord_details(options['landlord'])
        elif options['tenant']:
            self.show_tenant_details(options['tenant'])
        elif options['stats']:
            self.show_detailed_stats()
        else:
            self.show_overview()

    def show_overview(self):
        """Show quick overview of all test data"""
        self.stdout.write('\n' + '='*70)
        self.stdout.write(self.style.SUCCESS('TEST DATA OVERVIEW'))
        self.stdout.write('='*70 + '\n')

        # Landlords
        self.stdout.write(self.style.HTTP_INFO('LANDLORDS'))
        landlords = CustomUser.objects.filter(user_type='landlord', email__contains='test')
        for landlord in landlords:
            sub_plan = landlord.subscription.plan if hasattr(landlord, 'subscription') else 'None'
            properties_count = Property.objects.filter(landlord=landlord).count()
            tenants_count = TenantProfile.objects.filter(landlord=landlord).count()
            
            self.stdout.write(f'\n📧 {landlord.email}')
            self.stdout.write(f'   Password: Test123!')
            self.stdout.write(f'   Name: {landlord.full_name}')
            self.stdout.write(f'   Code: {landlord.landlord_code}')
            self.stdout.write(f'   Plan: {sub_plan}')
            self.stdout.write(f'   Properties: {properties_count}')
            self.stdout.write(f'   Tenants: {tenants_count}')

        # Tenants Summary
        self.stdout.write('\n' + self.style.HTTP_INFO('TENANTS'))
        tenants = CustomUser.objects.filter(user_type='tenant', email__contains='test')
        self.stdout.write(f'Total: {tenants.count()} tenant accounts')
        self.stdout.write(f'All passwords: Test123!')
        
        # Show first 5 tenants
        for tenant in tenants[:5]:
            try:
                profile = tenant.tenant_profile
                unit_info = f"Unit {profile.current_unit.unit_number}" if profile.current_unit else "No unit"
                landlord_name = profile.landlord.full_name if profile.landlord else "No landlord"
            except:
                unit_info = "No profile"
                landlord_name = "N/A"
            
            self.stdout.write(f'  • {tenant.email} - {tenant.full_name} ({unit_info}, Landlord: {landlord_name})')
        
        if tenants.count() > 5:
            self.stdout.write(f'  ... and {tenants.count() - 5} more tenants')

        # Data Summary
        self.stdout.write('\n' + self.style.HTTP_INFO('DATA SUMMARY'))
        self.stdout.write(f'Properties: {Property.objects.count()}')
        self.stdout.write(f'Unit Types: {UnitType.objects.count()}')
        self.stdout.write(f'Total Units: {Unit.objects.count()}')
        self.stdout.write(f'  - Available: {Unit.objects.filter(is_available=True).count()}')
        self.stdout.write(f'  - Occupied: {Unit.objects.filter(is_available=False).count()}')
        self.stdout.write(f'Payments: {Payment.objects.count()}')
        self.stdout.write(f'  - Completed: {Payment.objects.filter(status="completed").count()}')
        self.stdout.write(f'  - Pending: {Payment.objects.filter(status="pending").count()}')
        self.stdout.write(f'  - Failed: {Payment.objects.filter(status="failed").count()}')
        self.stdout.write(f'Maintenance Reports: {Report.objects.count()}')
        self.stdout.write(f'  - Open: {Report.objects.filter(status="open").count()}')
        self.stdout.write(f'  - In Progress: {Report.objects.filter(status="in_progress").count()}')
        self.stdout.write(f'  - Resolved: {Report.objects.filter(status="resolved").count()}')

        self.stdout.write('\n' + '='*70)
        self.stdout.write('Use --landlord <email> or --tenant <email> for detailed info')
        self.stdout.write('Use --stats for detailed statistics')
        self.stdout.write('='*70 + '\n')

    def show_landlord_details(self, email):
        """Show detailed information for a specific landlord"""
        try:
            landlord = CustomUser.objects.get(email=email, user_type='landlord')
        except CustomUser.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'Landlord with email {email} not found'))
            return

        self.stdout.write('\n' + '='*70)
        self.stdout.write(self.style.SUCCESS(f'LANDLORD DETAILS: {landlord.full_name}'))
        self.stdout.write('='*70 + '\n')

        self.stdout.write(f'Email: {landlord.email}')
        self.stdout.write(f'Password: Test123!')
        self.stdout.write(f'Landlord Code: {landlord.landlord_code}')
        self.stdout.write(f'Phone: {landlord.phone_number}')
        self.stdout.write(f'Till Number: {landlord.mpesa_till_number or "Not set"}')
        
        if hasattr(landlord, 'subscription'):
            sub = landlord.subscription
            self.stdout.write(f'Subscription: {sub.plan}')
            self.stdout.write(f'Expires: {sub.expiry_date}')

        # Properties
        properties = Property.objects.filter(landlord=landlord)
        self.stdout.write(f'\nProperties ({properties.count()}):')
        for prop in properties:
            units_count = Unit.objects.filter(property_obj=prop).count()
            occupied = Unit.objects.filter(property_obj=prop, is_available=False).count()
            self.stdout.write(f'  • {prop.name} - {prop.city}')
            self.stdout.write(f'    Units: {units_count} (Occupied: {occupied})')

        # Tenants
        tenants = TenantProfile.objects.filter(landlord=landlord)
        self.stdout.write(f'\nTenants ({tenants.count()}):')
        for profile in tenants[:10]:
            unit_info = f"Unit {profile.current_unit.unit_number}" if profile.current_unit else "No unit"
            self.stdout.write(f'  • {profile.tenant.full_name} ({profile.tenant.email}) - {unit_info}')
        
        if tenants.count() > 10:
            self.stdout.write(f'  ... and {tenants.count() - 10} more')

        # Payment Summary
        tenant_ids = [t.tenant.id for t in tenants]
        payments = Payment.objects.filter(tenant_id__in=tenant_ids)
        total_revenue = sum(p.amount for p in payments.filter(status='completed'))
        self.stdout.write(f'\nPayments:')
        self.stdout.write(f'  Total: {payments.count()}')
        self.stdout.write(f'  Completed: {payments.filter(status="completed").count()}')
        self.stdout.write(f'  Total Revenue: KES {total_revenue}')

        # Reports
        unit_ids = [u.id for u in Unit.objects.filter(property_obj__landlord=landlord)]
        reports = Report.objects.filter(unit_id__in=unit_ids)
        self.stdout.write(f'\nMaintenance Reports: {reports.count()}')
        self.stdout.write(f'  Open: {reports.filter(status="open").count()}')
        self.stdout.write(f'  Resolved: {reports.filter(status="resolved").count()}')

        self.stdout.write('\n' + '='*70 + '\n')

    def show_tenant_details(self, email):
        """Show detailed information for a specific tenant"""
        try:
            tenant = CustomUser.objects.get(email=email, user_type='tenant')
        except CustomUser.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'Tenant with email {email} not found'))
            return

        self.stdout.write('\n' + '='*70)
        self.stdout.write(self.style.SUCCESS(f'TENANT DETAILS: {tenant.full_name}'))
        self.stdout.write('='*70 + '\n')

        self.stdout.write(f'Email: {tenant.email}')
        self.stdout.write(f'Password: Test123!')
        self.stdout.write(f'Phone: {tenant.phone_number}')
        self.stdout.write(f'National ID: {tenant.national_id}')

        # Profile info
        if hasattr(tenant, 'tenant_profile'):
            profile = tenant.tenant_profile
            self.stdout.write(f'\nLandlord: {profile.landlord.full_name} ({profile.landlord.email})')
            self.stdout.write(f'Landlord Code: {profile.landlord.landlord_code}')
            
            if profile.current_unit:
                unit = profile.current_unit
                self.stdout.write(f'\nCurrent Unit:')
                self.stdout.write(f'  Property: {unit.property_obj.name}')
                self.stdout.write(f'  Unit Number: {unit.unit_number}')
                self.stdout.write(f'  Type: {unit.unit_type.name if unit.unit_type else "N/A"}')
                self.stdout.write(f'  Monthly Rent: KES {unit.rent}')
                self.stdout.write(f'  Rent Paid: KES {unit.rent_paid}')
                self.stdout.write(f'  Balance: KES {unit.rent_remaining}')
                self.stdout.write(f'  Due Date: {unit.rent_due_date}')

            self.stdout.write(f'\nLease Info:')
            self.stdout.write(f'  Move-in Date: {profile.move_in_date}')
            self.stdout.write(f'  Lease End Date: {profile.lease_end_date}')

        # Payments
        payments = Payment.objects.filter(tenant=tenant)
        self.stdout.write(f'\nPayments ({payments.count()}):')
        for payment in payments[:5]:
            self.stdout.write(f'  • KES {payment.amount} - {payment.payment_type} ({payment.status}) - {payment.created_at.date()}')
        
        if payments.count() > 5:
            self.stdout.write(f'  ... and {payments.count() - 5} more')

        total_paid = sum(p.amount for p in payments.filter(status='completed'))
        self.stdout.write(f'\nTotal Paid: KES {total_paid}')

        # Reports
        reports = Report.objects.filter(tenant=tenant)
        self.stdout.write(f'\nMaintenance Reports ({reports.count()}):')
        for report in reports[:5]:
            self.stdout.write(f'  • {report.issue_title} ({report.status}) - {report.reported_date.date()}')
        
        if reports.count() > 5:
            self.stdout.write(f'  ... and {reports.count() - 5} more')

        self.stdout.write('\n' + '='*70 + '\n')

    def show_detailed_stats(self):
        """Show detailed statistics"""
        self.stdout.write('\n' + '='*70)
        self.stdout.write(self.style.SUCCESS('DETAILED STATISTICS'))
        self.stdout.write('='*70 + '\n')

        # Unit Type Distribution
        self.stdout.write(self.style.HTTP_INFO('UNIT TYPE DISTRIBUTION'))
        unit_types = UnitType.objects.all()
        for ut in unit_types:
            units_count = Unit.objects.filter(unit_type=ut).count()
            self.stdout.write(f'{ut.name} ({ut.landlord.full_name}): {units_count} units @ KES {ut.rent}/month')

        # Payment Methods
        self.stdout.write('\n' + self.style.HTTP_INFO('PAYMENT METHODS'))
        for method in ['mpesa', 'cash', 'bank']:
            count = Payment.objects.filter(payment_method=method).count()
            total = sum(p.amount for p in Payment.objects.filter(payment_method=method, status='completed'))
            self.stdout.write(f'{method.upper()}: {count} payments, KES {total} total')

        # Report Categories
        self.stdout.write('\n' + self.style.HTTP_INFO('MAINTENANCE CATEGORIES'))
        categories = Report.ISSUE_CATEGORIES
        for cat, label in categories:
            count = Report.objects.filter(issue_category=cat).count()
            if count > 0:
                self.stdout.write(f'{label}: {count} reports')

        # Occupancy Rate
        self.stdout.write('\n' + self.style.HTTP_INFO('OCCUPANCY STATISTICS'))
        total_units = Unit.objects.count()
        occupied = Unit.objects.filter(is_available=False).count()
        rate = (occupied / total_units * 100) if total_units > 0 else 0
        self.stdout.write(f'Total Units: {total_units}')
        self.stdout.write(f'Occupied: {occupied}')
        self.stdout.write(f'Available: {total_units - occupied}')
        self.stdout.write(f'Occupancy Rate: {rate:.1f}%')

        self.stdout.write('\n' + '='*70 + '\n')
