import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const API_URL = 'http://localhost:8000'

const LEVEL_CONFIG = {
  A1: { emoji: '🌱', label: 'Beginner', gradient: 'a1' },
  A2: { emoji: '📖', label: 'Elementary', gradient: 'a2' },
  B1: { emoji: '🚀', label: 'Intermediate', gradient: 'b1' },
}

function CourseCard({ course }) {
  const config = LEVEL_CONFIG[course.level] || LEVEL_CONFIG.A1

  return (
    <Link to={`/course/${course.id}`} className="course-card fade-in-up">
      <div className={`course-card-header ${config.gradient}`}>
        <span className="level-icon">{config.emoji}</span>
        <span className={`level-badge ${config.gradient} level-label`}>
          {course.level}
        </span>
      </div>
      <div className="course-card-body">
        <h3>{course.title}</h3>
        <p>{course.description || 'Start learning French at this level.'}</p>
      </div>
      <div className="course-card-footer">
        <span>📚 {config.label}</span>
        <span>{course.track === 'junior' ? '👶 Junior' : '🎓 Senior'}</span>
      </div>
    </Link>
  )
}

function Hero({ courseCount }) {
  return (
    <section className="hero">
      <h1>Master French,{'\n'}One Lesson at a Time</h1>
      <p>
        A complete French learning platform with video lessons, vocabulary,
        quizzes, and certificates. From beginner to intermediate.
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <a href="#courses" className="btn btn-primary btn-lg">Get Started</a>
        <a href="#courses" className="btn btn-secondary btn-lg">Browse Courses</a>
      </div>
      <div className="hero-stats">
        <div className="hero-stat">
          <div className="number">{courseCount}</div>
          <div className="label">Courses</div>
        </div>
        <div className="hero-stat">
          <div className="number">50+</div>
          <div className="label">Lessons</div>
        </div>
        <div className="hero-stat">
          <div className="number">3</div>
          <div className="label">Levels</div>
        </div>
        <div className="hero-stat">
          <div className="number">∞</div>
          <div className="label">Practice</div>
        </div>
      </div>
    </section>
  )
}

export default function HomePage() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [apiStatus, setApiStatus] = useState(null)

  useEffect(() => {
    fetch(`${API_URL}/`)
      .then(res => res.json())
      .then(data => setApiStatus(data))
      .catch(() => setApiStatus(null))

    fetch(`${API_URL}/api/courses/`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch courses')
        return res.json()
      })
      .then(data => {
        setCourses(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  return (
    <>
      {/* Connection Status Badge */}
      {apiStatus && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: '16px',
        }}>
          <span className="status-badge connected">
            <span className="status-dot"></span>
            {apiStatus.message} — v{apiStatus.version}
          </span>
        </div>
      )}

      <Hero courseCount={courses.length} />

      <section id="courses">
        <h2 className="section-title">Available Courses</h2>
        <p className="section-subtitle">
          Choose your level and start learning French today
        </p>

        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <span className="loading-text">Loading courses...</span>
          </div>
        )}

        {error && (
          <div className="error-message">
            <p>⚠️ {error}</p>
            <p style={{ color: 'var(--text-muted)', marginTop: '8px', fontSize: '0.875rem' }}>
              Make sure the backend is running: <code>uvicorn app.main:app --reload</code>
            </p>
          </div>
        )}

        {!loading && !error && (
          <div className="course-grid">
            {courses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </section>
    </>
  )
}
