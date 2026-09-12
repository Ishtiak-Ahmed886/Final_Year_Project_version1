from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from apps.accounts.models import UserRole
from .models import Department, Clinic
from .services import create_department, create_clinic, add_department_to_clinic

User = get_user_model()

class ClinicsTestCase(TestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            email="admin@clinic.com", password="Pass123!Admin", first_name="Admin", last_name="User"
        )
        self.clinic_admin = User.objects.create_user(
            email="owner@clinic.com", password="Pass123!Owner", first_name="Clinic", last_name="Owner", role=UserRole.CLINIC_ADMIN
        )
        self.client = APIClient()

    def test_department_and_clinic_creation(self):
        dept = create_department(name="Cardiology", description="Heart Care")
        self.assertEqual(Department.objects.count(), 1)

        clinic = create_clinic(
            owner=self.clinic_admin,
            name="City Heart Hospital",
            address="123 Health Ave",
            city="New York",
            phone="+1234567890",
            email="contact@cityheart.com"
        )
        self.assertEqual(Clinic.objects.count(), 1)
        self.assertEqual(clinic.owner, self.clinic_admin)

        add_department_to_clinic(clinic=clinic, department_id=dept.id)
        self.assertEqual(clinic.departments.count(), 1)

    def test_clinic_api(self):
        self.client.force_authenticate(user=self.clinic_admin)
        payload = {
            "name": "Metro Health Clinic",
            "address": "456 Main St",
            "city": "Chicago",
            "phone": "+1987654321",
            "email": "metro@health.com"
        }
        res = self.client.post("/api/v1/clinics/", payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["name"], "Metro Health Clinic")

    def test_my_clinic_endpoint(self):
        # 1. No clinic yet -> returns null (200 OK)
        self.client.force_authenticate(user=self.clinic_admin)
        res = self.client.get("/api/v1/clinics/my-clinic/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIsNone(res.data)

        # 2. Clinic created -> returns owned clinic
        clinic = create_clinic(
            owner=self.clinic_admin,
            name="Alpha Care Clinic",
            address="789 Care Blvd",
            city="Dhaka",
            phone="01711223344",
            email="alpha@care.com"
        )
        res = self.client.get("/api/v1/clinics/my-clinic/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["name"], "Alpha Care Clinic")
        self.assertEqual(res.data["verification_status"], "PENDING")

    def test_rejected_clinic_resubmission(self):
        self.client.force_authenticate(user=self.clinic_admin)
        clinic = create_clinic(
            owner=self.clinic_admin,
            name="Beta Clinic",
            address="100 Road",
            city="Dhaka",
            phone="01711223344",
            email="beta@care.com"
        )
        clinic.verification_status = "REJECTED"
        clinic.save()

        # Resubmit with updated certificate
        update_payload = {"certificate_url": "https://res.cloudinary.com/demo/valid_cert.pdf"}
        res = self.client.patch(f"/api/v1/clinics/{clinic.id}/", update_payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        clinic.refresh_from_db()
        self.assertEqual(clinic.verification_status, "PENDING")

    def test_clinic_decoration_and_profile_update(self):
        self.client.force_authenticate(user=self.clinic_admin)
        clinic = create_clinic(
            owner=self.clinic_admin,
            name="Apex Hospital",
            address="Dhanmondi, Dhaka",
            city="Dhaka",
            phone="01700000000",
            email="apex@hospital.com"
        )
        payload = {
            "description": "Leading multi-specialty healthcare facility with modern diagnostics.",
            "opening_hours": "Sat - Thu: 08:00 AM - 10:00 PM | Fri: 04:00 PM - 10:00 PM",
            "facilities": ["24/7 Emergency", "Wheelchair Accessible", "In-house Pharmacy", "Dedicated Parking"],
            "emergency_contact": "01799999999",
            "website": "https://apex-hospital.bd"
        }
        res = self.client.patch(f"/api/v1/clinics/{clinic.id}/", payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        clinic.refresh_from_db()
        self.assertEqual(clinic.description, payload["description"])
        self.assertEqual(clinic.opening_hours, payload["opening_hours"])
        self.assertIn("24/7 Emergency", clinic.facilities)
        self.assertEqual(clinic.emergency_contact, "01799999999")

    def test_clinic_services_crud(self):
        self.client.force_authenticate(user=self.clinic_admin)
        clinic = create_clinic(
            owner=self.clinic_admin,
            name="Modern Diagnostic",
            address="Mirpur 10",
            city="Dhaka",
            phone="01711111111",
            email="modern@diag.com"
        )
        # 1. Create a clinical service
        service_payload = {
            "name": "Echocardiogram (Echo)",
            "description": "2D echocardiogram with color doppler report",
            "fee": 2500.00,
            "duration_minutes": 30,
            "preparation_instructions": "Bring previous ECG reports if any",
            "is_available": True
        }
        res = self.client.post(f"/api/v1/clinics/{clinic.id}/services/", service_payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        service_id = res.data["id"]
        self.assertEqual(res.data["name"], "Echocardiogram (Echo)")
        self.assertEqual(float(res.data["fee"]), 2500.00)

        # 2. List services
        res = self.client.get(f"/api/v1/clinics/{clinic.id}/services/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)

        # 3. Update service (e.g. toggle availability, update fee)
        patch_payload = {"fee": 2200.00, "is_available": False}
        res = self.client.patch(f"/api/v1/clinics/{clinic.id}/services/{service_id}/", patch_payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(float(res.data["fee"]), 2200.00)
        self.assertFalse(res.data["is_available"])

        # 4. Public patient list should filter out is_available=False
        patient_client = APIClient()
        res = patient_client.get(f"/api/v1/clinics/{clinic.id}/services/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 0)

        # 5. Delete service
        res = self.client.delete(f"/api/v1/clinics/{clinic.id}/services/{service_id}/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        res = self.client.get(f"/api/v1/clinics/{clinic.id}/services/")
        self.assertEqual(len(res.data), 0)

    def test_clinic_gallery_update(self):
        self.client.force_authenticate(user=self.clinic_admin)
        clinic = create_clinic(
            owner=self.clinic_admin,
            name="Apex Specialty Hospital",
            address="Gulshan 2",
            city="Dhaka",
            phone="01722222222",
            email="apex@hospital.com"
        )
        gallery_items = [
            {
                "id": "gal-1",
                "image_url": "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d",
                "category": "Reception & Information Desk",
                "title": "Main Reception & Token Counter",
                "description": "Fast-track air-conditioned patient reception with digital queue display.",
                "is_featured": True
            },
            {
                "id": "gal-2",
                "image_url": "https://images.unsplash.com/photo-1581594693702-fbdc51b2763b",
                "category": "Diagnostic & Pathology Lab",
                "title": "Automated Hematology Lab",
                "description": "Fully automated diagnostic biochemistry and clinical pathology testing suite.",
                "is_featured": False
            }
        ]
        res = self.client.patch(f"/api/v1/clinics/{clinic.id}/", {"gallery": gallery_items}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        clinic.refresh_from_db()
        self.assertEqual(len(clinic.gallery), 2)
        self.assertEqual(clinic.gallery[0]["title"], "Main Reception & Token Counter")
        self.assertTrue(clinic.gallery[0]["is_featured"])

        # Check public retrieve returns gallery
        pub_client = APIClient()
        pub_res = pub_client.get(f"/api/v1/clinics/{clinic.id}/")
        self.assertEqual(pub_res.status_code, status.HTTP_200_OK)
        self.assertIn("gallery", pub_res.data)
        self.assertEqual(len(pub_res.data["gallery"]), 2)



