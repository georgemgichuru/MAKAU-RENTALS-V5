from .models import CustomUser, Property, Unit, UnitType, TenantProfile, TenantApplication
from rest_framework import serializers
from django.db import transaction

from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.core.mail import send_mail

# Overide the token to use email instead of username for JWT authentication
# accounts/serializers.py
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import CustomUser
import uuid

# accounts/serializers.py
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = "email"
    user_type = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        import logging
        logger = logging.getLogger(__name__)

        email = attrs.get("email")
        password = attrs.get("password")
        requested_user_type = attrs.get("user_type")  # User type from frontend

        def raise_string_error(msg):
            # Always raise error with string, not array
            raise serializers.ValidationError(str(msg))

        if not email or not password:
            raise_string_error("Must include 'email' and 'password'")

        # Normalize email case for lookup and authentication
        email_normalized = email.strip()
        # If your system treats emails case-insensitively, normalize to lower
        try:
            email_ci_user = CustomUser.objects.filter(email__iexact=email_normalized).first()
        except Exception:
            email_ci_user = None

        # If user exists and is inactive tenant, return pending approval message
        # even if password is incorrect, to satisfy UX requirement
        if email_ci_user and not email_ci_user.is_active:
            if email_ci_user.groups.filter(name='tenant').exists() or getattr(email_ci_user, 'user_type', None) == 'tenant':
                error_msg = "Your account is pending approval. Please await approval from your landlord or contact us for support."
                raise_string_error(error_msg)

        # Authenticate user
        user = authenticate(self.context['request'], email=email_normalized, password=password)

        if not user:
            raise_string_error("Invalid email or password")

        # Check if user is inactive (pending approval)
        if not user.is_active:
            logger.warning(f"Inactive user login attempt: {email}")
            # Check if user is a tenant (likely pending landlord approval)
            if user.groups.filter(name='tenant').exists() or getattr(user, 'user_type', None) == 'tenant':
                error_msg = "Your account is pending approval. Please await approval from your landlord or contact us for support."
                logger.info(f"Tenant {email} pending approval - blocking login")
                raise_string_error(error_msg)
            else:
                raise_string_error("User account is disabled")

        # Determine the actual user type from Groups (fallback to legacy field)
        if user.groups.filter(name='landlord').exists():
            actual_user_type = 'landlord'
        elif user.groups.filter(name='tenant').exists():
            actual_user_type = 'tenant'
        else:
            actual_user_type = getattr(user, 'user_type', None)

        # If user_type is provided, validate it matches
        if requested_user_type:
            # Normalize user types for comparison
            requested_type_normalized = requested_user_type.lower().strip()
            actual_type_normalized = actual_user_type.lower().strip()

            if requested_type_normalized != actual_type_normalized:
                # Provide clear error message about account type mismatch
                error_msg = (
                    f"Invalid credentials. This account is registered as a {actual_user_type.title()}, "
                    f"not as a {requested_user_type.title()}. Please log in using the correct account type."
                )
                raise_string_error(error_msg)

        # Add user_type to validated data
        attrs['user_type'] = actual_user_type

        data = super().validate(attrs)
        data['user_type'] = actual_user_type
        data['user_id'] = user.id
        data['email'] = user.email
        data['full_name'] = user.full_name

        return data

