import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'

import API_URL from '../config'

const LEVEL_CONFIG = {
  A1: { emoji: '🌱', label: 'Beginner', gradient: 'a1' },
  A2: { emoji: '📖', label: 'Elementary', gradient: 'a2' },
  B1: { emoji: '🚀', label: 'Intermediate', gradient: 'b1' },
}

export default function CoursePage() {
  const { courseId } = useParams()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedModule, setExpandedModule] = useState(null)

  useEffect(() => {
    fetch(`${API_URL}/api/courses/${courseId}`)
      .then(res => {
        if (!res.ok) throw new Error('Course not found')
        return res.json()
      })
      .then(data => {
        setCourse(data)
        setLoading(false)
        // Auto-expand first module
        if (data.modules && data.modules.length > 0) {
          setExpandedModule(data.modules[0].id)
        }
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [courseId])

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <span className="loading-text">Loading course...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container" style={{ paddingTop: '40px' }}>
        <div className="error-message">
          <p>⚠️ {error}</p>
          <Link to="/" className="btn btn-secondary" style={{ marginTop: '16px', display: 'inline-flex' }}>
            ← Back to Courses
          </Link>
        </div>
      </div>
    )
  }

  const config = LEVEL_CONFIG[course.level] || LEVEL_CONFIG.A1
  const totalDuration = course.modules.reduce((acc, mod) =>
    acc + mod.lessons.reduce((a, l) => a + (l.duration_minutes || 0), 0), 0
  )

  return (
    <div className="container">
      {/* ── Course Hero Banner ─────────────────────── */}
      <div className="course-hero fade-in-up">
        <div className={`course-hero-bg ${config.gradient}`}>
          <div className="course-hero-content">
            <Link to="/" className="back-link">← All Courses</Link>
            <span className={`level-badge ${config.gradient}`} style={{ marginTop: '8px' }}>
              {config.emoji} {course.level} — {config.label}
            </span>
            <h1>{course.title}</h1>
            <p>{course.description}</p>
            <div className="course-meta">
              <span className="meta-item">📦 {course.modules.length} Modules</span>
              <span className="meta-item">📖 {course.total_lessons} Lessons</span>
              <span className="meta-item">⏱️ {totalDuration} min</span>
              <span className="meta-item">
                {course.track === 'junior' ? '👶 Junior' : '🎓 Senior'} Track
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Module List ────────────────────────────── */}
      <div className="modules-section">
        <h2 className="section-title" style={{ marginTop: '40px' }}>Course Content</h2>
        <p className="section-subtitle">
          {course.total_lessons} lessons across {course.modules.length} modules
        </p>

        <div className="module-list">
          {course.modules.map((module, idx) => {
            const isExpanded = expandedModule === module.id
            const moduleDuration = module.lessons.reduce(
              (a, l) => a + (l.duration_minutes || 0), 0
            )

            return (
              <div key={module.id} className={`module-card fade-in-up`} style={{ animationDelay: `${idx * 80}ms` }}>
                <button
                  className="module-header"
                  onClick={() => setExpandedModule(isExpanded ? null : module.id)}
                  aria-expanded={isExpanded}
                >
                  <div className="module-header-left">
                    <span className="module-number">{String(module.order).padStart(2, '0')}</span>
                    <div>
                      <h3 className="module-title">{module.title}</h3>
                      <span className="module-meta">
                        {module.lesson_count} lessons · {moduleDuration} min
                      </span>
                    </div>
                  </div>
                  <span className={`module-chevron ${isExpanded ? 'expanded' : ''}`}>
                    ▸
                  </span>
                </button>

                {isExpanded && (
                  <div className="lesson-list">
                    {module.lessons.map((lesson, lIdx) => (
                      <Link
                        key={lesson.id}
                        to={`/lesson/${lesson.id}`}
                        className="lesson-item"
                        style={{ animationDelay: `${lIdx * 50}ms` }}
                      >
                        <div className="lesson-item-left">
                          <span className="lesson-icon">▶</span>
                          <span className="lesson-title">{lesson.title}</span>
                        </div>
                        <span className="lesson-duration">
                          {lesson.duration_minutes ? `${lesson.duration_minutes} min` : '—'}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
