import api from './api'

export const hospitalService = {
  async updateProfile(profileData) {
    const response = await api.put('/hospital/profile', profileData)
    return response.data
  },

  async createBloodRequest(requestData) {
    try {
      const response = await api.post('/hospital/requests', {
        bloodType: requestData.bloodType,
        units: requestData.units,
        urgency: requestData.urgency,
        description: requestData.description
      })
      console.log('Create request response:', response.data)
      return response.data
    } catch (error) {
      console.error('Error creating request:', error.response || error)
      throw new Error(error.response?.data?.error || 'Failed to create blood request')
    }
  },

  async getActiveRequests() {
    try {
      const response = await api.get('/hospital/requests')
      console.log('Active requests response:', response.data)
      return response.data || []
    } catch (error) {
      console.error('Error fetching requests:', error.response || error)
      throw new Error(error.response?.data?.error || 'Failed to fetch requests')
    }
  },

  async updateRequest(requestId, updateData) {
    const response = await api.put(`/hospital/requests/${requestId}`, updateData)
    return response.data
  },

  async getAvailableDonors() {
    try {
      const response = await api.get('/hospital/available-donors')
      console.log('Available donors response:', response.data)
      return response.data || []
    } catch (error) {
      console.error('Error fetching donors:', error.response || error)
      throw new Error(error.response?.data?.error || 'Failed to fetch available donors')
    }
  },

  async recordDonation(donationData) {
    const response = await api.post('/hospital/record-donation', donationData)
    return response.data
  }
} 