from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema
from apps.accounts.permissions import IsAdmin, IsClinicAdminOrAdmin
from apps.clinics.models import Clinic, VerificationStatus
from .models import Specialization, Doctor, DoctorClinic, DoctorClinicStatus
from .serializers import (
    SpecializationSerializer,
    DoctorSerializer,
    DoctorClinicSerializer,
    DoctorClinicAssignmentSerializer,
    DoctorProfileSetupSerializer,
    DoctorClinicRequestCreateSerializer,
    DoctorClinicRequestResponseSerializer,
)
from .selectors import list_specializations, list_doctors, get_doctor_by_id
from .services import (
    create_specialization, setup_doctor_profile, assign_doctor_to_clinic,
    request_doctor_clinic_service
)


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
class DoctorListView(generics.ListAPIView):
    """Public read-only list of doctors. Admins see all doctors including unverified."""
    serializer_class = DoctorSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        clinic_id = self.request.query_params.get('clinic_id')
        specialization_id = self.request.query_params.get('specialization_id')
        department_id = self.request.query_params.get('department_id')
        user = self.request.user

        only_verified = True
        if user and user.is_authenticated and user.role in ['ADMIN', 'CLINIC_ADMIN', 'DOCTOR']:
            only_verified = False

        return list_doctors(
            clinic_id=clinic_id,
            specialization_id=specialization_id,
            department_id=department_id,
            only_verified=only_verified
        )


@extend_schema(tags=['Doctors'])
class DoctorDetailView(generics.RetrieveAPIView):
    queryset = Doctor.objects.all()
    serializer_class = DoctorSerializer
    permission_classes = [permissions.AllowAny]


