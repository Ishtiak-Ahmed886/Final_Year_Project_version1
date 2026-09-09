from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import UserRole, FamilyMember

User = get_user_model()

class FamilyMemberSerializer(serializers.ModelSerializer):
    patient_email = serializers.ReadOnlyField(source='patient.email')
    relationship_display = serializers.CharField(source='get_relationship_display', read_only=True)
    name = serializers.CharField(source='full_name', required=False)

    class Meta:
        model = FamilyMember
        fields = (
            'id', 'patient', 'patient_email', 'full_name', 'name', 'relationship',
            'relationship_display', 'phone', 'age', 'date_of_birth', 'gender', 'blood_group',
            'medical_notes', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'patient', 'patient_email', 'created_at', 'updated_at', 'relationship_display')

    def validate(self, attrs):
        if 'date_of_birth' in attrs and attrs['date_of_birth'] and not attrs.get('age'):
            from datetime import date
            dob = attrs['date_of_birth']
            today = date.today()
            attrs['age'] = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

        phone = attrs.get('phone', '')
        if phone:
            import re
            cleaned_phone = re.sub(r'[\s\-]', '', str(phone))
            if cleaned_phone.startswith('+880'):
                cleaned_phone = '0' + cleaned_phone[4:]
            elif cleaned_phone.startswith('880'):
                cleaned_phone = '0' + cleaned_phone[3:]

            if not re.match(r'^01[3-9]\d{8}$', cleaned_phone):
                raise serializers.ValidationError({"phone": "Please enter a valid 11-digit Bangladeshi mobile number (e.g. 01712345678)."})
            attrs['phone'] = cleaned_phone

        return attrs

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email'] = user.email
        token['role'] = user.role
        token['full_name'] = user.full_name
        return token

    def validate(self, attrs):
        if self.username_field in attrs and isinstance(attrs[self.username_field], str):
            attrs[self.username_field] = attrs[self.username_field].strip().lower()
        data = super().validate(attrs)
        data['user'] = {
            'id': str(self.user.id),
            'email': self.user.email,
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
            'role': self.user.role,
        }
        return data

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'phone', 'role', 'password', 'password_confirm')
        read_only_fields = ('id',)

    def validate(self, attrs):
        if attrs['password'] != attrs.pop('password_confirm'):
            raise serializers.ValidationError({"password": "Passwords do not match."})

        if 'email' in attrs and isinstance(attrs['email'], str):
            attrs['email'] = attrs['email'].strip().lower()

        phone = attrs.get('phone', '')
        if phone:
            import re
            cleaned_phone = re.sub(r'[\s\-]', '', str(phone))
            if cleaned_phone.startswith('+880'):
                cleaned_phone = '0' + cleaned_phone[4:]
            elif cleaned_phone.startswith('880'):
                cleaned_phone = '0' + cleaned_phone[3:]

            if not re.match(r'^01[3-9]\d{8}$', cleaned_phone):
                raise serializers.ValidationError({"phone": "Please enter a valid 11-digit Bangladeshi mobile number (e.g. 01712345678)."})
            attrs['phone'] = cleaned_phone

        return attrs

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone=validated_data.get('phone', ''),
            role=validated_data.get('role', UserRole.PATIENT)
        )
        return user

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'phone', 'role', 'is_active', 'created_at')
        read_only_fields = ('id', 'email', 'role', 'is_active', 'created_at')

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)
