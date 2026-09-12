from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema
from apps.accounts.permissions import IsAdmin, IsClinicAdminOrAdmin, IsDoctor
from apps.clinics.models import Clinic, VerificationStatus
from .models import Specialization, Doctor, DoctorClinic, DoctorClinicStatus, DoctorSchedule, DayOfWeek
from .serializers import (
    SpecializationSerializer,
    DoctorSerializer,
    DoctorClinicSerializer,
    DoctorClinicAssignmentSerializer,
    DoctorProfileSetupSerializer,
    DoctorClinicRequestCreateSerializer,
    DoctorClinicRequestResponseSerializer,
    DoctorScheduleSerializer,
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
    """Public read-only list of doctors. Strictly verified only, unless queried by system ADMIN."""
    serializer_class = DoctorSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        clinic_id = self.request.query_params.get('clinic_id')
        specialization_id = self.request.query_params.get('specialization_id')
        department_id = self.request.query_params.get('department_id')
        verification_status = self.request.query_params.get('verification_status')
        user = self.request.user

        # STRICT: Public, Patients, Doctors, and Clinic Admins ONLY see VERIFIED doctors!
        only_verified = True
        if user and user.is_authenticated and user.role == 'ADMIN':
            only_verified = False

        qs = list_doctors(
            clinic_id=clinic_id,
            specialization_id=specialization_id,
            department_id=department_id,
            only_verified=only_verified
        )

        if user and user.is_authenticated and user.role == 'ADMIN' and verification_status:
            qs = qs.filter(verification_status=verification_status)

        return qs


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
    permission_classes = [IsDoctor]

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

        if new_status == VerificationStatus.VERIFIED:
            try:
                from apps.notifications.models import Notification, NotificationType
                from apps.notifications.email_service import send_approval_email

                recipient_user = doctor.user
                if recipient_user:
                    Notification.objects.create(
                        recipient=recipient_user,
                        title="Congratulations! Your Doctor Profile Has Been Approved 🎉",
                        message=f"Dr. {doctor.full_name}, your medical credentials and profile have been verified and approved by the Administration! You can now accept clinic chamber invitations and receive patient appointments.",
                        notification_type=NotificationType.DOCTOR_APPROVED
                    )

                send_approval_email(
                    recipient_email=(recipient_user.email if recipient_user else '') or doctor.email,
                    recipient_name=f"Dr. {doctor.full_name}",
                    subject=f"🎉 Congratulations! Dr. {doctor.full_name}, Your Profile is Approved - Smart Clinic",
                    message=(
                        f"Dear Dr. {doctor.full_name},\n\n"
                        f"Congratulations! We are delighted to inform you that your doctor profile and medical credentials "
                        f"have been verified and officially APPROVED by the Smart Clinic Administration.\n\n"
                        f"Your profile is now visible in the Doctors Directory for patients across Bangladesh. You can now:\n"
                        f"• Join partnered clinics and define your consultation fees\n"
                        f"• Configure smart chamber schedules and patient slots\n"
                        f"• Manage your digital consultation chamber and issue DGDA-compliant E-Prescriptions\n\n"
                        f"Log in to your Doctor Dashboard to begin consultations.\n\n"
                        f"Warm regards,\n"
                        f"The Smart Clinic Team"
                    )
                )
            except Exception:
                pass

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
            if mapping.clinic.verification_status != VerificationStatus.VERIFIED:
                return Response({'detail': 'Your clinic has not been approved by Admin yet.'}, status=status.HTTP_403_FORBIDDEN)
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


from datetime import date
from .models import ChamberSession, ChamberSessionStatus
from .serializers import ChamberSessionSerializer, ChamberSessionUpdateSerializer

@extend_schema(tags=['Chamber Sessions'])
class ChamberSessionView(APIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get(self, request, *args, **kwargs):
        doctor_id = request.query_params.get('doctor_id')
        clinic_id = request.query_params.get('clinic_id')
        session_date_str = request.query_params.get('date') or str(date.today())

        if not doctor_id or not clinic_id:
            return Response({'detail': 'doctor_id and clinic_id query parameters are required.'}, status=status.HTTP_400_BAD_REQUEST)

        session, created = ChamberSession.objects.get_or_create(
            doctor_id=doctor_id,
            clinic_id=clinic_id,
            session_date=session_date_str,
            defaults={'status': ChamberSessionStatus.NOT_STARTED, 'current_serial': 0}
        )
        return Response(ChamberSessionSerializer(session).data, status=status.HTTP_200_OK)

    def post(self, request, *args, **kwargs):
        serializer = ChamberSessionUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        user = request.user
        if user and user.is_authenticated and user.role == 'CLINIC_ADMIN':
            clinic = Clinic.objects.filter(id=data['clinic_id'], owner=user).first()
            if not clinic:
                return Response({'detail': 'You do not own this clinic.'}, status=status.HTTP_403_FORBIDDEN)
            if clinic.verification_status != VerificationStatus.VERIFIED:
                return Response({'detail': 'Your clinic has not been approved by Admin yet.'}, status=status.HTTP_403_FORBIDDEN)

        session_date = data.get('session_date') or date.today()
        session, created = ChamberSession.objects.get_or_create(
            doctor_id=data['doctor_id'],
            clinic_id=data['clinic_id'],
            session_date=session_date,
            defaults={'status': ChamberSessionStatus.NOT_STARTED, 'current_serial': 0}
        )

        from django.utils import timezone
        action = data.get('action')

        if action == 'NEXT_SERIAL':
            session.current_serial += 1
            if session.status in [ChamberSessionStatus.NOT_STARTED, ChamberSessionStatus.PAUSED, ChamberSessionStatus.PRAYER_BREAK]:
                session.status = ChamberSessionStatus.IN_CHAMBER
            if not session.started_at:
                session.started_at = timezone.now()

        elif action == 'PREV_SERIAL':
            if session.current_serial > 0:
                session.current_serial -= 1

        elif action == 'SET_SERIAL':
            if 'current_serial' in data:
                session.current_serial = data['current_serial']

        elif action == 'SKIP_SERIAL':
            # Add current serial to skipped list and call next
            skipped = list(session.skipped_serials or [])
            if session.current_serial > 0 and session.current_serial not in skipped:
                skipped.append(session.current_serial)
            session.skipped_serials = skipped
            session.current_serial += 1

        elif action == 'RECALL_SERIAL':
            target = data.get('current_serial')
            if target is not None:
                session.current_serial = target
                skipped = [s for s in (session.skipped_serials or []) if s != target]
                session.skipped_serials = skipped

        elif action == 'RESET':
            session.current_serial = 0
            session.status = ChamberSessionStatus.NOT_STARTED
            session.skipped_serials = []
            session.delay_minutes = 0
            session.announcement_note = ''

        # Apply specific fields
        if 'status' in data and data['status']:
            session.status = data['status']
            if session.status == ChamberSessionStatus.IN_CHAMBER and not session.started_at:
                session.started_at = timezone.now()
            elif session.status == ChamberSessionStatus.ENDED:
                session.ended_at = timezone.now()

        if 'delay_minutes' in data:
            session.delay_minutes = data['delay_minutes']

        if 'announcement_note' in data:
            session.announcement_note = data['announcement_note']

        if 'room_number' in data and data['room_number']:
            session.room_number = data['room_number']

        if 'estimated_mins_per_patient' in data:
            session.estimated_mins_per_patient = data['estimated_mins_per_patient']

        session.save()

        # Proximity Alert Trigger: When serial advances or is set, alert patients who are 3 serials ahead
        if action in ['NEXT_SERIAL', 'SET_SERIAL', 'SKIP_SERIAL'] and session.current_serial > 0:
            try:
                from apps.appointments.models import Appointment, AppointmentStatus
                from apps.notifications.sms_service import send_sms_notification
                from apps.notifications.models import NotificationType

                target_proximity_serial = session.current_serial + 3
                upcoming_apts = Appointment.objects.filter(
                    doctor_id=session.doctor_id,
                    clinic_id=session.clinic_id,
                    appointment_date=session.session_date,
                    serial_number=target_proximity_serial,
                    status__in=[AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING]
                ).select_related('patient', 'family_member', 'doctor', 'clinic')

                for apt in upcoming_apts:
                    patient_name = apt.family_member.full_name if apt.family_member else f"{apt.patient.first_name} {apt.patient.last_name}".strip()
                    send_sms_notification(
                        recipient=apt.patient,
                        title="Your Serial is Approaching ⏳",
                        message=(
                            f"Dear {patient_name}, Serial #{session.current_serial} is now in chamber with Dr. {apt.doctor.full_name}. "
                            f"Your Serial is #{apt.serial_number} (3 patients away). "
                            f"Please be near {session.room_number or 'the chamber door'}."
                        ),
                        notification_type=NotificationType.SERIAL_PROXIMITY_ALERT
                    )
            except Exception:
                pass  # Non-blocking notification dispatch

        return Response(ChamberSessionSerializer(session).data, status=status.HTTP_200_OK)




@extend_schema(tags=['Doctors'])
class DoctorScheduleView(APIView):
    """
    GET  /api/v1/doctors/schedule/?doctor_id=X&clinic_id=Y  -> List schedules
    POST /api/v1/doctors/schedule/                           -> Create/Update schedule entry
    DELETE /api/v1/doctors/schedule/<id>/                   -> Remove a schedule entry
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        doctor_id = request.query_params.get('doctor_id')
        clinic_id = request.query_params.get('clinic_id')
        qs = DoctorSchedule.objects.filter(is_active=True)
        if doctor_id:
            qs = qs.filter(doctor_id=doctor_id)
        if clinic_id:
            qs = qs.filter(clinic_id=clinic_id)

        # Doctor can also fetch own schedule
        if not doctor_id and hasattr(request.user, 'doctor_profile') and request.user.doctor_profile:
            qs = qs.filter(doctor=request.user.doctor_profile)

        return Response(DoctorScheduleSerializer(qs, many=True).data, status=status.HTTP_200_OK)

    def post(self, request, *args, **kwargs):
        # Upsert: create or update schedule for doctor/clinic/day_of_week
        serializer = DoctorScheduleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        schedule, created = DoctorSchedule.objects.update_or_create(
            doctor=data['doctor'],
            clinic=data['clinic'],
            day_of_week=data['day_of_week'],
            defaults={
                'start_time': data['start_time'],
                'end_time': data['end_time'],
                'slot_duration_minutes': data.get('slot_duration_minutes', 15),
                'max_patients': data.get('max_patients', 20),
                'is_active': data.get('is_active', True),
            }
        )
        return Response(
            DoctorScheduleSerializer(schedule).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )

    def delete(self, request, pk=None, *args, **kwargs):
        try:
            schedule = DoctorSchedule.objects.get(pk=pk)
            schedule.is_active = False
            schedule.save(update_fields=['is_active', 'updated_at'])
            return Response({'detail': 'Schedule entry deactivated.'}, status=status.HTTP_200_OK)
        except DoctorSchedule.DoesNotExist:
            return Response({'detail': 'Schedule not found.'}, status=status.HTTP_404_NOT_FOUND)


@extend_schema(tags=['Doctors'])
class DoctorAvailabilityView(APIView):
    """
    GET /api/v1/doctors/availability/?doctor_id=X&clinic_id=Y&date=YYYY-MM-DD
    Returns available time slots for a doctor at a clinic on a given date.
    Also returns available_days (weekday numbers) and the schedule for the date.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        from datetime import datetime, timedelta
        from apps.appointments.models import Appointment, AppointmentStatus

        doctor_id = request.query_params.get('doctor_id')
        clinic_id = request.query_params.get('clinic_id')
        date_str = request.query_params.get('date')

        if not (doctor_id and clinic_id):
            return Response({'detail': 'doctor_id and clinic_id are required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Return list of active scheduled days (as weekday numbers) for calendar highlighting
        schedules = DoctorSchedule.objects.filter(
            doctor_id=doctor_id, clinic_id=clinic_id, is_active=True
        )
        available_days = list(schedules.values_list('day_of_week', flat=True))

        if not date_str:
            return Response({
                'available_days': available_days,
                'slots': [],
                'schedule': None
            })

        target_date = datetime.strptime(date_str, '%Y-%m-%d').date()

        # Python weekday(): Mon=0, Sun=6. Our DayOfWeek: Mon=0, Sun=6 — same mapping.
        day_num = target_date.weekday()
        # Adjust: Python Mon=0..Sun=6, our DayOfWeek Mon=0..Sun=6 matches
        try:
            schedule = schedules.get(day_of_week=day_num)
        except DoctorSchedule.DoesNotExist:
            return Response({
                'available_days': available_days,
                'slots': [],
                'schedule': None,
                'message': 'Doctor has no schedule for this day.'
            })

        # Generate all time slots from schedule
        slot_minutes = schedule.slot_duration_minutes or 15
        slots = []
        current = datetime.combine(target_date, schedule.start_time)
        end = datetime.combine(target_date, schedule.end_time)
        while current < end:
            slots.append(current.strftime('%H:%M'))
            current += timedelta(minutes=slot_minutes)

        # Get already-booked times for this doctor/clinic/date
        booked_times = set(
            Appointment.objects.filter(
                doctor_id=doctor_id,
                clinic_id=clinic_id,
                appointment_date=target_date,
                status__in=[AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED]
            ).values_list('appointment_time', flat=True)
        )
        booked_time_strs = {t.strftime('%H:%M') if hasattr(t, 'strftime') else str(t)[:5] for t in booked_times}

        slot_data = [
            {'time': slot, 'available': slot not in booked_time_strs}
            for slot in slots
        ]

        return Response({
            'available_days': available_days,
            'schedule': DoctorScheduleSerializer(schedule).data,
            'slots': slot_data,
            'total_slots': len(slots),
            'booked_count': len(booked_time_strs),
            'available_count': sum(1 for s in slot_data if s['available'])
        })
