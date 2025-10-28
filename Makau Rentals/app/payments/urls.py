from django.urls import path
from .views_pesapal import (
    # PesaPal Payment Initiation
    initiate_rent_payment,
    initiate_subscription_payment,
    pesapal_ipn_callback,

    # DRF views
    PaymentListCreateView,
    PaymentDetailView,
    SubscriptionPaymentListCreateView,
    SubscriptionPaymentDetailView,
    RentSummaryView,
    UnitTypeListView,
    BulkRentUpdateView, 
    UnitRentUpdateView,
    InitiateDepositPaymentView,
    InitiateDepositPaymentRegistrationView,
    DepositPaymentStatusView,
    RentPaymentStatusView,
    CleanupPendingPaymentsView,
    TestPesaPalView,

    # CSV reports
    LandLordCSVView as landlord_csv,
    TenantCSVView as tenant_csv,
    RentPaymentsCSVView as rent_payments_csv,
)
from django.views.decorators.csrf import csrf_exempt

urlpatterns = [
    # ------------------------------
    # PESAPAL PAYMENT INITIATION
    # ------------------------------
    path("initiate-rent-payment/<int:unit_id>/", initiate_rent_payment, name="initiate-rent-payment"),
    path("initiate-subscription-payment/", initiate_subscription_payment, name="initiate-subscription-payment"),
    path("callback/pesapal-ipn/", pesapal_ipn_callback, name="pesapal-ipn-callback"),

    # ------------------------------
    # RENT PAYMENTS (DRF)
    # ------------------------------
    path("rent-payments/", PaymentListCreateView.as_view(), name="rent-payment-list-create"),
    path("rent-payments/<int:pk>/", PaymentDetailView.as_view(), name="rent-payment-detail"),
    path('rent-status/<int:payment_id>/', RentPaymentStatusView.as_view(), name='rent-payment-status'),

    # ------------------------------
    # SUBSCRIPTION PAYMENTS (DRF)
    # ------------------------------
    path("subscription-payments/", SubscriptionPaymentListCreateView.as_view(), name="subscription-payment-list-create"),
    path("subscription-payments/<int:pk>/", SubscriptionPaymentDetailView.as_view(), name="subscription-payment-detail"),
    path("rent-payments/summary/", RentSummaryView.as_view(), name="rent-summary"),

    # ------------------------------
    # UNIT TYPES
    # ------------------------------
    path("unit-types/", UnitTypeListView.as_view(), name="unit-types"),

    # ------------------------------
    # INITIATE DEPOSIT PAYMENT
    # ------------------------------
    path("initiate-deposit/", InitiateDepositPaymentView.as_view(), name="initiate-deposit"),
    path("initiate-deposit-registration/", InitiateDepositPaymentRegistrationView.as_view(), name="initiate-deposit-registration"),
    path('deposit-status/<int:payment_id>/', DepositPaymentStatusView.as_view(), name='deposit-status'),
    
    # ------------------------------
    # CSV REPORTS
    # ------------------------------
    path("landlord-csv/<int:property_id>/", landlord_csv.as_view(), name="landlord-csv"),
    path("tenant-csv/<int:unit_id>/", tenant_csv.as_view(), name="tenant-csv"),
    path("rent-payments/csv/", rent_payments_csv.as_view(), name="rent-payments-csv"),

    # ------------------------------
    # CLEANUP AND SIMULATION ENDPOINTS
    # ------------------------------
    path("cleanup-pending-payments/", CleanupPendingPaymentsView.as_view(), name="cleanup-pending-payments"),
    
    # ------------------------------
    # TEST ENDPOINTS
    # ------------------------------
    path("test-pesapal/", TestPesaPalView.as_view(), name="test-pesapal"),
    
    # Bulk rent update
    path("bulk-rent-update/", BulkRentUpdateView.as_view(), name="bulk-rent-update"),
    path("unit-rent-update/<int:unit_id>/", UnitRentUpdateView.as_view(), name="unit-rent-update"),
]
