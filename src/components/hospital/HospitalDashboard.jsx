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
  const [activeTab, setActiveTab] = useState('active')
  const [showContactModal, setShowContactModal] = useState(false)
  const [selectedDonor, setSelectedDonor] = useState(null)

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

  const handleContactDonor = async (donorId) => {
    try {
      setLoading(true)
      setError(null)
      const donorContact = await hospitalService.getDonorContact(donorId)
      setSelectedDonor(donorContact)
      setShowContactModal(true)
    } catch (err) {
      console.error('Error fetching donor contact:', err)
      setError('Failed to get donor contact information')
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
        <div className="hospital-info">
          <h3>{user?.name}</h3>
          <p>{user?.address}</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="stats-overview">
        <div className="stat-card">
          <h3>Active Requests</h3>
          <p className="stat-number">{activeRequests.length}</p>
        </div>
        <div className="stat-card">
          <h3>Fulfilled Requests</h3>
          <p className="stat-number">{fulfilledRequests.length}</p>
        </div>
        <div className="stat-card">
          <h3>Total Donations</h3>
          <p className="stat-number">{donationHistory.length}</p>
        </div>
      </div>

      {/* Create Request Section */}
      <div className="dashboard-section create-request">
        <h2>Create Blood Request</h2>
        <form onSubmit={handleNewRequest} className="request-form">
          <div className="form-grid">
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
              <label>Urgency Level</label>
              <select
                value={newRequest.urgency}
                onChange={(e) => setNewRequest(prev => ({ ...prev, urgency: e.target.value }))}
                required
                className={`urgency-select ${newRequest.urgency}`}
              >
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          <div className="form-group full-width">
            <label>Description/Comments</label>
            <textarea
              value={newRequest.description}
              onChange={(e) => setNewRequest(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Add any additional information or requirements..."
              rows="3"
              required
            />
          </div>
          <button type="submit" className="submit-btn">Create Request</button>
        </form>
      </div>

      {/* Tabs for different sections */}
      <div className="dashboard-tabs">
        <button 
          className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          Active Requests
        </button>
        <button 
          className={`tab-btn ${activeTab === 'fulfilled' ? 'active' : ''}`}
          onClick={() => setActiveTab('fulfilled')}
        >
          Fulfilled Requests
        </button>
        <button 
          className={`tab-btn ${activeTab === 'donations' ? 'active' : ''}`}
          onClick={() => setActiveTab('donations')}
        >
          Donation History
        </button>
      </div>

      {/* Content based on active tab */}
      <div className="tab-content">
        {activeTab === 'active' && (
          <div className="requests-grid">
            {activeRequests.map(request => (
              <div key={request.id} className={`request-card ${request.urgency}`}>
                <div className="request-header">
                  <span className="blood-type">{request.bloodType}</span>
                  <span className="urgency-badge">{request.urgency}</span>
                </div>
                <div className="request-details">
                  <p><strong>Units needed:</strong> {request.units}</p>
                  <p><strong>Responses:</strong> {request.responses || 0}</p>
                  <p className="description">{request.description}</p>
                  <button 
                    onClick={() => handleViewResponses(request)} 
                    className="view-responses-btn"
                  >
                    View Responses ({request.responses || 0})
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'fulfilled' && (
          <div className="fulfilled-requests">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Blood Type</th>
                  <th>Units</th>
                  <th>Donor</th>
                  <th>Fulfilled Date</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {fulfilledRequests.map(request => (
                  <tr key={request.id}>
                    <td className="blood-type-cell">{request.bloodType}</td>
                    <td>{request.units}</td>
                    <td>{request.donorName}</td>
                    <td>{new Date(request.fulfilledAt).toLocaleDateString()}</td>
                    <td>{request.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'donations' && (
          <div className="donation-history">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Donor</th>
                  <th>Blood Type</th>
                  <th>Units</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {donationHistory.map(donation => (
                  <tr key={donation.id}>
                    <td>{new Date(donation.donation_date).toLocaleDateString()}</td>
                    <td>{donation.donor_name}</td>
                    <td className="blood-type-cell">{donation.blood_type}</td>
                    <td>{donation.units}</td>
                    <td>
                      <span className={`status-badge ${donation.status}`}>
                        {donation.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Responses Modal */}
      {showResponsesModal && selectedRequest && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Responses for {selectedRequest.bloodType} Request</h3>
              <p className="request-details">
                Units needed: {selectedRequest.units} | 
                Urgency: {selectedRequest.urgency}
              </p>
            </div>
            
            {loadingResponses ? (
              <div className="loading-spinner">Loading responses...</div>
            ) : responses.length === 0 ? (
              <div className="no-responses">
                No responses received yet
              </div>
            ) : (
              <div className="responses-list">
                {responses.map(response => (
                  <div key={response.id} className="response-item">
                    <div className="response-header">
                      <div className="donor-info">
                        <h4>{response.donor_name}</h4>
                        <span className="blood-type">{response.blood_type}</span>
                      </div>
                      <span className={`status ${response.status}`}>
                        {response.status}
                      </span>
                    </div>
                    <div className="response-details">
                      <p>Distance: {response.distance}km</p>
                      <p>Available Units: {response.available_units}</p>
                      {response.note && <p>Note: {response.note}</p>}
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
                      <button 
                        onClick={() => handleContactDonor(response.donor_id)}
                        className="contact-btn"
                      >
                        Contact Donor
                      </button>
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

      {showContactModal && selectedDonor && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Contact Donor</h3>
            </div>
            <div className="donor-contact-info">
              <div className="info-group">
                <label>Name:</label>
                <span>{selectedDonor.name}</span>
              </div>
              <div className="info-group">
                <label>Phone:</label>
                <span>{selectedDonor.phone}</span>
              </div>
              <div className="info-group">
                <label>Email:</label>
                <span>{selectedDonor.email}</span>
              </div>
              <div className="info-group">
                <label>Address:</label>
                <span>{selectedDonor.address}</span>
              </div>
            </div>
            <button onClick={() => setShowContactModal(false)} className="close-modal-btn">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default HospitalDashboard 