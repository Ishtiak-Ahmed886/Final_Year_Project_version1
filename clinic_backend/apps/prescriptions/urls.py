from django.urls import path
from .views import (
    MedicationListView,
    PrescriptionListCreateView,
    PrescriptionDetailView,
    PrescriptionByAppointmentView,
    PrescriptionVerifyView,
    MedicalReportListCreateView,
    MedicalReportDetailView,
)

app_name = 'prescriptions'

urlpatterns = [
    path('', PrescriptionListCreateView.as_view(), name='prescription_list_create'),
    path('medications/', MedicationListView.as_view(), name='medication_list'),
    path('reports/', MedicalReportListCreateView.as_view(), name='medical_report_list_create'),
    path('reports/<uuid:pk>/', MedicalReportDetailView.as_view(), name='medical_report_detail'),
    path('<uuid:pk>/', PrescriptionDetailView.as_view(), name='prescription_detail'),
    path('appointment/<uuid:appointment_id>/', PrescriptionByAppointmentView.as_view(), name='prescription_by_appointment'),
    path('verify/<uuid:qr_token>/', PrescriptionVerifyView.as_view(), name='prescription_verify'),
]
