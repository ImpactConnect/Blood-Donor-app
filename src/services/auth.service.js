import api from './api'

export const authService = {
  async login(email, password) {
    try {
      const response = await api.post('/auth/login', { email, password })
      const { access_token, refresh_token, user } = response.data
      
      if (access_token) {
        localStorage.setItem('authToken', access_token)
        localStorage.setItem('refreshToken', refresh_token)
      }
      
      return { user, access_token, refresh_token }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  },

  async getCurrentUser() {
    try {
      const response = await api.get('/auth/me')
      return response.data
    } catch (error) {
      console.error('Get current user error:', error)
      throw error
    }
  },

  logout() {
    localStorage.removeItem('authToken')
    localStorage.removeItem('refreshToken')
  }
} 