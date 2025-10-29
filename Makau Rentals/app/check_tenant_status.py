#!/usr/bin/env python
"""
Check tenant status after approval
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app.settings')
django.setup()

from accounts.models import CustomUser, TenantApplication

def main():
    print("=" * 60)
    print("TENANT STATUS CHECK")
    print("=" * 60)
    
    # Check all tenants
    all_tenants = CustomUser.objects.filter(user_type='tenant')
    print(f"\nTotal tenants: {all_tenants.count()}")
    
    for tenant in all_tenants:
        apps = TenantApplication.objects.filter(tenant=tenant)
        app_status = apps.first().status if apps.exists() else 'No application'
        
        print(f"\n{'='*50}")
        print(f"Name: {tenant.full_name}")
        print(f"Email: {tenant.email}")
        print(f"ID: {tenant.id}")
        print(f"is_active: {tenant.is_active}")
        print(f"Application status: {app_status}")
        
        if apps.exists():
            for app in apps:
                print(f"  - App ID: {app.id}, Status: {app.status}, Applied: {app.applied_at}")

if __name__ == '__main__':
    main()
