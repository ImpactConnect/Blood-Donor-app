from app import db
from .user import User
from sqlalchemy import Float
from datetime import datetime

class Donor(User):
    __tablename__ = 'donors'
    
    id = db.Column(db.Integer, db.ForeignKey('user.id'), primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    blood_type = db.Column(db.String(5), nullable=False)
    phone = db.Column(db.String(20))
    address = db.Column(db.String(200))
    is_available = db.Column(db.Boolean, default=True)
    latitude = db.Column(Float)
    longitude = db.Column(Float)
    last_donation_date = db.Column(db.DateTime)
    
    donations = db.relationship('Donation', back_populates='donor', lazy=True)
    responses = db.relationship('DonorResponse', back_populates='donor', lazy=True)
    
    __mapper_args__ = {
        'polymorphic_identity': 'donor'
    }

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'blood_type': self.blood_type,
            'phone': self.phone,
            'address': self.address,
            'is_available': self.is_available,
            'last_donation_date': self.last_donation_date.isoformat() if self.last_donation_date else None
        } 