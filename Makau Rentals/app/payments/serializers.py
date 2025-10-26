from rest_framework import serializers
from .models import Payment, SubscriptionPayment

class PaymentSerializer(serializers.ModelSerializer):
    date = serializers.DateTimeField(source='created_at', read_only=True)  # FIX: Use created_at
    phone = serializers.CharField(source='tenant.phone_number', read_only=True)
    tenant_name = serializers.CharField(source='tenant.full_name', read_only=True)
    unit_number = serializers.CharField(source='unit.unit_number', read_only=True)
    
    # Add property information
    property_id = serializers.IntegerField(source='unit.property_obj.id', read_only=True)
    property_name = serializers.CharField(source='unit.property_obj.name', read_only=True)
    
    # Add status display field to map backend status to frontend
    status_display = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = [
            'id', 'tenant', 'tenant_name', 'unit', 'unit_number', 
            'payment_type', 'amount', 'mpesa_receipt', 'date', 'phone', 
            'status', 'status_display', 'reference_number',
            'property_id', 'property_name'  # Add property fields
        ]
        read_only_fields = ['created_at', 'status']

    def get_status_display(self, obj):
        """Map backend status to frontend display status"""
        status_map = {
            'completed': 'Success',
            'pending': 'Pending', 
            'failed': 'Failed',
            'cancelled': 'Failed'
        }
        return status_map.get(obj.status, obj.status)

class SubscriptionPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPayment
        fields = '__all__'
        read_only_fields = ['transaction_date']