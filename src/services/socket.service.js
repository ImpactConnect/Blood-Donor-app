import { io } from 'socket.io-client'
import { notificationService } from './notification.service'

class SocketService {
  constructor() {
    this.socket = null
  }

  connect(userId) {
    this.socket = io('/api', {
      auth: {
        token: localStorage.getItem('authToken')
      }
    })

    this.socket.on('connect', () => {
      console.log('Socket connected')
      this.socket.emit('join', { userId })
    })

    this.socket.on('notification', (notification) => {
      // Handle incoming notifications
      notificationService.handleNewNotification(notification)
    })

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected')
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }
}

export const socketService = new SocketService() 