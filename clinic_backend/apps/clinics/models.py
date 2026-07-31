from django.db import models
from django.conf import settings
from apps.core.models import BaseModel

class VerificationStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending'
    VERIFIED = 'VERIFIED', 'Verified'
    REJECTED = 'REJECTED', 'Rejected'

class SubscriptionPlan(models.TextChoices):
    FREE = 'FREE', 'Free'
    PRO = 'PRO', 'Pro'
    ENTERPRISE = 'ENTERPRISE', 'Enterprise'

class Department(BaseModel):
    """
    Global Department catalog (e.g. Cardiology, ENT, Neurology).
    Prevents duplicating department names across the system.
    """
    name = models.CharField(max_length=100, unique=True, db_index=True)
    description = models.TextField(blank=True, default='')
    icon_url = models.URLField(blank=True, null=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'Department'
        verbose_name_plural = 'Departments'

    def __str__(self):
        return self.name

class Clinic(BaseModel):
    """
    Clinic entity owned by exactly one ClinicAdmin user.
    """
    owner = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='owned_clinic',
        limit_choices_to={'role': 'CLINIC_ADMIN'}
    )
    name = models.CharField(max_length=200, db_index=True)
    slug = models.SlugField(max_length=220, unique=True, db_index=True)
    address = models.TextField()
    city = models.CharField(max_length=100, db_index=True)
    phone = models.CharField(max_length=20)
    email = models.EmailField()
    logo_url = models.URLField(blank=True, null=True)
    certificate_url = models.URLField(blank=True, null=True, help_text="Cloudinary URL of clinic registration certificate")
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    subscription_plan = models.CharField(
        max_length=20,
        choices=SubscriptionPlan.choices,
        default=SubscriptionPlan.FREE
    )
    verification_status = models.CharField(
        max_length=20,
        choices=VerificationStatus.choices,
        default=VerificationStatus.PENDING
    )
    is_active = models.BooleanField(default=True)

    # Junction M2M relationship through ClinicDepartment
    departments = models.ManyToManyField(
        Department,
        through='ClinicDepartment',
        related_name='clinics'
    )

    class Meta:
        ordering = ['name']
        verbose_name = 'Clinic'
        verbose_name_plural = 'Clinics'

    def __str__(self):
        return f"{self.name} ({self.city})"

class ClinicDepartment(BaseModel):
    """
    Junction table mapping Clinic to offered Departments.
    """
    clinic = models.ForeignKey(Clinic, on_delete=models.CASCADE, related_name='clinic_departments')
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='clinic_departments')
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('clinic', 'department')
        verbose_name = 'Clinic Department'
        verbose_name_plural = 'Clinic Departments'

    def __str__(self):
        return f"{self.clinic.name} - {self.department.name}"
