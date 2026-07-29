import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    """
    Custom exception handler that normalizes exception responses to:
    {
        "success": False,
        "data": None,
        "errors": ...
    }
    """
    response = exception_handler(exc, context)

    if response is not None:
        errors = response.data
        if isinstance(errors, dict) and 'detail' in errors:
            errors = errors['detail']

        response.data = {
            'success': False,
            'data': None,
            'errors': errors
        }
    else:
        logger.error(f"Unhandled Exception: {exc}", exc_info=True)
        response = Response(
            {
                'success': False,
                'data': None,
                'errors': 'Internal server error occurred.'
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    return response

class CloudinaryStorageService:
    """
    Abstracted Cloudinary upload service to decouple storage implementation.
    """
    @staticmethod
    def upload_image(file_obj, folder="general"):
        """
        Upload image to Cloudinary (or local fallback in dev).
        Returns image URL.
        """
        try:
            import cloudinary.uploader
            result = cloudinary.uploader.upload(file_obj, folder=f"clinic_platform/{folder}")
            return result.get("secure_url")
        except Exception as e:
            logger.warning(f"Cloudinary upload failed or not configured, returning fallback: {e}")
            return f"/media/uploads/{folder}/{getattr(file_obj, 'name', 'file.jpg')}"
