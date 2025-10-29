import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app.settings')
django.setup()

from accounts.models import CustomUser, TenantProfile

try:
    tenant = CustomUser.objects.get(id=47)
    print(f"✅ Tenant found: {tenant.email}")
    print(f"✅ Full name: {tenant.full_name}")
    print(f"✅ Is tenant: {tenant.is_tenant}")
    print(f"✅ Groups: {list(tenant.groups.values_list('name', flat=True))}")
    
    profile = TenantProfile.objects.filter(tenant_id=47).first()
    print(f"\n🔍 Has TenantProfile: {profile is not None}")
    
    if profile:
        print(f"✅ Landlord: {profile.landlord.email} (ID: {profile.landlord.id})")
        print(f"✅ Landlord name: {profile.landlord.full_name}")
    else:
        print("❌ No TenantProfile found for this tenant")
        
except CustomUser.DoesNotExist:
    print("❌ Tenant with ID 47 not found")
except Exception as e:
    print(f"❌ Error: {e}")
