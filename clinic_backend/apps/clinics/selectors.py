from typing import Optional
from django.db.models import QuerySet, Avg, Count, Prefetch
from .models import Clinic, Department, ClinicService

def list_departments() -> QuerySet:
    return Department.objects.filter(is_active=True)

def _clinic_base_qs() -> QuerySet:
    return Clinic.objects.filter(is_active=True).select_related('owner').prefetch_related(
        'departments',
        Prefetch('services', queryset=ClinicService.objects.filter(is_available=True))
    ).annotate(
        annotated_avg_rating=Avg('reviews__rating'),
        annotated_review_count=Count('reviews')
    ).order_by('-created_at')

def list_clinics(*, city: Optional[str] = None, department_id: Optional[str] = None, only_verified: bool = True) -> QuerySet:
    qs = _clinic_base_qs()
    if only_verified:
        qs = qs.filter(verification_status='VERIFIED')
    if city:
        qs = qs.filter(city__iexact=city)
    if department_id:
        qs = qs.filter(departments__id=department_id)
    return qs

def get_clinic_by_id(clinic_id: str) -> Optional[Clinic]:
    return _clinic_base_qs().filter(id=clinic_id).first()

def get_clinic_by_slug(slug: str) -> Optional[Clinic]:
    return _clinic_base_qs().filter(slug=slug).first()

def get_clinic_by_owner(user) -> Optional[Clinic]:
    return _clinic_base_qs().filter(owner=user).first()
