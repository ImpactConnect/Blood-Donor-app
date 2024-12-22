from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Hospital, BloodRequest, DonorResponse, Donation, Donor
from app.services.notification import NotificationService
import logging
from datetime import datetime

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
def get_requests():
    """Get all blood requests."""
    try:
        # Get all active requests (not cancelled or fulfilled)
        requests = BloodRequest.query.filter(
            BloodRequest.status == 'open'
        ).order_by(BloodRequest.created_at.desc()).all()
        
        # Convert requests to dictionary format
        requests_data = [{
            'id': req.id,
            'bloodType': req.blood_type,
            'units': req.units_needed,
            'urgency': req.urgency_level,
            'status': req.status,
            'description': req.description,
            'created_at': req.created_at.isoformat(),
            'hospital_name': req.hospital.name,
            'location': req.hospital.address,
            'responses': len(req.responses)
        } for req in requests]
        
        logger.info(f"Fetched {len(requests_data)} active requests")
        return jsonify(requests_data), 200

    except Exception as e:
        logger.error(f"Error fetching requests: {str(e)}")
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

@hospital_bp.route('/requests/<int:request_id>/respond', methods=['POST'])
@jwt_required()
def respond_to_request(request_id):
    """Donor responds to a blood request."""
    try:
        donor_id = get_jwt_identity()
        donor = Donor.query.get(int(donor_id))
        
        if not donor:
            return jsonify({'error': 'Donor not found'}), 404

        blood_request = BloodRequest.query.get(request_id)
        if not blood_request:
            return jsonify({'error': 'Request not found'}), 404

        # Check if donor has already responded
        existing_response = DonorResponse.query.filter_by(
            request_id=request_id,
            donor_id=donor_id
        ).first()
        
        if existing_response:
            return jsonify({'error': 'Already responded to this request'}), 400

        # Create new response
        response = DonorResponse(
            request_id=request_id,
            donor_id=donor_id,
            status='pending'
        )
        
        db.session.add(response)
        db.session.commit()
        
        logger.info(f"Donor {donor_id} responded to request {request_id}")
        return jsonify({
            'message': 'Response recorded successfully',
            'response': response.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error recording response: {str(e)}")
        return jsonify({'error': str(e)}), 500

@hospital_bp.route('/contact/<int:hospital_id>', methods=['GET'])
@jwt_required()
def get_hospital_contact(hospital_id):
    """Get hospital contact information."""
    try:
        hospital = Hospital.query.get(hospital_id)
        if not hospital:
            return jsonify({'error': 'Hospital not found'}), 404

        return jsonify({
            'name': hospital.name,
            'phone': hospital.phone,
            'email': hospital.email,
            'address': hospital.address
        }), 200

    except Exception as e:
        logger.error(f"Error getting hospital contact: {str(e)}")
        return jsonify({'error': str(e)}), 500

@hospital_bp.route('/donor/<int:donor_id>/contact', methods=['GET'])
@jwt_required()
def get_donor_contact(donor_id):
    """Get donor contact information."""
    try:
        # Verify the requesting user is a hospital
        hospital_id = get_jwt_identity()
        hospital = Hospital.query.get(int(hospital_id))
        
        if not hospital:
            return jsonify({'error': 'Unauthorized access'}), 403

        donor = Donor.query.get(donor_id)
        if not donor:
            return jsonify({'error': 'Donor not found'}), 404

        return jsonify({
            'id': donor.id,
            'name': donor.name,
            'phone': donor.phone,
            'email': donor.email,
            'address': donor.address,
            'blood_type': donor.blood_type,
            'is_available': donor.is_available
        }), 200

    except Exception as e:
        logger.error(f"Error getting donor contact: {str(e)}")
        return jsonify({'error': str(e)}), 500

@hospital_bp.route('/requests/<int:request_id>/responses/<int:response_id>/accept', methods=['POST'])
@jwt_required()
def accept_donor_response(request_id, response_id):
    """Accept a donor's response to a blood request."""
    try:
        hospital_id = get_jwt_identity()
        hospital = Hospital.query.get(int(hospital_id))
        
        if not hospital:
            return jsonify({'error': 'Hospital not found'}), 404

        blood_request = BloodRequest.query.get(request_id)
        if not blood_request:
            return jsonify({'error': 'Request not found'}), 404
            
        if blood_request.hospital_id != hospital.id:
            return jsonify({'error': 'Unauthorized to accept this response'}), 403

        donor_response = DonorResponse.query.get(response_id)
        if not donor_response or donor_response.request_id != request_id:
            return jsonify({'error': 'Response not found'}), 404

        # Check if request is already fulfilled
        if blood_request.status == 'fulfilled':
            return jsonify({'error': 'Request is already fulfilled'}), 400

        # Check if response is already accepted
        if donor_response.status == 'accepted':
            return jsonify({'error': 'Response is already accepted'}), 400

        # Update response status
        donor_response.status = 'accepted'
        
        # Mark request as fulfilled
        blood_request.status = 'fulfilled'
        
        # Update donor availability
        donor = Donor.query.get(donor_response.donor_id)
        if donor:
            donor.is_available = False
            
        # Create a donation record
        donation = Donation(
            donor_id=donor_response.donor_id,
            hospital_id=hospital.id,
            request_id=request_id,
            blood_type=blood_request.blood_type,
            units=blood_request.units_needed,
            donation_date=datetime.utcnow(),
            status='scheduled'
        )
        
        db.session.add(donation)
        db.session.commit()
        
        # Send notifications
        notification_service = NotificationService()
        notification_service.send_donation_accepted_notification(donor.id, hospital.name)
        
        return jsonify({
            'message': 'Donor response accepted successfully',
            'request': blood_request.to_dict(),
            'response': donor_response.to_dict(),
            'donation': donation.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error accepting donor response: {str(e)}")
        return jsonify({'error': str(e)}), 500

@hospital_bp.route('/requests/fulfilled', methods=['GET'])
@jwt_required()
def get_fulfilled_requests():
    """Get hospital's fulfilled requests."""
    try:
        hospital_id = get_jwt_identity()
        hospital = Hospital.query.get(int(hospital_id))
        
        if not hospital:
            return jsonify({'error': 'Hospital not found'}), 404

        fulfilled_requests = BloodRequest.query.filter_by(
            hospital_id=hospital.id,
            status='fulfilled'
        ).order_by(BloodRequest.updated_at.desc()).all()
        
        return jsonify([{
            'id': req.id,
            'bloodType': req.blood_type,
            'units': req.units_needed,
            'urgency': req.urgency_level,
            'fulfilledAt': req.updated_at.isoformat(),
            'donorName': req.donations[0].donor.name if req.donations else None,
            'description': req.description
        } for req in fulfilled_requests]), 200

    except Exception as e:
        logger.error(f"Error fetching fulfilled requests: {str(e)}")
        return jsonify({'error': str(e)}), 500

@hospital_bp.route('/donations', methods=['GET'])
@jwt_required()
def get_donation_history():
    """Get hospital's donation history."""
    try:
        hospital_id = get_jwt_identity()
        hospital = Hospital.query.get(int(hospital_id))
        
        if not hospital:
            return jsonify({'error': 'Hospital not found'}), 404

        donations = Donation.query.filter_by(
            hospital_id=hospital.id
        ).order_by(Donation.donation_date.desc()).all()
        
        return jsonify([donation.to_dict() for donation in donations]), 200

    except Exception as e:
        logger.error(f"Error fetching donation history: {str(e)}")
        return jsonify({'error': str(e)}), 500