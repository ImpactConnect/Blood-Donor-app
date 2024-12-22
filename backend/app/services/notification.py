from app import db, socketio
from app.models.notification import Notification
from datetime import datetime

class NotificationService:
    def __init__(self):
        self.notification_types = {
            'blood_request': {
                'title': 'New Blood Request',
                'template': '{hospital_name} needs {blood_type} blood'
            },
            'request_response': {
                'title': 'Donation Response',
                'template': '{donor_name} has responded to your blood request'
            },
            'donation_reminder': {
                'title': 'Donation Reminder',
                'template': 'You are now eligible to donate blood again'
            },
            'emergency': {
                'title': 'Emergency Blood Request',
                'template': 'URGENT: {hospital_name} needs {blood_type} blood immediately'
            }
        }

    def create_notification(self, user_id, type, data):
        """Create and save a new notification."""
        template = self.notification_types.get(type)
        if not template:
            raise ValueError(f'Invalid notification type: {type}')

        notification = Notification(
            user_id=user_id,
            title=template['title'],
            message=template['template'].format(**data),
            type=type,
            created_at=datetime.utcnow()
        )

        db.session.add(notification)
        db.session.commit()

        # Emit real-time notification
        socketio.emit(
            'notification',
            {
                'id': notification.id,
                'title': notification.title,
                'message': notification.message,
                'type': notification.type,
                'created_at': notification.created_at.isoformat()
            },
            room=str(user_id)
        )

        return notification

    def get_user_notifications(self, user_id, limit=50):
        """Get notifications for a user."""
        return Notification.query.filter_by(user_id=user_id)\
            .order_by(Notification.created_at.desc())\
            .limit(limit).all()

    def mark_as_read(self, notification_id, user_id):
        """Mark a notification as read."""
        notification = Notification.query.filter_by(
            id=notification_id,
            user_id=user_id
        ).first()

        if notification:
            notification.is_read = True
            db.session.commit()
            return True
        return False

    def delete_notification(self, notification_id, user_id):
        """Delete a notification."""
        notification = Notification.query.filter_by(
            id=notification_id,
            user_id=user_id
        ).first()

        if notification:
            db.session.delete(notification)
            db.session.commit()
            return True
        return False

    def send_blood_request_notification(self, donor_ids, hospital_name, blood_type):
        """Send notifications for a new blood request."""
        for donor_id in donor_ids:
            self.create_notification(
                donor_id,
                'blood_request',
                {
                    'hospital_name': hospital_name,
                    'blood_type': blood_type
                }
            )

    def send_emergency_notification(self, donor_ids, hospital_name, blood_type):
        """Send emergency blood request notifications."""
        for donor_id in donor_ids:
            self.create_notification(
                donor_id,
                'emergency',
                {
                    'hospital_name': hospital_name,
                    'blood_type': blood_type
                }
            )

    def send_donation_reminder(self, donor_id):
        """Send donation eligibility reminder."""
        self.create_notification(
            donor_id,
            'donation_reminder',
            {}
        ) 