from rest_framework import serializers
from .models import Specialization, Doctor, DoctorClinic
from apps.clinics.serializers import ClinicSerializer, DepartmentSerializer

class SpecializationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Specialization
        fields = ('id', 'name', 'description', 'created_at')
        read_only_fields = ('id', 'created_at')

class DoctorClinicSerializer(serializers.ModelSerializer):
    clinic = ClinicSerializer(read_only=True)
    clinic_id = serializers.UUIDField(write_only=True)
    department = DepartmentSerializer(read_only=True)
    department_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = DoctorClinic
        fields = (
            'id', 'clinic', 'clinic_id', 'department', 'department_id',
            'consultation_fee', 'room_number', 'joining_date', 'leaving_date',
            'is_active', 'created_at'
        )
        read_only_fields = ('id', 'created_at')

class DoctorSerializer(serializers.ModelSerializer):
    specializations = SpecializationSerializer(many=True, read_only=True)
    specialization_ids = serializers.ListField(
        child=serializers.UUIDField(), write_only=True, required=False
    )
    doctor_clinics = DoctorClinicSerializer(many=True, read_only=True)

    # Optional fields to directly assign doctor to a clinic on creation/update
    clinic_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    consultation_fee = serializers.DecimalField(max_digits=10, decimal_places=2, write_only=True, required=False, allow_null=True)
    department_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    room_number = serializers.CharField(write_only=True, required=False, allow_blank=True, default='')

    class Meta:
        model = Doctor
        fields = (
            'id', 'full_name', 'email', 'phone', 'experience_years',
            'qualification', 'bio', 'avatar_url', 'is_active',
            'specializations', 'specialization_ids', 'doctor_clinics',
            'clinic_id', 'consultation_fee', 'department_id', 'room_number',
            'created_at'
        )
        read_only_fields = ('id', 'created_at')

class DoctorClinicAssignmentSerializer(serializers.Serializer):
    clinic_id = serializers.UUIDField(required=False, allow_null=True)
    department_id = serializers.UUIDField(required=False, allow_null=True)
    consultation_fee = serializers.DecimalField(max_digits=10, decimal_places=2, required=True)
    room_number = serializers.CharField(required=False, allow_blank=True, default='')
    joining_date = serializers.DateField(required=False, allow_null=True)
