from app import db
from datetime import datetime

class BloodRequest(db.Model):
    __tablename__ = 'blood_requests'

    id = db.Column(db.Integer, primary_key=True)
    hospital_id = db.Column(db.Integer, db.ForeignKey('hospitals.id'), nullable=False)
    blood_type = db.Column(db.String(5), nullable=False)
    units_needed = db.Column(db.Integer, nullable=False)
    urgency_level = db.Column(db.String(20), nullable=False)  # normal, urgent, critical
    status = db.Column(db.String(20), default='open')  # open, fulfilled, cancelled
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Update relationships to use back_populates
    hospital = db.relationship('Hospital', back_populates='blood_requests')
    responses = db.relationship('DonorResponse', back_populates='request', lazy=True, cascade='all, delete-orphan')
    donations = db.relationship('Donation', back_populates='request', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'hospital_id': self.hospital_id,
            'hospital_name': self.hospital.name,
            'blood_type': self.blood_type,
            'units_needed': self.units_needed,
            'urgency_level': self.urgency_level,
            'status': self.status,
            'description': self.description,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'response_count': len(self.responses)
        }

class DonorResponse(db.Model):
    __tablename__ = 'donor_responses'

    id = db.Column(db.Integer, primary_key=True)
    request_id = db.Column(db.Integer, db.ForeignKey('blood_requests.id'), nullable=False)
    donor_id = db.Column(db.Integer, db.ForeignKey('donors.id'), nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, accepted, rejected
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Update relationships
    request = db.relationship('BloodRequest', back_populates='responses')
    donor = db.relationship('Donor', backref='responses')

    def to_dict(self):
        return {
            'id': self.id,
            'request_id': self.request_id,
            'donor_id': self.donor_id,
            'donor_name': self.donor.name,
            'status': self.status,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        } 