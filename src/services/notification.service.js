import api from './api'

export const notificationService = {
  async getNotifications() {
    const response = await api.get('/notifications')
    return response.data
  },

  async markAsRead(notificationId) {
    const response = await api.post(`/notifications/${notificationId}/read`)
    return response.data
  },

  async deleteNotification(notificationId) {
    const response = await api.delete(`/notifications/${notificationId}`)
    return response.data
  }
} 