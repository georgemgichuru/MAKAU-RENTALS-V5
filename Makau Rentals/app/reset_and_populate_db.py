"""
Reset Database and Create Test Data
This script deletes all data except superusers and creates comprehensive test data
"""
import os
import sys
import django
from decimal import Decimal
from datetime import datetime, timedelta

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.utils import timezone
from accounts.models import (
    CustomUser, Property, Unit, UnitType, 
    Subscription, TenantProfile, TenantApplication
)
from payments.models import Payment, SubscriptionPayment
from communication.models import Report, ReminderSetting

User = get_user_model()

def delete_all_data_except_superusers():
    """Delete all data except superuser accounts"""
    print("\n" + "="*60)
    print("DELETING ALL DATA EXCEPT SUPERUSERS")
    print("="*60 + "\n")
    
    # Get superuser emails to preserve them
    superusers = list(User.objects.filter(is_superuser=True).values_list('email', flat=True))
    print(f"Preserving {len(superusers)} superuser(s): {', '.join(superusers)}\n")
    
    # Delete in order to respect foreign key constraints
    models_to_clear = [
        ('Reports', Report),
        ('Reminder Settings', ReminderSetting),
        ('Subscription Payments', SubscriptionPayment),
        ('Payments', Payment),
        ('Tenant Applications', TenantApplication),
        ('Tenant Profiles', TenantProfile),
        ('Units', Unit),
        ('Unit Types', UnitType),
        ('Properties', Property),
        ('Subscriptions', Subscription),
    ]
    
    for name, model in models_to_clear:
        count = model.objects.all().count()
        model.objects.all().delete()
        print(f"✓ Deleted {count} {name}")
    
    # Delete non-superuser users
    non_superusers = User.objects.filter(is_superuser=False)
    count = non_superusers.count()
    non_superusers.delete()
    print(f"✓ Deleted {count} non-superuser users")
    
    print("\n" + "="*60)
    print("DATABASE CLEANUP COMPLETE")
    print("="*60 + "\n")


