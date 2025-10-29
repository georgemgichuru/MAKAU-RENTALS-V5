from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status, generics,permissions
from accounts.serializers import (
    PropertySerializer,
    UnitSerializer,
    UnitNumberSerializer,
    UserSerializer,
    PasswordResetSerializer,
    PasswordResetConfirmSerializer,
    TenantWithUnitSerializer,
    ReminderPreferencesSerializer,
    LandlordDashboardSerializer,
    CustomUserSerializer,
    TenantRegistrationSerializer,
    AvailableUnitsSerializer,
)
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.core.cache import cache
from django.core.mail import send_mail
from django.conf import settings
from .models import Property, Unit, CustomUser, Subscription, UnitType,TenantProfile
from payments.models import Payment
from django.shortcuts import get_object_or_404
from .permissions import IsLandlord, IsTenant, IsSuperuser, HasActiveSubscription
from communication.models import Report
from communication.serializers import ReportSerializer
from django.core.exceptions import ValidationError

import logging

import uuid

logger = logging.getLogger(__name__)

from django.http import HttpResponse
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Count, Sum, Q
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

# accounts/views.py
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import MyTokenObtainPairSerializer
from .serializers import UnitTypeSerializer

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

# Add this to your views.py file
class LandlordTenantsView(APIView):
    """
    Get all tenants for a specific landlord through TenantProfile
    """
    permission_classes = [IsAuthenticated, IsLandlord, HasActiveSubscription]

    def get(self, request):
        # For landlords: get their own tenants through TenantProfile
        if getattr(request.user, 'is_landlord', False):
            tenants = CustomUser.objects.filter(
                tenant_profile__landlord=request.user,  # Changed from tenantprofile to tenant_profile
                groups__name='tenant'
            ).select_related('tenant_profile')
        
        # For superusers: get all tenants or filter by landlord_code
        elif request.user.is_superuser:
            landlord_code = request.GET.get('landlord_code')
            if landlord_code:
                tenants = CustomUser.objects.filter(
                    tenant_profile__landlord__landlord_code=landlord_code,  # Changed from tenantprofile to tenant_profile
                    groups__name='tenant'
                ).select_related('tenant_profile')
            else:
                tenants = CustomUser.objects.filter(groups__name='tenant').select_related('tenant_profile')
        else:
            return Response({"error": "Permission denied"}, status=403)
        
        serializer = TenantWithUnitSerializer(tenants, many=True)
        return Response(serializer.data)

