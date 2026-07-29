from datetime import date, time
from typing import Optional
from django.db import transaction, IntegrityError
from rest_framework.exceptions import ValidationError
from .models import Appointment, AppointmentStatus
from apps.doctors.models import DoctorClinic
from apps.clinics.models import Clinic
from apps.doctors.models import Doctor

def book_appointment(*, patient, clinic_id: str, doctor_id: str, appointment_date: date, appointment_time: time, problem_description: str = "") -> Appointment:
    """
    Atomic appointment booking with concurrency protection against double booking.
    """
    try:
        doctor_clinic = DoctorClinic.objects.select_related('doctor', 'clinic', 'department').get(
            doctor_id=doctor_id,
            clinic_id=clinic_id,
            is_active=True
        )
    except DoctorClinic.DoesNotExist:
        raise ValidationError({"doctor_id": "Doctor does not practice at this clinic or mapping is inactive."})

    amount = doctor_clinic.consultation_fee

    with transaction.atomic():
        # Check if slot is already booked with a database lock
        existing = Appointment.objects.select_for_update().filter(
            doctor_id=doctor_id,
            clinic_id=clinic_id,
            appointment_date=appointment_date,
            appointment_time=appointment_time,
            status__in=[AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED]
        ).exists()

        if existing:
            raise ValidationError({"appointment_time": "This time slot has already been booked. Please choose another slot."})

        try:
            appointment = Appointment.objects.create(
                patient=patient,
                clinic_id=clinic_id,
                doctor_id=doctor_id,
                department=doctor_clinic.department,
                appointment_date=appointment_date,
                appointment_time=appointment_time,
                amount=amount,
                problem_description=problem_description,
                status=AppointmentStatus.PENDING
            )
            return appointment
        except IntegrityError:
            raise ValidationError({"appointment_time": "Time slot conflict. Slot was booked concurrently."})

def cancel_appointment(*, appointment: Appointment, cancelled_by_user) -> Appointment:
    if appointment.status in [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED]:
        raise ValidationError({"status": f"Cannot cancel an appointment with status {appointment.status}."})
    appointment.status = AppointmentStatus.CANCELLED
    appointment.save(update_fields=['status', 'updated_at'])
    return appointment

def complete_appointment(*, appointment: Appointment) -> Appointment:
    if appointment.status != AppointmentStatus.CONFIRMED:
        raise ValidationError({"status": "Only confirmed appointments can be marked as completed."})
    appointment.status = AppointmentStatus.COMPLETED
    appointment.save(update_fields=['status', 'updated_at'])
    return appointment
