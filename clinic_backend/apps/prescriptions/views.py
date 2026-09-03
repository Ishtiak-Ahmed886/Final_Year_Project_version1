from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from .models import Medication, Prescription, MedicalReport, ReportCategory
from .serializers import (
    MedicationSerializer,
    PrescriptionSerializer,
    PrescriptionCreateSerializer,
    MedicalReportSerializer,
)
from .services import seed_dgda_medications_if_empty, create_or_update_prescription
from apps.appointments.models import Appointment

@extend_schema(tags=['Prescriptions'])
class MedicationListView(generics.ListAPIView):
    """
    GET /api/v1/prescriptions/medications/
    Search DGDA Bangladesh drug master catalog by brand or generic name.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = MedicationSerializer

    def get_queryset(self):
        seed_dgda_medications_if_empty()
        queryset = Medication.objects.all()
        search = self.request.query_params.get('search') or self.request.query_params.get('q')
        if search:
            queryset = queryset.filter(
                models.Q(brand_name__icontains=search) | models.Q(generic_name__icontains=search)
            )
        return queryset

from django.db import models

@extend_schema(tags=['Prescriptions'])
class PrescriptionListCreateView(generics.ListCreateAPIView):
    """
    GET /api/v1/prescriptions/ -> List user prescriptions
    POST /api/v1/prescriptions/ -> Doctor issues E-Prescription
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PrescriptionCreateSerializer
        return PrescriptionSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Prescription.objects.select_related('appointment', 'doctor', 'patient', 'family_member').prefetch_related('medications').all()

        if user.role == 'PATIENT':
            return queryset.filter(patient=user)
        elif user.role == 'DOCTOR':
            return queryset.filter(doctor__user=user)
        elif user.role == 'CLINIC_ADMIN':
            return queryset.filter(appointment__clinic__owner=user)
        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            appointment = Appointment.objects.get(pk=data['appointment_id'])
        except Appointment.DoesNotExist:
            return Response({'detail': 'Appointment not found.'}, status=status.HTTP_404_NOT_FOUND)

        prescription = create_or_update_prescription(
            appointment=appointment,
            doctor_user=request.user,
            diagnosis=data.get('diagnosis', ''),
            vitals=data.get('vitals', {}),
            diagnostic_tests=data.get('diagnostic_tests', ''),
            advice=data.get('advice', ''),
            medications_data=data.get('medications', [])
        )
        return Response(PrescriptionSerializer(prescription).data, status=status.HTTP_201_CREATED)

@extend_schema(tags=['Prescriptions'])
class PrescriptionDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PrescriptionSerializer

    def get_queryset(self):
        return Prescription.objects.select_related('appointment', 'doctor', 'patient', 'family_member').prefetch_related('medications').all()

@extend_schema(tags=['Prescriptions'])
class PrescriptionByAppointmentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, appointment_id, *args, **kwargs):
        try:
            prescription = Prescription.objects.select_related('appointment', 'doctor', 'patient', 'family_member').prefetch_related('medications').get(appointment_id=appointment_id)
            return Response(PrescriptionSerializer(prescription).data, status=status.HTTP_200_OK)
        except Prescription.DoesNotExist:
            return Response({'detail': 'Prescription not found for this appointment.'}, status=status.HTTP_404_NOT_FOUND)

@extend_schema(tags=['Prescriptions'])
class PrescriptionVerifyView(APIView):
    """
    Public verification endpoint for pharmacies / diagnostic labs via QR Code token.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, qr_token, *args, **kwargs):
        try:
            prescription = Prescription.objects.select_related('appointment', 'doctor', 'patient', 'family_member').prefetch_related('medications').get(qr_token=qr_token)
            return Response({
                'is_valid': True,
                'verification_message': 'Official Digital E-Prescription Verified',
                'prescription': PrescriptionSerializer(prescription).data
            }, status=status.HTTP_200_OK)
        except Prescription.DoesNotExist:
            return Response({
                'is_valid': False,
                'verification_message': 'Invalid or unverified prescription QR token.'
            }, status=status.HTTP_404_NOT_FOUND)


@extend_schema(tags=['Medical Reports'])
class MedicalReportListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/v1/prescriptions/reports/?patient_id=X&family_member_id=Y&report_type=Z
    POST /api/v1/prescriptions/reports/
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = MedicalReportSerializer

    def get_queryset(self):
        user = self.request.user
        qs = MedicalReport.objects.select_related('patient', 'family_member', 'appointment').all()

        patient_id = self.request.query_params.get('patient_id')
        family_member_id = self.request.query_params.get('family_member_id')
        report_type = self.request.query_params.get('report_type')

        if user.role == 'PATIENT':
            qs = qs.filter(patient=user)
        elif user.role in ['DOCTOR', 'CLINIC_ADMIN', 'ADMIN']:
            if patient_id:
                qs = qs.filter(patient_id=patient_id)

        if family_member_id:
            qs = qs.filter(family_member_id=family_member_id)
        if report_type:
            qs = qs.filter(report_type=report_type)

        return qs

    def perform_create(self, serializer):
        patient = self.request.user
        patient_id = self.request.data.get('patient_id')
        if patient_id and self.request.user.role in ['DOCTOR', 'CLINIC_ADMIN', 'ADMIN']:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            try:
                patient = User.objects.get(pk=patient_id)
            except User.DoesNotExist:
                pass

        serializer.save(patient=patient, uploaded_by=self.request.user)


@extend_schema(tags=['Medical Reports'])
class MedicalReportDetailView(generics.RetrieveDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = MedicalReportSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'PATIENT':
            return MedicalReport.objects.filter(patient=user)
        return MedicalReport.objects.all()
