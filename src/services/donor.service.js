import api from './api'

export const donorService = {
  async updateProfile(profileData) {
    const response = await api.put('/donor/profile', profileData)
    return response.data
  },

  async toggleAvailability(isAvailable) {
    const response = await api.post('/donor/availability', { is_available: isAvailable })
    return response.data
  },

  async getDonationHistory() {
    const response = await api.get('/donor/donations')
    return response.data
  },

  async getNearbyRequests() {
    const response = await api.get('/donor/nearby-requests')
    return response.data
  },

  async respondToRequest(requestId) {
    const response = await api.post(`/donor/respond-to-request/${requestId}`)
    return response.data
  }
} 