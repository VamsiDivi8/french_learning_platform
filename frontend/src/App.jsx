import { useState } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import HomePage from './pages/HomePage'
import CoursePage from './pages/CoursePage'
import LessonPage from './pages/LessonPage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import TeacherDashboardPage from './pages/TeacherDashboardPage'
import CertificatePage from './pages/CertificatePage'
import DictionaryPage from './pages/DictionaryPage'
import './index.css'

function Navbar({ user, onLogout }) {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="flag">🇫🇷</span>
          <span>FrenchLMS</span>
        </Link>
        <div className="navbar-links">
          <Link to="/">Courses</Link>
          <Link to="/dictionary">Dictionary</Link>
          {user ? (
            <>
              <Link to="/dashboard">Dashboard</Link>
              <span className="navbar-user">Bonjour, {user.name}</span>
              <button className="btn btn-secondary btn-sm" onClick={onLogout}>Sign Out</button>
            </>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">Sign In</Link>
          )}
        </div>
      </div>
    </nav>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <p>© 2026 FrenchLMS — Learn French with confidence 🇫🇷</p>
      </div>
    </footer>
  )
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || null)
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user')
    try {
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  const handleLogin = (newUser, newToken) => {
    setUser(newUser)
    setToken(newToken)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setToken(null)
  }

  return (
    <BrowserRouter>
      <Navbar user={user} onLogout={handleLogout} />
      <main className="container">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/course/:courseId" element={<CoursePage />} />
          <Route path="/lesson/:lessonId" element={<LessonPage token={token} />} />
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="/dictionary" element={<DictionaryPage />} />
          <Route 
            path="/dashboard" 
            element={
              user?.role === 'teacher' 
                ? <TeacherDashboardPage user={user} token={token} /> 
                : <DashboardPage user={user} token={token} />
            } 
          />
          <Route path="/certificate/:courseId" element={<CertificatePage user={user} token={token} />} />
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  )
}

export default App
