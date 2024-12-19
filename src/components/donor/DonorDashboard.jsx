import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import useGeolocation from '../../hooks/useGeolocation'
import { calculateDistance, getAddressFromCoords } from '../../utils/locationUtils'
import './Donor.css'

function DonorDashboard() {
  const { user } = useAuth()
  const [isAvailable, setIsAvailable] = useState(false)
  const [donations, setDonations] = useState([])
  const [nearbyRequests, setNearbyRequests] = useState([])
  const { location, error: locationError } = useGeolocation()
  const [address, setAddress] = useState('')

  useEffect(() => {
    if (location) {
      // Update user's location in the backend
      updateUserLocation(location)
      // Get formatted address
      getAddressFromCoords(location.latitude, location.longitude)
        .then(addr => setAddress(addr))
    }
  }, [location])

  const updateUserLocation = async (location) => {
    try {
      await fetch('/api/donors/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: location.latitude,
          longitude: location.longitude
        })
      })
    } catch (error) {
      console.error('Error updating location:', error)
    }
  }

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Include current location in the requests
        const locationQuery = location 
          ? `?lat=${location.latitude}&lon=${location.longitude}`
          : ''
        const [donationsData, requestsData] = await Promise.all([
          fetch('/api/donations/history').then(res => res.json()),
          fetch(`/api/requests/nearby${locationQuery}`).then(res => res.json())
        ])
        
        setDonations(donationsData)
        // Sort requests by distance if location is available
        if (location) {
          const sortedRequests = requestsData.map(request => ({
            ...request,
            distance: calculateDistance(
              location.latitude,
              location.longitude,
              request.latitude,
              request.longitude
            )
          })).sort((a, b) => a.distance - b.distance)
          setNearbyRequests(sortedRequests)
        } else {
          setNearbyRequests(requestsData)
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      }
    }

    fetchDashboardData()
  }, [location])  // Add location as dependency

  const handleAvailabilityToggle = async () => {
    try {
      // Update availability status in backend
      await fetch('/api/donors/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !isAvailable })
      })
      
      setIsAvailable(!isAvailable)
    } catch (error) {
      console.error('Error updating availability:', error)
    }
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome, {user?.name}</h1>
        {locationError && (
          <div className="location-error">
            Please enable location services to see nearby requests
          </div>
        )}
        <div className="availability-toggle">
          <label className="switch">
            <input
              type="checkbox"
              checked={isAvailable}
              onChange={handleAvailabilityToggle}
            />
            <span className="slider round"></span>
          </label>
          <span>Available for donation</span>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h2>Your Profile</h2>
          <div className="profile-info">
            <p><strong>Blood Type:</strong> {user?.bloodType}</p>
            <p><strong>Location:</strong> {address || 'Updating...'}</p>
            <p><strong>Last Donation:</strong> {donations[0]?.date || 'No donations yet'}</p>
          </div>
        </div>

        <div className="dashboard-card">
          <h2>Donation History</h2>
          <div className="donation-list">
            {donations.length > 0 ? (
              donations.map(donation => (
                <div key={donation.id} className="donation-item">
                  <div className="donation-date">{new Date(donation.date).toLocaleDateString()}</div>
                  <div className="donation-hospital">{donation.hospitalName}</div>
                  <div className="donation-status">{donation.status}</div>
                </div>
              ))
            ) : (
              <p>No donation history yet</p>
            )}
          </div>
        </div>

        <div className="dashboard-card">
          <h2>Nearby Blood Requests</h2>
          <div className="requests-list">
            {nearbyRequests.map(request => (
              <div key={request.id} className="request-item">
                <div className="request-header">
                  <span className="blood-type">{request.bloodType}</span>
                  <span className={`urgency ${request.urgency}`}>
                    {request.urgency}
                  </span>
                </div>
                <div className="request-hospital">{request.hospitalName}</div>
                <div className="request-distance">{request.distance}km away</div>
                <button className="respond-btn">Respond to Request</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DonorDashboard 