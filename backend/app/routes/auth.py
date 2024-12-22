from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    get_jwt_identity,
    jwt_required
)
from .. import db
from app.models.user import User
from app.models.donor import Donor
from app.models.hospital import Hospital
from datetime import datetime
import logging

auth_bp = Blueprint('auth', __name__)
logger = logging.getLogger(__name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        logger.info(f"Registration attempt for email: {data.get('email')}")
        
        # Validate required fields
        required_fields = ['email', 'password', 'user_type']
        if not all(field in data for field in required_fields):
            return jsonify({
                'error': 'Missing required fields',
                'required': required_fields
            }), 400

        # Check if user already exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already registered'}), 409

        try:
            # Create user based on type
            if data['user_type'] == 'donor':
                # Validate donor-specific fields
                if not all(field in data for field in ['name', 'blood_type']):
                    return jsonify({
                        'error': 'Missing required donor fields',
                        'required': ['name', 'blood_type']
                    }), 400

                user = Donor(
                    email=data['email'],
                    name=data['name'],
                    blood_type=data['blood_type'],
                    phone=data.get('phone'),
                    latitude=data.get('latitude'),
                    longitude=data.get('longitude')
                )
            elif data['user_type'] == 'hospital':
                # Validate hospital-specific fields
                if not all(field in data for field in ['name', 'address']):
                    return jsonify({
                        'error': 'Missing required hospital fields',
                        'required': ['name', 'address']
                    }), 400

                user = Hospital(
                    email=data['email'],
                    name=data['name'],
                    address=data['address'],
                    phone=data.get('phone'),
                    license_number=data.get('license_number'),
                    latitude=data.get('latitude'),
                    longitude=data.get('longitude')
                )
            else:
                return jsonify({'error': 'Invalid user type'}), 400

            # Set password
            user.set_password(data['password'])
            
            # Save to database
            db.session.add(user)
            db.session.commit()
            
            logger.info(f"Successfully registered user: {user.email}")

            # Create tokens with string subject and additional claims
            subject = str(user.id)
            additional_claims = {
                'email': user.email,
                'user_type': user.user_type,
                'is_verified': user.is_verified
            }
            
            access_token = create_access_token(
                identity=subject,
                additional_claims=additional_claims
            )
            refresh_token = create_refresh_token(
                identity=subject,
                additional_claims=additional_claims
            )

            return jsonify({
                'message': 'User registered successfully',
                'access_token': access_token,
                'refresh_token': refresh_token,
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'user_type': user.user_type,
                    'name': user.name
                }
            }), 201

        except Exception as e:
            db.session.rollback()
            logger.error(f"Database error during registration: {str(e)}")
            return jsonify({'error': 'Database error during registration'}), 500

    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        return jsonify({'error': 'Failed to process registration request'}), 400

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        logger.info(f"Login attempt for email: {data.get('email')}")
        
        user = User.query.filter_by(email=data['email']).first()
        
        if not user:
            logger.warning(f"User not found: {data.get('email')}")
            return jsonify({'error': 'Invalid email or password'}), 401
        
        if not user.check_password(data['password']):
            logger.warning(f"Invalid password for user: {data.get('email')}")
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Create tokens
        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))
        
        logger.info(f"Login successful for user: {user.email}")
        
        return jsonify({
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': {
                'id': user.id,
                'email': user.email,
                'user_type': user.user_type,
                'name': user.name if hasattr(user, 'name') else None,
                'is_verified': user.is_verified
            }
        }), 200

    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({'error': 'Login failed'}), 500

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    try:
        current_user_id = get_jwt_identity()
        access_token = create_access_token(identity=current_user_id)
        return jsonify({'access_token': access_token}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    current_user = get_jwt_identity()
    user = User.query.get(current_user['user_id'])
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    user_data = {
        'id': user.id,
        'email': user.email,
        'user_type': user.user_type,
        'is_verified': user.is_verified,
        'created_at': user.created_at.isoformat()
    }
    
    # Add type-specific fields
    if user.user_type == 'donor':
        user_data.update({
            'name': user.name,
            'blood_type': user.blood_type,
            'phone': user.phone,
            'is_available': user.is_available,
            'last_donation_date': user.last_donation_date.isoformat() if user.last_donation_date else None
        })
    elif user.user_type == 'hospital':
        user_data.update({
            'name': user.name,
            'address': user.address,
            'phone': user.phone,
            'license_number': user.license_number
        })
    
    return jsonify(user_data), 200

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    current_user = get_jwt_identity()
    user = User.query.get(current_user['user_id'])
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    
    if not user.check_password(data['current_password']):
        return jsonify({'error': 'Current password is incorrect'}), 401
    
    user.set_password(data['new_password'])
    db.session.commit()
    
    return jsonify({'message': 'Password updated successfully'}), 200 