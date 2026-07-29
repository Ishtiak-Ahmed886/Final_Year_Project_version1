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
