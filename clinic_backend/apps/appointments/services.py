from datetime import date, time, datetime, timedelta
from typing import Optional
from django.db import transaction, IntegrityError
from django.db.models import Max, Q
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from .models import Appointment, AppointmentStatus
from apps.doctors.models import DoctorClinic, DoctorClinicStatus
from apps.clinics.models import Clinic, VerificationStatus
from apps.doctors.models import Doctor


ONLINE_HOLD_EXPIRY_MINUTES = 20
PATIENT_CANCEL_CUTOFF_HOURS = 2


def format_doctor_display_name(doctor) -> str:
    name = (getattr(doctor, 'full_name', '') or str(doctor)).strip()
    if name.lower().startswith('dr.') or name.lower().startswith('dr '):
        return name
    return f"Dr. {name}"


def release_expired_online_holds(
    *,
    doctor_id: Optional[str] = None,
    clinic_id: Optional[str] = None,
    appointment_date: Optional[date] = None
) -> int:
    """
    Lazy auto-expiration for abandoned online payment checkouts.
    Releases slots held by PENDING appointments where an online payment (non-CASH)
    was initiated more than ONLINE_HOLD_EXPIRY_MINUTES ago but never completed.
    """
    from apps.payments.models import PaymentMethod, PaymentStatus

    cutoff = timezone.now() - timedelta(minutes=ONLINE_HOLD_EXPIRY_MINUTES)
    qs = Appointment.objects.filter(
        status=AppointmentStatus.PENDING,
        created_at__lt=cutoff,
        payment__isnull=False,
        payment__payment_status__in=[PaymentStatus.PENDING, PaymentStatus.FAILED],
    ).exclude(
        payment__payment_method=PaymentMethod.CASH
    )
    if doctor_id:
        qs = qs.filter(doctor_id=doctor_id)
    if clinic_id:
        qs = qs.filter(clinic_id=clinic_id)
    if appointment_date:
        qs = qs.filter(appointment_date=appointment_date)

    return qs.update(status=AppointmentStatus.CANCELLED, updated_at=timezone.now())


