from rest_framework import serializers
from .models import Department, Clinic, ClinicDepartment, ClinicService

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ('id', 'name', 'description', 'icon_url', 'is_active', 'created_at')
        read_only_fields = ('id', 'created_at')

class ClinicDepartmentSerializer(serializers.ModelSerializer):
    department = DepartmentSerializer(read_only=True)
    department_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = ClinicDepartment
        fields = ('id', 'department', 'department_id', 'is_active', 'created_at')
        read_only_fields = ('id', 'created_at')

class ClinicServiceSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = ClinicService
        fields = (
            'id', 'clinic', 'department', 'department_name', 'name',
            'description', 'fee', 'duration_minutes',
            'preparation_instructions', 'is_available', 'created_at'
        )
        read_only_fields = ('id', 'clinic', 'created_at')

class ClinicSerializer(serializers.ModelSerializer):
    departments = DepartmentSerializer(many=True, read_only=True)
    services = serializers.SerializerMethodField()
    owner_email = serializers.EmailField(source='owner.email', read_only=True)
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()

    class Meta:
        model = Clinic
        fields = (
            'id', 'owner', 'owner_email', 'name', 'slug', 'address', 'city',
            'phone', 'email', 'logo_url', 'certificate_url', 'description',
            'opening_hours', 'facilities', 'gallery', 'emergency_contact', 'website',
            'latitude', 'longitude', 'subscription_plan', 'verification_status',
            'is_active', 'departments', 'services', 'average_rating', 'review_count', 'created_at'
        )
        read_only_fields = ('id', 'verification_status', 'created_at')

    def get_services(self, obj):
        # Return all active services for this clinic
        active_services = obj.services.filter(is_available=True)
        return ClinicServiceSerializer(active_services, many=True).data

    def get_average_rating(self, obj):
        from django.db.models import Avg
        avg = obj.reviews.aggregate(Avg('rating'))['rating__avg']
        return round(float(avg), 1) if avg is not None else None

    def get_review_count(self, obj):
        return obj.reviews.count()

class ClinicCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Clinic
        fields = (
            'name', 'slug', 'address', 'city', 'phone', 'email',
            'logo_url', 'certificate_url', 'description', 'opening_hours',
            'facilities', 'gallery', 'emergency_contact', 'website',
            'latitude', 'longitude', 'subscription_plan'
        )
        extra_kwargs = {
            'slug': {'required': False}
        }

