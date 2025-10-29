from django.contrib import admin
from .models import CustomUser, UnitType, Property, Unit, Subscription, TenantProfile, TenantApplication

@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ['email', 'full_name', 'user_type', 'landlord_code', 'is_active']
    list_filter = ['user_type', 'is_active', 'is_staff']
    search_fields = ['email', 'full_name', 'landlord_code']
    readonly_fields = ['landlord_code', 'date_joined']
    
    fieldsets = (
        ('Basic Info', {
            'fields': ('email', 'full_name', 'user_type', 'landlord_code')
        }),
        ('Contact Info', {
            'fields': ('phone_number', 'emergency_contact', 'address')
        }),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser')
        }),
        ('Dates', {
            'fields': ('date_joined',)
        })
    )

@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ['name', 'landlord', 'city', 'state', 'unit_count']
    list_filter = ['landlord', 'city', 'state']
    search_fields = ['name', 'city', 'state']
    raw_id_fields = ['landlord']

@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    list_display = ['unit_number', 'property_obj', 'unit_type', 'rent', 'is_available', 'tenant']
    list_filter = ['property_obj__landlord', 'is_available', 'unit_type']
    search_fields = ['unit_number', 'property_obj__name', 'unit_code']
    raw_id_fields = ['property_obj', 'unit_type', 'tenant']

@admin.register(UnitType)
class UnitTypeAdmin(admin.ModelAdmin):
    list_display = ['name', 'landlord', 'rent', 'deposit', 'number_of_units']
    list_filter = ['landlord']
    search_fields = ['name', 'landlord__email']
    raw_id_fields = ['landlord']

@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ['user', 'plan', 'start_date', 'expiry_date', 'is_active']
    list_filter = ['plan', 'start_date']
    search_fields = ['user__email']
    readonly_fields = ['start_date']
    
    def is_active(self, obj):
        return obj.is_active()
    is_active.boolean = True

@admin.register(TenantProfile)
class TenantProfileAdmin(admin.ModelAdmin):
    list_display = ['tenant', 'landlord', 'current_unit', 'move_in_date']
    list_filter = ['landlord', 'move_in_date']
    search_fields = ['tenant__email', 'tenant__full_name', 'landlord__email', 'landlord__full_name']
    raw_id_fields = ['tenant', 'landlord', 'current_unit']


@admin.register(TenantApplication)
class TenantApplicationAdmin(admin.ModelAdmin):
    list_display = ['tenant', 'landlord', 'unit', 'status', 'already_living_in_property', 'deposit_required', 'deposit_paid', 'applied_at']
    list_filter = ['status', 'already_living_in_property', 'deposit_required', 'deposit_paid', 'applied_at']
    search_fields = ['tenant__email', 'tenant__full_name', 'landlord__email', 'landlord__full_name', 'unit__unit_number']
    raw_id_fields = ['tenant', 'landlord', 'unit', 'reviewed_by']
    readonly_fields = ['applied_at', 'reviewed_at']
    
    fieldsets = (
        ('Application Info', {
            'fields': ('tenant', 'landlord', 'unit', 'status')
        }),
        ('Deposit & Living Status', {
            'fields': ('already_living_in_property', 'deposit_required', 'deposit_paid')
        }),
        ('Notes', {
            'fields': ('notes', 'landlord_notes')
        }),
        ('Review Info', {
            'fields': ('reviewed_at', 'reviewed_by')
        }),
    )