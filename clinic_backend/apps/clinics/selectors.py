from typing import Optional
from django.db.models import QuerySet
from .models import Clinic, Department

def list_departments() -> QuerySet:
    return Department.objects.filter(is_active=True)

def list_clinics(*, city: Optional[str] = None, department_id: Optional[str] = None, only_verified: bool = True) -> QuerySet:
    qs = Clinic.objects.filter(is_active=True).select_related('owner').prefetch_related('departments')
    if only_verified:
        qs = qs.filter(verification_status='VERIFIED')
    if city:
        qs = qs.filter(city__iexact=city)
    if department_id:
        qs = qs.filter(departments__id=department_id)
    return qs

def get_clinic_by_id(clinic_id: str) -> Optional[Clinic]:
    return Clinic.objects.filter(id=clinic_id).select_related('owner').prefetch_related('departments').first()

def get_clinic_by_slug(slug: str) -> Optional[Clinic]:
    return Clinic.objects.filter(slug=slug).select_related('owner').prefetch_related('departments').first()

def get_clinic_by_owner(user) -> Optional[Clinic]:
    return Clinic.objects.filter(owner=user).select_related('owner').prefetch_related('departments').first()
