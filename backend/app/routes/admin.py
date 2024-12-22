from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import User, Donor, Hospital, BloodRequest, Donation
from datetime import datetime, timedelta
from sqlalchemy import func

admin_bp = Blueprint('admin', __name__)

def is_admin(user_id):
    """Check if user is an admin."""
    user = User.query.get(int(user_id))
    return user and user.is_admin

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def get_users():
    try:
        user_id = get_jwt_identity()
        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403

        user_type = request.args.get('type')
        is_verified = request.args.get('verified', type=bool)
        
        query = User.query
        
        if user_type:
            query = query.filter_by(user_type=user_type)
        if is_verified is not None:
            query = query.filter_by(is_verified=is_verified)
            
        users = query.all()
        
        return jsonify([{
            'id': u.id,
            'email': u.email,
            'user_type': u.user_type,
            'is_verified': u.is_verified,
            'created_at': u.created_at.isoformat()
        } for u in users]), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/hospitals/<int:hospital_id>/verify', methods=['POST'])
@jwt_required()
def verify_hospital(hospital_id):
    try:
        user_id = get_jwt_identity()
        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403

        hospital = Hospital.query.get(hospital_id)
        if not hospital:
            return jsonify({'error': 'Hospital not found'}), 404
            
        hospital.is_verified = True
        db.session.commit()
        
        return jsonify({'message': 'Hospital verified successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/statistics', methods=['GET'])
@jwt_required()
def get_statistics():
    try:
        user_id = get_jwt_identity()
        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403

        # Basic counts
        total_donors = Donor.query.count()
        total_hospitals = Hospital.query.count()
        total_donations = Donation.query.count()
        active_requests = BloodRequest.query.filter_by(status='open').count()
        
        # Blood type distribution
        blood_type_stats = db.session.query(
            Donor.blood_type,
            func.count(Donor.id)
        ).group_by(Donor.blood_type).all()
        
        # Recent activity
        recent_donations = Donation.query\
            .filter(Donation.created_at >= datetime.utcnow() - timedelta(days=30))\
            .count()
        
        return jsonify({
            'total_donors': total_donors,
            'total_hospitals': total_hospitals,
            'total_donations': total_donations,
            'active_requests': active_requests,
            'blood_type_distribution': dict(blood_type_stats),
            'recent_donations': recent_donations
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/users/<int:user_id>/status', methods=['PUT'])
@jwt_required()
def update_user_status(user_id):
    try:
        admin_id = get_jwt_identity()
        if not is_admin(admin_id):
            return jsonify({'error': 'Admin access required'}), 403

        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        data = request.get_json()
        user.is_active = data['is_active']
        db.session.commit()
        
        return jsonify({'message': 'User status updated successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500 