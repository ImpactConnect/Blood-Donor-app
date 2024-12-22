import PropTypes from 'prop-types'
import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { hospitalService } from '../../services/hospital.service'
import './Emergency.css'

function EmergencyRequests() {
  const { user } = useAuth()
  const [emergencyRequests, setEmergencyRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedHospital, setSelectedHospital] = useState(null)
  const [showContactModal, setShowContactModal] = useState(false)

  useEffect(() => {
    const fetchEmergencyRequests = async () => {
      try {
        setLoading(true)
        setError(null)
        console.log('Fetching requests...')
        
        const response = await hospitalService.getActiveRequests()
        console.log('All requests:', response)
        
        // No longer filtering by urgency - show all requests
        setEmergencyRequests(response)
      } catch (error) {
        console.error('Error fetching requests:', error)
        setError('Failed to load requests')
      } finally {
        setLoading(false)
      }
    }

    fetchEmergencyRequests()
    const interval = setInterval(fetchEmergencyRequests, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleRespond = async (requestId) => {
    try {
      await hospitalService.respondToRequest(requestId)
      setEmergencyRequests(prev =>
        prev.map(req =>
          req.id === requestId
            ? { ...req, hasResponded: true }
            : req
        )
      )
    } catch (error) {
      console.error('Error responding to request:', error)
    }
  }

  const handleContactHospital = async (request) => {
    try {
      const response = await hospitalService.getHospitalContact(request.hospital_id)
      setSelectedHospital(response)
      setShowContactModal(true)
    } catch (error) {
      console.error('Error getting hospital contact:', error)
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading emergency requests...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="emergency-container">
        <div className="error-message">{error}</div>
      </div>
    )
  }

  return (
    <div className="emergency-container">
      <div className="emergency-header">
        <h1>Blood Requests</h1>
        <div className="emergency-stats">
          <div className="stat-item">
            <span className="stat-value">{emergencyRequests.length}</span>
            <span className="stat-label">Active Requests</span>
          </div>
        </div>
      </div>

      <div className="emergency-grid">
        {emergencyRequests.length > 0 ? (
          emergencyRequests.map(request => (
            <div 
              key={request.id} 
              className={`emergency-card ${request.urgency.toLowerCase()}`}
            >
              <div className="emergency-card-header">
                <span className="blood-type">{request.bloodType}</span>
                <span className={`urgency-badge ${request.urgency}`}>
                  {request.urgency.toUpperCase()}
                </span>
              </div>

              <div className="hospital-info">
                <h3>{request.hospital_name}</h3>
                <p>{request.location}</p>
              </div>

              <div className="request-details">
                <div className="detail-item">
                  <span className="detail-label">Units Needed:</span>
                  <span className="detail-value">{request.units}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Time Posted:</span>
                  <span className="detail-value">
                    {new Date(request.created_at).toLocaleTimeString()}
                  </span>
                </div>
                {request.distance && (
                  <div className="detail-item">
                    <span className="detail-label">Distance:</span>
                    <span className="detail-value">{request.distance}km away</span>
                  </div>
                )}
              </div>

              {request.description && (
                <div className="request-description">
                  <p>{request.description}</p>
                </div>
              )}

              <div className="emergency-actions">
                {!request.hasResponded ? (
                  <button
                    onClick={() => handleRespond(request.id)}
                    className="respond-button"
                  >
                    Respond to Request
                  </button>
                ) : (
                  <button className="responded-button" disabled>
                    Response Recorded
                  </button>
                )}
                <button 
                  className="contact-button"
                  onClick={() => handleContactHospital(request)}
                >
                  Contact Hospital
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="no-requests">
            <h2>No Active Requests</h2>
            <p>There are currently no blood requests.</p>
          </div>
        )}
      </div>

      {showContactModal && selectedHospital && (
        <div className="modal">
          <div className="modal-content">
            <h3>Contact {selectedHospital.name}</h3>
            <p>Phone: {selectedHospital.phone}</p>
            <p>Email: {selectedHospital.email}</p>
            <p>Address: {selectedHospital.address}</p>
            <button onClick={() => setShowContactModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default EmergencyRequests 