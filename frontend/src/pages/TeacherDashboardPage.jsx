import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

import API_URL from '../config'

export default function TeacherDashboardPage({ user, token }) {
  const [activeTab, setActiveTab] = useState('analytics')
  const [stats, setStats] = useState(null)
  const [students, setStudents] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Accordion state
  const [expandedCourse, setExpandedCourse] = useState(null)
  const [expandedModule, setExpandedModule] = useState(null)

  // Dictionary management states
  const [dictWords, setDictWords] = useState([])
  const [dictSearch, setDictSearch] = useState('')
  const [dictCategory, setDictCategory] = useState('all')
  const [dictForm, setDictForm] = useState({ word: '', part_of_speech: 'noun', translation: '', definition: '', example_sentence_fr: '', example_sentence_en: '', audio_url: '' })
  const [editingWordId, setEditingWordId] = useState(null)

  // Modals state
  const [activeModal, setActiveModal] = useState(null) // 'lesson', 'vocab', 'quiz', 'dictionary'
  const [modalTargetId, setModalTargetId] = useState(null) // moduleId or lessonId
  const [submitting, setSubmitting] = useState(false)
  const [modalError, setModalError] = useState(null)

  // Form states
  const [lessonForm, setLessonForm] = useState({ title: '', description: '', duration_minutes: 15, video_url: '' })
  const [vocabForm, setVocabForm] = useState({ french_word: '', english_meaning: '', example_sentence: '', audio_url: '' })
  const [quizForm, setQuizForm] = useState({ question: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'a' })
  const [courseForm, setCourseForm] = useState({ title: '', level: 'A1', track: 'senior', description: '', image_url: '' })
  const [moduleForm, setModuleForm] = useState({ title: '' })

  useEffect(() => {
    loadData()
  }, [token])

  useEffect(() => {
    if (activeTab === 'dictionary') {
      loadDictionary()
    }
  }, [activeTab, dictSearch, dictCategory])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [dashRes, coursesRes] = await Promise.all([
        fetch(`${API_URL}/api/teacher/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/courses/`)
      ])

      if (!dashRes.ok) {
        if (dashRes.status === 403) throw new Error('Access denied. Teacher privileges required.')
        throw new Error('Failed to fetch dashboard statistics.')
      }
      
      const dashData = await dashRes.json()
      setStats(dashData.statistics)
      setStudents(dashData.students)

      if (coursesRes.ok) {
        const coursesData = await coursesRes.json()
        const fullCourses = await Promise.all(
          coursesData.map(async (c) => {
            const detailRes = await fetch(`${API_URL}/api/courses/${c.id}`)
            return detailRes.ok ? detailRes.json() : c
          })
        )
        setCourses(fullCourses)
        if (fullCourses.length > 0) {
          setExpandedCourse(fullCourses[0].id)
        }
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadDictionary = async () => {
    try {
      const qParams = new URLSearchParams()
      if (dictSearch) qParams.append('q', dictSearch)
      if (dictCategory && dictCategory !== 'all') {
        qParams.append('category', dictCategory)
      }
      const res = await fetch(`${API_URL}/api/dictionary/?${qParams.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setDictWords(data)
      }
    } catch (err) {
      console.error('Failed to load dictionary', err)
    }
  }

  // Reload only curriculum courses (to avoid full loading state flashing)
  const reloadCurriculum = async () => {
    try {
      const res = await fetch(`${API_URL}/api/courses/`)
      if (res.ok) {
        const coursesData = await res.json()
        const fullCourses = await Promise.all(
          coursesData.map(async (c) => {
            const detailRes = await fetch(`${API_URL}/api/courses/${c.id}`)
            return detailRes.ok ? detailRes.json() : c
          })
        )
        setCourses(fullCourses)
      }
    } catch (err) {
      console.error('Failed to reload curriculum', err)
    }
  }

  // Submit handlers
  const handleLessonSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setModalError(null)
    try {
      const res = await fetch(`${API_URL}/api/teacher/lessons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          module_id: modalTargetId,
          ...lessonForm,
          duration_minutes: parseInt(lessonForm.duration_minutes) || 15
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed to create lesson.')
      
      await reloadCurriculum()
      closeModal()
    } catch (err) {
      setModalError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleVocabSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setModalError(null)
    try {
      const res = await fetch(`${API_URL}/api/teacher/vocabulary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          lesson_id: modalTargetId,
          ...vocabForm
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed to add vocabulary.')

      await reloadCurriculum()
      closeModal()
    } catch (err) {
      setModalError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleQuizSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setModalError(null)
    try {
      const res = await fetch(`${API_URL}/api/teacher/quizzes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          lesson_id: modalTargetId,
          ...quizForm
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed to add quiz question.')

      await reloadCurriculum()
      closeModal()
    } catch (err) {
      setModalError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDictSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setModalError(null)
    const isEdit = editingWordId !== null
    const url = isEdit ? `${API_URL}/api/dictionary/${editingWordId}` : `${API_URL}/api/dictionary/`
    const method = isEdit ? 'PUT' : 'POST'
    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(dictForm)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed to save dictionary word.')
      
      await loadDictionary()
      closeModal()
    } catch (err) {
      setModalError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCourseSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setModalError(null)
    try {
      const res = await fetch(`${API_URL}/api/teacher/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(courseForm)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed to create course.')

      await reloadCurriculum()
      if (data.id) {
        setExpandedCourse(data.id)
      }
      closeModal()
    } catch (err) {
      setModalError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleModuleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setModalError(null)
    try {
      const res = await fetch(`${API_URL}/api/teacher/modules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          course_id: modalTargetId,
          ...moduleForm
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed to create module.')

      await reloadCurriculum()
      if (data.id) {
        setExpandedModule(data.id)
      }
      closeModal()
    } catch (err) {
      setModalError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDictDelete = async (wordId) => {
    if (!confirm('Are you sure you want to delete this word from the dictionary?')) return
    try {
      const res = await fetch(`${API_URL}/api/dictionary/${wordId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        await loadDictionary()
      } else {
        const data = await res.json()
        alert(data.detail || 'Failed to delete word')
      }
    } catch (err) {
      console.error('Delete error', err)
    }
  }

  const closeModal = () => {
    setActiveModal(null)
    setModalTargetId(null)
    setModalError(null)
    setEditingWordId(null)
    setLessonForm({ title: '', description: '', duration_minutes: 15, video_url: '' })
    setVocabForm({ french_word: '', english_meaning: '', example_sentence: '', audio_url: '' })
    setQuizForm({ question: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'a' })
    setDictForm({ word: '', part_of_speech: 'noun', translation: '', definition: '', example_sentence_fr: '', example_sentence_en: '', audio_url: '' })
    setCourseForm({ title: '', level: 'A1', track: 'senior', description: '', image_url: '' })
    setModuleForm({ title: '' })
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <span className="loading-text">Loading teacher portal...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container" style={{ paddingTop: '40px' }}>
        <div className="error-message">
          <p>⚠️ {error}</p>
          <Link to="/" className="btn btn-secondary" style={{ marginTop: '16px' }}>
            ← Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-page fade-in-up">
      {/* ── Header ─────────────────────────── */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Bonjour, {user?.name || 'Teacher'}! 🎓</h1>
          <p className="dashboard-subtitle">Instructor Console & Roster Management</p>
        </div>
      </div>

      {/* ── Tab Navigation ─────────────────── */}
      <div className="tab-nav" style={{ marginBottom: '32px' }}>
        <button
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          📊 Student Analytics
        </button>
        <button
          className={`tab-btn ${activeTab === 'curriculum' ? 'active' : ''}`}
          onClick={() => setActiveTab('curriculum')}
        >
          📚 Course Content Builder
        </button>
        <button
          className={`tab-btn ${activeTab === 'dictionary' ? 'active' : ''}`}
          onClick={() => setActiveTab('dictionary')}
        >
          📖 Dictionary Manager
        </button>
      </div>

      {/* ── Tab Content: Analytics ─────────── */}
      {activeTab === 'analytics' && (
        <div className="fade-in-up">
          {/* Key Statistics Grid */}
          <div className="hero-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '0', marginBottom: '40px' }}>
            <div className="card" style={{ textAlign: 'center' }}>
              <div className="number" style={{ fontSize: '2.5rem' }}>{stats?.total_students || 0}</div>
              <div className="label">Total Students</div>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div className="number" style={{ fontSize: '2.5rem' }}>{stats?.total_enrollments || 0}</div>
              <div className="label">Course Enrollments</div>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div className="number" style={{ fontSize: '2.5rem' }}>{stats?.total_certificates || 0}</div>
              <div className="label">Certificates Issued</div>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div className="number" style={{ fontSize: '2.5rem', color: 'var(--color-accent-light)' }}>{stats?.average_quiz_score || 0}%</div>
              <div className="label">Average Quiz Score</div>
            </div>
          </div>

          {/* Students Roster Section */}
          <section className="dashboard-section">
            <h2 className="section-title">Enrolled Students</h2>
            <p className="section-subtitle">Real-time completion percentage and certification status</p>
            
            {students.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <h3>No Registered Students</h3>
                <p>Students will appear here once they register and enroll in courses.</p>
              </div>
            ) : (
              <div className="card" style={{ padding: '0', overflowX: 'auto', border: '1px solid var(--border-color)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
                      <th style={{ padding: '16px 20px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>STUDENT NAME</th>
                      <th style={{ padding: '16px 20px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>EMAIL ADDRESS</th>
                      <th style={{ padding: '16px 20px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>ENROLLED COURSE</th>
                      <th style={{ padding: '16px 20px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>PROGRESS</th>
                      <th style={{ padding: '16px 20px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>CERTIFICATE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => {
                      if (student.courses.length === 0) {
                        return (
                          <tr key={student.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <td style={{ padding: '16px 20px', fontWeight: 600 }}>{student.name}</td>
                            <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>{student.email}</td>
                            <td style={{ padding: '16px 20px', color: 'var(--text-muted)', fontStyle: 'italic' }} colSpan="3">
                              Not enrolled in any courses yet.
                            </td>
                          </tr>
                        )
                      }
                      
                      return student.courses.map((course, cIdx) => (
                        <tr key={`${student.id}-${course.course_id}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          {cIdx === 0 && (
                            <>
                              <td style={{ padding: '16px 20px', fontWeight: 600 }} rowSpan={student.courses.length}>
                                {student.name}
                              </td>
                              <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }} rowSpan={student.courses.length}>
                                {student.email}
                              </td>
                            </>
                          )}
                          <td style={{ padding: '16px 20px' }}>
                            <span className={`level-badge ${course.level.toLowerCase()}`} style={{ marginRight: '8px', fontSize: '0.7rem', padding: '2px 8px' }}>
                              {course.level}
                            </span>
                            {course.course_title}
                          </td>
                          <td style={{ padding: '16px 20px', width: '250px' }}>
                            <div className="progress-bar-container" style={{ gap: '4px' }}>
                              <div className="progress-bar-track" style={{ height: '6px' }}>
                                <div className="progress-bar-fill" style={{ width: `${course.progress_percentage}%`, background: 'var(--color-primary-light)' }}></div>
                              </div>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                {course.progress_percentage}% ({course.completed_lessons}/{course.total_lessons} lessons)
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '16px 20px' }}>
                            {course.has_certificate ? (
                              <span className="cert-badge" style={{ display: 'inline-flex' }}>🏆 Certified</span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>In Progress</span>
                            )}
                          </td>
                        </tr>
                      ))
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {/* ── Tab Content: Curriculum ────────── */}
      {activeTab === 'curriculum' && (
        <div className="fade-in-up">
          <section className="dashboard-section">
            <h2 className="section-title">Course Curriculum Manager</h2>
            <p className="section-subtitle">Select a course to view modules and append lectures, vocabulary, or quizzes.</p>

            {/* Course Selector Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
              {courses.map((course) => (
                <button
                  key={course.id}
                  onClick={() => { setExpandedCourse(course.id); setExpandedModule(null); }}
                  className={`btn ${expandedCourse === course.id ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ display: 'flex', gap: '8px' }}
                >
                  <span>{course.level === 'A1' ? '🌱' : course.level === 'A2' ? '📖' : '🚀'}</span>
                  <span>{course.title}</span>
                </button>
              ))}
              <button
                onClick={() => {
                  setActiveModal('course');
                }}
                className="btn btn-secondary"
                style={{ marginLeft: 'auto', border: '1px dashed var(--color-primary-light)', color: 'var(--color-primary-light)' }}
              >
                ➕ Create Course
              </button>
            </div>

            {/* Selected Course Modules */}
            {courses.filter(c => c.id === expandedCourse).map((course) => (
              <div key={course.id} className="module-list">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Modules for {course.title}
                  </h3>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setModalTargetId(course.id)
                      setActiveModal('module')
                    }}
                  >
                    ➕ Add Module
                  </button>
                </div>
                {course.modules && course.modules.length === 0 ? (
                  <div className="empty-state">
                    <h3>No Modules</h3>
                    <p>There are no modules inside this course yet.</p>
                  </div>
                ) : (
                  course.modules.map((module) => {
                    const isExpanded = expandedModule === module.id
                    return (
                      <div key={module.id} className="module-card">
                        <div className="module-header" style={{ cursor: 'pointer' }} onClick={() => setExpandedModule(isExpanded ? null : module.id)}>
                          <div className="module-header-left">
                            <span className="module-number">{String(module.order).padStart(2, '0')}</span>
                            <div>
                              <h3 className="module-title">{module.title}</h3>
                              <span className="module-meta">{module.lesson_count} lessons</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                setModalTargetId(module.id)
                                setActiveModal('lesson')
                              }}
                            >
                              ➕ Add Lesson
                            </button>
                            <span className={`module-chevron ${isExpanded ? 'expanded' : ''}`}>▸</span>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="lesson-list" style={{ background: 'rgba(0,0,0,0.1)' }}>
                            {module.lessons.length === 0 ? (
                              <div style={{ padding: '20px 72px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                No lessons added to this module yet. Click "Add Lesson" above to get started.
                              </div>
                            ) : (
                              module.lessons.map((lesson) => (
                                <div key={lesson.id} className="lesson-item" style={{ animationDelay: '0ms', cursor: 'default', opacity: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div className="lesson-item-left">
                                    <span className="lesson-icon">▶</span>
                                    <div>
                                      <Link to={`/lesson/${lesson.id}`} className="lesson-title" style={{ fontWeight: 600 }}>
                                        {lesson.title}
                                      </Link>
                                      {lesson.duration_minutes && (
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                          ⏱️ {lesson.duration_minutes} minutes
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                      className="btn btn-secondary btn-sm"
                                      onClick={() => {
                                        setModalTargetId(lesson.id)
                                        setActiveModal('vocab')
                                      }}
                                    >
                                      📝 Add Vocab
                                    </button>
                                    <button
                                      className="btn btn-secondary btn-sm"
                                      onClick={() => {
                                        setModalTargetId(lesson.id)
                                        setActiveModal('quiz')
                                      }}
                                    >
                                      ❓ Add Quiz Q
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            ))}
          </section>
        </div>
      )}

      {/* ── Tab Content: Dictionary ────────── */}
      {activeTab === 'dictionary' && (
        <div className="fade-in-up">
          <section className="dashboard-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 className="section-title">Dictionary Word Manager</h2>
                <p className="section-subtitle">Add, edit, or delete words in the public translation dictionary.</p>
              </div>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setEditingWordId(null);
                  setActiveModal('dictionary');
                }}
              >
                ➕ Add Word
              </button>
            </div>

            {/* Search / Filter Controls */}
            <div className="card" style={{ marginBottom: '24px', padding: '20px', background: 'var(--bg-secondary)' }}>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  className="dictionary-search-input"
                  placeholder="🔍 Search dictionary..."
                  value={dictSearch}
                  onChange={(e) => setDictSearch(e.target.value)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    flex: 1,
                    minWidth: '200px'
                  }}
                />
                <select
                  value={dictCategory}
                  onChange={(e) => setDictCategory(e.target.value)}
                  className="dictionary-select-filter"
                  style={{
                    padding: '10px 16px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    minWidth: '150px'
                  }}
                >
                  <option value="all">All Categories</option>
                  <option value="noun">Nouns</option>
                  <option value="verb">Verbs</option>
                  <option value="adjective">Adjectives</option>
                  <option value="adverb">Adverbs</option>
                  <option value="expression">Expressions</option>
                  <option value="greeting">Greetings</option>
                </select>
              </div>
            </div>

            {/* Words List */}
            {dictWords.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📖</div>
                <h3>No Words Found</h3>
                <p>No terms match your search filters or the dictionary is empty.</p>
              </div>
            ) : (
              <div className="card" style={{ padding: '0', overflowX: 'auto', border: '1px solid var(--border-color)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
                      <th style={{ padding: '16px 20px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>WORD</th>
                      <th style={{ padding: '16px 20px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>CATEGORY</th>
                      <th style={{ padding: '16px 20px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>ENGLISH TRANSLATION</th>
                      <th style={{ padding: '16px 20px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dictWords.map((word) => (
                      <tr key={word.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '16px 20px', fontWeight: 600 }}>{word.word}</td>
                        <td style={{ padding: '16px 20px' }}>
                          <span className="level-badge" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                            {word.part_of_speech || 'word'}
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px', color: 'var(--color-accent-light)' }}>{word.translation}</td>
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => {
                                setEditingWordId(word.id);
                                setDictForm({
                                  word: word.word,
                                  part_of_speech: word.part_of_speech || 'noun',
                                  translation: word.translation,
                                  definition: word.definition || '',
                                  example_sentence_fr: word.example_sentence_fr || '',
                                  example_sentence_en: word.example_sentence_en || '',
                                  audio_url: word.audio_url || ''
                                });
                                setActiveModal('dictionary');
                              }}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ color: 'var(--color-error)' }}
                              onClick={() => handleDictDelete(word.id)}
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {/* ── MODAL COMPONENT ─────────────────── */}
      {activeModal && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="auth-card fade-in-up" style={{
            maxWidth: '550px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            {/* Modal Header */}
            <div className="auth-header" style={{ marginBottom: '24px' }}>
              <span className="auth-icon" style={{ marginBottom: '8px' }}>
                {activeModal === 'course' ? '🌱' : activeModal === 'module' ? '📚' : activeModal === 'lesson' ? '📖' : activeModal === 'vocab' ? '📝' : activeModal === 'dictionary' ? '📖' : '❓'}
              </span>
              <h1>
                {activeModal === 'course' ? 'Create New Course' : activeModal === 'module' ? 'Add Course Module' : activeModal === 'lesson' ? 'Create Lesson' : activeModal === 'vocab' ? 'Add Vocabulary Card' : activeModal === 'dictionary' ? (editingWordId ? 'Edit Word' : 'Add Word') : 'Add Quiz Question'}
              </h1>
              <p>Add new course materials to the platform</p>
            </div>

            {/* Modal Error */}
            {modalError && <div className="auth-error" style={{ marginBottom: '16px' }}>{modalError}</div>}

            {/* ── Form: Create Course ── */}
            {activeModal === 'course' && (
              <form onSubmit={handleCourseSubmit} className="auth-form">
                <div className="form-group">
                  <label htmlFor="course-title">Course Title *</label>
                  <input
                    id="course-title"
                    type="text"
                    required
                    value={courseForm.title}
                    onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                    placeholder="e.g. French B2 - Upper Intermediate"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="course-level">Difficulty Level *</label>
                  <select
                    id="course-level"
                    value={courseForm.level}
                    onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value })}
                    style={{
                      padding: '12px 16px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-family)',
                      fontSize: '0.95rem'
                    }}
                  >
                    <option value="A1">🌱 A1 (Beginner)</option>
                    <option value="A2">📖 A2 (Elementary)</option>
                    <option value="B1">🚀 B1 (Intermediate)</option>
                    <option value="B2">🚀 B2 (Upper Intermediate)</option>
                    <option value="C1">🚀 C1 (Advanced)</option>
                    <option value="C2">🚀 C2 (Mastery)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="course-track">Student Track *</label>
                  <select
                    id="course-track"
                    value={courseForm.track}
                    onChange={(e) => setCourseForm({ ...courseForm, track: e.target.value })}
                    style={{
                      padding: '12px 16px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-family)',
                      fontSize: '0.95rem'
                    }}
                  >
                    <option value="junior">👶 Junior Track</option>
                    <option value="senior">🎓 Senior Track</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="course-desc">Description</label>
                  <textarea
                    id="course-desc"
                    value={courseForm.description}
                    onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                    placeholder="Provide a brief summary of the course..."
                    style={{
                      padding: '12px 16px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-family)',
                      fontSize: '0.95rem',
                      minHeight: '100px',
                      resize: 'vertical'
                    }}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="course-image">Cover Image URL</label>
                  <input
                    id="course-image"
                    type="url"
                    value={courseForm.image_url}
                    onChange={(e) => setCourseForm({ ...courseForm, image_url: e.target.value })}
                    placeholder="e.g. https://example.com/cover.jpg"
                  />
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                    {submitting ? 'Creating...' : 'Create Course'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={submitting}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* ── Form: Add Module ── */}
            {activeModal === 'module' && (
              <form onSubmit={handleModuleSubmit} className="auth-form">
                <div className="form-group">
                  <label htmlFor="module-title">Module Title *</label>
                  <input
                    id="module-title"
                    type="text"
                    required
                    value={moduleForm.title}
                    onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                    placeholder="e.g. Chapter 1: Basic Greetings"
                  />
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                    {submitting ? 'Creating...' : 'Add Module'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={submitting}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* ── Form: Add Lesson ── */}
            {activeModal === 'lesson' && (
              <form onSubmit={handleLessonSubmit} className="auth-form">
                <div className="form-group">
                  <label htmlFor="lesson-title">Lesson Title *</label>
                  <input
                    id="lesson-title"
                    type="text"
                    required
                    value={lessonForm.title}
                    onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                    placeholder="e.g. Present Tense Verbs"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="lesson-desc">Description</label>
                  <input
                    id="lesson-desc"
                    type="text"
                    value={lessonForm.description}
                    onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                    placeholder="e.g. Learn how to conjugate regular -ER verbs"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="lesson-duration">Duration (Minutes) *</label>
                  <input
                    id="lesson-duration"
                    type="number"
                    required
                    min={1}
                    value={lessonForm.duration_minutes}
                    onChange={(e) => setLessonForm({ ...lessonForm, duration_minutes: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="lesson-video">YouTube or Vimeo Video URL</label>
                  <input
                    id="lesson-video"
                    type="url"
                    value={lessonForm.video_url}
                    onChange={(e) => setLessonForm({ ...lessonForm, video_url: e.target.value })}
                    placeholder="e.g. https://www.youtube.com/watch?v=..."
                  />
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                    {submitting ? 'Creating...' : 'Create Lesson'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={submitting}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* ── Form: Add Vocab ── */}
            {activeModal === 'vocab' && (
              <form onSubmit={handleVocabSubmit} className="auth-form">
                <div className="form-group">
                  <label htmlFor="vocab-french">French Word/Phrase *</label>
                  <input
                    id="vocab-french"
                    type="text"
                    required
                    value={vocabForm.french_word}
                    onChange={(e) => setVocabForm({ ...vocabForm, french_word: e.target.value })}
                    placeholder="e.g. la pomme"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="vocab-english">English Meaning *</label>
                  <input
                    id="vocab-english"
                    type="text"
                    required
                    value={vocabForm.english_meaning}
                    onChange={(e) => setVocabForm({ ...vocabForm, english_meaning: e.target.value })}
                    placeholder="e.g. the apple"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="vocab-example">Example Sentence (French)</label>
                  <input
                    id="vocab-example"
                    type="text"
                    value={vocabForm.example_sentence}
                    onChange={(e) => setVocabForm({ ...vocabForm, example_sentence: e.target.value })}
                    placeholder="e.g. Je mange la pomme rouge."
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="vocab-audio">Pronunciation Audio URL (mp3)</label>
                  <input
                    id="vocab-audio"
                    type="url"
                    value={vocabForm.audio_url}
                    onChange={(e) => setVocabForm({ ...vocabForm, audio_url: e.target.value })}
                    placeholder="e.g. https://example.com/audio/pomme.mp3"
                  />
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                    {submitting ? 'Adding...' : 'Add Vocabulary'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={submitting}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* ── Form: Add/Edit Dictionary Word ── */}
            {activeModal === 'dictionary' && (
              <form onSubmit={handleDictSubmit} className="auth-form">
                <div className="form-group">
                  <label htmlFor="dict-word">French Word *</label>
                  <input
                    id="dict-word"
                    type="text"
                    required
                    value={dictForm.word}
                    onChange={(e) => setDictForm({ ...dictForm, word: e.target.value })}
                    placeholder="e.g. la voiture"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="dict-pos">Category (Part of Speech) *</label>
                  <select
                    id="dict-pos"
                    value={dictForm.part_of_speech}
                    onChange={(e) => setDictForm({ ...dictForm, part_of_speech: e.target.value })}
                    style={{
                      padding: '12px 16px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-family)',
                      fontSize: '0.95rem'
                    }}
                  >
                    <option value="noun">Noun</option>
                    <option value="verb">Verb</option>
                    <option value="adjective">Adjective</option>
                    <option value="adverb">Adverb</option>
                    <option value="expression">Expression</option>
                    <option value="greeting">Greeting</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="dict-trans">English Translation *</label>
                  <input
                    id="dict-trans"
                    type="text"
                    required
                    value={dictForm.translation}
                    onChange={(e) => setDictForm({ ...dictForm, translation: e.target.value })}
                    placeholder="e.g. the car"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="dict-def">Definition / Explanation</label>
                  <input
                    id="dict-def"
                    type="text"
                    value={dictForm.definition}
                    onChange={(e) => setDictForm({ ...dictForm, definition: e.target.value })}
                    placeholder="e.g. A road vehicle with four wheels..."
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="dict-ex-fr">Example Sentence (French)</label>
                  <input
                    id="dict-ex-fr"
                    type="text"
                    value={dictForm.example_sentence_fr}
                    onChange={(e) => setDictForm({ ...dictForm, example_sentence_fr: e.target.value })}
                    placeholder="e.g. La voiture rouge va vite."
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="dict-ex-en">Example Sentence (English)</label>
                  <input
                    id="dict-ex-en"
                    type="text"
                    value={dictForm.example_sentence_en}
                    onChange={(e) => setDictForm({ ...dictForm, example_sentence_en: e.target.value })}
                    placeholder="e.g. The red car goes fast."
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="dict-audio">Pronunciation Audio URL (mp3)</label>
                  <input
                    id="dict-audio"
                    type="url"
                    value={dictForm.audio_url}
                    onChange={(e) => setDictForm({ ...dictForm, audio_url: e.target.value })}
                    placeholder="e.g. https://example.com/audio/voiture.mp3"
                  />
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                    {submitting ? 'Saving...' : editingWordId !== null ? 'Update Word' : 'Add Word'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={submitting}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* ── Form: Add Quiz Question ── */}
            {activeModal === 'quiz' && (
              <form onSubmit={handleQuizSubmit} className="auth-form">
                <div className="form-group">
                  <label htmlFor="quiz-q">Question Text *</label>
                  <input
                    id="quiz-q"
                    type="text"
                    required
                    value={quizForm.question}
                    onChange={(e) => setQuizForm({ ...quizForm, question: e.target.value })}
                    placeholder="e.g. What does 'bonjour' mean?"
                  />
                </div>
                <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label htmlFor="quiz-oa">Option A *</label>
                    <input
                      id="quiz-oa"
                      type="text"
                      required
                      value={quizForm.option_a}
                      onChange={(e) => setQuizForm({ ...quizForm, option_a: e.target.value })}
                      placeholder="Option A"
                    />
                  </div>
                  <div>
                    <label htmlFor="quiz-ob">Option B *</label>
                    <input
                      id="quiz-ob"
                      type="text"
                      required
                      value={quizForm.option_b}
                      onChange={(e) => setQuizForm({ ...quizForm, option_b: e.target.value })}
                      placeholder="Option B"
                    />
                  </div>
                  <div>
                    <label htmlFor="quiz-oc">Option C *</label>
                    <input
                      id="quiz-oc"
                      type="text"
                      required
                      value={quizForm.option_c}
                      onChange={(e) => setQuizForm({ ...quizForm, option_c: e.target.value })}
                      placeholder="Option C"
                    />
                  </div>
                  <div>
                    <label htmlFor="quiz-od">Option D *</label>
                    <input
                      id="quiz-od"
                      type="text"
                      required
                      value={quizForm.option_d}
                      onChange={(e) => setQuizForm({ ...quizForm, option_d: e.target.value })}
                      placeholder="Option D"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="quiz-correct">Correct Option *</label>
                  <select
                    id="quiz-correct"
                    value={quizForm.correct_answer}
                    onChange={(e) => setQuizForm({ ...quizForm, correct_answer: e.target.value })}
                    style={{
                      padding: '12px 16px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-family)',
                      fontSize: '0.95rem'
                    }}
                  >
                    <option value="a">Option A</option>
                    <option value="b">Option B</option>
                    <option value="c">Option C</option>
                    <option value="d">Option D</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                    {submitting ? 'Adding...' : 'Add Quiz Question'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={submitting}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
