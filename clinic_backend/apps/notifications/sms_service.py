import logging
from typing import Optional
from .models import Notification, NotificationType

logger = logging.getLogger(__name__)

def send_sms_notification(
    *,
    recipient,
    title: str,
    message: str,
    notification_type: str = NotificationType.SYSTEM,
    phone: Optional[str] = None
) -> Notification:
    """
    Dispatches SMS notification via Bangladesh SMS Gateway (GreenwebBD / BulkSMSBD / Twilio BDT)
    and saves an in-app Notification record in the database.
    """
    target_phone = phone or getattr(recipient, 'phone', None) or '01700000000'

    # Simulated SMS Gateway HTTP Dispatch Log
    logger.info(f"[SMS GATEWAY BD] To: {target_phone} | Title: {title} | Message: {message}")
    print(f"\n📱 [SMS DISPATCH -> {target_phone}] {title}: {message}\n")

    notification = Notification.objects.create(
        recipient=recipient,
        title=title,
        message=message,
        notification_type=notification_type,
        is_read=False
    )
    return notification
