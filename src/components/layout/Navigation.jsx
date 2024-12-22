import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import './Navigation.css'

function Navigation() {
  const { user, logout } = useAuth()
  const location = useLocation()

  return (
    <nav className="nav">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          BloodConnect
        </Link>
        
        <div className="nav-links">
          {user ? (
            <>
              <Link 
                to="/dashboard" 
                className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
              >
                Dashboard
              </Link>
              <button onClick={logout} className="btn btn-outline">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link 
                to="/login" 
                className={`nav-link ${location.pathname === '/login' ? 'active' : ''}`}
              >
                Login
              </Link>
              <Link 
                to="/register" 
                className="btn btn-primary"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navigation 