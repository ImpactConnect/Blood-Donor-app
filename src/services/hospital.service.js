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
      
      if (!Array.isArray(response.data)) {
        console.error('Unexpected response format:', response.data)
        return []
      }
      
      return response.data.map(req => ({
        ...req,
        urgency: req.urgency_level || req.urgency,
        units: req.units_needed || req.units
      }))
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
  },

  async respondToRequest(requestId) {
    try {
      const response = await api.post(`/hospital/requests/${requestId}/respond`)
      console.log('Response recorded:', response.data)
      return response.data
    } catch (error) {
      console.error('Error responding to request:', error)
      throw new Error(error.response?.data?.error || 'Failed to respond to request')
    }
  },

  async getHospitalContact(hospitalId) {
    try {
      const response = await api.get(`/hospital/contact/${hospitalId}`)
      return response.data
    } catch (error) {
      console.error('Error getting hospital contact:', error)
      throw new Error(error.response?.data?.error || 'Failed to get hospital contact')
    }
  },

  async getRequestResponses(requestId) {
    try {
      const response = await api.get(`/hospital/requests/${requestId}/responses`)
      console.log('Request responses:', response.data)
      return response.data
    } catch (error) {
      console.error('Error fetching responses:', error)
      throw new Error(error.response?.data?.error || 'Failed to fetch responses')
    }
  },

  async getDonorContact(donorId) {
    try {
      const response = await api.get(`/hospital/donor/${donorId}/contact`)
      console.log('Donor contact response:', response.data)
      return response.data
    } catch (error) {
      console.error('Error getting donor contact:', error)
      throw new Error(error.response?.data?.error || 'Failed to get donor contact')
    }
  },

  async acceptDonorResponse(requestId, responseId) {
    try {
      const response = await api.post(`/hospital/requests/${requestId}/responses/${responseId}/accept`)
      if (!response.data) {
        throw new Error('No data received from server')
      }
      console.log('Accept response:', response.data)
      return response.data
    } catch (error) {
      console.error('Error accepting donor response:', error.response || error)
      throw new Error(error.response?.data?.error || 'Failed to accept donor response')
    }
  },

  async getFulfilledRequests() {
    try {
      const response = await api.get('/hospital/requests/fulfilled')
      console.log('Fulfilled requests:', response.data)
      return response.data
    } catch (error) {
      console.error('Error fetching fulfilled requests:', error)
      throw new Error(error.response?.data?.error || 'Failed to fetch fulfilled requests')
    }
  },

  async getDonationHistory() {
    try {
      const response = await api.get('/hospital/donations')
      console.log('Donation history:', response.data)
      return response.data
    } catch (error) {
      console.error('Error fetching donation history:', error)
      throw new Error(error.response?.data?.error || 'Failed to fetch donation history')
    }
  }
} 