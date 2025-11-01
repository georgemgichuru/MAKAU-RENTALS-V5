from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin, Group
from django.utils import timezone
from datetime import timedelta
from django.core.exceptions import ValidationError
import uuid
from django.db.models.signals import post_save, m2m_changed
from django.dispatch import receiver


class CustomUserManager(BaseUserManager):
    # ensure the email is normalized and user_type (legacy) or group is provided
    def create_user(self, email, full_name, user_type, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")
        if not user_type:
            raise ValueError("User type must be set (landlord or tenant)")

        # Normalize and create basic user record
        email = self.normalize_email(email)
        user = self.model(
            email=email,
            full_name=full_name,
            user_type=user_type,  # keep legacy field in sync
            **extra_fields
        )
        user.set_password(password)
        user.save(using=self._db)

        # Ensure default groups exist
        landlord_group, _ = Group.objects.get_or_create(name='landlord')
        tenant_group, _ = Group.objects.get_or_create(name='tenant')

        # Assign group according to user_type
        if user_type == 'landlord':
            user.groups.add(landlord_group)
        elif user_type == 'tenant':
            user.groups.add(tenant_group)

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
    
    def create_superuser(self, email, password=None, **extra_fields):
        """
        Create and return a superuser with an email and password.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('user_type', 'landlord')  # Default superuser to landlord
        extra_fields.setdefault('full_name', 'Admin User')
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        # Normalize email
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        
        return user

class CustomUser(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=120, default='')
    national_id = models.CharField(max_length=20, blank=True, null=True)
    # Use FileField to support both images and PDFs for ID documents
    id_document = models.FileField(upload_to='id_documents/', null=True, blank=True)
    landlord_code = models.CharField(max_length=50, unique=True, null=True, blank=True)
    date_joined = models.DateTimeField(auto_now_add=True)
    type = [('landlord', 'Landlord'), ('tenant', 'Tenant')]
    # Legacy field (kept for backward compatibility). The source of truth is now Groups
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
    
    # ===== Role helpers (Groups-first, legacy field as fallback) =====
    @property
    def is_landlord(self) -> bool:
        try:
            return self.groups.filter(name='landlord').exists()
        except Exception:
            return getattr(self, 'user_type', None) == 'landlord'

    @property
    def is_tenant(self) -> bool:
        try:
            return self.groups.filter(name='tenant').exists()
        except Exception:
            return getattr(self, 'user_type', None) == 'tenant'

    def sync_user_type_from_groups(self, save: bool = True):
        """Keep legacy user_type in sync with current Groups for compatibility."""
        new_type = 'landlord' if self.groups.filter(name='landlord').exists() else (
            'tenant' if self.groups.filter(name='tenant').exists() else None
        )
        if new_type and self.user_type != new_type:
            self.user_type = new_type
            if save:
                super(CustomUser, self).save(update_fields=['user_type'])

    def sync_groups_from_user_type(self):
        """Ensure Groups reflect the legacy user_type value."""
        landlord_group, _ = Group.objects.get_or_create(name='landlord')
        tenant_group, _ = Group.objects.get_or_create(name='tenant')
        if self.user_type == 'landlord':
            self.groups.add(landlord_group)
            self.groups.remove(tenant_group)
        elif self.user_type == 'tenant':
            self.groups.add(tenant_group)
            self.groups.remove(landlord_group)

    @property
    def my_tenants(self):
        """For landlords: Get all their tenants through TenantProfile"""
        if self.is_landlord:
            return CustomUser.objects.filter(
                tenant_profile__landlord=self,
                groups__name='tenant'
            ).distinct()
        return CustomUser.objects.none()

    @property
    def my_landlord(self):
        """For tenants: Get their landlord through TenantProfile"""
        if self.is_tenant and hasattr(self, 'tenant_profile'):
            return self.tenant_profile.landlord
        return None

    @classmethod
    def get_landlord_by_code(cls, landlord_code):
        """Get active landlord by landlord_code"""
        try:
            return cls.objects.get(
                landlord_code=landlord_code,
                groups__name='landlord',
                is_active=True
            )
        except cls.DoesNotExist:
            return None

    def get_tenant_profile(self):
        """Get tenant profile if user is a tenant"""
        if self.is_tenant:
            return getattr(self, 'tenant_profile', None)
        return None


class Subscription(models.Model):
    PLAN_CHOICES = [
        ("free", "Free (30-day trial)"),
        ("starter", "Tier 1 (1-10 units)"),
        ("basic", "Tier 2 (11-20 units)"),
        ("premium", "Tier 3 (21-50 units)"),
        ("professional", "Tier 4 (51-100 units)"),
        ("onetime", "One-time (Lifetime, up to 50 units)"),
    ]

    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name="subscription")
    plan = models.CharField(max_length=20, choices=PLAN_CHOICES, default="free")
    start_date = models.DateTimeField(auto_now_add=True)
    expiry_date = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        # Set expiry dates based on plan
        if not self.expiry_date:
            if self.plan == "free":
                self.expiry_date = timezone.now() + timedelta(days=30)  # 30-day free trial
            elif self.plan in ["starter", "basic", "premium", "professional"]:
                # All monthly subscriptions
                self.expiry_date = timezone.now() + timedelta(days=30)
            # "onetime" has no expiry (lifetime access)
        
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
        # Keep legacy constraints for compatibility; enforced strictly in clean()
        limit_choices_to={'user_type': 'tenant'},
        related_name='tenant_profile'
    )
    landlord = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='tenants',
        limit_choices_to={'user_type': 'landlord'},
        null=False,
        blank=False
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
            if not self.tenant.is_tenant:
                raise ValidationError("User must be a tenant")
            if not self.landlord.is_landlord:
                raise ValidationError("Landlord must be a landlord")
        
        # Ensure landlord exists and is active
        if self.landlord and not self.landlord.is_active:
            raise ValidationError("Landlord account is not active")

    def save(self, *args, **kwargs):
        self.clean()
        # Don't automatically set landlord from unit - require explicit assignment
        super().save(*args, **kwargs)


# ===== Signals to keep Groups and legacy user_type in sync =====

@receiver(post_save, sender=CustomUser)
def sync_groups_after_user_save(sender, instance: CustomUser, created, **kwargs):
    # Ensure groups reflect the legacy user_type (for existing code paths)
    if getattr(instance, 'user_type', None):
        try:
            instance.sync_groups_from_user_type()
        except Exception:
            pass

@receiver(m2m_changed, sender=CustomUser.groups.through)
def sync_user_type_after_group_change(sender, instance: CustomUser, action, **kwargs):
    if action in {'post_add', 'post_remove', 'post_clear'}:
        try:
            instance.sync_user_type_from_groups(save=True)
        except Exception:
            pass


# ===== Tenant Application Model =====
class TenantApplication(models.Model):
    """
    Track tenant applications for units - handles both new and existing tenants
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('declined', 'Declined'),
    ]
    
    tenant = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='applications',
        limit_choices_to={'user_type': 'tenant'}
    )
    landlord = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='tenant_applications',
        limit_choices_to={'user_type': 'landlord'}
    )
    unit = models.ForeignKey(
        Unit,
        on_delete=models.CASCADE,
        related_name='applications',
        null=True,
        blank=True,
        help_text="Unit the tenant is applying for"
    )
    
    # Application details
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    already_living_in_property = models.BooleanField(
        default=False,
        help_text="True if tenant already lives in this landlord's property"
    )
    deposit_required = models.BooleanField(
        default=True,
        help_text="Whether deposit payment is required"
    )
    deposit_paid = models.BooleanField(
        default=False,
        help_text="Whether deposit has been paid"
    )
    
    # Timestamps
    applied_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_applications'
    )
    
    # Additional info
    notes = models.TextField(blank=True, null=True, help_text="Additional notes from tenant")
    landlord_notes = models.TextField(blank=True, null=True, help_text="Notes from landlord")
    
    class Meta:
        ordering = ['-applied_at']
        indexes = [
            models.Index(fields=['landlord', 'status']),
            models.Index(fields=['tenant', 'status']),
        ]
    
    def __str__(self):
        unit_info = f" for {self.unit.unit_number}" if self.unit else ""
        return f"{self.tenant.full_name} → {self.landlord.full_name}{unit_info} ({self.status})"
    
    def clean(self):
        """Validation logic"""
        if self.tenant and not self.tenant.is_tenant:
            raise ValidationError("Applicant must be a tenant")
        if self.landlord and not self.landlord.is_landlord:
            raise ValidationError("Landlord must have landlord role")
        
        # If already living in property, deposit should not be required
        if self.already_living_in_property:
            self.deposit_required = False
    
    def approve(self, reviewed_by_user=None):
        """Approve the application and assign tenant to unit"""
        self.status = 'approved'
        self.reviewed_at = timezone.now()
        self.reviewed_by = reviewed_by_user
        self.save()
        
        # If unit is specified, assign tenant to it
        if self.unit:
            self.unit.tenant = self.tenant
            self.unit.is_available = False
            self.unit.assigned_date = timezone.now()
            self.unit.save()
            
            # Update or create tenant profile
            from accounts.models import TenantProfile
            TenantProfile.objects.update_or_create(
                tenant=self.tenant,
                landlord=self.landlord,
                defaults={
                    'current_unit': self.unit,
                    'move_in_date': timezone.now()
                }
            )
    
    def decline(self, reviewed_by_user=None, reason=None):
        """Decline the application"""
        self.status = 'declined'
        self.reviewed_at = timezone.now()
        self.reviewed_by = reviewed_by_user
        if reason:
            self.landlord_notes = reason
        self.save()


