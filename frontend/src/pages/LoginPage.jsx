import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import API_URL from '../config'

export default function LoginPage({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login'
    const body = isRegister
      ? { name, email, password, role: 'student' }
      : { email, password }

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.detail || 'Authentication failed')
      }

      // Save token and user
      localStorage.setItem('token', data.access_token)
      localStorage.setItem('user', JSON.stringify(data.user))
      onLogin(data.user, data.access_token)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card fade-in-up">
        <div className="auth-header">
          <span className="auth-icon">🇫🇷</span>
          <h1>{isRegister ? 'Create Account' : 'Welcome Back'}</h1>
          <p>{isRegister ? 'Start your French journey today' : 'Sign in to continue learning'}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {isRegister && (
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
            {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="auth-switch">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}
          <button onClick={() => { setIsRegister(!isRegister); setError(null) }}>
            {isRegister ? 'Sign In' : 'Create Account'}
          </button>
        </div>

        <div className="auth-demo">
          <span className="auth-demo-label">Demo Credentials</span>
          <div className="auth-demo-credentials">
            <button onClick={() => { setEmail('student@frenchlms.com'); setPassword('student123'); setIsRegister(false) }}>
              Student Login
            </button>
            <button onClick={() => { setEmail('teacher@frenchlms.com'); setPassword('teacher123'); setIsRegister(false) }}>
              Teacher Login
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
