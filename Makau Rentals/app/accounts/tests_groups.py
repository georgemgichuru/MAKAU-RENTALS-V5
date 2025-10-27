"""
Tests for Group-based user type system
"""
from django.test import TestCase
from django.contrib.auth.models import Group
from accounts.models import CustomUser, TenantProfile


class GroupBasedUserTypeTests(TestCase):
    """Test the group-based user type system"""

    def setUp(self):
        """Set up test data"""
        # Ensure groups exist
        self.landlord_group, _ = Group.objects.get_or_create(name='landlord')
        self.tenant_group, _ = Group.objects.get_or_create(name='tenant')

    def test_landlord_creation_assigns_group(self):
        """Test that creating a landlord user assigns them to landlord group"""
        landlord = CustomUser.objects.create_user(
            email='landlord@test.com',
            full_name='Test Landlord',
            password='testpass123',
            user_type='landlord'
        )
        
        # Check group membership
        self.assertTrue(landlord.groups.filter(name='landlord').exists())
        self.assertFalse(landlord.groups.filter(name='tenant').exists())
        
        # Check helper properties
        self.assertTrue(landlord.is_landlord)
        self.assertFalse(landlord.is_tenant)

    def test_tenant_creation_assigns_group(self):
        """Test that creating a tenant user assigns them to tenant group"""
        tenant = CustomUser.objects.create_user(
            email='tenant@test.com',
            full_name='Test Tenant',
            password='testpass123',
            user_type='tenant'
        )
        
        # Check group membership
        self.assertTrue(tenant.groups.filter(name='tenant').exists())
        self.assertFalse(tenant.groups.filter(name='landlord').exists())
        
        # Check helper properties
        self.assertTrue(tenant.is_tenant)
        self.assertFalse(tenant.is_landlord)

    def test_changing_user_type_updates_groups(self):
        """Test that changing user_type field updates group membership"""
        user = CustomUser.objects.create_user(
            email='user@test.com',
            full_name='Test User',
            password='testpass123',
            user_type='tenant'
        )
        
        # Verify initial state
        self.assertTrue(user.is_tenant)
        self.assertFalse(user.is_landlord)
        
        # Change user_type
        user.user_type = 'landlord'
        user.save()
        
        # Refresh from database
        user.refresh_from_db()
        
        # Verify groups updated
        self.assertTrue(user.groups.filter(name='landlord').exists())
        self.assertFalse(user.groups.filter(name='tenant').exists())
        self.assertTrue(user.is_landlord)
        self.assertFalse(user.is_tenant)

    def test_adding_group_updates_user_type(self):
        """Test that adding a group updates the user_type field"""
        user = CustomUser.objects.create_user(
            email='user@test.com',
            full_name='Test User',
            password='testpass123',
            user_type='tenant'
        )
        
        # Verify initial state
        self.assertEqual(user.user_type, 'tenant')
        
        # Change groups
        user.groups.clear()
        user.groups.add(self.landlord_group)
        
        # Refresh from database
        user.refresh_from_db()
        
        # Verify user_type updated
        self.assertEqual(user.user_type, 'landlord')
        self.assertTrue(user.is_landlord)
        self.assertFalse(user.is_tenant)

    def test_queryset_filtering_by_group(self):
        """Test filtering users by group"""
        # Create multiple users
        landlord1 = CustomUser.objects.create_user(
            email='landlord1@test.com',
            full_name='Landlord One',
            password='testpass123',
            user_type='landlord'
        )
        landlord2 = CustomUser.objects.create_user(
            email='landlord2@test.com',
            full_name='Landlord Two',
            password='testpass123',
            user_type='landlord'
        )
        tenant1 = CustomUser.objects.create_user(
            email='tenant1@test.com',
            full_name='Tenant One',
            password='testpass123',
            user_type='tenant'
        )
        tenant2 = CustomUser.objects.create_user(
            email='tenant2@test.com',
            full_name='Tenant Two',
            password='testpass123',
            user_type='tenant'
        )
        
        # Test group-based filtering
        landlords = CustomUser.objects.filter(groups__name='landlord')
        tenants = CustomUser.objects.filter(groups__name='tenant')
        
        self.assertEqual(landlords.count(), 2)
        self.assertEqual(tenants.count(), 2)
        
        self.assertIn(landlord1, landlords)
        self.assertIn(landlord2, landlords)
        self.assertIn(tenant1, tenants)
        self.assertIn(tenant2, tenants)

    def test_my_tenants_uses_groups(self):
        """Test that my_tenants property uses group filtering"""
        landlord = CustomUser.objects.create_user(
            email='landlord@test.com',
            full_name='Test Landlord',
            password='testpass123',
            user_type='landlord'
        )
        
        # Create tenants linked to this landlord
        tenant1 = CustomUser.objects.create_user(
            email='tenant1@test.com',
            full_name='Tenant One',
            password='testpass123',
            user_type='tenant'
        )
        TenantProfile.objects.create(
            tenant=tenant1,
            landlord=landlord
        )
        
        tenant2 = CustomUser.objects.create_user(
            email='tenant2@test.com',
            full_name='Tenant Two',
            password='testpass123',
            user_type='tenant'
        )
        TenantProfile.objects.create(
            tenant=tenant2,
            landlord=landlord
        )
        
        # Create a landlord that shouldn't be in results
        other_landlord = CustomUser.objects.create_user(
            email='other@test.com',
            full_name='Other Landlord',
            password='testpass123',
            user_type='landlord'
        )
        
        # Get tenants
        my_tenants = landlord.my_tenants
        
        # Verify only tenant users are returned
        self.assertEqual(my_tenants.count(), 2)
        self.assertIn(tenant1, my_tenants)
        self.assertIn(tenant2, my_tenants)
        self.assertNotIn(other_landlord, my_tenants)

    def test_backward_compatibility_with_legacy_user_type(self):
        """Test that legacy user_type field remains synchronized"""
        user = CustomUser.objects.create_user(
            email='user@test.com',
            full_name='Test User',
            password='testpass123',
            user_type='landlord'
        )
        
        # Verify both systems agree
        self.assertEqual(user.user_type, 'landlord')
        self.assertTrue(user.is_landlord)
        
        # Change via groups
        user.groups.clear()
        user.groups.add(self.tenant_group)
        user.refresh_from_db()
        
        # Verify both systems updated
        self.assertEqual(user.user_type, 'tenant')
        self.assertTrue(user.is_tenant)
        
        # Change via user_type
        user.user_type = 'landlord'
        user.save()
        user.refresh_from_db()
        
        # Verify both systems updated
        self.assertTrue(user.groups.filter(name='landlord').exists())
        self.assertTrue(user.is_landlord)

    def test_get_landlord_by_code_uses_groups(self):
        """Test that get_landlord_by_code uses group filtering"""
        landlord = CustomUser.objects.create_user(
            email='landlord@test.com',
            full_name='Test Landlord',
            password='testpass123',
            user_type='landlord'
        )
        landlord.landlord_code = 'TEST123'
        landlord.save()
        
        # Get landlord by code
        found_landlord = CustomUser.get_landlord_by_code('TEST123')
        
        self.assertEqual(found_landlord, landlord)
        self.assertTrue(found_landlord.is_landlord)

    def test_tenant_profile_validation_uses_groups(self):
        """Test that TenantProfile validation uses group helpers"""
        landlord = CustomUser.objects.create_user(
            email='landlord@test.com',
            full_name='Test Landlord',
            password='testpass123',
            user_type='landlord'
        )
        
        tenant = CustomUser.objects.create_user(
            email='tenant@test.com',
            full_name='Test Tenant',
            password='testpass123',
            user_type='tenant'
        )
        
        # Should work with proper landlord
        profile = TenantProfile(tenant=tenant, landlord=landlord)
        profile.clean()  # Should not raise
        
        # Try to create with another tenant as "landlord"
        other_tenant = CustomUser.objects.create_user(
            email='tenant2@test.com',
            full_name='Tenant Two',
            password='testpass123',
            user_type='tenant'
        )
        
        from django.core.exceptions import ValidationError
        profile_invalid = TenantProfile(tenant=tenant, landlord=other_tenant)
        
        with self.assertRaises(ValidationError):
            profile_invalid.clean()
