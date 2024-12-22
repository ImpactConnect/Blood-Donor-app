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

def get_all_blood_types():
    """Get list of all blood types."""
    return ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+']

def is_compatible(donor_type, recipient_type):
    """Check if donor blood type is compatible with recipient blood type."""
    return recipient_type in can_donate_to(donor_type) 