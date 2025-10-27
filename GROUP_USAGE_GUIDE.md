# Quick Reference: Group-Based User Types

## Role Checking in Code

### ✅ NEW WAY (Group-Based)
```python
# In views, serializers, anywhere you need to check user role
if request.user.is_landlord:
    # Landlord-specific logic
    pass

if request.user.is_tenant:
    # Tenant-specific logic
    pass
```

### ❌ OLD WAY (Deprecated but still works)
```python
# This still works due to backward compatibility
# But prefer the new way above
if request.user.user_type == 'landlord':
    pass
```

## Querying Users by Role

### ✅ NEW WAY (Group-Based)
```python
# Get all landlords
landlords = CustomUser.objects.filter(groups__name='landlord')

# Get all tenants
tenants = CustomUser.objects.filter(groups__name='tenant')

# Get active landlords only
active_landlords = CustomUser.objects.filter(
    groups__name='landlord',
    is_active=True
)

# Exclude landlords (get everyone else)
non_landlords = CustomUser.objects.exclude(groups__name='landlord')

# Combined with other filters
verified_tenants = CustomUser.objects.filter(
    groups__name='tenant',
    is_verified=True
)
```

### ❌ OLD WAY (Still works)
```python
landlords = CustomUser.objects.filter(user_type='landlord')
tenants = CustomUser.objects.filter(user_type='tenant')
```

## Creating Users

### Creating a Landlord
```python
from accounts.models import CustomUser

landlord = CustomUser.objects.create_user(
    email='landlord@example.com',
    full_name='John Landlord',
    user_type='landlord',  # Group assigned automatically
    password='securepassword'
)

# Verify group was assigned
assert landlord.is_landlord == True
assert landlord.groups.filter(name='landlord').exists()
```

### Creating a Tenant
```python
tenant = CustomUser.objects.create_user(
    email='tenant@example.com',
    full_name='Jane Tenant',
    user_type='tenant',  # Group assigned automatically
    password='securepassword'
)

# Verify group was assigned
assert tenant.is_tenant == True
assert tenant.groups.filter(name='tenant').exists()
```

## Changing User Roles

### Method 1: Via user_type Field (Automatic Group Sync)
```python
user = CustomUser.objects.get(email='user@example.com')
user.user_type = 'landlord'
user.save()

# Groups are automatically updated via signals
# user is now in 'landlord' group
```

### Method 2: Via Groups Directly (Automatic user_type Sync)
```python
from django.contrib.auth.models import Group

user = CustomUser.objects.get(email='user@example.com')
landlord_group = Group.objects.get(name='landlord')

user.groups.clear()  # Remove all groups
user.groups.add(landlord_group)  # Add landlord group

# user_type field is automatically updated via signals
# user.user_type == 'landlord'
```

## Permission Classes

### In DRF Views
```python
from rest_framework import viewsets
from accounts.permissions import IsLandlord, IsTenant

class LandlordOnlyView(viewsets.ModelViewSet):
    permission_classes = [IsLandlord]
    # Only landlords can access
    
class TenantOnlyView(viewsets.ModelViewSet):
    permission_classes = [IsTenant]
    # Only tenants can access
```

### Custom Permission Check
```python
from rest_framework.permissions import BasePermission

class IsLandlordOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        return request.user.is_authenticated and request.user.is_landlord
```

## Model Methods Using Groups

### Get Landlord's Tenants
```python
# Uses groups internally
landlord = CustomUser.objects.get(email='landlord@example.com')
my_tenants = landlord.my_tenants  # Returns only users in 'tenant' group

# Equivalent to:
my_tenants = CustomUser.objects.filter(
    tenant_profile__landlord=landlord,
    groups__name='tenant'
)
```

### Get Tenant's Landlord
```python
tenant = CustomUser.objects.get(email='tenant@example.com')
my_landlord = tenant.my_landlord  # Returns landlord user

# Checks that landlord is in 'landlord' group
```

### Get Landlord by Code
```python
# Uses groups internally to ensure user is a landlord
landlord = CustomUser.get_landlord_by_code('LAND123')
# Returns CustomUser object if found and is in 'landlord' group
# Returns None otherwise
```

## Serializer Examples

