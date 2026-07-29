from django.db import models
from django.conf import settings
from apps.core.models import BaseModel
from apps.clinics.models import Clinic, Department
from apps.doctors.models import Doctor

class AppointmentStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending'
    CONFIRMED = 'CONFIRMED', 'Confirmed'
    COMPLETED = 'COMPLETED', 'Completed'
    CANCELLED = 'CANCELLED', 'Cancelled'

class Appointment(BaseModel):
    """
    Appointment booking record.
    Flow: Pending -> Payment -> Confirmed -> Completed
    Guarantees double-booking protection using DB constraints & atomic locking.
    """
    patient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='appointments',
        limit_choices_to={'role': 'PATIENT'}
    )
    clinic = models.ForeignKey(Clinic, on_delete=models.PROTECT, related_name='appointments')
    doctor = models.ForeignKey(Doctor, on_delete=models.PROTECT, related_name='appointments')
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='appointments')
    appointment_date = models.DateField(db_index=True)
    appointment_time = models.TimeField()
    status = models.CharField(
        max_length=20,
        choices=AppointmentStatus.choices,
        default=AppointmentStatus.PENDING,
        db_index=True
    )
    problem_description = models.TextField(blank=True, default='')
    amount = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        ordering = ['-appointment_date', '-appointment_time']
        constraints = [
            models.UniqueConstraint(
                fields=['doctor', 'clinic', 'appointment_date', 'appointment_time'],
                condition=~models.Q(status='CANCELLED'),
                name='unique_active_appointment_slot'
            )
        ]
        verbose_name = 'Appointment'
        verbose_name_plural = 'Appointments'

    def __str__(self):
        return f"Appointment {self.id.hex[:8]} - Dr. {self.doctor.full_name} on {self.appointment_date} {self.appointment_time} ({self.status})"
