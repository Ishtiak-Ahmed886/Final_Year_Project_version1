from django.urls import path
from .views import (
    SpecializationListCreateView,
    DoctorListCreateView,
    DoctorDetailView,
    DoctorAssignClinicView,
)

app_name = 'doctors'

urlpatterns = [
    path('specializations/', SpecializationListCreateView.as_view(), name='specialization_list_create'),
    path('', DoctorListCreateView.as_view(), name='doctor_list_create'),
    path('<uuid:pk>/', DoctorDetailView.as_view(), name='doctor_detail'),
    path('<uuid:pk>/assign-clinic/', DoctorAssignClinicView.as_view(), name='doctor_assign_clinic'),
]
