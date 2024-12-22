import PropTypes from 'prop-types'
import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { donorService } from '../../services/donor.service'
import './Donor.css'

function DonorDashboard() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [donations, setDonations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedProfile, setEditedProfile] = useState(null)
  const [isAvailable, setIsAvailable] = useState(user?.is_available || false)
  const [successMessage, setSuccessMessage] = useState(null)

  useEffect(() => {
    fetchDonorData()
  }, [])

  const fetchDonorData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch donor profile and donation history simultaneously
      const [profileData, donationsData] = await Promise.all([
        donorService.getProfile(),
        donorService.getDonationHistory()
      ])
      
      setProfile(profileData)
      setEditedProfile(profileData)
      setDonations(donationsData)
      setIsAvailable(profileData.is_available)
    } catch (error) {
      console.error('Error fetching donor data:', error)
      setError('Failed to load donor information')
    } finally {
      setLoading(false)
    }
  }

  const handleEditProfile = () => {
    setIsEditing(true)
  }

  const handleSaveProfile = async () => {
    try {
      setError(null)
      await donorService.updateProfile(editedProfile)
      setProfile(editedProfile)
      setIsEditing(false)
      showSuccessMessage('Profile updated successfully')
    } catch (error) {
      console.error('Error updating profile:', error)
      setError('Failed to update profile')
    }
  }

  const handleCancelEdit = () => {
    setEditedProfile(profile)
    setIsEditing(false)
  }

  const toggleAvailability = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const newAvailability = !isAvailable
      await donorService.updateAvailability(newAvailability)
      
      setIsAvailable(newAvailability)
      showSuccessMessage(`You are now ${newAvailability ? 'available' : 'unavailable'} for donations`)
      
      // Refresh donor data
      await fetchDonorData()
    } catch (error) {
      console.error('Error updating availability:', error)
      setError('Failed to update availability status')
    } finally {
      setLoading(false)
    }
  }

  const showSuccessMessage = (message) => {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  if (loading) {
    return <div className="loading-spinner">Loading...</div>
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Donor Dashboard</h1>
      </div>

      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      <div className="dashboard-grid">
        {/* Profile Card */}
        <div className="dashboard-card profile-card">
          <div className="card-header">
            <h2>Profile Information</h2>
            {!isEditing ? (
              <button onClick={handleEditProfile} className="edit-btn">
                Edit Profile
              </button>
            ) : (
              <div className="edit-actions">
                <button onClick={handleSaveProfile} className="save-btn">
                  Save
                </button>
                <button onClick={handleCancelEdit} className="cancel-btn">
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Availability Toggle */}
          <div className="availability-toggle-container">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={isAvailable}
                onChange={toggleAvailability}
                disabled={loading}
              />
              <span className="toggle-slider round"></span>
              <span className="toggle-label">
                {isAvailable ? 'Available for Donation' : 'Not Available'}
              </span>
            </label>
          </div>

          {isEditing ? (
            <form className="profile-edit-form">
              {/* Add your form fields here */}
            </form>
          ) : (
            <div className="profile-info">
              <div className="info-group">
                <label>Name:</label>
                <span>{profile?.name}</span>
              </div>
              <div className="info-group">
                <label>Blood Type:</label>
                <span className="blood-type">{profile?.blood_type}</span>
              </div>
              <div className="info-group">
                <label>Contact:</label>
                <span>{profile?.phone}</span>
              </div>
              <div className="info-group">
                <label>Address:</label>
                <span>{profile?.address}</span>
              </div>
              <div className="info-group">
                <label>Status:</label>
                <span className={`status ${isAvailable ? 'available' : 'unavailable'}`}>
                  {isAvailable ? 'Available' : 'Not Available'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Donation History Card */}
        <div className="dashboard-card">
          <h2>Donation History</h2>
          {donations.length > 0 ? (
            <div className="donations-list">
              {donations.map(donation => (
                <div key={donation.id} className="donation-item">
                  <div className="donation-header">
                    <span className="blood-type">{donation.blood_type}</span>
                    <span className="donation-date">
                      {new Date(donation.donation_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="donation-details">
                    <p>Hospital: {donation.hospital_name}</p>
                    <p>Units: {donation.units}</p>
                    {donation.notes && <p>Notes: {donation.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-donations">No donation history available</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default DonorDashboard 