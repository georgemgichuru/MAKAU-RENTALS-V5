from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone
from datetime import timedelta
from django.core.exceptions import ValidationError
import uuid


class CustomUserManager(BaseUserManager):
    # ensure the email is normalized and user_type is provided
    def create_user(self, email, full_name, user_type, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")
        if not user_type:
            raise ValueError("User type must be set (landlord or tenant)")

        email = self.normalize_email(email)
        user = self.model(
            email=email,
            full_name=full_name,
            user_type=user_type,
            **extra_fields
        )
        user.set_password(password)
        user.save(using=self._db)

        # Auto-assign free trial for landlords
        if user_type == "landlord":
            Subscription.objects.create(
                user=user,
                plan="free",
                expiry_date=timezone.now() + timedelta(days=60)
            )
            # generate a public landlord_code
            if not getattr(user, 'landlord_code', None):
                user.landlord_code = f"L-{uuid.uuid4().hex[:10].upper()}"
                user.save(update_fields=['landlord_code'])

        # REMOVE automatic TenantProfile creation here - handle it in serializers/views
        return user

class CustomUser(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=120, default='')
    national_id = models.CharField(max_length=20, blank=True, null=True)
    id_document = models.ImageField(upload_to='id_documents/', null=True, blank=True)
    landlord_code = models.CharField(max_length=50, unique=True, null=True, blank=True)
    date_joined = models.DateTimeField(auto_now_add=True)
    type = [('landlord', 'Landlord'), ('tenant', 'Tenant')]
    user_type = models.CharField(max_length=10, choices=type)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    mpesa_till_number = models.CharField(max_length=20, blank=True, null=True)
    phone_number = models.CharField(max_length=30, blank=True, null=True)
    emergency_contact = models.CharField(max_length=30, blank=True, null=True)
    
    # ADD THESE NEW FIELDS:
    address = models.TextField(blank=True, null=True, help_text="Business or physical address")
    website = models.URLField(blank=True, null=True, help_text="Business website URL")
    
    reminder_mode = models.CharField(
        max_length=20,
        choices=[('days_before', 'Days Before Due Date'), ('fixed_day', 'Fixed Day of Month')],
        default='days_before'
    )
    reminder_value = models.IntegerField(default=10)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']
    objects = CustomUserManager()

    # Check if user has an active subscription
    def has_active_subscription(self):
        if hasattr(self, "subscription"):
            return self.subscription.is_active()
        return False

    def __str__(self):
        return f"{self.full_name} ({self.email})"
    
    @property
    def my_tenants(self):
        """For landlords: Get all their tenants through TenantProfile"""
        if self.user_type == 'landlord':
            return CustomUser.objects.filter(
                tenant_profile__landlord=self,
                user_type='tenant'
            ).distinct()
        return CustomUser.objects.none()

    @property
    def my_landlord(self):
        """For tenants: Get their landlord through TenantProfile"""
        if self.user_type == 'tenant' and hasattr(self, 'tenant_profile'):
            return self.tenant_profile.landlord
        return None

    @classmethod
    def get_landlord_by_code(cls, landlord_code):
        """Get active landlord by landlord_code"""
        try:
            return cls.objects.get(
                landlord_code=landlord_code, 
                user_type='landlord',
                is_active=True
            )
        except cls.DoesNotExist:
            return None

    def get_tenant_profile(self):
        """Get tenant profile if user is a tenant"""
        if self.user_type == 'tenant':
            return getattr(self, 'tenant_profile', None)
        return None


class Subscription(models.Model):
    PLAN_CHOICES = [
        ("free", "Free (60-day trial)"),
        ("starter", "Starter (up to 10 units)"),
        ("basic", "Basic (10-50 units)"),
        ("professional", "Professional (50-100 units)"),
        ("onetime", "One-time (Unlimited properties)"),
    ]

    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name="subscription")
    plan = models.CharField(max_length=20, choices=PLAN_CHOICES, default="free")
    start_date = models.DateTimeField(auto_now_add=True)
    expiry_date = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        # Set expiry dates based on plan
        if not self.expiry_date:
            if self.plan == "free":
                self.expiry_date = timezone.now() + timedelta(days=60)
            elif self.plan == "starter":
                # monthly subscription
                self.expiry_date = timezone.now() + timedelta(days=30)
            elif self.plan == "basic":
                # monthly subscription
                self.expiry_date = timezone.now() + timedelta(days=30)
            elif self.plan == "professional":
                # monthly subscription
                self.expiry_date = timezone.now() + timedelta(days=30)
            # "onetime" could remain None for lifetime access
        
        super().save(*args, **kwargs)

    # Check if subscription is still valid
    def is_active(self):
        return self.expiry_date is None or self.expiry_date > timezone.now()

    def __str__(self):
        return f"{self.user.email} - {self.plan}"


