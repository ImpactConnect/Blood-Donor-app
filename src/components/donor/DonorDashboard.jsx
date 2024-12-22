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

  useEffect(() => {
    const fetchDonorData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch donor profile
        const profileData = await donorService.getProfile()
        setProfile(profileData)
        setEditedProfile(profileData)
        
        // Fetch donation history
        const donationsData = await donorService.getDonationHistory()
        setDonations(donationsData)
      } catch (error) {
        console.error('Error fetching donor data:', error)
        setError('Failed to load donor information')
      } finally {
        setLoading(false)
      }
    }

    fetchDonorData()
  }, [])

  const handleEditProfile = () => {
    setIsEditing(true)
  }

  const handleSaveProfile = async () => {
    try {
      setError(null)
      await donorService.updateProfile(editedProfile)
      setProfile(editedProfile)
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
      setError('Failed to update profile')
    }
  }

  const handleCancelEdit = () => {
    setEditedProfile(profile)
    setIsEditing(false)
  }

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

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Donor Dashboard</h1>
      </div>

      <div className="dashboard-grid">
        {/* Profile Card */}
        <div className="dashboard-card profile-card">
          <div className="card-header">
            <h2>Profile Information</h2>
            {!isEditing ? (
              <button className="edit-btn" onClick={handleEditProfile}>
                Edit Profile
              </button>
            ) : (
              <div className="edit-actions">
                <button className="save-btn" onClick={handleSaveProfile}>
                  Save
                </button>
                <button className="cancel-btn" onClick={handleCancelEdit}>
                  Cancel
                </button>
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="profile-edit-form">
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={editedProfile.name}
                  onChange={(e) => setEditedProfile({
                    ...editedProfile,
                    name: e.target.value
                  })}
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={editedProfile.phone}
                  onChange={(e) => setEditedProfile({
                    ...editedProfile,
                    phone: e.target.value
                  })}
                />
              </div>
              <div className="form-group">
                <label>Address</label>
                <textarea
                  value={editedProfile.address || ''}
                  onChange={(e) => setEditedProfile({
                    ...editedProfile,
                    address: e.target.value
                  })}
                />
              </div>
            </div>
          ) : (
            <div className="profile-info">
              <div className="info-group">
                <label>Name:</label>
                <span>{profile.name}</span>
              </div>
              <div className="info-group">
                <label>Email:</label>
                <span>{profile.email}</span>
              </div>
              <div className="info-group">
                <label>Blood Type:</label>
                <span className="blood-type">{profile.blood_type}</span>
              </div>
              <div className="info-group">
                <label>Phone:</label>
                <span>{profile.phone}</span>
              </div>
              <div className="info-group">
                <label>Address:</label>
                <span>{profile.address || 'Not provided'}</span>
              </div>
              <div className="info-group">
                <label>Last Donation:</label>
                <span>
                  {profile.last_donation_date 
                    ? new Date(profile.last_donation_date).toLocaleDateString()
                    : 'No donations yet'}
                </span>
              </div>
              <div className="info-group">
                <label>Status:</label>
                <span className={`status ${profile.is_available ? 'available' : 'unavailable'}`}>
                  {profile.is_available ? 'Available to Donate' : 'Not Available'}
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