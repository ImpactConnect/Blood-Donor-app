from app import create_app, db
import os

app = create_app()

with app.app_context():
    try:
        # Make sure the database file exists
        if not os.path.exists('bloodconnect.db'):
            db.create_all()
            print("Database created successfully!")
        else:
            print("Database already exists!")
        
        # Test the connection
        db.session.execute('SELECT 1')
        print("Database connection successful!")
        
    except Exception as e:
        print(f"Error: {str(e)}") 