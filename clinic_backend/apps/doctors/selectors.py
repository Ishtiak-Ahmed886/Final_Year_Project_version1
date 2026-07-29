from typing import Optional
from django.db.models import QuerySet
from .models import Specialization, Doctor, DoctorClinic

def list_specializations() -> QuerySet:
    return Specialization.objects.all()

def list_doctors(*, clinic_id: Optional[str] = None, specialization_id: Optional[str] = None, department_id: Optional[str] = None) -> QuerySet:
    qs = Doctor.objects.filter(is_active=True).prefetch_related('specializations', 'doctor_clinics__clinic', 'doctor_clinics__department')
    if clinic_id:
        qs = qs.filter(doctor_clinics__clinic_id=clinic_id, doctor_clinics__is_active=True)
    if specialization_id:
        qs = qs.filter(specializations__id=specialization_id)
    if department_id:
        qs = qs.filter(doctor_clinics__department_id=department_id, doctor_clinics__is_active=True)
    return qs.distinct()

def get_doctor_by_id(doctor_id: str) -> Optional[Doctor]:
    return Doctor.objects.filter(id=doctor_id).prefetch_related('specializations', 'doctor_clinics__clinic', 'doctor_clinics__department').first()