# ===== Property and Unit Tracking Model =====
class PropertyUnitTracker(models.Model):
    """
    Track property and unit creation/deletion to manage subscription limits
    and send upgrade/renewal notifications
    """
    ACTION_CHOICES = [
        ('property_created', 'Property Created'),
        ('property_deleted', 'Property Deleted'),
        ('unit_created', 'Unit Created'),
        ('unit_deleted', 'Unit Deleted'),
    ]
    
    landlord = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='property_unit_tracking',
        limit_choices_to={'user_type': 'landlord'}
    )
    
    # Action details
    action = models.CharField(max_length=30, choices=ACTION_CHOICES)
    
    # Related objects (nullable in case they get deleted)
    property = models.ForeignKey(
        Property,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tracking_events'
    )
    unit = models.ForeignKey(
        Unit,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tracking_events'
    )
    
    # Snapshot of state at the time of action
    subscription_plan = models.CharField(max_length=20, help_text="Plan at the time of action")
    total_properties_after = models.IntegerField(help_text="Total properties after this action")
    total_units_after = models.IntegerField(help_text="Total units after this action")
    
    # Notification tracking
    upgrade_notification_sent = models.BooleanField(
        default=False,
        help_text="Whether upgrade notification was sent"
    )
    limit_reached = models.BooleanField(
        default=False,
        help_text="Whether limit was reached with this action"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Optional notes
    notes = models.TextField(blank=True, null=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['landlord', 'action']),
            models.Index(fields=['landlord', 'created_at']),
            models.Index(fields=['limit_reached']),
        ]
    
    def __str__(self):
        return f"{self.landlord.full_name} - {self.action} at {self.created_at.strftime('%Y-%m-%d %H:%M')}"
    
    @classmethod
    def track_property_creation(cls, landlord, property_obj):
        """Track when a property is created"""
        subscription = getattr(landlord, 'subscription', None)
        plan = subscription.plan if subscription else 'unknown'
        
        total_properties = Property.objects.filter(landlord=landlord).count()
        total_units = Unit.objects.filter(property_obj__landlord=landlord).count()
        
        return cls.objects.create(
            landlord=landlord,
            action='property_created',
            property=property_obj,
            subscription_plan=plan,
            total_properties_after=total_properties,
            total_units_after=total_units
        )
    
    @classmethod
    def track_unit_creation(cls, landlord, unit):
        """Track when a unit is created"""
        subscription = getattr(landlord, 'subscription', None)
        plan = subscription.plan if subscription else 'unknown'
        
        total_properties = Property.objects.filter(landlord=landlord).count()
        total_units = Unit.objects.filter(property_obj__landlord=landlord).count()
        
        return cls.objects.create(
            landlord=landlord,
            action='unit_created',
            unit=unit,
            property=unit.property_obj,
            subscription_plan=plan,
            total_properties_after=total_properties,
            total_units_after=total_units
        )