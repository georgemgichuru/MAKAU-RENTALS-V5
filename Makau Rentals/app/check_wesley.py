#!/usr/bin/env python
"""
Check Wesley Tenant status
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app.settings')
django.setup()

from accounts.models import CustomUser

tenant = CustomUser.objects.get(email='mpkggamer@gmail.com')
print(f"Email: {tenant.email}")
print(f"Name: {tenant.full_name}")
print(f"is_active: {tenant.is_active}")
print(f"ID: {tenant.id}")
