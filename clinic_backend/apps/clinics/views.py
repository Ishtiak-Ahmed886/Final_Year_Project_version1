import math
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema
from apps.accounts.permissions import IsAdmin, IsClinicAdminOrAdmin
from .models import Department, Clinic, VerificationStatus
from .serializers import (
    DepartmentSerializer,
    ClinicSerializer,
    ClinicCreateUpdateSerializer,
    ClinicDepartmentSerializer,
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
        user = self.request.user

        # Admin or ClinicAdmin can see unverified clinics (e.g. for approval or managing own clinic)
        only_verified = True
        if user and user.is_authenticated and user.role in ['ADMIN', 'CLINIC_ADMIN']:
            only_verified = False

        return list_clinics(city=city, department_id=department_id, only_verified=only_verified)

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
        return super().update(request, *args, **kwargs)


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
