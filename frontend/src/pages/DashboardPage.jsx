import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import API_URL from '../config'

const LEVEL_CONFIG = {
  A1: { emoji: '🌱', gradient: 'a1', color: '#34d399' },
  A2: { emoji: '📖', gradient: 'a2', color: '#818cf8' },
  B1: { emoji: '🚀', gradient: 'b1', color: '#fbbf24' },
}

export default function DashboardPage({ user, token }) {
  const [dashboard, setDashboard] = useState(null)
  const [allCourses, setAllCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }
    loadDashboard()
  }, [token])

  const loadDashboard = async () => {
    try {
      // Fetch dashboard + all courses in parallel
      const [dashRes, coursesRes] = await Promise.all([
        fetch(`${API_URL}/api/progress/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/courses/`),
      ])

      if (dashRes.ok) {
        const dashData = await dashRes.json()
        setDashboard(dashData)
      }

      if (coursesRes.ok) {
        const coursesData = await coursesRes.json()
        setAllCourses(coursesData)
      }
    } catch (err) {
      console.error('Dashboard error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async (courseId) => {
    setEnrolling(courseId)
    try {
      const res = await fetch(`${API_URL}/api/progress/enroll/${courseId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        await loadDashboard()
      }
    } catch (err) {
      console.error('Enroll error:', err)
    } finally {
      setEnrolling(null)
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <span className="loading-text">Loading dashboard...</span>
      </div>
    )
  }

  const enrolledIds = (dashboard?.courses || []).map(c => c.course_id)
  const unenrolledCourses = allCourses.filter(c => !enrolledIds.includes(c.id))

  return (
    <div className="dashboard-page fade-in-up">
      {/* ── Welcome Header ─────────────────────────── */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">
            Bonjour, {user?.name || 'Student'}! 👋
          </h1>
          <p className="dashboard-subtitle">Track your French learning progress</p>
        </div>
      </div>

      {/* ── Enrolled Courses ───────────────────────── */}
      {dashboard?.courses?.length > 0 && (
        <section className="dashboard-section">
          <h2 className="section-title">My Courses</h2>
          <p className="section-subtitle">Continue where you left off</p>

          <div className="progress-grid">
            {dashboard.courses.map((course) => {
              const config = LEVEL_CONFIG[course.level] || LEVEL_CONFIG.A1
              return (
                <div
                  key={course.course_id}
                  className="progress-card"
                >
                  <div className="progress-card-top">
                    <span className={`level-badge ${config.gradient}`}>
                      {config.emoji} {course.level}
                    </span>
                    {course.has_certificate ? (
                      <Link to={`/certificate/${course.course_id}`} className="cert-badge">
                        🏆 Certified
                      </Link>
                    ) : course.progress_percentage >= 100 ? (
                      <span className="level-badge a1">🎉 Completed</span>
                    ) : null}
                  </div>

                  <h3 className="progress-card-title">
                    <Link to={`/course/${course.course_id}`}>
                      {course.course_title}
                    </Link>
                  </h3>

                  <div className="progress-bar-container">
                    <div className="progress-bar-track">
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${course.progress_percentage}%`,
                          background: config.color,
                        }}
                      ></div>
                    </div>
                    <div className="progress-bar-label">
                      <span>{course.completed_lessons}/{course.total_lessons} lessons</span>
                      <span style={{ color: config.color, fontWeight: 700 }}>
                        {course.progress_percentage}%
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '8px' }}>
                    <Link to={`/course/${course.course_id}`} className="btn btn-secondary btn-sm" style={{ flex: 1, textAlign: 'center' }}>
                      View Course
                    </Link>
                    {course.progress_percentage >= 100 && !course.has_certificate && (
                      <Link
                        to={`/certificate/${course.course_id}`}
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1.2, textAlign: 'center' }}
                      >
                        Claim Cert
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Available Courses ──────────────────────── */}
      {unenrolledCourses.length > 0 && (
        <section className="dashboard-section">
          <h2 className="section-title">
            {enrolledIds.length > 0 ? 'More Courses' : 'Available Courses'}
          </h2>
          <p className="section-subtitle">Enroll to start tracking your progress</p>

          <div className="enroll-grid">
            {unenrolledCourses.map((course) => {
              const config = LEVEL_CONFIG[course.level] || LEVEL_CONFIG.A1
              return (
                <div key={course.id} className="enroll-card">
                  <div className={`enroll-card-banner ${config.gradient}`}>
                    <span>{config.emoji}</span>
                  </div>
                  <div className="enroll-card-body">
                    <span className={`level-badge ${config.gradient}`}>{course.level}</span>
                    <h3>{course.title}</h3>
                    <p>{course.description}</p>
                    <button
                      className="btn btn-primary"
                      onClick={() => handleEnroll(course.id)}
                      disabled={enrolling === course.id}
                    >
                      {enrolling === course.id ? 'Enrolling...' : 'Enroll Now'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Empty State ────────────────────────────── */}
      {enrolledIds.length === 0 && unenrolledCourses.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <h3>No Courses Available</h3>
          <p>Check back soon for new French courses!</p>
        </div>
      )}
    </div>
  )
}