def book_appointment(*, patient, clinic_id: str, doctor_id: str, appointment_date: date, appointment_time: time, problem_description: str = "", family_member_id: Optional[str] = None, initial_status: str = AppointmentStatus.PENDING, is_walk_in: bool = False) -> Appointment:
    """
    Atomic appointment booking with concurrency protection against double booking.
    Enforces that Clinic and Doctor are VERIFIED and their service agreement is ACCEPTED.
    Uses monotonic serial generation (Max + 1) to prevent duplicate serial collisions after cancellations.
    """
    try:
        doctor_clinic = DoctorClinic.objects.select_related('doctor', 'clinic', 'department').get(
            doctor_id=doctor_id,
            clinic_id=clinic_id,
            is_active=True
        )
    except DoctorClinic.DoesNotExist:
        raise ValidationError({"doctor_id": "Doctor does not practice at this clinic or mapping is inactive."})

    if doctor_clinic.clinic.verification_status != VerificationStatus.VERIFIED:
        raise ValidationError({"clinic_id": "This clinic is pending approval by platform Admin."})

    if doctor_clinic.doctor.verification_status != VerificationStatus.VERIFIED:
        raise ValidationError({"doctor_id": "This doctor profile is pending approval by platform Admin."})

    if doctor_clinic.status != DoctorClinicStatus.ACCEPTED:
        raise ValidationError({"doctor_id": "The service agreement between this doctor and clinic has not been accepted yet."})

    family_member = None
    if family_member_id:
        from apps.accounts.models import FamilyMember
        try:
            family_member = FamilyMember.objects.get(pk=family_member_id, patient=patient)
        except FamilyMember.DoesNotExist:
            raise ValidationError({"family_member_id": "Invalid family member selected."})

    amount = doctor_clinic.consultation_fee

    with transaction.atomic():
        # Auto-release any abandoned online payment holds before checking slot lock
        release_expired_online_holds(
            doctor_id=doctor_id,
            clinic_id=clinic_id,
            appointment_date=appointment_date
        )

        # Check if slot is already booked with a database lock
        existing = Appointment.objects.select_for_update().filter(
            doctor_id=doctor_id,
            clinic_id=clinic_id,
            appointment_date=appointment_date,
            appointment_time=appointment_time,
            status__in=[AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED]
        ).exists()

        if existing:
            raise ValidationError({"appointment_time": "This time slot is already booked. Please choose another slot."})

        # Active patient count for capacity enforcement (excludes CANCELLED)
        active_count = Appointment.objects.filter(
            doctor_id=doctor_id,
            clinic_id=clinic_id,
            appointment_date=appointment_date,
            status__in=[AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED]
        ).count()

        # Monotonic serial number (Max + 1 across all records for that day to prevent duplicate serials after cancellation)
        max_serial = Appointment.objects.filter(
            doctor_id=doctor_id,
            clinic_id=clinic_id,
            appointment_date=appointment_date
        ).aggregate(m=Max('serial_number'))['m'] or 0
        next_serial = max_serial + 1

        today = date.today()

        # 1. Past date check
        if appointment_date < today:
            raise ValidationError({"appointment_date": "Cannot book appointments for past dates."})

        # 2. Maximum advance booking window (30 days limit)
        if appointment_date > today + timedelta(days=30):
            raise ValidationError({"appointment_date": "Appointments can only be booked up to 30 days in advance."})

        doc_name = format_doctor_display_name(doctor_clinic.doctor)

        # 3. Doctor Leave check
        from apps.doctors.models import DoctorLeave
        on_leave = DoctorLeave.objects.filter(
            doctor_id=doctor_id,
            start_date__lte=appointment_date,
            end_date__gte=appointment_date,
            is_approved=True
        ).filter(Q(clinic_id=clinic_id) | Q(clinic__isnull=True)).exists()
        if on_leave:
            raise ValidationError({
                "appointment_date": f"{doc_name} is on scheduled leave on {appointment_date}."
            })

        # 4. Doctor Schedule verification
        from apps.doctors.models import DoctorSchedule
        day_num = appointment_date.weekday()

        has_clinic_schedules = DoctorSchedule.objects.filter(
            doctor_id=doctor_id,
            clinic_id=clinic_id,
            is_active=True
        ).exists()

        if has_clinic_schedules:
            schedule = DoctorSchedule.objects.filter(
                doctor_id=doctor_id,
                clinic_id=clinic_id,
                day_of_week=day_num,
                is_active=True
            ).first()

            if not schedule:
                raise ValidationError({
                    "appointment_date": f"{doc_name} does not practice at {doctor_clinic.clinic.name} on {appointment_date.strftime('%A')}s."
                })

            if not (schedule.start_time <= appointment_time < schedule.end_time):
                raise ValidationError({
                    "appointment_time": f"Doctor chamber hours on {appointment_date.strftime('%A')} are {schedule.start_time.strftime('%I:%M %p')} - {schedule.end_time.strftime('%I:%M %p')}."
                })
            if active_count >= schedule.max_patients:
                raise ValidationError({
                    "appointment_date": f"Maximum appointment capacity ({schedule.max_patients} patients) reached for this chamber session."
                })

        try:
            appointment = Appointment.objects.create(
                patient=patient,
                family_member=family_member,
                clinic_id=clinic_id,
                doctor_id=doctor_id,
                department=doctor_clinic.department,
                appointment_date=appointment_date,
                appointment_time=appointment_time,
                serial_number=next_serial,
                amount=amount,
                problem_description=problem_description,
                status=initial_status
            )

            # If walk-in or marked confirmed with cash, record payment entry
            if initial_status == AppointmentStatus.CONFIRMED:
                try:
                    from apps.payments.models import Payment, PaymentMethod, PaymentStatus
                    Payment.objects.create(
                        appointment=appointment,
                        amount=amount,
                        currency='BDT',
                        payment_method=PaymentMethod.CASH,
                        payment_status=PaymentStatus.COMPLETED,
                        transaction_id=f"CASH_COUNTER_{appointment.id.hex[:8]}"
                    )
                except Exception:
                    pass

            # Dispatch SMS & in-app booking confirmation notification
            try:
                from apps.notifications.sms_service import send_sms_notification
                from apps.notifications.models import NotificationType
                patient_name = family_member.full_name if family_member else f"{patient.first_name} {patient.last_name}".strip()
                status_text = "Confirmed (Cash Paid at Counter)" if initial_status == AppointmentStatus.CONFIRMED else "Booked"
                send_sms_notification(
                    recipient=patient,
                    title=f"Appointment {status_text} ✅",
                    message=(
                        f"Dear {patient_name}, your token with {doc_name} "
                        f"at {doctor_clinic.clinic.name} on {appointment_date} ({appointment_time.strftime('%I:%M %p') if hasattr(appointment_time, 'strftime') else appointment_time}) is {status_text}. "
                        f"Serial #: {next_serial}. Fee: ৳{amount} BDT."
                    ),
                    notification_type=NotificationType.APPOINTMENT_CONFIRMED if initial_status == AppointmentStatus.CONFIRMED else NotificationType.APPOINTMENT_BOOKED
                )
            except Exception:
                pass  # Never let notification failure break core booking flow

            return appointment
        except IntegrityError:
            raise ValidationError({"appointment_time": "Time slot conflict. Slot was booked concurrently."})


