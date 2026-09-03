from typing import List, Dict, Any
from django.db import transaction
from rest_framework.exceptions import ValidationError
from .models import Medication, Prescription, PrescribedMedication, MedicationForm
from apps.appointments.models import Appointment, AppointmentStatus

COMMON_BD_MEDICATIONS = [
    {"brand_name": "Napa", "generic_name": "Paracetamol", "form": MedicationForm.TABLET, "strength": "500mg", "manufacturer": "Square Pharmaceuticals"},
    {"brand_name": "Napa Extra", "generic_name": "Paracetamol + Caffeine", "form": MedicationForm.TABLET, "strength": "500mg+65mg", "manufacturer": "Square Pharmaceuticals"},
    {"brand_name": "Seclo", "generic_name": "Omeprazole", "form": MedicationForm.CAPSULE, "strength": "20mg", "manufacturer": "Square Pharmaceuticals"},
    {"brand_name": "Maxpro", "generic_name": "Esomeprazole", "form": MedicationForm.TABLET, "strength": "20mg", "manufacturer": "Renata Limited"},
    {"brand_name": "Sergel", "generic_name": "Esomeprazole", "form": MedicationForm.TABLET, "strength": "20mg", "manufacturer": "Incepta Pharmaceuticals"},
    {"brand_name": "Ace", "generic_name": "Paracetamol", "form": MedicationForm.TABLET, "strength": "500mg", "manufacturer": "Beximco Pharmaceuticals"},
    {"brand_name": "Cef-3", "generic_name": "Cefixime", "form": MedicationForm.CAPSULE, "strength": "200mg", "manufacturer": "Incepta Pharmaceuticals"},
    {"brand_name": "Azithrocin", "generic_name": "Azithromycin", "form": MedicationForm.TABLET, "strength": "500mg", "manufacturer": "Beximco Pharmaceuticals"},
    {"brand_name": "Monas 10", "generic_name": "Montelukast", "form": MedicationForm.TABLET, "strength": "10mg", "manufacturer": "The Acme Laboratories"},
    {"brand_name": "Fexo", "generic_name": "Fexofenadine", "form": MedicationForm.TABLET, "strength": "120mg", "manufacturer": "Square Pharmaceuticals"},
    {"brand_name": "Alastall", "generic_name": "Loratadine", "form": MedicationForm.TABLET, "strength": "10mg", "manufacturer": "Beximco Pharmaceuticals"},
    {"brand_name": "Tufnil", "generic_name": "Tolfenamic Acid", "form": MedicationForm.TABLET, "strength": "200mg", "manufacturer": "Eskayef Pharmaceuticals"},
]

def seed_dgda_medications_if_empty():
    if not Medication.objects.exists():
        for med in COMMON_BD_MEDICATIONS:
            Medication.objects.get_or_create(
                brand_name=med["brand_name"],
                strength=med["strength"],
                defaults=med
            )

def create_or_update_prescription(
    *,
    appointment: Appointment,
    doctor_user,
    diagnosis: str = "",
    vitals: Dict[str, Any] = None,
    diagnostic_tests: str = "",
    advice: str = "",
    medications_data: List[Dict[str, Any]] = None
) -> Prescription:
    """
    Creates or updates an E-Prescription for an appointment.
    """
    if vitals is None:
        vitals = {}
    if medications_data is None:
        medications_data = []

    # Check authorization: doctor_user must be the assigned doctor or clinic admin
    assigned_doctor = appointment.doctor
    is_assigned = (
        (hasattr(doctor_user, 'doctor_profile') and doctor_user.doctor_profile == assigned_doctor)
        or (assigned_doctor.email and assigned_doctor.email == doctor_user.email)
        or (doctor_user.role in ['CLINIC_ADMIN', 'ADMIN'])
    )

    if not is_assigned:
        raise ValidationError({"detail": "Only the assigned doctor or authorized admin can issue a prescription for this appointment."})

    with transaction.atomic():
        prescription, created = Prescription.objects.update_or_create(
            appointment=appointment,
            defaults={
                'doctor': assigned_doctor,
                'patient': appointment.patient,
                'family_member': appointment.family_member,
                'diagnosis': diagnosis,
                'vitals': vitals,
                'diagnostic_tests': diagnostic_tests,
                'advice': advice,
            }
        )

        # Clear existing prescribed medications and re-create
        prescription.medications.all().delete()
        for item in medications_data:
            PrescribedMedication.objects.create(
                prescription=prescription,
                medication_name=item.get('medication_name', ''),
                dosage=item.get('dosage', '1 + 0 + 1'),
                timing=item.get('timing', 'After Meal'),
                duration=item.get('duration', '7 Days'),
                instructions=item.get('instructions', '')
            )

        # If appointment is confirmed, mark as COMPLETED upon issuing Rx
        if appointment.status == AppointmentStatus.CONFIRMED:
            appointment.status = AppointmentStatus.COMPLETED
            appointment.save(update_fields=['status', 'updated_at'])

        # Dispatch SMS notification to patient that prescription is ready
        try:
            from apps.notifications.sms_service import send_sms_notification
            from apps.notifications.models import NotificationType
            patient = appointment.patient
            patient_name = appointment.family_member.full_name if appointment.family_member else f"{patient.first_name} {patient.last_name}".strip()
            meds_count = len(medications_data)
            send_sms_notification(
                recipient=patient,
                title="E-Prescription Ready 📋",
                message=(
                    f"Dear {patient_name}, Dr. {assigned_doctor.full_name} has issued your digital prescription "
                    f"({meds_count} medicine(s), Diagnosis: {diagnosis}). "
                    f"Log in to Smart Clinic to view & download your E-Rx (QR: {str(prescription.qr_token)[:8]}...)."
                ),
                notification_type=NotificationType.PRESCRIPTION_ISSUED
            )
        except Exception:
            pass  # Never let notification failure break core prescription flow

        return prescription
