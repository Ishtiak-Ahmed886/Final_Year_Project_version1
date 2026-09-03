from rest_framework import serializers
from .models import Payment, PaymentMethod
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
    payment_method = serializers.ChoiceField(choices=PaymentMethod.choices, default=PaymentMethod.BKASH)

class ProcessPaymentSerializer(serializers.Serializer):
    transaction_id = serializers.CharField(required=False, default='BKASH_TRX_MOCK_12345')
