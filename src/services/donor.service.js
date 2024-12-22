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

    async updateAvailability(isAvailable) {
        try {
            const response = await api.put('/donor/availability', { 
                is_available: isAvailable 
            })
            console.log('Availability updated:', response.data)
            return response.data
        } catch (error) {
            console.error('Error updating availability:', error)
            if (error.response?.status === 400) {
                throw new Error('Invalid availability status')
            } else if (error.response?.status === 403) {
                throw new Error('Not authorized to update availability')
            } else {
                throw new Error(error.response?.data?.error || 'Failed to update availability status')
            }
        }
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