import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app.settings')
django.setup()

from accounts.models import CustomUser, TenantApplication

print("=" * 60)
print("ACTIVE TENANTS WITHOUT APPLICATIONS (BUG)")
print("=" * 60)

# Find all active tenants without applications
active_tenants = CustomUser.objects.filter(groups__name='tenant', is_active=True)
buggy_tenants = []

for tenant in active_tenants:
    application = TenantApplication.objects.filter(tenant=tenant).first()
    if not application:
        buggy_tenants.append(tenant)
        print(f"\n✗ {tenant.email} ({tenant.full_name})")
        print(f"  Registered: {tenant.date_joined.strftime('%Y-%m-%d %H:%M')}")
        print(f"  Active: Yes (SHOULD BE PENDING!)")
        print(f"  Application: MISSING")

print(f"\n{'=' * 60}")
print(f"Total buggy tenants: {len(buggy_tenants)}")
print("=" * 60)

if buggy_tenants:
    print("\nFIX: These tenants should be:")
    print("  1. Deactivated (is_active = False)")
    print("  2. Have TenantApplication created with status='pending'")
    
    fix = input("\nDo you want to fix these tenants? (yes/no): ").strip().lower()
    
    if fix == 'yes':
        for tenant in buggy_tenants:
            # Deactivate tenant
            tenant.is_active = False
            tenant.save()
            
            # Create application
            try:
                from accounts.models import TenantProfile
                profile = TenantProfile.objects.get(tenant=tenant)
                
                TenantApplication.objects.create(
                    tenant=tenant,
                    landlord=profile.landlord,
                    unit=profile.current_unit,
                    already_living_in_property=False,
                    deposit_required=True,
                    deposit_paid=False,
                    status='pending'
                )
                print(f"✓ Fixed {tenant.email}")
            except Exception as e:
                print(f"✗ Error fixing {tenant.email}: {str(e)}")
        
        print(f"\n✓ Fixed {len(buggy_tenants)} tenant(s)")
else:
    print("\n✓ No buggy tenants found - all active tenants have applications!")
