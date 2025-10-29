import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app.settings')
django.setup()

from accounts.models import CustomUser

email = 'Aruai@mail.com'
new_password = 'Password123'

user = CustomUser.objects.filter(email=email).first()

if user:
    user.set_password(new_password)
    user.save()
    print(f"✓ Password reset for {email}")
    print(f"  New password: {new_password}")
    print(f"  Is active: {user.is_active}")
    print(f"  You can now test login with this password")
else:
    print(f"✗ User not found: {email}")
