from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.matching import MatchingService
from app.models.hospital import Hospital
from app.models.donor import Donor
from app.models.request import BloodRequest

matching_bp = Blueprint('matching', __name__)
matching_service = MatchingService()

@matching_bp.route('/match-donors/<int:request_id>', methods=['GET'])
@jwt_required()
def get_matching_donors(request_id):
    """Get matching donors for a specific blood request."""
    current_user = get_jwt_identity()
    hospital = Hospital.query.get(current_user['user_id'])
    
    if not hospital:
        return jsonify({'error': 'Hospital not found'}), 404
    
    blood_request = BloodRequest.query.get(request_id)
    if not blood_request or blood_request.hospital_id != hospital.id:
        return jsonify({'error': 'Request not found'}), 404
    
    matches = matching_service.find_matching_donors(blood_request)
    
    return jsonify({
        'matches': [{
            'donor_id': match['donor'].id,
            'name': match['donor'].name,
            'blood_type': match['donor'].blood_type,
            'distance': round(match['distance'], 1),
            'score': round(match['score'], 2),
            'last_donation': match['donor'].last_donation_date.isoformat() 
                if match['donor'].last_donation_date else None
        } for match in matches]
    })

@matching_bp.route('/match-requests', methods=['GET'])
@jwt_required()
def get_matching_requests():
    """Get matching blood requests for a donor."""
    current_user = get_jwt_identity()
    donor = Donor.query.get(current_user['user_id'])
    
    if not donor:
        return jsonify({'error': 'Donor not found'}), 404
    
    matches = matching_service.find_matching_requests(donor)
    
    return jsonify({
        'matches': [{
            'request_id': match['request'].id,
            'hospital_name': match['request'].hospital.name,
            'blood_type': match['request'].blood_type,
            'units_needed': match['request'].units_needed,
            'urgency_level': match['request'].urgency_level,
            'distance': round(match['distance'], 1),
            'score': round(match['score'], 2),
            'created_at': match['request'].created_at.isoformat()
        } for match in matches]
    })

@matching_bp.route('/emergency-matches/<int:request_id>', methods=['GET'])
@jwt_required()
def get_emergency_matches(request_id):
    """Get immediate matches for emergency requests."""
    current_user = get_jwt_identity()
    hospital = Hospital.query.get(current_user['user_id'])
    
    if not hospital:
        return jsonify({'error': 'Hospital not found'}), 404
    
    blood_request = BloodRequest.query.get(request_id)
    if not blood_request or blood_request.hospital_id != hospital.id:
        return jsonify({'error': 'Request not found'}), 404
    
    if blood_request.urgency_level != 'critical':
        return jsonify({'error': 'Request is not marked as critical'}), 400
    
    matches = matching_service.get_emergency_matches(blood_request)
    
    return jsonify({
        'matches': [{
            'donor_id': match['donor'].id,
            'name': match['donor'].name,
            'blood_type': match['donor'].blood_type,
            'distance': round(match['distance'], 1),
            'score': round(match['score'], 2),
            'phone': match['donor'].phone  # Include phone for emergency contact
        } for match in matches]
    }) 