### Check Role in Serializer
```python
from rest_framework import serializers

class MySerializer(serializers.ModelSerializer):
    is_landlord = serializers.SerializerMethodField()
    
    def get_is_landlord(self, obj):
        return obj.is_landlord
    
    def validate(self, data):
        user = self.context['request'].user
        if not user.is_landlord:
            raise serializers.ValidationError("Only landlords can do this")
        return data
```

## View Examples

### Function-Based View
```python
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import IsLandlord

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsLandlord])
def landlord_stats(request):
    # Only landlords can access
    user = request.user
    stats = {
        'is_landlord': user.is_landlord,
        'tenant_count': user.my_tenants.count()
    }
    return Response(stats)
```

### Class-Based View
```python
from rest_framework.views import APIView
from rest_framework.response import Response

class LandlordDashboard(APIView):
    permission_classes = [IsAuthenticated, IsLandlord]
    
    def get(self, request):
        landlord = request.user
        
        # Get all tenants (uses groups)
        tenants = landlord.my_tenants
        
        return Response({
            'tenant_count': tenants.count(),
            'is_landlord': landlord.is_landlord
        })
```

## Admin Interface

### Assigning Groups via Admin
1. Go to Django Admin
2. Select a user
3. In the "Groups" section, select "landlord" or "tenant"
4. Save
5. The `user_type` field will automatically update

### Checking Groups
```python
from django.contrib.auth.models import Group

# List all groups
Group.objects.all()  # [<Group: landlord>, <Group: tenant>]

# Get users in a group
landlord_group = Group.objects.get(name='landlord')
landlords = landlord_group.user_set.all()

# Or using CustomUser
landlords = CustomUser.objects.filter(groups=landlord_group)
```

## Testing

### In Tests
```python
from django.test import TestCase
from django.contrib.auth.models import Group
from accounts.models import CustomUser

class MyTest(TestCase):
    def setUp(self):
        # Groups are automatically created via apps.py
        self.landlord_group = Group.objects.get(name='landlord')
        self.tenant_group = Group.objects.get(name='tenant')
    
    def test_landlord_creation(self):
        landlord = CustomUser.objects.create_user(
            email='test@example.com',
            full_name='Test User',
            user_type='landlord',
            password='testpass123'
        )
        
        # Verify group assignment
        self.assertTrue(landlord.is_landlord)
        self.assertTrue(landlord.groups.filter(name='landlord').exists())
        self.assertFalse(landlord.is_tenant)
```

## Migration Notes

### Synchronization is Automatic
- Changing `user_type` → groups update automatically
- Changing `groups` → user_type updates automatically
- No manual sync required

### Safety Features
- ✅ Backward compatible with legacy `user_type` field
- ✅ All existing queries still work
- ✅ Signal handlers prevent desynchronization
- ✅ Safe to use either method (prefer group-based)

## Common Patterns

### Pattern: Check if request user is landlord
```python
if getattr(request.user, 'is_landlord', False):
    # Landlord logic
```

### Pattern: Filter by role in viewset
```python
class TenantViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        if self.request.user.is_landlord:
            # Landlord sees their tenants
            return self.request.user.my_tenants
        elif self.request.user.is_tenant:
            # Tenant sees only themselves
            return CustomUser.objects.filter(pk=self.request.user.pk)
        return CustomUser.objects.none()
```

### Pattern: Validate user role in clean method
```python
class MyModel(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    
    def clean(self):
        if self.user and not self.user.is_landlord:
            raise ValidationError("User must be a landlord")
```

## Troubleshooting

### Q: User not in any group?
```python
# Check groups
user.groups.all()  # Should show at least one group

# Manually assign
from django.contrib.auth.models import Group
landlord_group = Group.objects.get(name='landlord')
user.groups.add(landlord_group)
```

### Q: user_type and groups don't match?
```python
# Force sync from groups
user.sync_user_type_from_groups(save=True)

# Or force sync from user_type
user.sync_groups_from_user_type()
```

### Q: Groups don't exist?
```python
# Run this once (automatically done in apps.py)
from django.contrib.auth.models import Group
Group.objects.get_or_create(name='landlord')
Group.objects.get_or_create(name='tenant')
```

---

## Summary of Changes

**Before:**
```python
if user.user_type == 'landlord':
    landlords = CustomUser.objects.filter(user_type='landlord')
```

**After (Recommended):**
```python
if user.is_landlord:
    landlords = CustomUser.objects.filter(groups__name='landlord')
```

**Both work!** But the group-based approach is preferred for consistency with Django best practices.
