#!/usr/bin/env python
"""
Check pending tenant applications
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app.settings')
django.setup()

from accounts.models import CustomUser, TenantApplication

def main():
    print("=" * 60)
    print("PENDING TENANT APPLICATIONS CHECK")
    print("=" * 60)
    
    # Check inactive tenants
    inactive_tenants = CustomUser.objects.filter(user_type='tenant', is_active=False)
    print(f"\n✓ Inactive tenants: {inactive_tenants.count()}")
    for tenant in inactive_tenants:
        print(f"  - {tenant.full_name} ({tenant.email})")
    
    # Check pending applications
    pending_apps = TenantApplication.objects.filter(status='pending')
    print(f"\n✓ Pending applications: {pending_apps.count()}")
    for app in pending_apps:
        print(f"  - {app.tenant.full_name} ({app.tenant.email})")
        print(f"    Unit: {app.unit.unit_number if app.unit else 'Not assigned'}")
        print(f"    Deposit Required: {app.deposit_required}")
        print(f"    Deposit Paid: {app.deposit_paid}")
        print(f"    Already Living: {app.already_living_in_property}")
        print(f"    Applied: {app.applied_at}")
        print()
    
    # Check approved applications
    approved_apps = TenantApplication.objects.filter(status='approved')
    print(f"✓ Approved applications: {approved_apps.count()}")
    
    print("\n" + "=" * 60)

if __name__ == '__main__':
    main()
