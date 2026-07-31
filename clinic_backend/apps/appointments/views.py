from rest_framework import generics, permissions, status
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from .models import Appointment
from .serializers import AppointmentSerializer, AppointmentCreateSerializer
from .services import book_appointment, cancel_appointment, complete_appointment

@extend_schema(tags=['Appointments'])
class AppointmentListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AppointmentCreateSerializer
        return AppointmentSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Appointment.objects.select_related('patient', 'clinic', 'doctor', 'department').all()
        if user.role == 'PATIENT':
            return queryset.filter(patient=user)
        elif user.role == 'DOCTOR':
            return queryset.filter(doctor__email=user.email)
        elif user.role == 'CLINIC_ADMIN':
            return queryset.filter(clinic__owner=user)
        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        appointment = book_appointment(
            patient=request.user,
            clinic_id=str(serializer.validated_data['clinic_id']),
            doctor_id=str(serializer.validated_data['doctor_id']),
            appointment_date=serializer.validated_data['appointment_date'],
            appointment_time=serializer.validated_data['appointment_time'],
            problem_description=serializer.validated_data.get('problem_description', '')
        )
        output_serializer = AppointmentSerializer(appointment)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

@extend_schema(tags=['Appointments'])
class AppointmentDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AppointmentSerializer
    queryset = Appointment.objects.select_related('patient', 'clinic', 'doctor', 'department').all()

@extend_schema(tags=['Appointments'])
class AppointmentCancelView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AppointmentSerializer

    def post(self, request, pk, *args, **kwargs):
        try:
            appointment = Appointment.objects.get(pk=pk)
        except Appointment.DoesNotExist:
            return Response({'detail': 'Appointment not found.'}, status=status.HTTP_404_NOT_FOUND)

        appointment = cancel_appointment(appointment=appointment, cancelled_by_user=request.user)
        return Response(AppointmentSerializer(appointment).data, status=status.HTTP_200_OK)

@extend_schema(tags=['Appointments'])
class AppointmentCompleteView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AppointmentSerializer

    def post(self, request, pk, *args, **kwargs):
        try:
            appointment = Appointment.objects.get(pk=pk)
        except Appointment.DoesNotExist:
            return Response({'detail': 'Appointment not found.'}, status=status.HTTP_404_NOT_FOUND)

        user = request.user

        # Role-based authorization:
        # - DOCTOR: must be the assigned doctor (matched via user-linked doctor profile email)
        # - CLINIC_ADMIN: must own the clinic for this appointment
        # - ADMIN: can complete any appointment
        if user.role == 'DOCTOR':
            # Check via linked doctor profile or email match
            assigned_doctor = appointment.doctor
            is_assigned = (
                (hasattr(user, 'doctor_profile') and user.doctor_profile == assigned_doctor)
                or (assigned_doctor.email and assigned_doctor.email == user.email)
            )
            if not is_assigned:
                return Response(
                    {'detail': 'You are not the assigned doctor for this appointment.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        elif user.role == 'CLINIC_ADMIN':
            if appointment.clinic.owner != user:
                return Response(
                    {'detail': 'You do not own the clinic for this appointment.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        elif user.role != 'ADMIN':
            return Response(
                {'detail': 'Only the assigned doctor, clinic admin, or system admin can complete an appointment.'},
                status=status.HTTP_403_FORBIDDEN
            )

        appointment = complete_appointment(appointment=appointment)
        return Response(AppointmentSerializer(appointment).data, status=status.HTTP_200_OK)
