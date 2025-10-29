from django.contrib import admin
from django.urls import path, include
from accounts.health import health_check

urlpatterns = [
    path('admin/', admin.site.urls),
    # Health check endpoint
    path('api/health/', health_check, name='health_check'),
    # from accounts/urls.py
    path('api/accounts/', include('accounts.urls')),
    # from payments/urls.py
    path("api/payments/", include("payments.urls")),
    # from communication/urls.py
    path("api/communication/", include("communication.urls")),
]
