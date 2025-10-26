from rest_framework import permissions
from django.core.cache import cache
from .models import CustomUser, Subscription
# REMOVE the problematic Payment import - it causes circular dependency

class IsLandlord(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and getattr(request.user, 'is_landlord', False)

class IsTenant(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and getattr(request.user, 'is_tenant', False)

class IsSuperuser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_superuser

class HasActiveSubscription(permissions.BasePermission):
    """
    Permission check for landlord having an active subscription.
    Also checks if tenant's landlord has active subscription.
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # For landlords, check their own subscription
        if getattr(request.user, 'is_landlord', False):
            cache_key = f"subscription_status:{request.user.id}"
            has_active_sub = cache.get(cache_key)
            
            if has_active_sub is None:
                try:
                    subscription = Subscription.objects.get(user=request.user)
                    has_active_sub = subscription.is_active()
                except Subscription.DoesNotExist:
                    has_active_sub = False
                cache.set(cache_key, has_active_sub, timeout=300)  # Cache for 5 minutes
            
            return has_active_sub
        
        # For tenants, check their landlord's subscription
        elif getattr(request.user, 'is_tenant', False):
            try:
                # Get tenant's landlord through tenant profile
                tenant_profile = request.user.tenant_profile
                if tenant_profile and tenant_profile.landlord:
                    landlord = tenant_profile.landlord
                    cache_key = f"subscription_status:{landlord.id}"
                    has_active_sub = cache.get(cache_key)
                    
                    if has_active_sub is None:
                        try:
                            subscription = Subscription.objects.get(user=landlord)
                            has_active_sub = subscription.is_active()
                        except Subscription.DoesNotExist:
                            has_active_sub = False
                        cache.set(cache_key, has_active_sub, timeout=300)
                    
                    return has_active_sub
                else:
                    # No landlord assigned, allow access
                    return True
            except Exception:
                # If we can't check, allow access (fail open)
                return True
        
        return False

# Remove the problematic IsTenantWithActivePayment permission if it exists
# as it causes circular imports with Payment model

class CanAccessReport(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        if getattr(request.user, 'is_tenant', False):
            return obj.tenant == request.user
        elif getattr(request.user, 'is_landlord', False):
            return obj.unit.property_obj.landlord == request.user
        return False
