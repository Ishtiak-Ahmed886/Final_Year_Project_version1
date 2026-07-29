from rest_framework import serializers
from .models import Payment
from apps.appointments.serializers import AppointmentSerializer

class PaymentSerializer(serializers.ModelSerializer):
    appointment = AppointmentSerializer(read_only=True)

    class Meta:
        model = Payment
        fields = (
            'id', 'appointment', 'amount', 'currency',
            'payment_method', 'transaction_id', 'payment_status', 'created_at'
        )
        read_only_fields = ('id', 'created_at')

class InitiatePaymentSerializer(serializers.Serializer):
    appointment_id = serializers.UUIDField(required=True)
    payment_method = serializers.CharField(required=False, default='STRIPE')

class ProcessPaymentSerializer(serializers.Serializer):
    transaction_id = serializers.CharField(required=False, default='TXN_MOCK_SUCCESS')
