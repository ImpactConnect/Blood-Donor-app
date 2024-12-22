from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_socketio import SocketIO
from .config import Config

db = SQLAlchemy()
jwt = JWTManager()
socketio = SocketIO()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    CORS(app)
    socketio.init_app(app, cors_allowed_origins="*")

    with app.app_context():
        # Import routes
        from .routes.emergency import emergency_bp
        from .routes.auth import auth_bp
        from .routes.donor import donor_bp
        from .routes.hospital import hospital_bp
        from .routes.admin import admin_bp
        from .routes.notification import notification_bp
        from .routes.matching import matching_bp

        # Register blueprints
        app.register_blueprint(emergency_bp)
        app.register_blueprint(auth_bp, url_prefix='/api/auth')
        app.register_blueprint(donor_bp, url_prefix='/api/donor')
        app.register_blueprint(hospital_bp, url_prefix='/api/hospital')
        app.register_blueprint(admin_bp, url_prefix='/api/admin')
        app.register_blueprint(notification_bp, url_prefix='/api/notifications')
        app.register_blueprint(matching_bp, url_prefix='/api/matching')

        # Create database tables
        db.create_all()

    return app 