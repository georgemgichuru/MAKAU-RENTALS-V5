from django.db import migrations

def create_groups_and_backfill(apps, schema_editor):
    Group = apps.get_model('auth', 'Group')
    CustomUser = apps.get_model('accounts', 'CustomUser')

    landlord_group, _ = Group.objects.get_or_create(name='landlord')
    tenant_group, _ = Group.objects.get_or_create(name='tenant')

    # Backfill: assign groups based on legacy user_type
    for user in CustomUser.objects.all():
        try:
            if getattr(user, 'user_type', None) == 'landlord':
                user.groups.add(landlord_group)
                user.groups.remove(tenant_group)
            elif getattr(user, 'user_type', None) == 'tenant':
                user.groups.add(tenant_group)
                user.groups.remove(landlord_group)
        except Exception:
            # Ignore errors on group assignment during migration
            pass


def reverse_noop(apps, schema_editor):
    # Do not remove groups or memberships on reverse
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0004_alter_tenantprofile_landlord_and_more'),
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.RunPython(create_groups_and_backfill, reverse_noop),
    ]