class TenantRegistrationSerializer(serializers.ModelSerializer):
    landlord_code = serializers.CharField(write_only=True, required=True)
    password = serializers.CharField(write_only=True, required=True)
    confirm_password = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = CustomUser
        fields = [
            'email', 'full_name', 'password', 'confirm_password', 
            'phone_number', 'national_id', 'emergency_contact',
            'landlord_code'
        ]
    
    def validate_landlord_code(self, value):
        """Validate that landlord code exists and is active"""
        try:
            landlord = CustomUser.objects.get(
                landlord_code=value,
                is_active=True,
                groups__name='landlord'
            )
            return value
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError(
                "Invalid landlord code. Please check the code and try again."
            )
    
    def validate(self, data):
        """Validate password match and landlord exists"""
        if data.get('password') != data.get('confirm_password'):
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        
        # Verify landlord exists (redundant but ensures data consistency)
        landlord_code = data.get('landlord_code')
        if not CustomUser.get_landlord_by_code(landlord_code):
            raise serializers.ValidationError({"landlord_code": "Landlord not found or inactive."})
        
        return data
    
    @transaction.atomic
    def create(self, validated_data):
        """Create tenant user and link to landlord with validation"""
        # Extract tenant data
        landlord_code = validated_data.pop('landlord_code')
        password = validated_data.pop('password')
        validated_data.pop('confirm_password')  # Remove confirm_password
        
        # Get landlord with validation
        landlord = CustomUser.get_landlord_by_code(landlord_code)
        if not landlord:
            raise serializers.ValidationError({
                "landlord_code": "Landlord not found. Registration failed."
            })
        
        # Create tenant user as INACTIVE - requires landlord approval
        validated_data['user_type'] = 'tenant'
        tenant = CustomUser.objects.create_user(
            **validated_data,
            password=password,
            is_active=False  # All tenants start inactive
        )
        
        # Create tenant profile linked to landlord
        try:
            TenantProfile.objects.create(
                tenant=tenant,
                landlord=landlord
            )
        except Exception as e:
            # If profile creation fails, delete the tenant user
            tenant.delete()
            raise serializers.ValidationError({
                "error": f"Failed to create tenant profile: {str(e)}"
            })
        
        return tenant

class UserSerializer(serializers.ModelSerializer):
    current_unit = serializers.SerializerMethodField()
    move_in_date = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = [
            'id',
            'email',
            'full_name',
            'national_id',
            'id_document',
            'landlord_code',
            'date_joined',
            'user_type',
            'is_active',
            'is_staff',
            'is_superuser',
            'mpesa_till_number',
            'phone_number',
            'emergency_contact',
            'reminder_mode',
            'reminder_value',
            'password',
            'current_unit',
            'move_in_date'
        ]
        read_only_fields = ['id', 'date_joined', 'is_active', 'is_staff', 'is_superuser', 'landlord_code']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def get_current_unit(self, obj):
        if obj.is_tenant and hasattr(obj, 'tenant_profile'):
            current_unit = obj.tenant_profile.current_unit
            if current_unit:
                return {
                    'id': current_unit.id,
                    'unit_number': current_unit.unit_number,
                    'property_name': current_unit.property_obj.name,
                    'rent': current_unit.rent,
                    'rent_remaining': current_unit.rent_remaining,
                    'rent_due_date': current_unit.rent_due_date,
                }
        return None

    def get_move_in_date(self, obj):
        """Get move_in_date from tenant profile"""
        if obj.is_tenant and hasattr(obj, 'tenant_profile'):
            return obj.tenant_profile.move_in_date
        return None

    def to_internal_value(self, data):
        """Custom handling to accept move_in_date and id_document (base64) for updates"""
        # Store move_in_date separately before calling parent
        self._move_in_date = data.pop('move_in_date', None) if isinstance(data, dict) else None
        # Store id_document separately if it's base64 encoded
        self._id_document_base64 = data.pop('id_document', None) if isinstance(data, dict) and isinstance(data.get('id_document'), str) and data.get('id_document', '').startswith('data:') else None
        return super().to_internal_value(data)

    def create(self, validated_data):
        # Always use the manager to ensure password is hashed
        # adapt to new signature: email, full_name, user_type, password
        move_in_date = getattr(self, '_move_in_date', None)
        email = validated_data.pop('email')
        full_name = validated_data.pop('full_name')
        user_type = validated_data.pop('user_type')
        password = validated_data.pop('password', None)
        user = CustomUser.objects.create_user(email=email, full_name=full_name, user_type=user_type, password=password, **validated_data)
        
        # Update tenant profile if move_in_date is provided
        if move_in_date and user.is_tenant and hasattr(user, 'tenant_profile'):
            user.tenant_profile.move_in_date = move_in_date
            user.tenant_profile.save()
        
        return user

    def update(self, instance, validated_data):
        move_in_date = getattr(self, '_move_in_date', None)
        id_document_base64 = getattr(self, '_id_document_base64', None)
        
        # Handle base64 ID document upload
        if id_document_base64:
            try:
                import base64
                from django.core.files.base import ContentFile
                
                # Decode base64 and save document
                format, imgstr = id_document_base64.split(';base64,')
                ext = format.split('/')[-1]
                document_name = f"{instance.id}_{instance.full_name.replace(' ', '_')}_id.{ext}"
                
                instance.id_document.save(
                    document_name,
                    ContentFile(base64.b64decode(imgstr)),
                    save=False  # Don't save yet, we'll save after updating other fields
                )
                import logging
                logger = logging.getLogger(__name__)
                logger.info(f"✅ ID document updated for user {instance.full_name} (ID: {instance.id})")
            except Exception as doc_error:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Failed to save ID document: {str(doc_error)}")
                # Don't fail the entire update if document save fails
        
        for attr, value in validated_data.items():
            if attr == 'password':
                instance.set_password(value)
            else:
                setattr(instance, attr, value)
        instance.save()
        
        # Update tenant profile if move_in_date is provided
        if move_in_date is not None and instance.is_tenant and hasattr(instance, 'tenant_profile'):
            instance.tenant_profile.move_in_date = move_in_date
            instance.tenant_profile.save()
        
        return instance

    def validate_phone_number(self, value):
        if not value:
            return value
        import re
        if not re.match(r"^\+?[0-9]{7,15}$", value):
            raise serializers.ValidationError("Enter a valid phone number in international format, e.g. +2547XXXXXXXX")
        return value

    def validate_emergency_contact(self, value):
        if not value:
            return value
        import re
        if not re.match(r"^\+?[0-9]{7,15}$", value):
            raise serializers.ValidationError("Enter a valid emergency contact phone number in international format")
        return value

        
