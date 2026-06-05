import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const API_URL = 'http://localhost:8000'

const POS_CONFIG = {
  noun: { emoji: '🏷️', label: 'Noun', color: '#10b981' },
  verb: { emoji: '🏃', label: 'Verb', color: '#6366f1' },
  adjective: { emoji: '✨', label: 'Adjective', color: '#f59e0b' },
  expression: { emoji: '💬', label: 'Expression', color: '#ec4899' },
  greeting: { emoji: '👋', label: 'Greeting', color: '#3b82f6' },
  adverb: { emoji: '🧭', label: 'Adverb', color: '#8b5cf6' },
}

export default function DictionaryPage() {
  const [words, setWords] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedWordId, setExpandedWordId] = useState(null)

  useEffect(() => {
    fetchWords()
  }, [searchQuery, selectedCategory])

  const fetchWords = async () => {
    setLoading(true)
    try {
      const qParams = new URLSearchParams()
      if (searchQuery) qParams.append('q', searchQuery)
      if (selectedCategory && selectedCategory !== 'all') {
        qParams.append('category', selectedCategory)
      }
      
      const res = await fetch(`${API_URL}/api/dictionary/?${qParams.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch dictionary entries.')
      const data = await res.json()
      setWords(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePronounce = (e, word) => {
    e.stopPropagation() // Don't collapse the card when clicking audio
    if (word.audio_url) {
      const audio = new Audio(word.audio_url)
      audio.play().catch((err) => {
        console.warn('Audio playback failed, falling back to TTS', err)
        speakTTS(word.word)
      })
    } else {
      speakTTS(word.word)
    }
  }

  const speakTTS = (text) => {
    if ('speechSynthesis' in window) {
      // Cancel any current speech
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'fr-FR'
      utterance.rate = 0.85 // Slightly slower for language learners
      
      // Try to find a native French voice if available
      const voices = window.speechSynthesis.getVoices()
      const frVoice = voices.find(voice => voice.lang.startsWith('fr'))
      if (frVoice) utterance.voice = frVoice
      
      window.speechSynthesis.speak(utterance)
    } else {
      console.warn('Text-to-speech not supported in this browser.')
    }
  }

  // Pre-fetch voices so TTS is ready
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices()
    }
  }, [])

  return (
    <div className="dictionary-page fade-in-up" style={{ padding: '40px 0' }}>
      {/* ── Title Banner ────────────────────────────────── */}
      <div className="dictionary-header" style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 className="dashboard-title" style={{ fontSize: '2.5rem' }}>
          Dictionnaire de Français 📖
        </h1>
        <p className="dashboard-subtitle" style={{ fontSize: '1.1rem', maxWidth: '600px', margin: '8px auto 0' }}>
          Look up vocabulary words, read grammatical rules, and listen to native pronunciations.
        </p>
      </div>

      {/* ── Search & Filter Controls ─────────────────────── */}
      <div className="card" style={{ marginBottom: '32px', padding: '24px', background: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Search Bar */}
          <div className="form-group" style={{ margin: '0' }}>
            <input
              type="text"
              className="form-control dictionary-search-input"
              placeholder="🔍 Search for a French word or English meaning... (e.g. chat, eat, bonjour)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '16px 20px',
                fontSize: '1.1rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* POS Category Filters */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginRight: '8px' }}>
              FILTER BY:
            </span>
            {['all', 'noun', 'verb', 'adjective', 'adverb', 'expression', 'greeting'].map((cat) => {
              const config = POS_CONFIG[cat]
              const isActive = selectedCategory === cat
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`btn ${isActive ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                  style={{ textTransform: 'capitalize' }}
                >
                  {config ? `${config.emoji} ${config.label}` : '🌐 All'}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Word Grid / List ─────────────────────────────── */}
      {loading && words.length === 0 ? (
        <div className="loading">
          <div className="spinner"></div>
          <span className="loading-text">Searching dictionary...</span>
        </div>
      ) : error ? (
        <div className="error-message">⚠️ {error}</div>
      ) : words.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>Aucun Résultat</h3>
          <p>No words found matching "{searchQuery}". Try searching for another term.</p>
        </div>
      ) : (
        <div className="dictionary-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '20px',
          marginBottom: '60px'
        }}>
          {words.map((word) => {
            const isExpanded = expandedWordId === word.id
            const config = POS_CONFIG[word.part_of_speech] || { emoji: '📝', label: 'Word', color: 'var(--color-primary-light)' }
            
            return (
              <div
                key={word.id}
                onClick={() => setExpandedWordId(isExpanded ? null : word.id)}
                className={`card dictionary-card ${isExpanded ? 'expanded' : ''}`}
                style={{
                  cursor: 'pointer',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  border: isExpanded ? `1px solid ${config.color}` : '1px solid var(--border-color)',
                  boxShadow: isExpanded ? `0 0 20px rgba(255,255,255,0.03)` : 'none',
                  transition: 'all var(--transition-base)'
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span className="level-badge" style={{
                    background: `rgba(${parseInt(config.color.slice(1,3), 16)}, ${parseInt(config.color.slice(3,5), 16)}, ${parseInt(config.color.slice(5,7), 16)}, 0.1)`,
                    color: config.color,
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '2px 10px',
                    borderRadius: '100px'
                  }}>
                    {config.emoji} {config.label}
                  </span>
                  
                  {/* Pronunciation button */}
                  <button
                    className="vocab-audio-btn"
                    onClick={(e) => handlePronounce(e, word)}
                    style={{ margin: 0, padding: '6px 12px', fontSize: '0.75rem' }}
                    title="Listen Pronunciation"
                  >
                    🔊 Pronounce
                  </button>
                </div>

                {/* French Word */}
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  {word.word}
                </h3>

                {/* English Translation */}
                <div style={{ fontSize: '1.05rem', fontWeight: 500, color: 'var(--color-accent-light)' }}>
                  {word.translation}
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="fade-in-up" style={{
                    marginTop: '8px',
                    paddingTop: '16px',
                    borderTop: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    fontSize: '0.9rem',
                    color: 'var(--text-secondary)'
                  }}>
                    {word.definition && (
                      <div>
                        <strong style={{ color: 'var(--text-primary)' }}>Definition:</strong>
                        <p style={{ marginTop: '4px', lineHeight: '1.5' }}>{word.definition}</p>
                      </div>
                    )}
                    
                    {(word.example_sentence_fr || word.example_sentence_en) && (
                      <div style={{
                        padding: '12px',
                        background: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-sm)',
                        borderLeft: `3px solid ${config.color}`
                      }}>
                        <strong style={{ color: 'var(--text-primary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Example:
                        </strong>
                        {word.example_sentence_fr && (
                          <p style={{ fontStyle: 'italic', color: 'var(--text-primary)', marginTop: '4px', fontWeight: 500 }}>
                            {word.example_sentence_fr}
                          </p>
                        )}
                        {word.example_sentence_en && (
                          <p style={{ color: 'var(--text-muted)', marginTop: '2px', fontSize: '0.85rem' }}>
                            {word.example_sentence_en}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
