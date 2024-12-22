from app import create_app, db
from app.models import Donor, Hospital

def create_test_users():
    app = create_app()
    
    with app.app_context():
        # Create test donor
        donor = Donor(
            email='donor@test.com',
            name='Test Donor',
            blood_type='O+',
            phone='1234567890',
            is_available=True
        )
        donor.set_password('password123')

        # Create test hospital
        hospital = Hospital(
            email='hospital@test.com',
            name='Test Hospital',
            address='123 Test St',
            phone='0987654321',
            license_number='TEST123'
        )
        hospital.set_password('password123')

        try:
            db.session.add(donor)
            db.session.add(hospital)
            db.session.commit()
            print("Test users created successfully!")
            print("\nTest Donor Credentials:")
            print("Email: donor@test.com")
            print("Password: password123")
            print("\nTest Hospital Credentials:")
            print("Email: hospital@test.com")
            print("Password: password123")
        except Exception as e:
            print(f"Error creating test users: {e}")
            db.session.rollback()

if __name__ == "__main__":
    create_test_users() 