class PropertySerializer(serializers.ModelSerializer):
    class Meta:
        model = Property
        fields = ['id', 'landlord', 'name', 'city', 'state', 'unit_count']
        read_only_fields = ['id', 'landlord']
    def create(self, validated_data):
        property = Property.objects.create(**validated_data)
        return property
    
class UnitTypeSerializer(serializers.ModelSerializer):
    # Remove landlord from fields - we'll handle it in the view
    class Meta:
        model = UnitType
        fields = ['id', 'name', 'rent', 'deposit', 'description', 'created_at', 'number_of_units']
        read_only_fields = ['id', 'created_at']

    def validate_rent(self, value):
        if value <= 0:
            raise serializers.ValidationError("Rent must be a positive number")
        return value

    def validate_deposit(self, value):
        if value < 0:
            raise serializers.ValidationError("Deposit cannot be negative")
        return value

    # Remove any create method - let the view handle setting the landlord


# In your serializers.py - Update UnitSerializer
class UnitSerializer(serializers.ModelSerializer):
    property_obj = serializers.PrimaryKeyRelatedField(queryset=Property.objects.all())
    unit_type = serializers.PrimaryKeyRelatedField(queryset=UnitType.objects.all(), required=False, allow_null=True)
    
    class Meta:
        model = Unit
        fields = [
            'id', 'property_obj', 'unit_code', 'unit_number', 'unit_type',
            'bedrooms', 'bathrooms', 'floor', 'rent', 'deposit', 'is_available',
            'tenant'
        ]
        read_only_fields = ['id', 'unit_code', 'tenant']

    def validate(self, data):
        # Ensure the property belongs to the current user
        if 'property_obj' in data and data['property_obj'].landlord != self.context['request'].user:
            raise serializers.ValidationError("You do not own this property")
        
        # Ensure unit type belongs to the current user if provided
        if 'unit_type' in data and data['unit_type'] and data['unit_type'].landlord != self.context['request'].user:
            raise serializers.ValidationError("You do not own this unit type")
            
        return data

    def create(self, validated_data):
        # Generate unit code if not provided
        if 'unit_code' not in validated_data or not validated_data['unit_code']:
            property_obj = validated_data['property_obj']
            unit_number = validated_data['unit_number']
            validated_data['unit_code'] = f"U-{property_obj.id}-{unit_number}-{uuid.uuid4().hex[:8]}"
        
        return super().create(validated_data)

