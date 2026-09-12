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

    def test_login_with_phone_number(self):
        User.objects.create_user(
            email="phoneuser@example.com",
            password="Password123!",
            first_name="Phone",
            last_name="User",
            phone="01799887766",
            role=UserRole.PATIENT
        )
        # Login using mobile phone number
        login_res = self.client.post(self.login_url, {
            "email": "01799887766",
            "password": "Password123!"
        }, format="json")
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        self.assertIn("access", login_res.data)
        self.assertEqual(login_res.data["user"]["email"], "phoneuser@example.com")


class FamilyMemberCRUDTestCase(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.patient1 = User.objects.create_user(
            email="patient1@example.com",
            password="Password123!",
            first_name="Patient",
            last_name="One",
            role=UserRole.PATIENT
        )
        self.patient2 = User.objects.create_user(
            email="patient2@example.com",
            password="Password123!",
            first_name="Patient",
            last_name="Two",
            role=UserRole.PATIENT
        )
        self.url = "/api/v1/accounts/family-members/"

    def test_family_member_create_and_read(self):
        self.client.force_authenticate(user=self.patient1)
        payload = {
            "full_name": "Md. Rafiqul Islam",
            "relationship": "FATHER",
            "phone": "01711223344",
            "date_of_birth": "1960-05-15",
            "gender": "MALE",
            "blood_group": "A+",
            "medical_notes": "Hypertension"
        }
        res = self.client.post(self.url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["full_name"], "Md. Rafiqul Islam")
        self.assertEqual(res.data["relationship"], "FATHER")
        self.assertEqual(res.data["date_of_birth"], "1960-05-15")
        self.assertTrue(res.data["age"] is not None)
        member_id = res.data["id"]

        # View single
        detail_res = self.client.get(f"{self.url}{member_id}/")
        self.assertEqual(detail_res.status_code, status.HTTP_200_OK)
        self.assertEqual(detail_res.data["id"], member_id)

        # List
        list_res = self.client.get(self.url)
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_res.data["results"] if "results" in list_res.data else list_res.data), 1)

    def test_family_member_update_and_relationship_change(self):
        self.client.force_authenticate(user=self.patient1)
        # Create initial member
        create_res = self.client.post(self.url, {
            "full_name": "Fatema Begum",
            "relationship": "MOTHER",
            "gender": "FEMALE",
            "age": 55
        }, format="json")
        self.assertEqual(create_res.status_code, status.HTTP_201_CREATED)
        member_id = create_res.data["id"]

        # Update name, date of birth, gender
        update_payload = {
            "full_name": "Begum Fatema Khatun",
            "date_of_birth": "1968-08-20",
            "gender": "FEMALE"
        }
        patch_res = self.client.patch(f"{self.url}{member_id}/", update_payload, format="json")
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        self.assertEqual(patch_res.data["full_name"], "Begum Fatema Khatun")
        self.assertEqual(patch_res.data["date_of_birth"], "1968-08-20")

        # Update relationship field
        rel_payload = {
            "relationship": "SPOUSE"
        }
        rel_res = self.client.patch(f"{self.url}{member_id}/", rel_payload, format="json")
        self.assertEqual(rel_res.status_code, status.HTTP_200_OK)
        self.assertEqual(rel_res.data["relationship"], "SPOUSE")
        self.assertEqual(rel_res.data["relationship_display"], "Spouse")

    def test_family_member_delete(self):
        self.client.force_authenticate(user=self.patient1)
        create_res = self.client.post(self.url, {
            "full_name": "Child Member",
            "relationship": "CHILD",
            "gender": "MALE",
            "age": 10
        }, format="json")
        member_id = create_res.data["id"]

        delete_res = self.client.delete(f"{self.url}{member_id}/")
        self.assertEqual(delete_res.status_code, status.HTTP_204_NO_CONTENT)

        # Confirm deleted
        get_res = self.client.get(f"{self.url}{member_id}/")
        self.assertEqual(get_res.status_code, status.HTTP_404_NOT_FOUND)

    def test_unauthorized_access_protection(self):
        # 1. Unauthenticated request
        anon_client = APIClient()
        res = anon_client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        # 2. Patient 1 creates a family member
        self.client.force_authenticate(user=self.patient1)
        create_res = self.client.post(self.url, {
            "full_name": "Patient 1 Father",
            "relationship": "FATHER",
            "gender": "MALE"
        }, format="json")
        p1_member_id = create_res.data["id"]

        # 3. Patient 2 attempts to retrieve Patient 1's family member
        self.client.force_authenticate(user=self.patient2)
        get_other = self.client.get(f"{self.url}{p1_member_id}/")
        self.assertEqual(get_other.status_code, status.HTTP_403_FORBIDDEN)

        # 4. Patient 2 attempts to update Patient 1's family member
        patch_other = self.client.patch(f"{self.url}{p1_member_id}/", {"full_name": "Hacked Name"}, format="json")
        self.assertEqual(patch_other.status_code, status.HTTP_403_FORBIDDEN)

        # 5. Patient 2 attempts to delete Patient 1's family member
        delete_other = self.client.delete(f"{self.url}{p1_member_id}/")
        self.assertEqual(delete_other.status_code, status.HTTP_403_FORBIDDEN)


