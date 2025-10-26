from django.apps import AppConfig
from django.conf import settings


class AccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'accounts'

    def ready(self):
        # Ensure default auth Groups exist at startup
        try:
            from django.contrib.auth.models import Group
            Group.objects.get_or_create(name='landlord')
            Group.objects.get_or_create(name='tenant')
        except Exception:
            # During migrations or app loading without DB, ignore
            pass
