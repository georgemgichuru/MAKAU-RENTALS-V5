from django.contrib import admin
from django.urls import path, include
from accounts.health import health_check
from accounts.setup import setup_database
from accounts.test_db import test_database

urlpatterns = [
    path('admin/', admin.site.urls),
    # Health check endpoint
    path('api/health/', health_check, name='health_check'),
    # ONE-TIME setup endpoint (DELETE AFTER USE!)
    path('api/setup-database/', setup_database, name='setup_database'),
    # Test database connection
    path('api/test-db/', test_database, name='test_database'),
    # from accounts/urls.py
    path('api/accounts/', include('accounts.urls')),
    # from payments/urls.py
    path("api/payments/", include("payments.urls")),
    # from communication/urls.py
    path("api/communication/", include("communication.urls")),
]