def cancel_appointment(*, appointment: Appointment, cancelled_by_user) -> Appointment:
    if appointment.status in [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED]:
        raise ValidationError({"status": f"Cannot cancel an appointment with status {appointment.status}."})

    # Enforce 2-hour cutoff & check-in guard when a PATIENT self-cancels a CONFIRMED appointment
    if cancelled_by_user and getattr(cancelled_by_user, 'role', None) == 'PATIENT':
        if appointment.is_arrived:
            raise ValidationError({
                "status": "Cannot cancel online after checking in at the clinic counter. Please contact reception."
            })
        if appointment.status == AppointmentStatus.CONFIRMED:
            naive_apt_dt = datetime.combine(appointment.appointment_date, appointment.appointment_time)
            apt_dt = timezone.make_aware(naive_apt_dt, timezone.get_current_timezone()) if timezone.is_naive(naive_apt_dt) else naive_apt_dt
            now_dt = timezone.now()
            if apt_dt - now_dt < timedelta(hours=PATIENT_CANCEL_CUTOFF_HOURS):
                raise ValidationError({
                    "status": (
                        f"Confirmed appointments cannot be cancelled online within {PATIENT_CANCEL_CUTOFF_HOURS} hours "
                        f"of the scheduled chamber time. Please contact {appointment.clinic.name} reception directly."
                    )
                })

    appointment.status = AppointmentStatus.CANCELLED
    appointment.save(update_fields=['status', 'updated_at'])

    # Notify patient of cancellation
    try:
        from apps.notifications.sms_service import send_sms_notification
        from apps.notifications.models import NotificationType
        doc_display = format_doctor_display_name(appointment.doctor)
        send_sms_notification(
            recipient=appointment.patient,
            title="Appointment Cancelled ❌",
            message=(
                f"Your appointment with {doc_display} at {appointment.clinic.name} "
                f"on {appointment.appointment_date} has been cancelled."
            ),
            notification_type=NotificationType.APPOINTMENT_CANCELLED
        )
    except Exception:
        pass

    return appointment


def complete_appointment(*, appointment: Appointment) -> Appointment:
    if appointment.status != AppointmentStatus.CONFIRMED:
        raise ValidationError({"status": "Only confirmed appointments can be marked as completed."})
    appointment.status = AppointmentStatus.COMPLETED
    if not appointment.is_arrived:
        appointment.is_arrived = True
        if not appointment.arrived_at:
            appointment.arrived_at = timezone.now()
    appointment.save(update_fields=['status', 'is_arrived', 'arrived_at', 'updated_at'])

    # Notify patient that consultation has completed
    try:
        from apps.notifications.sms_service import send_sms_notification
        from apps.notifications.models import NotificationType
        doc_display = format_doctor_display_name(appointment.doctor)
        send_sms_notification(
            recipient=appointment.patient,
            title="Consultation Completed ✅",
            message=(
                f"Your consultation with {doc_display} at {appointment.clinic.name} "
                f"is marked completed. You can view your digital prescription and leave a review in your portal."
            ),
            notification_type=NotificationType.SYSTEM
        )
    except Exception:
        pass

    return appointment


