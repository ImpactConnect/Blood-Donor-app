import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import useGeolocation from '../../hooks/useGeolocation'
import { calculateDistance, sortByDistance } from '../../utils/locationUtils'
import './Hospital.css'

function HospitalDashboard() {
  const { user } = useAuth()
  const [activeRequests, setActiveRequests] = useState([])
  const [availableDonors, setAvailableDonors] = useState([])
  const { location } = useGeolocation()
  const [newRequest, setNewRequest] = useState({
    bloodType: '',
    units: 1,
    urgency: 'normal',
    description: ''
  })

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const locationQuery = location 
          ? `?lat=${location.latitude}&lon=${location.longitude}`
          : ''
        const [requestsData, donorsData] = await Promise.all([
          fetch('/api/hospital/requests').then(res => res.json()),
          fetch(`/api/hospital/available-donors${locationQuery}`).then(res => res.json())
        ])
        
        setActiveRequests(requestsData)
        if (location) {
          const sortedDonors = donorsData.map(donor => ({
            ...donor,
            distance: calculateDistance(
              location.latitude,
              location.longitude,
              donor.latitude,
              donor.longitude
            )
          })).sort((a, b) => a.distance - b.distance)
          setAvailableDonors(sortedDonors)
        } else {
          setAvailableDonors(donorsData)
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      }
    }

    fetchDashboardData()
  }, [location])

  const handleNewRequest = async (e) => {
    e.preventDefault()
    try {
      const requestData = {
        ...newRequest,
        latitude: location?.latitude,
        longitude: location?.longitude
      }
      const response = await fetch('/api/hospital/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })

      if (response.ok) {
        const data = await response.json()
        setActiveRequests(prev => [...prev, data])
        setNewRequest({
          bloodType: '',
          units: 1,
          urgency: 'normal',
          description: ''
        })
      }
    } catch (error) {
      console.error('Error creating request:', error)
    }
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Hospital Dashboard - {user?.name}</h1>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h2>Create Blood Request</h2>
          <form onSubmit={handleNewRequest} className="request-form">
            <div className="form-group">
              <label htmlFor="bloodType">Blood Type Needed</label>
              <select
                id="bloodType"
                value={newRequest.bloodType}
                onChange={(e) => setNewRequest(prev => ({
                  ...prev,
                  bloodType: e.target.value
                }))}
                required
              >
                <option value="">Select Blood Type</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="units">Units Required</label>
              <input
                type="number"
                id="units"
                min="1"
                value={newRequest.units}
                onChange={(e) => setNewRequest(prev => ({
                  ...prev,
                  units: parseInt(e.target.value)
                }))}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="urgency">Urgency Level</label>
              <select
                id="urgency"
                value={newRequest.urgency}
                onChange={(e) => setNewRequest(prev => ({
                  ...prev,
                  urgency: e.target.value
                }))}
                required
              >
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="description">Additional Details</label>
              <textarea
                id="description"
                value={newRequest.description}
                onChange={(e) => setNewRequest(prev => ({
                  ...prev,
                  description: e.target.value
                }))}
              />
            </div>

            <button type="submit" className="submit-btn">
              Create Request
            </button>
          </form>
        </div>

        <div className="dashboard-card">
          <h2>Active Requests</h2>
          <div className="requests-list">
            {activeRequests.map(request => (
              <div key={request.id} className="request-item">
                <div className="request-header">
                  <span className="blood-type">{request.bloodType}</span>
                  <span className={`urgency ${request.urgency}`}>
                    {request.urgency}
                  </span>
                </div>
                <div className="request-details">
                  <p>Units needed: {request.units}</p>
                  <p>Responses: {request.responses}</p>
                </div>
                <button className="view-responses-btn">
                  View Responses
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-card">
          <h2>Available Donors Nearby</h2>
          <div className="donors-list">
            {availableDonors.map(donor => (
              <div key={donor.id} className="donor-item">
                <div className="donor-info">
                  <span className="blood-type">{donor.bloodType}</span>
                  <span className="donor-name">{donor.name}</span>
                  <span className="donor-distance">{donor.distance}km away</span>
                </div>
                <button className="contact-btn">Contact Donor</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default HospitalDashboard 