from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Hospital, BloodRequest, DonorResponse, Donation, Donor
import logging

# Set up logger
logger = logging.getLogger(__name__)

hospital_bp = Blueprint('hospital', __name__)

@hospital_bp.route('/profile', methods=['GET', 'PUT'])
@jwt_required()
def profile():
    try:
        hospital_id = get_jwt_identity()
        hospital = Hospital.query.get(int(hospital_id))
        
        if not hospital:
            return jsonify({'error': 'Hospital not found'}), 404

        if request.method == 'GET':
            return jsonify(hospital.to_dict()), 200

        # Handle PUT request
        data = request.get_json()
        for field in ['name', 'address', 'phone', 'latitude', 'longitude']:
            if field in data:
                setattr(hospital, field, data[field])

        db.session.commit()
        return jsonify({'message': 'Profile updated successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@hospital_bp.route('/requests', methods=['GET'])
@jwt_required()
def get_requests():
    try:
        hospital_id = get_jwt_identity()
        hospital = Hospital.query.get(int(hospital_id))
        
        if not hospital:
            return jsonify({'error': 'Hospital not found'}), 404

        requests = BloodRequest.query.filter_by(hospital_id=hospital.id)\
            .order_by(BloodRequest.created_at.desc()).all()
        
        return jsonify([request.to_dict() for request in requests]), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@hospital_bp.route('/requests', methods=['POST'])
@jwt_required()
def create_request():
    """Create a new blood request."""
    try:
        hospital_id = get_jwt_identity()
        hospital = Hospital.query.get(int(hospital_id))
        
        if not hospital:
            return jsonify({'error': 'Hospital not found'}), 404

        data = request.get_json()
        logger.info(f"Creating blood request with data: {data}")

        # Validate required fields
        required_fields = ['bloodType', 'units', 'urgency']
        if not all(field in data for field in required_fields):
            return jsonify({
                'error': 'Missing required fields',
                'required': required_fields
            }), 400

        new_request = BloodRequest(
            hospital_id=hospital.id,
            blood_type=data['bloodType'],
            units_needed=data['units'],
            urgency_level=data['urgency'],
            description=data.get('description', ''),
            status='open'
        )
        
        db.session.add(new_request)
        db.session.commit()
        
        response_data = {
            'message': 'Request created successfully',
            'request': {
                'id': new_request.id,
                'bloodType': new_request.blood_type,
                'units': new_request.units_needed,
                'urgency': new_request.urgency_level,
                'status': new_request.status,
                'description': new_request.description,
                'created_at': new_request.created_at.isoformat(),
                'responses': 0
            }
        }
        
        logger.info(f"Blood request created successfully: {response_data}")
        return jsonify(response_data), 201

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating blood request: {str(e)}")
        return jsonify({'error': str(e)}), 500

@hospital_bp.route('/requests/<int:request_id>/responses', methods=['GET'])
@jwt_required()
def get_request_responses(request_id):
    try:
        hospital_id = get_jwt_identity()
        hospital = Hospital.query.get(int(hospital_id))
        
        if not hospital:
            return jsonify({'error': 'Hospital not found'}), 404

        blood_request = BloodRequest.query.get(request_id)
        if not blood_request or blood_request.hospital_id != hospital.id:
            return jsonify({'error': 'Request not found'}), 404

        responses = DonorResponse.query.filter_by(request_id=request_id).all()
        return jsonify([response.to_dict() for response in responses]), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@hospital_bp.route('/donations', methods=['POST'])
@jwt_required()
def record_donation():
    try:
        hospital_id = get_jwt_identity()
        hospital = Hospital.query.get(int(hospital_id))
        
        if not hospital:
            return jsonify({'error': 'Hospital not found'}), 404

        data = request.get_json()
        donation = Donation(
            donor_id=data['donor_id'],
            hospital_id=hospital.id,
            request_id=data.get('request_id'),
            blood_type=data['blood_type'],
            units=data['units'],
            donation_date=data['donation_date'],
            notes=data.get('notes')
        )
        
        db.session.add(donation)
        
        # Update donor's last donation date
        donor = Donor.query.get(data['donor_id'])
        if donor:
            donor.last_donation_date = donation.donation_date
            donor.is_available = False  # Make donor unavailable after donation
        
        db.session.commit()
        
        return jsonify({
            'message': 'Donation recorded successfully',
            'donation': donation.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@hospital_bp.route('/available-donors', methods=['GET'])
@jwt_required()
def get_available_donors():
    """Get list of available donors."""
    try:
        hospital_id = get_jwt_identity()
        hospital = Hospital.query.get(int(hospital_id))
        
        if not hospital:
            return jsonify({'error': 'Hospital not found'}), 404

        # Get available donors
        donors = Donor.query.filter_by(is_available=True).all()
        
        return jsonify([{
            'id': donor.id,
            'name': donor.name,
            'bloodType': donor.blood_type,
            'lastDonation': donor.last_donation_date.isoformat() if donor.last_donation_date else None,
            'distance': None  # Calculate distance if needed
        } for donor in donors])

    except Exception as e:
        logger.error(f"Error getting available donors: {str(e)}")
        return jsonify({'error': 'Failed to fetch available donors'}), 500 