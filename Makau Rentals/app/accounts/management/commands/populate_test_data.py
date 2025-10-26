"""
Management command to populate the database with comprehensive test data
Usage: python manage.py populate_test_data
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
import random
from accounts.models import CustomUser, Property, UnitType, Unit, TenantProfile, Subscription
from payments.models import Payment, SubscriptionPayment
from communication.models import Report


class Command(BaseCommand):
    help = 'Populates the database with comprehensive test data'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Starting database population...'))
        
        # Clear existing data (optional - be careful!)
        if input("Do you want to clear existing data? (yes/no): ").lower() == 'yes':
            self.clear_data()
        
        # Create test data
        landlords = self.create_landlords()
        properties = self.create_properties(landlords)
        unit_types = self.create_unit_types(landlords)
        units = self.create_units(properties, unit_types)
        tenants = self.create_tenants(landlords, units)
        self.create_payments(tenants, units)
        self.create_reports(tenants, units)
        
        self.stdout.write(self.style.SUCCESS('✅ Database population completed successfully!'))
        self.print_summary()

    def clear_data(self):
        """Clear existing test data"""
        self.stdout.write(self.style.WARNING('Clearing existing data...'))
        Report.objects.all().delete()
        Payment.objects.all().delete()
        SubscriptionPayment.objects.all().delete()
        TenantProfile.objects.all().delete()
        Unit.objects.all().delete()
        UnitType.objects.all().delete()
        Property.objects.all().delete()
        Subscription.objects.all().delete()
        CustomUser.objects.filter(email__contains='test').delete()
        self.stdout.write(self.style.SUCCESS('Data cleared.'))

    def create_landlords(self):
        """Create test landlords with different subscription levels"""
        self.stdout.write('Creating landlords...')
        landlords = []
        
        landlord_data = [
            {
                'email': 'landlord1@test.com',
                'full_name': 'John Kamau',
                'national_id': '12345678',
                'phone_number': '+254712345678',
                'mpesa_till_number': '123456',
                'address': 'Nairobi, Kenya',
                'website': 'https://kamamproperties.com',
                'plan': 'professional'
            },
            {
                'email': 'landlord2@test.com',
                'full_name': 'Mary Wanjiku',
                'national_id': '23456789',
                'phone_number': '+254723456789',
                'mpesa_till_number': '234567',
                'address': 'Mombasa, Kenya',
                'website': None,
                'plan': 'basic'
            },
            {
                'email': 'landlord3@test.com',
                'full_name': 'Peter Omondi',
                'national_id': '34567890',
                'phone_number': '+254734567890',
                'mpesa_till_number': None,
                'address': 'Kisumu, Kenya',
                'website': None,
                'plan': 'starter'
            },
        ]
        
        for data in landlord_data:
            plan = data.pop('plan')
            landlord = CustomUser.objects.create_user(
                email=data['email'],
                full_name=data['full_name'],
                user_type='landlord',
                password='Test123!',
                **{k: v for k, v in data.items() if k != 'email' and k != 'full_name'}
            )
            
            # Update subscription plan
            if hasattr(landlord, 'subscription'):
                subscription = landlord.subscription
                subscription.plan = plan
                subscription.save()
            
            landlords.append(landlord)
            self.stdout.write(f'  ✓ Created landlord: {landlord.full_name} ({landlord.landlord_code})')
        
        return landlords

    def create_properties(self, landlords):
        """Create properties for each landlord"""
        self.stdout.write('Creating properties...')
        properties = []
        
        property_templates = [
            ('Greenview Apartments', 'Nairobi', 'Nairobi County', 20),
            ('Sunset Towers', 'Westlands', 'Nairobi County', 15),
            ('Ocean View Plaza', 'Mombasa', 'Mombasa County', 25),
            ('Lakeside Residences', 'Kisumu', 'Kisumu County', 10),
            ('Garden Estate', 'Karen', 'Nairobi County', 12),
            ('City Center Apartments', 'CBD', 'Nairobi County', 18),
        ]
        
        for landlord in landlords:
            # Each landlord gets 2-3 properties
            num_properties = random.randint(2, 3)
            for i in range(num_properties):
                template = random.choice(property_templates)
                prop = Property.objects.create(
                    landlord=landlord,
                    name=f"{template[0]} - {landlord.full_name.split()[0]}",
                    city=template[1],
                    state=template[2],
                    unit_count=template[3]
                )
                properties.append(prop)
                self.stdout.write(f'  ✓ Created property: {prop.name} ({prop.unit_count} units)')
        
        return properties

    def create_unit_types(self, landlords):
        """Create unit types for each landlord"""
        self.stdout.write('Creating unit types...')
        unit_types = []
        
        type_templates = [
            ('Studio', 8000, 8000, 'Compact studio apartment with kitchenette'),
            ('1-Bedroom', 12000, 12000, 'One bedroom apartment with living room'),
            ('2-Bedroom', 18000, 18000, 'Two bedroom apartment with balcony'),
            ('3-Bedroom', 25000, 25000, 'Spacious three bedroom apartment'),
            ('Bedsitter', 6000, 6000, 'Single room with attached bathroom'),
        ]
        
        for landlord in landlords:
            # Each landlord gets 3-4 unit types
            num_types = random.randint(3, 4)
            selected_types = random.sample(type_templates, num_types)
            
            for name, rent, deposit, desc in selected_types:
                # Add some price variation
                rent_variation = Decimal(random.randint(-1000, 2000))
                unit_type = UnitType.objects.create(
                    landlord=landlord,
                    name=name,
                    rent=Decimal(rent) + rent_variation,
                    deposit=Decimal(deposit) + rent_variation,
                    description=desc,
                    number_of_units=0
                )
                unit_types.append(unit_type)
                self.stdout.write(f'  ✓ Created unit type: {unit_type.name} - KES {unit_type.rent}')
        
        return unit_types

    def create_units(self, properties, unit_types):
        """Create units for each property"""
        self.stdout.write('Creating units...')
        units = []
        
        for prop in properties:
            landlord_types = [ut for ut in unit_types if ut.landlord == prop.landlord]
            
            for i in range(1, prop.unit_count + 1):
                unit_type = random.choice(landlord_types)
                floor = (i - 1) // 4 + 1  # 4 units per floor
                
                # Create unique unit code using property ID and unit number
                import uuid
                unique_suffix = str(uuid.uuid4())[:8].upper()
                unit_code = f"{prop.id}-{i:03d}-{unique_suffix}"
                
                unit = Unit.objects.create(
                    property_obj=prop,
                    unit_code=unit_code,
                    unit_number=str(i),
                    floor=floor,
                    bedrooms=self._get_bedrooms(unit_type.name),
                    bathrooms=random.randint(1, 2),
                    unit_type=unit_type,
                    rent=unit_type.rent,
                    deposit=unit_type.deposit,
                    is_available=random.choice([True, True, True, False]),  # 75% available
                )
                units.append(unit)
        
        self.stdout.write(f'  ✓ Created {len(units)} units')
        return units

    def _get_bedrooms(self, unit_type_name):
        """Extract number of bedrooms from unit type name"""
        if 'Studio' in unit_type_name or 'Bedsitter' in unit_type_name:
            return 0
        elif '1-Bedroom' in unit_type_name:
            return 1
        elif '2-Bedroom' in unit_type_name:
            return 2
        elif '3-Bedroom' in unit_type_name:
            return 3
        return 1

    def create_tenants(self, landlords, units):
        """Create tenants and assign them to units"""
        self.stdout.write('Creating tenants...')
        tenants = []
        
        first_names = ['James', 'Sarah', 'Michael', 'Grace', 'David', 'Lucy', 
                      'Daniel', 'Faith', 'Joseph', 'Anne', 'Brian', 'Jane']
        last_names = ['Mwangi', 'Ochieng', 'Kipchoge', 'Akinyi', 'Njoroge', 
                     'Wanjiru', 'Otieno', 'Chebet', 'Kariuki', 'Adhiambo']
        
        # Get occupied units (is_available=False)
        occupied_units = [u for u in units if not u.is_available]
        
        for idx, unit in enumerate(occupied_units, 1):
            landlord = unit.property_obj.landlord
            
            # Create tenant
            first_name = random.choice(first_names)
            last_name = random.choice(last_names)
            
            tenant = CustomUser.objects.create_user(
                email=f'tenant{idx}@test.com',
                full_name=f'{first_name} {last_name}',
                user_type='tenant',
                password='Test123!',
                national_id=f'{random.randint(10000000, 99999999)}',
                phone_number=f'+2547{random.randint(10000000, 99999999)}',
                emergency_contact=f'+2547{random.randint(10000000, 99999999)}'
            )
            
            # Create tenant profile
            move_in_date = timezone.now() - timedelta(days=random.randint(30, 365))
            lease_end_date = move_in_date + timedelta(days=365)
            
            TenantProfile.objects.create(
                tenant=tenant,
                landlord=landlord,
                current_unit=unit,
                move_in_date=move_in_date,
                lease_end_date=lease_end_date,
                emergency_contact_name=f'Emergency {random.choice(first_names)}',
                emergency_contact_phone=tenant.emergency_contact
            )
            
            # Assign tenant to unit
            unit.tenant = tenant
            unit.assigned_date = move_in_date
            
            # Set payment status
            payment_scenarios = [
                ('paid', 0, unit.rent),  # Fully paid
                ('partial', unit.rent * Decimal('0.5'), unit.rent * Decimal('0.5')),  # Half paid
                ('unpaid', 0, 0),  # Not paid
            ]
            
            scenario = random.choice(payment_scenarios)
            unit.rent_paid = scenario[1]
            unit.rent_remaining = unit.rent - unit.rent_paid
            unit.rent_due_date = timezone.now().date() + timedelta(days=random.randint(1, 30))
            unit.save()
            
            tenants.append(tenant)
            self.stdout.write(f'  ✓ Created tenant: {tenant.full_name} -> Unit {unit.unit_number}')
        
        return tenants

    def create_payments(self, tenants, units):
        """Create payment records"""
        self.stdout.write('Creating payments...')
        payment_count = 0
        
        for tenant in tenants:
            # Get tenant's current unit through profile
            try:
                profile = tenant.tenant_profile
                unit = profile.current_unit
                
                if not unit:
                    continue
                
                # Create 2-5 historical payments
                num_payments = random.randint(2, 5)
                
                for i in range(num_payments):
                    payment_date = timezone.now() - timedelta(days=random.randint(1, 180))
                    
                    payment_type = random.choice(['rent', 'rent', 'rent', 'deposit', 'maintenance'])
                    
                    if payment_type == 'rent':
                        amount = unit.rent
                    elif payment_type == 'deposit':
                        amount = unit.deposit
                    else:
                        amount = Decimal(random.randint(500, 5000))
                    
                    status = random.choice(['completed', 'completed', 'completed', 'pending', 'failed'])
                    
                    payment = Payment.objects.create(
                        tenant=tenant,
                        unit=unit,
                        payment_type=payment_type,
                        amount=amount,
                        status=status,
                        mpesa_receipt=f'MPE{random.randint(100000, 999999)}' if status == 'completed' else None,
                        payment_method=random.choice(['mpesa', 'mpesa', 'cash', 'bank']),
                        description=f'{payment_type.capitalize()} payment for {unit.property_obj.name} Unit {unit.unit_number}',
                        created_at=payment_date
                    )
                    payment_count += 1
            
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'  ⚠ Could not create payments for {tenant.full_name}: {e}'))
        
        self.stdout.write(f'  ✓ Created {payment_count} payments')

    def create_reports(self, tenants, units):
        """Create maintenance reports"""
        self.stdout.write('Creating maintenance reports...')
        report_count = 0
        
        issue_templates = [
            ('electrical', 'Power outage in unit', 'The main circuit breaker keeps tripping'),
            ('plumbing', 'Leaking pipe', 'Water dripping from bathroom ceiling'),
            ('noise', 'Noisy neighbors', 'Excessive noise from upstairs unit'),
            ('wifi', 'Internet not working', 'WiFi connection drops frequently'),
            ('maintenance', 'Broken window', 'Bedroom window pane is cracked'),
            ('pest', 'Cockroach infestation', 'Seeing cockroaches in the kitchen'),
            ('security', 'Broken door lock', 'Main door lock is jammed'),
            ('cleanliness', 'Garbage disposal issue', 'Garbage not collected for 3 days'),
        ]
        
        for tenant in tenants:
            try:
                profile = tenant.tenant_profile
                unit = profile.current_unit
                
                if not unit:
                    continue
                
                # Create 0-3 reports per tenant
                num_reports = random.randint(0, 3)
                
                for i in range(num_reports):
                    template = random.choice(issue_templates)
                    reported_date = timezone.now() - timedelta(days=random.randint(1, 60))
                    
                    status = random.choice(['open', 'in_progress', 'resolved', 'closed'])
                    
                    report = Report.objects.create(
                        tenant=tenant,
                        unit=unit,
                        issue_category=template[0],
                        issue_title=template[1],
                        description=template[2],
                        status=status,
                        reported_date=reported_date,
                        resolved_date=reported_date + timedelta(days=random.randint(1, 14)) if status in ['resolved', 'closed'] else None,
                        assigned_to=unit.property_obj.landlord if status != 'open' else None,
                        estimated_cost=Decimal(random.randint(1000, 10000)) if status != 'open' else None,
                        actual_cost=Decimal(random.randint(1000, 10000)) if status in ['resolved', 'closed'] else None
                    )
                    report_count += 1
            
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'  ⚠ Could not create reports for {tenant.full_name}: {e}'))
        
        self.stdout.write(f'  ✓ Created {report_count} maintenance reports')

    def print_summary(self):
        """Print summary of created data"""
        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.SUCCESS('DATABASE POPULATION SUMMARY'))
        self.stdout.write('='*50)
        
        landlords = CustomUser.objects.filter(user_type='landlord', email__contains='test')
        tenants = CustomUser.objects.filter(user_type='tenant', email__contains='test')
        
        self.stdout.write(f'Landlords: {landlords.count()}')
        for landlord in landlords:
            self.stdout.write(f'  📧 {landlord.email} / Password: Test123!')
            self.stdout.write(f'     Code: {landlord.landlord_code}')
            self.stdout.write(f'     Plan: {landlord.subscription.plan if hasattr(landlord, "subscription") else "None"}')
        
        self.stdout.write(f'\nTenants: {tenants.count()}')
        for tenant in tenants[:5]:  # Show first 5
            self.stdout.write(f'  📧 {tenant.email} / Password: Test123!')
        if tenants.count() > 5:
            self.stdout.write(f'  ... and {tenants.count() - 5} more')
        
        self.stdout.write(f'\nProperties: {Property.objects.count()}')
        self.stdout.write(f'Unit Types: {UnitType.objects.count()}')
        self.stdout.write(f'Units: {Unit.objects.count()}')
        self.stdout.write(f'  - Available: {Unit.objects.filter(is_available=True).count()}')
        self.stdout.write(f'  - Occupied: {Unit.objects.filter(is_available=False).count()}')
        self.stdout.write(f'Payments: {Payment.objects.count()}')
        self.stdout.write(f'Reports: {Report.objects.count()}')
        
        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.SUCCESS('You can now log in with any of the test accounts!'))
        self.stdout.write('='*50 + '\n')
