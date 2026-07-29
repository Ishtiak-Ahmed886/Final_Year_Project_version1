from django.urls import path
from .views import (
    UserRegistrationView,
    UserProfileView,
    ChangePasswordView,
    CustomTokenObtainPairView,
    CustomTokenRefreshView,
)

app_name = 'accounts'

urlpatterns = [
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('token/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
    path('me/', UserProfileView.as_view(), name='me'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
]
