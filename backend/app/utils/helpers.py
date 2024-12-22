from datetime import datetime, timedelta
from math import radians, sin, cos, sqrt, atan2

def calculate_distance(lat1, lon1, lat2, lon2):
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees)
    """
    # Convert decimal degrees to radians
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])

    # Haversine formula
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    r = 6371  # Radius of earth in kilometers

    return r * c

def format_distance(distance):
    """Format distance in a human-readable way."""
    if distance < 1:
        return f"{int(distance * 1000)}m"
    return f"{round(distance, 1)}km"

def can_donate(last_donation_date):
    """Check if enough time has passed since last donation (56 days)."""
    if not last_donation_date:
        return True
    days_since_donation = (datetime.utcnow() - last_donation_date).days
    return days_since_donation >= 56

def get_compatible_donors(blood_type):
    """Get list of compatible donor blood types for a given blood type."""
    compatibility_map = {
        'O-': ['O-'],
        'O+': ['O-', 'O+'],
        'A-': ['O-', 'A-'],
        'A+': ['O-', 'O+', 'A-', 'A+'],
        'B-': ['O-', 'B-'],
        'B+': ['O-', 'O+', 'B-', 'B+'],
        'AB-': ['O-', 'A-', 'B-', 'AB-'],
        'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+']
    }
    return compatibility_map.get(blood_type, [])

def can_donate_to(donor_type):
    """Get list of blood types that can receive blood from a given donor type."""
    compatibility_map = {
        'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
        'O+': ['O+', 'A+', 'B+', 'AB+'],
        'A-': ['A-', 'A+', 'AB-', 'AB+'],
        'A+': ['A+', 'AB+'],
        'B-': ['B-', 'B+', 'AB-', 'AB+'],
        'B+': ['B+', 'AB+'],
        'AB-': ['AB-', 'AB+'],
        'AB+': ['AB+']
    }
    return compatibility_map.get(donor_type, [])

def format_date(date):
    """Format date in a human-readable way."""
    return date.strftime("%B %d, %Y")

def calculate_match_score(donor, request, distance):
    """Calculate match score between donor and request."""
    score = 0.0
    max_distance = 50  # Maximum distance in kilometers
    
    # Distance score (inverse relationship)
    distance_score = 1 - (distance / max_distance)
    score += distance_score * 0.4  # 40% weight
    
    # Availability score
    if donor.is_available and can_donate(donor.last_donation_date):
        score += 0.3  # 30% weight
    
    # Urgency score
    urgency_weights = {
        'critical': 0.3,
        'urgent': 0.2,
        'normal': 0.1
    }
    score += urgency_weights.get(request.urgency_level, 0.1)
    
    return score 