from app import db
from app.models.donor import Donor
from app.models.request import BloodRequest
from app.utils.blood_types import get_compatible_donors
from app.utils.geolocation import calculate_distance
from sqlalchemy import and_
from datetime import datetime

class MatchingService:
    def __init__(self):
        self.MAX_DISTANCE = 50  # Maximum distance in kilometers
        self.URGENCY_WEIGHTS = {
            'critical': 3.0,
            'urgent': 2.0,
            'normal': 1.0
        }

    def find_matching_donors(self, blood_request):
        """Find compatible donors for a blood request."""
        compatible_blood_types = get_compatible_donors(blood_request.blood_type)
        
        donors = Donor.query.filter(
            and_(
                Donor.is_available == True,
                Donor.blood_type.in_(compatible_blood_types)
            )
        ).all()

        matched_donors = []
        for donor in donors:
            distance = calculate_distance(
                blood_request.hospital.latitude,
                blood_request.hospital.longitude,
                donor.latitude,
                donor.longitude
            )
            
            if distance <= self.MAX_DISTANCE:
                score = self._calculate_match_score(donor, blood_request, distance)
                matched_donors.append({
                    'donor': donor,
                    'distance': distance,
                    'score': score
                })

        return sorted(matched_donors, key=lambda x: x['score'], reverse=True)

    def _calculate_match_score(self, donor, request, distance):
        """Calculate match score between donor and request."""
        score = 0.0
        
        # Distance score (inverse relationship)
        distance_score = 1 - (distance / self.MAX_DISTANCE)
        score += distance_score * 0.4  # 40% weight
        
        # Urgency score
        urgency_score = self.URGENCY_WEIGHTS.get(request.urgency_level, 1.0)
        score += urgency_score * 0.3  # 30% weight
        
        # Donation history score
        if donor.last_donation_date:
            days_since_donation = (datetime.utcnow() - donor.last_donation_date).days
            if days_since_donation >= 56:  # Standard waiting period
                score += 0.3  # 30% weight
        else:
            score += 0.3  # Never donated before
            
        return score

    def find_matching_requests(self, donor, max_distance=None):
        """Find compatible blood requests for a donor, sorted by matching score."""
        max_distance = max_distance or self.MAX_DISTANCE
        
        # Get basic compatible requests query
        compatible_requests = BloodRequest.query.filter(
            and_(
                BloodRequest.status == 'open',
                BloodRequest.blood_type == donor.blood_type
            )
        ).all()
        
        # Calculate scores and filter by distance
        scored_requests = []
        for request in compatible_requests:
            distance = calculate_distance(
                donor.latitude,
                donor.longitude,
                request.hospital.latitude,
                request.hospital.longitude
            )
            
            # Skip if request is too far
            if distance > max_distance:
                continue
            
            # Calculate matching score
            score = self._calculate_matching_score(
                donor=donor,
                request=request,
                distance=distance
            )
            
            scored_requests.append({
                'request': request,
                'score': score,
                'distance': distance
            })
        
        # Sort by score (highest first)
        return sorted(scored_requests, key=lambda x: x['score'], reverse=True)

    def get_emergency_matches(self, request):
        """Get immediate matches for emergency requests."""
        # For emergency requests, increase max distance and adjust scoring
        emergency_matches = self.find_matching_donors(
            request,
            max_distance=self.MAX_DISTANCE * 1.5  # 50% more distance for emergencies
        )
        
        # Filter for highly scored matches only
        return [match for match in emergency_matches if match['score'] > 0.7] 