from .auth import auth_bp
from .donor import donor_bp
from .hospital import hospital_bp
from .admin import admin_bp
from .notification import notification_bp
from .matching import matching_bp

__all__ = [
    'auth_bp',
    'donor_bp',
    'hospital_bp',
    'admin_bp',
    'notification_bp',
    'matching_bp'
]