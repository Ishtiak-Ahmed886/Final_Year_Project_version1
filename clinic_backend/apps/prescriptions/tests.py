from datetime import date, time
from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.accounts.models import UserRole
from apps.clinics.models import Clinic
from apps.doctors.models import Doctor, DoctorClinic
from apps.appointments.models import Appointment
from .models import Medication, Prescription, PrescribedMedication
from .services import seed_dgda_medications_if_empty, create_or_update_prescription

User = get_user_model()

class PrescriptionsTestCase(TestCase):
    def setUp(self):
        self.doctor_user = User.objects.create_user(
            email="doctor@test.com", password="Pass123!Doctor", first_name="Gregory", last_name="House", role=UserRole.DOCTOR
        )
        self.patient_user = User.objects.create_user(
            email="patient@test.com", password="Pass123!Patient", first_name="John", last_name="Doe", role=UserRole.PATIENT
        )
        self.clinic_admin = User.objects.create_user(
            email="admin@clinic.com", password="Pass123!Admin", first_name="Clinic", last_name="Admin", role=UserRole.CLINIC_ADMIN
        )
        self.clinic = Clinic.objects.create(
            owner=self.clinic_admin, name="Popular Diagnostic", slug="popular-diagnostic", city="Dhaka", verification_status="VERIFIED"
        )
        self.doctor = Doctor.objects.create(
            user=self.doctor_user, full_name="Gregory House", email="doctor@test.com", verification_status="VERIFIED"
        )
        self.doctor_clinic = DoctorClinic.objects.create(
            doctor=self.doctor, clinic=self.clinic, consultation_fee=1000, status="ACCEPTED", is_active=True
        )
        self.appointment = Appointment.objects.create(
            patient=self.patient_user,
            doctor=self.doctor,
            clinic=self.clinic,
            appointment_date=date.today(),
            appointment_time=time(10, 0),
            amount=1000
        )

    def test_dgda_medication_seeding(self):
        seed_dgda_medications_if_empty()
        self.assertTrue(Medication.objects.filter(brand_name="Napa").exists())

    def test_create_prescription(self):
        rx = create_or_update_prescription(
            appointment=self.appointment,
            doctor_user=self.doctor_user,
            diagnosis="Acute Viral Fever",
            vitals={"bp": "120/80", "temp": "101.2F"},
            diagnostic_tests="CBC, Blood Routine",
            advice="Rest and plenty of water",
            medications_data=[
                {"medication_name": "Tab. Napa 500mg", "dosage": "1 + 0 + 1", "timing": "After Meal", "duration": "5 Days"}
            ]
        )
        self.assertEqual(rx.diagnosis, "Acute Viral Fever")
        self.assertEqual(rx.medications.count(), 1)
        self.assertIsNotNone(rx.qr_token)

    def test_create_medical_report(self):
        from .models import MedicalReport, ReportCategory
        report = MedicalReport.objects.create(
            patient=self.patient_user,
            title="Complete Blood Count (CBC)",
            report_type=ReportCategory.BLOOD_TEST,
            diagnostic_center="Popular Diagnostic Center",
            test_date=date.today(),
            file_url="https://res.cloudinary.com/test/image/upload/sample_cbc.pdf",
            summary_notes="Hemoglobin 13.5 g/dL, WBC Normal"
        )
        self.assertEqual(report.title, "Complete Blood Count (CBC)")
        self.assertEqual(report.report_type, ReportCategory.BLOOD_TEST)
        self.assertEqual(MedicalReport.objects.filter(patient=self.patient_user).count(), 1)
