import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app.settings')
django.setup()

from accounts.models import CustomUser, TenantApplication, TenantProfile

# Fix tenants without TenantProfile
tenants_without_profile = ['gegejeb@gmail.com', 'mzee@mail.com']

for email in tenants_without_profile:
    try:
        tenant = CustomUser.objects.get(email=email)
        
        # Check if they already have a profile
        profile = TenantProfile.objects.filter(tenant=tenant).first()
        if profile:
            print(f"✓ {email} already has a profile")
            continue
        
        # Deactivate tenant
        tenant.is_active = False
        tenant.save()
        
        print(f"✗ {email} deactivated - no TenantProfile, cannot create application")
        print(f"  This tenant registered with old flow - needs manual review")
        
    except CustomUser.DoesNotExist:
        print(f"✗ {email} not found")
    except Exception as e:
        print(f"✗ Error with {email}: {str(e)}")

print("\n✓ All tenants without profiles have been deactivated")
print("  They will see 'pending approval' message when trying to login")
