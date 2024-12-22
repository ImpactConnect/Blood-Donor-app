from app import db
from datetime import datetime

class Donation(db.Model):
    __tablename__ = 'donations'

    id = db.Column(db.Integer, primary_key=True)
    donor_id = db.Column(db.Integer, db.ForeignKey('donors.id'), nullable=False)
    hospital_id = db.Column(db.Integer, db.ForeignKey('hospitals.id'), nullable=False)
    request_id = db.Column(db.Integer, db.ForeignKey('blood_requests.id'))
    blood_type = db.Column(db.String(5), nullable=False)
    units = db.Column(db.Integer, default=1)
    donation_date = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(20), default='completed')  # scheduled, completed, cancelled
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Update relationships to use back_populates
    donor = db.relationship('Donor', back_populates='donations')
    hospital = db.relationship('Hospital', back_populates='donations')
    request = db.relationship('BloodRequest', back_populates='donations')

    def to_dict(self):
        return {
            'id': self.id,
            'donor_id': self.donor_id,
            'donor_name': self.donor.name,
            'hospital_id': self.hospital_id,
            'hospital_name': self.hospital.name,
            'request_id': self.request_id,
            'blood_type': self.blood_type,
            'units': self.units,
            'donation_date': self.donation_date.isoformat(),
            'status': self.status,
            'notes': self.notes,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        } 