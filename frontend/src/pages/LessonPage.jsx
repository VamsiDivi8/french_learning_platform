import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'

const API_URL = 'http://localhost:8000'

export default function LessonPage({ token }) {
  const { lessonId } = useParams()
  const [lesson, setLesson] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('video')

  // Quiz state
  const [answers, setAnswers] = useState({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [quizResult, setQuizResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Lesson completion state
  const [completed, setCompleted] = useState(false)
  const [completing, setCompleting] = useState(false)

  useEffect(() => {
    fetch(`${API_URL}/api/lessons/${lessonId}`)
      .then(res => {
        if (!res.ok) throw new Error('Lesson not found')
        return res.json()
      })
      .then(data => {
        setLesson(data)
        setLoading(false)
        if (!data.video_url && data.vocabulary.length > 0) {
          setActiveTab('vocabulary')
        } else if (!data.video_url && data.quiz_questions.length > 0) {
          setActiveTab('quiz')
        }
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [lessonId])

  const handleAnswer = (questionId, answer) => {
    if (quizSubmitted) return
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
  }

  const handleSubmitQuiz = async () => {
    if (!token) {
      setQuizResult({ error: 'Please sign in to submit quizzes and track progress.' })
      setQuizSubmitted(true)
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`${API_URL}/api/progress/quizzes/${lessonId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ answers }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Quiz submission failed')

      setQuizResult(data)
      setQuizSubmitted(true)
      if (data.passed) setCompleted(true)
    } catch (err) {
      setQuizResult({ error: err.message })
      setQuizSubmitted(true)
    } finally {
      setSubmitting(false)
    }
  }

  const resetQuiz = () => {
    setAnswers({})
    setQuizSubmitted(false)
    setQuizResult(null)
  }

  const handleCompleteLesson = async () => {
    if (!token) return
    setCompleting(true)
    try {
      const res = await fetch(`${API_URL}/api/progress/lessons/${lessonId}/complete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) setCompleted(true)
    } catch (err) {
      console.error('Complete error:', err)
    } finally {
      setCompleting(false)
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <span className="loading-text">Loading lesson...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container" style={{ paddingTop: '40px' }}>
        <div className="error-message">
          <p>Warning: {error}</p>
          <Link to="/" className="btn btn-secondary" style={{ marginTop: '16px', display: 'inline-flex' }}>
            Back to Courses
          </Link>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'video', label: 'Lesson', show: true },
    { id: 'vocabulary', label: `Vocabulary (${lesson.vocabulary.length})`, show: lesson.vocabulary.length > 0 },
    { id: 'quiz', label: `Quiz (${lesson.quiz_questions.length})`, show: lesson.quiz_questions.length > 0 },
  ].filter(t => t.show)

  return (
    <div className="container">
      <div className="lesson-page fade-in-up">
        {/* ── Lesson Header ────────────────────────── */}
        <div className="lesson-header">
          <Link to="/" className="back-link">← Back to Courses</Link>
          <div className="lesson-header-row">
            <div>
              <h1 className="lesson-page-title">{lesson.title}</h1>
              {lesson.description && (
                <p className="lesson-page-desc">{lesson.description}</p>
              )}
              {lesson.duration_minutes && (
                <span className="lesson-page-duration">Duration: {lesson.duration_minutes} minutes</span>
              )}
            </div>
            {token && (
              <button
                className={`btn ${completed ? 'btn-completed' : 'btn-secondary'}`}
                onClick={handleCompleteLesson}
                disabled={completed || completing}
              >
                {completed ? '✓ Completed' : completing ? 'Saving...' : 'Mark Complete'}
              </button>
            )}
          </div>
        </div>

        {/* ── Tab Navigation ───────────────────────── */}
        <div className="tab-nav">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Video Tab ────────────────────────────── */}
        {activeTab === 'video' && (
          <div className="tab-content fade-in-up">
            {lesson.video_url ? (
              <div className="video-container">
                <iframe
                  src={convertToEmbedUrl(lesson.video_url)}
                  title={lesson.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🎬</div>
                <h3>Video Coming Soon</h3>
                <p>The teacher hasn't added a video for this lesson yet.</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '8px' }}>
                  Check out the vocabulary and quiz tabs in the meantime!
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Vocabulary Tab ───────────────────────── */}
        {activeTab === 'vocabulary' && (
          <div className="tab-content fade-in-up">
            <div className="vocab-grid">
              {lesson.vocabulary.map((item, idx) => (
                <div key={item.id} className="vocab-card" style={{ animationDelay: `${idx * 60}ms` }}>
                  <div className="vocab-french">{item.french_word}</div>
                  <div className="vocab-divider"></div>
                  <div className="vocab-english">{item.english_meaning}</div>
                  {item.example_sentence && (
                    <div className="vocab-example">{item.example_sentence}</div>
                  )}
                  {item.audio_url && (
                    <button
                      className="vocab-audio-btn"
                      onClick={() => new Audio(item.audio_url).play()}
                    >
                      🔊 Listen
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Quiz Tab ─────────────────────────────── */}
        {activeTab === 'quiz' && (
          <div className="tab-content fade-in-up">
            <div className="quiz-section">
              {/* Quiz Result Banner */}
              {quizSubmitted && quizResult && !quizResult.error && (
                <div className={`quiz-result-banner ${quizResult.passed ? 'passed' : 'failed'}`}>
                  <div>
                    <strong>{quizResult.passed ? '🎉 Passed!' : '😔 Not quite...'}</strong>
                    <span style={{ marginLeft: '8px' }}>
                      Score: {quizResult.correct_answers}/{quizResult.total_questions}
                      ({quizResult.score}%)
                    </span>
                    {quizResult.passed
                      ? ' — Great job! This lesson is now complete.'
                      : ' — You need 70% to pass. Try again!'}
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={resetQuiz}>
                    Retry Quiz
                  </button>
                </div>
              )}

              {quizSubmitted && quizResult?.error && (
                <div className="quiz-result-banner failed">
                  <span>{quizResult.error}</span>
                  <button className="btn btn-secondary btn-sm" onClick={resetQuiz}>
                    Try Again
                  </button>
                </div>
              )}

              {lesson.quiz_questions.map((q, idx) => (
                <div key={q.id} className="quiz-card" style={{ animationDelay: `${idx * 80}ms` }}>
                  <div className="quiz-question-header">
                    <span className="quiz-number">Q{idx + 1}</span>
                    <span className="quiz-question-text">{q.question}</span>
                  </div>
                  <div className="quiz-options">
                    {['a', 'b', 'c', 'd'].map(opt => {
                      const optionText = q[`option_${opt}`]
                      const isSelected = answers[q.id] === opt
                      return (
                        <button
                          key={opt}
                          className={`quiz-option ${isSelected ? 'selected' : ''} ${quizSubmitted ? 'disabled' : ''}`}
                          onClick={() => handleAnswer(q.id, opt)}
                          disabled={quizSubmitted}
                        >
                          <span className="option-letter">{opt.toUpperCase()}</span>
                          <span className="option-text">{optionText}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}

              {!quizSubmitted && (
                <div style={{ textAlign: 'center', marginTop: '24px' }}>
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={handleSubmitQuiz}
                    disabled={Object.keys(answers).length === 0 || submitting}
                  >
                    {submitting
                      ? 'Submitting...'
                      : `Submit Quiz (${Object.keys(answers).length}/${lesson.quiz_questions.length} answered)`}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function convertToEmbedUrl(url) {
  if (!url) return ''
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  )
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`
  return url
}