class UnitNumberSerializer(serializers.ModelSerializer):
    class Meta:
        model = Unit
        fields = ['unit_number']

# TODO: Ensure landlords create properties and units upon sign up this will be done in the frontend
# TODO: Ensure Tenants pay the deposit to book a unit and choose their property upon sign up
# TODO: Ensure Tenants and Landlords can reset their passwords and get email notifications for important actions 


# For reset password functionality
class PasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()
    frontend_url = serializers.CharField(required=False, allow_blank=True)

    def validate_email(self, value):
        if not CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("User with this email does not exist.")
        return value

    def save(self):
        from django.conf import settings
        email = self.validated_data['email']
        user = CustomUser.objects.get(email=email)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        # Use frontend_url from request if provided, otherwise fall back to settings
        frontend_base = self.validated_data.get('frontend_url') or settings.FRONTEND_URL
        base = frontend_base.rstrip('/')
        reset_link = f"{base}/reset-password/{uid}/{token}"

        send_mail(
            subject="Password Reset Request",
            message=f"Click the link to reset your password: {reset_link}",
            from_email=None,
            recipient_list=[email],
        )


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate(self, attrs):
        from django.contrib.auth.tokens import default_token_generator
        from django.utils.http import urlsafe_base64_decode
        from django.contrib.auth.password_validation import validate_password
        try:
            uid = urlsafe_base64_decode(attrs['uid']).decode()
            user = CustomUser.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, CustomUser.DoesNotExist):
            raise serializers.ValidationError("Invalid UID")

        if not default_token_generator.check_token(user, attrs['token']):
            raise serializers.ValidationError("Invalid or expired token")

        validate_password(attrs['new_password'], user)
        attrs['user'] = user
        return attrs

    def save(self):
        user = self.validated_data['user']
        new_password = self.validated_data['new_password']
        user.set_password(new_password)
        user.save()
        return user


class ReminderPreferencesSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['reminder_mode', 'reminder_value']


class AvailableUnitsSerializer(serializers.ModelSerializer):
    landlord_id = serializers.CharField(source='property_obj.landlord.landlord_code', read_only=True)
    property_id = serializers.IntegerField(source='property_obj.id', read_only=True)
    property_name = serializers.CharField(source='property_obj.name', read_only=True)
    unit_number = serializers.CharField(read_only=True)

    class Meta:
        model = Unit
        fields = ['landlord_id', 'property_id', 'property_name', 'unit_number']

class TenantWithUnitSerializer(serializers.ModelSerializer):
    """ENHANCED: Special serializer for tenant management with unit data"""
    current_unit = serializers.SerializerMethodField()
    unit_data = serializers.SerializerMethodField()
    rent_status = serializers.SerializerMethodField()
    deposit_paid = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomUser
        fields = [
            'id', 'email', 'full_name', 'phone_number', 'emergency_contact',
            'national_id', 'date_joined', 'is_active', 'current_unit', 'unit_data', 
            'rent_status', 'deposit_paid'
        ]
        read_only_fields = ['is_active']
    
    def get_current_unit(self, obj):
        """Get the unit currently assigned to this tenant"""
        try:
            unit = Unit.objects.get(tenant=obj)
            return {
                'id': unit.id,
                'unit_number': unit.unit_number,
                'property_name': unit.property_obj.name,
                'rent': unit.rent,
                'rent_paid': unit.rent_paid,
                'rent_remaining': unit.rent_remaining,
                'assigned_date': unit.assigned_date
            }
        except Unit.DoesNotExist:
            return None
    
    def get_unit_data(self, obj):
        """Alternative method to get unit data"""
        unit = Unit.objects.filter(tenant=obj).first()
        if unit:
            return UnitSerializer(unit).data
        return None
    
    def get_deposit_paid(self, obj):
        """Check if tenant has paid deposit"""
        from payments.models import Payment
        deposit_payments = Payment.objects.filter(
            tenant=obj,
            payment_type='deposit',
            status='completed'
        )
        return deposit_payments.exists()
    
    def get_rent_status(self, obj):
        """Calculate rent status for the tenant"""
        try:
            unit = Unit.objects.get(tenant=obj)
            if unit.rent_remaining == 0:
                return 'paid'
            elif unit.rent_remaining == unit.rent:
                return 'due'
            elif unit.rent_remaining > 0:
                return 'overdue'
            else:
                return 'unknown'
        except Unit.DoesNotExist:
            return 'no_unit'
