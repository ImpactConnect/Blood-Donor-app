import { useState } from 'react'
import { useNotifications } from '../../contexts/NotificationContext'
import './NotificationBell.css'

function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const {
    notifications,
    markAsRead,
    clearNotification,
    clearAllNotifications,
    requestPermission,
    permission
  } = useNotifications()

  const unreadCount = notifications.filter(n => !n.read).length

  const handleBellClick = () => {
    if (permission === 'default') {
      requestPermission()
    }
    setIsOpen(!isOpen)
  }

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id)
  }

  return (
    <div className="notification-bell-container">
      <button className="notification-bell" onClick={handleBellClick}>
        <i className="bell-icon">🔔</i>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notifications-dropdown">
          <div className="notifications-header">
            <h3>Notifications</h3>
            {notifications.length > 0 && (
              <button
                className="clear-all-btn"
                onClick={clearAllNotifications}
              >
                Clear All
              </button>
            )}
          </div>

          <div className="notifications-list">
            {notifications.length > 0 ? (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`notification-item ${!notification.read ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-content">
                    <h4>{notification.title}</h4>
                    <p>{notification.body}</p>
                    <span className="notification-time">
                      {new Date(notification.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <button
                    className="delete-notification"
                    onClick={(e) => {
                      e.stopPropagation()
                      clearNotification(notification.id)
                    }}
                  >
                    ×
                  </button>
                </div>
              ))
            ) : (
              <div className="no-notifications">
                No notifications
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell 