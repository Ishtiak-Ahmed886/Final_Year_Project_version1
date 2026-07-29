from rest_framework.permissions import BasePermission
from .models import UserRole

class IsAdmin(BasePermission):
    """Allows access only to Admin users."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (request.user.role == UserRole.ADMIN or request.user.is_superuser))

class IsClinicAdmin(BasePermission):
    """Allows access only to ClinicAdmin users."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == UserRole.CLINIC_ADMIN)

class IsPatient(BasePermission):
    """Allows access only to Patient users."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == UserRole.PATIENT)

class IsClinicAdminOrAdmin(BasePermission):
    """Allows access to ClinicAdmin or Admin users."""
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and 
            (request.user.role in [UserRole.ADMIN, UserRole.CLINIC_ADMIN] or request.user.is_superuser)
        )
