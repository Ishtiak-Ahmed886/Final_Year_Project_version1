from django.db import models
from apps.core.models import BaseModel
from apps.clinics.models import Clinic, Department

class Specialization(BaseModel):
    """
    Doctor Specialization catalog (e.g. Cardiologist, Dermatologist, Pediatrician).
    """
    name = models.CharField(max_length=100, unique=True, db_index=True)
    description = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['name']
        verbose_name = 'Specialization'
        verbose_name_plural = 'Specializations'

    def __str__(self):
        return self.name

class Doctor(BaseModel):
    """
    Doctor profile. Note: Doctors are standalone entities and do not have User login accounts.
    A doctor can work in multiple clinics through DoctorClinic.
    """
    full_name = models.CharField(max_length=150, db_index=True)
    email = models.EmailField(blank=True, default='')
    phone = models.CharField(max_length=20, blank=True, default='')
    experience_years = models.PositiveIntegerField(default=0)
    qualification = models.CharField(max_length=255)
    bio = models.TextField(blank=True, default='')
    avatar_url = models.URLField(blank=True, null=True)
    is_active = models.BooleanField(default=True)

    specializations = models.ManyToManyField(
        Specialization,
        related_name='doctors',
        blank=True
    )

    class Meta:
        ordering = ['full_name']
        verbose_name = 'Doctor'
        verbose_name_plural = 'Doctors'

    def __str__(self):
        return f"Dr. {self.full_name}"

class DoctorClinic(BaseModel):
    """
    Junction model mapping Doctor to Clinic with clinic-specific meta:
    consultation fee, room number, joining date, leaving date, active status.
    """
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='doctor_clinics')
    clinic = models.ForeignKey(Clinic, on_delete=models.CASCADE, related_name='doctor_clinics')
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='doctor_clinics')
    consultation_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    room_number = models.CharField(max_length=50, blank=True, default='')
    joining_date = models.DateField(null=True, blank=True)
    leaving_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('doctor', 'clinic')
        verbose_name = 'Doctor Clinic Mapping'
        verbose_name_plural = 'Doctor Clinic Mappings'

    def __str__(self):
        return f"Dr. {self.doctor.full_name} at {self.clinic.name} (${self.consultation_fee})"

class DayOfWeek(models.IntegerChoices):
    MONDAY = 0, 'Monday'
    TUESDAY = 1, 'Tuesday'
    WEDNESDAY = 2, 'Wednesday'
    THURSDAY = 3, 'Thursday'
    FRIDAY = 4, 'Friday'
    SATURDAY = 5, 'Saturday'
    SUNDAY = 6, 'Sunday'

class DoctorSchedule(BaseModel):
    """
    Weekly recurring availability schedule for a doctor at a specific clinic.
    """
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='schedules')
    clinic = models.ForeignKey(Clinic, on_delete=models.CASCADE, related_name='doctor_schedules')
    day_of_week = models.IntegerField(choices=DayOfWeek.choices, db_index=True)
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['day_of_week', 'start_time']
        unique_together = ('doctor', 'clinic', 'day_of_week', 'start_time')
        verbose_name = 'Doctor Schedule'
        verbose_name_plural = 'Doctor Schedules'

    def __str__(self):
        return f"Dr. {self.doctor.full_name} - {self.get_day_of_week_display()} ({self.start_time}-{self.end_time})"

class DoctorLeave(BaseModel):
    """
    Leave/Blocked dates for a doctor.
    """
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='leaves')
    clinic = models.ForeignKey(Clinic, on_delete=models.CASCADE, null=True, blank=True, related_name='doctor_leaves')
    start_date = models.DateField(db_index=True)
    end_date = models.DateField(db_index=True)
    reason = models.CharField(max_length=255, blank=True, default='')
    is_approved = models.BooleanField(default=True)

    class Meta:
        ordering = ['-start_date']
        verbose_name = 'Doctor Leave'
        verbose_name_plural = 'Doctor Leaves'

    def __str__(self):
        return f"Dr. {self.doctor.full_name} Leave ({self.start_date} to {self.end_date})"