class Property(models.Model):
    landlord = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    unit_count = models.IntegerField()   # integer count of units for this property

    def __str__(self):
        return f"{self.name}, {self.city}"


# TODO: Ensure that the landlord can only have a certain amount of units linked to property unit count
class UnitType(models.Model):
    landlord = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='unit_types')
    name = models.CharField(max_length=50)
    deposit = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    rent = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    number_of_units = models.IntegerField(default=0, help_text="Number of units of this type to create automatically")
    # ADD THIS FIELD
    description = models.TextField(blank=True, null=True, help_text="Optional description of the unit type")
    # ADD CREATED_AT FIELD FOR BETTER TRACKING
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    def __str__(self):
        return f"{self.landlord.email} - {self.name}"

    class Meta:
        ordering = ['-created_at']  # Newest first


class Unit(models.Model):
    property_obj = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name="unit_list",
        db_column="property_id"
    )
    # system-generated unit code (unique per unit)
    unit_code = models.CharField(max_length=30, unique=True, default='')
    unit_number = models.CharField(max_length=10)
    floor = models.IntegerField(null=True, blank=True)
    bedrooms = models.IntegerField(default=0)
    bathrooms = models.IntegerField(default=0)

    unit_type = models.ForeignKey(UnitType, on_delete=models.SET_NULL, null=True, blank=True)

    rent = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tenant = models.OneToOneField(CustomUser, on_delete=models.SET_NULL, null=True, blank=True)

    rent_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    rent_remaining = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    rent_due_date = models.DateField(null=True, blank=True)

    deposit = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_available = models.BooleanField(default=True)

    assigned_date = models.DateTimeField(null=True, blank=True)
    left_date = models.DateTimeField(null=True, blank=True)

    @property
    def balance(self):
        return self.rent_remaining - self.rent_paid

    def clean(self):
        # Only check unit limit when creating a NEW unit, not when updating existing one
        if not self.pk:  # This is a new unit being created
            current_units = Unit.objects.filter(property_obj=self.property_obj).count()
            if self.property_obj.unit_count is not None and current_units >= self.property_obj.unit_count:
                raise ValidationError("The number of units for this property has reached the limit.")

    def save(self, *args, **kwargs):
        # Calculate rent_remaining as rent - rent_paid
        self.rent_remaining = self.rent - self.rent_paid

        if self.pk:  # existing unit
            old_unit = Unit.objects.get(pk=self.pk)
            if old_unit.tenant != self.tenant:
                if self.tenant and not self.assigned_date:
                    self.assigned_date = timezone.now()
                elif not self.tenant and old_unit.tenant:
                    self.left_date = timezone.now()
        else:  # new unit
            if self.tenant:
                self.assigned_date = timezone.now()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.property_obj.name} - Unit {self.unit_number}"


# In models.py - Update the TenantProfile model
class TenantProfile(models.Model):
    """ENHANCED: Separate profile for tenant-specific data"""
    tenant = models.OneToOneField(
        CustomUser, 
        on_delete=models.CASCADE, 
        limit_choices_to={'user_type': 'tenant'},
        related_name='tenant_profile'  # Add related_name for easier access
    )
    landlord = models.ForeignKey(
        CustomUser, 
        on_delete=models.CASCADE,  # Changed from SET_NULL to CASCADE for data integrity
        related_name='tenants', 
        limit_choices_to={'user_type': 'landlord'},
        null=False,  # Make this required
        blank=False   # Make this required
    )
    current_unit = models.ForeignKey(
        Unit, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='current_tenant'
    )
    move_in_date = models.DateTimeField(null=True, blank=True)
    lease_end_date = models.DateTimeField(null=True, blank=True)
    emergency_contact_name = models.CharField(max_length=255, blank=True, null=True)
    emergency_contact_phone = models.CharField(max_length=15, blank=True, null=True)
    
    class Meta:
        unique_together = ['tenant', 'landlord']  # Prevent duplicate relationships
    
    def __str__(self):
        return f"Profile - {self.tenant.full_name} (Landlord: {self.landlord.full_name})"

    def clean(self):
        """Validate that tenant belongs to the landlord"""
        if self.landlord and self.tenant:
            if self.tenant.user_type != 'tenant':
                raise ValidationError("User must be a tenant")
            if self.landlord.user_type != 'landlord':
                raise ValidationError("Landlord must be a landlord")
        
        # Ensure landlord exists and is active
        if self.landlord and not self.landlord.is_active:
            raise ValidationError("Landlord account is not active")

    def save(self, *args, **kwargs):
        self.clean()
        # Don't automatically set landlord from unit - require explicit assignment
        super().save(*args, **kwargs)