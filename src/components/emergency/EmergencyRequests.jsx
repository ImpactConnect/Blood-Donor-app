import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import './Emergency.css'

function EmergencyRequests() {
  const { user } = useAuth()
  const [emergencyRequests, setEmergencyRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEmergencyRequests = async () => {
      try {
        const response = await fetch('/api/requests/emergency')
        const data = await response.json()
        setEmergencyRequests(data)
      } catch (error) {
        console.error('Error fetching emergency requests:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEmergencyRequests()
    // Set up real-time updates using WebSocket or polling
    const interval = setInterval(fetchEmergencyRequests, 30000) // Poll every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const handleRespond = async (requestId) => {
    try {
      const response = await fetch(`/api/requests/${requestId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ donorId: user.id })
      })

      if (response.ok) {
        // Update UI to show response was recorded
        setEmergencyRequests(prev =>
          prev.map(req =>
            req.id === requestId
              ? { ...req, hasResponded: true }
              : req
          )
        )
      }
    } catch (error) {
      console.error('Error responding to request:', error)
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

  return (
    <div className="emergency-container">
      <div className="emergency-header">
        <h1>Emergency Blood Requests</h1>
        <div className="emergency-stats">
          <div className="stat-item">
            <span className="stat-value">{emergencyRequests.length}</span>
            <span className="stat-label">Active Requests</span>
          </div>
        </div>
      </div>

      <div className="emergency-grid">
        {emergencyRequests.map(request => (
          <div 
            key={request.id} 
            className={`emergency-card ${request.urgency}`}
          >
            <div className="emergency-card-header">
              <span className="blood-type">{request.bloodType}</span>
              <span className={`urgency-badge ${request.urgency}`}>
                {request.urgency.toUpperCase()}
              </span>
            </div>

            <div className="hospital-info">
              <h3>{request.hospitalName}</h3>
              <p>{request.location}</p>
            </div>

            <div className="request-details">
              <div className="detail-item">
                <span className="detail-label">Units Needed:</span>
                <span className="detail-value">{request.unitsNeeded}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Time Posted:</span>
                <span className="detail-value">
                  {new Date(request.createdAt).toLocaleTimeString()}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Distance:</span>
                <span className="detail-value">{request.distance}km away</span>
              </div>
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
              <button className="contact-button">
                Contact Hospital
              </button>
            </div>
          </div>
        ))}

        {emergencyRequests.length === 0 && (
          <div className="no-requests">
            <h2>No Emergency Requests</h2>
            <p>There are currently no emergency blood requests in your area.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default EmergencyRequests 