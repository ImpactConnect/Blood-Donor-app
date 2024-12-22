from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Donor, BloodRequest, DonorResponse, Donation

donor_bp = Blueprint('donor', __name__)

@donor_bp.route('/profile', methods=['GET', 'PUT'])
@jwt_required()
def profile():
    try:
        donor_id = get_jwt_identity()
        donor = Donor.query.get(int(donor_id))
        
        if not donor:
            return jsonify({'error': 'Donor not found'}), 404

        if request.method == 'GET':
            return jsonify(donor.to_dict()), 200

        # Handle PUT request
        data = request.get_json()
        for field in ['name', 'phone', 'latitude', 'longitude']:
            if field in data:
                setattr(donor, field, data[field])

        db.session.commit()
        return jsonify({'message': 'Profile updated successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@donor_bp.route('/availability', methods=['POST'])
@jwt_required()
def toggle_availability():
    try:
        donor_id = get_jwt_identity()
        donor = Donor.query.get(int(donor_id))
        
        if not donor:
            return jsonify({'error': 'Donor not found'}), 404

        data = request.get_json()
        donor.is_available = data['is_available']
        db.session.commit()

        return jsonify({
            'message': 'Availability updated',
            'is_available': donor.is_available
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@donor_bp.route('/donations', methods=['GET'])
@jwt_required()
def get_donations():
    try:
        donor_id = get_jwt_identity()
        donations = Donation.query.filter_by(donor_id=int(donor_id))\
            .order_by(Donation.donation_date.desc()).all()
        
        return jsonify([d.to_dict() for d in donations]), 200

    except Exception as e:
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