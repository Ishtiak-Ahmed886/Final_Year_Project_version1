from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from .models import UserRole

User = get_user_model()

class AccountsModelTestCase(TestCase):
    def test_create_user(self):
        user = User.objects.create_user(
            email="patient@example.com",
            password="Password123!",
            first_name="Jane",
            last_name="Doe",
            role=UserRole.PATIENT
        )
        self.assertEqual(user.email, "patient@example.com")
        self.assertTrue(user.check_password("Password123!"))
        self.assertEqual(user.role, UserRole.PATIENT)
        self.assertFalse(user.is_staff)

    def test_create_superuser(self):
        admin = User.objects.create_superuser(
            email="admin@example.com",
            password="AdminPassword123!",
            first_name="Super",
            last_name="Admin"
        )
        self.assertEqual(admin.role, UserRole.ADMIN)
        self.assertTrue(admin.is_staff)
        self.assertTrue(admin.is_superuser)

class AccountsAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = "/api/v1/accounts/register/"
        self.login_url = "/api/v1/accounts/login/"
        self.me_url = "/api/v1/accounts/me/"

    def test_user_registration_and_login(self):
        reg_payload = {
            "email": "john@example.com",
            "password": "SecurePassword123!",
            "password_confirm": "SecurePassword123!",
            "first_name": "John",
            "last_name": "Smith",
            "role": "PATIENT"
        }
        res = self.client.post(self.register_url, reg_payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        login_payload = {
            "email": "john@example.com",
            "password": "SecurePassword123!"
        }
        res = self.client.post(self.login_url, login_payload, format="json")
        self.assertIn("access", res.data)
        
        access_token = res.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
        
        res = self.client.get(self.me_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["email"], "john@example.com")

