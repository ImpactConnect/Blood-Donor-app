import PropTypes from 'prop-types'
import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import useGeolocation from '../../hooks/useGeolocation'
import { hospitalService } from '../../services/hospital.service'
import './Hospital.css'

function HospitalDashboard() {
  const { user } = useAuth()
  const [activeRequests, setActiveRequests] = useState([])
  const [fulfilledRequests, setFulfilledRequests] = useState([])
  const [donationHistory, setDonationHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { location } = useGeolocation()
  const [newRequest, setNewRequest] = useState({
    bloodType: '',
    units: 1,
    urgency: 'normal',
    description: ''
  })
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [showResponsesModal, setShowResponsesModal] = useState(false)
  const [responses, setResponses] = useState([])
  const [loadingResponses, setLoadingResponses] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)
      
      const [activeReqs, fulfilledReqs, donations] = await Promise.all([
        hospitalService.getActiveRequests(),
        hospitalService.getFulfilledRequests(),
        hospitalService.getDonationHistory()
      ])
      
      setActiveRequests(activeReqs)
      setFulfilledRequests(fulfilledReqs)
      setDonationHistory(donations)
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError(err.message)
      } finally {
        setLoading(false)
      }
  }

  const handleNewRequest = async (e) => {
    e.preventDefault()
    try {
        setError(null)
        const response = await hospitalService.createBloodRequest(newRequest)
      await fetchDashboardData() // Refresh all data
            setNewRequest({
                bloodType: '',
                units: 1,
                urgency: 'normal',
                description: ''
            })
    } catch (err) {
      setError(err.message)
    }
  }

  const handleViewResponses = async (request) => {
    try {
      setLoadingResponses(true)
      setSelectedRequest(request)
      setShowResponsesModal(true)
      const responseData = await hospitalService.getRequestResponses(request.id)
      setResponses(responseData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingResponses(false)
    }
  }

  const handleAcceptResponse = async (requestId, responseId) => {
    try {
      setLoading(true)
      setError(null)
      await hospitalService.acceptDonorResponse(requestId, responseId)
      await fetchDashboardData() // Refresh all data
      setShowResponsesModal(false)
      setSelectedRequest(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Hospital Dashboard</h1>
      </div>

      {/* Create Request Section */}
      <div className="dashboard-section">
          <h2>Create Blood Request</h2>
          <form onSubmit={handleNewRequest} className="request-form">
            <div className="form-group">
            <label>Blood Type</label>
              <select
                value={newRequest.bloodType}
              onChange={(e) => setNewRequest(prev => ({ ...prev, bloodType: e.target.value }))}
                required
              >
                <option value="">Select Blood Type</option>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
              </select>
            </div>
            <div className="form-group">
            <label>Units Needed</label>
              <input
                type="number"
              value={newRequest.units}
              onChange={(e) => setNewRequest(prev => ({ ...prev, units: parseInt(e.target.value) }))}
                min="1"
                required
              />
            </div>
            <div className="form-group">
            <label>Urgency</label>
              <select
                value={newRequest.urgency}
              onChange={(e) => setNewRequest(prev => ({ ...prev, urgency: e.target.value }))}
                required
              >
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          <button type="submit" className="submit-btn">Create Request</button>
          </form>
        </div>

      {/* Active Requests Section */}
      <div className="dashboard-section">
          <h2>Active Requests</h2>
        <div className="requests-grid">
            {activeRequests.map(request => (
            <div key={request.id} className={`request-card ${request.urgency}`}>
                <div className="request-header">
                  <span className="blood-type">{request.bloodType}</span>
                <span className="urgency-badge">{request.urgency}</span>
                </div>
                <div className="request-details">
                  <p>Units needed: {request.units}</p>
                <p>Responses: {request.responses || 0}</p>
                <button onClick={() => handleViewResponses(request)} className="view-responses-btn">
                  View Responses
                    </button>
                  </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fulfilled Requests Section */}
      <div className="dashboard-section">
        <h2>Fulfilled Requests</h2>
        <div className="requests-grid">
          {fulfilledRequests.map(request => (
            <div key={request.id} className="request-card fulfilled">
              <div className="request-header">
                <span className="blood-type">{request.bloodType}</span>
                <span className="status-badge">Fulfilled</span>
              </div>
              <div className="request-details">
                <p>Units received: {request.units}</p>
                <p>Fulfilled on: {new Date(request.fulfilledAt).toLocaleDateString()}</p>
                <p>Donor: {request.donorName}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      {/* Donation History Section */}
      <div className="dashboard-section">
        <h2>Donation History</h2>
        <div className="donations-grid">
          {donationHistory.map(donation => (
            <div key={donation.id} className="donation-card">
              <div className="donation-header">
                <span className="blood-type">{donation.blood_type}</span>
                <span className="donation-date">
                  {new Date(donation.donation_date).toLocaleDateString()}
                      </span>
                    </div>
              <div className="donation-details">
                <p>Donor: {donation.donor_name}</p>
                <p>Units: {donation.units}</p>
                <p>Status: {donation.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Responses Modal */}
      {showResponsesModal && selectedRequest && (
        <div className="modal">
          <div className="modal-content">
            <h3>Responses for {selectedRequest.bloodType} Request</h3>
            {loadingResponses ? (
              <div>Loading responses...</div>
            ) : (
              <div className="responses-list">
                {responses.map(response => (
                  <div key={response.id} className="response-item">
                    <div className="response-header">
                      <h4>{response.donor_name}</h4>
                      <span className={`status ${response.status}`}>{response.status}</span>
                    </div>
                    <div className="response-actions">
                      {response.status === 'pending' && (
                        <button 
                          onClick={() => handleAcceptResponse(selectedRequest.id, response.id)}
                          className="accept-btn"
                        >
                          Accept Response
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setShowResponsesModal(false)} className="close-modal-btn">
              Close
            </button>
          </div>
        </div>
      )}

      {error && <div className="error-toast">{error}</div>}
    </div>
  )
}

export default HospitalDashboard 