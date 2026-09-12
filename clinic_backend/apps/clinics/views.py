import math
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema
from apps.accounts.permissions import IsAdmin, IsClinicAdminOrAdmin
from .models import Department, Clinic, VerificationStatus, ClinicService
from .serializers import (
    DepartmentSerializer,
    ClinicSerializer,
    ClinicCreateUpdateSerializer,
    ClinicDepartmentSerializer,
    ClinicServiceSerializer,
)
from .selectors import list_departments, list_clinics, get_clinic_by_id
from .services import create_department, create_clinic, add_department_to_clinic


def haversine_distance(lat1, lon1, lat2, lon2) -> float:
    """Return the great-circle distance in km between two lat/lon points."""
    R = 6371  # Earth radius in km
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


@extend_schema(tags=['Departments'])
class DepartmentListCreateView(generics.ListCreateAPIView):
    serializer_class = DepartmentSerializer

    def get_queryset(self):
        return list_departments()

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdmin()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        dept = create_department(**serializer.validated_data)
        serializer.instance = dept


@extend_schema(tags=['Clinics'])
class ClinicListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.AllowAny]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ClinicCreateUpdateSerializer
        return ClinicSerializer

    def get_queryset(self):
        city = self.request.query_params.get('city')
        department_id = self.request.query_params.get('department_id')
        verification_status = self.request.query_params.get('verification_status')
        user = self.request.user

        # STRICT: Only system ADMIN can see all unverified clinics!
        # ClinicAdmin can see verified clinics PLUS their own clinic.
        # Patients, doctors, and public ONLY see verified clinics!
        only_verified = True
        if user and user.is_authenticated and user.role == 'ADMIN':
            only_verified = False

        if user and user.is_authenticated and user.role == 'CLINIC_ADMIN':
            from django.db.models import Q
            qs = Clinic.objects.filter(is_active=True).filter(
                Q(verification_status=VerificationStatus.VERIFIED) | Q(owner=user)
            ).select_related('owner').prefetch_related('departments')
            if city:
                qs = qs.filter(city__iexact=city)
            if department_id:
                qs = qs.filter(departments__id=department_id)
            return qs

        qs = list_clinics(city=city, department_id=department_id, only_verified=only_verified)

        if user and user.is_authenticated and user.role == 'ADMIN' and verification_status:
            qs = qs.filter(verification_status=verification_status)

        return qs

    def create(self, request, *args, **kwargs):
        if not (request.user and request.user.is_authenticated and request.user.role in ['CLINIC_ADMIN', 'ADMIN']):
            return Response({'detail': 'Only ClinicAdmin or Admin can create a clinic.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        clinic = create_clinic(owner=request.user, **serializer.validated_data)
        output_serializer = ClinicSerializer(clinic)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)


@extend_schema(tags=['Clinics'])
class ClinicDetailView(generics.RetrieveUpdateAPIView):
    queryset = Clinic.objects.all()
    serializer_class = ClinicSerializer

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH']:
            return [IsClinicAdminOrAdmin()]
        return [permissions.AllowAny()]

    def update(self, request, *args, **kwargs):
        clinic = self.get_object()
        if request.user.role == 'CLINIC_ADMIN' and clinic.owner != request.user:
            return Response({'detail': 'You do not own this clinic.'}, status=status.HTTP_403_FORBIDDEN)

        # If clinic was REJECTED and owner updates it, reset to PENDING for admin review
        if request.user.role == 'CLINIC_ADMIN' and clinic.verification_status == VerificationStatus.REJECTED:
            clinic.verification_status = VerificationStatus.PENDING
            clinic.save(update_fields=['verification_status', 'updated_at'])

        return super().update(request, *args, **kwargs)


@extend_schema(tags=['Clinics'])
class MyClinicView(APIView):
    """
    GET /api/v1/clinics/my-clinic/
    Returns the owned clinic for the authenticated Clinic Admin.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'CLINIC_ADMIN':
            return Response({'detail': 'Only Clinic Admin can access this endpoint.'}, status=status.HTTP_403_FORBIDDEN)

        clinic = Clinic.objects.filter(owner=request.user).first()
        if not clinic:
            return Response(None, status=status.HTTP_200_OK)

        return Response(ClinicSerializer(clinic).data, status=status.HTTP_200_OK)


@extend_schema(tags=['Clinics'])
class ClinicAddDepartmentView(generics.GenericAPIView):
    serializer_class = ClinicDepartmentSerializer
    permission_classes = [IsClinicAdminOrAdmin]

    def post(self, request, pk, *args, **kwargs):
        clinic = get_clinic_by_id(pk)
        if not clinic:
            return Response({'detail': 'Clinic not found.'}, status=status.HTTP_404_NOT_FOUND)

        if request.user.role == 'CLINIC_ADMIN' and clinic.owner != request.user:
            return Response({'detail': 'You do not own this clinic.'}, status=status.HTTP_403_FORBIDDEN)

        if request.user.role == 'CLINIC_ADMIN' and clinic.verification_status != VerificationStatus.VERIFIED:
            return Response({'detail': 'Your clinic has not been approved by Admin yet.'}, status=status.HTTP_403_FORBIDDEN)

        department_id = request.data.get('department_id')
        if not department_id:
            return Response({'detail': 'department_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        clinic_dept = add_department_to_clinic(clinic=clinic, department_id=department_id)
        serializer = ClinicDepartmentSerializer(clinic_dept)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@extend_schema(tags=['Clinics'])
class ClinicVerifyView(APIView):
    """
    PATCH /api/v1/clinics/<id>/verify/
    Admin approves (VERIFIED) or rejects (REJECTED) a clinic registration.
    """
    permission_classes = [IsAdmin]

    def patch(self, request, pk, *args, **kwargs):
        clinic = get_clinic_by_id(pk)
        if not clinic:
            return Response({'detail': 'Clinic not found.'}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('verification_status')
        if new_status not in [VerificationStatus.VERIFIED, VerificationStatus.REJECTED, VerificationStatus.PENDING]:
            return Response({'detail': 'Invalid verification_status.'}, status=status.HTTP_400_BAD_REQUEST)

        clinic.verification_status = new_status
        clinic.save()

        if new_status == VerificationStatus.VERIFIED:
            try:
                from apps.notifications.models import Notification, NotificationType
                from apps.notifications.email_service import send_approval_email

                if clinic.owner:
                    Notification.objects.create(
                        recipient=clinic.owner,
                        title="Congratulations! Your Clinic Has Been Approved 🎉",
                        message=f"Your clinic '{clinic.name}' ({clinic.city}) has been approved by the Administration! You can now link departments, approve doctor affiliations, and receive appointments.",
                        notification_type=NotificationType.CLINIC_APPROVED
                    )

                    send_approval_email(
                        recipient_email=clinic.owner.email or clinic.email,
                        recipient_name=f"{clinic.owner.first_name} {clinic.owner.last_name}".strip() or clinic.name,
                        subject=f"🎉 Congratulations! {clinic.name} is Approved - Smart Clinic",
                        message=(
                            f"Dear {clinic.owner.first_name or 'Clinic Administrator'},\n\n"
                            f"We are delighted to inform you that your clinic registration for '{clinic.name}' ({clinic.city}) "
                            f"has been reviewed and officially APPROVED by the Smart Clinic Administration.\n\n"
                            f"Your clinic is now visible to patients in the Clinics Directory. You can now:\n"
                            f"• Configure medical departments\n"
                            f"• Link verified doctors to your clinic\n"
                            f"• Manage patient appointment queues and chamber schedules\n\n"
                            f"Log in to your Clinic Admin Dashboard to get started.\n\n"
                            f"Warm regards,\n"
                            f"The Smart Clinic Team"
                        )
                    )
            except Exception:
                pass
        elif new_status == VerificationStatus.REJECTED:
            try:
                from apps.notifications.models import Notification, NotificationType
                if clinic.owner:
                    rejection_reason = request.data.get('reason', 'Certificate or details require updates.')
                    Notification.objects.create(
                        recipient=clinic.owner,
                        title="Clinic Registration Needs Attention",
                        message=f"Your clinic registration for '{clinic.name}' requires updates. Note: {rejection_reason}. Please update your clinic registration details.",
                        notification_type=NotificationType.SYSTEM
                    )
            except Exception:
                pass

        return Response(ClinicSerializer(clinic).data, status=status.HTTP_200_OK)


@extend_schema(tags=['Clinics'])
class NearbyClinicListView(APIView):
    """
    GET /api/v1/clinics/nearby/?lat=<latitude>&lng=<longitude>&radius=<km>
    Returns VERIFIED clinics within the given radius sorted by distance (default 50km).
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        try:
            user_lat = float(request.query_params.get('lat', ''))
            user_lng = float(request.query_params.get('lng', ''))
        except (TypeError, ValueError):
            return Response(
                {'detail': 'lat and lng query parameters are required and must be valid numbers.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        radius_km = float(request.query_params.get('radius', 50))

        # Filter only clinics that are VERIFIED and have coordinates set
        clinics = Clinic.objects.filter(
            is_active=True,
            verification_status=VerificationStatus.VERIFIED,
            latitude__isnull=False,
            longitude__isnull=False
        ).prefetch_related('departments')

        results = []
        for clinic in clinics:
            distance = haversine_distance(
                user_lat, user_lng,
                float(clinic.latitude), float(clinic.longitude)
            )
            if distance <= radius_km:
                data = ClinicSerializer(clinic).data
                data['distance_km'] = round(distance, 2)
                results.append(data)

        # Sort by closest first
        results.sort(key=lambda c: c['distance_km'])

        return Response(results)


@extend_schema(tags=['Clinic Services'])
class ClinicServiceListCreateView(APIView):
    """
    GET  /api/v1/clinics/<clinic_id>/services/ -> List services
    POST /api/v1/clinics/<clinic_id>/services/ -> Create service (ClinicAdmin / Admin)
    """
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsClinicAdminOrAdmin()]
        return [permissions.AllowAny()]

    def get(self, request, clinic_id):
        clinic = get_clinic_by_id(clinic_id)
        if not clinic:
            return Response({'detail': 'Clinic not found.'}, status=status.HTTP_404_NOT_FOUND)

        # ClinicAdmin/Admin see all; patients/public see only available
        user = request.user
        if user and user.is_authenticated and (user == clinic.owner or user.role == 'ADMIN' or user.is_superuser):
            services = clinic.services.all()
        else:
            services = clinic.services.filter(is_available=True)

        serializer = ClinicServiceSerializer(services, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, clinic_id):
        clinic = get_clinic_by_id(clinic_id)
        if not clinic:
            return Response({'detail': 'Clinic not found.'}, status=status.HTTP_404_NOT_FOUND)

        if request.user.role == 'CLINIC_ADMIN' and clinic.owner != request.user:
            return Response({'detail': 'You do not own this clinic.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = ClinicServiceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = serializer.save(clinic=clinic)
        return Response(ClinicServiceSerializer(service).data, status=status.HTTP_201_CREATED)


@extend_schema(tags=['Clinic Services'])
class ClinicServiceDetailView(APIView):
    """
    GET, PATCH, DELETE /api/v1/clinics/<clinic_id>/services/<pk>/
    """
    def get_permissions(self):
        if self.request.method in ['PATCH', 'PUT', 'DELETE']:
            return [IsClinicAdminOrAdmin()]
        return [permissions.AllowAny()]

    def get_object(self, clinic_id, pk):
        try:
            return ClinicService.objects.select_related('clinic', 'department').get(clinic_id=clinic_id, pk=pk)
        except ClinicService.DoesNotExist:
            return None

    def get(self, request, clinic_id, pk):
        service = self.get_object(clinic_id, pk)
        if not service:
            return Response({'detail': 'Service not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(ClinicServiceSerializer(service).data, status=status.HTTP_200_OK)

    def patch(self, request, clinic_id, pk):
        service = self.get_object(clinic_id, pk)
        if not service:
            return Response({'detail': 'Service not found.'}, status=status.HTTP_404_NOT_FOUND)

        if request.user.role == 'CLINIC_ADMIN' and service.clinic.owner != request.user:
            return Response({'detail': 'You do not own this clinic.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = ClinicServiceSerializer(service, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, clinic_id, pk):
        service = self.get_object(clinic_id, pk)
        if not service:
            return Response({'detail': 'Service not found.'}, status=status.HTTP_404_NOT_FOUND)

        if request.user.role == 'CLINIC_ADMIN' and service.clinic.owner != request.user:
            return Response({'detail': 'You do not own this clinic.'}, status=status.HTTP_403_FORBIDDEN)

        service.delete()
        return Response({'detail': 'Service deleted successfully.'}, status=status.HTTP_200_OK)
