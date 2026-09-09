from rest_framework import serializers
from .models import Department, Clinic, ClinicDepartment

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

class ClinicSerializer(serializers.ModelSerializer):
    departments = DepartmentSerializer(many=True, read_only=True)
    owner_email = serializers.EmailField(source='owner.email', read_only=True)
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()

    class Meta:
        model = Clinic
        fields = (
            'id', 'owner', 'owner_email', 'name', 'slug', 'address', 'city',
            'phone', 'email', 'logo_url', 'certificate_url', 'latitude', 'longitude',
            'subscription_plan', 'verification_status', 'is_active', 'departments',
            'average_rating', 'review_count', 'created_at'
        )
        read_only_fields = ('id', 'verification_status', 'created_at')

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
            'logo_url', 'certificate_url', 'latitude', 'longitude', 'subscription_plan'
        )
        extra_kwargs = {
            'slug': {'required': False}
        }

