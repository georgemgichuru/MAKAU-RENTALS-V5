#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app.settings')
django.setup()

from accounts.models import CustomUser
from accounts.serializers import TenantWithUnitSerializer

u = CustomUser.objects.get(email='mpkggamer@gmail.com')
print('User is_active:', u.is_active)
print('Serialized:', TenantWithUnitSerializer(u).data)
