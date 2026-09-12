from django.urls import path
from .views import (
    DepartmentListCreateView,
    ClinicListCreateView,
    ClinicDetailView,
    ClinicAddDepartmentView,
    NearbyClinicListView,
    ClinicVerifyView,
    MyClinicView,
    ClinicServiceListCreateView,
    ClinicServiceDetailView,
    ClinicFinancialAnalyticsView,
)

app_name = 'clinics'

urlpatterns = [
    path('departments/', DepartmentListCreateView.as_view(), name='department_list_create'),
    path('nearby/', NearbyClinicListView.as_view(), name='clinic_nearby'),
    path('my-clinic/', MyClinicView.as_view(), name='my_clinic'),
    path('', ClinicListCreateView.as_view(), name='clinic_list_create'),
    path('<uuid:pk>/', ClinicDetailView.as_view(), name='clinic_detail'),
    path('<uuid:pk>/departments/', ClinicAddDepartmentView.as_view(), name='clinic_add_department'),
    path('<uuid:pk>/verify/', ClinicVerifyView.as_view(), name='clinic_verify'),
    path('<uuid:clinic_id>/services/', ClinicServiceListCreateView.as_view(), name='clinic_services'),
    path('<uuid:clinic_id>/services/<uuid:pk>/', ClinicServiceDetailView.as_view(), name='clinic_service_detail'),
    path('<uuid:clinic_id>/analytics/', ClinicFinancialAnalyticsView.as_view(), name='clinic_analytics'),
]

