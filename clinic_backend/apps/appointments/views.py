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
        user = request.user
        if user.role not in ['PATIENT', 'CLINIC_ADMIN', 'ADMIN']:
            return Response({'detail': 'You do not have permission to book appointments.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        target_patient = user
        is_walk_in = data.get('is_walk_in', False)

        # Handle CLINIC_ADMIN walk-in counter patient booking
        if user.role in ['CLINIC_ADMIN', 'ADMIN'] and is_walk_in:
            from apps.accounts.models import User, UserRole
            walk_in_phone = data.get('walk_in_phone', '').strip()
            walk_in_name = data.get('walk_in_name', '').strip() or 'Walk-in Patient'

            # Try to match patient by phone, or create lightweight patient record
            patient_obj = None
            if walk_in_phone:
                patient_obj = User.objects.filter(phone=walk_in_phone, role=UserRole.PATIENT).first()
            
            if not patient_obj:
                import uuid
                name_parts = walk_in_name.split(' ', 1)
                first_name = name_parts[0]
                last_name = name_parts[1] if len(name_parts) > 1 else ''
                synthetic_email = f"walkin.{walk_in_phone or uuid.uuid4().hex[:8]}@smartclinic.local"
                patient_obj = User.objects.create_user(
                    email=synthetic_email,
                    first_name=first_name,
                    last_name=last_name,
                    phone=walk_in_phone or '01700000000',
                    role=UserRole.PATIENT
                )
            target_patient = patient_obj

        initial_status = 'CONFIRMED' if (user.role in ['CLINIC_ADMIN', 'ADMIN'] and is_walk_in) else 'PENDING'

        appointment = book_appointment(
            patient=target_patient,
            clinic_id=str(data['clinic_id']),
            doctor_id=str(data['doctor_id']),
            appointment_date=data['appointment_date'],
            appointment_time=data['appointment_time'],
            problem_description=data.get('problem_description', ''),
            family_member_id=str(data['family_member_id']) if data.get('family_member_id') else None,
            initial_status=initial_status,
            is_walk_in=is_walk_in
        )
        output_serializer = AppointmentSerializer(appointment)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

@extend_schema(tags=['Appointments'])
class AppointmentCheckInView(generics.GenericAPIView):
    """
    1-Click Counter Cash Payment & Check-In by Clinic Receptionist.
    Marks appointment as CONFIRMED and logs a CASH payment.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AppointmentSerializer

    def post(self, request, pk, *args, **kwargs):
        try:
            appointment = Appointment.objects.select_related('clinic', 'doctor', 'patient').get(pk=pk)
        except Appointment.DoesNotExist:
            return Response({'detail': 'Appointment not found.'}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        if user.role == 'CLINIC_ADMIN' and appointment.clinic.owner != user:
            return Response({'detail': 'You do not own the clinic for this appointment.'}, status=status.HTTP_403_FORBIDDEN)
        elif user.role not in ['CLINIC_ADMIN', 'ADMIN']:
            return Response({'detail': 'Only clinic receptionist/admin can mark cash check-in.'}, status=status.HTTP_403_FORBIDDEN)

        from .models import AppointmentStatus
        from apps.payments.models import Payment, PaymentMethod, PaymentStatus

        appointment.status = AppointmentStatus.CONFIRMED
        appointment.save(update_fields=['status', 'updated_at'])

        # Record or update payment record
        Payment.objects.update_or_create(
            appointment=appointment,
            defaults={
                'amount': appointment.amount,
                'currency': 'BDT',
                'payment_method': PaymentMethod.CASH,
                'status': PaymentStatus.COMPLETED,
                'transaction_id': f"CASH_CHECKIN_{appointment.id.hex[:8]}"
            }
        )

        return Response(AppointmentSerializer(appointment).data, status=status.HTTP_200_OK)


@extend_schema(tags=['Appointments'])
class AppointmentDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AppointmentSerializer

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

@extend_schema(tags=['Appointments'])
class AppointmentCancelView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AppointmentSerializer

    def post(self, request, pk, *args, **kwargs):
        try:
            appointment = Appointment.objects.get(pk=pk)
        except Appointment.DoesNotExist:
            return Response({'detail': 'Appointment not found.'}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        if user.role == 'PATIENT' and appointment.patient != user:
            return Response({'detail': 'You can only cancel your own appointments.'}, status=status.HTTP_403_FORBIDDEN)
        elif user.role == 'DOCTOR':
            assigned_doctor = appointment.doctor
            is_assigned = (
                (hasattr(user, 'doctor_profile') and user.doctor_profile == assigned_doctor)
                or (assigned_doctor.email and assigned_doctor.email == user.email)
            )
            if not is_assigned:
                return Response({'detail': 'You are not assigned to this appointment.'}, status=status.HTTP_403_FORBIDDEN)
        elif user.role == 'CLINIC_ADMIN' and appointment.clinic.owner != user:
            return Response({'detail': 'You do not own the clinic for this appointment.'}, status=status.HTTP_403_FORBIDDEN)

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