def create_test_data():
    """Create comprehensive test data"""
    print("\n" + "="*60)
    print("CREATING TEST DATA")
    print("="*60 + "\n")
    
    # Ensure groups exist
    landlord_group, _ = Group.objects.get_or_create(name='landlord')
    tenant_group, _ = Group.objects.get_or_create(name='tenant')
    print("✓ Groups created/verified\n")
    
    # =================================================================
    # 1. CREATE LANDLORDS
    # =================================================================
    print("Creating Landlords...")
    print("-" * 60)
    
    landlord1 = User.objects.create_user(
        email='landlord1@test.com',
        full_name='John Smith',
        user_type='landlord',
        password='testpass123',
        phone_number='+254712345678',
        mpesa_till_number='5678901',
        address='123 Business Street, Nairobi',
        website='https://johnsmith-properties.com',
        reminder_mode='days_before',
        reminder_value=5
    )
    print(f"  ✓ Created {landlord1.full_name} - {landlord1.email}")
    print(f"    Landlord Code: {landlord1.landlord_code}")
    
    landlord2 = User.objects.create_user(
        email='landlord2@test.com',
        full_name='Sarah Johnson',
        user_type='landlord',
        password='testpass123',
        phone_number='+254723456789',
        mpesa_till_number='6789012',
        address='456 Property Avenue, Mombasa',
        website='https://sarahjohnson-realty.com',
        reminder_mode='fixed_day',
        reminder_value=28
    )
    print(f"  ✓ Created {landlord2.full_name} - {landlord2.email}")
    print(f"    Landlord Code: {landlord2.landlord_code}")
    
    # Upgrade landlord1 to basic plan
    landlord1.subscription.plan = 'basic'
    landlord1.subscription.expiry_date = timezone.now() + timedelta(days=90)
    landlord1.subscription.save()
    print(f"  ✓ Upgraded {landlord1.full_name} to Basic plan\n")
    
    # =================================================================
    # 2. CREATE PROPERTIES FOR LANDLORD 1
    # =================================================================
    print("Creating Properties for Landlord 1...")
    print("-" * 60)
    
    property1 = Property.objects.create(
        landlord=landlord1,
        name='Sunset Apartments',
        city='Nairobi',
        state='Nairobi County',
        unit_count=20
    )
    print(f"  ✓ Created {property1.name} ({property1.unit_count} units max)")
    
    property2 = Property.objects.create(
        landlord=landlord1,
        name='Green Valley Residences',
        city='Nairobi',
        state='Nairobi County',
        unit_count=15
    )
    print(f"  ✓ Created {property2.name} ({property2.unit_count} units max)\n")
    
    # =================================================================
    # 3. CREATE UNIT TYPES FOR LANDLORD 1
    # =================================================================
    print("Creating Unit Types for Landlord 1...")
    print("-" * 60)
    
    studio_type = UnitType.objects.create(
        landlord=landlord1,
        name='Studio',
        rent=Decimal('15000.00'),
        deposit=Decimal('15000.00'),
        number_of_units=5,
        description='Compact studio apartment with kitchenette'
    )
    print(f"  ✓ Created {studio_type.name} - KES {studio_type.rent}/month")
    
    one_bed_type = UnitType.objects.create(
        landlord=landlord1,
        name='1 Bedroom',
        rent=Decimal('25000.00'),
        deposit=Decimal('25000.00'),
        number_of_units=8,
        description='One bedroom apartment with living area'
    )
    print(f"  ✓ Created {one_bed_type.name} - KES {one_bed_type.rent}/month")
    
    two_bed_type = UnitType.objects.create(
        landlord=landlord1,
        name='2 Bedroom',
        rent=Decimal('35000.00'),
        deposit=Decimal('35000.00'),
        number_of_units=5,
        description='Spacious two bedroom apartment'
    )
    print(f"  ✓ Created {two_bed_type.name} - KES {two_bed_type.rent}/month\n")
    
    # =================================================================
    # 4. CREATE UNITS FOR PROPERTY 1
    # =================================================================
    print("Creating Units for Sunset Apartments...")
    print("-" * 60)
    
    units = []
    
    # Studio units (A1-A5)
    for i in range(1, 6):
        unit = Unit.objects.create(
            property_obj=property1,
            unit_code=f"SUN-A{i}",
            unit_number=f"A{i}",
            floor=1,
            bedrooms=0,
            bathrooms=1,
            unit_type=studio_type,
            rent=studio_type.rent,
            deposit=studio_type.deposit,
            is_available=True
        )
        units.append(unit)
    print(f"  ✓ Created 5 Studio units (A1-A5)")
    
    # 1 Bedroom units (B1-B8)
    for i in range(1, 9):
        unit = Unit.objects.create(
            property_obj=property1,
            unit_code=f"SUN-B{i}",
            unit_number=f"B{i}",
            floor=2 if i <= 4 else 3,
            bedrooms=1,
            bathrooms=1,
            unit_type=one_bed_type,
            rent=one_bed_type.rent,
            deposit=one_bed_type.deposit,
            is_available=True
        )
        units.append(unit)
    print(f"  ✓ Created 8 One Bedroom units (B1-B8)")
    
    # 2 Bedroom units (C1-C5)
    for i in range(1, 6):
        unit = Unit.objects.create(
            property_obj=property1,
            unit_code=f"SUN-C{i}",
            unit_number=f"C{i}",
            floor=4,
            bedrooms=2,
            bathrooms=2,
            unit_type=two_bed_type,
            rent=two_bed_type.rent,
            deposit=two_bed_type.deposit,
            is_available=True
        )
        units.append(unit)
    print(f"  ✓ Created 5 Two Bedroom units (C1-C5)")
    print(f"  Total units created: {len(units)}\n")
    
    # =================================================================
    # 5. CREATE TENANTS
    # =================================================================
    print("Creating Tenants...")
    print("-" * 60)
    
    tenants = []
    tenant_data = [
        ('tenant1@test.com', 'Michael Brown', '+254734567890', '12345678'),
        ('tenant2@test.com', 'Emma Wilson', '+254745678901', '23456789'),
        ('tenant3@test.com', 'David Miller', '+254756789012', '34567890'),
        ('tenant4@test.com', 'Lisa Anderson', '+254767890123', '45678901'),
        ('tenant5@test.com', 'James Taylor', '+254778901234', '56789012'),
        ('tenant6@test.com', 'Maria Garcia', '+254789012345', '67890123'),
    ]
    
    for email, name, phone, national_id in tenant_data:
        tenant = User.objects.create_user(
            email=email,
            full_name=name,
            user_type='tenant',
            password='testpass123',
            phone_number=phone,
            national_id=national_id,
            emergency_contact='+254700000000'
        )
        tenants.append(tenant)
        print(f"  ✓ Created {name} - {email}")
    
    print(f"\n  Total tenants created: {len(tenants)}\n")
    
    # =================================================================
    # 6. ASSIGN TENANTS TO UNITS & CREATE PROFILES
    # =================================================================
    print("Assigning Tenants to Units...")
    print("-" * 60)
    
    # Assign first 4 tenants to units
    assignments = [
        (tenants[0], units[0], -30),  # Studio A1 - assigned 30 days ago
        (tenants[1], units[5], -20),  # 1BR B1 - assigned 20 days ago
        (tenants[2], units[13], -10), # 2BR C1 - assigned 10 days ago
        (tenants[3], units[6], -5),   # 1BR B2 - assigned 5 days ago
    ]
    
    for tenant, unit, days_ago in assignments:
        unit.tenant = tenant
        unit.is_available = False
        unit.assigned_date = timezone.now() + timedelta(days=days_ago)
        unit.rent_due_date = (timezone.now() + timedelta(days=30)).date()
        unit.save()
        
        # Create tenant profile
        profile = TenantProfile.objects.create(
            tenant=tenant,
            landlord=landlord1,
            current_unit=unit,
            move_in_date=timezone.now() + timedelta(days=days_ago),
            lease_end_date=timezone.now() + timedelta(days=365),
            emergency_contact_name='Emergency Contact',
            emergency_contact_phone='+254700000000'
        )
        
        print(f"  ✓ Assigned {tenant.full_name} to Unit {unit.unit_number} ({unit.unit_type.name})")
    
    print(f"\n  Total units occupied: {len(assignments)}\n")
    
    # =================================================================
    # 7. CREATE TENANT APPLICATIONS
    # =================================================================
    print("Creating Tenant Applications...")
    print("-" * 60)
    
    # Pending application from tenant5 for an available studio
    app1 = TenantApplication.objects.create(
        tenant=tenants[4],
        landlord=landlord1,
        unit=units[1],  # Studio A2
        status='pending',
        already_living_in_property=False,
        deposit_required=True,
        deposit_paid=False,
        notes='Interested in moving in next month'
    )
    print(f"  ✓ Created PENDING application: {tenants[4].full_name} → Unit {units[1].unit_number}")
    
    # Approved application from tenant6 (but not yet moved in)
    app2 = TenantApplication.objects.create(
        tenant=tenants[5],
        landlord=landlord1,
        unit=units[2],  # Studio A3
        status='approved',
        already_living_in_property=False,
        deposit_required=True,
        deposit_paid=True,
        reviewed_at=timezone.now() - timedelta(days=2),
        notes='Ready to move in'
    )
    print(f"  ✓ Created APPROVED application: {tenants[5].full_name} → Unit {units[2].unit_number}\n")
    
    # =================================================================
    # 8. CREATE PAYMENTS
    # =================================================================
    print("Creating Payments...")
    print("-" * 60)
    
    # Deposit payments for assigned tenants
    for i, (tenant, unit, days_ago) in enumerate(assignments):
        payment = Payment.objects.create(
            tenant=tenant,
            unit=unit,
            payment_type='deposit',
            amount=unit.deposit,
            status='completed',
            payment_method='mpesa',
            mpesa_receipt=f'QFR{1000000 + i}XYZ',
            description=f'Deposit payment for unit {unit.unit_number}',
            created_at=timezone.now() + timedelta(days=days_ago)
        )
        print(f"  ✓ Deposit: {tenant.full_name} paid KES {payment.amount} for Unit {unit.unit_number}")
    
    # Rent payments (some paid, some pending)
    # Tenant 1 - paid full rent
    rent1 = Payment.objects.create(
        tenant=tenants[0],
        unit=units[0],
        payment_type='rent',
        amount=units[0].rent,
        status='completed',
        payment_method='mpesa',
        mpesa_receipt='QFR2000001XYZ',
        description='Monthly rent payment',
        created_at=timezone.now() - timedelta(days=5)
    )
    units[0].rent_paid = units[0].rent
    units[0].rent_remaining = Decimal('0.00')
    units[0].save()
    print(f"  ✓ Rent: {tenants[0].full_name} paid KES {rent1.amount} (FULL)")
    
    # Tenant 2 - paid partial rent
    rent2 = Payment.objects.create(
        tenant=tenants[1],
        unit=units[5],
        payment_type='rent',
        amount=Decimal('15000.00'),
        status='completed',
        payment_method='mpesa',
        mpesa_receipt='QFR2000002XYZ',
        description='Partial rent payment',
        created_at=timezone.now() - timedelta(days=3)
    )
    units[5].rent_paid = Decimal('15000.00')
    units[5].rent_remaining = units[5].rent - Decimal('15000.00')
    units[5].save()
    print(f"  ✓ Rent: {tenants[1].full_name} paid KES {rent2.amount} (PARTIAL - {units[5].rent_remaining} remaining)")
    
    # Tenant 3 - pending rent payment
    rent3 = Payment.objects.create(
        tenant=tenants[2],
        unit=units[13],
        payment_type='rent',
        amount=units[13].rent,
        status='pending',
        payment_method='mpesa',
        description='Pending monthly rent payment'
    )
    units[13].rent_remaining = units[13].rent
    units[13].save()
    print(f"  ✓ Rent: {tenants[2].full_name} has PENDING payment of KES {rent3.amount}")
    
    print()
    
    # =================================================================
    # 9. CREATE SUBSCRIPTION PAYMENT
    # =================================================================
    print("Creating Subscription Payment...")
    print("-" * 60)
    
    sub_payment = SubscriptionPayment.objects.create(
        user=landlord1,
        amount=Decimal('2500.00'),
        mpesa_receipt_number='QFR3000001XYZ',
        subscription_type='basic',
        status='Success',
        transaction_date=timezone.now() - timedelta(days=30)
    )
    print(f"  ✓ Subscription payment for {landlord1.full_name}: KES {sub_payment.amount} (Basic plan)\n")
    
    # =================================================================
    # 10. CREATE MAINTENANCE REPORTS
    # =================================================================
    print("Creating Maintenance Reports...")
    print("-" * 60)
    
    # Open report - urgent
    report1 = Report.objects.create(
        tenant=tenants[0],
        unit=units[0],
        issue_category='plumbing',
        priority_level='urgent',
        issue_title='Leaking pipe in bathroom',
        description='The pipe under the sink is leaking water constantly',
        status='open',
        assigned_to=landlord1,
        estimated_cost=Decimal('5000.00')
    )
    print(f"  ✓ OPEN Report: {report1.issue_title} (Priority: {report1.priority_level})")
    
    # In progress report
    report2 = Report.objects.create(
        tenant=tenants[1],
        unit=units[5],
        issue_category='electrical',
        priority_level='high',
        issue_title='Faulty light switches in bedroom',
        description='Two light switches are not working properly',
        status='in_progress',
        assigned_to=landlord1,
        estimated_cost=Decimal('3000.00'),
        reported_date=timezone.now() - timedelta(days=3)
    )
    print(f"  ✓ IN PROGRESS Report: {report2.issue_title} (Priority: {report2.priority_level})")
    
    # Resolved report
    report3 = Report.objects.create(
        tenant=tenants[2],
        unit=units[13],
        issue_category='wifi',
        priority_level='medium',
        issue_title='WiFi not working',
        description='Cannot connect to WiFi network',
        status='resolved',
        assigned_to=landlord1,
        estimated_cost=Decimal('1000.00'),
        actual_cost=Decimal('500.00'),
        reported_date=timezone.now() - timedelta(days=10),
        resolved_date=timezone.now() - timedelta(days=2)
    )
    print(f"  ✓ RESOLVED Report: {report3.issue_title} (Cost: KES {report3.actual_cost})\n")
    
    # =================================================================
    # 11. CREATE REMINDER SETTINGS
    # =================================================================
    print("Creating Reminder Settings...")
    print("-" * 60)
    
    reminder = ReminderSetting.objects.create(
        landlord=landlord1,
        days_of_month=[1, 15, 28],
        subject='Monthly Rent Reminder',
        message=(
            "Dear Tenant,\n\n"
            "This is a friendly reminder that your rent payment is due soon.\n\n"
            "Please ensure payment is made by the due date to avoid any penalties.\n\n"
            "Thank you for your cooperation.\n\n"
            "Best regards,\n"
            f"{landlord1.full_name}\n"
            "Sunset Apartments"
        ),
        send_email=True,
        send_sms=False,
        active=True
    )
    print(f"  ✓ Reminder settings for {landlord1.full_name}")
    print(f"    Days: {reminder.days_of_month}")
    print(f"    Email: {reminder.send_email}, SMS: {reminder.send_sms}\n")
    
    # =================================================================
    # SUMMARY
    # =================================================================
    print("\n" + "="*60)
    print("TEST DATA CREATION COMPLETE")
    print("="*60)
    print("\nSUMMARY:")
    print("-" * 60)
    print(f"Landlords:              {User.objects.filter(user_type='landlord').count()}")
    print(f"Tenants:                {User.objects.filter(user_type='tenant').count()}")
    print(f"Properties:             {Property.objects.count()}")
    print(f"Unit Types:             {UnitType.objects.count()}")
    print(f"Units:                  {Unit.objects.count()}")
    print(f"  - Occupied:           {Unit.objects.filter(is_available=False).count()}")
    print(f"  - Available:          {Unit.objects.filter(is_available=True).count()}")
    print(f"Tenant Profiles:        {TenantProfile.objects.count()}")
    print(f"Tenant Applications:    {TenantApplication.objects.count()}")
    print(f"  - Pending:            {TenantApplication.objects.filter(status='pending').count()}")
    print(f"  - Approved:           {TenantApplication.objects.filter(status='approved').count()}")
    print(f"Payments:               {Payment.objects.count()}")
    print(f"  - Completed:          {Payment.objects.filter(status='completed').count()}")
    print(f"  - Pending:            {Payment.objects.filter(status='pending').count()}")
    print(f"Subscription Payments:  {SubscriptionPayment.objects.count()}")
    print(f"Reports:                {Report.objects.count()}")
    print(f"  - Open:               {Report.objects.filter(status='open').count()}")
    print(f"  - In Progress:        {Report.objects.filter(status='in_progress').count()}")
    print(f"  - Resolved:           {Report.objects.filter(status='resolved').count()}")
    print(f"Reminder Settings:      {ReminderSetting.objects.count()}")
    
    print("\n" + "="*60)
    print("TEST CREDENTIALS")
    print("="*60)
    print("\nLANDLORDS:")
    print(f"  Email:    landlord1@test.com")
    print(f"  Password: testpass123")
    print(f"  Code:     {landlord1.landlord_code}")
    print()
    print(f"  Email:    landlord2@test.com")
    print(f"  Password: testpass123")
    print(f"  Code:     {landlord2.landlord_code}")
    
    print("\nTENANTS:")
    for i, tenant in enumerate(tenants[:4], 1):
        print(f"  Email:    {tenant.email}")
        print(f"  Password: testpass123")
        if tenant.tenant_profile:
            print(f"  Unit:     {tenant.tenant_profile.current_unit.unit_number}")
        print()
    
    print("="*60 + "\n")


if __name__ == '__main__':
    try:
        # Ask for confirmation
        print("\n" + "!"*60)
        print("WARNING: This will DELETE ALL DATA except superusers!")
        print("!"*60 + "\n")
        
        confirm = input("Are you sure you want to continue? Type 'yes' to proceed: ")
        
        if confirm.lower() == 'yes':
            delete_all_data_except_superusers()
            create_test_data()
            print("✅ Database reset and test data creation completed successfully!")
        else:
            print("❌ Operation cancelled.")
            
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
