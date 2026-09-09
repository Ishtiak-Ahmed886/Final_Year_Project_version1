import logging
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)

def send_approval_email(recipient_email, recipient_name, subject, message):
    """
    Sends an approval email via Django mail backend (Gmail SMTP).
    Catches errors gracefully so lack of SMTP credentials in local dev does not break the API.
    """
    if not recipient_email:
        return False

    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@smartclinic.com')

    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=from_email,
            recipient_list=[recipient_email],
            fail_silently=False,
        )
        logger.info(f"Approval email sent to {recipient_email}")
        return True
    except Exception as e:
        logger.warning(f"Email dispatch to {recipient_email} skipped or failed: {str(e)}")
        return False
