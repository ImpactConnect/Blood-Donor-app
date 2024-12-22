import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import useGeolocation from '../../hooks/useGeolocation'
import { hospitalService } from '../../services/hospital.service'
import './Hospital.css'

function HospitalDashboard() {
  const { user } = useAuth()
  const [activeRequests, setActiveRequests] = useState([])
  const [availableDonors, setAvailableDonors] = useState([])
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
  const [selectedDonor, setSelectedDonor] = useState(null)
  const [showDonorModal, setShowDonorModal] = useState(false)

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true)
        setError(null)
        const requestsData = await hospitalService.getActiveRequests()
        setActiveRequests(Array.isArray(requestsData) ? requestsData : [])
      } catch (error) {
        console.error('Error fetching requests:', error)
        setError(error.message || 'Failed to load requests')
      } finally {
        setLoading(false)
      }
    }

    fetchRequests()
  }, [])

  useEffect(() => {
    const fetchDonors = async () => {
      if (activeRequests.length > 0) {
        try {
          const donorsData = await hospitalService.getAvailableDonors()
          setAvailableDonors(Array.isArray(donorsData) ? donorsData : [])
        } catch (error) {
          console.error('Error fetching donors:', error)
        }
      } else {
        setAvailableDonors([])
      }
    }

    fetchDonors()
  }, [activeRequests])

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-message">{error}</div>
      </div>
    )
  }

  const handleNewRequest = async (e) => {
    e.preventDefault()
    try {
        setError(null)
        console.log('Submitting request:', newRequest)
        const response = await hospitalService.createBloodRequest(newRequest)
        console.log('Request created:', response)
        
        if (response.request) {
            setActiveRequests(prev => [...prev, response.request])
            setNewRequest({
                bloodType: '',
                units: 1,
                urgency: 'normal',
                description: ''
            })
        }
    } catch (err) {
        console.error('Error creating request:', err)
        setError(err.message || 'Failed to create request')
    }
  }

  const handleViewResponses = async (request) => {
    try {
      setLoadingResponses(true)
      setSelectedRequest(request)
      setShowResponsesModal(true)
      
      const response = await hospitalService.getRequestResponses(request.id)
      console.log('Request responses:', response)
      setResponses(response)
    } catch (error) {
      console.error('Error fetching responses:', error)
    } finally {
      setLoadingResponses(false)
    }
  }

  const handleContactDonor = async (donorId) => {
    try {
      setLoading(true)
      setError(null)
      console.log('Fetching donor contact info for:', donorId)
      
      const donorData = await hospitalService.getDonorContact(donorId)
      console.log('Donor contact data:', donorData)
      
      if (!donorData) {
        throw new Error('No donor data received')
      }
      
      setSelectedDonor(donorData)
      setShowDonorModal(true)
    } catch (error) {
      console.error('Error getting donor contact:', error)
      setError('Failed to get donor contact information')
    } finally {
      setLoading(false)
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
                  <div className="request-actions">
                    <button
                      className="view-responses-btn"
                      onClick={() => handleViewResponses(request)}
                    >
                      View Responses ({request.responses})
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-card">
          <h2>Available Donors Nearby</h2>
          {activeRequests.length > 0 ? (
            availableDonors.length > 0 ? (
              <div className="donors-list">
                {availableDonors.map(donor => (
                  <div key={donor.id} className="donor-item">
                    <div className="donor-info">
                      <span className="blood-type">{donor.bloodType}</span>
                      <span className="donor-name">{donor.name}</span>
                      <span className="donor-distance">
                        {donor.distance ? `${donor.distance}km away` : 'Distance unknown'}
                      </span>
                    </div>
                    <button 
                      className="contact-btn"
                      onClick={() => handleContactDonor(donor.id)}
                    >
                      Contact Donor
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-donors">No available donors found</p>
            )
          ) : (
            <p className="no-donors">Create a blood request to see available donors</p>
          )}
        </div>
      </div>

      {showResponsesModal && selectedRequest && (
        <div className="modal">
          <div className="modal-content">
            <h3>Responses for {selectedRequest.bloodType} Request</h3>
            {loadingResponses ? (
              <div className="loading-spinner"></div>
            ) : responses.length > 0 ? (
              <div className="responses-list">
                {responses.map(response => (
                  <div key={response.id} className="response-item">
                    <div className="donor-info">
                      <h4>{response.donor_name}</h4>
                      <span className={`status ${response.status}`}>
                        {response.status}
                      </span>
                    </div>
                    <div className="response-details">
                      <p>Responded: {new Date(response.created_at).toLocaleString()}</p>
                    </div>
                    <div className="response-actions">
                      <button 
                        className="contact-donor-btn"
                        onClick={() => handleContactDonor(response.donor_id)}
                      >
                        Contact Donor
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No responses yet</p>
            )}
            <button 
              className="close-modal-btn"
              onClick={() => setShowResponsesModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showDonorModal && selectedDonor && (
        <div className="modal">
          <div className="modal-content">
            <h3>Contact {selectedDonor.name}</h3>
            <div className="donor-info">
              <p><strong>Blood Type:</strong> {selectedDonor.blood_type}</p>
              <p><strong>Phone:</strong> {selectedDonor.phone || 'Not provided'}</p>
              <p><strong>Email:</strong> {selectedDonor.email || 'Not provided'}</p>
              <p><strong>Address:</strong> {selectedDonor.address || 'Not provided'}</p>
              <p><strong>Status:</strong> {selectedDonor.is_available ? 'Available' : 'Not Available'}</p>
            </div>
            <div className="modal-actions">
              <button 
                className="close-modal-btn"
                onClick={() => {
                  setShowDonorModal(false)
                  setSelectedDonor(null)
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="error-toast">
          {error}
        </div>
      )}
    </div>
  )
}

export default HospitalDashboard 