import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app.settings')
django.setup()

from accounts.models import CustomUser, TenantApplication

print("=" * 60)
print("TENANT ACCOUNT STATUS CHECK")
print("=" * 60)

# Get all tenant accounts
tenants = CustomUser.objects.filter(groups__name='tenant').order_by('-date_joined')

print(f"\nTotal tenants in system: {tenants.count()}\n")

for tenant in tenants[:10]:  # Show last 10 tenants
    try:
        application = TenantApplication.objects.filter(tenant=tenant).first()
        
        print(f"Email: {tenant.email}")
        print(f"  Name: {tenant.full_name}")
        print(f"  Active: {'✓ Yes' if tenant.is_active else '✗ No (PENDING APPROVAL)'}")
        print(f"  Registered: {tenant.date_joined.strftime('%Y-%m-%d %H:%M')}")
        
        if application:
            print(f"  Application Status: {application.status}")
            print(f"  Deposit Paid: {'Yes' if application.deposit_paid else 'No'}")
            print(f"  Already Living: {'Yes' if application.already_living_in_property else 'No'}")
        else:
            print(f"  Application: None")
        
        print()
        
    except Exception as e:
        print(f"  Error: {str(e)}\n")

print("=" * 60)
print("\nINACTIVE TENANTS (Should see pending approval message):")
print("=" * 60)
inactive = CustomUser.objects.filter(groups__name='tenant', is_active=False)
for tenant in inactive:
    print(f"  - {tenant.email}")

print(f"\nTotal inactive tenants: {inactive.count()}")
print("\n✓ These tenants will see: 'Your account is pending approval. Please await approval from your landlord or contact us for support.'")
