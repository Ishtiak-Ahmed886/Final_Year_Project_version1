from django.db import models
from apps.core.models import BaseModel
from apps.appointments.models import Appointment

class PaymentStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending'
    COMPLETED = 'COMPLETED', 'Completed'
    FAILED = 'FAILED', 'Failed'
    REFUNDED = 'REFUNDED', 'Refunded'

class PaymentMethod(models.TextChoices):
    STRIPE = 'STRIPE', 'Stripe'
    SSLCOMMERZ = 'SSLCOMMERZ', 'SSLCommerz'
    PAYPAL = 'PAYPAL', 'PayPal'
    CASH = 'CASH', 'Cash'

class Payment(BaseModel):
    """
    1-to-1 payment record tied strictly to an Appointment.
    """
    appointment = models.OneToOneField(
        Appointment,
        on_delete=models.PROTECT,
        related_name='payment'
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default='USD')
    payment_method = models.CharField(
        max_length=20,
        choices=PaymentMethod.choices,
        default=PaymentMethod.STRIPE
    )
    transaction_id = models.CharField(max_length=255, blank=True, default='')
    payment_status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING,
        db_index=True
    )

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Payment'
        verbose_name_plural = 'Payments'

    def __str__(self):
        return f"Payment {self.id.hex[:8]} - Appointment {self.appointment_id.hex[:8]} ({self.payment_status})"
