from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

urlpatterns = [
    path('admin/', admin.site.urls),

    # OpenAPI Schema & Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # Application APIs
    path('api/v1/accounts/', include('apps.accounts.urls', namespace='accounts')),
    path('api/v1/clinics/', include('apps.clinics.urls', namespace='clinics')),
    path('api/v1/doctors/', include('apps.doctors.urls', namespace='doctors')),
    path('api/v1/appointments/', include('apps.appointments.urls', namespace='appointments')),
    path('api/v1/payments/', include('apps.payments.urls', namespace='payments')),
    path('api/v1/reviews/', include('apps.reviews.urls', namespace='reviews')),
    path('api/v1/notifications/', include('apps.notifications.urls', namespace='notifications')),
    path('api/v1/prescriptions/', include('apps.prescriptions.urls', namespace='prescriptions')),
]
