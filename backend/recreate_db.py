from app import create_app, db
from app.models.user import User
from app.models.donor import Donor
from app.models.hospital import Hospital
from app.models.request import BloodRequest, DonorResponse
from app.models.donation import Donation

app = create_app()

def recreate_database():
    with app.app_context():
        # Drop all tables
        print("Dropping all tables...")
        db.drop_all()
        
        # Create all tables
        print("Creating all tables...")
        db.create_all()
        
        print("Database recreated successfully!")

if __name__ == "__main__":
    recreate_database() 