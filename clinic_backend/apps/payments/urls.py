from django.urls import path
from .views import PaymentListCreateView, ProcessPaymentView

app_name = 'payments'

urlpatterns = [
    path('', PaymentListCreateView.as_view(), name='payment_list_create'),
    path('<uuid:pk>/process/', ProcessPaymentView.as_view(), name='process_payment'),
]
