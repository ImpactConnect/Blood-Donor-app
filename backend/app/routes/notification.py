from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.notification import NotificationService

notification_bp = Blueprint('notification', __name__)
notification_service = NotificationService()

@notification_bp.route('/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    """Get user's notifications."""
    current_user = get_jwt_identity()
    notifications = notification_service.get_user_notifications(current_user['user_id'])
    
    return jsonify([{
        'id': n.id,
        'title': n.title,
        'message': n.message,
        'type': n.type,
        'is_read': n.is_read,
        'created_at': n.created_at.isoformat()
    } for n in notifications])

@notification_bp.route('/notifications/<int:notification_id>/read', methods=['POST'])
@jwt_required()
def mark_notification_read(notification_id):
    """Mark a notification as read."""
    current_user = get_jwt_identity()
    success = notification_service.mark_as_read(notification_id, current_user['user_id'])
    
    if success:
        return jsonify({'message': 'Notification marked as read'})
    return jsonify({'error': 'Notification not found'}), 404

@notification_bp.route('/notifications/<int:notification_id>', methods=['DELETE'])
@jwt_required()
def delete_notification(notification_id):
    """Delete a notification."""
    current_user = get_jwt_identity()
    success = notification_service.delete_notification(
        notification_id,
        current_user['user_id']
    )
    
    if success:
        return jsonify({'message': 'Notification deleted'})
    return jsonify({'error': 'Notification not found'}), 404 