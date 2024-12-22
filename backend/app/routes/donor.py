from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Donor, BloodRequest, DonorResponse, Donation
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

donor_bp = Blueprint('donor', __name__)

@donor_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get donor profile information."""
    try:
        donor_id = get_jwt_identity()
        donor = Donor.query.get(int(donor_id))
        
        if not donor:
            return jsonify({'error': 'Donor not found'}), 404

        return jsonify({
            'id': donor.id,
            'name': donor.name,
            'email': donor.email,
            'blood_type': donor.blood_type,
            'phone': donor.phone or '',
            'address': donor.address or '',
            'is_available': donor.is_available,
            'last_donation_date': donor.last_donation_date.isoformat() if donor.last_donation_date else None
        }), 200

    except Exception as e:
        logger.error(f"Error getting donor profile: {str(e)}")
        return jsonify({'error': str(e)}), 500

@donor_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update donor profile information."""
    try:
        donor_id = get_jwt_identity()
        donor = Donor.query.get(int(donor_id))
        
        if not donor:
            return jsonify({'error': 'Donor not found'}), 404

        data = request.get_json()
        
        # Update fields
        for field in ['name', 'phone', 'address', 'is_available']:
            if field in data:
                setattr(donor, field, data[field])

        db.session.commit()
        
        return jsonify({
            'message': 'Profile updated successfully',
            'donor': {
                'id': donor.id,
                'name': donor.name,
                'email': donor.email,
                'blood_type': donor.blood_type,
                'phone': donor.phone,
                'address': donor.address,
                'is_available': donor.is_available,
                'last_donation_date': donor.last_donation_date.isoformat() if donor.last_donation_date else None
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating donor profile: {str(e)}")
        return jsonify({'error': str(e)}), 500

@donor_bp.route('/donations', methods=['GET'])
@jwt_required()
def get_donations():
    """Get donor's donation history."""
    try:
        donor_id = get_jwt_identity()
        donor = Donor.query.get(int(donor_id))
        
        if not donor:
            return jsonify({'error': 'Donor not found'}), 404

        donations = Donation.query.filter_by(donor_id=donor.id)\
            .order_by(Donation.donation_date.desc()).all()

        return jsonify([{
            'id': d.id,
            'blood_type': d.blood_type,
            'units': d.units,
            'donation_date': d.donation_date.isoformat(),
            'hospital_name': d.hospital.name,
            'notes': d.notes
        } for d in donations]), 200

    except Exception as e:
        logger.error(f"Error getting donation history: {str(e)}")
        return jsonify({'error': str(e)}), 500

@donor_bp.route('/availability', methods=['PUT'])
@jwt_required()
def update_availability():
    try:
        donor_id = get_jwt_identity()
        donor = Donor.query.get(int(donor_id))
        
        if not donor:
            return jsonify({'error': 'Donor not found'}), 404

        data = request.get_json()
        is_available = data.get('is_available')
        
        if is_available is None:
            return jsonify({'error': 'is_available field is required'}), 400

        # Check if donor is eligible to be available
        if is_available:
            last_donation = Donation.query.filter_by(
                donor_id=donor.id,
                status='completed'
            ).order_by(Donation.donation_date.desc()).first()
            
            if last_donation:
                days_since_donation = (datetime.utcnow() - last_donation.donation_date).days
                if days_since_donation < 56:  # 56 days = 8 weeks minimum between donations
                    return jsonify({
                        'error': 'Must wait 8 weeks between donations',
                        'days_remaining': 56 - days_since_donation
                    }), 400

        donor.is_available = is_available
        db.session.commit()
        
        return jsonify({
            'message': 'Availability updated successfully',
            'is_available': donor.is_available
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating donor availability: {str(e)}")
        return jsonify({'error': str(e)}), 500

@donor_bp.route('/nearby-requests', methods=['GET'])
@jwt_required()
def get_nearby_requests():
    try:
        donor_id = get_jwt_identity()
        donor = Donor.query.get(int(donor_id))
        
        if not donor:
            return jsonify({'error': 'Donor not found'}), 404

        # Get matching blood requests
        requests = BloodRequest.query.filter_by(
            blood_type=donor.blood_type,
            status='open'
        ).order_by(BloodRequest.created_at.desc()).all()

        return jsonify([r.to_dict() for r in requests]), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@donor_bp.route('/respond/<int:request_id>', methods=['POST'])
@jwt_required()
def respond_to_request(request_id):
    try:
        donor_id = get_jwt_identity()
        donor = Donor.query.get(int(donor_id))
        
        if not donor:
            return jsonify({'error': 'Donor not found'}), 404

        blood_request = BloodRequest.query.get(request_id)
        if not blood_request:
            return jsonify({'error': 'Request not found'}), 404

        # Check if already responded
        existing_response = DonorResponse.query.filter_by(
            request_id=request_id,
            donor_id=donor.id
        ).first()

        if existing_response:
            return jsonify({'error': 'Already responded to this request'}), 400

        response = DonorResponse(
            request_id=request_id,
            donor_id=donor.id
        )
        
        db.session.add(response)
        db.session.commit()

        return jsonify({'message': 'Response recorded successfully'}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500 