class LandlordDashboardSerializer(serializers.Serializer):
    """Serializer for landlord dashboard data"""
    total_properties = serializers.IntegerField()
    total_units = serializers.IntegerField()
    occupied_units = serializers.IntegerField()
    vacant_units = serializers.IntegerField()
    total_tenants = serializers.IntegerField()
    pending_applications = serializers.IntegerField()
    total_rent_collected = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_rent_due = serializers.DecimalField(max_digits=10, decimal_places=2)
    
    recent_tenants = TenantWithUnitSerializer(many=True)
    recent_payments = serializers.ListField()

class CustomUserSerializer(serializers.ModelSerializer):
    user_type_display = serializers.CharField(source='get_user_type_display', read_only=True)
    
    class Meta:
        model = CustomUser
        fields = [
            'id', 'email', 'full_name', 'user_type', 'user_type_display',
            'national_id', 'landlord_code', 'date_joined', 'phone_number',
            'emergency_contact', 'mpesa_till_number', 'reminder_mode', 'reminder_value'
        ]
        read_only_fields = ['date_joined', 'landlord_code']

class TenantProfileSerializer(serializers.ModelSerializer):
    tenant_name = serializers.CharField(source='tenant.full_name', read_only=True)
    tenant_email = serializers.CharField(source='tenant.email', read_only=True)
    unit_number = serializers.CharField(source='current_unit.unit_number', read_only=True)
    property_name = serializers.CharField(source='current_unit.property_obj.name', read_only=True)
    
    class Meta:
        model = TenantProfile
        fields = [
            'id', 'tenant', 'tenant_name', 'tenant_email', 'current_unit',
            'unit_number', 'property_name', 'move_in_date', 'lease_end_date',
            'emergency_contact_name', 'emergency_contact_phone'
        ]


class TenantApplicationSerializer(serializers.ModelSerializer):
    """Serializer for tenant applications"""
    tenant_name = serializers.CharField(source='tenant.full_name', read_only=True)
    tenant_email = serializers.CharField(source='tenant.email', read_only=True)
    tenant_phone = serializers.CharField(source='tenant.phone_number', read_only=True)
    landlord_name = serializers.CharField(source='landlord.full_name', read_only=True)
    unit_number = serializers.CharField(source='unit.unit_number', read_only=True, allow_null=True)
    property_name = serializers.CharField(source='unit.property_obj.name', read_only=True, allow_null=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.full_name', read_only=True, allow_null=True)
    
    class Meta:
        model = TenantApplication
        fields = [
            'id', 'tenant', 'tenant_name', 'tenant_email', 'tenant_phone',
            'landlord', 'landlord_name', 'unit', 'unit_number', 'property_name',
            'status', 'already_living_in_property', 'deposit_required', 'deposit_paid',
            'applied_at', 'reviewed_at', 'reviewed_by', 'reviewed_by_name',
            'notes', 'landlord_notes'
        ]
        read_only_fields = ['id', 'applied_at', 'reviewed_at', 'reviewed_by']
    
    def validate(self, data):
        """Validate application data"""
        # Ensure tenant and landlord are valid
        tenant = data.get('tenant')
        landlord = data.get('landlord')
        
        if tenant and not tenant.is_tenant:
            raise serializers.ValidationError("Applicant must be a tenant")
        if landlord and not landlord.is_landlord:
            raise serializers.ValidationError("Landlord must have landlord role")
        
        # If already living in property, deposit should not be required
        if data.get('already_living_in_property', False):
            data['deposit_required'] = False
        
        return data