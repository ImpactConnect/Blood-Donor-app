import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import NotificationBell from './NotificationBell'
import './Header.css'

function Header() {
  const { user, logout } = useAuth()
  console.log('Current user:', user)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const getDashboardLink = () => {
    if (!user) return '/'
    return user.user_type === 'donor' ? '/donor/dashboard' : '/hospital/dashboard'
  }

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">
          BloodConnect
        </Link>
        
        <nav className="nav-links">
          {user ? (
            <>
              <Link to={getDashboardLink()}>Dashboard</Link>
              <Link to="/emergency">Emergency Requests</Link>
              <NotificationBell />
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register" className="register-btn">
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}

export default Header 