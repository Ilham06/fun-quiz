'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'

const SOUND_URL = 'data:audio/wav;base64,UklGRlQFAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YTAFAACAgICAgICAgICAgICAgICAgICAgICBhY2YqbS+xMnL0M7NzcrHxL60pZWJgX15eHl+hpCdrbnEzNDTz8jBuK2hl4uDfnt8f4eSn6y4xM3T1dHLxLqwnJCGf3x8gIqWo7C7xc7U1dHKwrisnpKIgX1+goqVoq67xc7T1dHKwbisnpKIgX1+goqVoq67xc7T1dHKwbesnpKIgH1+goqVoq67xc7T1dDKwbisnpKIgH1+goqVoq67xc7T1dDJwbisnpKIgH1+goqV'

const THEMES = {
  dark: {
    statusDot: 'bg-emerald-400 animate-pulse',
    statusDotOff: 'bg-white/20',
    statusText: 'text-white/30',
    countText: 'text-white/20',
    soundBtn: 'text-white/20 hover:text-white/40',
    emptyBorder: 'border-white/10',
    emptyIcon: 'text-white/20',
    emptyText: 'text-white/20',
    cardNew: 'bg-amber-500/30 border border-amber-400/30',
    cardTop: 'bg-gradient-to-r from-rose-500/15 to-pink-500/10 border border-rose-400/20',
    card: 'bg-white/[0.04] border border-white/[0.04]',
    content: 'text-white',
    meta: 'text-white/30',
    likeActive: 'bg-rose-500/20 text-rose-400',
    likeIdle: 'bg-white/[0.04] text-white/30 hover:bg-rose-500/10 hover:text-rose-400',
  },
  light: {
    statusDot: 'bg-emerald-500 animate-pulse',
    statusDotOff: 'bg-gray-300',
    statusText: 'text-gray-400',
    countText: 'text-gray-400',
    soundBtn: 'text-gray-400 hover:text-gray-600',
    emptyBorder: 'border-gray-200',
    emptyIcon: 'text-gray-300',
    emptyText: 'text-gray-400',
    cardNew: 'bg-amber-50 border border-amber-200 animate-slide-in-right',
    cardTop: 'bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200',
    card: 'bg-white border border-gray-100',
    content: 'text-gray-900',
    meta: 'text-gray-400',
    likeActive: 'bg-rose-50 text-rose-500',
    likeIdle: 'bg-gray-50 text-gray-400 hover:bg-rose-50 hover:text-rose-500',
  },
}

export default function LiveAnswers({ sessionId, questionId = null, initialAnswers = [], showLikes = false, compact = false, variant = 'dark' }) {
  const [answers, setAnswers] = useState(() =>
    [...initialAnswers].sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0))
  )
  const [connected, setConnected] = useState(false)
  const [newIds, setNewIds] = useState(new Set())
  const [likedIds, setLikedIds] = useState(new Set())
  const [soundEnabled, setSoundEnabled] = useState(true)
  const containerRef = useRef(null)
  const supabase = createBrowserClient()
  const audioRef = useRef(null)
  const t = THEMES[variant] || THEMES.dark

  useEffect(() => {
    audioRef.current = new Audio(SOUND_URL)
    audioRef.current.volume = 0.3
  }, [])

  const playSound = useCallback(() => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {})
    }
  }, [soundEnabled])

  useEffect(() => {
    const channel = supabase
      .channel(`answers:${sessionId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'answers',
        filter: `session_id=eq.${sessionId}`,
      }, (payload) => {
        const newAnswer = payload.new
        const matchesQuestion = questionId
          ? newAnswer.question_id === questionId
          : newAnswer.question_id === null
        if (!matchesQuestion) return
        setAnswers((prev) => {
          const updated = [newAnswer, ...prev]
          return updated.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0))
        })
        playSound()
        setNewIds((prev) => {
          const next = new Set(prev)
          next.add(newAnswer.id)
          setTimeout(() => {
            setNewIds((p) => { const n = new Set(p); n.delete(newAnswer.id); return n })
          }, 2500)
          return next
        })
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'answers',
        filter: `session_id=eq.${sessionId}`,
      }, (payload) => {
        const updated = payload.new
        setAnswers((prev) => {
          const next = prev.map((a) => a.id === updated.id ? { ...a, upvotes: updated.upvotes } : a)
          return next.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0))
        })
      })
      .subscribe((status) => setConnected(status === 'SUBSCRIBED'))

    return () => { supabase.removeChannel(channel) }
  }, [sessionId, questionId, supabase, playSound])

  async function handleLike(id) {
    if (likedIds.has(id)) return
    setLikedIds((prev) => new Set(prev).add(id))
    setAnswers((prev) => {
      const next = prev.map((a) => a.id === id ? { ...a, upvotes: (a.upvotes || 0) + 1 } : a)
      return next.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0))
    })
    await fetch(`/api/answers/${id}/upvote`, { method: 'POST' })
  }

  return (
    <div className="flex flex-col h-full">
      {!compact && (
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${connected ? t.statusDot : t.statusDotOff}`} />
            <span className={`text-xs font-medium ${t.statusText}`}>{connected ? 'Live' : 'Connecting...'}</span>
          </div>
          <span className={`text-xs ${t.countText}`}>{answers.length} jawaban</span>
          <button
            onClick={() => setSoundEnabled((v) => !v)}
            className={`ml-auto text-xs transition-colors ${t.soundBtn}`}
            title={soundEnabled ? 'Matikan suara' : 'Nyalakan suara'}
          >
            {soundEnabled ? '🔔' : '🔕'}
          </button>
        </div>
      )}

      {answers.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 py-8">
          <div className={`w-12 h-12 rounded-full border-2 border-dashed flex items-center justify-center ${t.emptyBorder}`}>
            <span className={`text-lg ${t.emptyIcon}`}>?</span>
          </div>
          <p className={`text-sm ${t.emptyText}`}>Menunggu jawaban...</p>
        </div>
      ) : (
        <div ref={containerRef} className={`flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin ${compact ? 'max-h-[40vh]' : ''}`}>
          {answers.map((a, idx) => {
            const likes = a.upvotes || 0
            const isTop = idx === 0 && likes > 0
            const liked = likedIds.has(a.id)
            return (
              <div
                key={a.id}
                className={`rounded-2xl px-4 py-3 transition-all duration-700 ${
                  newIds.has(a.id) ? t.cardNew : isTop ? t.cardTop : t.card
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium leading-snug ${compact ? 'text-sm' : 'text-base'} ${t.content}`}>{a.content}</p>
                    <p className={`text-xs mt-1 ${t.meta}`}>
                      {a.student_name || 'Anonim'}
                      {!compact && ` · ${new Date(a.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`}
                    </p>
                  </div>
                  {showLikes && (
                    <button
                      onClick={() => handleLike(a.id)}
                      disabled={liked}
                      className={`flex items-center gap-1 shrink-0 px-2 py-1 rounded-full text-xs font-semibold transition-all ${
                        liked ? t.likeActive : t.likeIdle
                      }`}
                    >
                      <span className={`transition-transform ${liked ? 'scale-125' : ''}`}>
                        {liked ? '❤️' : '🤍'}
                      </span>
                      {likes > 0 && <span>{likes}</span>}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
