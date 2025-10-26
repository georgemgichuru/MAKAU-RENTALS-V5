from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    MyTokenObtainPairView,
    UserDetailView,
    UserListView,
    UserCreateView,
    PasswordResetView,
    PasswordResetConfirmView,
    UpdateUserView,
    MeView,
    LandlordDashboardStatsView,
    UnitTypeListCreateView,
    UnitTypeDetailView,
    CreatePropertyView,
    LandlordPropertiesView,
    CreateUnitView,
    PropertyUnitsView,
    AssignTenantView,
    UpdatePropertyView,
    UpdateUnitView,
    TenantUpdateUnitView,
    AdjustRentView,
    SubscriptionStatusView,
    UpdateTillNumberView,
    UpdateReminderPreferencesView,
    LandlordAvailableUnitsView,
    WelcomeView,
    LandlordsListView,
    PendingApplicationsView,
    EvictedTenantsView,
    TenantRegistrationStepView,
    LandlordRegistrationStepView,
    CompleteTenantRegistrationView,
    CompleteLandlordRegistrationView,
    AdminLandlordSubscriptionStatusView,
    UnitListView,
    ValidateLandlordView,
    LandlordProfileView,
    RemoveTenantFromUnitView,
    # ADD THE NEW VIEWS
    TenantRegistrationView,
    LandlordTenantsView,
)

urlpatterns = [
    # Authentication
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # User management
    path('users/', UserListView.as_view(), name='user-list'),
    path('users/<int:user_id>/', UserDetailView.as_view(), name='user-detail'),
    path('users/<int:user_id>/update/', UpdateUserView.as_view(), name='user-update'),
    path('register/', UserCreateView.as_view(), name='user-create'),
    path('me/', MeView.as_view(), name='me'),
    
    # Password reset
    path('password/reset/', PasswordResetView.as_view(), name='password-reset'),
    path('password/reset/confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    
    # Property management
    path('properties/', LandlordPropertiesView.as_view(), name='property-list'),
    path('properties/create/', CreatePropertyView.as_view(), name='property-create'),
    path('properties/<int:property_id>/', UpdatePropertyView.as_view(), name='property-detail'),
    path('properties/<int:property_id>/units/', PropertyUnitsView.as_view(), name='property-units'),
    
    # Unit management
    path('units/', UnitListView.as_view(), name='unit-list'),
    path('units/create/', CreateUnitView.as_view(), name='unit-create'),
    path('units/<int:unit_id>/', UpdateUnitView.as_view(), name='unit-detail'),
    path('units/<int:unit_id>/assign/<int:tenant_id>/', AssignTenantView.as_view(), name='assign-tenant'),
    path('units/<int:unit_id>/remove-tenant/', RemoveTenantFromUnitView.as_view(), name='remove-tenant'),
    path('units/tenant/update/', TenantUpdateUnitView.as_view(), name='tenant-update-unit'),
    
    # Unit types
    path('unit-types/', UnitTypeListCreateView.as_view(), name='unit-type-list'),
    path('unit-types/<int:pk>/', UnitTypeDetailView.as_view(), name='unit-type-detail'),
    
    # Dashboard & Stats
    path('dashboard/stats/', LandlordDashboardStatsView.as_view(), name='dashboard-stats'),
    path('rent/adjust/', AdjustRentView.as_view(), name='adjust-rent'),
    
    # Subscription
    path('subscription/status/', SubscriptionStatusView.as_view(), name='subscription-status'),
    path('till-number/update/', UpdateTillNumberView.as_view(), name='update-till-number'),
    
    # Tenant preferences
    path('reminder-preferences/', UpdateReminderPreferencesView.as_view(), name='update-reminder-preferences'),
    
    # Available units
    path('available-units/', LandlordAvailableUnitsView.as_view(), name='available-units'),
    
    # Tenants & Landlords
    path('tenants/', UserListView.as_view(), name='tenant-list'),
    path('landlords/profile/', LandlordProfileView.as_view(), name='landlord-profile'),
    
    # ✅ NEW: Tenant registration with landlord code
    path('register/tenant/', TenantRegistrationView.as_view(), name='tenant-registration'),
    
    # ✅ NEW: Get tenants by landlord
    path('landlord/tenants/', LandlordTenantsView.as_view(), name='landlord-tenants'),
    
    # Landlord validation for tenant signup
    path('validate-landlord/', ValidateLandlordView.as_view(), name='validate-landlord'),
    
    # Registration steps
    path('tenant/register/step/<int:step>/', TenantRegistrationStepView.as_view(), name='tenant-register-step'),
    path('tenant/register/complete/', CompleteTenantRegistrationView.as_view(), name='tenant-register-complete'),
    path('landlord/register/step/<int:step>/', LandlordRegistrationStepView.as_view(), name='landlord-register-step'),
    path('landlord/register/complete/', CompleteLandlordRegistrationView.as_view(), name='landlord-register-complete'),
    
    # Admin views
    path('admin/landlords/', LandlordsListView.as_view(), name='admin-landlords'),
    path('admin/subscription-status/', AdminLandlordSubscriptionStatusView.as_view(), name='admin-subscription-status'),
    path('applications/pending/', PendingApplicationsView.as_view(), name='pending-applications'),
    path('tenants/evicted/', EvictedTenantsView.as_view(), name='evicted-tenants'),
    
    # Welcome
    path('welcome/', WelcomeView.as_view(), name='welcome'),
]