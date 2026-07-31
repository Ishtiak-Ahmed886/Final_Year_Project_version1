from django.urls import path
from .views import (
    DepartmentListCreateView,
    ClinicListCreateView,
    ClinicDetailView,
    ClinicAddDepartmentView,
    NearbyClinicListView,
    ClinicVerifyView,
)

app_name = 'clinics'

urlpatterns = [
    path('departments/', DepartmentListCreateView.as_view(), name='department_list_create'),
    path('nearby/', NearbyClinicListView.as_view(), name='clinic_nearby'),
    path('', ClinicListCreateView.as_view(), name='clinic_list_create'),
    path('<uuid:pk>/', ClinicDetailView.as_view(), name='clinic_detail'),
    path('<uuid:pk>/departments/', ClinicAddDepartmentView.as_view(), name='clinic_add_department'),
    path('<uuid:pk>/verify/', ClinicVerifyView.as_view(), name='clinic_verify'),
]
