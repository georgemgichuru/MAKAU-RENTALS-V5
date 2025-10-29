import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app.settings')
django.setup()

from accounts.models import CustomUser, TenantApplication

print("=== Checking Tenant Status ===\n")

inactive = CustomUser.objects.filter(groups__name='tenant', is_active=False)
print(f'Inactive tenants: {inactive.count()}')
for t in inactive:
    print(f'  - {t.email}')

print()

pending = TenantApplication.objects.filter(status='pending')
print(f'Pending applications: {pending.count()}')
for app in pending:
    print(f'  - {app.tenant.email} -> Landlord: {app.landlord.email}')

print("\n✓ Done!")
