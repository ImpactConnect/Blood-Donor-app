from app import db
from .user import User
from sqlalchemy import Float

class Hospital(User):
    __tablename__ = 'hospitals'
    
    id = db.Column(db.Integer, db.ForeignKey('user.id'), primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    address = db.Column(db.String(200), nullable=False)
    phone = db.Column(db.String(20))
    license_number = db.Column(db.String(50))
    latitude = db.Column(Float)
    longitude = db.Column(Float)
    
    blood_requests = db.relationship('BloodRequest', back_populates='hospital', lazy=True)
    donations = db.relationship('Donation', back_populates='hospital', lazy=True)
    
    __mapper_args__ = {
        'polymorphic_identity': 'hospital'
    } 