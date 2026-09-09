import datetime
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from apps.accounts.models import UserRole
from apps.clinics.models import Clinic, VerificationStatus as ClinicVerificationStatus
from apps.doctors.models import Doctor, DoctorClinic, VerificationStatus as DoctorVerificationStatus
from apps.appointments.models import Appointment, AppointmentStatus
from apps.payments.models import Payment, PaymentMethod, PaymentStatus

User = get_user_model()

class PaymentSSLCommerzTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.patient = User.objects.create_user(
            email="patient.payment@example.com",
            password="Password123!",
            first_name="Rahim",
            last_name="Uddin",
            phone="01711223344",
            role=UserRole.PATIENT
        )
        self.doc_user = User.objects.create_user(
            email="doc.payment@example.com",
            password="Password123!",
            first_name="Dr. Karim",
            last_name="Chowdhury",
            role=UserRole.DOCTOR
        )
        self.clinic_owner = User.objects.create_user(
            email="owner.payment@example.com",
            password="Password123!",
            role=UserRole.CLINIC_ADMIN
        )
        self.clinic = Clinic.objects.create(
            name="Square Hospital Dhaka",
            owner=self.clinic_owner,
            address="Panthapath, Dhaka",
            phone="01700000001",
            email="square@example.com",
            verification_status=ClinicVerificationStatus.VERIFIED
        )
        self.doctor = Doctor.objects.create(
            user=self.doc_user,
            full_name="Dr. Karim Chowdhury",
            qualification="MBBS, FCPS",
            verification_status=DoctorVerificationStatus.VERIFIED
        )
        self.doctor_clinic = DoctorClinic.objects.create(
            doctor=self.doctor,
            clinic=self.clinic,
            consultation_fee=1000.00,
            status="ACCEPTED"
        )
        self.appointment = Appointment.objects.create(
            patient=self.patient,
            clinic=self.clinic,
            doctor=self.doctor,
            appointment_date=datetime.date.today() + datetime.timedelta(days=1),
            appointment_time=datetime.time(11, 0),
            amount=1000.00,
            status=AppointmentStatus.PENDING,
            serial_number=1
        )

    def test_initiate_sslcommerz_payment(self):
        self.client.force_authenticate(user=self.patient)
        url = "/api/v1/payments/initiate-sslcommerz/"
        res = self.client.post(url, {"appointment_id": str(self.appointment.id)}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("redirect_url", res.data)
        self.assertIn("payment_id", res.data)

        # Check Payment model created
        payment = Payment.objects.get(pk=res.data["payment_id"])
        self.assertEqual(payment.payment_method, PaymentMethod.SSLCOMMERZ)
        self.assertEqual(payment.payment_status, PaymentStatus.PENDING)

    def test_sslcommerz_success_callback(self):
        payment = Payment.objects.create(
            appointment=self.appointment,
            amount=1000.00,
            payment_method=PaymentMethod.SSLCOMMERZ,
            payment_status=PaymentStatus.PENDING
        )
        success_url = "/api/v1/payments/sslcommerz/success/"
        res = self.client.post(success_url, {
            "tran_id": str(payment.id),
            "val_id": "VALID_MOCK_123456",
            "bank_tran_id": "BKASH_TRX_998877",
            "card_type": "BKASH-BKash",
            "status": "VALID"
        })
        # Should redirect to frontend dashboard with success
        self.assertEqual(res.status_code, 302)
        self.assertIn("payment=success", res.url)

        # Confirm payment and appointment are marked completed / confirmed
        payment.refresh_from_db()
        self.appointment.refresh_from_db()
        self.assertEqual(payment.payment_status, PaymentStatus.COMPLETED)
        self.assertEqual(payment.val_id, "VALID_MOCK_123456")
        self.assertEqual(self.appointment.status, AppointmentStatus.CONFIRMED)

    def test_cash_at_chamber_processing(self):
        self.client.force_authenticate(user=self.patient)
        payment = Payment.objects.create(
            appointment=self.appointment,
            amount=1000.00,
            payment_method=PaymentMethod.CASH,
            payment_status=PaymentStatus.PENDING
        )
        process_url = f"/api/v1/payments/{payment.id}/process/"
        res = self.client.post(process_url, {
            "transaction_id": "CASH_CHAMBER_DESK_01"
        }, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        payment.refresh_from_db()
        self.appointment.refresh_from_db()
        self.assertEqual(payment.payment_status, PaymentStatus.COMPLETED)
        self.assertEqual(self.appointment.status, AppointmentStatus.CONFIRMED)
