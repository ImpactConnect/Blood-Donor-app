import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import ErrorBoundary from './components/common/ErrorBoundary'
import ProtectedRoute from './components/common/ProtectedRoute'
import { AuthProvider } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'
import Header from './components/common/Header'
import Footer from './components/common/Footer'
import Login from './components/auth/Login'
import Register from './components/auth/Register'
import DonorDashboard from './components/donor/DonorDashboard'
import HospitalDashboard from './components/hospital/HospitalDashboard'
import EmergencyRequests from './components/emergency/EmergencyRequests'
import './App.css'
import './styles/theme.css'
import './components/common/Common.css'
import './components/layout/Navigation.css'
import './components/dashboard/Dashboard.css'

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <AuthProvider>
          <NotificationProvider>
            <div className="app-container">
              <Header />
              <main className="main-content">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route 
                    path="/donor/dashboard" 
                    element={
                      <ProtectedRoute requiredRole="donor">
                        <DonorDashboard />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/hospital/dashboard" 
                    element={
                      <ProtectedRoute requiredRole="hospital">
                        <HospitalDashboard />
                      </ProtectedRoute>
                    } 
                  />
                  <Route path="/emergency" element={<EmergencyRequests />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </NotificationProvider>
        </AuthProvider>
      </ErrorBoundary>
    </Router>
  )
}

const Home = () => (
  <div className="home">
    <h1>Welcome to BloodConnect</h1>
    <div className="hero-section">
      <h2>Save Lives Through Blood Donation</h2>
      <p>Connect with hospitals and donors in real-time</p>
      <div className="cta-buttons">
        <button className="btn primary">Register as Donor</button>
        <button className="btn secondary">Hospital Login</button>
      </div>
    </div>
  </div>
)

export default App
