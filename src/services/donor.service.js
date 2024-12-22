import api from './api'

export const donorService = {
    async getProfile() {
        try {
            const response = await api.get('/donor/profile')
            console.log('Donor profile:', response.data)
            return response.data
        } catch (error) {
            console.error('Error fetching profile:', error)
            throw new Error(error.response?.data?.error || 'Failed to fetch profile')
        }
    },

    async updateProfile(profileData) {
        try {
            const response = await api.put('/donor/profile', profileData)
            console.log('Profile updated:', response.data)
            return response.data
        } catch (error) {
            console.error('Error updating profile:', error)
            throw new Error(error.response?.data?.error || 'Failed to update profile')
        }
    },

    async getDonationHistory() {
        try {
            const response = await api.get('/donor/donations')
            console.log('Donation history:', response.data)
            return response.data
        } catch (error) {
            console.error('Error fetching donations:', error)
            throw new Error(error.response?.data?.error || 'Failed to fetch donation history')
        }
    },

    async toggleAvailability(isAvailable) {
        const response = await api.post('/donor/availability', { is_available: isAvailable })
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