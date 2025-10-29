#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app.settings')
django.setup()

from accounts.models import CustomUser
from accounts.serializers import TenantWithUnitSerializer

# Find a landlord with tenants
landlord = CustomUser.objects.filter(groups__name='landlord').first()
print(f"Landlord: {landlord.full_name} ({landlord.email})")

tenants = CustomUser.objects.filter(tenant_profile__landlord=landlord, groups__name='tenant')
print(f"Tenants count: {tenants.count()}")

serialized = TenantWithUnitSerializer(tenants, many=True).data
print('Serialized sample:')
for t in serialized[:3]:
    print({k: t.get(k) for k in ['id','full_name','email','is_active','rent_status','deposit_paid']})
