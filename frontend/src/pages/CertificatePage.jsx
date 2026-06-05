import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'

const API_URL = 'http://localhost:8000'

export default function CertificatePage({ user, token }) {
  const { courseId } = useParams()
  const [cert, setCert] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [claiming, setClaiming] = useState(false)
  const certRef = useRef(null)

  useEffect(() => {
    // Try to get existing certificate
    fetch(`${API_URL}/api/progress/certificates/${courseId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (res.ok) return res.json()
        return null
      })
      .then(data => {
        if (data) setCert(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [courseId, token])

  const claimCertificate = async () => {
    setClaiming(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/api/progress/certificates/${courseId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed to claim certificate')
      setCert(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setClaiming(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <span className="loading-text">Loading certificate...</span>
      </div>
    )
  }

  // No certificate yet — show claim button
  if (!cert) {
    return (
      <div className="cert-claim-page fade-in-up">
        <div className="empty-state">
          <div className="empty-icon">🏆</div>
          <h3>Claim Your Certificate</h3>
          <p>Complete all lessons in this course to earn your certificate.</p>
          {error && (
            <div className="auth-error" style={{ maxWidth: '400px', margin: '16px auto' }}>
              {error}
            </div>
          )}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '20px' }}>
            <button
              className="btn btn-primary btn-lg"
              onClick={claimCertificate}
              disabled={claiming}
            >
              {claiming ? 'Claiming...' : 'Claim Certificate'}
            </button>
            <Link to="/dashboard" className="btn btn-secondary btn-lg">Back to Dashboard</Link>
          </div>
        </div>
      </div>
    )
  }

  // Certificate display
  const issueDate = new Date(cert.issue_date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="cert-page fade-in-up">
      <div className="cert-actions no-print">
        <Link to="/dashboard" className="btn btn-secondary">← Dashboard</Link>
        <button className="btn btn-primary" onClick={handlePrint}>
          🖨️ Print / Save PDF
        </button>
      </div>

      <div className="certificate" ref={certRef}>
        <div className="cert-border">
          <div className="cert-inner">
            <div className="cert-top-accent"></div>

            <div className="cert-flag">🇫🇷</div>
            <h2 className="cert-subtitle">Certificate of Completion</h2>
            <h1 className="cert-title">{cert.course_title}</h1>

            <div className="cert-divider"></div>

            <p className="cert-presented">This certificate is proudly presented to</p>
            <h2 className="cert-student-name">{cert.student_name}</h2>

            <p className="cert-body">
              for successfully completing the <strong>{cert.course_title}</strong> course
              at the <strong>{cert.level}</strong> proficiency level on the FrenchLMS platform.
            </p>

            <div className="cert-footer">
              <div className="cert-footer-item">
                <div className="cert-footer-value">{cert.level}</div>
                <div className="cert-footer-label">Level</div>
              </div>
              <div className="cert-footer-item">
                <div className="cert-footer-value">{issueDate}</div>
                <div className="cert-footer-label">Date Issued</div>
              </div>
              <div className="cert-footer-item">
                <div className="cert-footer-value">#{String(cert.certificate_id).padStart(4, '0')}</div>
                <div className="cert-footer-label">Certificate ID</div>
              </div>
            </div>

            <div className="cert-bottom-text">
              FrenchLMS — Learn French with Confidence
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
