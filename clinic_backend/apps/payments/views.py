from rest_framework import generics, permissions, status
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from .models import Payment
from .serializers import PaymentSerializer, InitiatePaymentSerializer, ProcessPaymentSerializer
from .services import initiate_payment, process_payment_success
from apps.appointments.models import Appointment

@extend_schema(tags=['Payments'])
class PaymentListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return InitiatePaymentSerializer
        return PaymentSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Payment.objects.select_related('appointment', 'appointment__patient', 'appointment__doctor').all()
        if user.role == 'PATIENT':
            return queryset.filter(appointment__patient=user)
        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        appointment_id = serializer.validated_data['appointment_id']

        try:
            appointment = Appointment.objects.get(pk=appointment_id)
        except Appointment.DoesNotExist:
            return Response({'detail': 'Appointment not found.'}, status=status.HTTP_404_NOT_FOUND)

        payment = initiate_payment(
            appointment=appointment,
            payment_method=serializer.validated_data.get('payment_method', 'STRIPE')
        )
        return Response(PaymentSerializer(payment).data, status=status.HTTP_201_CREATED)

@extend_schema(tags=['Payments'])
class ProcessPaymentView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ProcessPaymentSerializer

    def post(self, request, pk, *args, **kwargs):
        try:
            payment = Payment.objects.get(pk=pk)
        except Payment.DoesNotExist:
            return Response({'detail': 'Payment not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        txn_id = serializer.validated_data.get('transaction_id', 'TXN_SUCCESS')

        payment = process_payment_success(payment=payment, transaction_id=txn_id)
        return Response(PaymentSerializer(payment).data, status=status.HTTP_200_OK)
