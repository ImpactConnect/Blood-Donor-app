import { createContext, useContext, useState, useEffect } from 'react'
import PropTypes from 'prop-types'

const NotificationContext = createContext(null)

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])
  const [permission, setPermission] = useState('default')

  useEffect(() => {
    // Check notification permission on mount
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission()
      setPermission(result)
      return result
    }
    return 'denied'
  }

  const showNotification = ({ title, body, icon = '/blood-drop-icon.png' }) => {
    // Browser notification
    if (permission === 'granted') {
      new Notification(title, { body, icon })
    }

    // In-app notification
    const newNotification = {
      id: Date.now(),
      title,
      body,
      timestamp: new Date(),
      read: false
    }

    setNotifications(prev => [newNotification, ...prev])
  }

  const markAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    )
  }

  const clearNotification = (notificationId) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== notificationId)
    )
  }

  const clearAllNotifications = () => {
    setNotifications([])
  }

  const value = {
    notifications,
    showNotification,
    markAsRead,
    clearNotification,
    clearAllNotifications,
    requestPermission,
    permission
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

NotificationProvider.propTypes = {
  children: PropTypes.node.isRequired
}

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
} 