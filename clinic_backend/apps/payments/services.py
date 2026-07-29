from django.db import transaction
from rest_framework.exceptions import ValidationError
from .models import Payment, PaymentStatus, PaymentMethod
from apps.appointments.models import Appointment, AppointmentStatus

def initiate_payment(*, appointment: Appointment, payment_method: str = PaymentMethod.STRIPE) -> Payment:
    if hasattr(appointment, 'payment'):
        return appointment.payment

    payment = Payment.objects.create(
        appointment=appointment,
        amount=appointment.amount,
        payment_method=payment_method,
        payment_status=PaymentStatus.PENDING
    )
    return payment

def process_payment_success(*, payment: Payment, transaction_id: str) -> Payment:
    if payment.payment_status == PaymentStatus.COMPLETED:
        return payment

    with transaction.atomic():
        payment.payment_status = PaymentStatus.COMPLETED
        payment.transaction_id = transaction_id
        payment.save(update_fields=['payment_status', 'transaction_id', 'updated_at'])

        # Update appointment status to CONFIRMED
        appointment = payment.appointment
        appointment.status = AppointmentStatus.CONFIRMED
        appointment.save(update_fields=['status', 'updated_at'])

    return payment
