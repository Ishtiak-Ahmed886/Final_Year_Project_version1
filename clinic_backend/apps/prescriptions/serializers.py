from rest_framework import serializers
from .models import Medication, Prescription, PrescribedMedication
from apps.doctors.serializers import DoctorSerializer
from apps.accounts.serializers import UserSerializer, FamilyMemberSerializer

class MedicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medication
        fields = ('id', 'brand_name', 'generic_name', 'form', 'strength', 'manufacturer')
        read_only_fields = ('id',)

class PrescribedMedicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrescribedMedication
        fields = ('id', 'medication_name', 'dosage', 'timing', 'duration', 'instructions')
        read_only_fields = ('id',)

class PrescriptionSerializer(serializers.ModelSerializer):
    doctor = DoctorSerializer(read_only=True)
    patient = UserSerializer(read_only=True)
    family_member = FamilyMemberSerializer(read_only=True)
    medications = PrescribedMedicationSerializer(many=True, read_only=True)
    clinic_name = serializers.CharField(source='appointment.clinic.name', read_only=True, default='')
    clinic_address = serializers.CharField(source='appointment.clinic.address', read_only=True, default='')
    clinic_phone = serializers.CharField(source='appointment.clinic.phone', read_only=True, default='')
    appointment_date = serializers.DateField(source='appointment.appointment_date', read_only=True, default=None)
    serial_number = serializers.IntegerField(source='appointment.serial_number', read_only=True, default=1)

    class Meta:
        model = Prescription
        fields = (
            'id', 'appointment', 'doctor', 'patient', 'family_member',
            'diagnosis', 'vitals', 'diagnostic_tests', 'advice',
            'qr_token', 'medications', 'clinic_name', 'clinic_address',
            'clinic_phone', 'appointment_date', 'serial_number',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'qr_token', 'created_at', 'updated_at')

class PrescribedMedicationItemSerializer(serializers.Serializer):
    medication_name = serializers.CharField(required=True)
    dosage = serializers.CharField(required=False, default='1 + 0 + 1')
    timing = serializers.CharField(required=False, default='After Meal')
    duration = serializers.CharField(required=False, default='7 Days')
    instructions = serializers.CharField(required=False, allow_blank=True, default='')

class PrescriptionCreateSerializer(serializers.Serializer):
    appointment_id = serializers.UUIDField(required=True)
    diagnosis = serializers.CharField(required=False, allow_blank=True, default='')
    vitals = serializers.JSONField(required=False, default=dict)
    diagnostic_tests = serializers.CharField(required=False, allow_blank=True, default='')
    advice = serializers.CharField(required=False, allow_blank=True, default='')
    medications = PrescribedMedicationItemSerializer(many=True, required=False, default=list)


from .models import MedicalReport, ReportCategory

class MedicalReportSerializer(serializers.ModelSerializer):
    family_member_name = serializers.CharField(source='family_member.full_name', read_only=True)
    report_type_display = serializers.CharField(source='get_report_type_display', read_only=True)

    class Meta:
        model = MedicalReport
        fields = (
            'id', 'patient', 'family_member', 'family_member_name', 'appointment',
            'title', 'report_type', 'report_type_display', 'diagnostic_center',
            'test_date', 'file_url', 'summary_notes', 'uploaded_by', 'created_at'
        )
        read_only_fields = ('id', 'created_at', 'uploaded_by', 'patient')