@extend_schema(tags=['Doctors'])
class DoctorProfileSetupView(generics.GenericAPIView):
    """
    POST: A logged-in DOCTOR user creates or updates their own Doctor profile.
    GET: Returns the current user's Doctor profile.
    """
    serializer_class = DoctorProfileSetupSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        if request.user.role != 'DOCTOR':
            return Response({'detail': 'Only Doctor accounts can access this endpoint.'}, status=status.HTTP_403_FORBIDDEN)

        if not hasattr(request.user, 'doctor_profile') or request.user.doctor_profile is None:
            return Response({'detail': 'Doctor profile not set up yet. Please POST to this endpoint to create it.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(request.user.doctor_profile)
        return Response(serializer.data)

    def post(self, request, *args, **kwargs):
        if request.user.role != 'DOCTOR':
            return Response({'detail': 'Only Doctor accounts can set up a doctor profile.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated = serializer.validated_data
        specialization_ids = validated.pop('specialization_ids', None)

        doctor = setup_doctor_profile(
            user=request.user,
            specialization_ids=specialization_ids,
            **validated
        )
        output_serializer = DoctorProfileSetupSerializer(doctor)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)


@extend_schema(tags=['Doctors'])
class DoctorVerifyView(APIView):
    """
    PATCH /api/v1/doctors/<id>/verify/
    Admin approves (VERIFIED) or rejects (REJECTED) a doctor registration.
    """
    permission_classes = [IsAdmin]

    def patch(self, request, pk, *args, **kwargs):
        doctor = get_doctor_by_id(pk)
        if not doctor:
            return Response({'detail': 'Doctor not found.'}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('verification_status')
        if new_status not in [VerificationStatus.VERIFIED, VerificationStatus.REJECTED, VerificationStatus.PENDING]:
            return Response({'detail': 'Invalid verification_status.'}, status=status.HTTP_400_BAD_REQUEST)

        doctor.verification_status = new_status
        doctor.save()
        return Response(DoctorSerializer(doctor).data, status=status.HTTP_200_OK)


@extend_schema(tags=['Doctors'])
class DoctorClinicRequestCreateView(generics.GenericAPIView):
    """
    POST /api/v1/doctors/requests/
    ClinicAdmin invites a Doctor OR Doctor requests to join a Clinic.
    """
    serializer_class = DoctorClinicRequestCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        if user.role not in ['CLINIC_ADMIN', 'DOCTOR', 'ADMIN']:
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        if user.role == 'CLINIC_ADMIN':
            owned_clinic = Clinic.objects.filter(owner=user).first()
            if not owned_clinic:
                return Response({'detail': 'You must register a clinic first.'}, status=status.HTTP_400_BAD_REQUEST)
            if owned_clinic.verification_status != VerificationStatus.VERIFIED:
                return Response({'detail': 'Your clinic has not been approved by Admin yet.'}, status=status.HTTP_403_FORBIDDEN)

            clinic = owned_clinic
            doctor = get_doctor_by_id(data.get('doctor_id'))
            if not doctor:
                return Response({'detail': 'Doctor not found.'}, status=status.HTTP_404_NOT_FOUND)
            if doctor.verification_status != VerificationStatus.VERIFIED:
                return Response({'detail': 'This doctor profile is not approved by Admin yet.'}, status=status.HTTP_400_BAD_REQUEST)

        elif user.role == 'DOCTOR':
            if not hasattr(user, 'doctor_profile') or not user.doctor_profile:
                return Response({'detail': 'Setup your doctor profile first.'}, status=status.HTTP_400_BAD_REQUEST)
            doctor = user.doctor_profile
            if doctor.verification_status != VerificationStatus.VERIFIED:
                return Response({'detail': 'Your doctor profile has not been approved by Admin yet.'}, status=status.HTTP_403_FORBIDDEN)

            clinic_id = data.get('clinic_id')
            clinic = Clinic.objects.filter(id=clinic_id).first()
            if not clinic:
                return Response({'detail': 'Clinic not found.'}, status=status.HTTP_404_NOT_FOUND)
            if clinic.verification_status != VerificationStatus.VERIFIED:
                return Response({'detail': 'This clinic is not approved by Admin yet.'}, status=status.HTTP_400_BAD_REQUEST)

        else: # ADMIN
            doctor = get_doctor_by_id(data.get('doctor_id'))
            clinic = Clinic.objects.filter(id=data.get('clinic_id')).first()
            if not doctor or not clinic:
                return Response({'detail': 'Doctor or Clinic not found.'}, status=status.HTTP_404_NOT_FOUND)

        mapping = request_doctor_clinic_service(
            doctor=doctor,
            clinic=clinic,
            requested_by_user=user,
            consultation_fee=data['consultation_fee'],
            department_id=str(data['department_id']) if data.get('department_id') else None,
            room_number=data.get('room_number', '')
        )
        return Response(DoctorClinicSerializer(mapping).data, status=status.HTTP_201_CREATED)


@extend_schema(tags=['Doctors'])
class DoctorClinicRequestListView(generics.ListAPIView):
    """
    GET /api/v1/doctors/requests/
    List requests for current user (Doctor or ClinicAdmin).
    """
    serializer_class = DoctorClinicSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'DOCTOR' and hasattr(user, 'doctor_profile') and user.doctor_profile:
            return DoctorClinic.objects.filter(doctor=user.doctor_profile).select_related('clinic', 'doctor', 'department')
        elif user.role == 'CLINIC_ADMIN':
            owned_clinic = Clinic.objects.filter(owner=user).first()
            if owned_clinic:
                return DoctorClinic.objects.filter(clinic=owned_clinic).select_related('clinic', 'doctor', 'department')
        elif user.role == 'ADMIN':
            return DoctorClinic.objects.all().select_related('clinic', 'doctor', 'department')
        return DoctorClinic.objects.none()


@extend_schema(tags=['Doctors'])
class DoctorClinicRequestRespondView(APIView):
    """
    PATCH /api/v1/doctors/requests/<id>/respond/
    Accept or Reject a Doctor-Clinic request.
    """
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk, *args, **kwargs):
        try:
            mapping = DoctorClinic.objects.select_related('clinic', 'doctor').get(id=pk)
        except DoctorClinic.DoesNotExist:
            return Response({'detail': 'Request not found.'}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        action = request.data.get('action')
        if action not in ['ACCEPT', 'REJECT']:
            return Response({'detail': 'Action must be ACCEPT or REJECT.'}, status=status.HTTP_400_BAD_REQUEST)

        # Authorization: Doctor accepts/rejects requests sent by ClinicAdmin
        # ClinicAdmin accepts/rejects requests sent by Doctor
        if user.role == 'DOCTOR':
            if not (hasattr(user, 'doctor_profile') and user.doctor_profile == mapping.doctor):
                return Response({'detail': 'You are not authorized for this request.'}, status=status.HTTP_403_FORBIDDEN)
        elif user.role == 'CLINIC_ADMIN':
            if mapping.clinic.owner != user:
                return Response({'detail': 'You do not own this clinic.'}, status=status.HTTP_403_FORBIDDEN)
        elif user.role != 'ADMIN':
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        if action == 'ACCEPT':
            mapping.status = DoctorClinicStatus.ACCEPTED
        else:
            mapping.status = DoctorClinicStatus.REJECTED

        mapping.save()
        return Response(DoctorClinicSerializer(mapping).data, status=status.HTTP_200_OK)


@extend_schema(tags=['Doctors'])
class DoctorAssignClinicView(generics.GenericAPIView):
    """
    Legacy / Direct Assign for Admin.
    """
    serializer_class = DoctorClinicAssignmentSerializer
    permission_classes = [IsAdmin]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        doctor = get_doctor_by_id(data.get('doctor_id'))
        clinic_id = data.get('clinic_id')
        if not doctor:
            return Response({'detail': 'Doctor not found.'}, status=status.HTTP_404_NOT_FOUND)

        mapping = assign_doctor_to_clinic(
            doctor=doctor,
            clinic_id=clinic_id,
            consultation_fee=data['consultation_fee'],
            department_id=str(data['department_id']) if data.get('department_id') else None,
            room_number=data.get('room_number', ''),
            joining_date=data.get('joining_date'),
            initial_status=DoctorClinicStatus.ACCEPTED
        )
        return Response(DoctorClinicSerializer(mapping).data, status=status.HTTP_200_OK)


@extend_schema(tags=['Doctors'])
class DoctorAssignClinicByPkView(generics.GenericAPIView):
    serializer_class = DoctorClinicAssignmentSerializer
    permission_classes = [IsAdmin]

    def post(self, request, pk, *args, **kwargs):
        doctor = get_doctor_by_id(pk)
        if not doctor:
            return Response({'detail': 'Doctor not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        clinic_id_param = request.data.get('clinic_id')
        mapping = assign_doctor_to_clinic(
            doctor=doctor,
            clinic_id=str(clinic_id_param),
            consultation_fee=data['consultation_fee'],
            department_id=str(data['department_id']) if data.get('department_id') else None,
            room_number=data.get('room_number', ''),
            joining_date=data.get('joining_date'),
            initial_status=DoctorClinicStatus.ACCEPTED
        )
        return Response(DoctorClinicSerializer(mapping).data, status=status.HTTP_200_OK)
