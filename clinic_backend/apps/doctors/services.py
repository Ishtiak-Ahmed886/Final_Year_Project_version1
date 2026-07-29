from django.db import models
from datetime import datetime, date, time, timedelta
from typing import List, Dict, Any, Optional
from rest_framework.exceptions import ValidationError
from .models import Specialization, Doctor, DoctorClinic, DoctorSchedule, DoctorLeave, DayOfWeek
from apps.clinics.models import Clinic, Department


def create_specialization(*, name: str, description: str = "") -> Specialization:
    if Specialization.objects.filter(name__iexact=name).exists():
        raise ValidationError({"name": "A specialization with this name already exists."})
    return Specialization.objects.create(name=name, description=description)

def create_doctor(
    *,
    full_name: str,
    qualification: str = "",
    email: str = "",
    specialization_ids: Optional[List[str]] = None,
    clinic_id: Optional[str] = None,
    consultation_fee: Optional[float] = None,
    department_id: Optional[str] = None,
    room_number: str = "",
    **extra_fields
) -> Doctor:
    doctor = None
    if email:
        doctor = Doctor.objects.filter(email__iexact=email).first()

    if doctor:
        if full_name:
            doctor.full_name = full_name
        if qualification:
            doctor.qualification = qualification
        for key, val in extra_fields.items():
            if val and hasattr(doctor, key):
                setattr(doctor, key, val)
        doctor.save()
    else:
        doctor = Doctor.objects.create(
            full_name=full_name,
            qualification=qualification,
            email=email,
            **extra_fields
        )

    if specialization_ids:
        specs = Specialization.objects.filter(id__in=specialization_ids)
        doctor.specializations.add(*specs)

    if clinic_id and consultation_fee is not None:
        assign_doctor_to_clinic(
            doctor=doctor,
            clinic_id=str(clinic_id),
            consultation_fee=consultation_fee,
            department_id=str(department_id) if department_id else None,
            room_number=room_number
        )

    return doctor

def assign_doctor_to_clinic(*, doctor: Doctor, clinic_id: str, consultation_fee: float, department_id: Optional[str] = None, room_number: str = "", joining_date=None) -> DoctorClinic:
    try:
        clinic = Clinic.objects.get(id=clinic_id, is_active=True)
    except Clinic.DoesNotExist:
        raise ValidationError({"clinic_id": "Valid active clinic not found."})

    department = None
    if department_id:
        try:
            department = Department.objects.get(id=department_id, is_active=True)
        except Department.DoesNotExist:
            raise ValidationError({"department_id": "Department not found."})

    obj, created = DoctorClinic.objects.update_or_create(
        doctor=doctor,
        clinic=clinic,
        defaults={
            'department': department,
            'consultation_fee': consultation_fee,
            'room_number': room_number,
            'joining_date': joining_date,
            'is_active': True
        }
    )
    return obj

def create_doctor_schedule(*, doctor_id: str, clinic_id: str, day_of_week: int, start_time: time, end_time: time) -> DoctorSchedule:
    if start_time >= end_time:
        raise ValidationError({"start_time": "start_time must be earlier than end_time."})
    return DoctorSchedule.objects.create(
        doctor_id=doctor_id,
        clinic_id=clinic_id,
        day_of_week=day_of_week,
        start_time=start_time,
        end_time=end_time
    )

def create_doctor_leave(*, doctor_id: str, start_date: date, end_date: date, clinic_id: Optional[str] = None, reason: str = "") -> DoctorLeave:
    if start_date > end_date:
        raise ValidationError({"start_date": "start_date must be on or before end_date."})
    return DoctorLeave.objects.create(
        doctor_id=doctor_id,
        clinic_id=clinic_id,
        start_date=start_date,
        end_date=end_date,
        reason=reason
    )

def generate_doctor_available_slots(*, doctor_id: str, clinic_id: str, target_date: date) -> List[Dict[str, Any]]:
    on_leave = DoctorLeave.objects.filter(
        doctor_id=doctor_id,
        start_date__lte=target_date,
        end_date__gte=target_date,
        is_approved=True
    ).filter(models.Q(clinic_id=clinic_id) | models.Q(clinic_id__isnull=True)).exists()

    if on_leave:
        return []

    day_of_week = target_date.weekday()
    schedules = DoctorSchedule.objects.filter(
        doctor_id=doctor_id,
        clinic_id=clinic_id,
        day_of_week=day_of_week,
        is_active=True
    )

    from apps.appointments.models import Appointment, AppointmentStatus
    booked_appointments = Appointment.objects.filter(
        doctor_id=doctor_id,
        clinic_id=clinic_id,
        appointment_date=target_date,
        status__in=[AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED]
    ).values_list('appointment_time', flat=True)

    booked_times = set(booked_appointments)
    slots = []

    for sched in schedules:
        current_dt = datetime.combine(target_date, sched.start_time)
        end_dt = datetime.combine(target_date, sched.end_time)

        while current_dt + timedelta(hours=1) <= end_dt:
            slot_start_time = current_dt.time()
            slot_end_time = (current_dt + timedelta(hours=1)).time()
            
            slots.append({
                'start_time': slot_start_time.strftime('%H:%M:%S'),
                'end_time': slot_end_time.strftime('%H:%M:%S'),
                'is_available': slot_start_time not in booked_times
            })
            current_dt += timedelta(hours=1)

    return slots
