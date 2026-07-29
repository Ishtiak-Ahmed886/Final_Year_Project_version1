from rest_framework import generics, permissions, status
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from apps.accounts.permissions import IsAdmin, IsClinicAdminOrAdmin
from apps.clinics.models import Clinic
from .models import Specialization, Doctor
from .serializers import (
    SpecializationSerializer,
    DoctorSerializer,
    DoctorClinicSerializer,
    DoctorClinicAssignmentSerializer,
)
from .selectors import list_specializations, list_doctors, get_doctor_by_id
from .services import create_specialization, create_doctor, assign_doctor_to_clinic

@extend_schema(tags=['Specializations'])
class SpecializationListCreateView(generics.ListCreateAPIView):
    serializer_class = SpecializationSerializer

    def get_queryset(self):
        return list_specializations()

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsClinicAdminOrAdmin()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        spec = create_specialization(**serializer.validated_data)
        serializer.instance = spec

@extend_schema(tags=['Doctors'])
class DoctorListCreateView(generics.ListCreateAPIView):
    serializer_class = DoctorSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsClinicAdminOrAdmin()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        clinic_id = self.request.query_params.get('clinic_id')
        specialization_id = self.request.query_params.get('specialization_id')
        department_id = self.request.query_params.get('department_id')
        return list_doctors(
            clinic_id=clinic_id,
            specialization_id=specialization_id,
            department_id=department_id
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated_data = serializer.validated_data
        specialization_ids = validated_data.pop('specialization_ids', None)
        clinic_id = validated_data.pop('clinic_id', None)
        consultation_fee = validated_data.pop('consultation_fee', None)
        department_id = validated_data.pop('department_id', None)
        room_number = validated_data.pop('room_number', '')

        # Auto-bind to clinic admin's clinic if role is CLINIC_ADMIN
        if request.user.role == 'CLINIC_ADMIN':
            owned_clinic = Clinic.objects.filter(owner=request.user).first()
            if owned_clinic:
                clinic_id = str(owned_clinic.id)

        doctor = create_doctor(
            specialization_ids=specialization_ids,
            clinic_id=clinic_id,
            consultation_fee=consultation_fee,
            department_id=department_id,
            room_number=room_number,
            **validated_data
        )
        output_serializer = DoctorSerializer(doctor)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

@extend_schema(tags=['Doctors'])
class DoctorDetailView(generics.RetrieveUpdateAPIView):
    queryset = Doctor.objects.all()
    serializer_class = DoctorSerializer

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH']:
            return [IsClinicAdminOrAdmin()]
        return [permissions.AllowAny()]

@extend_schema(tags=['Doctors'])
class DoctorAssignClinicView(generics.GenericAPIView):
    serializer_class = DoctorClinicAssignmentSerializer
    permission_classes = [IsClinicAdminOrAdmin]

    def post(self, request, pk, *args, **kwargs):
        doctor = get_doctor_by_id(pk)
        if not doctor:
            return Response({'detail': 'Doctor not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        clinic_id = data.get('clinic_id')

        # Auto-bind or verify clinic ownership for CLINIC_ADMIN
        if request.user.role == 'CLINIC_ADMIN':
            owned_clinic = Clinic.objects.filter(owner=request.user).first()
            if not owned_clinic:
                return Response({'detail': 'You must create a clinic first before assigning doctors.'}, status=status.HTTP_400_BAD_REQUEST)
            clinic_id = str(owned_clinic.id)
        elif not clinic_id:
            return Response({'detail': 'clinic_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        mapping = assign_doctor_to_clinic(
            doctor=doctor,
            clinic_id=str(clinic_id),
            consultation_fee=data['consultation_fee'],
            department_id=str(data['department_id']) if data.get('department_id') else None,
            room_number=data.get('room_number', ''),
            joining_date=data.get('joining_date')
        )
        output_serializer = DoctorClinicSerializer(mapping)
        return Response(output_serializer.data, status=status.HTTP_200_OK)
