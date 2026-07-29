from rest_framework import generics, permissions, status
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from apps.accounts.permissions import IsAdmin, IsClinicAdminOrAdmin
from .models import Department, Clinic
from .serializers import (
    DepartmentSerializer,
    ClinicSerializer,
    ClinicCreateUpdateSerializer,
    ClinicDepartmentSerializer,
)
from .selectors import list_departments, list_clinics, get_clinic_by_id
from .services import create_department, create_clinic, add_department_to_clinic

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
        return list_clinics(city=city, department_id=department_id)

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

@extend_schema(tags=['Clinics'])
class ClinicAddDepartmentView(generics.GenericAPIView):
    serializer_class = ClinicDepartmentSerializer
    permission_classes = [IsClinicAdminOrAdmin]

    def post(self, request, pk, *args, **kwargs):
        clinic = get_clinic_by_id(pk)
        if not clinic:
            return Response({'detail': 'Clinic not found.'}, status=status.HTTP_404_NOT_FOUND)

        department_id = request.data.get('department_id')
        if not department_id:
            return Response({'detail': 'department_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        clinic_dept = add_department_to_clinic(clinic=clinic, department_id=department_id)
        serializer = ClinicDepartmentSerializer(clinic_dept)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
