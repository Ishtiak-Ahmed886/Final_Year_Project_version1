from django.conf import settings
from django.http import HttpResponseRedirect
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from .models import Payment, PaymentMethod, PaymentStatus
from .serializers import (
    PaymentSerializer,
    InitiatePaymentSerializer,
    SSLCommerzInitiateSerializer,
    ProcessPaymentSerializer
)
from .services import initiate_payment, process_payment_success
from .sslcommerz import initiate_sslcommerz_session, verify_sslcommerz_payment
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
            payment_method=serializer.validated_data.get('payment_method', PaymentMethod.SSLCOMMERZ)
        )
        return Response(PaymentSerializer(payment).data, status=status.HTTP_201_CREATED)

@extend_schema(tags=['Payments'])
class PaymentDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PaymentSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Payment.objects.select_related(
            'appointment', 'appointment__patient', 'appointment__doctor',
            'appointment__clinic', 'appointment__family_member'
        ).all()
        if user.role == 'PATIENT':
            return queryset.filter(appointment__patient=user)
        elif user.role == 'CLINIC_ADMIN':
            return queryset.filter(appointment__clinic__owner=user)
        return queryset

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
        val_id = serializer.validated_data.get('val_id', '')
        bank_tran_id = serializer.validated_data.get('bank_tran_id', '')
        card_type = serializer.validated_data.get('card_type', '')
        payment_method = serializer.validated_data.get('payment_method', '')

        payment = process_payment_success(
            payment=payment,
            transaction_id=txn_id,
            val_id=val_id,
            bank_tran_id=bank_tran_id,
            card_type=card_type,
            payment_method=payment_method
        )
        return Response(PaymentSerializer(payment).data, status=status.HTTP_200_OK)


@extend_schema(tags=['Payments'])
class SSLCommerzInitiateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = SSLCommerzInitiateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        appointment_id = serializer.validated_data['appointment_id']

        try:
            appointment = Appointment.objects.get(pk=appointment_id)
        except Appointment.DoesNotExist:
            return Response({'detail': 'Appointment not found.'}, status=status.HTTP_404_NOT_FOUND)

        payment = initiate_payment(
            appointment=appointment,
            payment_method=PaymentMethod.SSLCOMMERZ
        )

        customer_name = request.user.full_name or request.user.first_name or "Patient"
        customer_email = request.user.email
        customer_phone = request.user.phone or "01700000000"

        gateway_url = initiate_sslcommerz_session(
            payment=payment,
            customer_name=customer_name,
            customer_email=customer_email,
            customer_phone=customer_phone
        )

        return Response({
            'payment_id': str(payment.id),
            'redirect_url': gateway_url,
            'amount': str(payment.amount),
            'currency': payment.currency
        }, status=status.HTTP_200_OK)

@method_decorator(csrf_exempt, name='dispatch')
class SSLCommerzSuccessCallbackView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        return self._handle_callback(request)

    def get(self, request, *args, **kwargs):
        return self._handle_callback(request)

    def _handle_callback(self, request):
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://127.0.0.1:5173')
        data = request.POST if request.method == 'POST' else request.GET

        tran_id = data.get('tran_id')
        val_id = data.get('val_id', '')
        bank_tran_id = data.get('bank_tran_id', '')
        card_type = data.get('card_type', '')

        if not tran_id:
            return HttpResponseRedirect(f"{frontend_url}/dashboard?payment=fail")

        try:
            payment = Payment.objects.get(pk=tran_id)
        except (Payment.DoesNotExist, ValueError):
            return HttpResponseRedirect(f"{frontend_url}/dashboard?payment=fail")

        txn_ref = bank_tran_id or val_id or f"SSL_{str(tran_id)[:8]}"
        process_payment_success(
            payment=payment,
            transaction_id=txn_ref,
            val_id=val_id,
            bank_tran_id=bank_tran_id,
            card_type=card_type
        )

        return HttpResponseRedirect(f"{frontend_url}/dashboard?payment=success&apt_id={payment.appointment_id}")

@method_decorator(csrf_exempt, name='dispatch')
class SSLCommerzFailCallbackView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        return self._handle_fail(request)

    def get(self, request, *args, **kwargs):
        return self._handle_fail(request)

    def _handle_fail(self, request):
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://127.0.0.1:5173')
        data = request.POST if request.method == 'POST' else request.GET
        tran_id = data.get('tran_id')
        if tran_id:
            try:
                Payment.objects.filter(pk=tran_id).update(payment_status=PaymentStatus.FAILED)
            except Exception:
                pass
        return HttpResponseRedirect(f"{frontend_url}/dashboard?payment=fail")

@method_decorator(csrf_exempt, name='dispatch')
class SSLCommerzCancelCallbackView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        return self._handle_cancel(request)

    def get(self, request, *args, **kwargs):
        return self._handle_cancel(request)

    def _handle_cancel(self, request):
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://127.0.0.1:5173')
        return HttpResponseRedirect(f"{frontend_url}/dashboard?payment=cancel")

@method_decorator(csrf_exempt, name='dispatch')
class SSLCommerzIPNView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        data = request.POST
        tran_id = data.get('tran_id')
        val_id = data.get('val_id', '')
        bank_tran_id = data.get('bank_tran_id', '')
        card_type = data.get('card_type', '')

        if tran_id:
            try:
                payment = Payment.objects.get(pk=tran_id)
                process_payment_success(
                    payment=payment,
                    transaction_id=bank_tran_id or val_id or f"SSL_IPN_{str(tran_id)[:8]}",
                    val_id=val_id,
                    bank_tran_id=bank_tran_id,
                    card_type=card_type
                )
                return Response({'status': 'IPN verified and payment updated'}, status=status.HTTP_200_OK)
            except Payment.DoesNotExist:
                pass
        return Response({'status': 'Payment not found'}, status=status.HTTP_404_NOT_FOUND)
