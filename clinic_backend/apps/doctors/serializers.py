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
            'id', 'doctor', 'clinic', 'clinic_id', 'department', 'department_id',
            'consultation_fee', 'room_number', 'joining_date', 'leaving_date',
            'status', 'requested_by_role', 'is_active', 'created_at'
        )
        read_only_fields = ('id', 'status', 'requested_by_role', 'created_at')


class DoctorSerializer(serializers.ModelSerializer):
    specializations = SpecializationSerializer(many=True, read_only=True)
    specialization_ids = serializers.ListField(
        child=serializers.UUIDField(), write_only=True, required=False
    )
    doctor_clinics = DoctorClinicSerializer(many=True, read_only=True)

    class Meta:
        model = Doctor
        fields = (
            'id', 'full_name', 'email', 'phone', 'experience_years',
            'qualification', 'bio', 'avatar_url', 'certificate_url',
            'verification_status', 'is_active',
            'specializations', 'specialization_ids', 'doctor_clinics', 'created_at'
        )
        read_only_fields = ('id', 'created_at')


class DoctorClinicAssignmentSerializer(serializers.Serializer):
    """Used by Admin to assign an existing doctor directly to a clinic."""
    doctor_id = serializers.UUIDField(required=False)
    clinic_id = serializers.UUIDField(required=False)
    department_id = serializers.UUIDField(required=False, allow_null=True)
    consultation_fee = serializers.DecimalField(max_digits=10, decimal_places=2, required=True)
    room_number = serializers.CharField(required=False, allow_blank=True, default='')
    joining_date = serializers.DateField(required=False, allow_null=True)



class DoctorProfileSetupSerializer(serializers.ModelSerializer):
    """
    Used by a DOCTOR user to create or update their own Doctor profile
    after registering via accounts/register/.
    """
    specialization_ids = serializers.ListField(
        child=serializers.UUIDField(), write_only=True, required=False
    )
    specializations = SpecializationSerializer(many=True, read_only=True)
    doctor_clinics = DoctorClinicSerializer(many=True, read_only=True)

    class Meta:
        model = Doctor
        fields = (
            'id', 'full_name', 'email', 'phone', 'experience_years',
            'qualification', 'bio', 'avatar_url', 'certificate_url',
            'verification_status', 'is_active',
            'specializations', 'specialization_ids', 'doctor_clinics', 'created_at'
        )
        read_only_fields = ('id', 'verification_status', 'is_active', 'created_at', 'doctor_clinics')


class DoctorClinicRequestCreateSerializer(serializers.Serializer):
    """
    Used by ClinicAdmin to invite a Doctor OR by Doctor to request joining a Clinic.
    """
    doctor_id = serializers.UUIDField(required=False)
    clinic_id = serializers.UUIDField(required=False)
    department_id = serializers.UUIDField(required=False, allow_null=True)
    consultation_fee = serializers.DecimalField(max_digits=10, decimal_places=2, required=True)
    room_number = serializers.CharField(required=False, allow_blank=True, default='')


class DoctorClinicRequestResponseSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['ACCEPT', 'REJECT'])


from .models import ChamberSession, ChamberSessionStatus

class ChamberSessionSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source='doctor.full_name', read_only=True)
    clinic_name = serializers.CharField(source='clinic.name', read_only=True)

    class Meta:
        model = ChamberSession
        fields = (
            'id', 'doctor', 'doctor_name', 'clinic', 'clinic_name',
            'session_date', 'status', 'current_serial',
            'estimated_mins_per_patient', 'started_at', 'ended_at', 'created_at'
        )
        read_only_fields = ('id', 'created_at')

class ChamberSessionUpdateSerializer(serializers.Serializer):
    doctor_id = serializers.UUIDField(required=True)
    clinic_id = serializers.UUIDField(required=True)
    session_date = serializers.DateField(required=False, allow_null=True)
    status = serializers.ChoiceField(choices=ChamberSessionStatus.choices, required=False)
    current_serial = serializers.IntegerField(required=False, min_value=0)
    action = serializers.ChoiceField(choices=['NEXT_SERIAL', 'PREV_SERIAL', 'SET_SERIAL', 'UPDATE_STATUS'], required=False)

