import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app.settings')
django.setup()

from accounts.models import CustomUser

email = 'Aruai@mail.com'
user = CustomUser.objects.filter(email=email).first()

if user:
    print(f"User found: {email}")
    print(f"Is active: {user.is_active}")
    print(f"Has usable password: {user.has_usable_password()}")
    print(f"User ID: {user.id}")
    print(f"Groups: {[g.name for g in user.groups.all()]}")
    
    # Test common passwords
    test_passwords = ['Password', 'password', 'Password123', 'Aruai123']
    for pwd in test_passwords:
        if user.check_password(pwd):
            print(f"✓ Password '{pwd}' is correct")
            break
    else:
        print("✗ None of the test passwords match")
else:
    print(f"User not found: {email}")