# In your Django views.py - UnitTypeListCreateView should handle POST requests
class UnitTypeListCreateView(APIView):
    permission_classes = [IsAuthenticated, IsLandlord, HasActiveSubscription]

    def get(self, request):
        print("📊 GET: Fetching unit types for user:", request.user.id)
        try:
            unit_types = UnitType.objects.filter(landlord=request.user)
            print(f"📊 Found {unit_types.count()} unit types")
            serializer = UnitTypeSerializer(unit_types, many=True)
            return Response(serializer.data)
        except Exception as e:
            print(f"❌ Error fetching unit types: {str(e)}")
            return Response({"error": "Failed to fetch unit types"}, status=500)

    def post(self, request):
        print("📝 POST: Creating unit type for user:", request.user.id)
        print("📝 Request data:", request.data)
        
        try:
            # Create the unit type manually - bypass serializer for creation
            unit_type = UnitType.objects.create(
                landlord=request.user,  # Set landlord directly
                name=request.data.get('name'),
                rent=request.data.get('rent'),
                deposit=request.data.get('deposit', 0),
                description=request.data.get('description', ''),
                number_of_units=0  # Default value
            )
            print(f"✅ Unit type created: {unit_type.id} - {unit_type.name}")
            
            # Serialize the created object for response
            serializer = UnitTypeSerializer(unit_type)
            return Response(serializer.data, status=201)
                
        except Exception as e:
            print(f"❌ Unexpected error in unit type creation: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({"error": "Internal server error"}, status=500)
    
    def create_units_for_unit_type(self, property_obj, unit_type, unit_count):
        """Create multiple units for a given unit type"""
        # Get existing units to determine next unit number
        existing_units = Unit.objects.filter(property_obj=property_obj)
        last_unit = existing_units.order_by('-unit_number').first()

        if last_unit and last_unit.unit_number.isdigit():
            start_number = int(last_unit.unit_number) + 1
        else:
            start_number = 1

        units_created = []
        for i in range(unit_count):
            unit_number = start_number + i
            unit_code = f"U-{property_obj.id}-{unit_type.name.replace(' ', '-')}-{unit_number}"

            unit = Unit.objects.create(
                property_obj=property_obj,
                unit_code=unit_code,
                unit_number=str(unit_number),
                unit_type=unit_type,
                is_available=True,
                rent=unit_type.rent,
                deposit=unit_type.deposit,
            )
            units_created.append(unit)

        # Invalidate caches after creating units
        cache.delete(f"landlord:{unit_type.landlord.id}:properties")
        cache.delete(f"property:{property_obj.id}:units")

        return units_created

class LandlordDashboardStatsView(APIView):
    permission_classes = [IsAuthenticated, IsLandlord, HasActiveSubscription]

    def get(self, request):
        landlord = request.user

        # Total active tenants: tenants assigned to units of this landlord and active
        total_active_tenants = CustomUser.objects.filter(
            groups__name='tenant',
            is_active=True,
            unit__property_obj__landlord=landlord
        ).distinct().count()

        # Total units available
        total_units_available = Unit.objects.filter(
            property_obj__landlord=landlord,
            is_available=True
        ).count()

        # Total units occupied
        total_units_occupied = Unit.objects.filter(
            property_obj__landlord=landlord,
            is_available=False
        ).count()

        # Monthly revenue: sum of successful rent payments in the current month for this landlord
        now = timezone.now()
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # Use created_at field instead of transaction_date
        monthly_revenue_agg = Payment.objects.filter(
            unit__property_obj__landlord=landlord,
            payment_type='rent',
            status='completed',  # ✅ FIXED: Changed from 'Success' to 'completed'
            created_at__gte=start_of_month,  # Changed from transaction_date
            created_at__lte=now  # Changed from transaction_date
        ).aggregate(total=Sum('amount'))
        monthly_revenue = monthly_revenue_agg['total'] or 0

        data = {
            "total_active_tenants": total_active_tenants,
            "total_units_available": total_units_available,
            "total_units_occupied": total_units_occupied,
            "monthly_revenue": float(monthly_revenue),
        }

        return Response(data)


class UnitTypeDetailView(APIView):
    permission_classes = [IsAuthenticated, IsLandlord, HasActiveSubscription]

    def get_object(self, pk, user):
        return UnitType.objects.get(id=pk, landlord=user)

    def get(self, request, pk):
        try:
            ut = self.get_object(pk, request.user)
            serializer = UnitTypeSerializer(ut)
            return Response(serializer.data)
        except UnitType.DoesNotExist:
            return Response({"error": "UnitType not found"}, status=404)

    def put(self, request, pk):
        try:
            ut = self.get_object(pk, request.user)
            serializer = UnitTypeSerializer(ut, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=400)
        except UnitType.DoesNotExist:
            return Response({"error": "UnitType not found"}, status=404)

    def delete(self, request, pk):
        try:
            ut = self.get_object(pk, request.user)
            ut.delete()
            return Response({"message": "UnitType deleted"}, status=200)
        except UnitType.DoesNotExist:
            return Response({"error": "UnitType not found"}, status=404)


# Lists a single user (cached)
# View to get user details
class UserDetailView(APIView):
    permission_classes = [IsAuthenticated, HasActiveSubscription]

    def get(self, request, user_id):
        cache_key = f"user:{user_id}"
        user_data = cache.get(cache_key)

        if not user_data:
            try:
                user = CustomUser.objects.get(id=user_id)
                serializer = UserSerializer(user)
                user_data = serializer.data
                cache.set(cache_key, user_data, timeout=300)  # cache for 5 minutes
            except CustomUser.DoesNotExist:
                return Response({"error": "User not found"}, status=404)

        return Response(user_data)


# New admin view to list landlords and their subscription statuses (superuser only)
class AdminLandlordSubscriptionStatusView(APIView):
    permission_classes = [IsAuthenticated, IsSuperuser]

    def get(self, request):
        landlords = CustomUser.objects.filter(groups__name='landlord')
        data = []
        for landlord in landlords:
            subscription = getattr(landlord, 'subscription', None)
            status = 'Subscribed' if subscription and subscription.is_active() else 'Inactive or None'
            data.append({
                'landlord_id': landlord.id,
                'email': landlord.email,
                'name': landlord.full_name,
                'subscription_plan': subscription.plan if subscription else 'None',
                'subscription_status': status,
                'expiry_date': subscription.expiry_date if subscription else None,
            })
        return Response(data)


# Lists all tenants (cached)
# View to list all tenants (landlord only)
class UserListView(APIView):
    permission_classes = [IsAuthenticated, IsLandlord, HasActiveSubscription]

    def get(self, request):
        # Get only tenants associated with this landlord
        tenants = request.user.my_tenants
        serializer = UserSerializer(tenants, many=True)
        return Response(serializer.data)

# Create a new user (invalidate cache)
# View to create a new user Landlord or Tenant
class UserCreateView(APIView):
    def post(self, request):
        print("Signup request received:", request.data)  # Debug logging
        
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            print(f"User created successfully: {user.email}, ID: {user.id}")  # Debug logging

            # Landlord onboarding: optionally auto-create properties and units if provided
            if getattr(user, 'is_landlord', False):
                # Expect optional 'properties' array in request.data, each item: {name, city, state, unit_count, vacant_units}
                properties = request.data.get('properties')
                from .models import Property, Unit, UnitType
                import uuid

                if properties and isinstance(properties, list):
                    for prop in properties:
                        name = prop.get('name') or f"Property-{uuid.uuid4().hex[:6].upper()}"
                        city = prop.get('city', '')
                        state = prop.get('state', '')
                        unit_count = int(prop.get('unit_count', 0))
                        p = Property.objects.create(landlord=user, name=name, city=city, state=state, unit_count=unit_count)

                        # Create at least one unit if unit_count > 0
                        for i in range(1, unit_count + 1):
                            unit_number = str(i)
                            unit_code = f"U-{p.id}-{i}"
                            # Determine vacancy status based on optional vacant_units or default all vacant
                            vacant_units = int(prop.get('vacant_units', unit_count))
                            is_available = i <= vacant_units

                            # Optionally link to a unit_type if provided via name
                            unit_type_obj = None
                            unit_type_name = prop.get('unit_type')
                            if unit_type_name:
                                unit_type_obj, _ = UnitType.objects.get_or_create(landlord=user, name=unit_type_name)

                            Unit.objects.create(
                                property_obj=p,
                                unit_code=unit_code,
                                unit_number=unit_number,
                                unit_type=unit_type_obj,
                                is_available=is_available,
                                rent=unit_type_obj.rent if unit_type_obj else 0,
                                deposit=unit_type_obj.deposit if unit_type_obj else 0,
                            )

            # Tenant created: attempt to assign unit if landlord_code and unit_code provided
            if getattr(user, 'is_tenant', False):
                cache.delete("tenants:list")
                landlord_code = request.data.get('landlord_code')
                unit_code = request.data.get('unit_code')
                if landlord_code and unit_code:
                    try:
                        landlord = CustomUser.objects.get(landlord_code=landlord_code, groups__name='landlord')
                        unit = Unit.objects.get(unit_code=unit_code, property_obj__landlord=landlord)
                        # Check for deposit payments
                        from payments.models import Payment
                        deposit_payments = Payment.objects.filter(
                            tenant=user,
                            unit=unit,
                            payment_type='deposit',
                            status='completed',  # ✅ FIXED: Changed from 'Success' to 'completed'
                            amount__gte=unit.deposit
                        )
                        if deposit_payments.exists():
                            unit.tenant = user
                            unit.is_available = False
                            unit.save()
                        else:
                            # leave unassigned; frontend should request deposit
                            pass
                    except CustomUser.DoesNotExist:
                        # landlord not found; ignore
                        pass
                    except Unit.DoesNotExist:
                        pass

            return Response(serializer.data, status=201)
        else:
            print("Serializer errors:", serializer.errors)  # Debug logging
            return Response(serializer.errors, status=400)


# Create a new property (invalidate landlord cache)
# View to create a new property (landlord only)
PLAN_LIMITS = {
    "free": 2,         # trial landlords can only create 2 properties
    "starter": 3,      # starter (up to 10 units) -> small number of properties
    "basic": 10,       # basic (10-50 units)
    "professional": 25,# professional (50-100 units)
    "onetime": None,   # unlimited
}

class CreatePropertyView(APIView):
    permission_classes = [IsAuthenticated, IsLandlord, HasActiveSubscription]

    def post(self, request):
        from accounts.subscription_utils import (
            check_subscription_limits,
            send_limit_reached_email,
            send_approaching_limit_email
        )
        from accounts.models import PropertyUnitTracker
        
        logger.info(f"CreatePropertyView: User {request.user.id} attempting to create property")
        user = request.user

        # Fetch subscription
        try:
            subscription = Subscription.objects.get(user=user)
            logger.info(f"Subscription found: {subscription.plan}")
        except Subscription.DoesNotExist:
            logger.error(f"No subscription found for user {user.id}")
            return Response({"error": "No active subscription found."}, status=403)

        plan = subscription.plan.lower()

        # Check if subscription is active
        if not subscription.is_active():
            logger.warning(f"Subscription expired for user {user.id}")
            return Response({
                "error": "Your subscription has expired. Please renew to continue.",
                "action_required": "renew_subscription",
                "redirect_to": "/admin/subscription"
            }, status=403)

        # Use new subscription limit checker
        limit_check = check_subscription_limits(user, action_type='property')
        
        # For free trial users at limit, allow creation with tier change warning
        if limit_check.get('is_free_trial') and limit_check.get('tier_change_warning'):
            logger.info(f"Free trial user {user.id} creating property beyond limit - will show tier change warning")
        elif not limit_check['can_create']:
            # Send email notification about limit reached (rate limited to once per hour)
            send_limit_reached_email(
                landlord=user,
                limit_type='property',
                current_plan=plan,
                suggested_plan=limit_check.get('suggested_plan')
            )
            
            logger.warning(f"Property limit reached for user {user.id}")
            return Response({
                "error": limit_check['message'],
                "current_count": limit_check['current_count'],
                "limit": limit_check['limit'],
                "upgrade_needed": True,
                "suggested_plan": limit_check.get('suggested_plan'),
                "action_required": "upgrade_subscription",
                "redirect_to": "/admin/subscription"
            }, status=403)

        # Proceed with creation
        serializer = PropertySerializer(data=request.data)
        if serializer.is_valid():
            logger.info(f"Serializer valid, saving property for user {user.id}")
            property = serializer.save(landlord=user)
            
            # Track property creation
            tracker = PropertyUnitTracker.track_property_creation(user, property)
            
            # Check if approaching limit and send warning email
            new_count = limit_check['current_count'] + 1
            if limit_check.get('upgrade_needed') or (limit_check['limit'] and new_count >= limit_check['limit'] - 1):
                send_approaching_limit_email(
                    landlord=user,
                    limit_type='property',
                    current_count=new_count,
                    limit=limit_check['limit'],
                    current_plan=plan
                )
                tracker.upgrade_notification_sent = True
                tracker.save(update_fields=['upgrade_notification_sent'])
            
            # Check if limit reached with this creation
            if limit_check['limit'] and new_count >= limit_check['limit']:
                tracker.limit_reached = True
                tracker.save(update_fields=['limit_reached'])
            
            try:
                cache.delete(f"landlord:{user.id}:properties")
                logger.info(f"Cache cleared for user {user.id}")
            except Exception as e:
                logger.warning(f"Cache delete failed: {e}")
            
            logger.info(f"Property created successfully: {property.id}, tracked in {tracker.id}")
            
            response_data = serializer.data
            response_data['tracking'] = {
                'total_properties': tracker.total_properties_after,
                'limit': limit_check['limit'],
                'approaching_limit': limit_check.get('upgrade_needed', False),
                'limit_reached': tracker.limit_reached
            }
            
            # Add free trial warning if user is on free plan
            if subscription.plan == 'free':
                # Calculate total units
                total_units = Unit.objects.filter(property_obj__landlord=user).count()
                
                # Calculate total properties including this new one
                total_properties = tracker.total_properties_after
                
                # Determine which tier they'll be charged for
                suggested_tier = None
                suggested_price = 0
                if total_units <= 10:
                    suggested_tier = "Tier 1 (1-10 Units)"
                    suggested_price = 2000
                elif total_units <= 20:
                    suggested_tier = "Tier 2 (11-20 Units)"
                    suggested_price = 2500
                elif total_units <= 50:
                    suggested_tier = "Tier 3 (21-50 Units)"
                    suggested_price = 4500
                elif total_units <= 100:
                    suggested_tier = "Tier 4 (51-100 Units)"
                    suggested_price = 7500
                else:
                    suggested_tier = "Enterprise (100+ Units)"
                    suggested_price = "Custom"
                
                days_remaining = (subscription.expiry_date - timezone.now()).days if subscription.expiry_date else 0
                
                # Check if this creation exceeds the free plan property limit
                tier_changed = total_properties > 2
                
                warning_message = f'Property created successfully! You are on a free trial with {days_remaining} days remaining.'
                if tier_changed:
                    warning_message = f'Property created! You now have {total_properties} properties. Your subscription plan will automatically adjust to {suggested_tier} (KES {suggested_price}/month) when your trial ends in {days_remaining} days.'
                
                response_data['trial_warning'] = {
                    'message': warning_message,
                    'billing_info': {
                        'total_properties': total_properties,
                        'total_units': total_units,
                        'suggested_tier': suggested_tier,
                        'monthly_cost': suggested_price,
                        'billing_starts': subscription.expiry_date.strftime('%Y-%m-%d') if subscription.expiry_date else None,
                        'tier_changed': tier_changed
                    },
                    'note': f'After your trial ends, you will be charged KES {suggested_price}/month for {suggested_tier} based on your {total_properties} property(ies) and {total_units} unit(s).' if isinstance(suggested_price, int) else 'Please contact us for enterprise pricing.'
                }
            
            return Response(response_data, status=201)

        logger.error(f"Serializer errors: {serializer.errors}")
        return Response(serializer.errors, status=400)

# List landlord properties (cached)
class LandlordPropertiesView(APIView):
    permission_classes = [IsAuthenticated, IsLandlord, HasActiveSubscription]

    def get(self, request):
        cache_key = f"landlord:{request.user.id}:properties"
        properties_data = cache.get(cache_key)

        if not properties_data:
            properties = Property.objects.filter(landlord=request.user)
            serializer = PropertySerializer(properties, many=True)
            properties_data = serializer.data
            cache.set(cache_key, properties_data, timeout=300)

        return Response(properties_data)


# Create a new unit (invalidate landlord cache)
# In your Django views.py - Update CreateUnitView
class CreateUnitView(APIView):
    permission_classes = [IsAuthenticated, IsLandlord, HasActiveSubscription]

    def post(self, request):
        from accounts.subscription_utils import (
            check_subscription_limits,
            send_limit_reached_email,
            send_approaching_limit_email
        )
        from accounts.models import PropertyUnitTracker
        
        print("CreateUnitView: Received data:", request.data)  # Debug logging
        
        try:
            # Validate that the property belongs to the landlord
            property_id = request.data.get('property_obj')
            if not property_id:
                return Response({"error": "Property is required"}, status=400)
                
            try:
                property_obj = Property.objects.get(id=property_id, landlord=request.user)
            except Property.DoesNotExist:
                return Response({"error": "Property not found or you do not have permission"}, status=404)

            # Check subscription limits BEFORE creating unit
            limit_check = check_subscription_limits(request.user, action_type='unit')
            
            # For free trial users at limit, allow creation with tier change warning
            if limit_check.get('is_free_trial') and limit_check.get('tier_change_warning'):
                logger.info(f"Free trial user {request.user.id} creating unit beyond limit - will show tier change warning")
            elif not limit_check['can_create']:
                # Send email notification about limit reached (rate limited to once per hour)
                send_limit_reached_email(
                    landlord=request.user,
                    limit_type='unit',
                    current_plan=request.user.subscription.plan if hasattr(request.user, 'subscription') else None,
                    suggested_plan=limit_check.get('suggested_plan')
                )
                
                logger.warning(f"Unit limit reached for user {request.user.id}")
                return Response({
                    "error": limit_check['message'],
                    "current_count": limit_check['current_count'],
                    "limit": limit_check['limit'],
                    "upgrade_needed": True,
                    "suggested_plan": limit_check.get('suggested_plan'),
                    "action_required": "upgrade_subscription",
                    "redirect_to": "/admin/subscription"
                }, status=403)

            # Validate unit number
            unit_number = request.data.get('unit_number')
            if not unit_number:
                return Response({"error": "Unit number is required"}, status=400)

            # Check if unit number already exists in this property
            if Unit.objects.filter(property_obj=property_obj, unit_number=unit_number).exists():
                return Response({"error": f"Unit number {unit_number} already exists in this property"}, status=400)

            # Generate unique unit code
            unit_code = f"U-{property_obj.id}-{unit_number}-{uuid.uuid4().hex[:8]}"
            
            # Get rent value
            rent = request.data.get('rent', 0)
            # Get deposit value - if not provided or empty, default to rent
            deposit = request.data.get('deposit')
            if deposit is None or deposit == '' or deposit == 0:
                deposit = rent  # Default deposit to rent if not specified
            
            # Prepare unit data
            unit_data = {
                'property_obj': property_obj.id,
                'unit_code': unit_code,
                'unit_number': unit_number.strip(),
                'unit_type': request.data.get('unit_type'),
                'bedrooms': request.data.get('bedrooms', 0),
                'bathrooms': request.data.get('bathrooms', 1),
                'floor': request.data.get('floor', 0),
                'rent': rent,
                'deposit': deposit,
                'is_available': True
            }

            print("CreateUnitView: Processed unit data:", unit_data)  # Debug logging

            serializer = UnitSerializer(data=unit_data, context={'request': request})
            
            if serializer.is_valid():
                print("CreateUnitView: Serializer is valid")  # Debug logging
                unit = serializer.save()
                
                # Track unit creation
                tracker = PropertyUnitTracker.track_unit_creation(request.user, unit)
                
                # Check if approaching limit and send warning email
                new_count = limit_check['current_count'] + 1
                subscription = getattr(request.user, 'subscription', None)
                plan = subscription.plan if subscription else 'unknown'
                
                if limit_check.get('upgrade_needed') or (limit_check['limit'] and new_count >= limit_check['limit'] - 1):
                    send_approaching_limit_email(
                        landlord=request.user,
                        limit_type='unit',
                        current_count=new_count,
                        limit=limit_check['limit'],
                        current_plan=plan
                    )
                    tracker.upgrade_notification_sent = True
                    tracker.save(update_fields=['upgrade_notification_sent'])
                
                # Check if limit reached with this creation
                if limit_check['limit'] and new_count >= limit_check['limit']:
                    tracker.limit_reached = True
                    tracker.save(update_fields=['limit_reached'])
                
                # Invalidate caches
                cache.delete(f"landlord:{request.user.id}:properties")
                cache.delete(f"property:{unit.property_obj.id}:units")
                
                print(f"CreateUnitView: Unit created successfully - ID: {unit.id}, tracked in {tracker.id}")
                
                response_data = serializer.data
                response_data['tracking'] = {
                    'total_units': tracker.total_units_after,
                    'limit': limit_check['limit'],
                    'approaching_limit': limit_check.get('upgrade_needed', False),
                    'limit_reached': tracker.limit_reached
                }
                
                # Add free trial warning if user is on free plan
                subscription = request.user.subscription if hasattr(request.user, 'subscription') else None
                if subscription and subscription.plan == 'free':
                    # Calculate total units including this new one
                    total_units = tracker.total_units_after
                    
                    # Calculate total properties
                    total_properties = Property.objects.filter(landlord=request.user).count()
                    
                    # Determine which tier they'll be charged for
                    suggested_tier = None
                    suggested_price = 0
                    if total_units <= 10:
                        suggested_tier = "Tier 1 (1-10 Units)"
                        suggested_price = 2000
                    elif total_units <= 20:
                        suggested_tier = "Tier 2 (11-20 Units)"
                        suggested_price = 2500
                    elif total_units <= 50:
                        suggested_tier = "Tier 3 (21-50 Units)"
                        suggested_price = 4500
                    elif total_units <= 100:
                        suggested_tier = "Tier 4 (51-100 Units)"
                        suggested_price = 7500
                    else:
                        suggested_tier = "Enterprise (100+ Units)"
                        suggested_price = "Custom"
                    
                    days_remaining = (subscription.expiry_date - timezone.now()).days if subscription.expiry_date else 0
                    
                    # Check if this creation exceeds the free plan unit limit
                    tier_changed = total_units > 10
                    
                    warning_message = f'Unit created successfully! You are on a free trial with {days_remaining} days remaining.'
                    if tier_changed:
                        warning_message = f'Unit created! You now have {total_units} units. Your subscription plan will automatically adjust to {suggested_tier} (KES {suggested_price}/month) when your trial ends in {days_remaining} days.'
                    
                    response_data['trial_warning'] = {
                        'message': warning_message,
                        'billing_info': {
                            'total_properties': total_properties,
                            'total_units': total_units,
                            'suggested_tier': suggested_tier,
                            'monthly_cost': suggested_price,
                            'billing_starts': subscription.expiry_date.strftime('%Y-%m-%d') if subscription.expiry_date else None,
                            'tier_changed': tier_changed
                        },
                        'note': f'After your trial ends, you will be charged KES {suggested_price}/month for {suggested_tier} based on your {total_properties} property(ies) and {total_units} unit(s).' if isinstance(suggested_price, int) else 'Please contact us for enterprise pricing.'
                    }
                
                return Response(response_data, status=201)
            else:
                print("CreateUnitView: Serializer errors:", serializer.errors)  # Debug logging
                return Response(serializer.errors, status=400)
                
        except Exception as e:
            print(f"CreateUnitView: Unexpected error: {str(e)}")  # Debug logging
            import traceback
            traceback.print_exc()
            return Response({"error": "Internal server error while creating unit"}, status=500)


# List units of a property (cached)
class PropertyUnitsView(APIView):
    permission_classes = [IsAuthenticated, IsLandlord, HasActiveSubscription]

    def get(self, request, property_id):
        cache_key = f"property:{property_id}:units"
        units_data = cache.get(cache_key)

        if not units_data:
            try:
                property = Property.objects.get(id=property_id, landlord=request.user)
                units = Unit.objects.filter(property_obj=property)
                serializer = UnitSerializer(units, many=True)
                units_data = serializer.data
                cache.set(cache_key, units_data, timeout=300)
            except Property.DoesNotExist:
                return Response(
                    {"error": "Property not found or you do not have permission"},
                    status=404,
                )

        return Response(units_data)


# Assign tenant to unit (invalidate cache)
# In your Django views.py - Update the AssignTenantView if needed
class AssignTenantView(APIView):
    permission_classes = [IsAuthenticated, IsLandlord, HasActiveSubscription]

    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

    def post(self, request, unit_id, tenant_id):
        logger.info(f"AssignTenantView: Landlord {request.user.id} attempting to assign tenant {tenant_id} to unit {unit_id}")

        try:
            # Validate unit exists and belongs to landlord
            unit = Unit.objects.get(id=unit_id, property_obj__landlord=request.user)
            logger.info(f"Unit found: {unit.unit_code}, available: {unit.is_available}, current tenant: {unit.tenant}")

            # Check if unit is available
            if unit.tenant is not None:
                logger.warning(f"Unit {unit_id} already has tenant {unit.tenant.id} assigned")
                return Response({
                    "error": f"Unit is already assigned to {unit.tenant.full_name}",
                    "status": "failed"
                }, status=400)

            if not unit.is_available:
                logger.warning(f"Unit {unit_id} is marked as not available")
                return Response({
                    "error": "Unit is not available for assignment",
                    "status": "failed"
                }, status=400)

            # Validate tenant exists and is a tenant
            tenant = CustomUser.objects.get(id=tenant_id, groups__name='tenant')
            logger.info(f"Tenant found: {tenant.full_name} (ID: {tenant.id})")

            # Check if tenant already has a unit assigned
            existing_unit = Unit.objects.filter(tenant=tenant).first()
            if existing_unit:
                logger.warning(f"Tenant {tenant_id} already has unit {existing_unit.id} assigned")
                return Response({
                    "error": f"Tenant already has unit {existing_unit.unit_number} assigned. Please remove them from their current unit first.",
                    "status": "failed"
                }, status=400)

            # Assign tenant to unit
            unit.tenant = tenant
            unit.is_available = False
            unit.assigned_date = timezone.now()
            unit.save()

            # Create or update tenant profile
            TenantProfile.objects.update_or_create(
                tenant=tenant,
                defaults={
                    'current_unit': unit,
                    'landlord': request.user,
                    'move_in_date': timezone.now()
                }
            )

            # Invalidate caches
            cache.delete(f"landlord:{request.user.id}:properties")
            cache.delete(f"property:{unit.property_obj.id}:units")

            logger.info(f"✅ Tenant {tenant.full_name} assigned to unit {unit.unit_number}")

            return Response({
                'message': f'Tenant {tenant.full_name} successfully assigned to unit {unit.unit_number}',
                'status': 'success',
                'unit': {
                    'id': unit.id,
                    'unit_number': unit.unit_number,
                    'property_name': unit.property_obj.name
                }
            }, status=200)

        except Unit.DoesNotExist:
            logger.error(f"Unit {unit_id} not found or not owned by landlord {request.user.id}")
            return Response({
                "error": "Unit not found or you do not have permission",
                "status": "failed"
            }, status=404)
        except CustomUser.DoesNotExist:
            logger.error(f"Tenant {tenant_id} not found or invalid user type")
            return Response({
                "error": "Tenant not found or invalid user type",
                "status": "failed"
            }, status=404)
        except Exception as e:
            logger.error(f"Unexpected error in AssignTenantView: {str(e)}")
            return Response({
                "error": "An unexpected error occurred",
                "status": "failed"
            }, status=500)
         
class RemoveTenantFromUnitView(APIView):
    permission_classes = [IsAuthenticated, IsLandlord, HasActiveSubscription]

    def post(self, request, unit_id):
        logger.info(f"RemoveTenantFromUnitView: Landlord {request.user.id} removing tenant from unit {unit_id}")

        try:
            # Validate unit exists and belongs to landlord
            unit = Unit.objects.get(id=unit_id, property_obj__landlord=request.user)
            logger.info(f"Unit found: {unit.unit_code}, current tenant: {unit.tenant}")

            if unit.tenant is None:
                logger.warning(f"Unit {unit_id} has no tenant assigned")
                return Response({
                    "error": "Unit has no tenant assigned",
                    "status": "failed"
                }, status=400)

            tenant_name = unit.tenant.full_name
            tenant_id = unit.tenant.id

            # Remove tenant from unit
            unit.tenant = None
            unit.is_available = True
            unit.assigned_date = None
            unit.save()

            # Invalidate caches
            cache.delete(f"landlord:{request.user.id}:properties")
            cache.delete(f"property:{unit.property_obj.id}:units")

            logger.info(f"✅ Tenant {tenant_name} removed from unit {unit.unit_number}")

            return Response({
                'message': f'Tenant {tenant_name} successfully removed from unit {unit.unit_number}',
                'status': 'success',
                'unit': {
                    'id': unit.id,
                    'unit_number': unit.unit_number,
                    'property_name': unit.property_obj.name
                }
            }, status=200)

        except Unit.DoesNotExist:
            logger.error(f"Unit {unit_id} not found or not owned by landlord {request.user.id}")
            return Response({
                "error": "Unit not found or you do not have permission",
                "status": "failed"
            }, status=404)
        except Exception as e:
            logger.error(f"Unexpected error in RemoveTenantFromUnitView: {str(e)}")
            return Response({
                "error": "An unexpected error occurred",
                "status": "failed"
            }, status=500)

# Password reset
class PasswordResetView(APIView):
    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Password reset email sent."}, status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
# Update property
class UpdatePropertyView(APIView):
    permission_classes = [IsAuthenticated, IsLandlord, HasActiveSubscription]

    def put(self, request, property_id):
        try:
            property = Property.objects.get(id=property_id, landlord=request.user)
            serializer = PropertySerializer(property, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                cache.delete(f"landlord:{request.user.id}:properties")
                cache.delete(f"property:{property_id}:units")
                return Response(serializer.data)
            return Response(serializer.errors, status=400)
        except Property.DoesNotExist:
            return Response({"error": "Property not found or you do not have permission"}, status=404)

    def delete(self, request, property_id):
        try:
            property = Property.objects.get(id=property_id, landlord=request.user)
            property.delete()
            cache.delete(f"landlord:{request.user.id}:properties")
            cache.delete(f"property:{property_id}:units")
            return Response({"message": "Property deleted successfully."}, status=200)
        except Property.DoesNotExist:
            return Response({"error": "Property not found or you do not have permission"}, status=404)

# Update unit
class UpdateUnitView(APIView):
    permission_classes = [IsAuthenticated, IsLandlord, HasActiveSubscription]

    def put(self, request, unit_id):
        try:
            unit = Unit.objects.get(id=unit_id, property_obj__landlord=request.user)
            serializer = UnitSerializer(unit, data=request.data, partial=True, context={'request': request})
            if serializer.is_valid():
                serializer.save()
                cache.delete(f"landlord:{request.user.id}:properties")
                cache.delete(f"property:{unit.property_obj.id}:units")
                return Response(serializer.data)
            return Response(serializer.errors, status=400)
        except Unit.DoesNotExist:
            return Response({"error": "Unit not found or you do not have permission"}, status=404)

    def delete(self, request, unit_id):
        try:
            unit = Unit.objects.get(id=unit_id, property_obj__landlord=request.user)
            property_id = unit.property_obj.id
            unit.delete()
            cache.delete(f"landlord:{request.user.id}:properties")
            cache.delete(f"property:{property_id}:units")
            return Response({"message": "Unit deleted successfully."}, status=200)
        except Unit.DoesNotExist:
            return Response({"error": "Unit not found or you do not have permission"}, status=404)


class TenantUpdateUnitView(APIView):
    permission_classes = [IsAuthenticated, IsTenant]

    def put(self, request):
        try:
            unit = Unit.objects.get(tenant=request.user)
            serializer = UnitNumberSerializer(unit, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                cache.delete(f"property:{unit.property_obj.id}:units")
                return Response(serializer.data)
            return Response(serializer.errors, status=400)
        except Unit.DoesNotExist:
            return Response({"error": "No unit assigned to you"}, status=404)

# Update user
class UpdateUserView(APIView):  
    permission_classes = [IsAuthenticated]

    def put(self, request, user_id):
        if request.user.id != user_id:
            return Response({"error": "You do not have permission to update this user."}, status=403)
        try:
            user = CustomUser.objects.get(id=user_id)
            serializer = UserSerializer(user, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                cache.delete(f"user:{user_id}")
                if user.user_type == "tenant":
                    cache.delete("tenants:list")
                return Response(serializer.data)
            return Response(serializer.errors, status=400)
        except CustomUser.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

    def delete(self, request, user_id):
        """
        Delete/Evict a user
        - Users can delete their own account
        - Landlords can evict tenants from their properties
        """
        try:
            user_to_delete = CustomUser.objects.get(id=user_id)
            
            logger.info(f"🗑️ Delete request: User {request.user.id} ({request.user.email}) attempting to delete user {user_id} ({user_to_delete.email})")
            logger.info(f"🔍 Requesting user is_landlord: {getattr(request.user, 'is_landlord', False)}")
            logger.info(f"🔍 Target user is_tenant: {getattr(user_to_delete, 'is_tenant', False)}")
            
            # Check permissions
            is_self_delete = request.user.id == user_id
            
            # Check if landlord is evicting their tenant (through unit assignment OR tenant profile)
            is_landlord_evicting_tenant = False
            if getattr(request.user, 'is_landlord', False) and getattr(user_to_delete, 'is_tenant', False):
                # Check if tenant is assigned to landlord's unit
                units_query = Unit.objects.filter(
                    property_obj__landlord=request.user,
                    tenant=user_to_delete
                )
                has_unit = units_query.exists()
                
                # Check if tenant has a profile linked to this landlord
                profile_query = TenantProfile.objects.filter(
                    tenant=user_to_delete,
                    landlord=request.user
                )
                has_profile = profile_query.exists()
                
                # Debug: Check what landlord the tenant actually belongs to
                actual_profile = TenantProfile.objects.filter(tenant=user_to_delete).first()
                if actual_profile:
                    logger.info(f"📋 Tenant's actual landlord: {actual_profile.landlord.email} (ID: {actual_profile.landlord.id})")
                    logger.info(f"📋 Current request user: {request.user.email} (ID: {request.user.id})")
                else:
                    logger.info(f"📋 Tenant has no TenantProfile at all")
                
                is_landlord_evicting_tenant = has_unit or has_profile
                
                logger.info(f"✅ Tenant has unit with landlord: {has_unit}")
                logger.info(f"✅ Tenant has profile with landlord: {has_profile}")
                logger.info(f"✅ Is landlord evicting tenant: {is_landlord_evicting_tenant}")
            
            if not (is_self_delete or is_landlord_evicting_tenant):
                # Also allow superusers to delete any tenant
                if request.user.is_superuser and getattr(user_to_delete, 'is_tenant', False):
                    logger.info(f"✅ Superuser {request.user.email} is deleting tenant {user_to_delete.email}")
                    is_landlord_evicting_tenant = True  # Treat superuser as having permission
                else:
                    logger.warning(f"❌ Permission denied: is_self_delete={is_self_delete}, is_landlord_evicting_tenant={is_landlord_evicting_tenant}, is_superuser={request.user.is_superuser}")
                    return Response({
                        "error": "You do not have permission to delete this user. This tenant belongs to a different landlord."
                    }, status=403)
            
            # If landlord is evicting tenant, remove them from their unit first
            if is_landlord_evicting_tenant:
                units = Unit.objects.filter(
                    property_obj__landlord=request.user,
                    tenant=user_to_delete
                )
                for unit in units:
                    logger.info(f"Removing tenant {user_to_delete.full_name} from unit {unit.unit_number}")
                    unit.tenant = None
                    unit.is_available = True
                    unit.assigned_date = None
                    unit.save()
                
                # Invalidate caches
                cache.delete(f"landlord:{request.user.id}:properties")
                for unit in units:
                    cache.delete(f"property:{unit.property_obj.id}:units")
            
            tenant_name = user_to_delete.full_name
            user_to_delete.delete()
            
            # Clear caches
            cache.delete(f"user:{user_id}")
            if getattr(user_to_delete, 'is_tenant', False):
                cache.delete("tenants:list")
            
            logger.info(f"✅ User {tenant_name} (ID: {user_id}) deleted successfully")
            
            return Response({
                "message": f"User {tenant_name} deleted successfully.",
                "status": "success"
            }, status=200)
            
        except CustomUser.DoesNotExist:
            return Response({"error": "User not found"}, status=404)
        except Exception as e:
            logger.error(f"Error deleting user {user_id}: {str(e)}")
            return Response({
                "error": "An error occurred while deleting the user",
                "status": "failed"
            }, status=500)


class AdjustRentView(APIView):
    permission_classes = [IsAuthenticated, IsLandlord, HasActiveSubscription]

    def post(self, request):
        landlord = request.user
        adjustment_type = request.data.get('adjustment_type')  # 'percentage' or 'fixed'
        value = request.data.get('value')  # decimal, positive for increase, negative for decrease
        unit_type_id = request.data.get('unit_type_id')  # optional, if provided, adjust only units of this type

        logger.info(f"AdjustRentView POST: Landlord {landlord.id} adjusting rent, adjustment_type={adjustment_type}, value={value}, unit_type_id={unit_type_id}")

        if adjustment_type not in ['percentage', 'fixed']:
            return Response({"error": "adjustment_type must be 'percentage' or 'fixed'"}, status=400)

        try:
            value = Decimal(value)
        except (ValueError, TypeError):
            return Response({"error": "value must be a valid number"}, status=400)

        # Filter units
        units = Unit.objects.filter(property_obj__landlord=landlord)
        if unit_type_id:
            try:
                unit_type = UnitType.objects.get(id=unit_type_id, landlord=landlord)
                units = units.filter(unit_type=unit_type)
            except UnitType.DoesNotExist:
                return Response({"error": "UnitType not found or not owned by you"}, status=404)

        updated_count = 0
        for unit in units:
            old_rent = unit.rent
            if adjustment_type == 'percentage':
                new_rent = old_rent * (Decimal(1) + value / Decimal(100))
            else:  # fixed
                new_rent = old_rent + value
            # Ensure rent doesn't go negative
            new_rent = max(Decimal(0), new_rent)
            unit.rent = new_rent
            unit.save()  # This will update rent_remaining
            updated_count += 1

        logger.info(f"AdjustRentView POST: Rent adjusted for {updated_count} units by landlord {landlord.id}")

        # Invalidate caches
        cache.delete(f"landlord:{landlord.id}:properties")
        # Also invalidate rent_summary cache
        from payments.views import RentSummaryView
        cache.delete(f"rent_summary:{landlord.id}")

        return Response({"message": f"Rent adjusted for {updated_count} units successfully"})

    def put(self, request):
        landlord = request.user
        new_rent = request.data.get('new_rent')
        unit_type_id = request.data.get('unit_type_id')  # optional

        logger.info(f"AdjustRentView PUT: Landlord {landlord.id} setting new rent, new_rent={new_rent}, unit_type_id={unit_type_id}")

        if new_rent is None:
            return Response({"error": "new_rent is required"}, status=400)

        try:
            new_rent = Decimal(new_rent)
        except (ValueError, TypeError):
            return Response({"error": "new_rent must be a valid number"}, status=400)

        units = Unit.objects.filter(property_obj__landlord=landlord)
        if unit_type_id:
            try:
                unit_type = UnitType.objects.get(id=unit_type_id, landlord=landlord)
                units = units.filter(unit_type=unit_type)
            except UnitType.DoesNotExist:
                return Response({"error": "UnitType not found or not owned by you"}, status=404)

        updated_count = 0
        for unit in units:
            unit.rent = new_rent
            unit.save()
            updated_count += 1

        logger.info(f"AdjustRentView PUT: Rent set to {new_rent} for {updated_count} units by landlord {landlord.id}")

        # Invalidate caches
        cache.delete(f"landlord:{landlord.id}:properties")
        from payments.views import RentSummaryView
        cache.delete(f"rent_summary:{landlord.id}")

        return Response({"message": f"Rent set to {new_rent} for {updated_count} units successfully"})

# View to check subscription status (landlord only)
class SubscriptionStatusView(APIView):
    permission_classes = [IsAuthenticated, IsLandlord]

    def get(self, request):
        user = request.user
        try:
            subscription = Subscription.objects.get(user=user)
            data = {
                "plan": subscription.plan,
                "is_active": subscription.is_active(),
                "expiry_date": subscription.expiry_date,
                "status": "Subscribed" if subscription.is_active() else "Inactive"
            }
        except Subscription.DoesNotExist:
            data = {"status": "No subscription found"}
        return Response(data)

# View to update landlord's Mpesa till number (landlord only)
class UpdateTillNumberView(APIView):
    permission_classes = [IsAuthenticated, IsLandlord, HasActiveSubscription]

    def patch(self, request):
        user = request.user
        till_number = request.data.get('mpesa_till_number')
        if not till_number:
            return Response({"error": "mpesa_till_number is required"}, status=400)

        user.mpesa_till_number = till_number
        user.save()
        return Response({"message": "Till number updated successfully", "mpesa_till_number": till_number})

    def put(self, request):
        return self.patch(request)


# Endpoint to get or update the currently authenticated user
class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            # invalidate cache for this user
            cache.delete(f"user:{request.user.id}")
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def put(self, request):
        return self.patch(request)


# View to update tenant reminder preferences
class UpdateReminderPreferencesView(APIView):
    permission_classes = [IsAuthenticated, IsTenant]

    def patch(self, request):
        serializer = ReminderPreferencesSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)


# Password reset confirm view
class PasswordResetConfirmView(APIView):
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            # Send confirmation email
            try:
                send_mail(
                    subject="Password Reset Confirmation",
                    message=f"Hello {user.full_name},\n\nYour password has been successfully reset.\n\nIf you did not make this change, please contact support immediately.\n\nBest regards,\nMakao Center",
                    from_email=None,
                    recipient_list=[user.email],
                )
            except Exception as e:
                logger.error(f"Failed to send password reset confirmation email: {e}")
            return Response({"message": "Password has been reset successfully."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Change password view for authenticated users
class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        user = request.user
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        enable_2fa = request.data.get('enable_2fa', False)

        if not current_password or not new_password:
            return Response({"error": "Current password and new password are required."}, status=status.HTTP_400_BAD_REQUEST)

        # Verify current password
        if not user.check_password(current_password):
            return Response({"error": "Current password is incorrect."}, status=status.HTTP_400_BAD_REQUEST)

        # Validate new password
        try:
            from django.contrib.auth.password_validation import validate_password
            validate_password(new_password, user)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        # Set new password
        user.set_password(new_password)
        user.save()

        # Send confirmation email
        try:
            send_mail(
                subject="Password Changed Successfully",
                message=f"Hello {user.full_name},\n\nYour password has been successfully changed.\n\nIf you did not make this change, please contact support immediately.\n\nBest regards,\nMakao Center",
                from_email=None,
                recipient_list=[user.email],
            )
        except Exception as e:
            logger.error(f"Failed to send password change confirmation email: {e}")

        return Response({"message": "Password has been changed successfully. A confirmation email has been sent."}, status=status.HTTP_200_OK)


# View to list available units for landlords to share with tenants
class LandlordAvailableUnitsView(APIView):
    permission_classes = [IsAuthenticated, IsLandlord, HasActiveSubscription]

    def get(self, request):
        units = Unit.objects.filter(property_obj__landlord=request.user, is_available=True)
        serializer = AvailableUnitsSerializer(units, many=True)
        return Response(serializer.data)


# New endpoint to log requests and return a welcome message
class WelcomeView(APIView):
    def get(self, request):
        logger.info(f"Request received: {request.method} {request.path}")
        return Response({"message": "Welcome to the Makau Rentals API!"})


class LandlordsListView(APIView):
    permission_classes = [IsAuthenticated, IsSuperuser]

    def get(self, request):
        landlords = CustomUser.objects.filter(groups__name='landlord')
        data = []
        for landlord in landlords:
            subscription = getattr(landlord, 'subscription', None)
            status = 'Subscribed' if subscription and subscription.is_active() else 'Inactive or None'
            data.append({
                'id': landlord.id,
                'email': landlord.email,
                'name': landlord.full_name,
                'subscription_plan': subscription.plan if subscription else 'None',
                'subscription_status': status,
                'expiry_date': subscription.expiry_date if subscription else None,
            })
        return Response(data)


class PendingApplicationsView(APIView):
    permission_classes = [IsAuthenticated, IsLandlord, HasActiveSubscription]

    def get(self, request):
        # For now, return tenants without assigned units (pending applications)
        tenants = CustomUser.objects.filter(
            groups__name='tenant',
            is_active=True,
            unit__isnull=True
        )
        serializer = UserSerializer(tenants, many=True)
        return Response(serializer.data)


class EvictedTenantsView(APIView):
    permission_classes = [IsAuthenticated, IsLandlord, HasActiveSubscription]

    def get(self, request):
        # For now, return inactive tenants that were previously assigned to landlord's units
        evicted_tenants = CustomUser.objects.filter(
            groups__name='tenant',
            is_active=False,
            unit__property_obj__landlord=request.user
        ).distinct()
        serializer = UserSerializer(evicted_tenants, many=True)
        return Response(serializer.data)
# Add this view to your views.py to validate and fetch landlord data

class ValidateLandlordView(APIView):
    """Endpoint to validate landlord ID and fetch their properties"""
    
    def post(self, request):
        landlord_code = request.data.get('landlord_code')
        
        print(f"🔍 Validating landlord with code: {landlord_code}")  # DEBUG
        
        if not landlord_code:
            return Response({
                'error': 'Landlord code is required'
            }, status=400)
        
        try:
            # Find landlord by landlord_code
            landlord = CustomUser.objects.get(
                landlord_code=landlord_code,
                is_active=True,
                groups__name='landlord'
            )
            
            print(f"✅ Landlord found: {landlord.full_name} (ID: {landlord.id})")  # DEBUG
            
            # Get properties for this landlord
            properties = Property.objects.filter(landlord=landlord)
            print(f"📊 Found {properties.count()} properties for landlord")  # DEBUG
            
            properties_data = []
            for property_obj in properties:
                print(f"🏠 Processing property: {property_obj.name} (ID: {property_obj.id})")  # DEBUG
                
                # Get available units for this property
                try:
                    # Try different related names
                    available_units = None
                    
                    if hasattr(property_obj, 'units'):
                        available_units = property_obj.units.filter(
                            is_available=True,
                            tenant__isnull=True
                        )
                        print(f"   Using 'units' related name, found {available_units.count()} available units")  # DEBUG
                    elif hasattr(property_obj, 'unit_set'):
                        available_units = property_obj.unit_set.filter(
                            is_available=True,
                            tenant__isnull=True
                        )
                        print(f"   Using 'unit_set' related name, found {available_units.count()} available units")  # DEBUG
                    else:
                        # Fallback: direct query
                        available_units = Unit.objects.filter(
                            property_obj=property_obj,
                            is_available=True,
                            tenant__isnull=True
                        )
                        print(f"   Using direct query, found {available_units.count()} available units")  # DEBUG
                        
                except Exception as e:
                    print(f"   ❌ Error accessing units: {e}")  # DEBUG
                    continue
                
                if available_units and available_units.exists():
                    units_data = []
                    for unit in available_units:
                        unit_data = {
                            'id': unit.id,
                            'unit_number': unit.unit_number,
                            'unit_code': unit.unit_code,
                            'rent': float(unit.rent),
                            'deposit': float(unit.deposit),
                        }
                        
                        # Add room type info if available
                        if hasattr(unit, 'unit_type') and unit.unit_type:
                            unit_data['room_type'] = unit.unit_type.name
                        else:
                            unit_data['room_type'] = 'N/A'
                            
                        # Add bedroom/bathroom info
                        if hasattr(unit, 'bedrooms'):
                            unit_data['bedrooms'] = unit.bedrooms
                        else:
                            unit_data['bedrooms'] = 0
                            
                        if hasattr(unit, 'bathrooms'):
                            unit_data['bathrooms'] = unit.bathrooms
                        else:
                            unit_data['bathrooms'] = 1
                        
                        units_data.append(unit_data)
                        print(f"   ✅ Added unit: {unit.unit_number}")  # DEBUG
                    
                    properties_data.append({
                        'id': property_obj.id,
                        'name': property_obj.name,
                        'address': f"{getattr(property_obj, 'city', '')}, {getattr(property_obj, 'state', '')}",
                        'units': units_data
                    })
                    print(f"   🏢 Added property with {len(units_data)} units")  # DEBUG
                else:
                    print(f"   ⚠️  No available units for property {property_obj.name}")  # DEBUG
            
            print(f"📦 Final properties data: {len(properties_data)} properties with available units")  # DEBUG
            
            if not properties_data:
                return Response({
                    'error': 'This landlord has no available units at the moment. All units are currently occupied. Please contact the landlord for more information.',
                    'no_available_units': True
                }, status=400)
            
            return Response({
                'landlord_id': landlord.id,
                'landlord_name': landlord.full_name,
                'landlord_email': landlord.email,
                'landlord_phone': getattr(landlord, 'phone_number', ''),
                'properties': properties_data
            }, status=200)
            
        except CustomUser.DoesNotExist:
            print(f"❌ Landlord not found with code: {landlord_code}")  # DEBUG
            return Response({
                'error': 'Landlord ID not found. Please check and try again.'
            }, status=404)
        except Exception as e:
            print(f"💥 Unexpected error: {str(e)}")  # DEBUG
            logger.error(f"Error in ValidateLandlordView: {str(e)}")
            return Response({
                'error': 'Internal server error while validating landlord'
            }, status=500)


# Update your TenantRegistrationStepView to handle Step 2 validation
class TenantRegistrationStepView(APIView):
    def post(self, request, step):
        try:
            data = request.data.copy()  # Make a copy to avoid mutating original
            session_id = data.get('session_id') or str(uuid.uuid4())
            
            # STEP 2: Validate landlord ID before saving
            if step == 2:
                landlord_id = data.get('landlord_id')
                if landlord_id:
                    try:
                        # Verify landlord exists and is active
                        landlord = CustomUser.objects.get(
                            landlord_code=landlord_id,
                            is_active=True,
                            groups__name='landlord'
                        )
                        
                        # Add landlord info to cached data
                        data['landlord_db_id'] = landlord.id
                        data['verified'] = True
                        
                    except CustomUser.DoesNotExist:
                        return Response({
                            'error': 'Landlord ID not found. Please check and try again.',
                            'status': 'failed'
                        }, status=400)
            
            # STEP 4: Document upload is optional; cache flags and document if provided
            if step == 4:
                id_document = data.get('id_document')
                if id_document:
                    logger.info(f"Document uploaded for session {session_id}: {data.get('id_document_name', 'unknown')}")
                else:
                    logger.info(f"No document uploaded for session {session_id}; proceeding with optional step 4 data")
            
            # Store step data in cache
            cache_key = f"tenant_registration_{session_id}_step_{step}"
            cache.set(cache_key, data, timeout=3600)  # 1 hour expiry
            
            return Response({
                'session_id': session_id,  # Make sure this is returned
                'step': step,
                'status': 'saved',
                'message': f'Step {step} data saved successfully'
            })
            
        except Exception as e:
            logger.error(f"Error in TenantRegistrationStepView: {str(e)}")
            return Response({
                'error': 'Internal server error',
                'status': 'failed'
            }, status=500)
        
class LandlordRegistrationStepView(APIView):
    def post(self, request, step):
        data = request.data
        session_id = data.get('session_id') or str(uuid.uuid4())
        
        # Store step data in cache
        cache_key = f"landlord_registration_{session_id}_step_{step}"
        cache.set(cache_key, data, timeout=3600)
        
        return Response({
            'session_id': session_id,
            'step': step,
            'status': 'saved',
            'message': f'Step {step} data saved successfully'
        })

class CompleteTenantRegistrationView(APIView):
    def post(self, request):
        """
        Complete tenant registration with proper landlord validation
        Handles both deposit-required and existing-tenant registration flows
        """
        try:
            data = request.data
            session_id = data.get('session_id')

            if not session_id:
                return Response({
                    'status': 'error',
                    'message': 'Session ID is required'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Retrieve all step data from cache
            all_data = {}
            for step in range(2, 7):
                cache_key = f"tenant_registration_{session_id}_step_{step}"
                step_data = cache.get(cache_key)
                if step_data:
                    all_data.update(step_data)

            # Merge with final data
            all_data.update(data)

            # Get flags for deposit and existing tenant
            already_living_in_property = all_data.get('already_living_in_property', False)
            requires_deposit = all_data.get('requires_deposit', True)

            # Validate landlord code exists
            landlord_code = all_data.get('landlord_code')
            if not landlord_code:
                return Response({
                    'status': 'error',
                    'message': 'Landlord code is required'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Verify landlord exists and is active
            try:
                landlord = CustomUser.objects.get(
                    landlord_code=landlord_code,
                    is_active=True,
                    groups__name='landlord'
                )
            except CustomUser.DoesNotExist:
                return Response({
                    'status': 'error',
                    'message': 'Invalid landlord code. Please check and try again.'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Validate required fields
            required_fields = ['email', 'full_name', 'password', 'phone_number']
            missing_fields = [field for field in required_fields if not all_data.get(field)]
            if missing_fields:
                return Response({
                    'status': 'error',
                    'message': f'Missing required fields: {", ".join(missing_fields)}'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Check if email already exists
            if CustomUser.objects.filter(email=all_data['email']).exists():
                return Response({
                    'status': 'error',
                    'message': 'Email already exists'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Create the tenant user
            # Create as INACTIVE by default - will be activated after deposit payment or landlord approval
            user = CustomUser.objects.create_user(
                email=all_data['email'],
                full_name=all_data['full_name'],
                user_type='tenant',
                password=all_data['password'],
                phone_number=all_data['phone_number'],
                national_id=all_data.get('national_id'),
                emergency_contact=all_data.get('emergency_contact'),
                is_active=False  # All tenants start as inactive
            )

            # Handle ID document if provided (base64 encoded)
            id_document_base64 = all_data.get('id_document')
            if id_document_base64:
                try:
                    import base64
                    from django.core.files.base import ContentFile
                    
                    # Decode base64 and save document
                    format, imgstr = id_document_base64.split(';base64,')
                    ext = format.split('/')[-1]
                    document_name = f"{user.id}_{user.full_name.replace(' ', '_')}_id.{ext}"
                    
                    user.id_document.save(
                        document_name,
                        ContentFile(base64.b64decode(imgstr)),
                        save=True
                    )
                    logger.info(f"✅ ID document saved for tenant {user.full_name}")
                except Exception as doc_error:
                    logger.error(f"Failed to save ID document: {str(doc_error)}")
                    # Don't fail registration if document save fails

            # Create tenant profile linked to landlord (REQUIRED)
            TenantProfile.objects.create(
                tenant=user,
                landlord=landlord  # This is now required and validated
            )

            logger.info(f"✅ Tenant {user.full_name} registered with landlord {landlord.full_name}")

            # Get unit if provided
            unit_code = all_data.get('unit_code')
            unit = None
            if unit_code:
                try:
                    unit = Unit.objects.get(
                        unit_code=unit_code,
                        property_obj__landlord=landlord,
                        is_available=True
                    )
                except Unit.DoesNotExist:
                    logger.warning(f"Unit with code {unit_code} not found or not available")

            # Create TenantApplication
            from accounts.models import TenantApplication
            application = TenantApplication.objects.create(
                tenant=user,
                landlord=landlord,
                unit=unit,
                already_living_in_property=already_living_in_property,
                deposit_required=requires_deposit,
                deposit_paid=False,  # Will be updated when payment is verified
                status='pending' if already_living_in_property else 'pending',
                notes=all_data.get('notes', '')
            )

            # Handle unit assignment for deposit-paid registrations
            if not already_living_in_property and unit:
                try:
                    # Check for deposit payments by session_id or tenant
                    from payments.models import Payment
                    from datetime import timedelta
                    
                    logger.info(f"🔍 Checking for deposit payments for session_id={session_id}, unit={unit.unit_number}, tenant={user.email}")
                    
                    # Look for recent successful deposit payments for this unit (within last 2 hours for safety)
                    recent_time = timezone.now() - timedelta(hours=2)
                    
                    # FIRST: Try to find payment by session_id in description (most reliable)
                    session_deposit_payments = Payment.objects.filter(
                        unit=unit,
                        payment_type='deposit',
                        status='completed',
                        tenant__isnull=True,
                        description__icontains=f"Session: {session_id}",  # ✅ Match by session_id
                        created_at__gte=recent_time
                    )
                    
                    # FALLBACK: If no session match, look for any unlinked payments for this unit
                    if not session_deposit_payments.exists():
                        session_deposit_payments = Payment.objects.filter(
                            unit=unit,
                            payment_type='deposit',
                            status='completed',
                            tenant__isnull=True,
                            created_at__gte=recent_time
                        )
                        logger.warning(f"⚠️ No session_id match found, using fallback query for unit {unit.unit_number}")
                    
                    logger.info(f"📊 Found {session_deposit_payments.count()} unlinked deposit payment(s) for unit {unit.unit_number}")
                    
                    # Also check if payment is already linked to this tenant
                    tenant_deposit_payments = Payment.objects.filter(
                        tenant=user,
                        unit=unit,
                        payment_type='deposit',
                        status='completed'
                    )
                    
                    logger.info(f"📊 Found {tenant_deposit_payments.count()} deposit payment(s) already linked to tenant {user.email}")
                    
                    # Check if any valid deposit payment exists
                    deposit_paid = session_deposit_payments.exists() or tenant_deposit_payments.exists()

                    if deposit_paid:
                        # Link any unlinked payments to this tenant
                        linked_count = session_deposit_payments.update(tenant=user)
                        logger.info(f"🔗 Linked {linked_count} deposit payment(s) to tenant {user.full_name}")
                        
                        # Mark deposit as paid but keep status as 'pending' for landlord approval
                        # Tenant remains inactive until landlord approves
                        application.deposit_paid = True
                        application.status = 'pending'  # Keep pending until landlord approval
                        application.save()

                        # Reserve the unit but don't assign tenant yet
                        unit.is_available = False
                        unit.save()

                        # Update tenant profile with unit (reserved)
                        user.tenant_profile.current_unit = unit
                        user.tenant_profile.save()

                        # DO NOT activate user - must wait for landlord approval
                        # user.is_active remains False

                        logger.info(f"⏳ Tenant {user.full_name} registered with deposit paid - awaiting landlord approval for unit {unit.unit_number}")
                    else:
                        logger.info(f"⏳ Tenant {user.full_name} created but no deposit payment found - account remains inactive")
                    
                except Exception as e:
                    logger.error(f"❌ Error processing deposit payment: {str(e)}")

            # Clean up cache
            for step in range(2, 7):
                cache_key = f"tenant_registration_{session_id}_step_{step}"
                cache.delete(cache_key)

            response_data = {
                'status': 'success',
                'user_id': user.id,
                'email': user.email,
                'full_name': user.full_name,
                'requires_approval': True,  # All tenants now require approval
                'application_id': application.id
            }

            # All tenants must wait for landlord approval
            response_data['message'] = 'Registration submitted! Your application is pending landlord approval. You will be notified once approved.'

            return Response(response_data, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Unexpected error in tenant registration: {str(e)}")
            # Clean up if user was created but profile failed
            if 'user' in locals():
                user.delete()
            return Response({
                'status': 'error',
                'message': 'Internal server error during registration'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class CompleteLandlordRegistrationView(APIView):
    def post(self, request):
        """
        Complete landlord registration after all steps are done
        """
        try:
            data = request.data
            session_id = data.get('session_id')
            
            if not session_id:
                return Response({
                    'status': 'error',
                    'message': 'Session ID is required'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Retrieve all step data from cache
            all_data = {}
            for step in range(2, 5):
                cache_key = f"landlord_registration_{session_id}_step_{step}"
                step_data = cache.get(cache_key)
                if step_data:
                    step_data.pop('step', None)
                    all_data.update(step_data)

            all_data.update(data)
            
            # Validate required fields (only essential ones for landlord creation)
            required_fields = ['full_name', 'email', 'password']

            missing_fields = [field for field in required_fields if not all_data.get(field)]
            if missing_fields:
                return Response({
                    'status': 'error',
                    'message': f'Missing required fields: {", ".join(missing_fields)}'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Check if email already exists
            if CustomUser.objects.filter(email=all_data['email']).exists():
                return Response({
                    'status': 'error',
                    'message': 'Email already exists'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Create the landlord user
            try:
                user_data = {
                    'email': all_data['email'],
                    'full_name': all_data['full_name'],
                    'user_type': 'landlord',
                    'password': all_data['password'],
                    'phone_number': all_data['phone_number'],
                    'national_id': all_data['national_id'],
                    'mpesa_till_number': all_data['mpesa_till_number'],
                }
                
                # Add optional fields if they exist
                if 'address' in all_data:
                    user_data['address'] = all_data['address']
                if 'website' in all_data:
                    user_data['website'] = all_data['website']

                landlord = CustomUser.objects.create_user(**user_data)

                # Create properties and units if provided
                properties_data = all_data.get('properties', [])
                created_properties = []
                
                for property_data in properties_data:
                    try:
                        # Create property
                        property_obj = Property.objects.create(
                            landlord=landlord,
                            name=property_data.get('name', f'Property-{uuid.uuid4().hex[:6].upper()}'),
                            city='Nairobi',
                            state='Nairobi',
                            unit_count=len(property_data.get('units', []))
                        )
                        
                        # Create units for this property
                        units_data = property_data.get('units', [])
                        created_units = []
                        
                        for i, unit_data in enumerate(units_data, 1):
                            # Create unit type if it doesn't exist
                            room_type = unit_data.get('room_type') or unit_data.get('roomType')
                            
                            # Validate that room_type is provided
                            if not room_type:
                                logger.error(f"Missing room_type for unit {i} in property {property_data.get('name')}")
                                raise ValidationError(f"Room type is required for all units. Unit {i} is missing room type.")
                            
                            unit_type, created = UnitType.objects.get_or_create(
                                landlord=landlord,
                                name=room_type,
                                defaults={
                                    'deposit': Decimal('0.00'),
                                    'rent': Decimal(unit_data.get('monthlyRent', '0')),
                                    'number_of_units': 0
                                }
                            )
                            
                            # Generate unique unit code
                            unit_number = unit_data.get('unitNumber', f'Unit-{i}')
                            unit_code = f"U-{property_obj.id}-{unit_number}-{uuid.uuid4().hex[:8]}"
                            
                            # Create the unit
                            unit = Unit.objects.create(
                                property_obj=property_obj,
                                unit_code=unit_code,  # Use the unique generated code
                                unit_number=unit_number,
                                bedrooms=self.get_bedroom_count(room_type),
                                bathrooms=1,
                                unit_type=unit_type,
                                rent=Decimal(unit_data.get('monthlyRent', '0')),
                                deposit=Decimal(unit_data.get('monthlyRent', '0')),  # Deposit = 1 month rent
                                is_available=True
                            )
                            created_units.append(unit.id)
                        
                        created_properties.append({
                            'id': property_obj.id,
                            'name': property_obj.name,
                            'units_count': len(created_units)
                        })
                        
                    except Exception as prop_error:
                        logger.error(f"Error creating property: {str(prop_error)}")
                        continue

                # FIX 2: Check if subscription already exists before creating
                try:
                    subscription = Subscription.objects.get(user=landlord)
                    # Subscription already exists (was created by CustomUserManager)
                    logger.info(f"Subscription already exists for user {landlord.id}")
                except Subscription.DoesNotExist:
                    # Create subscription for landlord (free trial)
                    subscription = Subscription.objects.create(
                        user=landlord,
                        plan="free",
                        expiry_date=timezone.now() + timedelta(days=60)
                    )
                    logger.info(f"Created new subscription for user {landlord.id}")

                # Clean up cache
                for step in range(2, 5):
                    cache_key = f"landlord_registration_{session_id}_step_{step}"
                    cache.delete(cache_key)

                # Prepare response data
                response_data = {
                    'status': 'success',
                    'user_id': landlord.id,
                    'landlord_code': landlord.landlord_code,
                    'email': landlord.email,
                    'full_name': landlord.full_name,
                    'properties_created': created_properties,
                    'subscription': {
                        'plan': subscription.plan,
                        'expiry_date': subscription.expiry_date
                    },
                    'message': 'Landlord registration completed successfully'
                }

                # Send welcome email
                self.send_welcome_email(landlord)

                return Response(response_data, status=status.HTTP_201_CREATED)
                
            except ValidationError as e:
                return Response({
                    'status': 'error',
                    'message': str(e)
                }, status=status.HTTP_400_BAD_REQUEST)
                
            except Exception as e:
                logger.error(f"Error creating landlord user: {str(e)}")
                # If user creation fails but user was created, delete it
                if 'landlord' in locals():
                    landlord.delete()
                return Response({
                    'status': 'error',
                    'message': 'Failed to create landlord account'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        except Exception as e:
            logger.error(f"Unexpected error in landlord registration: {str(e)}")
            return Response({
                'status': 'error',
                'message': 'Internal server error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def get_bedroom_count(self, room_type):
        """
        Map room type string to bedroom count
        """
        room_type_mapping = {
            'studio': 0,
            '1-bedroom': 1,
            '2-bedroom': 2,
            '3-bedroom': 3
        }
        return room_type_mapping.get(room_type, 0)

    def send_welcome_email(self, landlord):
        """
        Send welcome email to landlord
        """
        try:
            subject = "Welcome to Makao Rentals - Your Landlord Account is Ready!"
            message = f"""
            Hello {landlord.full_name},

            Welcome to  Makao Rentals! Your landlord account has been successfully created.

            Account Details:
            - Landlord Code: {landlord.landlord_code}
            - Email: {landlord.email}
            - M-Pesa Till: {landlord.mpesa_till_number}

            Your 60-day free trial has been activated. You can now:
            - Manage your properties
            - Add units and set rents
            - Receive rent payments via M-Pesa
            - Track tenant payments

            Login to your dashboard to get started.

            Best regards,
            Makao Rentals Team
            """

            logger.info(f"Welcome email prepared for {landlord.email}: {subject}")
            
        except Exception as e:
            logger.error(f"Failed to send welcome email: {str(e)}")

# In accounts/views.py - ADD THIS VIEW

class UnitListView(generics.ListAPIView):
    """
    Get all units for the authenticated user
    - Landlords: Get all their units across all properties
    - Tenants: Get their assigned unit
    """
    serializer_class = UnitSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        print(f"🔍 UnitListView - User: {user.email}, Type: {user.user_type}")
        
        if getattr(user, 'is_landlord', False):
            # Landlords see all units from their properties
            units = Unit.objects.filter(property_obj__landlord=user).select_related(
                'property_obj', 'unit_type', 'tenant'
            )
            print(f"🏠 Landlord units found: {units.count()}")
            return units
            
        elif getattr(user, 'is_tenant', False):
            # Tenants see only their assigned unit
            units = Unit.objects.filter(tenant=user).select_related(
                'property_obj', 'unit_type'
            )
            print(f"🏠 Tenant units found: {units.count()}")
            return units
            
        else:
            print("❌ Unknown user type")
            return Unit.objects.none()

    def list(self, request, *args, **kwargs):
        try:
            response = super().list(request, *args, **kwargs)
            print(f"✅ UnitListView response: {len(response.data)} units")
            return response
        except Exception as e:
            print(f"❌ UnitListView error: {str(e)}")
            return Response(
                {"error": "Failed to fetch units", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class LandlordProfileView(APIView):
    """Get landlord's own profile information"""
    permission_classes = [IsAuthenticated, IsLandlord, HasActiveSubscription]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

# Add this view to handle tenant rejection/deletion
class DeleteTenantView(APIView):
    permission_classes = [IsAuthenticated, IsLandlord, HasActiveSubscription]

    def delete(self, request, tenant_id):
        logger.info(f"DeleteTenantView: Landlord {request.user.id} attempting to delete tenant {tenant_id}")

        try:
            # Validate tenant exists and belongs to landlord's properties
            tenant = CustomUser.objects.get(
                id=tenant_id,
                groups__name='tenant',
                unit__property_obj__landlord=request.user
            )
            
            tenant_name = tenant.full_name
            tenant_email = tenant.email
            
            # Delete the tenant
            tenant.delete()
            
            logger.info(f"✅ Tenant {tenant_name} ({tenant_email}) deleted by landlord {request.user.id}")

            return Response({
                'message': f'Tenant {tenant_name} has been successfully removed',
                'status': 'success'
            }, status=200)

        except CustomUser.DoesNotExist:
            logger.error(f"Tenant {tenant_id} not found or not associated with landlord {request.user.id}")
            return Response({
                "error": "Tenant not found or you do not have permission",
                "status": "failed"
            }, status=404)
        except Exception as e:
            logger.error(f"Unexpected error in DeleteTenantView: {str(e)}")
            return Response({
                "error": "An unexpected error occurred",
                "status": "failed"
            }, status=500)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_pending_applications(request):
    """ENHANCED: Get tenants without units (pending applications)"""
    if not getattr(request.user, 'is_landlord', False):
        return Response({"error": "Only landlords can access this endpoint"}, status=status.HTTP_403_FORBIDDEN)
    
    # Get tenants without units OR tenants not assigned to this landlord's units
    all_tenants = CustomUser.objects.filter(groups__name='tenant')
    landlord_tenant_ids = Unit.objects.filter(
        property_obj__landlord=request.user
    ).exclude(tenant__isnull=True).values_list('tenant_id', flat=True)
    
    pending_tenants = all_tenants.exclude(id__in=landlord_tenant_ids)
    
    serializer = TenantWithUnitSerializer(pending_tenants, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def assign_tenant_to_unit(request, unit_id):
    """ENHANCED: Assign tenant to unit"""
    unit = get_object_or_404(Unit, id=unit_id)
    
    # Check if user owns this unit
    if unit.property_obj.landlord != request.user:
        return Response({"error": "You don't own this unit"}, status=status.HTTP_403_FORBIDDEN)
    
    tenant_id = request.data.get('tenant_id')
    if not tenant_id:
        return Response({"error": "tenant_id is required"}, status=status.HTTP_400_BAD_REQUEST)
    
    tenant = get_object_or_404(CustomUser, id=tenant_id, groups__name='tenant')
    
    # Check if unit is available
    if not unit.is_available:
        return Response({"error": "Unit is not available"}, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if tenant already has a unit
    if Unit.objects.filter(tenant=tenant, is_available=False).exists():
        return Response({"error": "Tenant already has a unit assigned"}, status=status.HTTP_400_BAD_REQUEST)
    
    # Assign tenant to unit
    unit.tenant = tenant
    unit.is_available = False
    unit.assigned_date = timezone.now()
    unit.save()
    
    # Create or update tenant profile
    TenantProfile.objects.update_or_create(
        tenant=tenant,
        defaults={'current_unit': unit, 'move_in_date': timezone.now()}
    )
    
    return Response({
        "success": True,
        "message": f"Tenant {tenant.full_name} assigned to unit {unit.unit_number}",
        "unit": UnitSerializer(unit).data
    })

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def remove_tenant_from_unit(request, unit_id):
    """ENHANCED: Remove tenant from unit"""
    unit = get_object_or_404(Unit, id=unit_id)
    
    # Check if user owns this unit
    if unit.property_obj.landlord != request.user:
        return Response({"error": "You don't own this unit"}, status=status.HTTP_403_FORBIDDEN)
    
    if not unit.tenant:
        return Response({"error": "No tenant assigned to this unit"}, status=status.HTTP_400_BAD_REQUEST)
    
    tenant_name = unit.tenant.full_name
    unit.remove_tenant()
    
    # Update tenant profile
    TenantProfile.objects.filter(tenant=unit.tenant, current_unit=unit).update(current_unit=None)
    
    return Response({
        "success": True,
        "message": f"Tenant {tenant_name} removed from unit {unit.unit_number}"
    })
# ===== ENHANCED TENANT MANAGEMENT VIEWS =====
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_users(request):
    """Get all users with proper filtering - ENHANCED"""
    user_type = request.GET.get('user_type')
    
    if request.user.user_type == 'landlord':
        # Landlords can see their tenants and themselves
        if user_type == 'tenant':
            # Get tenants assigned to landlord's units
            tenants = CustomUser.objects.filter(
                user_type='tenant',
                assigned_units__property_obj__landlord=request.user
            ).distinct()
        else:
            # Return all users (with limitations)
            tenants = CustomUser.objects.filter(
                Q(user_type='tenant', assigned_units__property_obj__landlord=request.user) |
                Q(id=request.user.id)
            ).distinct()
    else:
        # Tenants can only see themselves
        tenants = CustomUser.objects.filter(id=request.user.id)
    
    serializer = CustomUserSerializer(tenants, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_tenants_with_units(request):
    """ENHANCED: Get tenants with their unit information"""
    if not getattr(request.user, 'is_landlord', False):
        return Response({"error": "Only landlords can access this endpoint"}, status=status.HTTP_403_FORBIDDEN)
    
    # Get tenants assigned to landlord's properties
    tenants = CustomUser.objects.filter(
        groups__name='tenant',
        assigned_units__property_obj__landlord=request.user
    ).distinct()
    
    serializer = TenantWithUnitSerializer(tenants, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def landlord_dashboard(request):
    """ENHANCED: Landlord dashboard with complete stats"""
    if not getattr(request.user, 'is_landlord', False):
        return Response({"error": "Only landlords can access this endpoint"}, status=status.HTTP_403_FORBIDDEN)
    
    # Calculate statistics
    properties = Property.objects.filter(landlord=request.user)
    units = Unit.objects.filter(property_obj__landlord=request.user)
    
    total_properties = properties.count()
    total_units = units.count()
    occupied_units = units.filter(is_available=False).count()
    vacant_units = units.filter(is_available=True).count()
    
    # Get unique tenants
    unique_tenants = CustomUser.objects.filter(
        assigned_units__property_obj__landlord=request.user
    ).distinct().count()
    
    # Get pending applications (tenants without units in this landlord's properties)
    all_tenants = CustomUser.objects.filter(groups__name='tenant')
    landlord_tenant_ids = units.exclude(tenant__isnull=True).values_list('tenant_id', flat=True)
    pending_applications = all_tenants.exclude(id__in=landlord_tenant_ids).count()
    
    # Rent calculations
    total_rent_collected = units.aggregate(
        total=Sum('rent_paid')
    )['total'] or 0
    
    total_rent_due = units.aggregate(
        total=Sum('rent_remaining')
    )['total'] or 0
    
    # Recent tenants with units
    recent_tenants = CustomUser.objects.filter(
        assigned_units__property_obj__landlord=request.user
    ).distinct()[:5]
    
    dashboard_data = {
        'total_properties': total_properties,
        'total_units': total_units,
        'occupied_units': occupied_units,
        'vacant_units': vacant_units,
        'total_tenants': unique_tenants,
        'pending_applications': pending_applications,
        'total_rent_collected': total_rent_collected,
        'total_rent_due': total_rent_due,
        'recent_tenants': TenantWithUnitSerializer(recent_tenants, many=True).data,
        'recent_payments': []
    }
    
    serializer = LandlordDashboardSerializer(dashboard_data)
    return Response(serializer.data)

# ===== ADD THE NEW TENANT REGISTRATION VIEWS HERE =====

class TenantRegistrationView(APIView):
    """
    Register a new tenant with landlord code
    """
    permission_classes = []  # Allow unauthenticated access for registration
    
    def post(self, request):
        serializer = TenantRegistrationSerializer(data=request.data)
        
        if serializer.is_valid():
            try:
                tenant = serializer.save()
                
                return Response({
                    'status': 'success',
                    'message': 'Tenant registered successfully',
                    'tenant_id': tenant.id,
                    'landlord_id': tenant.tenantprofile.landlord.id,
                    'landlord_name': tenant.tenantprofile.landlord.full_name
                }, status=status.HTTP_201_CREATED)
                
            except Exception as e:
                return Response({
                    'status': 'error',
                    'message': str(e)
                }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'status': 'error',
            'message': 'Registration failed',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

# Update your CompleteTenantRegistrationView to use landlord code
class CompleteTenantRegistrationView(APIView):
    def post(self, request):
        """
        Complete tenant registration with landlord code validation
        """
        try:
            data = request.data
            session_id = data.get('session_id')

            if not session_id:
                return Response({
                    'status': 'error',
                    'message': 'Session ID is required'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Retrieve all step data from cache
            all_data = {}
            for step in range(2, 7):
                cache_key = f"tenant_registration_{session_id}_step_{step}"
                step_data = cache.get(cache_key)
                if step_data:
                    all_data.update(step_data)

            # Merge with final data
            all_data.update(data)

            # Validate landlord code
            landlord_code = all_data.get('landlord_code')
            if not landlord_code:
                return Response({
                    'status': 'error',
                    'message': 'Landlord code is required'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Verify landlord exists
            try:
                landlord = CustomUser.objects.get(
                    landlord_code=landlord_code,
                    user_type='landlord',
                    is_active=True
                )
            except CustomUser.DoesNotExist:
                return Response({
                    'status': 'error',
                    'message': 'Invalid landlord code. Please check and try again.'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Validate required fields
            required_fields = ['email', 'full_name', 'password', 'phone_number']
            missing_fields = [field for field in required_fields if not all_data.get(field)]
            if missing_fields:
                return Response({
                    'status': 'error',
                    'message': f'Missing required fields: {", ".join(missing_fields)}'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Check if email already exists
            if CustomUser.objects.filter(email=all_data['email']).exists():
                return Response({
                    'status': 'error',
                    'message': 'Email already exists'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Create the tenant user
            user = CustomUser.objects.create_user(
                email=all_data['email'],
                full_name=all_data['full_name'],
                user_type='tenant',
                password=all_data['password'],
                phone_number=all_data['phone_number'],
                national_id=all_data.get('national_id'),
                emergency_contact=all_data.get('emergency_contact'),
                is_active=False  # All tenants start as inactive - require landlord approval
            )

            # Create tenant profile linked to landlord
            TenantProfile.objects.create(
                tenant=user,
                landlord=landlord
            )

            logger.info(f"✅ Tenant {user.full_name} registered with landlord {landlord.full_name}")

            # Get unit if provided
            unit_code = all_data.get('unit_code')
            unit = None
            if unit_code:
                try:
                    unit = Unit.objects.get(
                        unit_code=unit_code,
                        property_obj__landlord=landlord,
                        is_available=True
                    )
                except Unit.DoesNotExist:
                    logger.warning(f"Unit with code {unit_code} not found or not available")

            # Create TenantApplication - REQUIRED for all tenants
            from accounts.models import TenantApplication
            application = TenantApplication.objects.create(
                tenant=user,
                landlord=landlord,
                unit=unit,
                already_living_in_property=False,
                deposit_required=True,
                deposit_paid=False,
                status='pending',
                notes=all_data.get('notes', '')
            )

            # Handle unit assignment if deposit paid
            if unit_code and unit:
                try:
                    # Check for deposit payments
                    from payments.models import Payment
                    deposit_payments = Payment.objects.filter(
                        tenant=user,
                        unit=unit,
                        payment_type='deposit',
                        status='completed',  # ✅ FIXED: Changed from 'Success' to 'completed'
                        amount__gte=unit.deposit
                    )

                    if deposit_payments.exists():
                        # Mark deposit as paid but keep tenant inactive until landlord approves
                        application.deposit_paid = True
                        application.status = 'pending'  # Keep pending
                        application.save()

                        # Reserve the unit but don't assign tenant yet
                        unit.is_available = False
                        unit.save()

                        # Update tenant profile with unit (reserved)
                        user.tenantprofile.current_unit = unit
                        user.tenantprofile.save()

                        # DO NOT activate user - must wait for landlord approval
                        # user.is_active remains False

                        logger.info(f"⏳ Tenant {user.full_name} registered with deposit paid - awaiting landlord approval for unit {unit.unit_number}")
                    else:
                        logger.info(f"⏳ Tenant {user.full_name} registered - no deposit payment found, awaiting landlord approval")
                    
                except Unit.DoesNotExist:
                    logger.warning(f"Unit with code {unit_code} not found for landlord {landlord.landlord_code}")

            # Clean up cache
            for step in range(2, 7):
                cache_key = f"tenant_registration_{session_id}_step_{step}"
                cache.delete(cache_key)

            return Response({
                'status': 'success',
                'user_id': user.id,
                'email': user.email,
                'full_name': user.full_name,
                'landlord_name': landlord.full_name,
                'landlord_code': landlord.landlord_code,
                'requires_approval': True,
                'application_id': application.id,
                'message': 'Registration submitted! Your application is pending landlord approval. You will be notified once approved.'
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Unexpected error in tenant registration: {str(e)}")
            return Response({
                'status': 'error',
                'message': 'Internal server error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ===== TENANT APPLICATION MANAGEMENT VIEWS =====

class PendingTenantApplicationsView(APIView):
    """
    Get all pending tenant applications for a landlord
    """
    permission_classes = [IsAuthenticated, IsLandlord, HasActiveSubscription]

    def get(self, request):
        from accounts.models import TenantApplication
        
        applications = TenantApplication.objects.filter(
            landlord=request.user,
            status='pending'
        ).select_related('tenant', 'unit', 'unit__property_obj')

        data = []
        for app in applications:
            data.append({
                'id': app.id,
                'tenant_id': app.tenant.id,
                'tenant_name': app.tenant.full_name,
                'tenant_email': app.tenant.email,
                'tenant_phone': app.tenant.phone_number,
                'tenant_national_id': app.tenant.national_id,
                'unit_number': app.unit.unit_number if app.unit else None,
                'unit_id': app.unit.id if app.unit else None,
                'property_name': app.unit.property_obj.name if app.unit else None,
                'already_living_in_property': app.already_living_in_property,
                'deposit_required': app.deposit_required,
                'deposit_paid': app.deposit_paid,
                'applied_at': app.applied_at,
                'notes': app.notes,
                'status': app.status
            })

        return Response({
            'status': 'success',
            'count': len(data),
            'applications': data
        })


class ApproveTenantApplicationView(APIView):
    """
    Approve a tenant application
    """
    permission_classes = [IsAuthenticated, IsLandlord, HasActiveSubscription]

    def post(self, request, application_id):
        from accounts.models import TenantApplication
        
        try:
            application = TenantApplication.objects.get(
                id=application_id,
                landlord=request.user,
                status='pending'
            )
        except TenantApplication.DoesNotExist:
            return Response({
                'error': 'Application not found or already processed'
            }, status=status.HTTP_404_NOT_FOUND)

        # Approve the application
        application.approve(reviewed_by_user=request.user)

        # Activate tenant account
        tenant = application.tenant
        tenant.is_active = True
        tenant.save()

        logger.info(f"✅ Landlord {request.user.full_name} approved application for tenant {tenant.full_name}")

        return Response({
            'status': 'success',
            'message': f'Tenant {tenant.full_name} has been approved and can now log in',
            'application_id': application.id,
            'tenant_id': tenant.id
        })


class DeclineTenantApplicationView(APIView):
    """
    Decline a tenant application and delete the tenant account
    """
    permission_classes = [IsAuthenticated, IsLandlord, HasActiveSubscription]

    def post(self, request, application_id):
        from accounts.models import TenantApplication
        
        try:
            application = TenantApplication.objects.get(
                id=application_id,
                landlord=request.user,
                status='pending'
            )
        except TenantApplication.DoesNotExist:
            return Response({
                'error': 'Application not found or already processed'
            }, status=status.HTTP_404_NOT_FOUND)

        reason = request.data.get('reason', '')
        tenant = application.tenant
        tenant_name = tenant.full_name
        tenant_email = tenant.email

        # Decline the application
        application.decline(reviewed_by_user=request.user, reason=reason)

        # Delete the tenant account and all related data
        tenant_id = tenant.id
        tenant.delete()  # This will cascade delete TenantProfile and TenantApplication

        logger.info(f"❌ Landlord {request.user.full_name} declined and deleted tenant {tenant_name} (ID: {tenant_id})")

        # TODO: Send email notification to tenant about declined application
        try:
            send_mail(
                subject='Application Status Update',
                message=f'Dear {tenant_name},\n\nYour application has been reviewed. Unfortunately, we are unable to proceed with your application at this time.\n\n{reason if reason else ""}\n\nThank you for your interest.',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[tenant_email],
                fail_silently=True
            )
        except Exception as e:
            logger.error(f"Failed to send decline email: {str(e)}")

        return Response({
            'status': 'success',
            'message': f'Application for {tenant_name} has been declined and account deleted',
            'application_id': application.id,
            'deleted_tenant_id': tenant_id
        })


# ===== Subscription Management Endpoints =====

class SubscriptionSuggestionView(APIView):
    """
    Get subscription plan suggestions based on current usage
    """
    permission_classes = [IsAuthenticated, IsLandlord]

    def get(self, request):
        from accounts.subscription_utils import (
            suggest_plan_upgrade,
            get_plan_limits,
            check_subscription_limits
        )
        
        landlord = request.user
        
        # Get current counts
        current_properties = Property.objects.filter(landlord=landlord).count()
        current_units = Unit.objects.filter(property_obj__landlord=landlord).count()
        
        # Get current subscription
        try:
            subscription = Subscription.objects.get(user=landlord)
            current_plan = subscription.plan
            is_active = subscription.is_active()
            expiry_date = subscription.expiry_date
        except Subscription.DoesNotExist:
            current_plan = None
            is_active = False
            expiry_date = None
        
        # Get plan suggestion
        suggestion = suggest_plan_upgrade(current_properties, current_units)
        
        # Get limits for current plan
        current_limits = get_plan_limits(current_plan) if current_plan else {}
        
        # Check current status
        property_check = check_subscription_limits(landlord, action_type='property')
        unit_check = check_subscription_limits(landlord, action_type='unit')
        
        # Get all plan options
        from accounts.subscription_utils import PLAN_LIMITS
        all_plans = []
        for plan_name, limits in PLAN_LIMITS.items():
            if plan_name == 'free':
                continue  # Don't suggest free plan
            
            can_accommodate = (
                (limits['properties'] is None or current_properties <= limits['properties']) and
                (limits['units'] is None or current_units <= limits['units'])
            )
            
            all_plans.append({
                'plan': plan_name,
                'description': limits['description'],
                'properties_limit': limits['properties'],
                'units_limit': limits['units'],
                'price': limits['price'],
                'duration_days': limits['duration_days'],
                'can_accommodate': can_accommodate,
                'is_current': plan_name == current_plan
            })
        
        return Response({
            'current_usage': {
                'properties': current_properties,
                'units': current_units
            },
            'current_subscription': {
                'plan': current_plan,
                'is_active': is_active,
                'expiry_date': expiry_date,
                'properties_limit': current_limits.get('properties'),
                'units_limit': current_limits.get('units'),
                'price': current_limits.get('price', 0)
            },
            'status': {
                'can_create_property': property_check['can_create'],
                'properties_remaining': property_check['limit'] - property_check['current_count'] if property_check['limit'] else None,
                'can_create_unit': unit_check['can_create'],
                'units_remaining': unit_check['limit'] - unit_check['current_count'] if unit_check['limit'] else None
            },
            'suggested_plan': {
                'plan': suggestion['suggested_plan'],
                'reason': suggestion['reason'],
                'limits': suggestion['limits']
            },
            'all_plans': all_plans
        })


class SubscriptionTrackingHistoryView(APIView):
    """
    Get tracking history for property and unit creation
    """
    permission_classes = [IsAuthenticated, IsLandlord]

    def get(self, request):
        from accounts.models import PropertyUnitTracker
        
        landlord = request.user
        limit = int(request.GET.get('limit', 50))
        action_type = request.GET.get('action_type')  # Optional filter
        
        # Build query
        queryset = PropertyUnitTracker.objects.filter(landlord=landlord)
        
        if action_type:
            queryset = queryset.filter(action=action_type)
        
        # Get tracking records
        tracking_records = queryset[:limit]
        
        # Serialize data
        data = []
        for record in tracking_records:
            data.append({
                'id': record.id,
                'action': record.action,
                'subscription_plan': record.subscription_plan,
                'total_properties_after': record.total_properties_after,
                'total_units_after': record.total_units_after,
                'limit_reached': record.limit_reached,
                'upgrade_notification_sent': record.upgrade_notification_sent,
                'created_at': record.created_at,
                'property_name': record.property.name if record.property else None,
                'unit_number': record.unit.unit_number if record.unit else None,
                'notes': record.notes
            })
        
        return Response({
            'count': len(data),
            'results': data
        })
