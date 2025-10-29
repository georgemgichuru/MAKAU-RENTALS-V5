"""Quick database verification script"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app.settings')
django.setup()

from accounts.models import CustomUser, Unit, TenantProfile, TenantApplication
from payments.models import Payment, SubscriptionPayment
from communication.models import Report

print("\n" + "="*60)
print("DATABASE VERIFICATION")
print("="*60 + "\n")

print(f"Total Users:          {CustomUser.objects.count()}")
print(f"  - Superusers:       {CustomUser.objects.filter(is_superuser=True).count()}")
print(f"  - Landlords:        {CustomUser.objects.filter(user_type='landlord').count()}")
print(f"  - Tenants:          {CustomUser.objects.filter(user_type='tenant').count()}")

print(f"\nUnits:                {Unit.objects.count()}")
print(f"  - Occupied:         {Unit.objects.filter(is_available=False).count()}")
print(f"  - Available:        {Unit.objects.filter(is_available=True).count()}")

print(f"\nTenant Profiles:      {TenantProfile.objects.count()}")
print(f"Applications:         {TenantApplication.objects.count()}")

print(f"\nPayments:             {Payment.objects.count()}")
print(f"  - Completed:        {Payment.objects.filter(status='completed').count()}")
print(f"  - Pending:          {Payment.objects.filter(status='pending').count()}")

print(f"\nSubscription Payments: {SubscriptionPayment.objects.count()}")

print(f"\nReports:              {Report.objects.count()}")
print(f"  - Open:             {Report.objects.filter(status='open').count()}")
print(f"  - In Progress:      {Report.objects.filter(status='in_progress').count()}")
print(f"  - Resolved:         {Report.objects.filter(status='resolved').count()}")

print("\n" + "="*60)
print("Sample Landlord:")
landlord = CustomUser.objects.filter(user_type='landlord').first()
if landlord:
    print(f"  Name:  {landlord.full_name}")
    print(f"  Email: {landlord.email}")
    print(f"  Code:  {landlord.landlord_code}")

print("\nSample Tenant:")
tenant = CustomUser.objects.filter(user_type='tenant').first()
if tenant:
    print(f"  Name:  {tenant.full_name}")
    print(f"  Email: {tenant.email}")
    if hasattr(tenant, 'tenant_profile') and tenant.tenant_profile:
        print(f"  Unit:  {tenant.tenant_profile.current_unit.unit_number if tenant.tenant_profile.current_unit else 'Not assigned'}")

print("\n" + "="*60 + "\n")
