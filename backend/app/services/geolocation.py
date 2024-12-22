from math import radians, sin, cos, sqrt, atan2
from app import db
from app.models.donor import Donor
from app.models.hospital import Hospital
from sqlalchemy import text

class GeolocationService:
    def __init__(self):
        self.EARTH_RADIUS = 6371  # Earth's radius in kilometers

    def calculate_distance(self, lat1, lon1, lat2, lon2):
        """Calculate distance between two points using Haversine formula."""
        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
        
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * atan2(sqrt(a), sqrt(1-a))
        
        return self.EARTH_RADIUS * c

    def find_nearby_donors(self, latitude, longitude, radius=10, blood_type=None):
        """Find donors within a specified radius."""
        # Using SQL for more efficient geospatial query
        query = text("""
            SELECT id, name, blood_type, latitude, longitude,
                   (6371 * acos(cos(radians(:lat)) * cos(radians(latitude)) *
                    cos(radians(longitude) - radians(:lon)) +
                    sin(radians(:lat)) * sin(radians(latitude)))) AS distance
            FROM donors
            WHERE is_available = TRUE
            HAVING distance < :radius
            ORDER BY distance
        """)
        
        result = db.session.execute(
            query,
            {
                'lat': latitude,
                'lon': longitude,
                'radius': radius
            }
        )
        
        donors = []
        for row in result:
            if blood_type and row.blood_type != blood_type:
                continue
            donors.append({
                'id': row.id,
                'name': row.name,
                'blood_type': row.blood_type,
                'distance': round(row.distance, 1)
            })
        
        return donors

    def find_nearby_hospitals(self, latitude, longitude, radius=10):
        """Find hospitals within a specified radius."""
        query = text("""
            SELECT id, name, address, latitude, longitude,
                   (6371 * acos(cos(radians(:lat)) * cos(radians(latitude)) *
                    cos(radians(longitude) - radians(:lon)) +
                    sin(radians(:lat)) * sin(radians(latitude)))) AS distance
            FROM hospitals
            WHERE is_verified = TRUE
            HAVING distance < :radius
            ORDER BY distance
        """)
        
        result = db.session.execute(
            query,
            {
                'lat': latitude,
                'lon': longitude,
                'radius': radius
            }
        )
        
        return [{
            'id': row.id,
            'name': row.name,
            'address': row.address,
            'distance': round(row.distance, 1)
        } for row in result]

    def update_location(self, user, latitude, longitude):
        """Update user's location."""
        user.latitude = latitude
        user.longitude = longitude
        db.session.commit() 