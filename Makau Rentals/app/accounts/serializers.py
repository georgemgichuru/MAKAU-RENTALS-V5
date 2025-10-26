from .models import CustomUser, Property, Unit, UnitType, TenantProfile
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

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")
        requested_user_type = attrs.get("user_type")  # User type from frontend

        if not email or not password:
            raise serializers.ValidationError("Must include 'email' and 'password'")

        # Authenticate user
        user = authenticate(self.context['request'], email=email, password=password)
        
        if not user:
            raise serializers.ValidationError("Invalid email or password")
        
        if not user.is_active:
            raise serializers.ValidationError("User account is disabled")
        
        # If user_type is provided, validate it matches
        if requested_user_type and user.user_type != requested_user_type:
            raise serializers.ValidationError(
                f"Invalid account type. This account is registered as a {user.user_type}, not a {requested_user_type}."
            )
        
        # Use the actual user type from the database
        actual_user_type = user.user_type
        
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
                user_type='landlord',
                is_active=True
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
        
        # Create tenant user
        validated_data['user_type'] = 'tenant'
        tenant = CustomUser.objects.create_user(
            **validated_data,
            password=password
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
            'password'
        ]
        read_only_fields = ['id', 'date_joined', 'is_active', 'is_staff', 'is_superuser', 'landlord_code']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def create(self, validated_data):
        # Always use the manager to ensure password is hashed
        # adapt to new signature: email, full_name, user_type, password
        email = validated_data.pop('email')
        full_name = validated_data.pop('full_name')
        user_type = validated_data.pop('user_type')
        password = validated_data.pop('password', None)
        user = CustomUser.objects.create_user(email=email, full_name=full_name, user_type=user_type, password=password, **validated_data)
        return user

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            if attr == 'password':
                instance.set_password(value)
            else:
                setattr(instance, attr, value)
        instance.save()
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
        # Use the configurable frontend URL from settings
        reset_link = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}/"

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
    
    class Meta:
        model = CustomUser
        fields = [
            'id', 'email', 'full_name', 'phone_number', 'emergency_contact',
            'national_id', 'date_joined', 'current_unit', 'unit_data', 'rent_status'
        ]
    
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