import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import useGeolocation from '../../hooks/useGeolocation'
import { donorService } from '../../services/donor.service'
import './Donor.css'

function DonorDashboard() {
  const { user } = useAuth()
  const [isAvailable, setIsAvailable] = useState(false)
  const [donations, setDonations] = useState([])
  const [nearbyRequests, setNearbyRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { location, error: locationError } = useGeolocation()
  const [address, setAddress] = useState('')

  useEffect(() => {
    if (location) {
      setError(null)
      donorService.updateProfile({
        latitude: location.latitude,
        longitude: location.longitude
      })
      .catch(err => {
        console.error('Error updating location:', err)
        setError('Failed to update location')
      })
    }
  }, [location])

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)
        const [donationsData, requestsData] = await Promise.all([
          donorService.getDonationHistory(),
          donorService.getNearbyRequests()
        ])
        
        setDonations(donationsData)
        setNearbyRequests(requestsData)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        setError('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [location])

  const handleAvailabilityToggle = async () => {
    try {
      await donorService.toggleAvailability(!isAvailable)
      setIsAvailable(!isAvailable)
    } catch (error) {
      console.error('Error updating availability:', error)
    }
  }

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    )
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